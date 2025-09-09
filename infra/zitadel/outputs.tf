output "project_id" {
  value       = zitadel_project.prod.id
  description = "Zitadel project id"
}

output "oidc_client_id" {
  value       = zitadel_application_oidc.core_app.client_id
  description = "OIDC application client_id"
}

// If application key resource becomes available in provider, also output kid and private key here

















