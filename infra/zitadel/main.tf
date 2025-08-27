terraform {
  required_version = ">= 1.4.0"

  required_providers {
    zitadel = {
      source  = "zitadel/zitadel"
      version = ">= 2.0.0"
    }
  }
}

provider "zitadel" {
  // ZITADEL Cloud base domain without protocol
  // e.g. ai2fin2-sbpvwc.au1.zitadel.cloud
  domain = var.zitadel_domain

  // Prefer using the PAT passed via environment variable for security:
  //   setx ZITADEL_TOKEN "<PAT>" (Windows) or export ZITADEL_TOKEN=...
  // If you need to override, use var.zitadel_token (sensitive)
  token = coalesce(var.zitadel_token, try(env("ZITADEL_TOKEN"), null))
}

locals {
  project_name = var.project_name

  allowed_redirect_uris = [
    // Production
    "https://ai2fin.com/auth/callback",
    "https://app.ai2fin.com/auth/callback",
    "https://subscription.ai2fin.com/auth/callback",

    // Local development
    "http://localhost:3000/auth/callback",
  ]

  post_logout_uris = [
    // Production
    "https://ai2fin.com/",
    "https://app.ai2fin.com/",
    "https://subscription.ai2fin.com/",

    // Local development
    "http://localhost:3000/",
  ]

  additional_origins = [
    // CORS allowed origins
    "https://ai2fin.com",
    "https://app.ai2fin.com",
    "https://subscription.ai2fin.com",
    "http://localhost:3000",
  ]
}

resource "zitadel_project" "prod" {
  name = local.project_name
}

// OIDC confidential app (Web) using Private Key JWT (enterprise recommended)
resource "zitadel_application_oidc" "core_app" {
  project_id = zitadel_project.prod.id
  name       = var.app_name

  // Web application
  app_type         = "OIDC_APP_TYPE_WEB"
  auth_method_type = "OIDC_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT"
  version          = "OIDC_VERSION_1_0"

  // OAuth/OIDC flow
  response_types = ["OIDC_RESPONSE_TYPE_CODE"]
  grant_types    = [
    "OIDC_GRANT_TYPE_AUTHORIZATION_CODE",
    "OIDC_GRANT_TYPE_REFRESH_TOKEN",
  ]

  // URIs
  redirect_uris             = local.allowed_redirect_uris
  post_logout_redirect_uris = local.post_logout_uris
  additional_origins        = local.additional_origins

  // Tokens and assertions
  access_token_type           = "OIDC_TOKEN_TYPE_BEARER"
  access_token_role_assertion = false
  id_token_role_assertion     = false
  id_token_userinfo_assertion = false

  // Security/behavior
  dev_mode   = false
  clock_skew = "0s"
}

// NOTE: Creating a signing key for private_key_jwt is currently done via Console/API.
// Some provider versions expose application key resources; if available in your version,
// prefer adding it here to generate and output kid + private key. Otherwise, generate
// a key in Console and store PEM + kid in your secret manager.













