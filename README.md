# Offerwatch

A full-stack job application tracker built for software engineers actively in a job search. Track applications through the entire hiring pipeline, prep for interviews, and spot patterns in your search — all in one place.

**Live app:** https://job-boards.greenhouse.io/calendly/jobs/8464846002?gh_src=ma4uqj152us

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=flat-square&logo=spring)
![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=java)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

---

## Features

### Application Pipeline
- Track every application through **Saved → Applied → Phone Screen → Technical Interview → Final Round → Offer → Rejected**
- Inline status changes directly from the dashboard table — no page navigation needed
- **Last activity** column with color-coded staleness indicators (fresh / recent / stale / ghosted)
- Sortable, sticky-header table with horizontal + vertical scrolling

### Application Detail
- Per-application **notes** with timestamps
- **Contacts** with name, title, email, phone, and LinkedIn
- **Follow-ups** with due dates and completion tracking
- Resume version tracking and cover letter notes
- Application-specific questions (for custom prompts like "Why do you want to work here?")

### Analytics
- Metrics bar with live counts by status on the dashboard
- Full **Stats page**: summary cards, interview pipeline funnel with conversion rates, applications by source, and activity insights (applied this week / month, awaiting response, possible ghosting)

### Interview Preparation
- **50+ curated questions** organized by category (Behavioral, Technical, Situational, Culture & Fit, Logistics) — structured as a senior recruiter would present them
- Save any question to your personal notes with your own answer
- "Use This" button pre-fills your notes from any suggested question

### Behavioral Stories (STAR Method)
- Write stories once in **Situation / Task / Action / Result** format
- Organize by theme: Leadership, Failure, Teamwork, Conflict, Achievement, and more
- Tag each story with the question variations it can answer
- Filter by theme; expand/edit/delete inline

### Auth & Security
- JWT-based authentication with BCrypt password hashing
- All data is scoped to the authenticated user — no cross-user data access
- Free-tier cap (10 active applications) with Pro account bypass

---

## Architecture

```
offerwatch/
├── offerwatch-api/          # Spring Boot REST API
│   ├── controller/          # REST endpoints (Applications, Notes, Contacts, Follow-ups,
│   │                        #   Interview Prep, Behavioral Stories)
│   ├── entity/              # JPA entities (User, Application, Note, Contact, Followup,
│   │                        #   InterviewPrep, BehavioralStory)
│   ├── repository/          # Spring Data JPA repositories
│   ├── service/             # Business logic + free-tier enforcement
│   ├── security/            # JWT filter, BCrypt, Spring Security config
│   └── config/              # CORS, DotEnv loader (reads .env at startup)
│
└── offerwatch-frontend/     # Angular 21 SPA
    └── src/app/
        ├── core/
        │   ├── guards/      # Auth guard
        │   ├── interceptors/# JWT bearer token interceptor
        │   ├── models/      # TypeScript interfaces
        │   └── services/    # API service layer
        ├── features/
        │   ├── dashboard/           # Application table + metrics bar
        │   ├── application-detail/  # Notes, contacts, follow-ups, docs
        │   ├── stats/               # Analytics page
        │   ├── interview-prep/      # Suggested questions + personal notes
        │   └── behavioral-stories/  # STAR method story builder
        └── layout/          # Shared navigation shell
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21, Angular Material (M3), SCSS, RxJS, Signals |
| Backend | Java 21, Spring Boot 4, Spring Security 7, Hibernate 7 |
| Database | PostgreSQL on Supabase (Supavisor connection pooler) |
| Auth | JWT (JJWT 0.12), BCryptPasswordEncoder |
| Build | Maven (API), Angular CLI (frontend) |

---

## Running Locally

### Prerequisites
- Java 21+
- Node.js 20+ / npm
- A [Supabase](https://supabase.com) project with the schema below

### 1. Database

Create the following tables in your Supabase project (SQL Editor):

```sql
-- Users
create table users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text not null,
  password   text not null,
  is_pro     boolean not null default false,
  created_at timestamptz default now()
);

-- Applications
create table applications (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id) on delete cascade,
  company               text not null,
  role_title            text,
  status                text not null default 'saved'
                          check (status in ('saved','applied','phone_screen','technical_interview','final_round','offer','rejected')),
  stage_reached         text
                          check (stage_reached in ('saved','applied','phone_screen','technical_interview','final_round','offer')),
  location              text,
  job_url               text,
  salary_min            integer,
  salary_max            integer,
  applied_date          date,
  source                text,
  application_questions text,
  resume_version        text,
  cover_letter_notes    text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Notes
create table notes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  body           text not null,
  created_at     timestamptz default now()
);

-- Contacts
create table contacts (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  name           text not null,
  title          text,
  email          text,
  phone          text,
  linkedin_url   text
);

-- Follow-ups
create table followups (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  reason         text,
  due_date       date,
  completed      boolean not null default false
);

-- Interview prep
create table interview_prep (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  category   text not null default 'General',
  question   text not null,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Behavioral stories
create table behavioral_stories (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id) on delete cascade,
  theme                 text not null,
  title                 text,
  situation             text,
  task                  text,
  action                text,
  result                text,
  applicable_questions  text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
```

#### Migrating an existing database

If you already have an `applications` table, run this in Supabase SQL Editor:

```sql
-- 1. Drop old constraint
alter table applications drop constraint applications_status_check;

-- 2. Rename existing 'interview' rows BEFORE the new constraint is applied
update applications set status = 'technical_interview' where status = 'interview';

-- 3. Add new constraint
alter table applications
  add constraint applications_status_check
  check (status in ('saved','applied','phone_screen','technical_interview','final_round','offer','rejected'));

-- 4. Add stage_reached column (tracks furthest stage reached, even after rejection)
alter table applications
  add column if not exists stage_reached text
    check (stage_reached in ('saved','applied','phone_screen','technical_interview','final_round','offer'));

-- 5. Backfill stage_reached for existing rows
update applications set stage_reached = status where status != 'rejected';
```

### 2. API

```bash
cd offerwatch-api

# Copy and fill in your secrets
cp .env.example .env
# Edit .env with your Supabase connection string, DB password, and JWT secret

# Run
./mvnw spring-boot:run
# API starts at http://localhost:8080
```

### 3. Frontend

```bash
cd offerwatch-frontend
npm install
ng serve
# App opens at http://localhost:4200
```

---

## Environment Variables

All secrets are read from environment variables — nothing is hardcoded. See [`offerwatch-api/.env.example`](offerwatch-api/.env.example) for the full list.

| Variable | Description |
|---|---|
| `DB_URL` | JDBC URL for Supabase Supavisor pooler |
| `DB_USERNAME` | Supabase DB username (`postgres.<project-ref>`) |
| `DB_PASSWORD` | Supabase DB password |
| `JWT_SECRET` | HS256 signing secret (min 32 chars, use `openssl rand -hex 64`) |
| `PORT` | Server port (default: `8080`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins (default: `http://localhost:4200`) |

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready. Protected — no direct pushes. Merge via PR from `dev`. |
| `dev` | Active development. Default branch for all feature work. |

```
feature/xyz  →  dev  →  (PR)  →  main
```

All day-to-day work branches off `dev`. When `dev` is stable and tested, open a pull request into `main` to cut a release.

---

## Roadmap

- [ ] Deploy API to Railway / Render
- [ ] Deploy frontend to Vercel
- [ ] Stripe integration for Pro tier subscriptions
- [ ] Resume version file storage (S3 / Supabase Storage)
- [ ] Email reminders for follow-ups
- [ ] Mobile-responsive improvements
- [ ] Dark mode

---

## License

MIT
