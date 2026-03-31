# Project Pantry

<a href="https://project-pantry-e2d5a.web.app" target="_blank">
  <img src="https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge" alt="Live Demo">
</a>

Project Pantry is a project-planning app for DIY work. You can break a project into subprojects, track materials, and keep everything organized in one place.

## Key Features

- Nested project planning with subprojects and per-scope material tracking
- Inventory-aware material fulfillment with quantity checks
- Auth-protected project and inventory management views
- Project reporting with cost rollups based on material unit costs

## Why I Built It

I wanted a cleaner way to plan home and personal projects without juggling notes, shopping lists, and task checklists across different apps. This project was also a way to practice building and testing a full React + Supabase workflow.

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- React Bootstrap
- Supabase (Auth + Postgres)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (or your own backend setup)

### Run Locally

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-public-key>
```

## Database Diagram

This ERD shows how user owned projects are broken into subprojects and connected to files, required materials, and inventory items through foreign key relationships.

```mermaid
erDiagram
  AUTH_USERS {
    uuid id PK
  }

  PROJECTS {
    uuid id PK
    uuid user_id FK
    varchar name
    text description
    timestamptz created_at
    timestamptz updated_at
    numeric estimated_time
    boolean is_public
  }

  INVENTORY_ITEMS {
    uuid id PK
    uuid user_id FK
    text name
    text description
    numeric quantity
    text unit
    numeric unit_cost
    timestamptz created_at
    timestamptz updated_at
  }

  SUBPROJECTS {
    uuid id PK
    uuid project_id FK
    text name
    text description
    numeric estimated_time
    integer order_index
    timestamptz created_at
    timestamptz updated_at
  }

  PROJECT_FILES {
    uuid id PK
    uuid project_id FK
    uuid subproject_id FK
    text file_path
    text file_type
    text description
    timestamptz created_at
    timestamptz updated_at
  }

  PROJECT_MATERIALS {
    uuid id PK
    uuid project_id FK
    uuid subproject_id FK
    uuid inventory_item_id FK
    numeric quantity_needed
    boolean is_fulfilled
    timestamptz created_at
    timestamptz updated_at
  }

  AUTH_USERS ||--o{ PROJECTS : owns
  AUTH_USERS ||--o{ INVENTORY_ITEMS : owns
  PROJECTS ||--o{ SUBPROJECTS : contains
  PROJECTS ||--o{ PROJECT_FILES : contains
  SUBPROJECTS ||--o{ PROJECT_FILES : contains
  PROJECTS ||--o{ PROJECT_MATERIALS : contains
  SUBPROJECTS ||--o{ PROJECT_MATERIALS : contains
  INVENTORY_ITEMS ||--o{ PROJECT_MATERIALS : fulfills
```
