#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TMP_DIR="$(mktemp -d)"

BASE_URL="${BASE_URL:-http://localhost:${PORT:-3000}/api/client}"
AUTO_START_SERVER="${AUTO_START_SERVER:-0}"
AUTH_EMAIL="${AUTH_EMAIL:-user1@tenant1.com}"
AUTH_PASSWORD="${AUTH_PASSWORD:-password}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TENANT_ID="${TENANT_ID:-}"
RUN_STRESS="${RUN_STRESS:-1}"
RUN_CREATION_ONLY="${RUN_CREATION_ONLY:-0}"
STRESS_COUNT="${STRESS_COUNT:-25}"
STRESS_CONCURRENCY="${STRESS_CONCURRENCY:-5}"

RUN_ID="$(date +%s)-$$"
SERVER_PID=""
LAST_STATUS=""
LAST_BODY=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  printf "%b\n" "${BLUE}[$(date +%H:%M:%S)]${NC} $*"
}

pass() {
  printf "%b\n" "${GREEN}[PASS]${NC} $*"
}

warn() {
  printf "%b\n" "${YELLOW}[WARN]${NC} $*"
}

fail() {
  printf "%b\n" "${RED}[FAIL]${NC} $*"
  exit 1
}

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

json_value() {
  local json="$1"
  local expr="$2"
  JSON_INPUT="$json" node -e '
const vm = require("vm");
const expr = process.argv[1];
const input = process.env.JSON_INPUT || "";
const obj = JSON.parse(input);
const result = vm.runInNewContext(expr, { obj });
if (typeof result === "undefined" || result === null) process.exit(2);
if (typeof result === "object") process.stdout.write(JSON.stringify(result));
else process.stdout.write(String(result));
' "$expr"
}

json_assert() {
  local json="$1"
  local expr="$2"
  local message="$3"
  JSON_INPUT="$json" node -e '
const vm = require("vm");
const expr = process.argv[1];
const message = process.argv[2];
const input = process.env.JSON_INPUT || "";
const obj = JSON.parse(input);
const ok = vm.runInNewContext(expr, { obj });
if (!ok) {
  console.error(message);
  process.exit(1);
}
' "$expr" "$message"
}

request() {
  local scope="$1"
  local method="$2"
  local path="$3"
  local expected_status="$4"
  local body="${5:-}"
  local response_file="$TMP_DIR/response-$(date +%s%N).json"
  local url="${BASE_URL}${path}"
  local -a curl_args=(-sS -X "$method" "$url" -H 'Accept: application/json')

  if [[ "$scope" == "auth" || "$scope" == "tenant" ]]; then
    curl_args+=(-H "Authorization: Bearer ${AUTH_TOKEN}")
  fi

  if [[ "$scope" == "tenant" ]]; then
    curl_args+=(-H "x-tenant-id: ${TENANT_ID}")
  fi

  if [[ -n "$body" ]]; then
    curl_args+=(-H 'Content-Type: application/json' -d "$body")
  fi

  local status
  status="$(curl "${curl_args[@]}" -o "$response_file" -w '%{http_code}')"
  LAST_STATUS="$status"
  LAST_BODY="$(cat "$response_file")"

  if [[ "$status" != "$expected_status" ]]; then
    printf '%s\n' "$LAST_BODY" > "$TMP_DIR/last-error.json"
    fail "${method} ${path} returned HTTP ${status}, expected ${expected_status}. Body saved in $TMP_DIR/last-error.json"
  fi
}

wait_for_server() {
  local attempts=40
  local status='000'
  for _ in $(seq 1 "$attempts"); do
    status="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}/auth/me" || true)"
    if [[ "$status" == '401' || "$status" == '200' ]]; then
      return 0
    fi
    sleep 1
  done
  fail "Server at ${BASE_URL} did not become ready"
}

start_server_if_needed() {
  local status
  status="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}/auth/me" || true)"

  if [[ "$status" == '401' || "$status" == '200' ]]; then
    pass "Server already responding at ${BASE_URL}"
    return 0
  fi

  if [[ "$AUTO_START_SERVER" != '1' ]]; then
    fail "Server is not responding at ${BASE_URL}. Start it first or run with AUTO_START_SERVER=1"
  fi

  log "Starting local API from ${PROJECT_DIR}"
  (
    cd "$PROJECT_DIR"
    pnpm start >"$TMP_DIR/server.log" 2>&1
  ) &
  SERVER_PID=$!
  wait_for_server
  pass "Local API started"
}

