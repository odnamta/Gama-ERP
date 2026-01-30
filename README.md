# GAMA ERP

**Enterprise Resource Planning System for Heavy-Lift Logistics**

A full-stack ERP system built with AI-assisted development to manage heavy and over-dimension cargo logistics operations in Indonesia.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Lines of Code | 505,000+ |
| Database Tables | 299 |
| User Roles | 15 |
| Modules | 14 |
| Lighthouse Score | 95-97 |

## 🎯 The Problem

PT. Gama Intisamudera operates heavy-lift and over-dimension cargo logistics across Indonesia. Before this ERP:

- 65 staff across 5 departments worked in data silos
- 28+ vendor relationships managed through spreadsheets
- 10 different documentation systems
- No real-time visibility into job profitability
- Critical decisions delayed by information gathering

I evaluated 6 major ERP systems (SAP, Oracle, NetSuite, Odoo, Dynamics 365, Sage). None fit our unique needs in Indonesian heavy cargo logistics. So I built one.

## 💡 The Solution

A custom-built ERP that integrates all business operations into a single platform, managing the complete lifecycle from customer quotation → job execution → invoicing → financial reporting.

### Modules Developed

| Operations | Finance | Support |
|------------|---------|---------|
| Dashboard (26 views) | Invoicing & AR | HR & Payroll |
| Quotations | Disbursements (AP) | HSE Compliance |
| Proforma Job Orders | Financial Reports | Engineering |
| Job Order Execution | | Equipment Assets |
| Shipping Agency | | Customs (PIB/PEB) |

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18 with Server Components
- TailwindCSS + Shadcn/ui
- Recharts for data visualization

**Backend:**
- TypeScript (strict mode)
- Supabase (PostgreSQL)
- Row-Level Security (RLS) policies
- 45+ Server Actions

## 🤖 AI-Assisted Development

This project was built using AI-assisted development - proving that domain expertise combined with modern AI tools can create production-grade software:

- **Claude Code** - Primary development partner for complex logic and architecture
- **GPT-4** - Cross-referencing solutions and exploring alternatives
- **Gemini** - Documentation and code explanation
- **Kiro IDE** - Feature specifications and planning

> "AI generates code. But someone has to ask the right question."
> 
> My 10 years in logistics taught me which problems actually matter. AI helped me solve them.

## 📁 Project Structure

```
/app
  /(main)
    /dashboard    - Role-specific dashboards (26 views)
    /pjo          - Proforma Job Orders
    /jo           - Job Orders (execution)
    /invoices     - Customer invoices & AR
    /customers    - Customer management
    /projects     - Project management
    /quotations   - Sales pipeline
    /equipment    - Asset management
    /hr           - HR & Payroll
    /hse          - Health, Safety, Environment
    /engineering  - Route surveys
    /agency       - Shipping operations
    /customs      - PIB/PEB declarations
    /reports      - 16 report types
    /ai-insights  - Natural language queries
/components
  /ui             - Shadcn components
  /forms          - Form components
  /tables         - Data tables with RLS
  /layout         - Layout components
/lib
  /supabase       - Supabase client (browser, server, middleware)
  /utils          - Helper functions
  /actions        - 45+ Server Actions
/types            - TypeScript types (299 table definitions)
```

## 🚀 Current Status

**Production Trial (v0.9.18)**

- ✅ System deployed and functional
- ✅ Users actively testing across departments
- ✅ Gathering real operational data
- 🔄 Full rollout target: March 2026

## 🔮 AI/ML Roadmap

The stable ERP foundation enables the next phase - intelligent automation:

| Feature | Application |
|---------|-------------|
| Cost Prediction | ML model to predict job profitability before accepting contracts |
| Route Optimization | Calculate optimal paths for oversized cargo |
| Predictive Maintenance | Forecast equipment failures before they cause delays |
| Demand Forecasting | Analyze quotation patterns for capacity planning |

## 👨‍💻 Author

**Alif Dio Atmando**

- General Manager at PT. Gama Intisamudera (10+ years)
- MIT Supply Chain MicroMasters (4 verified certificates)
- BA Business Management - University of Greenwich

Built this entire system from scratch with no formal CS background using AI-assisted development.

## 🔧 Development Setup

```bash
# Clone the repository
git clone https://github.com/odnamta/Gama-ERP.git

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

## 📄 License

Proprietary - © 2025-2026 PT. Gama Intisamudera
