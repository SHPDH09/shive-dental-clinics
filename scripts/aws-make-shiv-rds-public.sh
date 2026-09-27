#!/usr/bin/env bash
# Run in AWS Console → CloudShell (region ap-south-1). Makes shiv-dental-clinic reachable from Cloudflare + this agent.
set -euo pipefail
REGION="ap-south-1"
INSTANCE="shiv-dental-clinic"

echo "==> Instance status…"
aws rds describe-db-instances --db-instance-identifier "$INSTANCE" --region "$REGION" \
  --query 'DBInstances[0].{Engine:Engine,Public:PubliclyAccessible,User:MasterUsername,Endpoint:Endpoint.Address,SG:VpcSecurityGroups[0].VpcSecurityGroupId}' \
  --output table

SG=$(aws rds describe-db-instances --db-instance-identifier "$INSTANCE" --region "$REGION" \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' --output text)

echo "==> Enable public access…"
aws rds modify-db-instance \
  --db-instance-identifier "$INSTANCE" \
  --publicly-accessible \
  --apply-immediately \
  --region "$REGION"

echo "==> Allow PostgreSQL from anywhere on SG ${SG} (tighten later)…"
aws ec2 authorize-security-group-ingress \
  --group-id "$SG" \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region "$REGION" 2>/dev/null || echo "(5432 rule may already exist)"

echo "==> Wait until available…"
aws rds wait db-instance-available --db-instance-identifier "$INSTANCE" --region "$REGION"

echo "==> Done. DATABASE_URL for Cloudflare (PostgreSQL only):"
echo "postgresql://admin:Raunak12583@${INSTANCE}.c5mm0sc887f3.ap-south-1.rds.amazonaws.com:5432/postgres?schema=public&sslmode=require"