login_and_discover_tenant() {
  if [[ -z "$AUTH_TOKEN" ]]; then
    log "Logging in with ${AUTH_EMAIL}"
    request public POST /auth/login 201 "$(cat <<JSON
{"email":"${AUTH_EMAIL}","password":"${AUTH_PASSWORD}"}
JSON
)"
    AUTH_TOKEN="$(json_value "$LAST_BODY" 'obj.data.accessToken')"
    pass "Authenticated successfully"
  else
    pass "Using provided AUTH_TOKEN"
  fi

  if [[ -z "$TENANT_ID" ]]; then
    request auth GET /auth/me 200
    TENANT_ID="$(json_value "$LAST_BODY" 'obj.data.tenants[0].id')"
    pass "Using tenant ${TENANT_ID}"
  else
    pass "Using provided TENANT_ID ${TENANT_ID}"
  fi
}

section() {
  printf '\n%b\n' "${BLUE}=== $* ===${NC}"
}

stress_test() {
  if [[ "$RUN_STRESS" != '1' ]]; then
    warn 'Stress test skipped because RUN_STRESS=0'
    return 0
  fi

  section "Stress Test"
  log "Creating ${STRESS_COUNT} walk-in clients with concurrency ${STRESS_CONCURRENCY}"

  AUTH_TOKEN="$AUTH_TOKEN" TENANT_ID="$TENANT_ID" BASE_URL="$BASE_URL" RUN_ID="$RUN_ID" STRESS_COUNT="$STRESS_COUNT" STRESS_CONCURRENCY="$STRESS_CONCURRENCY" node <<'NODE'
const token = process.env.AUTH_TOKEN;
const tenantId = process.env.TENANT_ID;
const baseUrl = process.env.BASE_URL;
const runId = process.env.RUN_ID;
const total = Number(process.env.STRESS_COUNT || '25');
const concurrency = Number(process.env.STRESS_CONCURRENCY || '5');

const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${token}`,
  'x-tenant-id': tenantId,
  accept: 'application/json',
};

async function createOne(index) {
  const payload = {
    type: 'particulier',
    passager: true,
    lastName: `Stress-${runId}-${index}`,
    firstName: 'Load',
    phone: `06${String(index).padStart(8, '0')}`,
    city: 'Casablanca',
  };

  const response = await fetch(`${baseUrl}/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  return {
    ok: response.status === 201,
    status: response.status,
    id: body?.data?.id,
    body,
  };
}

