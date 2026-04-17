# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **fork of Medusa v2** maintained by 8seneca-global, published under the `@8medusa` npm scope. It contains custom modifications for the Lyra eshop — primarily around pricing/promotion calculations, cart workflows, and admin dashboard branding. The upstream Medusa architecture is preserved; changes are layered on top.

## Monorepo Structure

- **Yarn Workspaces** (v3.2.1, `nodeLinker: node-modules`) + **Turborepo** (v1.6.3) for orchestration
- **Branch strategy**: `develop` is the main branch (base for PRs and releases)
- **Node**: >= 20 required

### Key directories

| Path | Purpose |
|------|---------|
| `packages/medusa/` | Core server (`@8medusa/medusa`) |
| `packages/core/framework/` | Core framework (`@8medusa/framework`) |
| `packages/core/core-flows/` | Pre-built workflows (`@8medusa/core-flows`) |
| `packages/core/utils/` | Shared utilities (`@8medusa/utils`) — **contains custom pricing/totals logic** |
| `packages/core/workflows-sdk/` | Workflow SDK |
| `packages/core/orchestration/` | Orchestration primitives |
| `packages/core/modules-sdk/` | Module SDK |
| `packages/modules/` | 29 commerce modules (cart, order, product, promotion, pricing, etc.) |
| `packages/modules/providers/` | Pluggable providers (auth, payment, file, notification, etc.) |
| `packages/admin/dashboard/` | Admin UI (React) — **Lyra-branded with custom features** |
| `packages/cli/medusa-cli/` | CLI (`@8medusa/cli`) |
| `integration-tests/` | API, HTTP, and module integration tests |
| `scripts/` | Publishing and release automation |

## Build & Test Commands

```bash
# Build all packages (uses turbo with 50% concurrency)
yarn build

# Build a single package
cd packages/core/utils && yarn build

# Lint
yarn lint
yarn lint:path <path>

# Run all unit tests
yarn test

# Run unit tests in chunks (CI-friendly)
yarn test:chunk

# Integration tests (each suite separately)
yarn test:integration:packages   # Module/package integration tests (concurrency=1)
yarn test:integration:api        # API integration tests
yarn test:integration:http       # HTTP integration tests
yarn test:integration:modules    # Module integration tests

# Run a single test file (from package directory)
npx jest --runInBand --bail --forceExit -- path/to/test.ts
```

**Testing stack**: Jest 29 with SWC for transformation. Each package has its own `jest.config.js`. Integration tests use real PostgreSQL via MikroORM.

## Publishing to npm (@8medusa scope)

All packages publish publicly under `@8medusa/*`. The release scripts handle dependency ordering and version propagation.

```bash
# Release core packages in dependency order (utils -> orchestration -> modules-sdk -> workflows-sdk -> framework -> cli -> medusa)
node scripts/release-core-packages.js <version>

# Auto-discover and publish all new @8medusa/* packages
yarn publish:check-and-publish

# Publish provider packages
yarn publish:providers

# Release core-flows / workflow engine
yarn release:core-flows
```

The core release script (`scripts/release-core-packages.js`) publishes packages sequentially with 10s delays, updates cross-dependencies to the new version, and verifies each package on the npm registry before proceeding. Supports semver and pre-release tags (e.g., `2.7.2-beta.1`).

**Changeset-based releases**: `.changeset/config.json` links all `@8medusa/*` packages for fixed versioning. The GitHub Actions workflow in `release.yml` automates version PRs and npm publishing on pushes to `develop`.

## Custom Modifications (Lyra eshop)

### Pricing & Promotion Calculations
The most critical customizations. Located in:
- `packages/core/utils/src/totals/line-item/index.ts` — line item total calculations
- `packages/core/utils/src/totals/promotion/index.ts` — promotion allocation logic
- `packages/core/utils/src/totals/shipping-method/index.ts` — shipping method totals
- `packages/modules/promotion/src/utils/compute-actions/line-items.ts` — promotion compute actions

Key behavior changes from upstream:
- Promotions are calculated on **gross (post-tax) amounts** instead of pre-tax
- `getLineItemGrossTotal()` computes subtotal + (subtotal x total_tax_rate)
- Both percentage and fixed promotions use gross totals as the base
- Fixed promotions are allocated proportionally across items by gross total
- Enhanced decimal precision handling and rounding before calculating totals

### Cart & Order Workflows
- `packages/core/core-flows/src/cart/workflows/complete-cart.ts` — custom validation hook added to cart completion
- Country validation removed from cart region selection

### Admin Dashboard (Lyra branding)
- Lyra logo assets in `packages/admin/dashboard/src/assets/images/`
- Rich text editor component (`components/rich-text-editor/`)
- Product ranking/sorting functionality
- Product tags renamed to "ingredients"
- Extended product types (`types/extended-product.types.ts`)
- Multi-language i18n: English, Russian, Slovak, Hungarian, Dutch, Vietnamese, Korean

## Code Style

- **ESLint**: Google style guide, 80-char line length, Prettier integration
- **Prettier**: Double quotes, no semicolons, tab width 2, trailing commas ES5
- **Pre-commit**: Husky + lint-staged runs ESLint on `*.{js,jsx,ts,tsx}` and Prettier on `*.{md,yaml,yml}`
- **TypeScript**: Target ES2021, module Node16, experimental decorators enabled
- Base config in `_tsconfig.base.json`; each package extends it

## How Users Install

In a downstream project, replace standard `@medusajs/*` packages with:
```json
{
  "@8medusa/medusa": "2.11.1",
  "@8medusa/framework": "2.11.1",
  "@8medusa/core-flows": "2.9.14",
  "@8medusa/utils": "2.7.0"
}
```

All custom pricing logic, promotion calculations, and dashboard features are included automatically.

## Working with This Repo

- ORM: MikroORM 6.4.3 (PostgreSQL). Modules may have `migration:*` and `orm:cache:clear` scripts.
- Workflows use the `@8medusa/workflows-sdk` — step-based orchestration with compensation (rollback) support.
- Module integration tests use `moduleIntegrationTestRunner` from `@8medusa/test-utils`.
- When modifying pricing/totals logic, verify both tax-inclusive and tax-exclusive scenarios and check decimal precision edge cases.
