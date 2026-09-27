#!/usr/bin/env bash
# Paste this entire script in AWS Console → CloudShell (region: ap-south-1).
# Fixes Aurora PostgreSQL cluster "database-1": password auth + master password.
set -euo pipefail
REGION="ap-south-1"
CLUSTER="database-1"
NEW_PASS="Raunak12583"

echo "==> Describing cluster ${CLUSTER}…"
aws rds describe-db-clusters --db-cluster-identifier "$CLUSTER" --region "$REGION" \
  --query 'DBClusters[0].{Engine:Engine,MasterUsername:MasterUsername,IAM:IAMDatabaseAuthenticationEnabled,Status:Status}' \
  --output table

echo "==> Disable IAM DB auth (password-only login)…"
aws rds modify-db-cluster \
  --db-cluster-identifier "$CLUSTER" \
  --no-enable-iam-database-authentication \
  --apply-immediately \
  --region "$REGION"

echo "==> Set master password…"
aws rds modify-db-cluster \
  --db-cluster-identifier "$CLUSTER" \
  --master-user-password "$NEW_PASS" \
  --apply-immediately \
  --region "$REGION"

echo "==> Wait until available (may take several minutes)…"
aws rds wait db-cluster-available --db-cluster-identifier "$CLUSTER" --region "$REGION"

echo "==> Done. Use DATABASE_URL:"
echo "postgresql://admin:${NEW_PASS}@database-1.cluster-c5mm0sc887f3.ap-south-1.rds.amazonaws.com:5432/postgres?schema=public&sslmode=require"
echo "(Replace admin with MasterUsername from describe output if different.)"
