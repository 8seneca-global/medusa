# Port `is_tax_inclusive` Promotions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-promotion `is_tax_inclusive` support from upstream Medusa v2.13.6 while preserving all existing custom gross-amount calculation logic.

**Architecture:** The `is_tax_inclusive` boolean is added to the Promotion model and propagated through types, API validators, compute actions, and totals calculation. When `true`, the existing fork's gross-amount logic runs. When `false` (default), upstream's standard pre-tax logic runs. The admin dashboard gets a toggle to set this per-promotion.

**Tech Stack:** TypeScript, MikroORM (PostgreSQL), Zod validators, React (admin dashboard), i18n

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `packages/modules/promotion/src/models/promotion.ts` | Add `is_tax_inclusive` field to model |
| Create | `packages/modules/promotion/src/migrations/Migration20260416000000.ts` | DB migration for new column |
| Modify | `packages/modules/promotion/src/migrations/.snapshot-medusa-promotion.json` | Update snapshot |
| Modify | `packages/core/types/src/promotion/common/promotion.ts` | Add field to DTOs |
| Modify | `packages/core/types/src/promotion/common/compute-actions.ts` | Add field to action types |
| Modify | `packages/core/types/src/http/promotion/admin/payloads.ts` | Add field to API payloads |
| Modify | `packages/core/types/src/http/promotion/common.ts` | Add field to BasePromotion |
| Modify | `packages/medusa/src/api/admin/promotions/query-config.ts` | Expose field in queries |
| Modify | `packages/medusa/src/api/admin/promotions/validators.ts` | Accept field in create/update |
| Modify | `packages/core/core-flows/src/cart/steps/prepare-adjustments-from-promotion-actions.ts` | Pass field through adjustments |
| Modify | `packages/modules/promotion/src/utils/compute-actions/line-items.ts` | Branch on `is_tax_inclusive` in compute |
| Modify | `packages/core/utils/src/totals/promotion/index.ts` | Branch on `is_tax_inclusive` in allocation calc |
| Modify | `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/form-schema.ts` | Add field to form schema |
| Modify | `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts` | Add default value to templates |
| Modify | `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx` | Add toggle UI |
| Modify | `packages/admin/dashboard/src/routes/promotions/promotion-detail/components/promotion-general-section/promotion-general-section.tsx` | Display field |
| Modify | `packages/admin/dashboard/src/routes/promotions/promotion-edit-details/components/edit-promotion-form/edit-promotion-details-form.tsx` | Add toggle to edit form |
| Modify | `packages/admin/dashboard/src/i18n/translations/en.json` | Add translation keys |

---

### Task 1: Promotion Model & Migration

**Files:**
- Modify: `packages/modules/promotion/src/models/promotion.ts:10` (after `is_automatic` line)
- Create: `packages/modules/promotion/src/migrations/Migration20260416000000.ts`
- Modify: `packages/modules/promotion/src/migrations/.snapshot-medusa-promotion.json:334` (after `is_automatic` block)

- [ ] **Step 1: Add `is_tax_inclusive` to the Promotion model**

In `packages/modules/promotion/src/models/promotion.ts`, add after line 10 (`is_automatic: model.boolean().default(false),`):

```typescript
is_tax_inclusive: model.boolean().default(false),
```

- [ ] **Step 2: Create the database migration**

Create `packages/modules/promotion/src/migrations/Migration20260416000000.ts`:

```typescript
import { Migration } from "@mikro-orm/migrations"

export class Migration20260416000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "promotion" ADD COLUMN IF NOT EXISTS "is_tax_inclusive" boolean NOT NULL DEFAULT false;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "promotion" DROP COLUMN IF EXISTS "is_tax_inclusive";`
    )
  }
}
```

- [ ] **Step 3: Update the migration snapshot**

In `packages/modules/promotion/src/migrations/.snapshot-medusa-promotion.json`, add after the `is_automatic` block (after line 334, before `"type"`):

```json
"is_tax_inclusive": {
  "name": "is_tax_inclusive",
  "type": "boolean",
  "unsigned": false,
  "autoincrement": false,
  "primary": false,
  "nullable": false,
  "default": "false",
  "mappedType": "boolean"
},
```

- [ ] **Step 4: Verify the model builds**

Run:
```bash
cd packages/modules/promotion && yarn build
```
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/modules/promotion/src/models/promotion.ts packages/modules/promotion/src/migrations/Migration20260416000000.ts packages/modules/promotion/src/migrations/.snapshot-medusa-promotion.json
git commit -m "feat(promotion): add is_tax_inclusive field to Promotion model and migration"
```

