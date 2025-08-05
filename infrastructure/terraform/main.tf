terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  backend "gcs" {
    bucket = "ai2-terraform-state"
    prefix = "production"
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

# Providers
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Cloud SQL Instance
resource "google_sql_database_instance" "main" {
  name             = "ai2-main-instance"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-g1-small"
    
    ip_configuration {
      ipv4_enabled    = true
      private_network = google_compute_network.vpc.id
      
      authorized_networks {
        name  = "fly-io"
        value = "0.0.0.0/0" # Restrict this to Fly.io IPs
      }
    }
    
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
    }
    
    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }
  
  deletion_protection = true
}

# Database
resource "google_sql_database" "app" {
  name     = "ai2_production"
  instance = google_sql_database_instance.main.name
}

# Database User
resource "google_sql_user" "app" {
  name     = "ai2_app"
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store DB password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "ai2-db-password"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "ai2-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "ai2-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Cloud Storage Bucket
resource "google_storage_bucket" "uploads" {
  name          = "${var.project_id}-ai2-uploads"
  location      = var.region
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  cors {
    origin          = ["https://embracingearth.space"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}

# Redis Instance
resource "google_redis_instance" "cache" {
  name           = "ai2-cache"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
  
  redis_version = "REDIS_7_0"
  
  auth_enabled = true
  
  persistence_config {
    persistence_mode = "RDB"
    rdb_config {
      rdb_snapshot_period     = "TWELVE_HOURS"
      rdb_snapshot_start_time = "2024-01-01T03:00:00Z"
    }
  }
}

# Cloudflare Configuration
resource "cloudflare_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = "app"
  value   = "ai2-production.fly.dev"
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_page_rule" "security_headers" {
  zone_id  = var.cloudflare_zone_id
  target   = "app.embracingearth.space/*"
  priority = 1
  
  actions {
    security_level = "medium"
    ssl            = "strict"
    
    security_headers {
      enabled = true
      max_age = 31536000
      
      include_subdomains = true
      preload            = true
      nosniff            = true
    }
  }
}

resource "cloudflare_rate_limit" "api" {
  zone_id  = var.cloudflare_zone_id
  
  threshold = 100
  period    = 60
  
  match {
    request {
      url_pattern = "app.embracingearth.space/api/*"
    }
  }
  
  action {
    mode    = "challenge"
    timeout = 600
  }
}

# Outputs
output "database_connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "storage_bucket" {
  value = google_storage_bucket.uploads.url
} 