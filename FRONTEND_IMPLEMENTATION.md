# MobiWave Core — Frontend Applications Implementation Plan
## Senior Frontend Engineer / UX Systems Architect / Design Systems Engineer View

**Version:** 1.0
**Date:** June 2026
**Status:** Approved for Implementation
**Constraint:** Strictly consumes backend services from BACKEND_IMPLEMENTATION.md

---

## 1. Frontend System Overview

### 1.1 Application Architecture

We deploy a **multi-application monorepo** with three primary entry points serving distinct personas, unified by a single design system and shared state logic.

| Application | Framework | Target | Network Profile |
|-------------|-----------|--------|-----------------|
| **Admin Console** | Next.js 14 (App Router) | Desktop (desktop-first, responsive) | Stable broadband |
| **Tenant Portal** | Next.js 14 (App Router) | Desktop + Tablet + Mobile | Variable (corporate) |
| **Worker App** | React Native 0.73 | Mobile (iOS/Android) | Intermittent 3G/4G |

**Communication Layer:**
- **Admin/Tenant**: REST via `api-gateway` (sync), Server-Sent Events (SSE) for real-time updates.
- **Worker App**: REST via `api-gateway` (sync), background sync queue for offline mutations.

### 1.2 Multi-Tenant UI Strategy

- **Tenant Resolution:** Subdomain (`{tenant}.mobiwave.co.ke`) or `x-tenant-id` header.
- **Dynamic Theming:** Tenant-specific CSS variables injected at runtime from `/api/v1/tenants/:id/branding`.
- **Feature Gating:** UI components render based on tenant's `enabled_features` array.
- **White-Label:** Logo, primary color, font family, and favicon are overridable per tenant.

### 1.3 Routing Strategy

**Next.js App Router (Admin/Tenant):**
- `/[tenant]/dashboard` — Scoped per tenant
- `/[tenant]/bookings`
- `/[tenant]/workers`
- `[tenant]/payments`
- `/(admin)/super-admin/tenants` — Super-admin (no tenant prefix)

**React Native (Worker):**
- Stack navigation for deep flows (JobDetails → StartJob → CompleteJob).
- Tab navigation for primary sections (Jobs, Earnings, Profile).

### 1.4 State Management Strategy

| State Type | Tool | Scope |
|------------|------|-------|
| Server State | TanStack Query (React Query) | Caching, background refetching, deduping |
| Global UI | Zustand | Modals, toasts, theme, tenant context |
| Auth | Zustand + Keycloak JS | JWT, user profile, roles |
| Worker Offline | Redux Toolkit + MMKV | Offline-first queue, pending mutations |

### 1.5 API Integration Strategy

- **REST:** `ky` HTTP client with interceptors for auth, tenant headers, and error handling.
- **Generated SDK:** OpenAPI generator to produce TypeScript clients from backend specs.
- **Real-time:** SSE for Admin/Tenant live dashboards (bookings, payments).
- **Background Sync (Worker):** Mutations queued in Redux Toolkit + persisted via MMKV, flushed on reconnect.

---

## 2. Frontend Monorepo Structure

