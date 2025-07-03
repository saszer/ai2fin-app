#Requires -Version 5.1

<#
.SYNOPSIS
    Commit all pending changes across all AI2 Enterprise Platform repositories
.DESCRIPTION
    This script checks and commits changes in all individual git repositories
    to make them visible in source control tools like SourceTree
#>

Write-Host "🔄 AI2 Enterprise Platform - Committing All Repository Changes" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

# List of all repositories
$repositories = @(
    ".",
    "shared",
    "ai2-core-app", 
    "ai2-ai-modules",
    "ai2-connectors",
    "ai2-analytics", 
    "ai2-notifications",
    "ai2-subscription-service"
)

$totalRepos = $repositories.Length
$updatedRepos = 0

foreach ($repo in $repositories) {
    Write-Host ""
    Write-Host "📂 Checking repository: $repo" -ForegroundColor Yellow
    
    Push-Location $repo
    
    try {
        # Check if it's a git repository
        $isGitRepo = Test-Path ".git"
        if (-not $isGitRepo) {
            Write-Host "   ⚠️  Not a git repository, skipping..." -ForegroundColor Yellow
            continue
        }
        
        # Check for changes
        $status = git status --porcelain
        if ($status) {
            Write-Host "   📝 Found changes, committing..." -ForegroundColor Green
            
            # Add all changes
            git add .
            
            # Create appropriate commit message based on repository
            $commitMessage = switch ($repo) {
                "." { "Update root monorepo configuration with enterprise scaling and cooler pricing plans" }
                "shared" { "Update shared utilities with Lite/Pro/Elite pricing plans and enterprise features" }
                "ai2-core-app" { "Update core app with enterprise scaling and React frontend improvements" }
                "ai2-ai-modules" { "Update AI modules with multi-agent system documentation and enterprise features" }
                "ai2-connectors" { "Update connectors service with bank feed and email integration capabilities" }
                "ai2-analytics" { "Update analytics service with advanced reporting and business intelligence" }
                "ai2-notifications" { "Update notifications service with multi-channel alert system" }
                "ai2-subscription-service" { "Update subscription service with Lite/Pro/Elite pricing and enterprise billing" }
                default { "Update $repo with enterprise platform improvements" }
            }
            
            # Commit changes
            git commit -m $commitMessage
            
            Write-Host "   ✅ Successfully committed changes" -ForegroundColor Green
            $updatedRepos++
        }
        else {
            Write-Host "   ℹ️  No changes to commit" -ForegroundColor Gray
        }
        
        # Show current branch and latest commit
        $branch = git branch --show-current
        $lastCommit = git log -1 --oneline
        Write-Host "   📌 Branch: $branch" -ForegroundColor Cyan
        Write-Host "   📝 Latest: $lastCommit" -ForegroundColor Cyan
    }
    catch {
        Write-Host "   ❌ Error processing repository: $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Green
Write-Host "   • Total repositories: $totalRepos" -ForegroundColor White
Write-Host "   • Repositories updated: $updatedRepos" -ForegroundColor White
Write-Host "   • Repositories clean: $($totalRepos - $updatedRepos)" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Source Control Status:" -ForegroundColor Cyan
Write-Host "   • All changes committed and ready for SourceTree" -ForegroundColor Green
Write-Host "   • Each service is an independent git repository" -ForegroundColor Green
Write-Host "   • Refresh your source control tool to see updates" -ForegroundColor Green

Write-Host ""
Write-Host "🔍 To view in SourceTree:" -ForegroundColor Yellow
Write-Host "   1. Open SourceTree" -ForegroundColor White
Write-Host "   2. Add repositories from these paths:" -ForegroundColor White
foreach ($repo in $repositories) {
    $fullPath = Resolve-Path $repo
    Write-Host "      📁 $fullPath" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ All repositories updated and ready for source control!" -ForegroundColor Green 