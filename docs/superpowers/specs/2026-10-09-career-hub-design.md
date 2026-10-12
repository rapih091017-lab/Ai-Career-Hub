# Career Hub and Navigation Design

Date: 2026-10-09
Status: Approved for spec drafting; awaiting spec review

## Goal

Turn Career Hub into a public, searchable library of practical career-learning posts that admins can create and publish. Condense the landing-page header navigation so key destinations remain easy to find on desktop and mobile.

Initial audience: Indonesian job seekers, fresh graduates, and professionals. Initial content focus: careers and job seeking, with room for AI learning material.

## User experience

### Navigation

Desktop header shows four compact destinations: **Fitur**, **Harga**, **Career Hub**, and **Dashboard**.

- **Fitur** dropdown links to existing CV Builder, ATS Checker, Portfolio, and Cover Letter destinations.
- **Harga** links to the existing pricing section.
- **Career Hub** dropdown links to existing career resources: Career Hub home, job listings, CV examples, interview preparation, and job tracker.
- **Dashboard** links to the existing dashboard.
- Existing login, signup, profile, and language controls remain available in their current positions and retain their behavior.

Dropdowns use the existing React and Motion stack, Material Symbols, and teal design tokens. They open by click and keyboard activation, close on Escape, outside click, and destination selection. Hover may open desktop menus but is not the only way to operate them. Mobile navigation remains a hamburger menu; grouped destinations become accessible accordions. Each destination must resolve to an existing route or anchor.

### Public Career Hub

`/career-hub` becomes an article index. Users can:

- Search by title, summary, or article text.
- Filter by category and tags.
- Open an article detail page at `/career-hub/[slug]`.
- Copy/share the article URL.

The index prioritizes published posts, newest first. Categories initially include CV and ATS, Interview, Job Search Strategy, Skills and Learning, AI for Careers, and Workplace. An empty state explains that no articles match and offers a way to clear search/filters. Loading and error states are also required.

Article detail displays title, summary, category, tags, cover image when present, publication date, and formatted article content. Drafts must never appear in public queries or render at a public slug.

### Admin publishing

Add `/admin/career-hub` using current admin authorization, admin layout, API conventions, form styles, confirmation modal, and toast patterns.

Admins can list and search posts, filter by Draft/Published, create, edit, preview, save as draft, publish, unpublish, and delete with confirmation. Publishing is manual; scheduling is out of scope.

Post fields: title, generated editable slug, summary, article content, category, tags, optional cover image, status, publication timestamp, and created/updated timestamps. Validate required title/content/category and unique slug. Editing a published post preserves its publication date unless it is unpublished and later republished.

The first editor is a simple accessible textarea with preview, not a new rich-text dependency. Persist content in a format that safely supports paragraphs and headings and renders escaped text; do not interpret arbitrary HTML from post content.

Cover image upload reuses the current upload flow for this first phase. Its base64 storage constraints are accepted only for this phase; upload architecture must not be treated as the future solution for large document attachments.

## Data and API

Add a Drizzle `career_hub_posts` table with:

- UUID primary key.
- Unique slug.
- Title, summary, content.
- Cover image URL, nullable.
- Category and tags.
- Draft/Published status.
- Nullable publication timestamp.
- Created and updated timestamps.

Provide public read endpoints for paginated/filterable published posts and published post-by-slug. Search must be parameterized and limited to published posts. Admin endpoints require existing admin authorization and support CRUD plus publish/unpublish transitions. Request schemas validate lengths, allowed status/category values, tag count/length, and pagination bounds.

Use existing database migration and deployment conventions. Do not add dependencies for the first-phase editor or search.

## Out of scope, explicitly deferred

- DOCX/PDF import as article content.
- DOCX/PDF downloadable attachments.
- Scheduled publishing.
- Comments, reactions, author profiles, social feed ranking, and user-generated posts.
- External object-storage provider selection and migration.
- Reworking unrelated site headers; this navigation change targets landing-page header unless existing shared-header behavior is required to keep Career Hub navigation consistent.

DOCX/PDF import and attachments are a remembered future phase. They are not part of current implementation scope.

## Design direction

Reading this as a product publishing workflow and career-learning library for job seekers, using the existing teal system, familiar controls, and restrained motion. Dials: ENERGY 2 / RHYTHM 2 / MOTION 1.

- Keep visual language consistent with `DESIGN.md`, while not copying TealHQ layouts or branding.
- Use hierarchy and whitespace for readable articles; cards only where they distinguish article summaries from the surrounding index.
- Avoid fabricated sample posts, testimonials, statistics, people, and claims. Empty states must remain honest until admins publish real content.
- Responsive behavior is structural and mobile-first; controls have visible keyboard focus and accessible labels.
- Motion only communicates dropdown/accordion state and respects reduced-motion preference.

## Verification

- Migration applies to an empty database and an existing database using repository conventions.
- Public list/search/category/tag queries expose published posts only; draft slug requests return not found.
- Admin endpoints reject unauthenticated and non-admin requests.
- CRUD, slug collisions, publish/unpublish, deletion confirmation, and image upload failures have clear handling.
- Search and filters compose correctly, including empty results, loading, and API failure.
- Desktop dropdown works by pointer and keyboard; Escape and outside click close it.
- Mobile grouped menu opens/closes and navigation closes after selecting a destination.
- Run lint, type checks if available, focused tests, and production build.
- Verify mobile and desktop layout and reduced-motion behavior in browser if available; otherwise report code/build verification only.

## Open implementation details

- Use repository's established migration mechanism after inspecting current Drizzle migrations.
- Use existing public API response conventions and admin auth helpers.
- Reconcile partial uncommitted dropdown edits before implementation; preserve unrelated user changes.
