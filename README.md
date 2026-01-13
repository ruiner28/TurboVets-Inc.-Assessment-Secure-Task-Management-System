# Secure Task Management System

## Overview

This is a full-stack Task Management System built with NX monorepo, featuring role-based access control (RBAC), JWT authentication, and a responsive Angular frontend.

## Architecture

### Monorepo Structure

- **apps/api/**: NestJS backend with TypeORM and SQLite
- **apps/dashboard/**: Angular frontend with TailwindCSS
- **libs/data/**: Shared TypeScript interfaces and DTOs
- **libs/auth/**: Reusable RBAC logic and decorators

### Data Model

#### Users
- id, email, password, name, organizationId, role

#### Organizations
- id, name, parentId (2-level hierarchy)

#### Roles
- OWNER, ADMIN, VIEWER

#### Permissions
- create:task, read:task, update:task, delete:task, read:audit

#### Tasks
- id, title, description, status, category, createdById, organizationId, createdAt, updatedAt

#### Audit Logs
- id, userId, action, resource, resourceId, timestamp

### ERD Diagram

```
+----------------+     +-------------------+     +----------------+
|    User        |     |   Organization    |     |     Task       |
+----------------+     +-------------------+     +----------------+
| id (PK)        |     | id (PK)           |     | id (PK)        |
| email          |     | name              |     | title          |
| password       |     | parentId (FK)     |     | description    |
| name           |     |                   |     | status         |
| organizationId | --> |                   | <-- | category       |
| role           |     |                   |     | createdById    |
+----------------+     +-------------------+     | organizationId |
                        |                   |     | createdAt      |
                        |                   |     | updatedAt      |
                        +-------------------+     +----------------+
                              |     |                       |
                              |     |                       |
                              v     v                       v
                        +-------------------+     +----------------+
                        |   User (1..*)     |     |   Task (1..*)   |
                        +-------------------+     +----------------+
```

Users belong to Organizations (many-to-one). Organizations can have parent organizations (self-referencing). Tasks belong to Organizations and are created by Users.

### Access Control

Roles have permissions:
- OWNER: all permissions
- ADMIN: CRUD tasks
- VIEWER: read tasks

Tasks are scoped to organization.

JWT authentication with Bearer token.

## Setup Instructions

1. Install dependencies: `npm install`

2. Build projects:
   - `nx build api`
   - `nx build dashboard`

3. Run backend: `nx serve api` (runs on http://localhost:3000/api)

4. Run frontend: `nx serve dashboard` (runs on http://localhost:4200)

5. Seed data: Manually insert into SQLite or use script (not implemented)

## Environment Variables

Create .env file:
```
JWT_SECRET=your-secret-key
```

## API Endpoints

- POST /api/auth/login - Login
- GET /api/tasks - List tasks
- POST /api/tasks - Create task
- PATCH /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task
- GET /api/tasks/audit-log - Audit logs (Owner/Admin)

## Testing

Backend: Jest tests in api/src/**/*.spec.ts

Frontend: Jest/Karma tests in dashboard/src/**/*.spec.ts

Run: `nx test api`, `nx test dashboard`

## Future Considerations

- JWT refresh tokens
- CSRF protection
- RBAC caching
- Production DB (PostgreSQL)
- Advanced role delegation
