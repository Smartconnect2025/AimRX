# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

### Testing

No test framework is currently configured in this project.

## Architecture Overview

This is a Next.js 15 healthcare application built with a feature-first architecture pattern. Key
architectural decisions:

### Tech Stack

- **Frontend**: Next.js 15.4.5, React 19, TypeScript
- **Styling**: Tailwind CSS v4, ShadCN UI components (Radix UI)
- **Database**: Supabase with Drizzle ORM for schema management
- **State Management**: Zustand for complex state
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Supabase Auth with role-based access control

### Directory Structure

- `app/` - Next.js App Router pages and API routes
- `core/` - Core utilities (auth, database, routing, config)
- `features/` - Self-contained feature modules
- `components/ui/` - Reusable ShadCN UI components
- `components/layout/` - Layout-specific components
- `hooks/` - Global custom hooks

### Feature Architecture

Each feature in `features/` follows a modular pattern:

- `README.md` - Feature documentation (required)
- `index.ts` - Barrel exports (required)
- `components/` - Feature-specific components
- `hooks/` - Feature-specific hooks
- `services/` - Business logic and API calls
- `store/` - Zustand state management
- `types.ts` - Type definitions
- `utils.ts` - Feature utilities

### Database Approach

- **Schema**: Drizzle ORM schemas in `core/database/schema/`
- **Queries**: Use Supabase client for all CRUD operations
- **Types**: Import types from Drizzle schemas using `InferSelectModel`/`InferInsertModel`
- **Migrations**: Use Drizzle kit for schema changes

### Key Features

This healthcare platform includes:

- **Basic EMR**: Patient management, encounters, medical records
- **Telehealth**: Video calling, provider search, appointment booking
- **Product Catalog**: Supplements/medications with cart functionality
- **Vitals Integration**: Health data from wearable devices
- **Labs Integration**: Lab test ordering and results
- **Symptoms/Mood Tracking**: Patient health monitoring
- **Provider Management**: Availability, profiles, order review

### Authentication & Routing

- Role-based access control (user, provider, admin)
- Route protection via middleware using `core/routing`
- User context available via `useUser()` hook from `@core/auth`

### Styling & Components

- Tailwind CSS v4 with design tokens in `app/theme.css`
- ShadCN UI components in `components/ui/`
- Form components use React Hook Form + Zod validation

### Development Patterns

1. **Feature First**: New functionality goes in `features/` directory
2. **Separation**: Keep Next.js routing (`app/`) separate from React logic (`features/`)
3. **Type Safety**: Use Drizzle-generated types throughout
4. **Clean Imports**: Use barrel files (`index.ts`) for feature exports
5. **Database**: Use Supabase for queries, Drizzle for schema/types only

### Important rules to follow

- Never commit or push to git, unless specifically asked.
- Never run `npm run dev`. The user will run it if they need to.
- Never run `npm run build`. If you want to test your code, run `npm run lint`
- Never run database related commands, unless specifically asked.

## Development Commands

### Core Development

```bash
npm run lint           # Run ESLint and TypeScript checks
npm run format         # Format code with Prettier
```

### Database Management (Drizzle ORM)

```bash
npm run db:generate migration_name     		# Generate new migration
npm run db:generate-custom migration_name  	# Generate custom migration (no schema update)
npm run db:migrate                     		# Apply pending migrations
npm run db:check                       		# Check migration status
npm run db:seed                        		# Seed database with test data
```