---

### Task 2: Type Definitions

**Files:**
- Modify: `packages/core/types/src/promotion/common/promotion.ts:61,114,149`
- Modify: `packages/core/types/src/promotion/common/compute-actions.ts:47,102`
- Modify: `packages/core/types/src/http/promotion/admin/payloads.ts:152,189`
- Modify: `packages/core/types/src/http/promotion/common.ts:60`

- [ ] **Step 1: Add `is_tax_inclusive` to PromotionDTO**

In `packages/core/types/src/promotion/common/promotion.ts`:

After `is_automatic?: boolean` (line 61) in `PromotionDTO`, add:

```typescript
  /**
   * Whether the promotion is tax inclusive.
   * When true, promotion values are calculated on gross (post-tax) amounts.
   * When false, promotion values are calculated on net (pre-tax) amounts.
   */
  is_tax_inclusive?: boolean
```

After `is_automatic?: boolean` (line 114) in `CreatePromotionDTO`, add:

```typescript
  /**
   * Whether the promotion is tax inclusive.
   */
  is_tax_inclusive?: boolean
```

After `is_automatic?: boolean` (line 149) in `UpdatePromotionDTO`, add:

```typescript
  /**
   * Whether the promotion is tax inclusive.
   */
  is_tax_inclusive?: boolean
```

- [ ] **Step 2: Add `is_tax_inclusive` to compute action types**

In `packages/core/types/src/promotion/common/compute-actions.ts`:

After `code: string` (line 66) in `AddItemAdjustmentAction`, add:

```typescript
  /**
   * Whether the promotion's value is tax inclusive.
   */
  is_tax_inclusive?: boolean
```

After `code: string` (line 121) in `AddShippingMethodAdjustment`, add:

```typescript
  /**
   * Whether the promotion's value is tax inclusive.
   */
  is_tax_inclusive?: boolean
```

- [ ] **Step 3: Add `is_tax_inclusive` to HTTP types**

In `packages/core/types/src/http/promotion/admin/payloads.ts`:

After `is_automatic?: boolean` (line 162) in `AdminCreatePromotion`, add:

```typescript
  /**
   * Whether the promotion is tax inclusive.
   */
  is_tax_inclusive?: boolean
```

After `is_automatic?: boolean` (line 200) in `AdminUpdatePromotion`, add:

```typescript
  /**
   * Whether the promotion is tax inclusive.
   */
  is_tax_inclusive?: boolean
```

In `packages/core/types/src/http/promotion/common.ts`:

After `is_automatic?: boolean` (line 64) in `BasePromotion`, add:

```typescript
  is_tax_inclusive?: boolean
```

- [ ] **Step 4: Verify types build**

