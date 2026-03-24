# Phase 1 Data Model: Client Management

## Entity: Client (persisted — single table, polymorphic)

- **Table**: `clients`
- **Purpose**: Core entity representing any person or organization doing business with the optical store. Uses a `type` discriminator column to distinguish between two client types: `particulier` and `professionnel`. Passage clients are modeled as `type='particulier'` with `passager=true`.
- **Extends**: `BaseEntity` (inherits `id: uuid`, `createdAt`, `updatedAt`, `deletedAt`)

### Shared Base Fields

| Column  | DB Name   | DB Type   | Nullable | Default | Notes                                             |
| ------- | --------- | --------- | -------- | ------- | ------------------------------------------------- |
| type    | `type`    | `varchar` | NO       | —       | Discriminator: `'particulier'`, `'professionnel'` |
| phone   | `phone`   | `varchar` | YES      | `null`  |                                                   |
| email   | `email`   | `varchar` | YES      | `null`  | Validated as email format                         |
| city    | `city`    | `varchar` | YES      | `null`  |                                                   |
| address | `address` | `varchar` | YES      | `null`  |                                                   |
| active  | `active`  | `boolean` | NO       | `true`  | Business-level deactivation flag                  |

### Particulier-Specific Fields

| Column                 | DB Name                    | DB Type   | Nullable | Default       | Notes                                                                                                                |
| ---------------------- | -------------------------- | --------- | -------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| passager               | `passager`                 | `boolean` | YES      | `false`       | When true, client is a "passage" client (walk-in). Exposed for both `particulier` and `passage` serialization groups |
| isMinor                | `is_minor`                 | `boolean` | YES      | `false`       | When true, client is a minor requiring a tutor                                                                       |
| title                  | `title`                    | `varchar` | YES      | `null`        | Required for non-passage particulier. Allowed: `mrs`, `Mr`, `Autre`                                                  |
| lastName               | `last_name`                | `varchar` | YES      | `null`        | Required for non-passage particulier, optional for passage                                                           |
| firstName              | `first_name`               | `varchar` | YES      | `null`        | Required for non-passage particulier, optional for passage                                                           |
| birthDate              | `birth_date`               | `date`    | YES      | `null`        | Required for non-passage particulier                                                                                 |
| sponsorId              | `sponsor_id`               | `uuid`    | YES      | `null`        | Self-referential FK to `clients.id`. Must reference an **active** client                                             |
| tutorId                | `tutor_id`                 | `uuid`    | YES      | `null`        | Self-referential FK to `clients.id`. Legal guardian for minors                                                       |
| spouseName             | `spouse_name`              | `varchar` | YES      | `null`        |                                                                                                                      |
| idDocumentType         | `id_document_type`         | `varchar` | YES      | `null`        | Allowed: `CIN`, `Passport`, `Carte de séjour`                                                                        |
| idDocumentNumber       | `id_document_number`       | `varchar` | YES      | `null`        |                                                                                                                      |
| familyGroupId          | `family_group_id`          | `uuid`    | YES      | `null`        | FK to `family_groups.id`                                                                                             |
| familyLink             | `family_link`              | `varchar` | YES      | `null`        | Allowed: `principal`, `conjoint`, `tutor`, `parent`, `children`                                                      |
| isOpticalBeneficiary   | `is_optical_beneficiary`   | `boolean` | YES      | `null`        |                                                                                                                      |
| isFinancialResponsible | `is_financial_responsible` | `boolean` | YES      | `null`        |                                                                                                                      |
| hasSharedMutual        | `has_shared_mutual`        | `boolean` | YES      | `null`        |                                                                                                                      |
| hasSharedAddress       | `has_shared_address`       | `boolean` | YES      | `null`        |                                                                                                                      |
| hasSocialCoverage      | `has_social_coverage`      | `boolean` | YES      | `null`        |                                                                                                                      |
| coverageType           | `coverage_type`            | `varchar` | YES      | `null`        |                                                                                                                      |
| membershipNumber       | `membership_number`        | `varchar` | YES      | `null`        |                                                                                                                      |
| medicalRecord          | `medical_record`           | `jsonb`   | NO       | `'{}'::jsonb` | Open-schema JSON. Only for `particulier`.                                                                            |
| notes                  | `notes`                    | `text`    | YES      | `null`        |                                                                                                                      |

### Professionnel-Specific Fields

