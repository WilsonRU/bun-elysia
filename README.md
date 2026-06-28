# 🚀 Bun + Elysia + Kysely

This project is built using **Bun** as the JavaScript/TypeScript
runtime, **Elysia** as the lightweight and expressive API framework, and
**Kysely** as the type-safe SQL query builder and ORM.
It also includes the **OpenAPI** and **CORS** plugins for Elysia.

## 📦 Tech Stack

-   **Bun** --- Ultra-fast JS/TS runtime
-   **ElysiaJS** --- Modern, minimal API framework
    -   **@elysiajs/openapi** for automatic API documentation
    -   **@elysiajs/cors** for CORS handling
-   **Kysely ORM** --- Type-safe database queries
-   **Database migrations** controlled via CLI
-   **Biome** --- performant linter

## 🛠️ Development

Start the development server:

``` bash
bun dev
```

Open the application at:

👉 http://localhost:3000/

## 🗄️ Database Migrations (Kysely)

### Run all migrations:

``` bash
bun migrate:run
```

### Create a new migration:

``` bash
bun migrate:create <name-of-migration>
```

## 📘 API Documentation

OpenAPI documentation is automatically generated using the Elysia
OpenAPI plugin.

After starting the server, access:

👉 `/docs` --- Scalar UI\
👉 `/openapi.json` --- Raw OpenAPI schema

## 🔧 Available Scripts

  Command                Description
  ---------------------- ----------------------------------------------
  `bun dev`              Starts the development server.\
  `bun migrate:run`      Applies all pending migrations.\
  `bun migrate:create`   Generates a new migration file.\
  `bun lint`             Runs Biome linter to check code quality.\
  `bun format`           Formats all project files using Biome.\
  `bun run format:check` Checks formatting without writing files.\
  `bun run typecheck`    Runs TypeScript type checking.\
  `bun run test`         Runs the test suite.\
  `bun run check`        Runs format check, typecheck, lint, and tests.\
  `bun run ci`           Runs the local CI checks and production build.\
  `bun run build`        Builds the project for production.

## 🧭 API Routes

  Method   Path                         Description
  -------- ---------------------------- ---------------------------------
  `GET`    `/health`                    Liveness check.
  `GET`    `/ready`                     Readiness check with database ping.
  `POST`   `/auth/signin`               Authenticates a user and returns a JWT.
  `POST`   `/auth/signup`               Registers a new user.
  `PUT`    `/user/`                     Updates the authenticated user name.
  `POST`   `/user/avatar`               Uploads the authenticated user avatar.
  `GET`    `/user/avatars/:filename`    Returns an authenticated avatar file.

## 📂 Project Structure

    src/
    ├─ adapters/
    │  ├─ db/
    │  │  ├─ migrations/
    │  │  │  └─ 001_create_users_table.ts     # Database migration files
    │  │  ├─ scripts/
    │  │  │  ├─ create.ts                     # CLI script to generate migrations
    │  │  │  └─ migrate.ts                    # CLI script to run migrations
    │  │  └─ kysely.ts                        # Kysely database client configuration
    │  ├─ http/
    │  │  ├─ middlewares/
    │  │  │  ├─ auth.ts                       # Authentication and RBAC middleware
    │  │  │  ├─ errorHandler.ts               # Global error handler
    │  │  │  └─ rateLimit.ts                  # In-memory rate limiting middleware
    │  │  ├─ routes/
    │  │  │  └─ health.ts                     # Health and readiness routes
    │  │  ├─ security/
    │  │  │  └─ jwt.ts                        # JWT generation/validation utilities
    │  │  └─ elysia.ts                        # Elysia server configuration and plugins
    │  └─ storage/
    │     └─ objectStorage.ts                  # Local/S3-compatible object storage adapter
    │
    ├─ config/
    │  └─ env.ts                               # Environment variables loading
    │
    ├─ modules/                                # Bounded context
    │  ├─ auth/                                
    │  │  ├─ core.ts                           # Authentication business functions.
    │  │  ├─ routes.ts                         # Authentication HTTP routes
    │  │  └─ types.ts                          # Authentication context types.
    │  └─ user/                                
    │     ├─ core.ts                           # It contains the core business functions, central logic, and services that are reused for the context.
    │     ├─ model.ts                          # User model and database mapping
    │     ├─ routes.ts                         # User-related HTTP routes
    │     └─ types.ts                          # Main file containing user context types and enums.
    │
    ├─ shared/
    │  ├─ errors/                               # Custom error classes
    │  │  └─ appError.ts                        # Application-level error wrapper
    │  └─ types/                                # Shared interface/types
    │     └─ elysia.ts
    │
    ├─ tests/                                   # Centralized test files
    │  ├─ authCore.test.ts
    │  ├─ authGuard.test.ts
    │  ├─ auth.test.ts
    │  ├─ authRoutes.test.ts
    │  ├─ env.test.ts
    │  ├─ errorHandler.test.ts
    │  ├─ userHelpers.test.ts
    │  └─ userRoutes.test.ts
    │
    └─ index.ts                                 # Application bootstrap entrypoint

## 🧪 Tests

``` bash
bun run test
```
