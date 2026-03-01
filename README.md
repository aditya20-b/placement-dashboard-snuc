<div align="center">

# SNU Chennai Placement Dashboard

**Real-time placement analytics for Shiv Nadar University Chennai (Batch 2022-26)**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Sheets](https://img.shields.io/badge/Google_Sheets-API-34A853?logo=googlesheets&logoColor=white)](https://developers.google.com/sheets/api)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4-B845ED?logo=auth0&logoColor=white)](https://next-auth.js.org/)
[![License](https://img.shields.io/badge/License-Private-red)](#license)

</div>

---

A server-rendered analytics dashboard that reads placement data from Google Sheets, computes statistics server-side, and renders interactive charts with role-based access control. Built with the Next.js App Router and designed for the placement cell at SNU Chennai.

## Features

- **Live Google Sheets Integration** — Reads from 3 sheet tabs (Master, Offer_Details, Access) with 5-minute caching and stale fallback
- **Role-Based Access Control** — Google OAuth via NextAuth; `admin` and `viewer` roles driven by the Access sheet tab
- **5 Dashboard Pages** — Overview, CTC Analytics, Companies, Students (admin), Export (admin)
- **Interactive Charts** — Recharts-powered bar charts, pie charts, scatter plots, line charts, and timelines
- **PDF Report Generation** — Configurable section selection, generated client-side with jsPDF
- **CSV Export** — One-click student data export for admin users
- **Responsive Design** — Desktop nav + mobile bottom tab bar, optimized for all screen sizes
- **Animated UI** — Framer Motion page transitions, animated stat counters, staggered card reveals
- **Security Hardened** — CSP headers, CSRF validation, strict RBAC middleware, no PII exposure to viewers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) (strict mode) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (New York) |
| Charts | [Recharts 3](https://recharts.org/) |
| Auth | [NextAuth.js 4](https://next-auth.js.org/) (Google OAuth) |
| Data Source | [Google Sheets API](https://developers.google.com/sheets/api) (googleapis) |
| State | [TanStack React Query 5](https://tanstack.com/query) |
| Animation | [Motion](https://motion.dev/) (Framer Motion) |
| PDF | [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) |
| Icons | [Lucide React](https://lucide.dev/) |
| Notifications | [Sonner](https://sonner.emilkowal.dev/) |

## Quick Start

### Prerequisites

- **Node.js** >= 18.17
- **npm** >= 9
- A **Google Cloud** project with Sheets API enabled
- A **Google OAuth 2.0** client (Web application type)
- A **Google Service Account** with Viewer access to the placement spreadsheet

### 1. Clone & Install

```bash
git clone <repository-url>
cd Placement-Dashboard
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in the 8 required environment variables:

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` for dev) |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth client ID from Google Cloud Console |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email (for Sheets API) |
| `GOOGLE_PRIVATE_KEY` | Full PEM private key (with `-----BEGIN/END-----`) |
| `GOOGLE_SHEET_ID` | ID from the Google Sheet URL |

> **Note:** The Google Sheet must have 3 tabs named exactly: `Master`, `Offer_Details`, `Access`. See [Google Sheets Setup](docs/google-sheets-setup.md) for the required format.

### 3. Register OAuth Redirect URIs

In Google Cloud Console, add these authorized redirect URIs:

```
http://localhost:3000/api/auth/callback/google
https://your-domain.com/api/auth/callback/google
```

### 4. Run

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint check
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── page.tsx                  # Home → redirects to /dashboard
│   ├── login/                    # Google OAuth login page
│   ├── access-denied/            # Unauthorized access page
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── page.tsx              # Overview (stats, charts, tables)
│   │   ├── ctc/page.tsx          # CTC analytics
│   │   ├── companies/page.tsx    # Company directory & charts
│   │   ├── students/page.tsx     # Student records (admin only)
│   │   ├── export/page.tsx       # PDF/CSV export (admin only)
│   │   ├── layout.tsx            # Dashboard shell (nav + content)
│   │   └── nav.tsx               # Top nav + mobile tab bar
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth API routes
│       └── data/route.ts         # Single GET endpoint for all data
│
├── components/
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── chart-card.tsx        # Card wrapper for charts
│   │   ├── stat-card.tsx         # Animated stat card
│   │   ├── data-freshness.tsx    # Cache freshness indicator
│   │   └── loading-skeleton.tsx  # Branded loading skeletons
│   └── ui/                       # shadcn/ui base components
│
├── lib/                          # Server-side utilities
│   ├── sheets.ts                 # Google Sheets API client
│   ├── data.ts                   # Data joining & anonymization
│   ├── stats.ts                  # Statistical computations
│   ├── cache.ts                  # In-memory TTL cache
│   ├── auth.ts                   # NextAuth configuration
│   ├── session.ts                # Session helper functions
│   ├── constants.ts              # Validation rules, chart colors
│   ├── format.ts                 # Number/date formatting (INR)
│   ├── export-pdf.ts             # jsPDF report generation
│   └── csrf.ts                   # CSRF protection
│
├── hooks/                        # React hooks
│   ├── use-dashboard-data.ts     # React Query data fetching
│   └── use-table-sort.ts         # Generic table sorting
│
├── types/                        # TypeScript definitions
│   ├── student.ts                # Student, Offer, enums
│   ├── stats.ts                  # Statistics interfaces
│   ├── api.ts                    # API response types
│   ├── auth.ts                   # NextAuth type augmentation
│   └── sheets.ts                 # Raw sheet row types
│
├── config/site.ts                # Site metadata & nav items
├── providers/                    # React context providers
└── middleware.ts                 # Route protection middleware
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design, data pipeline, caching strategy |
| [Authentication](docs/authentication.md) | OAuth flow, roles, middleware, session helpers |
| [Google Sheets Setup](docs/google-sheets-setup.md) | Sheet structure, column formats, service account setup |
| [Deployment](docs/deployment.md) | Vercel deployment, environment variables, production checklist |
| [Contributing](docs/contributing.md) | Development workflow, code style, PR guidelines |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint with Next.js Core Web Vitals rules |

## License

This project is private and intended for use by the Shiv Nadar University Chennai placement cell.

---

<div align="center">

**Built for SNU Chennai Placement Cell**


</div>

