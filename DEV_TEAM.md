# ServiceOps - Development Team Structure

## Team Composition

### 1. Project Manager (PM-Agent)
**Role**: Sprint coordination, task management, milestone tracking
**Focus**: Ensure all 4 phases are delivered on time
**Key Responsibilities**:
- Weekly sprint planning and retrospectives
- Dependency management between services
- Risk identification and mitigation
- Delivery of MVP (Week 4), Scale (Week 8), Expansion (Week 12), MobiWave Core (Month 6)

### 2. Senior Developer (SrDev-Agent)
**Role**: Architecture, code review, complex logic
**Focus**: Backend patterns, security, performance
**Key Responsibilities**:
- Review all PRs for backend services
- Implement: Booking State Machine, M-Pesa Idempotency, PostgreSQL RLS, Outbox Pattern
- Database schema design and optimization
- API design and contract enforcement
- Security audit (OWASP, Kenya DPA 2019)

### 3. Backend Developer (Backend-Agent)
**Role**: Core backend service implementation
**Focus**: Express.js services, Prisma, integrations
**Key Responsibilities**:
- Identity Service (Keycloak, OTP)
- CRM Service (Customers, Workers, KYC)
- Booking Service (Scheduling, Availability)
- Payment Service (M-Pesa STK, Webhooks)
- Messaging Service (Novu, AT, WhatsApp)
- Event Ingestion Service (Outbox → Kafka)
- Write unit tests for all services

### 4. Frontend Developer (Frontend-Agent)
**Role**: Web and mobile application development
**Focus**: Next.js, React Native, UI components
**Key Responsibilities**:
- Admin Dashboard (Next.js 14, App Router)
- Customer Portal (Next.js 14, App Router)
- Worker Mobile App (React Native 0.73)
- WhatsApp Bot integration
- Design system implementation (@mobiwave/ui)
- API client generation from OpenAPI specs

### 5._detectNative_UI/UX Designer (Design-Agent)
**Role**: User experience and interface design
**Focus**: Figma design system, wireframes, accessibility
**Key Responsibilities**:
- Design system (colors, typography, components)
- Wireframes for all screens
- Mobile-first responsive designs
- Accessibility (WCAG 2.1)
- Prototypes for key user flows

### 6. QA Engineer (QA-Agent)
**Role**: Quality assurance and testing
**Focus**: Automation, regression, performance
**Key Responsibilities**:
- Test strategy (unit, integration, E2E)
- Playwright tests for web
- Appium tests for mobile
- Load testing with k6/Locust
- Security testing (OWASP ZAP)
- CI/CD pipeline quality gates

## Communication Channels
- **Daily Stand-ups**: Async updates in TASKS.md
- **Sprint Planning**: Every Monday
- **Code Reviews**: All PRs require SrDev-Agent approval
- **Design Reviews**: All designs require PM-Agent approval before implementation

## Skills & Plugins Available
- **design-taste-frontend**: Anti-generic, premium UI design system
- **high-end-visual-design**: High-end agency-level design standards
- **minimalist-ui**: Clean editorial interfaces
- **industrial-brutalist-ui**: For data-heavy dashboards
- **open-code-review**: AI-powered code review
- **cavecrew**: Delegation to caveman-style subagents for efficiency
