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

# Testing (Vitest + React Testing Library)
npm run test              # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:coverage     # Run tests with coverage report
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: PostgreSQL via Prisma ORM
- **UI**: shadcn/ui components (Radix UI primitives) + Tailwind CSS v4
- **Theming**: next-themes for dark/light mode support
- **Markdown**: @uiw/react-md-editor for editing, react-markdown + @tailwindcss/typography for rendering
- **AI**: OpenAI API (gpt-4o-mini) for generating question summaries
- **Testing**: Vitest + React Testing Library + jsdom

### Directory Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - REST API endpoints (questions, categories, target-roles, auth, ai)
- `src/app/admin/` - Admin dashboard (protected routes)
- `src/components/ui/` - shadcn/ui base components
- `src/components/admin/` - Admin-specific components (QuestionForm, MarkdownEditor, BulkQuestionForm)
- `src/lib/` - Utilities (prisma client, auth helpers, openai client, bulk-parser)
- `src/hooks/` - Custom React hooks (useFormPersistence for form state persistence)
- `src/types/` - TypeScript type definitions
- `src/__tests__/` - Test files (API, components, lib utilities)
- `prisma/` - Database schema and migrations

### Key Data Models
- **Category**: Interview question categories (database, network, etc.)
- **TargetRole**: Target audience roles (backend developer, frontend developer, etc.)
- **InterviewQuestion**: Questions with markdown body/answer, target roles, tags, AI summary, and related courses
- **SuggestionRequest**: Community edit suggestions for questions (pending/approved/rejected status, IP-based rate limiting)
- **CourseClick**: Tracks affiliate link clicks per question (upsert pattern for incrementing counts)
- **Course**: Reusable course registry with affiliate URLs and thumbnails (auto-fetched via OG metadata)

### Authentication
Simple cookie-based admin auth using `ADMIN_PASSWORD` environment variable. Auth logic in `src/lib/auth.ts`.

### API Patterns
- GET endpoints are public
- POST/PUT/DELETE endpoints check `isAuthenticated()` and return 401 if unauthorized
- All question/category mutations require admin authentication
- Suggestion submissions (`POST /api/suggestions`) are public but rate-limited by IP (1 request per minute)

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (with `?pgbouncer=true&connection_limit=1` for Supabase)
- `DIRECT_URL` - Direct PostgreSQL connection for migrations (Supabase Session mode)
- `ADMIN_PASSWORD` - Admin login password
- `OPENAI_API_KEY` - For AI summary generation

## Deployment

Production runs on **Vercel + Supabase**:
- Vercel handles the Next.js app deployment (region: `icn1` Seoul, configured in `vercel.json`)
- Supabase provides PostgreSQL with PgBouncer connection pooling (region: `ap-northeast-2` Seoul)
- Migrations run automatically on Vercel via `prebuild` script (`prisma generate && prisma migrate deploy`)
- Speed Insights enabled via `@vercel/speed-insights`

### Migration Workflow
- **Local development**: Use `npx prisma migrate dev --name <name>` to create new migrations
- **Production**: Migrations deploy automatically on Vercel build
- **Warning**: Never use `npx prisma db push` for schema changes intended for production - it doesn't create migration files

## Styling Conventions

Design system follows Vercel's minimalist aesthetic with CSS variables defined in `globals.css`.

### Color Palette (CSS Variables)
- **Background**: `bg-background` (Light: #fafafa, Dark: #000000)
- **Foreground**: `text-foreground` (Light: #000000, Dark: #ededed)
- **Card**: `bg-card` (Light: #ffffff, Dark: #111111)
- **Border**: `border-border` (Light: #eaeaea, Dark: #333333)
- **Muted**: `text-muted-foreground` (Light: #666666, Dark: #888888)
- **Primary**: `bg-primary` (Light: black button, Dark: white button)

### Usage Guidelines
- Use CSS variable classes instead of hardcoded colors (e.g., `text-foreground` not `text-gray-900 dark:text-white`)
- Use `transition-colors` on containers for smooth theme transitions
- Cards: `bg-card border border-border rounded-lg`
- Headers: `bg-background/80 backdrop-blur-sm border-b border-border`

## Common Patterns

### Hydration Safety for Client Components
When using Radix UI components (Popover, Dialog, etc.) that generate IDs, use the `mounted` state pattern to prevent hydration mismatches:
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
if (!mounted) return <FallbackUI />;
return <RadixComponent />;
```

### Affiliate Link Click Tracking
Course links use `CourseCard` component with click tracking via `/api/course-clicks` (POST to increment, GET to fetch counts).

### Bulk Question Registration
Admin can paste formatted text at `/admin/questions/bulk` to register multiple questions at once:
- Parser in `src/lib/bulk-parser.ts` extracts category, tags, title, body, and answer from structured text
- Each question's category is manually mapped via dropdown in the preview UI
- Target roles can be set globally or per-question

### Form State Persistence
`useFormPersistence` hook in `src/hooks/` saves form data to sessionStorage/localStorage to prevent data loss on accidental navigation or refresh. Used in QuestionForm and SuggestionForm.

## Notes

- The app uses Korean for all user-facing content
- Markdown content is stored in `questionBody` (question details) and `answerContent` (answer) fields
- Related courses support affiliate URLs with thumbnails (auto-fetched via OG image API at `/api/og-image`)
- Questions filtering supports combining category and target role filters via URL params (`?category=xxx&role=yyy`)
- Community suggestion workflow: User submits edit → Admin reviews in `/admin/suggestions` → Approve (applies changes, increments `reviewCount`) or Reject