async function run() {
  const started = Date.now();
  const queue = Array.from({ length: total }, (_, index) => index + 1);
  let success = 0;
  let failure = 0;

  async function worker() {
    while (queue.length > 0) {
      const index = queue.shift();
      if (!index) continue;
      const result = await createOne(index);
      if (result.ok) success += 1;
      else failure += 1;
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const durationMs = Date.now() - started;
  console.log(JSON.stringify({ success, failure, durationMs }));
  if (failure > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE

  pass "Stress phase completed"

  request tenant GET "/clients?type=particulier&search=Stress-${RUN_ID}&page=1&limit=$((STRESS_COUNT + 10))" 200
  json_assert "$LAST_BODY" "obj.data.length >= ${STRESS_COUNT}" "Stress-created clients were not found in list endpoint"
  pass "Stress-created clients are visible in filtered list"
}

section "Bootstrapping"
start_server_if_needed
login_and_discover_tenant

section "Particulier Flow"
# 1. Create minor with inline tutorPayload — server auto-creates a family group (N3 rule 3).
#    FAMILY_GROUP_ID and MINOR_TUTOR_ID are extracted from the response for all subsequent POSTs.
request tenant POST /clients 201 "$(cat <<JSON
{
  "type": "particulier",
  "title": "Mr",
  "lastName": "Minor-${RUN_ID}",
  "firstName": "Child",
  "birthDate": "2016-06-15",
  "isMinor": true,
  "familyLink": "children",
  "tutorPayload": {
    "type": "particulier",
    "title": "Mr",
    "lastName": "Tutor-${RUN_ID}",
    "firstName": "Parent",
    "birthDate": "1980-01-01",
    "phone": "064444${RUN_ID##*-}",
    "email": "tutor.${RUN_ID}@example.com",
    "city": "Rabat",
    "address": "Tutor Street"
  },
  "medicalRecord": {
    "qcm": {
      "currentlyWearing": "none",
      "hasDryness": false,
      "schoolScreenExposure": true
    }
  }
}
JSON
)"
MINOR_CLIENT_ID="$(json_value "$LAST_BODY" 'obj.data.id')"
MINOR_TUTOR_ID="$(json_value "$LAST_BODY" 'obj.data.tutorId')"
FAMILY_GROUP_ID="$(json_value "$LAST_BODY" 'obj.data.familyGroupId')"
json_assert "$LAST_BODY" "Boolean(obj.data.tutorId) && Boolean(obj.data.familyGroupId)" 'Minor creation with tutorPayload should auto-create a family group'
pass "Minor + inline tutor auto-created family group ${FAMILY_GROUP_ID}"

# 2. Create sibling — reuses the tutor's family group via useTutorFamily (single POST, no PATCH).
request tenant POST /clients 201 "$(cat <<JSON
{
  "type": "particulier",
  "title": "Autre",
  "lastName": "Sibling-${RUN_ID}",
  "firstName": "Kid",
  "birthDate": "2018-04-10",
  "isMinor": true,
  "tutorId": "${MINOR_TUTOR_ID}",
  "useTutorFamily": true,
  "familyLink": "children",
  "medicalRecord": {
    "qcm": {
      "currentlyWearing": "none",
      "hasDryness": false
    }
  }
}
JSON
)"
json_assert "$LAST_BODY" "obj.data.familyGroupId === '${FAMILY_GROUP_ID}'" 'Tutor family reuse did not assign the existing family group'
pass 'Tutor family reuse works'

# 3. Create sponsor — familyGroupId provided at creation time, no PATCH needed.
request tenant POST /clients 201 "$(cat <<JSON
{
  "type": "particulier",
  "title": "Mr",
  "lastName": "Sponsor-${RUN_ID}",
  "firstName": "Main",
  "birthDate": "1987-02-12",
  "phone": "061111${RUN_ID##*-}",
  "email": "sponsor.${RUN_ID}@example.com",
  "city": "Casablanca",
  "address": "1 Rue Sponsor",
  "familyGroupId": "${FAMILY_GROUP_ID}",
  "familyLink": "principal",
  "medicalRecord": {
    "qcm": {
      "currentlyWearing": "glasses",
      "hasDryness": true,
      "hasEyeTrauma": false,
      "screenTime": ">4h/day",
      "nightDrivingDifficulty": true,
      "headaches": false
    },
    "history": {
      "allergies": "none",
      "lastExamMonths": 10
    }
  }
}
JSON
)"
SPONSOR_ID="$(json_value "$LAST_BODY" 'obj.data.id')"
json_assert "$LAST_BODY" "obj.data.familyLink === 'principal' && obj.data.familyGroupId === '${FAMILY_GROUP_ID}'" 'Sponsor creation should set familyLink and familyGroupId'
pass "Created sponsor ${SPONSOR_ID} in family group ${FAMILY_GROUP_ID} (single POST)"