```
mobiwave-frontend/
├── apps/
│   ├── admin/                    # Next.js — Super Admin Console
│   ├── tenant/                   # Next.js — Tenant/Customer Portal
│   ├── worker/                   # React Native — Worker Mobile App
│   └── landing/                  # Next.js — Marketing site (SEO)
├── packages/
│   ├── @mobiwave/ui/             # Design System (React components)
│   ├── @mobiwave/hooks/          # Shared React hooks
│   ├── @mobiwave/lib/            # Utilities, types, constants
│   ├── @mobiwave/api/            # Generated API clients (OpenAPI)
│   ├── @mobiwave/auth/           # Keycloak integration, auth guards
│   ├── @mobiwave/query/          # TanStack Query wrappers, configs
│   ├── @mobiwave/form/           # React Hook Form + Zod schemas
│   └── @mobiwave/analytics/      # PostHog / Segment frontend wrapper
├── tooling/
│   ├── eslint-config/
│   ├── ts-config/
│   ├── tailwind-config/
│   └── storybook/
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 3. Application Breakdown

### 3.1 Admin Console (Super Admin)

**Purpose**: Manage tenants, global config, system health.
**User Roles**: `SUPER_ADMIN`
**Key Screens**:
- `/tenants` — CRUD tenants, view quotas, manage features
- `/tenants/:id/settings` — Configure tenant defaults (currency, commission, payment providers)
- `/system/health` — Service uptime, queue depth, error rates
- `/system/audit-logs` — Global audit log viewer

**APIs**: `crm-service` (tenants), `analytics-service` (health), internal endpoints.

### 3.2 Tenant Portal (Admin/Manager/Supervisor)

**Purpose**: Operate the business (cleaning agency, caregiver agency, etc.).
**User Roles**: `ADMIN`, `SUPERVISOR`
**Key Screens**:
- `/dashboard` — KPIs, charts (revenue, active workers, pending jobs)
- `/bookings` — Table, calendar, kanban views
- `/bookings/:id` — Detail view, timeline, assign worker, cancel
- `/workers` — Directory, KYC status, reliability score, earnings
- `/customers` — Directory, booking history, loyalty points
- `/payments` — Transactions, refunds, reconciliation status
- `/settings` — Business profile, service catalog, cancellation policies
- `/analytics` — Custom reports, funnel analysis

**APIs**: All core services.

### 3.3 Identity Management UI

**Purpose**: User, role, and permission management.
**Key Screens**:
- `/users` — Table with filters (role, status, tenant)
- `/users/:id` — Profile, KYC docs, bookings, actions (suspend, impersonate)
- `/roles` — Keycloak role mapping, custom permissions
- `/permissions` — Granular permission matrix

**APIs**: `identity-service`, `crm-service`.

### 3.4 Billing & Payments UI

**Purpose**: Invoicing, subscription, transaction management.
**Key Screens**:
- `/invoices` — List, filter, download PDF
- `/transactions` — Real-time feed of M-Pesa callbacks
- `/subscriptions` — Plan management, upgrade/downgrade
- `/refunds` — Initiate B2C refunds, track status

**APIs**: `payments-service`, `billing-service` (Phase 4).

### 3.5 Rewards Dashboard

**Purpose**: Manage referrals, promotions, loyalty.
**Key Screens**:
- `/referrals` — Referral codes, conversion funnel
- `/promotions` — Create/edit promo codes (`SUMMER20`)
- `/loyalty` — Points ledger, tier management

**APIs**: `rewards-service`.

### 3.6 Analytics Dashboard

**Purpose**: Business intelligence.
**Key Screens**:
- `/reports` — Pre-built reports (Revenue, Worker Utilization, Cohort)
- `/dashboards` — Drag-and-drop custom dashboards (Phase 4)
- `/audience` — Customer segmentation, churn prediction

**APIs**: `analytics-service`.

### 3.7 Scheduling Interface

**Purpose**: Calendar-based booking management.
**Key Screens**:
- `/calendar` — FullCalendar or similar, drag-to-assign
- `/slots` — Bulk availability management for workers
- `/recurring` — Recurring rule builder (weekly, monthly)

**APIs**: `booking-service`, `dispatch-service`.

### 3.8 AI Assistant Interface (Phase 3)

**Purpose**: Internal AI tools.
**Key Screens**:
- `/ai/chat` — Internal AI chatbot (admin training, policy Q&A)
- `/ai/prompts` — Manage prompt templates
- `/ai/usage` — Cost tracking per tenant

**APIs**: `ai-orchestrator-service`.

---

## 4. Design System

### 4.1 Technology

- **Tailwind CSS** for atomic styling.
- **Radix UI** for accessible primitives (dialogs, dropdowns, tooltips).
- **shadcn/ui** as the base component architecture.
- **Framer Motion** for animations.
- **Lucide React** for icons.

### 4.2 Typography

| Token | Font | Fallback | Usage |
|-------|------|----------|-------|
| `font-sans` | Inter | system-ui, sans-serif | Body, UI |
| `font-display` | Plus Jakarta Sans | Inter | Headlines, brand |
| `font-mono` | JetBrains Mono | monospace | Code, data |

Scale: 12, 14, 16, 18, 20, 24, 30, 36, 48, 60px (tailwind default with custom ramp).

### 4.3 Color System

```css
:root {
  /* Brand primary (overrideable per tenant) */
  --color-primary-500: #2563eb;
  --color-primary-600: #1d4ed8;
  
  /* Functional */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
  
  /* Neutral (slate) */
  --color-surface-50: #f8fafc;
  --color-surface-100: #f1f5f9;
  ...
  --color-surface-900: #0f172a;
  
  /* Text */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
}

