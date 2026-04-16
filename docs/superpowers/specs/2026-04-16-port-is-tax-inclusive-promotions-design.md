# Port `is_tax_inclusive` Promotion Feature from Upstream Medusa v2.13.6

**Date:** 2026-04-16
**Approach:** Cherry-pick upstream PRs #12412, #12960, #13106, #14237 — surgical port, not full merge
**Constraint:** All existing custom gross-amount logic must be preserved unchanged

## Background

The fork (based on Medusa v2.7.0) calculates ALL promotions on gross (post-tax) amounts unconditionally. Upstream Medusa v2.8.5+ added a per-promotion `is_tax_inclusive` boolean that conditionally switches between pre-tax and post-tax calculation bases.

**Goal:** Add the `is_tax_inclusive` infrastructure (model, types, API, UI) from upstream so the field exists and is usable, while keeping the fork's existing gross-amount calculation as the behavior when `is_tax_inclusive === true`. When `is_tax_inclusive === false`, use upstream's standard pre-tax calculation logic.

## Architecture

The change flows through 4 layers:

```
Promotion Model (DB field)
  → API / Validators (accept field in create/update)
    → Compute Actions (pass field into adjustment output)
      → Totals Calculation (use field to decide gross vs pre-tax)
```

## Changes by File

### Layer 1: Model & Migration (clean additions)

**`packages/modules/promotion/src/models/promotion.ts`**
- Add `is_tax_inclusive: model.boolean().default(false)` to the Promotion model

**`packages/modules/promotion/src/migrations/` (new file)**
- Add migration to create `is_tax_inclusive` boolean column (default `false`) on the `promotion` table
- Port upstream migration `Migration20250508081510.ts` with adjusted naming for our timeline

**`packages/modules/promotion/src/migrations/.snapshot-medusa-promotion.json`**
- Update snapshot to include the new column

### Layer 2: Types (clean additions)

**`packages/core/types/src/promotion/common/promotion.ts`**
- Add `is_tax_inclusive?: boolean` to `PromotionDTO`, `CreatePromotionDTO`, `UpdatePromotionDTO`

**`packages/core/types/src/promotion/common/compute-actions.ts`**
- Add `is_tax_inclusive?: boolean` to `ComputeActionItemLine` and computed action output types
- Add `original_total` field to `ComputeActionItemLine` (needed by upstream logic for `is_tax_inclusive: false` path)

**`packages/core/types/src/http/promotion/admin/payloads.ts`**
- Add `is_tax_inclusive?: boolean` to `AdminCreatePromotion` and `AdminUpdatePromotion`

**`packages/core/types/src/http/promotion/common.ts`**
- Add `is_tax_inclusive?: boolean` to `BasePromotion`

**`packages/core/types/src/cart/common.ts`**
- No changes needed — PR #12960 removed `is_tax_inclusive` from cart adjustment (keep on promotion only)

### Layer 3: API & Validators (clean additions)

**`packages/medusa/src/api/admin/promotions/query-config.ts`**
- Add `"is_tax_inclusive"` to `defaultAdminPromotionFields`

**`packages/medusa/src/api/admin/promotions/validators.ts`**
- Add `is_tax_inclusive: z.boolean().optional()` to `CreatePromotion` and `UpdatePromotion` schemas

**`packages/medusa/src/api/store/carts/query-config.ts`**
- Add `"is_tax_inclusive"` to cart adjustment query fields if upstream requires it

### Layer 4: Workflow Step (clean addition)

**`packages/core/core-flows/src/cart/steps/prepare-adjustments-from-promotion-actions.ts`**
- Pass `is_tax_inclusive` from computed action to cart adjustment creation

### Layer 5: Compute Actions (CONFLICT ZONE — merge with custom logic)

**`packages/modules/promotion/src/utils/compute-actions/line-items.ts`**

Current fork behavior (lines 106-137): unconditionally calculates gross totals from `tax_lines` for ALL promotions.

**Merge strategy:**
- Keep the existing gross-total calculation as-is (used when `promotion.is_tax_inclusive === true`)
- Add upstream's standard pre-tax path (used when `promotion.is_tax_inclusive === false`)
- Add `is_tax_inclusive` to computed action output

```
if promotion.is_tax_inclusive:
  → use current fork logic (gross = subtotal + tax from tax_lines)
else:
  → use upstream logic (subtotal only, no tax adjustment)
```

Specifically in `applyPromotionToItems()`:
1. The ACROSS allocation block (lines 108-137) wraps in `if (promotion.is_tax_inclusive)` to use gross calculation, else use plain `item.subtotal`
2. Computed action output adds `is_tax_inclusive: promotion.is_tax_inclusive`

### Layer 6: Totals — Promotion (CONFLICT ZONE — merge with custom logic)

**`packages/core/utils/src/totals/promotion/index.ts`**

Current fork: `getLineItemGrossTotal()`, `getLineItemUnitPriceGross()`, and `calculateAdjustmentAmountFromPromotion()` all operate on gross amounts unconditionally.

**Merge strategy:**
- Add `is_tax_inclusive` parameter to `calculateAdjustmentAmountFromPromotion()` signature
- When `is_tax_inclusive === true`: use current fork logic (gross amounts via `getLineItemGrossTotal()`)
- When `is_tax_inclusive === false`: use upstream's standard logic (subtotal-based)
- For ACROSS allocation: branch on `is_tax_inclusive` to choose `getLineItemUnitPriceGross()` vs `getLineItemSubtotal()`
- For EACH allocation: branch to choose `getLineItemGrossTotal()` vs `lineItem.subtotal`

