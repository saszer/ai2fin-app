#!/bin/bash
# Security setup script for AI2 platform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔒 Setting up AI2 Security Infrastructure${NC}"

# 1. Setup Cloudflare Access
echo -e "${YELLOW}Setting up Cloudflare Access...${NC}"
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/access/apps" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "AI2 Admin Portal",
    "domain": "admin.embracingearth.space",
    "type": "self_hosted",
    "session_duration": "24h",
    "policies": [{
      "name": "Admin Access",
      "decision": "allow",
      "include": [{
        "email": {"domain": "embracingearth.space"}
      }],
      "require": [{
        "geo": {"country": ["US", "CA", "GB", "AU"]}
      }]
    }]
  }'

# 2. Generate and store secrets
echo -e "${YELLOW}Generating secrets...${NC}"

# Generate API keys
API_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 64)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Store in Fly.io
fly secrets set \
  API_KEY="$API_KEY" \
  JWT_SECRET="$JWT_SECRET" \
  ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  --app ai2-production

# Store in GCP Secret Manager
echo "$API_KEY" | gcloud secrets create ai2-api-key --data-file=-
echo "$JWT_SECRET" | gcloud secrets create ai2-jwt-secret --data-file=-
echo "$ENCRYPTION_KEY" | gcloud secrets create ai2-encryption-key --data-file=-

# 3. Setup CORS and CSP headers
echo -e "${YELLOW}Configuring security headers...${NC}"
cat > infrastructure/nginx/security-headers.conf <<EOF
# Security Headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# Content Security Policy
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.embracingearth.space wss://embracingearth.space;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
" always;
EOF

# 4. Setup monitoring alerts
echo -e "${YELLOW}Configuring security alerts...${NC}"
cat > infrastructure/monitoring/security-alerts.yml <<EOF
groups:
  - name: security
    rules:
      - alert: HighFailedLoginRate
        expr: rate(auth_failed_login_total[5m]) > 10
        labels:
          severity: warning
        annotations:
          summary: "High failed login rate detected"
          
      - alert: SuspiciousAPIUsage
        expr: rate(api_requests_total{status=~"4.."}[5m]) > 50
        labels:
          severity: warning
        annotations:
          summary: "High rate of 4xx errors"
          
      - alert: PotentialDDoS
        expr: rate(http_requests_total[1m]) > 1000
        labels:
          severity: critical
        annotations:
          summary: "Potential DDoS attack detected"
EOF

echo -e "${GREEN}✅ Security setup complete!${NC}" 