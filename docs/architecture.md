# Architecture

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Query](https://img.shields.io/badge/React_Query-5-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)

## Overview

The Placement Dashboard is a **Next.js 16 App Router** application that reads placement data from Google Sheets, computes statistics server-side, and renders interactive charts on the client. It uses a single API endpoint pattern with aggressive caching to minimize Google Sheets API calls.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Google Cloud                             │
│  ┌─────────────────┐    ┌──────────────────────────────────┐    │
│  │  Google OAuth    │    │  Google Sheets (3 tabs)          │    │
│  │  (Client ID)     │    │  ├── Master (student records)    │    │
│  └────────┬────────┘    │  ├── Offer_Details (offers)      │    │
│           │              │  └── Access (email → role)       │    │
│           │              └──────────────┬───────────────────┘    │
└───────────┼─────────────────────────────┼───────────────────────┘
            │                             │
            ▼                             ▼
┌───────────────────────────────────────────────────────────────┐
│                     Next.js Server                            │
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │  NextAuth     │   │  sheets.ts   │   │  middleware.ts   │  │
│  │  (OAuth flow) │   │  (API client)│   │  (route guard)   │  │
│  └──────┬───────┘   └──────┬───────┘   └──────────────────┘  │
│         │                   │                                  │
│         ▼                   ▼                                  │
│  ┌──────────────┐   ┌──────────────┐                          │
│  │  auth.ts      │   │  data.ts     │                          │
│  │  (config +    │   │  (join +     │                          │
│  │   access list)│   │   anonymize) │                          │
│  └──────────────┘   └──────┬───────┘                          │
│                             │                                  │
│                             ▼                                  │
│                      ┌──────────────┐                          │
│                      │  stats.ts    │                          │
│                      │  (compute)   │                          │
│                      └──────┬───────┘                          │
│                             │                                  │
│                             ▼                                  │
│  ┌──────────────┐   ┌──────────────┐                          │
│  │  cache.ts     │◄─┤  route.ts    │  GET /api/data           │
│  │  (5-min TTL)  │   │  (endpoint)  │                          │
│  └──────────────┘   └──────┬───────┘                          │
│                             │                                  │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                     Browser (Client)                          │
│                                                               │
│  ┌───────────────────┐   ┌────────────────────────────────┐   │
│  │  React Query       │   │  Dashboard Pages               │   │
│  │  (stale: 5min)     │──▶│  ├── Overview  (stat + chart)  │   │
│  │  (gc: 30min)       │   │  ├── CTC       (analytics)     │   │
│  └───────────────────┘   │  ├── Companies (directory)      │   │
│                           │  ├── Students  (admin only)     │   │
│                           │  └── Export    (admin only)     │   │
│                           └────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Data Pipeline

The data flows through a clear sequence of transformations:

### 1. Fetch — `src/lib/sheets.ts`

Raw rows are fetched from Google Sheets via the `googleapis` package using a service account. Three functions correspond to the three tabs:

| Function | Sheet Tab | Returns |
|----------|-----------|---------|
| `fetchMasterSheet()` | Master | Student records (316 rows) |
| `fetchOfferDetails()` | Offer_Details | Individual offers |
| `fetchAccessList()` | Access | Email-to-role mapping |

### 2. Join & Transform — `src/lib/data.ts`

- **`joinStudentRecords()`** — Joins Master + Offer_Details by Roll Number
- Parses enums (`Class`, `Gender`, `Choice`, `Status`, `OfferType`) with validation
- Normalizes company names (removes tags, trims whitespace)
- Computes `bestOffer` per student (ranked by offer type, then CTC)
- **`anonymizeRecord()`** — Strips PII (rollNo, regNo, name) for viewer role

### 3. Compute Statistics — `src/lib/stats.ts`

Six stat computation functions produce the full dashboard dataset:

| Function | Output |
|----------|--------|
| `computeOverviewStats()` | Totals, placement %, class-wise breakdown |
| `computeCTCStats()` | Highest/lowest/avg/median, percentiles, bucket distribution |
| `computeCompanyStats()` | Per-company offer counts, CTC ranges, dates |
| `computeTopOffers()` | Top 10 highest CTC offers |
| `computeMultipleOfferStudents()` | Students with 2+ offers |
| `computeCompanyClassBreakdown()` | Offer distribution by company + class |
| `computeTimelineStats()` | Company visit timeline (date + count) |

### 4. Cache — `src/lib/cache.ts`

An in-memory `Map`-based cache with:

- **TTL**: 5 minutes (configurable in `constants.ts`)
- **Stale fallback**: On fetcher error, returns last successful result
- **Key-based**: Different cache keys for admin vs viewer data

### 5. API Endpoint — `src/app/api/data/route.ts`

Single `GET /api/data` endpoint that:

1. Validates session (authenticated + authorized)
2. Checks cache for fresh data
3. If stale: fetches sheets → joins → computes stats → caches
4. Returns JSON with all stats + student records (anonymized for viewers)

### 6. Client Fetching — `src/hooks/use-dashboard-data.ts`

React Query hook with:

- **`staleTime`**: 5 minutes (matches server cache TTL)
- **`gcTime`**: 30 minutes (keeps data in memory for tab switching)
- **Automatic refetch** on window focus

## Page Architecture

All dashboard pages share the same data hook and follow a consistent pattern:

```
DashboardLayout (nav + content area)
  └── Page Component
       ├── useDashboardData()        ← React Query hook
       ├── Loading state             ← DashboardSkeleton
       ├── Error state               ← Branded error card
       └── Content
            ├── StatCard grid        ← Animated number counters
            ├── ChartCard sections   ← Recharts visualizations
            └── Table sections       ← Sortable data tables
```

### Page Summary

| Route | Component | Access | Content |
|-------|-----------|--------|---------|
| `/dashboard` | `OverviewPage` | All | 11 stat cards, 5 charts, class-wise table |
| `/dashboard/ctc` | `CTCPage` | All | 4 stat cards, histogram, percentile curve, scatter plot, top offers table |
| `/dashboard/companies` | `CompaniesPage` | All | 3 stat cards, stacked bar chart, company directory table |
| `/dashboard/students` | `StudentsPage` | Admin | 6 stat cards, tabbed student tables with expandable offer details |
| `/dashboard/export` | `ExportPage` | Admin | PDF report generator with section selection, CSV export |

## Key Design Decisions

### Single API Endpoint

All dashboard pages consume the same `/api/data` endpoint rather than having per-page endpoints. This simplifies caching (one cache key per role), reduces API calls to Google Sheets, and ensures data consistency across pages.

### Server-Side Statistics

Statistics are computed on the server in `stats.ts` rather than on the client. This keeps bundle size small, ensures consistent calculations, and allows the heavy lifting to happen once per cache miss rather than per page load.

### In-Memory Cache vs Redis

The app uses a simple in-memory `Map` cache rather than Redis/Memcached because:

- Single-instance deployment (Vercel serverless or single Node process)
- Data only needs 5-minute freshness
- Stale fallback handles cold starts gracefully
- Zero infrastructure overhead

### Anonymization at the API Layer

Viewer users receive anonymized records (no roll number, reg number, or name) from the API itself. This means PII never reaches the client for unauthorized users — it's not just hidden in the UI.

### Type Safety

The codebase uses strict TypeScript throughout with:

- Discriminated union types for student records (`StudentRecord | AnonymizedStudentRecord`)
- Branded enum types (`Class`, `Status`, `OfferType`, etc.)
- Validated parsing functions that reject invalid data at the boundary

## File Dependency Graph

```
sheets.ts ──► data.ts ──► stats.ts ──► cache.ts ──► route.ts
                │                                       │
                ▼                                       ▼
           constants.ts                          use-dashboard-data.ts
           format.ts                                    │
           types/*                                      ▼
                                                  Page Components
```

## Security Architecture

See [Authentication](authentication.md) for the full auth flow. Key security measures:

- **Content Security Policy** headers via `next.config.ts`
- **CSRF validation** on API routes
- **Strict Transport Security** (HSTS preload)
- **X-Frame-Options: DENY** to prevent clickjacking
- **Middleware route guards** with role-based checks
- **Server-side anonymization** for viewer role