Run:
```bash
cd packages/core/types && yarn build
```
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/core/types/src/promotion/common/promotion.ts packages/core/types/src/promotion/common/compute-actions.ts packages/core/types/src/http/promotion/admin/payloads.ts packages/core/types/src/http/promotion/common.ts
git commit -m "feat(types): add is_tax_inclusive to promotion and compute action types"
```

---

### Task 3: API Validators & Query Config

**Files:**
- Modify: `packages/medusa/src/api/admin/promotions/query-config.ts:5`
- Modify: `packages/medusa/src/api/admin/promotions/validators.ts:164,188`

- [ ] **Step 1: Add field to query config**

In `packages/medusa/src/api/admin/promotions/query-config.ts`, add `"is_tax_inclusive"` after `"is_automatic"` (line 4) in `defaultAdminPromotionFields`:

```typescript
export const defaultAdminPromotionFields = [
  "id",
  "code",
  "is_automatic",
  "is_tax_inclusive",
  "type",
```

- [ ] **Step 2: Add field to create/update validators**

In `packages/medusa/src/api/admin/promotions/validators.ts`:

In `CreatePromotion` (line 161-172), add `is_tax_inclusive` after `is_automatic`:

```typescript
export const CreatePromotion = z
  .object({
    code: z.string(),
    is_automatic: z.boolean().optional(),
    is_tax_inclusive: z.boolean().optional(),
    type: z.nativeEnum(PromotionType),
```

In `UpdatePromotion` (line 185-194), add `is_tax_inclusive` after `is_automatic`:

```typescript
export const UpdatePromotion = z
  .object({
    code: z.string().optional(),
    is_automatic: z.boolean().optional(),
    is_tax_inclusive: z.boolean().optional(),
    type: z.nativeEnum(PromotionType).optional(),
```

- [ ] **Step 3: Verify medusa package builds**

Run:
```bash
cd packages/medusa && yarn build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/medusa/src/api/admin/promotions/query-config.ts packages/medusa/src/api/admin/promotions/validators.ts
git commit -m "feat(medusa): add is_tax_inclusive to promotion API validators and query config"
```

---

### Task 4: Workflow Step — Pass `is_tax_inclusive` Through Adjustments

**Files:**
- Modify: `packages/core/core-flows/src/cart/steps/prepare-adjustments-from-promotion-actions.ts:121-137`

- [ ] **Step 1: Update promotions query to include `is_tax_inclusive`**

In `packages/core/core-flows/src/cart/steps/prepare-adjustments-from-promotion-actions.ts`, change the `listPromotions` call (line 121-124) to also select `is_tax_inclusive`:

```typescript
    const promotions = await promotionModuleService.listPromotions(
      { code: actions.map((a) => a.code) },
      { select: ["id", "code", "is_tax_inclusive"] }
    )
```

- [ ] **Step 2: Verify core-flows builds**

Run:
```bash
cd packages/core/core-flows && yarn build
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/core/core-flows/src/cart/steps/prepare-adjustments-from-promotion-actions.ts
git commit -m "feat(core-flows): include is_tax_inclusive in promotion adjustment step"
```

---

### Task 5: Compute Actions — Branch on `is_tax_inclusive`

This is the first conflict zone. The fork's `applyPromotionToItems()` unconditionally calculates gross totals. We add branching: `is_tax_inclusive === true` keeps the existing gross logic, `false` uses standard pre-tax logic.

**Files:**
- Modify: `packages/modules/promotion/src/utils/compute-actions/line-items.ts:106-137,178-192`

- [ ] **Step 1: Add `is_tax_inclusive` branching to ACROSS allocation**

In `packages/modules/promotion/src/utils/compute-actions/line-items.ts`, replace lines 106-137 (the ACROSS allocation block):

Old:
```typescript
  // ALL promotions use GROSS totals (post-tax)
  let lineItemsTotal = MathBN.convert(0)
  if (allocation === ApplicationMethodAllocation.ACROSS) {
    lineItemsTotal = applicableItems.reduce((acc, item) => {
      // Calculate gross total (subtotal + tax) for ALL promotions
      let itemTotal = MathBN.convert(item.subtotal)

      if (
        item.tax_lines &&
        Array.isArray(item.tax_lines) &&
        item.tax_lines.length > 0
      ) {
        const taxLines = item.tax_lines as { rate: BigNumberInput }[]
        const totalTaxRate = taxLines.reduce(
          (taxAcc, taxLine) =>
            MathBN.add(taxAcc, MathBN.div(taxLine.rate, 100)),
          MathBN.convert(0)
        )
        const taxAmount = MathBN.mult(item.subtotal, totalTaxRate)
        itemTotal = MathBN.add(item.subtotal, taxAmount)
      }

      return MathBN.sub(
        MathBN.add(acc, itemTotal),
        appliedPromotionsMap.get(item.id) ?? 0
      )
    }, MathBN.convert(0))

    if (MathBN.lte(lineItemsTotal, 0)) {
      return computedActions
    }
  }
```

New:
```typescript
  const isTaxInclusive = promotion.is_tax_inclusive ?? false

  let lineItemsTotal = MathBN.convert(0)
  if (allocation === ApplicationMethodAllocation.ACROSS) {
    if (isTaxInclusive) {
      // Tax-inclusive: use GROSS totals (subtotal + tax) — existing Lyra logic
      lineItemsTotal = applicableItems.reduce((acc, item) => {
        let itemTotal = MathBN.convert(item.subtotal)

        if (
          item.tax_lines &&
          Array.isArray(item.tax_lines) &&
          item.tax_lines.length > 0
        ) {
          const taxLines = item.tax_lines as { rate: BigNumberInput }[]
          const totalTaxRate = taxLines.reduce(
            (taxAcc, taxLine) =>
              MathBN.add(taxAcc, MathBN.div(taxLine.rate, 100)),
            MathBN.convert(0)
          )
          const taxAmount = MathBN.mult(item.subtotal, totalTaxRate)
          itemTotal = MathBN.add(item.subtotal, taxAmount)
        }

        return MathBN.sub(
          MathBN.add(acc, itemTotal),
          appliedPromotionsMap.get(item.id) ?? 0
        )
      }, MathBN.convert(0))
    } else {
      // Non-tax-inclusive: use subtotal only — standard upstream logic
      lineItemsTotal = applicableItems.reduce((acc, item) => {
        return MathBN.sub(
          MathBN.add(acc, item.subtotal),
          appliedPromotionsMap.get(item.id) ?? 0
        )
      }, MathBN.convert(0))
    }

    if (MathBN.lte(lineItemsTotal, 0)) {
      return computedActions
    }
  }
```

- [ ] **Step 2: Add `is_tax_inclusive` to computed action output**

In the same file, replace the `computedActions.push` blocks (lines 178-192):

Old:
```typescript
    if (isTargetLineItems || isTargetOrder) {
      computedActions.push({
        action: ComputedActions.ADD_ITEM_ADJUSTMENT,
        item_id: item.id,
        amount,
        code: promotion.code!,
      })
    } else if (isTargetShippingMethod) {
      computedActions.push({
        action: ComputedActions.ADD_SHIPPING_METHOD_ADJUSTMENT,
        shipping_method_id: item.id,
        amount,
        code: promotion.code!,
      })
    }
```

New:
```typescript
    if (isTargetLineItems || isTargetOrder) {
      computedActions.push({
        action: ComputedActions.ADD_ITEM_ADJUSTMENT,
        item_id: item.id,
        amount,
        code: promotion.code!,
        is_tax_inclusive: isTaxInclusive,
      })
    } else if (isTargetShippingMethod) {
      computedActions.push({
        action: ComputedActions.ADD_SHIPPING_METHOD_ADJUSTMENT,
        shipping_method_id: item.id,
        amount,
        code: promotion.code!,
        is_tax_inclusive: isTaxInclusive,
      })
    }
```

- [ ] **Step 3: Build and verify**

Run:
```bash
cd packages/modules/promotion && yarn build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/modules/promotion/src/utils/compute-actions/line-items.ts
git commit -m "feat(promotion): branch compute actions on is_tax_inclusive flag"
```

---

### Task 6: Totals Promotion — Branch on `is_tax_inclusive`

Second conflict zone. The fork's `calculateAdjustmentAmountFromPromotion()` unconditionally uses gross totals. We add branching: `is_tax_inclusive === true` keeps the fork's gross logic, `false` uses upstream's subtotal logic.

**Files:**
- Modify: `packages/core/utils/src/totals/promotion/index.ts` (full file rewrite to add branching)

- [ ] **Step 1: Add `is_tax_inclusive` parameter and branching**

Replace the entire content of `packages/core/utils/src/totals/promotion/index.ts` with:

```typescript
import { BigNumberInput } from "@8medusa/types"
import {
  ApplicationMethodAllocation,
  ApplicationMethodType,
} from "../../promotion"
import { MathBN } from "../math"

function getPromotionValueForPercentage(promotion, lineItemTotal) {
  return MathBN.mult(MathBN.div(promotion.value, 100), lineItemTotal)
}

function getPromotionValueForFixed(promotion, itemTotal, allItemsTotal) {
  if (promotion.allocation === ApplicationMethodAllocation.ACROSS) {
    const promotionValueForItem = MathBN.mult(
      MathBN.div(itemTotal, allItemsTotal),
      promotion.value
    )

    if (MathBN.lte(promotionValueForItem, itemTotal)) {
      return promotionValueForItem
    }

    const percentage = MathBN.div(
      MathBN.mult(itemTotal, 100),
      promotionValueForItem
    )

    return MathBN.mult(
      promotionValueForItem,
      MathBN.div(percentage, 100)
    ).precision(4)
  }

  return promotion.value
}

export function getPromotionValue(promotion, lineItemTotal, lineItemsTotal) {
  if (promotion.type === ApplicationMethodType.PERCENTAGE) {
    return getPromotionValueForPercentage(promotion, lineItemTotal)
  }

  return getPromotionValueForFixed(promotion, lineItemTotal, lineItemsTotal)
}

export function getApplicableQuantity(lineItem, maxQuantity) {
  if (maxQuantity && lineItem.quantity) {
    return MathBN.min(lineItem.quantity, maxQuantity)
  }

  return lineItem.quantity
}

/**
 * Calculate gross total from subtotal and tax_lines.
 * Used when is_tax_inclusive is true — promotions apply to post-tax amounts.
 */
function getLineItemGrossTotal(lineItem) {
  const subtotal = MathBN.convert(lineItem.subtotal)

  if (
    lineItem.tax_lines &&
    Array.isArray(lineItem.tax_lines) &&
    lineItem.tax_lines.length > 0
  ) {
    const totalTaxRate = lineItem.tax_lines.reduce(
      (acc, taxLine) => MathBN.add(acc, MathBN.div(taxLine.rate, 100)),
      MathBN.convert(0)
    )
    const taxAmount = MathBN.mult(subtotal, totalTaxRate)
    return MathBN.add(subtotal, taxAmount)
  }

  return subtotal
}

function getLineItemUnitPriceGross(lineItem) {
  const grossTotal = getLineItemGrossTotal(lineItem)
  return MathBN.div(grossTotal, lineItem.quantity)
}

/**
 * Get subtotal-based unit price (standard upstream logic).
 * Used when is_tax_inclusive is false.
 */
function getLineItemSubtotal(lineItem) {
  return MathBN.convert(lineItem.subtotal)
}

function getLineItemUnitPriceSubtotal(lineItem) {
  return MathBN.div(getLineItemSubtotal(lineItem), lineItem.quantity)
}

export function calculateAdjustmentAmountFromPromotion(
  lineItem,
  promotion,
  lineItemsTotal: BigNumberInput = 0
) {
  const isTaxInclusive = promotion.is_tax_inclusive ?? false

  if (promotion.allocation === ApplicationMethodAllocation.ACROSS) {
    const quantity = getApplicableQuantity(lineItem, promotion.max_quantity)

    // Choose unit price based on tax-inclusive flag
    const unitPrice = isTaxInclusive
      ? getLineItemUnitPriceGross(lineItem)
      : getLineItemUnitPriceSubtotal(lineItem)

    const lineItemTotal = MathBN.mult(unitPrice, quantity)
    const applicableTotal = MathBN.sub(lineItemTotal, promotion.applied_value)

    if (MathBN.lte(applicableTotal, 0)) {
      return applicableTotal
    }

    const promotionValue = getPromotionValue(
      promotion,
      applicableTotal,
      lineItemsTotal
    )

    return MathBN.min(promotionValue, applicableTotal)
  }

  // EACH allocation — choose total based on tax-inclusive flag
  const itemTotal = isTaxInclusive
    ? getLineItemGrossTotal(lineItem)
    : getLineItemSubtotal(lineItem)

  const remainingItemTotal = MathBN.sub(itemTotal, promotion.applied_value)

  const unitPrice = isTaxInclusive
    ? MathBN.div(getLineItemGrossTotal(lineItem), lineItem.quantity)
    : MathBN.div(getLineItemSubtotal(lineItem), lineItem.quantity)

  const maximumPromotionTotal = MathBN.mult(
    unitPrice,
    promotion.max_quantity ?? MathBN.convert(1)
  )
  const applicableTotal = MathBN.min(remainingItemTotal, maximumPromotionTotal)

  if (MathBN.lte(applicableTotal, 0)) {
    return MathBN.convert(0)
  }

  const promotionValue = getPromotionValue(
    promotion,
    applicableTotal,
    lineItemsTotal
  )

  return MathBN.min(promotionValue, applicableTotal)
}
```

- [ ] **Step 2: Build and verify**

Run:
```bash
cd packages/core/utils && yarn build
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/core/utils/src/totals/promotion/index.ts
git commit -m "feat(utils): branch promotion totals calculation on is_tax_inclusive"
```

---

### Task 7: Admin Dashboard — i18n Translations

**Files:**
- Modify: `packages/admin/dashboard/src/i18n/translations/en.json`

- [ ] **Step 1: Add translation keys**

In `packages/admin/dashboard/src/i18n/translations/en.json`, inside the `"promotions"` object's `"fields"` section, add:

```json
"is_tax_inclusive": "Tax inclusive"
```

Inside the `"promotions"` object's `"form"` section, add:

```json
"tax_inclusive": {
  "title": "Tax inclusive",
  "description": "When enabled, the promotion value is calculated on gross (post-tax) amounts. When disabled, it is calculated on net (pre-tax) amounts."
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/dashboard/src/i18n/translations/en.json
git commit -m "feat(dashboard): add is_tax_inclusive i18n translations"
```

---

### Task 8: Admin Dashboard — Create Promotion Form

**Files:**
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/form-schema.ts:22`
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts` (each template defaults)
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx:51-72`

- [ ] **Step 1: Add to form schema**

In `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/form-schema.ts`, add `is_tax_inclusive` to the schema object after `template_id` (line 22):

```typescript
    template_id: z.string().optional(),
    is_tax_inclusive: z.boolean().optional().default(false),
    campaign_id: z.string().optional(),
```

- [ ] **Step 2: Add to template defaults**

In `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts`, add `is_tax_inclusive: false` to each template's `defaults` object. For example, for the first template (line 14-18):

```typescript
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
```

Repeat for all 8 templates:
- `amount_off_products` (line 14)
- `amount_off_order` (line 29)
- `percentage_off_product` (line 44)
- `percentage_off_order` (line 59)
- `buy_get` (line 77)
- `spend_threshold_discount` (line 94)
- `price_range_gift` (line 113)
- `buy_x_get_percentage_off` (line 128)

- [ ] **Step 3: Add default value and SwitchBox to create form**

In `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx`:

Add the `SwitchBox` import at the top (after the existing imports around line 36):

```typescript
import { SwitchBox } from "../../../../../components/common/switch-box"
```

Add `is_tax_inclusive: false` to `defaultValues` (after `template_id` at line 53):

```typescript
  template_id: templates[0].id!,
  is_tax_inclusive: false,
  campaign_choice: "none" as "none",
```

Add the `is_tax_inclusive` field to the form submission data — in every `handleSubmit` / `handleContinue` / form data mapping where `is_automatic` is sent to the API, also include:

```typescript
is_tax_inclusive: data.is_tax_inclusive ?? false,
```

Add a `SwitchBox` UI element in the promotion details tab, after the code field section. Find the promotion tab content and add:

```tsx
<SwitchBox
  control={form.control}
  name="is_tax_inclusive"
  label={t("promotions.form.tax_inclusive.title")}
  description={t("promotions.form.tax_inclusive.description")}
/>
```

- [ ] **Step 4: Build and verify**

Run:
```bash
cd packages/admin/dashboard && yarn build
```
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/admin/dashboard/src/routes/promotions/promotion-create/
git commit -m "feat(dashboard): add is_tax_inclusive toggle to create promotion form"
```

---

### Task 9: Admin Dashboard — Promotion Detail & Edit

**Files:**
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-detail/components/promotion-general-section/promotion-general-section.tsx:172-182`
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-edit-details/components/edit-promotion-form/edit-promotion-details-form.tsx:19-53`

- [ ] **Step 1: Display `is_tax_inclusive` in detail view**

In `packages/admin/dashboard/src/routes/promotions/promotion-detail/components/promotion-general-section/promotion-general-section.tsx`, add a new section before the closing `</Container>` (before line 183):

```tsx
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          {t("promotions.fields.is_tax_inclusive")}
        </Text>

        <Text size="small" leading="compact" className="text-pretty">
          {promotion.is_tax_inclusive ? t("fields.true") : t("fields.false")}
        </Text>
      </div>
```

- [ ] **Step 2: Add `is_tax_inclusive` to edit form schema and logic**

In `packages/admin/dashboard/src/routes/promotions/promotion-edit-details/components/edit-promotion-form/edit-promotion-details-form.tsx`:

Add `SwitchBox` import:
```typescript
import { SwitchBox } from "../../../../../components/common/switch-box"
```

Add to `EditPromotionSchema` (after line 21 `code: zod.string().min(1),`):
```typescript
  is_tax_inclusive: zod.boolean().optional(),
```

Add to `defaultValues` in `useForm` (after `is_automatic` on line 45):
```typescript
      is_tax_inclusive: promotion.is_tax_inclusive ?? false,
```

Add to the `handleSubmit` data sent to `mutateAsync` (after `is_automatic` on line 70):
```typescript
        is_tax_inclusive: data.is_tax_inclusive,
```

Add `SwitchBox` to the form JSX, after the `is_automatic` radio group (after line 171, before the code field):

```tsx
            <SwitchBox
              control={form.control}
              name="is_tax_inclusive"
              label={t("promotions.form.tax_inclusive.title")}
              description={t("promotions.form.tax_inclusive.description")}
            />
```

- [ ] **Step 3: Build and verify**

Run:
```bash
cd packages/admin/dashboard && yarn build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/dashboard/src/routes/promotions/promotion-detail/ packages/admin/dashboard/src/routes/promotions/promotion-edit-details/
git commit -m "feat(dashboard): display and edit is_tax_inclusive in promotion detail/edit views"
```

---

### Task 10: Full Build Verification

- [ ] **Step 1: Build all affected packages in dependency order**

Run:
```bash
cd /Users/leminhchi/Documents/Lyra/medusa && yarn build
```

If full build is too slow, build the specific packages in order:
```bash
cd packages/core/types && yarn build
cd ../../modules/promotion && yarn build
cd ../../core/utils && yarn build
cd ../../core/core-flows && yarn build
cd ../../medusa && yarn build  # this is packages/medusa
cd ../../admin/dashboard && yarn build
```

Expected: All builds succeed with no TypeScript errors.

- [ ] **Step 2: Run unit tests for affected packages**

```bash
cd packages/core/utils && npx jest --runInBand --bail --forceExit
cd ../../modules/promotion && npx jest --runInBand --bail --forceExit
```

Expected: All existing tests pass. The fork's gross-amount tests should still pass since `is_tax_inclusive` defaults to `false` and the existing fork logic is preserved for the `true` path.

- [ ] **Step 3: Commit any test fixes if needed**

If any tests fail due to the new parameter, fix them by ensuring the `is_tax_inclusive` parameter is passed correctly.

---

### Task 11: Manual Verification Checklist

- [ ] **Step 1: Verify database migration**

Start the Medusa server and confirm the migration runs:
```bash
npx medusa db:migrate
```
Expected: Migration applies successfully, `promotion` table has `is_tax_inclusive` column.

- [ ] **Step 2: Verify API — create promotion with `is_tax_inclusive: true`**

Using the admin API, create a promotion:
```bash
curl -X POST http://localhost:9000/admin/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "code": "TEST_TAX_INCL",
    "type": "standard",
    "is_tax_inclusive": true,
    "application_method": {
      "type": "percentage",
      "value": 10,
      "target_type": "order",
      "allocation": "across"
    }
  }'
```
Expected: Promotion created with `is_tax_inclusive: true` in the response.

- [ ] **Step 3: Verify API — create promotion with `is_tax_inclusive: false`**

```bash
curl -X POST http://localhost:9000/admin/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "code": "TEST_TAX_EXCL",
    "type": "standard",
    "is_tax_inclusive": false,
    "application_method": {
      "type": "percentage",
      "value": 10,
      "target_type": "order",
      "allocation": "across"
    }
  }'
```
Expected: Promotion created with `is_tax_inclusive: false`.

- [ ] **Step 4: Verify admin dashboard**

Open the admin dashboard and verify:
1. Create Promotion form shows the "Tax inclusive" toggle
2. Promotion detail page displays the tax inclusive status
3. Edit promotion form allows changing the toggle
4. All 8 templates work with the new field
