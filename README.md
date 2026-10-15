# Shipping Bill Creation Form

An enterprise-grade export software frontend for creating, managing, and filing Customs & ICEGATE EDI Shipping Bills. Built on React 19, Tailwind CSS v4, React Hook Form, and Zustand with high-contrast accessibility across both dark and light modes.

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (with strict custom color tokens & WCAG AA contrast)
- **Forms & Validation**: React Hook Form + Zod
- **State Management**: Zustand
- **Architecture**: `fe-zen-arch` modular workspace architecture

## Quick Start

### 1. Clone with submodules
```bash
git clone --recursive https://github.com/trytotest13/Shipping-Bill-creation-form.git
cd Shipping-Bill-creation-form
```

If already cloned without submodules:
```bash
git submodule update --init --recursive
```

### 2. Install dependencies & run
```bash
pnpm install
pnpm dev
```
The application will launch at `http://localhost:5173`.

### 3. Build & Type Check
```bash
pnpm tsc --noEmit   # Strict TypeScript check (0 errors)
pnpm build          # Production bundle
```

## Project Documentation

Detailed specifications and architectural documentation are available in the [`docs/`](./docs) folder:
- [Product Requirements Document (PRD)](./docs/prd.md)
- [Technical Requirements Document (TRD)](./docs/trd.md)
- [Architecture & State Flow](./docs/architecture.md)
- [Design Tokens & Theme](./docs/design.md)
- [Schema & Validation](./docs/schema.md)
- [Coding Standards & Rules](./docs/rules.md)