[data-theme="dark"] {
  --color-surface-50: #0f172a;
  --color-text-primary: #f8fafc;
  /* ... */
}
```

**Tenant Override:**
```typescript
// Fetched at runtime
const theme = await fetch(`/api/v1/tenants/${tenantId}/branding`).then(r => r.json());
// theme.primaryColor -> --color-primary-500
```

### 4.4 Spacing System

Tailwind default (4px base): p-1 (4px), p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px), p-12 (48px).

### 4.5 Component Library

Shared in `@mobiwave/ui`.

**Atoms:**
- `Button` (variants: solid, outline, ghost, danger, loading)
- `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`
- `Badge` (status, count, dot)
- `Avatar`, `Skeleton`, `Spinner`

**Molecules:**
- `DataTable` (sortable, filterable, paginated, row actions)
- `FormField` (label + input + error wrapper)
- `StatCard` (title, value, trend, icon)
- `Timeline` (vertical, for booking/job history)
- `EmptyState` (icon, title, action)

**Organisms:**
- `BookingCard` (status badge, worker avatar, time, actions)
- `WorkerCard` (KYC status, reliability score, actions)
- `PaymentReceipt` (M-Pesa styled receipt component)
- `Sidebar` (tenant-branded, role-based navigation)
- `Header` (search, notifications, tenant switcher, profile)

### 4.6 Layout Grid

- **Admin/Tenant**: 12-column grid, max-width 1440px, sidebar 280px.
- **Mobile**: Single column, bottom sheet for modals.

---

## 5. Component Architecture

### 5.1 Atomic Design

```
packages/ui/
  atoms/
    Button.tsx, Input.tsx, Badge.tsx, ...
  molecules/
    DataTable.tsx, FormField.tsx, StatCard.tsx, ...
  organisms/
    BookingCard.tsx, WorkerCard.tsx, Sidebar.tsx, Header.tsx, ...
  templates/
    DashboardLayout.tsx, AuthLayout.tsx, SettingsLayout.tsx
```

### 5.2 Domain-Specific Components

**Bookings:**
- `BookingCalendar` (FullCalendar wrapper)
- `BookingForm` (service, address, date, time picker)
- `BookingStatusBadge` (colored, animated for in-progress)
- `BookingTimeline` (PENDING → CONFIRMED → ASSIGNED → ...)

**Workers:**
- `WorkerAvailabilityGrid` (weekly view, toggle slots)
- `WorkerKycUploader` (drag-and-drop, progress)
- `WorkerEarningsChart` (Recharts)

**Payments:**
- `MpesastkDialog` (phone input, amount, confirm)
- `TransactionFeed` (real-time infinite scroll)
- `ReconciliationTable` (side-by-side M-Pesa vs System)

---

## 6. API Integration Layer

### 6.1 API Client

```typescript
// packages/api/src/client.ts
import ky from 'ky';