request tenant POST /clients 201 "$(cat <<JSON
{
  "type": "particulier",
  "title": "mrs",
  "lastName": "Benali-${RUN_ID}",
  "firstName": "Fatima",
  "birthDate": "1992-05-15",
  "phone": "062222${RUN_ID##*-}",
  "email": "fatima.${RUN_ID}@example.com",
  "city": "Casablanca",
  "address": "2 Rue Benali",
  "sponsorId": "${SPONSOR_ID}",
  "familyGroupId": "${FAMILY_GROUP_ID}",
  "familyLink": "conjoint",
  "isOpticalBeneficiary": true,
  "isFinancialResponsible": true,
  "hasSharedMutual": true,
  "hasSharedAddress": true,
  "hasSocialCoverage": true,
  "coverageType": "CNSS",
  "membershipNumber": "MBR-${RUN_ID}",
  "idDocumentType": "CIN",
  "idDocumentNumber": "QA-${RUN_ID}",
  "medicalRecord": {
    "qcm": {
      "currentlyWearing": "contact-lenses",
      "hasDryness": true,
      "hasRedEye": false,
      "screenTime": ">8h/day",
      "usesEyeDrops": true,
      "sleepQuality": "average"
    },
    "symptoms": ["dryness", "blurred-vision"],
    "notes": "QCM-style questionnaire payload"
  }
}
JSON
)"
PARTICULIER_ID="$(json_value "$LAST_BODY" 'obj.data.id')"
json_assert "$LAST_BODY" "obj.data.sponsorId === '${SPONSOR_ID}'" 'Sponsor link was not persisted'
json_assert "$LAST_BODY" "obj.data.medicalRecord.qcm.hasDryness === true" 'Medical record QCM data missing'
pass "Created particulier with sponsor and QCM medical record"

if [[ "$RUN_CREATION_ONLY" != '1' ]]; then
request tenant GET "/clients/${PARTICULIER_ID}" 200
json_assert "$LAST_BODY" "obj.data.familyGroupId === '${FAMILY_GROUP_ID}'" 'Particulier family group relation missing on read'
pass 'Fetched particulier profile'

request tenant PATCH "/clients/${PARTICULIER_ID}" 200 "$(cat <<JSON
{
  "phone": "063333${RUN_ID##*-}",
  "address": "7 Avenue Updated",
  "medicalRecord": {
    "qcm": {
      "currentlyWearing": "glasses",
      "hasDryness": false,
      "screenTime": "2-4h/day",
      "nightDrivingDifficulty": false
    },
    "followUp": {
      "recommendedLubricant": true,
      "nextCheckMonths": 6
    }
  }
}
JSON
)"
json_assert "$LAST_BODY" "obj.data.medicalRecord.followUp.nextCheckMonths === 6" 'Particulier medical record update did not replace payload'
pass 'Updated particulier medical record and base fields'

request tenant POST /clients 400 "$(cat <<JSON
{"type":"particulier","medicalRecord":"not-an-object"}
JSON
)"
pass 'Invalid medicalRecord payload is rejected'

request tenant POST /clients 404 "$(cat <<JSON
{
  "type": "particulier",
  "title": "Mr",
  "lastName": "BadSponsor-${RUN_ID}",
  "firstName": "Case",
  "birthDate": "1990-01-01",
  "sponsorId": "00000000-0000-4000-8000-000000000001"
}
JSON
)"
pass 'Invalid sponsor is rejected'

request tenant PATCH "/clients/${PARTICULIER_ID}" 400 "$(cat <<JSON
{"type":"professionnel"}
JSON
)"
pass 'Immutable client type is rejected on update'

fi

request tenant POST /clients 201 "$(cat <<JSON
{
  "type": "particulier",
  "passager": true,
  "lastName": "Passage-${RUN_ID}",
  "firstName": "Walkin",
  "phone": "065555${RUN_ID##*-}",
  "city": "Marrakech"
}
JSON
)"
PASSAGE_ID="$(json_value "$LAST_BODY" 'obj.data.id')"
json_assert "$LAST_BODY" "obj.data.passager === true" 'Passage client should persist passager=true'
pass 'Passage client flow works'