| Column             | DB Name               | DB Type   | Nullable | Default | Notes                                                       |
| ------------------ | --------------------- | --------- | -------- | ------- | ----------------------------------------------------------- |
| companyName        | `company_name`        | `varchar` | YES      | `null`  | Required for type `professionnel`                           |
| taxId              | `tax_id`              | `varchar` | YES      | `null`  | Required for type `professionnel`                           |
| ice                | `ice`                 | `varchar` | YES      | `null`  | Required for `professionnel`. Unique index (NULLs excluded) |
| commercialRegister | `commercial_register` | `varchar` | YES      | `null`  |                                                             |
| tradeLicense       | `trade_license`       | `varchar` | YES      | `null`  |                                                             |
| vatExempt          | `vat_exempt`          | `boolean` | YES      | `null`  | Required for type `professionnel`                           |

### Constraints

- `@Check('CHK_clients_type', "type IN ('particulier', 'professionnel')")`
- `@Check('CHK_clients_family_link', "family_link IS NULL OR family_link IN ('principal', 'conjoint', 'tutor', 'parent', 'children')")`
- `@Unique('UQ_clients_ice', ['ice'])` (NULLs excluded by default in PostgreSQL)
- `@Index('IDX_clients_type_active', ['type', 'active'])` for filtered listing
- `@Index('IDX_clients_last_name', ['lastName'])` for name search
- `@Index('IDX_clients_company_name', ['companyName'])` for company search
- `@Index('IDX_clients_family_group', ['familyGroupId'])` for family queries

### Relationships

- `@ManyToOne(() => ClClient) sponsor` — self-referential, optional, `ON DELETE SET NULL`
- `@ManyToOne(() => ClClient) tutor` — self-referential, optional, `ON DELETE SET NULL`
- `@ManyToOne('ClFamilyGroup', 'members') familyGroup` — optional, `ON DELETE SET NULL`
- `@OneToOne('ClConvention', 'client') convention` — optional, only for `professionnel`
- `@OneToMany('ClContactInterne', 'client') contactsInternes` — only for `professionnel`

---

## Entity: FamilyGroup (persisted)

- **Table**: `family_groups`
- **Purpose**: Groups particulier clients into a family unit with a shared address and notes. Members are linked via `ClClient.familyGroupId` FK.
- **Extends**: `BaseEntity`

| Column  | DB Name   | DB Type   | Nullable | Default | Notes                            |
| ------- | --------- | --------- | -------- | ------- | -------------------------------- |
| nom     | `nom`     | `varchar` | NO       | —       | Family group name                |
| address | `address` | `jsonb`   | YES      | `null`  | Shared family address (TAddress) |
| notes   | `notes`   | `text`    | YES      | `null`  |                                  |

### Relationships

- `@OneToMany('ClClient', 'familyGroup') members` — all clients in this family group

### Family Assignment Rules (N3)

On client creation:

1. If `familyId` is sent → assign client to that family group
2. If `familyId` is empty AND `tutorId` is sent with tutor having `tutorFamily=true` → use the tutor's family group
3. If `tutorPayload` is sent → create a new family group
4. If client `isMinor` → create a new family group with the minor as `principal`

---

## Entity: Convention (persisted)

- **Table**: `conventions`
- **Purpose**: Trade agreement attached to a professional client. One-to-one with Client.
- **Extends**: `BaseEntity`

| Column        | DB Name          | DB Type         | Nullable | Default | Notes                                            |
| ------------- | ---------------- | --------------- | -------- | ------- | ------------------------------------------------ |
| clientId      | `client_id`      | `uuid`          | NO       | —       | FK to `clients.id`, unique                       |
| numero        | `numero`         | `varchar`       | NO       | —       | Agreement number                                 |
| dateDebut     | `date_debut`     | `date`          | YES      | `null`  | Start date                                       |
| dateFin       | `date_fin`       | `date`          | YES      | `null`  | End date. Must be > date_debut when both present |
| tauxRemise    | `taux_remise`    | `decimal(5,2)`  | NO       | `0`     | Discount rate (percentage)                       |
| plafondCredit | `plafond_credit` | `decimal(12,2)` | NO       | `0`     | Credit ceiling                                   |
| delaiPaiement | `delai_paiement` | `int`           | NO       | `0`     | Payment delay in days                            |
| notes         | `notes`          | `text`          | YES      | `null`  |                                                  |

