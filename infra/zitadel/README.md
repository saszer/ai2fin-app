# ZITADEL Terraform (prod)

## Steps

1) Install Terraform
- Windows: Download from `https://developer.hashicorp.com/terraform/downloads`
- Or use winget: `winget install HashiCorp.Terraform`

2) Set environment variables
- PowerShell: `setx ZITADEL_TOKEN "<PAT>"`
- Open a new terminal after `setx` so env is loaded

3) Init and apply
```powershell
cd infra/zitadel
$env:ZITADEL_TOKEN = "<PAT>"  # optional override for current session
terraform init
terraform apply -var zitadel_domain="ai2fin2-sbpvwc.au1.zitadel.cloud" -var project_name="ai2fin-prod" -var app_name="ai2-core-app-prod"
```

## Outputs
- `project_id` – ZITADEL project id
- `oidc_client_id` – OIDC app client_id (use also as `OIDC_AUDIENCE`)

## Next manual step
- Generate a client key for the OIDC app in Console to obtain `kid` and download the private key PEM.
- Store `OIDC_KEY_ID` and `OIDC_PRIVATE_KEY` in secret manager.

## Backend env (prod)
- OIDC_ISSUER=https://ai2fin2-sbpvwc.au1.zitadel.cloud
- OIDC_CLIENT_ID=<output oidc_client_id>
- OIDC_AUDIENCE=<same as OIDC_CLIENT_ID>
- OIDC_KEY_ID=<kid from generated key>
- OIDC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
- OIDC_ENRICH_USERINFO=true
- ZITADEL_MANAGEMENT_TOKEN=<PAT>
- JWT_SECRET=<32+ chars>

## Troubleshooting
- Ensure the provider version in `main.tf` is compatible.
- Confirm `ZITADEL_TOKEN` is set and has org permissions to create projects/apps.