section "Professionnel Flow"
PRO_ICE="001${RUN_ID//-/}000012"
request tenant POST /clients 201 "$(cat <<JSON
{
  "type": "professionnel",
  "companyName": "OptikVision ${RUN_ID}",
  "taxId": "TAX-${RUN_ID}",
  "ice": "${PRO_ICE}",
  "commercialRegister": "RC-${RUN_ID}",
  "tradeLicense": "TL-${RUN_ID}",
  "vatExempt": false,
  "phone": "0522334455",
  "email": "contact.${RUN_ID}@optikvision.ma",
  "city": "Rabat",
  "address": "Business district",
  "convention": {
    "numero": "CONV-${RUN_ID}",
    "dateDebut": "2026-01-01",
    "dateFin": "2026-12-31",
    "tauxRemise": 10,
    "plafondCredit": 50000,
    "delaiPaiement": 30,
    "notes": "Nested create convention"
  },
  "contacts": [
    {
      "nom": "Alami",
      "prenom": "Sara",
      "fonction": "Responsable RH",
      "telephone": "0612345678",
      "email": "s.alami.${RUN_ID}@company.ma",
      "principal": true
    },
    {
      "nom": "Bennani",
      "prenom": "Omar",
      "fonction": "Finance",
      "telephone": "0612349999",
      "email": "o.bennani.${RUN_ID}@company.ma",
      "principal": false
    }
  ]
}
JSON
)"
PRO_CLIENT_ID="$(json_value "$LAST_BODY" 'obj.data.id')"
json_assert "$LAST_BODY" "obj.data.convention.numero === 'CONV-${RUN_ID}'" 'Nested convention was not returned on professionnel creation'
json_assert "$LAST_BODY" "obj.data.contactsInternes.length === 2" 'Nested contacts were not returned on professionnel creation'
pass "Created professionnel client ${PRO_CLIENT_ID} with nested convention and contacts"

if [[ "$RUN_CREATION_ONLY" != '1' ]]; then
request tenant GET "/clients/${PRO_CLIENT_ID}" 200
json_assert "$LAST_BODY" "obj.data.type === 'professionnel' && obj.data.contactsInternes.length >= 2" 'Professionnel read should include contacts'
pass 'Fetched professionnel profile'
fi

request tenant POST "/clients/${PRO_CLIENT_ID}/contacts" 201 "$(cat <<JSON
{
  "nom": "Principal",
  "prenom": "New",
  "fonction": "Director",
  "telephone": "0677777777",
  "email": "principal.${RUN_ID}@company.ma",
  "principal": true
}
JSON
)"
NEW_CONTACT_ID="$(json_value "$LAST_BODY" 'obj.data.id')"
json_assert "$LAST_BODY" "obj.data.principal === true" 'New contact should be created as principal'
pass 'Added principal contact'

if [[ "$RUN_CREATION_ONLY" != '1' ]]; then
request tenant GET "/clients/${PRO_CLIENT_ID}/contacts" 200
json_assert "$LAST_BODY" "obj.data.filter(contact => contact.principal).length === 1" 'Exactly one contact should remain principal'
pass 'Principal contact auto-demotion works'

request tenant PATCH "/clients/${PRO_CLIENT_ID}/contacts/${NEW_CONTACT_ID}" 200 "$(cat <<JSON
{
  "fonction": "Managing Director",
  "telephone": "0688888888"
}
JSON
)"
json_assert "$LAST_BODY" "obj.data.fonction === 'Managing Director'" 'Contact update did not persist'
pass 'Updated internal contact'

request tenant PUT "/clients/${PRO_CLIENT_ID}/convention" 200 "$(cat <<JSON
{
  "numero": "CONV-${RUN_ID}-UPD",
  "dateDebut": "2026-02-01",
  "dateFin": "2026-12-31",
  "tauxRemise": 15,
  "plafondCredit": 65000,
  "delaiPaiement": 45,
  "notes": "Upserted convention"
}
JSON
)"
json_assert "$LAST_BODY" "Number(obj.data.tauxRemise) === 15" 'Convention upsert did not update tauxRemise'
pass 'Convention upsert works'

request tenant POST "/clients/${PARTICULIER_ID}/contacts" 400 "$(cat <<JSON
{
  "nom": "Wrong",
  "prenom": "Target",
  "fonction": "N/A",
  "telephone": "0600000000",
  "email": "wrong.${RUN_ID}@example.com",
  "principal": false
}
JSON
)"
pass 'Contacts are rejected for particulier clients'

request tenant PUT "/clients/${PARTICULIER_ID}/convention" 400 "$(cat <<JSON
{
  "numero": "BAD-${RUN_ID}",
  "dateDebut": "2026-01-01",
  "dateFin": "2026-12-31",
  "tauxRemise": 5,
  "plafondCredit": 1000,
  "delaiPaiement": 10
}
JSON
)"
pass 'Convention is rejected for particulier clients'

