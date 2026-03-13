# Learn Platform (تعلّم)

## Overview

Learn Platform is an AI-powered multilingual e-learning platform targeting Arabic-speaking learners. The platform offers courses, learning tracks, and an AI-powered study plan generator that creates personalized learning paths based on user goals, experience, and preferences.

Key features include:
- Course catalog with categories and curriculum management
- AI Agent for personalized study plan generation
- Multi-language support (Arabic, English, French) with RTL/LTR switching
- Dark/Light theme toggle
- User authentication and admin dashboard
- Stripe payment integration for subscriptions and course purchases

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **Styling**: Tailwind CSS v4 with shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Internationalization**: i18next with browser language detection
- **Animations**: Framer Motion for UI transitions
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based architecture with reusable components. Pages are located in `client/src/pages/` and shared components in `client/src/components/`. Path aliases are configured (`@/` for client src, `@shared/` for shared code).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: express-session with PostgreSQL store (connect-pg-simple)
- **Authentication**: Custom session-based auth with bcrypt password hashing
- **API Structure**: RESTful routes organized by domain (`/api/auth`, `/api/admin-panel`, `/api/courses`, etc.)

Routes are modularized in `server/routes/` directory. Admin routes are protected by role-based middleware checking against admin email. The server serves the Vite-built frontend in production.

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `server/db/schema.ts`
- **Key Tables**: users, categories, courses, sections, lessons, enrollments, orders, adminAuditLogs
- **Session Storage**: PostgreSQL-backed sessions for production reliability

### Authentication & Authorization
- Session-based authentication stored in PostgreSQL
- Admin access controlled by email whitelist (ADMIN_EMAIL env var)
- Session ID fallback via localStorage for development scenarios
- Rate limiting on API routes (100 requests per 15 minutes)

### Payment Integration
- Stripe Checkout for course purchases and subscriptions
- Webhook handling for payment confirmation at `/api/webhooks/stripe`
- Orders and enrollments created upon successful payment

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing for course purchases and subscriptions
- **PostgreSQL**: Primary database (DATABASE_URL environment variable)
- **OpenAI**: Planned integration for AI-powered study plan generation (not yet implemented)

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe API key for payments
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook verification
- `ADMIN_EMAIL`: Email address for admin access
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: Legacy admin credentials

### NPM Dependencies (Notable)
- `drizzle-orm` + `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `i18next` + `react-i18next`: Internationalization
- `framer-motion`: Animations
- `stripe`: Payment processing
- `bcrypt`: Password hashing
- `express-session` + `connect-pg-simple`: Session management