### Layer 7: Totals — Line Item (PRESERVE — no changes to custom logic)

**`packages/core/utils/src/totals/line-item/index.ts`**

This file has extensive Helios-specific rounding, hardcoded `includesTax: true`, `discount_tax_total = 0`, and custom `setRefundableTotal()`.

**Merge strategy:** NO CHANGES to the existing calculation logic. The `is_tax_inclusive` field already exists on `GetItemTotalInput` (line 17: `is_tax_inclusive?: boolean`). The upstream PR #14237 fix for refundable_total inflation is already handled by the fork's custom `setRefundableTotal()` which correctly derives refundable amounts from net + tax.

Only change: if upstream adds any new fields to the output interface, add them.

### Layer 8: Totals — Shipping Method (PRESERVE — no changes to custom logic)

**`packages/core/utils/src/totals/shipping-method/index.ts`**

**Merge strategy:** NO CHANGES. The fork's shipping method totals already correctly handle `is_tax_inclusive` via the existing `shippingMethod.is_tax_inclusive ?? context.includeTax` check (line 57). The gross-based calculation and `discount_tax_total = 0` pattern are preserved.

### Layer 9: Totals — Adjustment & Tax (minimal changes)

**`packages/core/utils/src/totals/adjustment/index.ts`**
- Port upstream's `is_tax_inclusive` handling from PR #12412/#12960 if it adds per-adjustment `is_tax_inclusive` awareness. However, the fork already passes `includesTax` and `taxRate` parameters correctly. Review upstream diff to determine if any changes are needed.

**`packages/core/utils/src/totals/tax/index.ts`**
- Port PR #14237's small fix if applicable (check for tax-inclusive pricing to avoid double-counting)

### Layer 10: Admin Dashboard (manual integration into custom form)

**`packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/form-schema.ts`**
- Add `is_tax_inclusive: z.boolean().optional()` to `CreatePromotionSchema`

**`packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts`**
- Add `is_tax_inclusive: false` to each template's defaults

**`packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx`**
- Add `is_tax_inclusive` to `defaultValues` (default: `false`)
- Add a toggle/switch UI element in the promotion details tab (after the code/type fields)
- Pass `is_tax_inclusive` through in the form submission handler
- Custom templates (threshold, gift, buy-x) also include the field

**`packages/admin/dashboard/src/routes/promotions/promotion-detail/components/promotion-general-section/promotion-general-section.tsx`**
- Display `is_tax_inclusive` status in the promotion detail view

**`packages/admin/dashboard/src/routes/promotions/promotion-edit-details/`**
- Add `is_tax_inclusive` toggle to the edit form

**i18n files (en.json, $schema.json + other languages)**
- Add translation keys for `is_tax_inclusive` label, description, and help text

### Layer 11: Tests

**`packages/core/utils/src/totals/__tests__/totals.ts`**
- Port upstream test cases for `is_tax_inclusive` scenarios from PRs #12412, #12960, #14237
- Ensure existing fork tests still pass (gross-amount behavior = `is_tax_inclusive: true` path)

**`integration-tests/http/__tests__/promotions/admin/promotions.spec.ts`**
- Port upstream integration tests for creating/using promotions with `is_tax_inclusive`

## Files NOT Changed

These fork-customized files are explicitly excluded from modification:

| File | Reason |
|------|--------|
| `utils/totals/line-item/index.ts` (calculation logic) | Helios-specific rounding, hardcoded gross behavior — preserved as-is |
| `utils/totals/shipping-method/index.ts` (calculation logic) | Gross-based shipping discount logic — preserved as-is |
| `utils/totals/cart/index.ts` | Custom cart total aggregation — preserved as-is |
| `utils/totals/math.ts` | Custom math utilities — preserved as-is |
| `core-flows/src/cart/workflows/complete-cart.ts` | Custom cart completion validation — not related |
| `core-flows/src/cart/workflows/update-cart.ts` | Custom cart update logic — not related |
| `core-flows/src/auth/steps/delete-auth-identity.ts` | Auth customization — not related |
| `modules/providers/auth-emailpass/` | Auth provider customization — not related |
| All dashboard files except promotion-related | Lyra branding, rich-text, i18n, categories, products — not related |

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Gross calculation breaks for existing promotions | Low | Existing logic preserved; `is_tax_inclusive: true` triggers same code path |
| New `is_tax_inclusive: false` path has bugs | Medium | Port upstream tests; upstream has been stable since v2.9.0 |
| Migration conflicts with existing DB | Low | New column with default value; no existing data altered |
| Dashboard form breaks with new field | Medium | Manual integration; test all 8 templates |
| Type mismatches after adding new fields | Low | TypeScript compilation will catch these |

## Verification Plan

1. Build all affected packages (`yarn build` in each)
2. TypeScript compilation passes with no errors
3. Run existing unit tests in `packages/core/utils/` — all pass
4. Run existing unit tests in `packages/modules/promotion/` — all pass
5. Create a promotion with `is_tax_inclusive: true` — verify same gross-amount behavior as current
6. Create a promotion with `is_tax_inclusive: false` — verify pre-tax calculation
7. Run promotion integration tests
8. Verify admin dashboard: create/edit/view promotions with the new toggle
