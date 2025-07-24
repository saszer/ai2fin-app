# AI+ Microservice Environment Setup Script
# embracingearth.space - AI-powered financial intelligence

Write-Host "Setting up AI+ Microservice Environment..." -ForegroundColor Cyan

# Check if .env file exists in ai2-ai-modules
$envPath = "ai2-ai-modules\.env"
if (Test-Path $envPath) {
    Write-Host ".env file already exists in ai2-ai-modules" -ForegroundColor Green
} else {
    Write-Host "Creating .env file in ai2-ai-modules..." -ForegroundColor Yellow
    
    $envContent = @"
# AI+ Microservice Environment Configuration
# embracingearth.space - AI-powered financial intelligence

# OpenAI Configuration
OPENAI_API_KEY=your-actual-openai-api-key-here

# AI Model Configuration
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_COUNTRY_CODE=AU
AI_LANGUAGE=en

# Service Configuration
AI_PORT=3002
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

# Core App Integration
CORE_APP_URL=http://localhost:3001

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/ai-modules.log
"@

    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "Created .env file at: $envPath" -ForegroundColor Green
    Write-Host "IMPORTANT: Please edit the file and replace 'your-actual-openai-api-key-here' with your real OpenAI API key" -ForegroundColor Yellow
}

# Also create .env in root directory for compatibility
$rootEnvPath = ".env"
if (Test-Path $rootEnvPath) {
    Write-Host ".env file already exists in root directory" -ForegroundColor Green
} else {
    Write-Host "Creating .env file in root directory..." -ForegroundColor Yellow
    
    $rootEnvContent = @"
# AI2 Environment Configuration
# embracingearth.space - AI-powered financial intelligence

# OpenAI Configuration (CRITICAL)
OPENAI_API_KEY=your-actual-openai-api-key-here

# AI Model Settings
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_COUNTRY_CODE=AU
AI_LANGUAGE=en

# Service Configuration
PORT=3001
AI_PORT=3002
FRONTEND_PORT=3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai2_db"

# Security
JWT_SECRET=your-jwt-secret-here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
"@

    $rootEnvContent | Out-File -FilePath $rootEnvPath -Encoding UTF8
    Write-Host "Created .env file at: $rootEnvPath" -ForegroundColor Green
    Write-Host "IMPORTANT: Please edit the file and replace 'your-actual-openai-api-key-here' with your real OpenAI API key" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit both .env files and add your real OpenAI API key" -ForegroundColor White
Write-Host "2. Restart the AI+ microservice: cd ai2-ai-modules; npm start" -ForegroundColor White
Write-Host "3. Test the categorization to verify real AI calls are working" -ForegroundColor White
Write-Host ""
Write-Host "Get your OpenAI API key from: https://platform.openai.com/api-keys" -ForegroundColor Yellow 