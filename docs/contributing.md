# Contributing

[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Code_Style-Consistent-F7B93E?logo=prettier&logoColor=black)](https://prettier.io/)

## Development Setup

### Prerequisites

- **Node.js** >= 18.17
- **npm** >= 9
- Environment variables configured (see [README](../README.md))

### Getting Started

```bash
# Install dependencies
npm install

# Start dev server with Turbopack
npm run dev

# Open http://localhost:3000
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload (Turbopack) |
| `npm run build` | Production build — **always run before pushing** |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint |

---

## Code Style

### TypeScript

- **Strict mode** is enabled — no `any` types unless explicitly suppressed with `// eslint-disable-next-line`
- Use **explicit return types** on exported functions
- Prefer **interfaces** over type aliases for object shapes
- Use the domain types from `src/types/` — don't create ad-hoc string unions

### React

- **Functional components** only (no class components)
- **Server Components** by default; add `"use client"` only when needed (hooks, interactivity)
- Colocate page-specific components with their page
- Shared components go in `src/components/`

### Styling

- **Tailwind CSS 4** with `@theme inline` in `globals.css`
- Use brand color tokens (`blue-500`, `gold-400`) instead of raw hex values
- Use the `cn()` utility from `src/lib/utils` to merge class names
- Follow the existing gradient patterns for consistency
- shadcn/ui components use the **New York** style variant

### File Organization

```
src/
├── app/          # Pages and API routes (Next.js App Router)
├── components/   # Reusable React components
│   ├── dashboard/  # Dashboard-specific components
│   └── ui/         # shadcn/ui base components
├── lib/          # Server-side utilities and business logic
├── hooks/        # Client-side React hooks
├── types/        # TypeScript type definitions
├── config/       # App configuration
└── providers/    # React context providers
```

---

## Adding a New Dashboard Page

### 1. Create the Page

```bash
mkdir -p src/app/dashboard/your-page
```

Create `src/app/dashboard/your-page/page.tsx`:

```tsx
"use client";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton";
import { DataFreshness } from "@/components/dashboard/data-freshness";

export default function YourPage() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-md">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
        <div className="p-6 text-center">
          <p className="text-error">Failed to load data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-gray-900">
            Your Page
          </h1>
          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
        </div>
        <DataFreshness timestamp={data.timestamp} />
      </div>

      {/* Your content here */}
    </div>
  );
}
```

### 2. Add Navigation Entry

In `src/config/site.ts`:

```typescript
export const navItems: NavItem[] = [
  // ... existing items
  { label: "Your Page", href: "/dashboard/your-page", adminOnly: false },
];
```

### 3. Add Nav Icon

In `src/app/dashboard/nav.tsx`, add to `NAV_ICONS`:

```typescript
import { YourIcon } from "lucide-react";

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  // ... existing icons
  "/dashboard/your-page": YourIcon,
};
```

### 4. Protect Route (if admin-only)

Set `adminOnly: true` in the nav item. The middleware automatically gates routes for pages listed as admin-only.

---

## Adding a shadcn/ui Component

```bash
npx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`. See the [shadcn/ui docs](https://ui.shadcn.com/) for available components.

---

## Design Conventions

### Stat Cards

Use the `StatCard` component with an icon and color:

```tsx
<StatCard
  title="Metric Name"
  value={42}
  icon={IconComponent}
  iconColor="text-blue-500"
/>
```

Available `iconColor` values: `text-blue-500`, `text-gold-500`, `text-purple-500`, `text-green-500`, `text-red-500`, `text-gray-500`, `text-success`, `text-error`, `text-warning`, `text-info`.

### Chart Cards

Wrap charts in `ChartCard` for consistent styling:

```tsx
<ChartCard title="Chart Title" description="Optional description">
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      {/* Recharts component */}
    </ResponsiveContainer>
  </div>
</ChartCard>
```

### Error States

Use the branded error card pattern:

```tsx
<div className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-md">
  <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
  <div className="p-6 text-center">
    <p className="text-error">Error message here.</p>
  </div>
</div>
```

### Heading with Gradient Underline

Every page title uses this pattern:

```tsx
<div>
  <h1 className="font-heading text-3xl font-semibold text-gray-900">
    Page Title
  </h1>
  <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-500 to-gold-400" />
</div>
```

---

## Known Quirks

- **Recharts Tooltip**: Use `(value) =>` not `(value: number) =>` in formatter callbacks (TypeScript overload issue)
- **CTC values**: Stored in rupees (not lakhs). Use `formatINR()` / `formatINRCompact()` from `src/lib/format.ts`
- **`StudentRecord` vs `AnonymizedStudentRecord`**: Use `as StudentRecord[]` cast before `.filter(isStudentRecord)` due to discriminated union types
- **Next.js 16 middleware**: Shows deprecation warning for "proxy" — still works correctly
- **Sheet tab names**: Must be exactly `Master`, `Offer_Details`, `Access` (underscore in Offer_Details)

---

## Commit Guidelines

- Write clear, concise commit messages
- Prefix with type: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`
- Always run `npm run build` before pushing to verify there are no errors
- Keep PRs focused on a single change

---

## Troubleshooting

### Build Failures

```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

### Type Errors

```bash
# Check types without building
npx tsc --noEmit
```

### Stale Data in Development

The in-memory cache persists across hot reloads. Restart the dev server to clear:

```bash
# Ctrl+C to stop, then:
npm run dev
```