### Constraints

- `UNIQUE` on `client_id` (enforces one-to-one at DB level)
- `@Check('CHK_conventions_dates', "date_fin IS NULL OR date_debut IS NULL OR date_fin > date_debut")`
- `FK client_id → clients(id) ON DELETE CASCADE`

### Relationships

- `@OneToOne(() => ClClient, client => client.convention)` with `@JoinColumn({ name: 'client_id' })`

---

## Entity: ContactInterne (persisted)

- **Table**: `contacts_internes`
- **Purpose**: Internal contact person within a business client's organization. One-to-many from Client.
- **Extends**: `BaseEntity`

| Column    | DB Name     | DB Type   | Nullable | Default | Notes                                        |
| --------- | ----------- | --------- | -------- | ------- | -------------------------------------------- |
| clientId  | `client_id` | `uuid`    | NO       | —       | FK to `clients.id`                           |
| nom       | `nom`       | `varchar` | NO       | —       |                                              |
| prenom    | `prenom`    | `varchar` | NO       | —       |                                              |
| fonction  | `fonction`  | `varchar` | NO       | —       |                                              |
| telephone | `telephone` | `varchar` | NO       | —       |                                              |
| email     | `email`     | `varchar` | NO       | —       |                                              |
| principal | `principal` | `boolean` | NO       | `false` | At most one per client (enforced by service) |

### Constraints

- `FK client_id → clients(id) ON DELETE CASCADE`
- `@Index('IDX_contacts_internes_client', ['clientId'])`

### Relationships

- `@ManyToOne(() => ClClient, client => client.contactsInternes)` with `@JoinColumn({ name: 'client_id' })`

---

## Type Guards & Enums (Domain Layer)

Types are imported from `@optisaas/opti-saas-lib`:

- `ClientType` = `'particulier' | 'professionnel'`
- `Civilities` = `'mrs' | 'Mr' | 'Autre'`
- `FamilyLink` = `'principal' | 'conjoint' | 'tutor' | 'parent' | 'children'`

Local enum constants:

```typescript
export const CLIENT_TYPES = {
  PARTICULIER: 'particulier',
  PROFESSIONNEL: 'professionnel',
} as const satisfies Record<string, ClientType>;

// CLIENT_GROUPS adds 'passage' for serialization groups only (not a DB type)
export const CLIENT_GROUPS = {
  PARTICULIER: 'particulier',
  PROFESSIONNEL: 'professionnel',
  PASSAGE: 'passage',
} as const;

export const FAMILY_LINKS = {
  PRINCIPAL: 'principal',
  CONJOINT: 'conjoint',
  TUTOR: 'tutor',
  PARENT: 'parent',
  CHILDREN: 'children',
} as const satisfies Record<string, FamilyLink>;

export const CLIENT_TITLES = {
  MRS: 'mrs',
  MR: 'Mr',
  AUTRE: 'Autre',
} as const satisfies Record<string, Civilities>;

export const ID_DOCUMENT_TYPES = {
  CIN: 'CIN',
  PASSPORT: 'Passport',
  CARTE_DE_SEJOUR: 'Carte de séjour',
} as const;
```

Type guards:

```typescript
export function isClientParticulier(client: { type: string }): boolean {
  return client.type === CLIENT_TYPES.PARTICULIER;
}

export function isClientPassage(client: {
  type: string;
  passager?: boolean;
}): boolean {
  return client.type === CLIENT_TYPES.PARTICULIER && client.passager === true;
}

export function isClientProfessionnel(client: { type: string }): boolean {
  return client.type === CLIENT_TYPES.PROFESSIONNEL;
}
```

---

## State Transitions

### Client Activation State

```
                  ┌──────────────────┐
  create ──────►  │  active = true   │
                  └────────┬─────────┘
                           │ deactivate
                           ▼
                  ┌──────────────────┐
                  │  active = false  │
                  └────────┬─────────┘
                           │ reactivate
                           ▼
                  ┌──────────────────┐
                  │  active = true   │
                  └──────────────────┘
```

### Convention Lifecycle

```
  No convention ──► Create ──► Update ──► Delete ──► No convention
```

### Principal Contact Auto-Unset

```
  Add contact(principal=true)
    └─► In transaction:
          1. UPDATE contacts_internes SET principal=false WHERE client_id=? AND principal=true
          2. INSERT new contact with principal=true
```
