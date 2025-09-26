# AI Services Analysis - Core vs AI+ Services

Write-Host "=== AI SERVICES ANALYSIS ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "CRITICAL DISCOVERY: ENABLE_AI affects BOTH core and AI+ services!" -ForegroundColor Red
Write-Host ""

Write-Host "CORE AI SERVICES (built into ai2-core-app):" -ForegroundColor Yellow
Write-Host " UnifiedIntelligenceService - Core AI categorization and tax analysis" -ForegroundColor Green
Write-Host " IntelligentCategorizationService - Core AI categorization" -ForegroundColor Green
Write-Host " IntelligentTaxDeductionService - Core AI tax analysis" -ForegroundColor Green
Write-Host " TokenOptimizedAIService - Core AI with OpenAI integration" -ForegroundColor Green
Write-Host " BillsConnectorAI - Core AI for bill pattern detection" -ForegroundColor Green
Write-Host " AIService - Core AI service wrapper" -ForegroundColor Green
Write-Host ""

Write-Host "AI+ SERVICES (external ai2-ai-modules):" -ForegroundColor Yellow
Write-Host " AI Modules Microservice (port 3002)" -ForegroundColor Green
Write-Host " Enhanced AI Categorization API" -ForegroundColor Green
Write-Host " Advanced AI Processing" -ForegroundColor Green
Write-Host " AI Testing Dashboard" -ForegroundColor Green
Write-Host ""

Write-Host "HOW ENABLE_AI WORKS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. ENABLE_AI=false DISABLES:" -ForegroundColor Red
Write-Host "    Core AI services (UnifiedIntelligenceService, etc.)" -ForegroundColor Red
Write-Host "    AI+ microservice calls" -ForegroundColor Red
Write-Host "    All AI categorization and tax analysis" -ForegroundColor Red
Write-Host "    AI-powered features in core app" -ForegroundColor Red
Write-Host ""

Write-Host "2. ENABLE_AI=true ENABLES:" -ForegroundColor Green
Write-Host "    Core AI services (built into core app)" -ForegroundColor Green
Write-Host "    AI+ microservice calls (if available)" -ForegroundColor Green
Write-Host "    Fallback from AI+ to core AI" -ForegroundColor Green
Write-Host "    All AI-powered features" -ForegroundColor Green
Write-Host ""

Write-Host "FALLBACK MECHANISM:" -ForegroundColor Yellow
Write-Host "1. Try AI+ microservice first (if ENABLE_AI=true)" -ForegroundColor White
Write-Host "2. Fall back to core AI services if AI+ fails" -ForegroundColor White
Write-Host "3. Use basic rule-based analysis if both fail" -ForegroundColor White
Write-Host ""

Write-Host "MEMORY IMPACT:" -ForegroundColor Yellow
Write-Host ""

Write-Host "CORE AI SERVICES (always loaded):" -ForegroundColor Green
Write-Host " UnifiedIntelligenceService - ~50MB memory" -ForegroundColor Green
Write-Host " IntelligentCategorizationService - ~30MB memory" -ForegroundColor Green
Write-Host " IntelligentTaxDeductionService - ~25MB memory" -ForegroundColor Green
Write-Host " Total Core AI: ~105MB memory" -ForegroundColor Green
Write-Host ""

Write-Host "AI+ SERVICES (external, but still consume memory):" -ForegroundColor Yellow
Write-Host " AI+ microservice calls - ~20MB memory" -ForegroundColor Yellow
Write-Host " Enhanced AI processing - ~40MB memory" -ForegroundColor Yellow
Write-Host " Total AI+ overhead: ~60MB memory" -ForegroundColor Yellow
Write-Host ""

Write-Host "RECOMMENDATION:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Disable ALL AI (ENABLE_AI=false)" -ForegroundColor Red
Write-Host "    Saves ~165MB memory (105MB core + 60MB AI+)" -ForegroundColor Red
Write-Host "    No AI categorization or tax analysis" -ForegroundColor Red
Write-Host "    Manual categorization only" -ForegroundColor Red
Write-Host ""

Write-Host "Option 2: Keep Core AI Only (ENABLE_AI=true, disable AI+)" -ForegroundColor Yellow
Write-Host "    Saves ~60MB memory (AI+ overhead)" -ForegroundColor Yellow
Write-Host "    Keeps core AI categorization and tax analysis" -ForegroundColor Yellow
Write-Host "    No AI+ microservice calls" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 3: Keep All AI (ENABLE_AI=true, AI+ enabled)" -ForegroundColor Green
Write-Host "    Uses ~165MB memory" -ForegroundColor Green
Write-Host "    Full AI capabilities with fallback" -ForegroundColor Green
Write-Host "    Best user experience" -ForegroundColor Green
Write-Host ""

Write-Host "BEST APPROACH FOR MEMORY OPTIMIZATION:" -ForegroundColor Cyan
Write-Host " Set ENABLE_AI=true (keep core AI)" -ForegroundColor Green
Write-Host " Disable AI+ microservice (set AI_ENDPOINT to invalid URL)" -ForegroundColor Green
Write-Host " This gives you core AI with ~60MB memory savings" -ForegroundColor Green
Write-Host ""

Write-Host "COMMANDS:" -ForegroundColor Yellow
Write-Host "fly secrets set ENABLE_AI=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set AI_ENDPOINT=http://disabled -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_AI_CATEGORIES=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_AI_TAX_DEDUCTION=true -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "This keeps core AI functionality while disabling the AI+ microservice!" -ForegroundColor Green
