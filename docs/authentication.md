# Authentication & Authorization

[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4-B845ED?logo=auth0&logoColor=white)](https://next-auth.js.org/)
[![Google OAuth](https://img.shields.io/badge/Google_OAuth-2.0-4285F4?logo=google&logoColor=white)](https://developers.google.com/identity/protocols/oauth2)

## Overview

The dashboard uses **Google OAuth 2.0** via NextAuth.js v4 for authentication and a **Google Sheet-driven access list** for authorization. There are two roles: `admin` (full access) and `viewer` (anonymized data, no export).

## Auth Flow

```
User visits /dashboard
        │
        ▼
┌─────────────────┐    No session    ┌──────────────┐
│  middleware.ts   │ ───────────────► │  /login       │
│  (route guard)   │                  │  (OAuth page) │
└─────────────────┘                  └──────┬───────┘
        │                                    │
        │ Has session                        │ Click "Sign in with Google"
        │                                    ▼
        │                            ┌──────────────┐
        │                            │  Google OAuth │
        │                            │  Consent      │
        │                            └──────┬───────┘
        │                                    │
        │                                    ▼
        │                            ┌──────────────────┐
        │                            │  NextAuth callback│
        │                            │  signIn()         │
        │                            └──────┬───────────┘
        │                                    │
        │                    ┌───────────────┼───────────────┐
        │                    ▼               ▼               ▼
        │            ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
        │            │ Email in     │ │ Email in     │ │ Email NOT    │
        │            │ Access sheet │ │ Access sheet │ │ in Access    │
        │            │ role: admin  │ │ role: viewer │ │ sheet        │
        │            └──────┬──────┘ └──────┬──────┘ └──────┬───────┘
        │                   │               │               │
        │                   ▼               ▼               ▼
        │            JWT: role=admin  JWT: role=viewer  Sign-in blocked
        │                   │               │          (returns false)
        │                   ▼               ▼
        ▼            ┌──────────────────────────┐
┌─────────────────┐  │  /dashboard              │
│  Check role      │◄─┤  (authenticated)         │
│  for route       │  └──────────────────────────┘
└────────┬────────┘
         │
    ┌────┼────────────────────┐
    ▼    ▼                    ▼
 /dashboard/*          /dashboard/students
 (all roles)           /dashboard/export
                       (admin only → else /access-denied)
```

## Roles

| Role | Access | Data |
|------|--------|------|
| `admin` | All pages including Students & Export | Full PII (names, roll numbers, reg numbers) |
| `viewer` | Overview, CTC Analytics, Companies only | Anonymized records (no PII) |

## Access List

Authorization is driven by the **Access** tab in the Google Sheet:

| Column A | Column B |
|----------|----------|
| Email address | Role (`admin` or `viewer`) |

Example:

```
john@university.edu     admin
jane@university.edu     viewer
```

- The access list is **cached in-memory for 1 minute** to reduce API calls
- Users whose email is **not in the Access sheet** are blocked from signing in
- Unknown visitors are **logged** to the Access sheet (fire-and-forget, no role granted)

## Configuration

### `src/lib/auth.ts`

NextAuth configuration with:

```typescript
{
  providers: [GoogleProvider({ clientId, clientSecret })],
  session: { strategy: "jwt", maxAge: 3600 },  // 1 hour
  callbacks: {
    signIn: async ({ user }) => {
      // Check email against Access sheet
      // Block if not found, assign role if found
    },
    jwt: async ({ token, user }) => {
      // Embed role into JWT token
    },
    session: async ({ session, token }) => {
      // Expose role on session.user.role
    },
  },
}
```

### `src/middleware.ts`

Route protection middleware:

```typescript
// Protected routes: /dashboard/*
// Admin-only routes: /dashboard/students, /dashboard/export
// Unauthorized admin routes redirect to /access-denied
```

### `src/lib/session.ts`

Helper functions for server-side session access:

| Function | Purpose |
|----------|---------|
| `getSession()` | Get current session (or null) |
| `requireSession()` | Throw if not authenticated |
| `requireAdmin()` | Throw if not admin role |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXTAUTH_URL` | Canonical app URL (used for callbacks) |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth 2.0 client identifier |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth 2.0 client secret |

## Security Considerations

1. **JWT Strategy** — Sessions are stateless JWTs (no database needed), signed with `NEXTAUTH_SECRET`
2. **Server-Side Role Check** — The API endpoint checks roles server-side; the middleware is a UX convenience, not the sole security boundary
3. **Data Anonymization** — Viewer-role API responses strip PII at the server before any data reaches the client
4. **CSRF Protection** — API routes validate the `Origin` header against `NEXTAUTH_URL`
5. **No Client-Side Role Spoofing** — Roles are embedded in the JWT by the server and cannot be modified by clients
