# FinCore Workspace Rules

This file defines project-specific rules, style guidelines, and constraints for agents working in this workspace.

## Technology Stack
- **Backend:** .NET 8 (C# 12) Web API with Entity Framework Core (Code-First) using SQL Server.
- **Frontend:** Next.js 14+ (App Router) with TypeScript, Tailwind CSS, and Shadcn UI.

## Coding Conventions
- **C#**: Use Clean/Onion Architecture layers: `Domain`, `Application`, `Infrastructure`, and `API`.
- **Naming C#**: PascalCase for Classes, Methods, Properties, Namespaces, Enums; camelCase for parameters/local variables; _camelCase for private readonly fields.
- **TypeScript / Next.js**: Use functional components. App Router directory layout is mandatory. PascalCase for components, camelCase for hooks and utilities.

## Database (Code-First)
- All DB configurations should use Fluent API in `Infrastructure/Persistence/Configurations/` rather than Data Annotations inside the Domain entities.
- Entities must inherit from `BaseEntity` which tracks audit fields (`Id`, `CreatedAt`, `CreatedBy`, `LastModifiedAt`, `LastModifiedBy`).

## Crucial Business flow
- No public user self-registration is allowed.
- Accounts are created (provisioned) only by Admin/Management.
- First-time login forces a password reset (`IsPasswordTemp = true` is checked during authentication).
- Deactivation (`IsActive = false`) is used instead of hard deletes to keep transaction history intact.
