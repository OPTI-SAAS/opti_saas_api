# Quickstart: Client Management

## Prerequisites

- Node.js + pnpm installed
- PostgreSQL available with tenant setup
- Existing client auth flow working

## 1) Install and build

```bash
pnpm install
pnpm run build
```

## 2) Run migration

```bash
pnpm ts-node scripts/migrations/runMigrations.ts client
```

Migration expectation:

- creates `clients` table with discriminator CHECK constraint on `type`
- creates `conventions` table (one-to-one with clients, CASCADE delete)
- creates `contacts_internes` table (one-to-many with clients, CASCADE delete)
- adds unique index on `ice` column
- adds index on `(type, active)` and `family_group_id`

## 3) Start API

```bash
pnpm run start:dev
```

## 4) Create a particulier client

`POST /api/client/clients`

```json
{
  "type": "particulier",
  "title": "Mr",
  "lastName": "Benali",
  "firstName": "Youssef",
  "birthDate": "1990-05-15",
  "phone": "0612345678",
  "email": "youssef.benali@example.com",
  "city": "Casablanca",
  "address": "123 Rue Mohammed V",
  "medicalRecord": {
    "currentlyWearing": "glasses",
    "hasDryness": true
  }
}
```

Expected response:

```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid-here",
    "type": "particulier",
    "title": "Mr",
    "lastName": "Benali",
    "firstName": "Youssef",
    "birthDate": "1990-05-15",
    "active": true,
    "medicalRecord": { "currentlyWearing": "glasses", "hasDryness": true },
    "createdAt": "2026-03-04T10:00:00Z",
    "updatedAt": "2026-03-04T10:00:00Z"
  }
}
```

## 5) Create a professionnel client

`POST /api/client/clients`

```json
{
  "type": "professionnel",
  "companyName": "OptikVision SARL",
  "taxId": "12345678",
  "ice": "001234567000012",
  "vatExempt": false,
  "phone": "0522334455",
  "email": "contact@optikvision.ma",
  "city": "Rabat"
}
```

## 6) Add a convention to a professional client

`PUT /api/client/clients/:clientId/convention`

```json
{
  "numero": "CONV-2026-001",
  "dateDebut": "2026-01-01",
  "dateFin": "2026-12-31",
  "tauxRemise": 10.0,
  "plafondCredit": 50000,
  "delaiPaiement": 30
}
```

## 7) Add an internal contact

`POST /api/client/clients/:clientId/contacts`

```json
{
  "nom": "Alami",
  "prenom": "Sara",
  "fonction": "Responsable RH",
  "telephone": "0612345678",
  "email": "s.alami@company.ma",
  "principal": true
}
```

## 8) List clients with filters

`GET /api/client/clients?type=particulier&active=true&search=Benali&page=1&limit=10`

## 9) Validate business rules

- Duplicate `ice` value for professionnel returns 409.
- Missing required fields by type returns 400 with field-level errors.
- Setting `principal=true` on a new contact automatically unmarks the previous principal.
- `type` field cannot be changed via PATCH (returns 400).
- Deactivated clients are excluded from default list queries (when `active` not specified or `active=true`).
- Convention and contact endpoints reject requests for non-professionnel clients (returns 400).
