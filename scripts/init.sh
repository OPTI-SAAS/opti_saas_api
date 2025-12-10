#!/bin/bash
set -e

echo "Creating schemas..."
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOSQL
    CREATE SCHEMA IF NOT EXISTS backoffice;
    CREATE SCHEMA IF NOT EXISTS client;
EOSQL

echo "Schemas created successfully."