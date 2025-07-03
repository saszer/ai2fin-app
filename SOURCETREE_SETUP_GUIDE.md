# 🌳 SourceTree Setup Guide for AI2 Enterprise Platform

This guide will help you set up SourceTree to view and manage all AI2 Enterprise Platform repositories.

## 🎯 Overview

The AI2 Enterprise Platform consists of **8 independent git repositories** within a monorepo structure:

1. **Root Monorepo** (`D:\embracingearthspace`)
2. **Shared Utilities** (`D:\embracingearthspace\shared`)
3. **Core App** (`D:\embracingearthspace\ai2-core-app`)
4. **AI Modules** (`D:\embracingearthspace\ai2-ai-modules`)
5. **Connectors** (`D:\embracingearthspace\ai2-connectors`)
6. **Analytics** (`D:\embracingearthspace\ai2-analytics`)
7. **Notifications** (`D:\embracingearthspace\ai2-notifications`)
8. **Subscription Service** (`D:\embracingearthspace\ai2-subscription-service`)

## 📊 Current Repository Status

All repositories are properly committed and ready for source control:

| Repository | Branch | Latest Commit | Status |
|-----------|--------|---------------|---------|
| Root | `master` | Enterprise scaling and cooler pricing plans | ✅ Ready |
| Shared | `master` | Lite/Pro/Elite pricing plans and enterprise features | ✅ Ready |
| Core App | `main` | Enterprise scaling and React frontend improvements | ✅ Ready |
| AI Modules | `master` | Multi-agent system documentation and enterprise features | ✅ Ready |
| Connectors | `master` | Bank feed and email integration capabilities | ✅ Ready |
| Analytics | `master` | Advanced reporting and business intelligence | ✅ Ready |
| Notifications | `master` | Multi-channel alert system | ✅ Ready |
| Subscription | `master` | Lite/Pro/Elite pricing and enterprise billing | ✅ Ready |

## 🚀 Adding Repositories to SourceTree

### Method 1: Add Individual Repositories

1. **Open SourceTree**
2. **Click "Add" or "Clone"**
3. **Select "Add Existing Local Repository"**
4. **Add each repository path**:

```
D:\embracingearthspace
D:\embracingearthspace\shared
D:\embracingearthspace\ai2-core-app
D:\embracingearthspace\ai2-ai-modules
D:\embracingearthspace\ai2-connectors
D:\embracingearthspace\ai2-analytics
D:\embracingearthspace\ai2-notifications
D:\embracingearthspace\ai2-subscription-service
```

### Method 2: Using SourceTree's Folder Scanning

1. **Open SourceTree**
2. **Go to Tools → Options → Git**
3. **Set "Default user information"** if not already set
4. **Go to Repository → Add Existing Local Repository**
5. **Browse to** `D:\embracingearthspace`
6. **SourceTree should detect multiple repositories**

### Method 3: Command Line Helper

Run this PowerShell command to generate SourceTree-compatible paths:

```powershell
@(".", "shared", "ai2-core-app", "ai2-ai-modules", "ai2-connectors", "ai2-analytics", "ai2-notifications", "ai2-subscription-service") | ForEach-Object { 
    $fullPath = Resolve-Path $_ -ErrorAction SilentlyContinue
    if ($fullPath) { Write-Host "📁 $fullPath" }
}
```

## 🔍 What You'll See in SourceTree

### Repository Structure
Each repository will appear as a separate entry in SourceTree with:

- **Commit history** for that specific service
- **Branch information** (master/main)
- **File changes** scoped to that service
- **Individual git operations** (commit, push, pull, merge)

### File Organization
```
📁 Root Monorepo (embracingearthspace)
├── 📁 Platform documentation (README.md, guides)
├── 📁 Build scripts (build-all-fixed.ps1, start-all-services.ps1)
├── 📁 Health monitoring (health-check-all-services.ps1)
└── 📁 Configuration (package.json, tsconfig.json)

📁 Shared Utilities
├── 📁 Types (pricing.ts, index.ts)
├── 📁 Config (plans.ts, features.ts)
└── 📁 Utils (scalingConfig.ts, index.ts)

📁 AI2 Core App
├── 📁 React Frontend (client/src)
├── 📁 Server (src/server.ts)
└── 📁 Database (prisma/)

📁 AI Modules
├── 📁 Services (CategoriesAIAgent.ts, TaxDeductionAIService.ts)
├── 📁 Agents (TransactionClassificationAIAgent.ts)
└── 📁 Tax (TaxLawFactory.ts)

📁 Each Service Repository
├── 📁 Source (src/)
├── 📁 Configuration (package.json, tsconfig.json)
└── 📁 Documentation (README.md)
```

## 🛠️ Troubleshooting

### Issue: "Repository not detected"
**Solution**: Ensure each folder has a `.git` directory:
```powershell
ls -Recurse -Directory -Name ".git"
```

### Issue: "No changes visible"
**Solution**: Refresh SourceTree or run:
```powershell
.\commit-all-repos.ps1
```

### Issue: "Branch inconsistencies"
**Solution**: Some repos use `master`, others use `main`. This is normal and expected.

### Issue: "Too many repositories"
**Solution**: Create SourceTree groups:
1. **AI2 Core** (Root, Shared, Core App)
2. **AI2 Services** (AI Modules, Connectors, Analytics)
3. **AI2 Platform** (Notifications, Subscription Service)

## 🎯 Recommended Workflow

### Daily Development
1. **Open relevant service repository** in SourceTree
2. **Create feature branch** for your changes
3. **Make changes** within that service
4. **Commit and push** from that service's repository

### Platform-wide Changes
1. **Start with shared utilities** if updating types/configs
2. **Update dependent services** one by one
3. **Test integration** using health check scripts
4. **Update root documentation** if needed

### Release Management
1. **Tag releases** in individual service repositories
2. **Update version numbers** in package.json files
3. **Update platform documentation** in root repository
4. **Run full health check** before deployment

## 📈 Benefits of This Structure

### Independent Development
- **Each service** can be developed independently
- **Teams can work** on different services simultaneously
- **Releases** can be staggered per service

### Clear Ownership
- **Frontend team** → ai2-core-app/client
- **AI team** → ai2-ai-modules
- **Integration team** → ai2-connectors
- **Analytics team** → ai2-analytics
- **DevOps team** → Root monorepo

### Scalable Architecture
- **Services** can be deployed independently
- **Database** can be scaled per service needs
- **Teams** can use different technology stacks if needed

## ✅ Verification Checklist

- [ ] All 8 repositories appear in SourceTree
- [ ] Each repository shows recent commits
- [ ] File changes are visible per repository
- [ ] Branch information is displayed correctly
- [ ] You can perform git operations (commit, push, pull)
- [ ] Repository groups are organized for clarity

## 🚀 Next Steps

1. **Add all repositories** to SourceTree
2. **Organize into groups** for better management
3. **Set up branch policies** if using remote repositories
4. **Configure build integration** for CI/CD
5. **Set up code review workflows** per repository

## 📞 Support

If you need help with SourceTree setup:
1. Check SourceTree documentation
2. Verify git repository structure
3. Run repository health checks
4. Consult team lead or DevOps

---

**🎉 Congratulations!** You now have a complete enterprise-grade source control setup with 8 independent repositories, each optimized for its specific purpose while maintaining platform coherence. 