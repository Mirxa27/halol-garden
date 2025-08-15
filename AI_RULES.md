# AI Development Rules for Holool Medical Devices App

This document provides essential rules and guidelines for the AI developer working on this project. Adhering to these rules is mandatory to ensure code quality, consistency, and maintainability.

## Tech Stack Overview

The application is a modern full-stack solution built with the following technologies:

-   **Frontend Framework**: React 18 with TypeScript, built using Vite for a fast development experience.
-   **Routing**: `react-router-dom` is used for all client-side routing, with routes managed centrally in `client/App.tsx`.
-   **Styling**: Tailwind CSS is the exclusive choice for utility-first styling. The theme is configured in `client/global.css` and `tailwind.config.ts`.
-   **UI Components**: We use the shadcn/ui library, which is built on top of Radix UI primitives. All base components are located in `client/components/ui/`.
-   **Icons**: `lucide-react` is the sole icon library to ensure a consistent and lightweight icon set.
-   **State Management**: Zustand is used for simple, scalable global state management (e.g., authentication). Local state is handled by React hooks.
-   **Data Fetching & Caching**: TanStack Query (React Query) is used for all server state management, including data fetching, caching, and mutations.
-   **Backend**: A lightweight Express.js server handles all API requests, with routes defined in the `server/` directory.
-   **Form Handling**: React Hook Form is used for all forms, combined with Zod for robust schema validation.
-   **Testing**: The project uses Vitest for running tests and React Testing Library for rendering and interacting with components.

## Library Usage Rules

### 1. UI and Styling
-   **ALWAYS** use components from `client/components/ui/` (shadcn/ui) for standard UI elements (Button, Card, Input, etc.).
-   **NEVER** install new UI component libraries. The existing setup is comprehensive.
-   For unique, application-specific components, create new files inside `client/components/`.
-   **ALWAYS** use Tailwind CSS utility classes for styling. Do not write custom CSS files.
-   **ALWAYS** use the `cn()` utility from `client/lib/utils.ts` to merge and conditionally apply CSS classes.

### 2. State Management
-   For local component state, use React's `useState` and `useReducer`.
-   For global state shared across components (e.g., user auth), **ALWAYS** use Zustand. Create a new store if a suitable one doesn't exist.
-   **DO NOT** introduce other state management libraries like Redux or MobX.

### 3. Data Fetching & Server State
-   **ALWAYS** use TanStack Query (`useQuery`, `useMutation`) for all communication with the backend API.
-   **DO NOT** use `fetch` or `axios` directly within components. Abstract all data fetching into custom hooks that use TanStack Query.
-   Define clear and consistent query keys to ensure predictable caching behavior.

### 4. Forms
-   **ALWAYS** use `react-hook-form` for form logic.
-   **ALWAYS** use `zod` to define validation schemas for forms.
-   **ALWAYS** integrate forms with the shadcn/ui components using the `Form`, `FormField`, and `FormControl` wrappers from `client/components/ui/form.tsx`.

### 5. Icons
-   **ONLY** use icons from the `lucide-react` package.
-   Import icons directly, e.g., `import { Star } from 'lucide-react';`.

### 6. Routing and Pages
-   All page-level components **MUST** be created in the `client/pages/` directory.
-   All routes **MUST** be defined in `client/App.tsx`.
-   Use the `<Link>` component from `react-router-dom` for all internal navigation.

### 7. Backend API
-   New API endpoints **MUST** be created as separate route handlers in `server/routes/`.
-   Register all new routes in `server/index.ts`.
-   Use the `@shared` path alias to share TypeScript types between the client and server for API request/response payloads.