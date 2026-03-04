# Phase 1 Data Model: Client Management

## Entity: Client (persisted — single table, polymorphic)

- **Table**: `clients`
- **Purpose**: Core entity representing any person or organization doing business with the optical store. Uses a `type` discriminator column to distinguish between three client types.
- **Extends**: `BaseEntity` (inherits `id: uuid`, `createdAt`, `updatedAt`, `deletedAt`)

### Shared Base Fields

| Column  | DB Name   | DB Type   | Nullable | Default | Notes                                                          |
| ------- | --------- | --------- | -------- | ------- | -------------------------------------------------------------- |
| type    | `type`    | `varchar` | NO       | —       | Discriminator: `'particulier'`, `'passage'`, `'professionnel'` |
| phone   | `phone`   | `varchar` | YES      | `null`  |                                                                |
| email   | `email`   | `varchar` | YES      | `null`  |                                                                |
| city    | `city`    | `varchar` | YES      | `null`  |                                                                |
| address | `address` | `varchar` | YES      | `null`  |                                                                |
| active  | `active`  | `boolean` | NO       | `true`  | Business-level deactivation flag                               |

### Particulier-Specific Fields

| Column                 | DB Name                    | DB Type   | Nullable | Default       | Notes                                                   |
| ---------------------- | -------------------------- | --------- | -------- | ------------- | ------------------------------------------------------- |
| title                  | `title`                    | `varchar` | YES      | `null`        | Required for type `particulier`. Allowed: Mr, Mme, Mlle |
| lastName               | `last_name`                | `varchar` | YES      | `null`        | Required for type `particulier`, optional for `passage` |
| firstName              | `first_name`               | `varchar` | YES      | `null`        | Required for type `particulier`, optional for `passage` |
| birthDate              | `birth_date`               | `date`    | YES      | `null`        | Required for type `particulier`                         |
| sponsorId              | `sponsor_id`               | `uuid`    | YES      | `null`        | Self-referential FK to `clients.id`                     |
| spouseName             | `spouse_name`              | `varchar` | YES      | `null`        |                                                         |
| idDocumentType         | `id_document_type`         | `varchar` | YES      | `null`        | Allowed: CIN, Passport, Carte de séjour                 |
| idDocumentNumber       | `id_document_number`       | `varchar` | YES      | `null`        |                                                         |
| familyGroupId          | `family_group_id`          | `int`     | YES      | `null`        | Logical grouping label (not a FK)                       |
| familyLink             | `family_link`              | `varchar` | YES      | `null`        | e.g., époux, enfant, parent                             |
| isOpticalBeneficiary   | `is_optical_beneficiary`   | `boolean` | YES      | `null`        |                                                         |
| isFinancialResponsible | `is_financial_responsible` | `boolean` | YES      | `null`        |                                                         |
| hasSharedMutual        | `has_shared_mutual`        | `boolean` | YES      | `null`        |                                                         |
| hasSharedAddress       | `has_shared_address`       | `boolean` | YES      | `null`        |                                                         |
| hasSocialCoverage      | `has_social_coverage`      | `boolean` | YES      | `null`        |                                                         |
| coverageType           | `coverage_type`            | `varchar` | YES      | `null`        |                                                         |
| membershipNumber       | `membership_number`        | `varchar` | YES      | `null`        |                                                         |
| medicalRecord          | `medical_record`           | `jsonb`   | NO       | `'{}'::jsonb` | Open-schema JSON. Only for `particulier`.               |
| notes                  | `notes`                    | `text`    | YES      | `null`        |                                                         |

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

- `@Check('CHK_clients_type', "type IN ('particulier', 'passage', 'professionnel')")`
- `UNIQUE INDEX` on `ice` (NULLs excluded by default in PostgreSQL)
- `@Index('IDX_clients_type_active', ['type', 'active'])` for filtered listing
- `@Index('IDX_clients_last_name', ['lastName'])` for name search
- `@Index('IDX_clients_company_name', ['companyName'])` for company search
- `@Index('IDX_clients_family_group', ['familyGroupId'])` for family queries

### Relationships

- `@ManyToOne(() => ClClient) sponsor` — self-referential, optional
- `@OneToOne(() => ClConvention, convention => convention.client)` — optional, only for `professionnel`
- `@OneToMany(() => ClContactInterne, contact => contact.client)` — only for `professionnel`

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

## Type Guards (Domain Layer)

```typescript
export const CLIENT_TYPES = {
  PARTICULIER: 'particulier',
  PASSAGE: 'passage',
  PROFESSIONNEL: 'professionnel',
} as const;

export const ClientTypeValues = Object.values(CLIENT_TYPES);
export type ClientType = ExtractEnumTypes<typeof CLIENT_TYPES>;

export function isClientParticulier(client: { type: string }): boolean {
  return client.type === CLIENT_TYPES.PARTICULIER;
}

export function isClientPassage(client: { type: string }): boolean {
  return client.type === CLIENT_TYPES.PASSAGE;
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
