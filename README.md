# AI2 Financial Platform

**Intelligent financial management for individuals and businesses.**

AI2 is a comprehensive financial platform that combines AI-powered automation with deep customization to help you manage transactions, optimize taxes, track expenses, and gain actionable insights from your financial data.

> **Commercial Software** — Source code is visible for transparency and security auditing. All usage requires a valid license.
> [Get Licensed](https://ai2fin.com/pricing) | [30-Day Evaluation](https://ai2fin.com)

---

## Features

**Smart Transaction Management**
- AI-powered categorization and classification
- Bulk CSV import/export with intelligent field mapping
- Custom categories, tags, and automated rules
- Duplicate detection and transaction linking

**Tax Intelligence**
- Automatic identification of tax-deductible expenses
- Multi-jurisdiction tax law awareness
- Business-use percentage tracking
- GST/VAT calculation and reporting

**Bill and Expense Tracking**
- Recurring bill pattern detection
- Bill occurrence tracking with payment status
- Receipt capture and matching
- Spending projections and budget suggestions

**Bank Connectivity**
- Automatic bank feed synchronization
- Multi-account support
- Real-time transaction import
- Secure credential management

**Analytics and Insights**
- Interactive dashboards and spending trends
- Category breakdowns and merchant analysis
- Period-over-period comparisons
- Exportable reports (CSV, PDF)

**Enterprise Ready**
- Multi-user support with role-based access
- API access for custom integrations
- Self-hosted or managed cloud deployment
- Subscription management with tiered plans

---

## Architecture

AI2 follows a modular microservices architecture. Each service can run independently or as part of the full platform.

```
AI2 Financial Platform
├── Core App           — API server, transaction engine, user management
├── AI Modules         — Categorization, tax analysis, insights
├── Connectors         — Bank feeds, email processing, external APIs
├── Analytics          — Reporting, data export, business intelligence
├── Notifications      — Email, SMS, push, and webhook alerts
└── Subscription       — Billing, plans, and usage management
```

Services communicate over internal APIs. The core app can run standalone for basic functionality, or with additional services for the full feature set.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database

### Installation

```bash
git clone <repository-url>
cd embracingearthspace
npm install
```

### Run

```bash
# Core app only
npm run start:core:standalone

# Full platform
npm run start:all
```

See the documentation for detailed setup and configuration guides.

---

## Security

We take security seriously. The platform includes multiple layers of protection:

- Edge-level DDoS and bot mitigation
- Runtime application protection (RASP)
- Input validation and injection prevention
- Encrypted authentication with token rotation
- Per-user data isolation at the database level
- Automated vulnerability scanning in CI/CD
- Responsible disclosure program

To report a security vulnerability, see [SECURITY.md](./SECURITY.md).

---

## License

AI2 Financial Platform is commercial software. The source code is publicly available for transparency, security auditing, and evaluation purposes.

**All usage requires a valid paid license.**

### Why Source-Visible?

- **Trust** — See exactly what the software does with your financial data
- **Security** — Independent verification of privacy and security practices
- **Compliance** — Audit for regulatory requirements
- **Evaluation** — Assess technical fit before purchasing

### License Options

Visit [ai2fin.com/pricing](https://ai2fin.com/pricing) for Personal, Business, Enterprise, and Self-Hosted license options. A 30-day evaluation period is available at no cost.

---

## Contributing

We welcome contributions from licensed users and community members. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

By contributing, you agree that your contributions will be licensed under the project's commercial license.

---

## Support

- **Issues**: [GitHub Issues](../../issues) for bugs and feature requests
- **Discussions**: [GitHub Discussions](../../discussions) for questions
- **Email**: hi@ai2fin.com
- **Documentation**: Available to licensed users

---

AI2 Financial Platform — Professional Financial Intelligence

[Get Licensed](https://ai2fin.com/pricing) | [Contact](mailto:hi@ai2fin.com)
