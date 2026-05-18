# Bun + Elysia + Kysely

This project is built using **Bun** as the JavaScript/TypeScript
runtime, **Elysia** as the lightweight and expressive API framework, and
**Kysely** as the type-safe SQL query builder and ORM.
It also includes the **OpenAPI** and **CORS** plugins for Elysia.

## Tech Stack

-   **Bun** - Ultra-fast JS/TS runtime
-   **ElysiaJS** - Modern, minimal API framework
    -   **@elysiajs/openapi** for automatic API documentation
    -   **@elysiajs/cors** for CORS handling
    -   **@elysiajs/jwt** for JWT Token Authentication
-   **Kysely ORM** - Type-safe database queries
-   **Database migrations** controlled via CLI
-   **Biome** - performant linter

## Development

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

## API Documentation

OpenAPI documentation is automatically generated using the Elysia
OpenAPI plugin.

After starting the server, access:

👉 `/docs` --- Scalar UI\
👉 `/openapi.json` --- Raw OpenAPI schema

## Available Scripts

  Command                Description
  ---------------------- ----------------------------------------------
  `bun dev`              Starts the development server.\
  `bun migrate:run`      Applies all pending migrations.\
  `bun migrate:create`   Generates a new migration file.\
  `bun lint`             Runs Biome linter to check code quality.\
  `bun format`           Formats all project files using Biome.\
  `bun run build`        Builds the project for production.

## Project Structure

    src/
    ├─ adapters/
    │  └─ db/
    │     ├─ migrations/
    │     │  └─ 001_create_users_table.ts     # Database migration files
    │     ├─ scripts/
    │     │  ├─ create.ts                     # CLI script to generate migrations
    │     │  └─ migrate.ts                    # CLI script to run migrations
    │     └─ kysely.ts                        # Kysely database client configuration
    │
    ├─ http/
    │  ├─ middlewares/
    │  │  ├─ auth.ts                          # Authentication middleware
    │  │  ├─ errorHandler.ts                  # Global error handler
    │  │  └─ rbac.ts                          # Role-based access control middleware
    │  ├─ security/
    │  │  └─ jwt.ts                           # JWT generation/validation utilities
    │  └─ elysia.ts                           # Elysia server configuration and plugins
    │
    ├─ config/
    │  └─ env.ts                               # Environment variables loading
    │
    ├─ modules/                                # Bounded context
    │  ├─ core/                                
    │  │  ├─ core.ts                           # It contains the core business functions, central logic, and services that are reused for the context.
    │  │  ├─ routes.ts                         # Core-related HTTP routes
    │  │  └─ types.ts                          # Main file containing core context types and enums.
    │  └─ user/                                
    │     ├─ core.ts                           # It contains the core business functions, central logic, and services that are reused for the context.
    │     ├─ model.ts                          # User model and database mapping
    │     ├─ routes.ts                         # User-related HTTP routes
    │     └─ types.ts                          # Main file containing user context types and enums.
    │
    ├─ shared/
    │  ├─ errors/                               # Custom error classes
    │  ├─ appError.ts                           # Application-level error wrapper
    │  └─ types/                                # Shared interface/types
    │     └─ elysia.ts
    │
    └─ index.ts                                 # Application bootstrap entrypoint

## Tests

``` bash
bun test
```