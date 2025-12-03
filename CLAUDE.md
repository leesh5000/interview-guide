# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interview Guide (DevInterview) is a Korean-language web application for developer interview preparation. It allows administrators to create, manage, and publish interview questions with answers, while users can browse and study from the published content.

## Development Commands

```bash
# Start development server (runs on port 3001)
npm run dev

# Build for production
npm run build

# Start production server (port 3001)
npm start

# Run linting
npm run lint

# Start infrastructure (PostgreSQL + pgAdmin)
docker compose -f docker-compose.infra.yml up -d

# Prisma commands
npx prisma generate       # Generate Prisma client after schema changes
npx prisma migrate dev    # Create and run migrations
npx prisma db push        # Push schema changes without migration
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: PostgreSQL via Prisma ORM
- **UI**: shadcn/ui components (Radix UI primitives) + Tailwind CSS v4
- **Theming**: next-themes for dark/light mode support
- **Markdown**: @uiw/react-md-editor for editing, react-markdown + @tailwindcss/typography for rendering
- **AI**: OpenAI API (gpt-4o-mini) for generating question summaries

### Directory Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - REST API endpoints (questions, categories, target-roles, auth, ai)
- `src/app/admin/` - Admin dashboard (protected routes)
- `src/components/ui/` - shadcn/ui base components
- `src/components/admin/` - Admin-specific components (QuestionForm, MarkdownEditor)
- `src/lib/` - Utilities (prisma client, auth helpers, openai client)
- `src/types/` - TypeScript type definitions
- `prisma/` - Database schema and migrations

### Key Data Models
- **Category**: Interview question categories (database, network, etc.)
- **TargetRole**: Target audience roles (backend developer, frontend developer, etc.)
- **InterviewQuestion**: Questions with markdown body/answer, target roles, tags, AI summary, and related courses

### Authentication
Simple cookie-based admin auth using `ADMIN_PASSWORD` environment variable. Auth logic in `src/lib/auth.ts`.

### API Patterns
- GET endpoints are public
- POST/PUT/DELETE endpoints check `isAuthenticated()` and return 401 if unauthorized
- All question/category mutations require admin authentication

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_PASSWORD` - Admin login password
- `OPENAI_API_KEY` - For AI summary generation

## Styling Conventions

- Dark mode uses custom hex colors (not Tailwind defaults): `dark:bg-[#0a0a0a]`, `dark:bg-[#111111]`, `dark:bg-[#141414]`, `dark:border-[#1a1a1a]`
- Always pair light and dark mode classes together (e.g., `bg-white dark:bg-[#141414]`)
- Use `transition-colors` on containers for smooth theme transitions

## Notes

- The app uses Korean for all user-facing content
- Markdown content is stored in `questionBody` (question details) and `answerContent` (answer) fields
- Related courses support affiliate URLs (primarily for Inflearn links)
- Questions filtering supports combining category and target role filters via URL params (`?category=xxx&role=yyy`)