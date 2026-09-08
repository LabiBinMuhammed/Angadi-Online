# 🗄️ Angadi Supabase Backend & Database Architecture

This directory contains the database schema, PostgreSQL functions, RLS policies, migrations, and seed scripts for the **Angadi** multi-vendor marketplace platform.

---

## 🏗️ Structure Overview

```
supabase/
├── schema.sql                         # Base core schema (tables, foreign keys, base constraints)
├── seed.sql                           # Initial system seed data (languages, base units, categories)
├── auth_trigger.sql                   # Supabase Auth user creation & sync trigger
├── enable_comprehensive_rls.sql       # Row-Level Security policies for all tables
├── search_system_migration.sql        # Multilingual search & phonetic search functions
├── replacement_system.sql             # Item replacement requests, workflow & logs
├── reviews_feedback_schema.sql        # Shop ratings, reviews & feedback pipeline
├── commission_schema.sql              # Vendor commissions, billing & monthly reports
├── category_commission_migration.sql  # Category-specific commission overrides
├── credit_system_migration.sql        # Customer store credit & repayment ledger
├── customer_loyalty_rewards.sql       # Customer star loyalty & scratch card rewards
├── shop_owners_collaboration.sql      # Multi-owner / co-owner permissions per shop
├── translations_schema.sql            # Item & category multilingual translation tables
├── functions/                         # Supabase Edge Functions (e.g., send-sms-otp)
│   └── send-sms-otp/
├── migrations/                        # Incremental migration scripts
│   └── add_address_fields_migration.sql
└── seeds/                             # Standalone demo & catalog seed files
    ├── import_demos.sql               # Demo products, categories, unit variants
    └── seed_category_unit_groups.sql  # Category to unit-group relational mappings
```

---

## 🚀 Applying Database Schemas

### 1. Initial Setup (In Supabase SQL Editor)
Run in order:
1. `schema.sql` — Initializes tables, enums, and base triggers.
2. `auth_trigger.sql` — Hooks into Supabase Auth (`auth.users`) to populate `public.users`.
3. `enable_comprehensive_rls.sql` — Secures tables with tenant & role-based RLS policies.
4. `search_system_migration.sql` — Installs phonetic and cross-language search RPCs.
5. `replacement_system.sql` & `reviews_feedback_schema.sql` — Advanced workflows.
6. `commission_schema.sql` & `credit_system_migration.sql` — Financial accounting.
7. `seed.sql` — Core platform seed data.

### 2. Seeding Demo Catalog
To populate demo items, variants, and unit mappings:
- Run `seeds/seed_category_unit_groups.sql`
- Run `seeds/import_demos.sql`