request tenant PUT "/clients/${PRO_CLIENT_ID}/convention" 400 "$(cat <<JSON
{
  "numero": "BAD-DATE-${RUN_ID}",
  "dateDebut": "2026-12-31",
  "dateFin": "2026-01-01",
  "tauxRemise": 5,
  "plafondCredit": 1000,
  "delaiPaiement": 10
}
JSON
)"
pass 'Convention date validation works (dateFin must be after dateDebut)'

request tenant POST /clients 409 "$(cat <<JSON
{
  "type": "professionnel",
  "companyName": "Duplicate ICE ${RUN_ID}",
  "taxId": "DUP-${RUN_ID}",
  "ice": "${PRO_ICE}",
  "vatExempt": true
}
JSON
)"
pass 'Duplicate ICE is rejected'
fi

if [[ "$RUN_CREATION_ONLY" != '1' ]]; then
section "List and Activation"
request tenant GET "/clients?type=particulier&search=Benali-${RUN_ID}&page=1&limit=10" 200
json_assert "$LAST_BODY" "obj.data.some(client => client.id === '${PARTICULIER_ID}')" 'Filtered list did not return particulier client'
pass 'Client list filtering by type + search works'

request tenant GET "/clients?familyGroupId=${FAMILY_GROUP_ID}&page=1&limit=10" 200
json_assert "$LAST_BODY" "obj.data.some(client => client.id === '${SPONSOR_ID}') && obj.data.some(client => client.id === '${PARTICULIER_ID}')" 'Family-group client listing did not return expected members'
pass 'Client list filtering by familyGroupId works'

request tenant PATCH "/clients/${PRO_CLIENT_ID}/deactivate" 200
json_assert "$LAST_BODY" "obj.data.active === false" 'Deactivate endpoint did not set active=false'
pass 'Deactivate client works'

request tenant GET "/clients?type=professionnel&active=false&page=1&limit=10" 200
json_assert "$LAST_BODY" "obj.data.some(client => client.id === '${PRO_CLIENT_ID}')" 'Inactive client did not appear in active=false list'
pass 'Inactive listing works'

request tenant PATCH "/clients/${PRO_CLIENT_ID}/reactivate" 200
json_assert "$LAST_BODY" "obj.data.active === true" 'Reactivate endpoint did not set active=true'
pass 'Reactivate client works'
fi

if [[ "$RUN_CREATION_ONLY" != '1' ]]; then
section "Family Group Member Queries and Delete"
request tenant GET "/clients/family-groups?memberName=Benali-${RUN_ID}&page=1&limit=10" 200
json_assert "$LAST_BODY" "obj.data.some(group => group.id === '${FAMILY_GROUP_ID}')" 'Family group search by memberName failed'
pass 'Family group search by memberName works'

request tenant GET "/clients/family-groups?memberPhone=063333${RUN_ID##*-}&page=1&limit=10" 200
json_assert "$LAST_BODY" "obj.data.some(group => group.id === '${FAMILY_GROUP_ID}')" 'Family group search by memberPhone failed'
pass 'Family group search by memberPhone works'

request tenant DELETE "/clients/family-groups/${FAMILY_GROUP_ID}" 200
pass 'Family group delete works'

request tenant GET "/clients/${PARTICULIER_ID}" 200
json_assert "$LAST_BODY" "!obj.data.familyGroupId && !obj.data.familyLink" 'Family group delete should unlink client members'
pass 'Family group delete unlinks members'
fi

if [[ "$RUN_CREATION_ONLY" != '1' ]]; then
section "Spec Gap Probes"
request tenant POST /clients 201 "$(cat <<JSON
{
  "type": "particulier",
  "title": "Mr",
  "lastName": "Minor-NoTutor-${RUN_ID}",
  "firstName": "Probe",
  "birthDate": "2017-09-01",
  "isMinor": true
}
JSON
)"
warn 'Spec probe: minor without tutor was accepted. If tutor should be mandatory by business policy, implementation still allows it.'
fi

stress_test

section "Done"
pass 'Client-management end-to-end scenario completed successfully'
printf '%s\n' "Run id: ${RUN_ID}"
printf '%s\n' "Tenant: ${TENANT_ID}"
printf '%s\n' "Base URL: ${BASE_URL}"