export const apiClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = useAuthStore.getState().accessToken;
        const tenantId = useTenantStore.getState().currentTenant?.id;
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
        if (tenantId) request.headers.set('X-Tenant-ID', tenantId);
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          // Attempt refresh via Keycloak
          await refreshToken();
          return ky(request);
        }
        if (!response.ok) throw await response.json();
        return response;
      },
    ],
  },
});
```

### 6.2 Authentication Flow (Keycloak)

1. User navigates to `/auth/login`.
2. Keycloak JS adapter redirects to Keycloak login page (or custom UI if configured).
3. On success, Keycloak redirects back with `code`.
4. Frontend exchanges `code` for tokens via `identity-service`.
5. Tokens stored in `HttpOnly` cookie (Secure, SameSite=Strict) via Next.js API route.
6. Zustand auth store hydrated from cookie on app load.

### 6.3 Error Handling

- **Network Error**: Retry 3 times with exponential backoff. If offline (Worker App), queue in Redux.
- **400 Bad Request**: Display field errors inline (Zod validation).
- **401 Unauthorized**: Redirect to login.
- **403 Forbidden**: Display "Access Denied" empty state.
- **500 Server Error**: Toast "Something went wrong. Please try again." Log to Sentry.
- **M-Pesa Timeout**: Show "Waiting for payment confirmation" spinner. Poll `GET /payments/:id/status`.

### 6.4 Retry Strategy

```typescript
const retryStrategy = (failureCount: number, error: any) => {
  if (error.response?.status >= 500) return failureCount < 3;
  if (error.response?.status === 429) return failureCount < 5; // Rate limited
  return false;
};
```

### 6.5 Caching Strategy

- **TanStack Query**: Stale time 5 minutes for static data (services, catalog). GC time 10 minutes.
- **Optimistic Updates**: Booking status changes (ASSIGNED → ACCEPTED) update UI immediately before server confirmation.
- **Worker App (Offline)**: API responses cached in MMKV. Stale-while-revalidate on reconnect.

---

## 7. State Management Strategy

### 7.1 Global State (Zustand)

```typescript
// stores/tenant.store.ts
export const useTenantStore = create<TenantStore>((set) => ({
  currentTenant: null,
  branding: null,
  setTenant: (tenant) => set({ currentTenant: tenant }),
  setBranding: (branding) => set({ branding }),
}));

