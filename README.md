# Offerwatch

A full-stack job application tracker built for software engineers actively in a job search. Track applications through the entire hiring pipeline, prep for interviews, and spot patterns in your search — all in one place.

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=flat-square&logo=spring)
![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=java)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

---

## Features

### Application Pipeline
- Track every application through **Saved → Applied → Phone Screen → Interview → Offer → Rejected**
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
                          check (status in ('saved','applied','phone_screen','interview','offer','rejected')),
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
| `COOKIE_SECURE` | `true` in production (HTTPS) so the JWT cookie is only sent over TLS. `false` for local HTTP. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins (default: `http://localhost:4200`). Not exercised in production when the SPA and API share one origin via CloudFront. |

---

## Deployment (AWS)

Production runs entirely on AWS. The database stays on Supabase.

| Piece | AWS service |
|---|---|
| Angular SPA | **S3** (static files) behind **CloudFront** (CDN + HTTPS) |
| Spring Boot API | Docker image in **ECR**, run by **App Runner** |
| Routing | One CloudFront distribution serves the SPA and proxies `/api/*` to App Runner |

Serving the API under the same CloudFront domain (at `/api/*`) keeps the frontend and
API on one origin. The auth cookie is `SameSite=Lax`, so a single origin is what makes
login work in production without loosening cookie security, and no CORS is needed.

### Architecture

```
                         ┌──────────────────────────────────────┐
  Browser ── HTTPS ──▶   │            CloudFront                 │
                         │  default behavior  →  S3 (Angular)    │
                         │  /api/*  behavior  →  App Runner (API)│
                         └──────────────────────────────────────┘
                                                 │
                                                 ▼
                                    Supabase (PostgreSQL)
```

### One-time AWS setup

You do these once in the AWS Console (or CLI). All region-specific resources should live
in the **same region** (e.g. `us-east-1`).

**0. Create an AWS account**
- Go to https://aws.amazon.com → *Create an AWS Account*. You'll need an email, a
  password, and a payment card (there's a free tier; this app's footprint is a few
  dollars/month at low traffic).
- Sign in to the **root** account once, then create an **IAM admin user** (IAM →
  Users → Create user → attach `AdministratorAccess`) and use that day to day instead
  of root.

**1. ECR repository (for the API image)**
- ECR → *Create repository* → private → name it `offerwatch-api`.
- Note the repo name; the region is your `AWS_REGION`.

**2. App Runner service (the API)**
- App Runner → *Create service* → Source: **Container registry** → Amazon ECR →
  browse to the `offerwatch-api` repo, tag `latest`.
- Deployment trigger: **Manual** (the GitHub Action triggers deploys explicitly).
- Port: `8080`.
- Add environment variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`,
  `COOKIE_SECURE=true`. (Store `DB_PASSWORD` and `JWT_SECRET` as App Runner secrets
  backed by Secrets Manager / SSM if you prefer.)
- First create will fail to find an image until the API workflow has pushed one — that's
  fine; push first (see below), then point the service at the repo.
- Copy the service's **default domain** (`xxx.<region>.awsapprunner.com`) and its
  **service ARN**.

**3. S3 bucket (the SPA)**
- S3 → *Create bucket* → name it (e.g. `offerwatch-frontend`), keep **Block all public
  access ON** (CloudFront reaches it privately via OAC).

**4. CloudFront distribution**
- CloudFront → *Create distribution*.
- **Origin 1 (SPA):** the S3 bucket. Use **Origin Access Control (OAC)** and let
  CloudFront update the bucket policy. Make this the **default cache behavior**.
- **Origin 2 (API):** add a second origin with the App Runner default domain as a
  *custom origin* (HTTPS only).
  - Add a **cache behavior** with path pattern `/api/*` pointing at this origin.
  - Cache policy: **CachingDisabled**.
  - Origin request policy: **AllViewerExceptHostHeader** (App Runner rejects a
    forwarded viewer `Host` header, so it must be excluded; this still forwards
    cookies, the `Authorization` header, and query strings).
  - Allowed methods: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`.
- **SPA routing:** add a *Custom error response* mapping `403` and `404` to
  `/index.html` with HTTP `200` so Angular's client-side routes resolve on refresh.
- Default root object: `index.html`.
- (Optional) attach a custom domain + ACM certificate.
- Copy the **distribution ID** and note the domain.

**5. GitHub → AWS trust (OIDC, no stored keys)**
- IAM → *Identity providers* → *Add provider* → **OpenID Connect**:
  - Provider URL: `https://token.actions.githubusercontent.com`
  - Audience: `sts.amazonaws.com`
- IAM → *Roles* → *Create role* → **Web identity** → the provider above → restrict the
  trust policy to this repo, e.g. `repo:<owner>/<repo>:*`.
- Attach a policy granting just what the workflows need: ECR push
  (`ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`,
  `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`,
  `ecr:PutImage`, `ecr:BatchGetImage`), App Runner
  (`apprunner:StartDeployment`, `apprunner:DescribeService`), S3 (`s3:PutObject`,
  `s3:DeleteObject`, `s3:ListBucket` on the bucket), and CloudFront
  (`cloudfront:CreateInvalidation`).
- Copy the **role ARN**.

### GitHub repository configuration

Settings → Secrets and variables → Actions.

**Secrets**
| Name | Value |
|---|---|
| `AWS_ROLE_ARN` | ARN of the OIDC role from step 5 |
| `APP_RUNNER_SERVICE_ARN` | ARN of the App Runner service from step 2 |

**Variables**
| Name | Example |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `ECR_REPOSITORY` | `offerwatch-api` |
| `S3_BUCKET` | `offerwatch-frontend` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E123ABC456DEF` |
| `DEPLOY_ALLOWED_USERS` | (optional) comma-separated GitHub usernames allowed to deploy |

### Deploying

Both workflows are manual (`workflow_dispatch`). From the **Actions** tab:

- **Deploy API** — builds the Docker image, pushes it to ECR (`latest` + commit SHA),
  triggers an App Runner deployment, and waits for the service to return to `RUNNING`.
- **Deploy Frontend** — runs `npm ci && npm run build`, syncs `browser/` to S3 (long
  cache for hashed assets, no-cache for `index.html`), and invalidates CloudFront.

The very first time, run **Deploy API** once so an image exists in ECR, then finish
wiring the App Runner service to that repo (step 2).

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

- [x] Deploy API to AWS App Runner (ECR)
- [x] Deploy frontend to AWS S3 + CloudFront
- [ ] Stripe integration for Pro tier subscriptions
- [ ] Resume version file storage (S3 / Supabase Storage)
- [ ] Email reminders for follow-ups
- [ ] Mobile-responsive improvements
- [ ] Dark mode

---

## License

MIT
