variable "zitadel_domain" {
  description = "Zitadel base domain (e.g., ai2fin2-sbpvwc.au1.zitadel.cloud)"
  type        = string
}

variable "zitadel_token" {
  description = "Zitadel PAT (prefer setting ZITADEL_TOKEN env var)."
  type        = string
  sensitive   = true
  default     = null
}

variable "project_name" {
  description = "Zitadel project name"
  type        = string
  default     = "ai2fin-prod"
}

variable "app_name" {
  description = "OIDC application name"
  type        = string
  default     = "ai2-core-app-prod"
}