// stores/auth.store.ts
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  roles: [],
  setUser: (user) => set({ user }),
  logout: () => { /* clear cookie, redirect */ },
}));
```

### 7.2 Server State (TanStack Query)

```typescript
// hooks/useBookings.ts
export const useBookings = (filters: BookingFilters) => {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => apiClient.get('v1/bookings', { searchParams: filters }).json(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// hooks/useCreateBooking.ts
export const useCreateBooking = () => {
  return useMutation({
    mutationFn: (data: BookingCreateDto) => apiClient.post('v1/bookings', { json: data }).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
};
```

### 7.3 Worker Offline State (Redux Toolkit + MMKV)

```typescript
// worker/store/offlineSlice.ts
const offlineSlice = createSlice({
  name: 'offline',
  initialState: { queue: [] as OfflineAction[] },
  reducers: {
    queueAction: (state, action) => { state.queue.push(action.payload); },
    clearQueue: (state) => { state.queue = []; },
  },
});

// On app start (or reconnect), flush queue:
// dispatch(clearQueue()) after all actions succeed.
```

---

## 8. Multi-Tenancy UI Architecture

### 8.1 Tenant Resolution

**Route-based:**
- URL: `https://agency-a.mobiwave.co.ke/dashboard`
- Middleware extracts `agency-a` → fetches tenant config → injects into `TenantProvider`.

**Header-based (fallback for custom domains):**
- `X-Tenant-ID: uuid` header added by API client.

### 8.2 Theme Switching

```typescript
// components/TenantProvider.tsx
const TenantProvider = ({ children }) => {
  const { branding } = useTenantStore();
  
  useEffect(() => {
    if (branding?.primaryColor) {
      document.documentElement.style.setProperty('--color-primary-500', branding.primaryColor);
    }
  }, [branding]);
  
  return <>{children}</>;
};
```

### 8.3 Data Isolation

- **Current Tenant ID**: Stored in Zustand, prepended to all TanStack Query keys: `['tenant-a', 'bookings']`.
- **LocalStorage/MMKV**: Segmented by `tenant_id` to prevent cross-tenant leakage.

### 8.4 Role-Based UI Rendering

```typescript
// components/RoleGuard.tsx
const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuthStore();
  if (!allowedRoles.includes(user.role)) return null;
  return <>{children}</>;
};

// Usage:
<RoleGuard allowedRoles={['ADMIN', 'SUPERVISOR']}>
  <ReconciliationTable />
</RoleGuard>
```

---

## 9. Core UI Modules

### 9.1 Identity Module

**Users:**
- **Table**: Sortable by role, status, last login. Row actions: Edit, Reset Password, Suspend.
- **Form**: Create/Edit user. Fields: first_name, last_name, phone, email, role, tenant.
- **Detail View**: Profile card, booking history, KYC docs grid, audit log timeline.

**Roles & Permissions:**
- **Matrix**: Table with roles (rows) vs permissions (columns). Checkbox to toggle.
- **Keycloak Sync**: "Sync to Keycloak" button triggers `identity-service` update.

### 9.2 Scheduling Module

**Calendar View:**
- **Component**: `FullCalendar` with custom event rendering.
- **Views**: Day, Week, Month.
- **Interactions**: Click empty slot → Create booking. Click event → View/Edit.
- **Color coding**: By service type or worker.

**Booking Flow:**
1. Select service (dropdown with price)
2. Select address (map picker, uses Google Maps or OSRM)
3. Select date (calendar, filters available days)
4. Select time slot (list, grays out taken slots)
5. Review & Confirm → Triggers M-Pesa STK (Tenant Portal) or Cash (Worker)

**Availability Management:**
- **Grid**: 7 days x 24 hours. Toggle on/off. Bulk edit ("Copy Monday to Friday").

### 9.3 Messaging Module

**Inbox:**
- **List**: WhatsApp/SMS/Email threads. Filter by channel, status.
- **Detail View**: Chat bubble UI. Preloaded templates ("Booking confirmed", "Worker en route").
- **Actions**: Reply, Send Template, Mark Resolved.

**Campaigns:**
- **Create**: Select audience (segment), compose message (supports vars like `{{first_name}}`), schedule.
- **Analytics**: Delivery rate, open rate (SMS links), click rate.

### 9.4 Payments Module

**Transactions:**
- **Feed**: Infinite scroll, real-time SSE updates. Filter by status (PENDING, COMPLETED, FAILED), date range.
- **Row**: Receipt number, amount, customer, worker, M-Pesa status badge.
- **Action**: View receipt (download PDF), Initiate refund (B2C).

**Invoices:**
- **Table**: Invoice number, customer, total, status, due date.
- **Actions**: Download PDF, Send reminder, Void.

### 9.5 AI Module (Phase 3)

**Chat Interface:**
- **Layout**: Sidebar (conversation history), Main (chat bubbles, input).
- **Features**: Model selector (OpenAI/Gemini), Temperature slider, System prompt preview.
- **Tool Calling**: If AI returns a tool call (e.g., `check_booking_status`), render a card with the result inline.

**Prompt History:**
- **Table**: Timestamp, prompt, model, tokens used, cost.
- **Actions**: Re-run, Save as template, Delete.

### 9.6 Analytics Module

**Dashboard:**
- **KPI Grid**: Revenue (vs last period), Active Workers, Bookings Today, Avg. Rating.
- **Charts**: Line (revenue over time), Bar (bookings by service), Pie (payment methods).
- **Real-time**: SSE updates chart data every 30 seconds.

**Reports:**
- **Pre-built**: Revenue Report, Worker Utilization, Customer Cohort.
- **Custom**: Drag-and-drop fields, filters, export (CSV, PDF).

---

## 10. Event-Driven UI Updates

### 10.1 Real-Time Infrastructure

**Admin/Tenant:**
- **SSE (Server-Sent Events)**: `EventSource` connects to `/api/v1/events/stream`.
- **Events**: `booking.updated`, `payment.completed`, `worker.assigned`.
- **Handler**: Updates TanStack Query cache directly (`queryClient.setQueryData`).

**Worker App:**
- **Polling**: 30-second interval for job status updates (battery conscious).
- **Push Notifications**: Expo push for critical events ("New job available").

### 10.2 Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateBookingStatus,
  onMutate: async (newStatus) => {
    await queryClient.cancelQueries({ queryKey: ['bookings', bookingId] });
    const previous = queryClient.getQueryData(['bookings', bookingId]);
    queryClient.setQueryData(['bookings', bookingId], (old) => ({ ...old, status: newStatus }));
    return { previous };
  },
  onError: (err, newStatus, context) => {
    queryClient.setQueryData(['bookings', bookingId], context.previous);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookings', bookingId] }),
});
```

---

## 11. Performance Strategy

### 11.1 Next.js Optimizations

- **Server Components**: Default. Fetch data server-side where possible (SEO, initial load).
- **Streaming**: Suspense boundaries around heavy components (charts, maps).
- **Image Optimization**: `next/image` with WebP, lazy loading.
- **Font Optimization**: `next/font` for Inter/Plus Jakarta Sans.

### 11.2 Code Splitting

- **Route-level**: Automatic via Next.js App Router.
- **Component-level**: `dynamic(() => import('./HeavyChart'), { ssr: false })` for charts.
- **Vendor split**: Separate chunks for `recharts`, `fullcalendar`, etc.

### 11.3 Bundle Optimization

- **Tree Shaking**: Ensure packages are ESM.
- **Dependency Audit**: `npm run analyse` with `@next/bundle-analyzer`.
- **Dead code removal**: Biome/ESLint `no-unused-modules`.

### 11.4 Worker App (React Native)

- **Hermes Engine**: Enabled for smaller bundle, faster startup.
- **Metro config**: `inlineRequires: true`.
- **Image handling**: `react-native-fast-image` for caching.
- **State hydration**: MMKV is synchronous and fast.

### 11.5 African Connectivity

- **Low bandwidth**: Default to low-res images (`?w=400&q=50`). Manual "HD" toggle.
- **Offline support**: Worker app queues mutations. Admin/Tenant shows "Offline mode" banner with limited functionality.
- **Lazy loading**: Intersection Observer for below-the-fold content.

---

## 12. Security (Frontend)

### 12.1 Token Storage

- **Admin/Tenant**: `HttpOnly` cookies (Secure, SameSite=Strict). Never touches `localStorage`.
- **Worker App**: Keychain (iOS) / Keystore (Android) via `react-native-keychain`.

### 12.2 XSS Prevention

- DOMPurify for any user-generated HTML (e.g., AI chat responses).
- CSP headers set via Next.js `headers` config.
- `dangerouslySetInnerHTML` banned via ESLint rule.

### 12.3 CSRF Protection

- SameSite cookies mitigate most CSRF.
- For cross-origin APIs, `X-CSRF-Token` header validated server-side.

### 12.4 Role-Based Rendering

```typescript
// hooks/usePermissions.ts
export const usePermission = (permission: string) => {
  const { user } = useAuthStore();
  return user.permissions.includes(permission);
};

// components/SecureAction.tsx
<SecureAction permission="payments.refund">
  <Button>Refund</Button>
</SecureAction>
```

### 12.5 Secure API Handling

- API base URL from environment variable (not hardcoded).
- Error responses never contain stack traces in production.
- Sentry scrubs PII (phone numbers, emails) before sending.

---

## 13. Deployment Strategy

### 13.1 Build System

- **Turborepo**: Caching for fast builds.
- **Next.js**: `next build` for static export or server-side.
- **React Native**: `expo build` or `eas build`.

### 13.2 Hosting

- **Admin/Tenant**: Vercel (optimal for Next.js) or AWS Amplify.
- **Worker App**: Apple App Store, Google Play Store.
- **Landing**: Vercel (static sites, edge caching).

### 13.3 Environment Separation

| Environment | URL | API Base |
|-------------|-----|----------|
| Local | `http://localhost:3000` | `http://localhost:3001` |
| Staging | `https://staging.mobiwave.co.ke` | `https://api-staging.mobiwave.co.ke` |
| Production | `https://app.mobiwave.co.ke` | `https://api.mobiwave.co.ke` |

### 13.4 CI/CD Pipeline

GitHub Actions:
1. **Lint + Type Check**: `pnpm lint`, `pnpm type-check`.
2. **Unit Tests**: `pnpm test`.
3. **Build**: `pnpm build` (verifies no build errors).
4. **Deploy**: Vercel CLI for web, EAS CLI for mobile.
5. **Smoke Tests**: Playwright for critical flows (login, booking, payment).

### 13.5 Monitoring

- **Sentry**: Error tracking, performance monitoring.
- **PostHog**: Product analytics, funnels, feature flags.
- **LogRocket**: Session replay (with PII scrubbing).

---

## 14. Build Roadmap

### Phase 1 — Core UI (Weeks 1-4)

**Deliverables:**
- Monorepo scaffold (Turborepo, Tailwind, shadcn/ui)
- `@mobiwave/ui` (atoms, molecules)
- `@mobiwave/auth` (Keycloak integration)
- `@mobiwave/api` (generated clients)
- **Tenant Portal**: Login, Dashboard skeleton, Bookings (CRUD), Payments (view)
- **Worker App**: Login, Jobs list, Job detail, Accept/Decline actions

**Dependencies:**
- Backend API contracts finalized
- Keycloak realm configured
- M-Pesa sandbox for payment testing

**Risks:**
- Keycloak JS adapter compatibility with Next.js App Router
- React Native offline queue complexity

### Phase 2 — Admin + Identity + Billing (Weeks 5-8)

**Deliverables:**
- **Admin Console**: Tenant management, system health, audit logs
- **Identity UI**: User/Role/Permission management
- **Billing UI**: Invoices, transactions, subscriptions
- **Messaging UI**: Inbox, campaigns, templates
- **Tenant Settings**: Branding, service catalog, cancellation policies

**Dependencies:**
- `identity-service` stable
- `payments-service` B2C/refund endpoints ready
- `messaging-service` templates configured

**Risks:**
- Complex role/permission matrix UI
- M-Pesa callback handling in UI (polling vs SSE)

### Phase 3 — Scheduling + CRM (Weeks 9-12)

**Deliverables:**
- **Scheduling**: FullCalendar integration, drag-to-assign, recurring rules
- **CRM**: Customer directory, worker KYC workflows, address management
- **Advanced Bookings**: Rescheduling, cancellations, no-show handling
- **Rewards UI**: Referral codes, promotions, loyalty points

**Dependencies:**
- `booking-service` availability endpoint
- `crm-service` KYC upload flow
- `rewards-service` referral logic

**Risks:**
- Calendar performance with many events
- Mobile responsiveness of complex scheduling UI

### Phase 4 — AI + Analytics (Months 4-5)

**Deliverables:**
- **AI Chat**: Internal admin tool, prompt management, cost tracking
- **Analytics Dashboards**: Recharts integration, KPI cards, report builder
- **Real-time**: SSE integration for live booking/payment updates
- **Advanced Worker App**: Earnings charts, document upload, profile editing

**Dependencies:**
- `ai-orchestrator-service` deployed
- `analytics-service` ClickHouse pipeline running
- PostHog/Segment integration

**Risks:**
- AI response latency affecting UX
- Real-time SSE scalability

### Phase 5 — Optimization & Scaling (Month 6)

**Deliverables:**
- **Performance**: Bundle analysis, image optimization, prefetching
- **Accessibility**: WCAG 2.1 AA audit, screen reader testing
- **Mobile Polish**: Worker app animations, offline UX, push notifications
- **Documentation**: Storybook, API docs, runbooks
- **Handover**: Knowledge transfer to operations/support team

**Dependencies:**
- Lighthouse CI integration
- QA team for manual testing
- Design final sign-off

**Risks:**
- Scope creep from accumulated feedback
- Third-party library updates breaking builds

