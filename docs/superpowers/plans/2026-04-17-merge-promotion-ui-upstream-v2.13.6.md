# Merge Fork Promotion UI with Medusa v2.13.6 Upstream

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port upstream Medusa v2.13.6's promotion admin-dashboard UI improvements (i18n-keyed template titles/descriptions, per-template `hiddenFields` variants, conditional rendering of the `is_tax_inclusive` toggle) into the fork while preserving the 3 custom Lyra promotion templates (`spend_threshold_discount`, `price_range_gift`, `buy_x_get_percentage_off`) and the fork's gross-total promotion calculation logic.

**Architecture:** The fork already contains the full `is_tax_inclusive` backend stack (model, migration, validators, types, workflow, totals branching) — this plan only touches the admin dashboard to adopt upstream's UX for tax-inclusive toggle visibility and translation-key-based template metadata. Zero changes to promotion calculation logic, models, or APIs. The 3 custom templates keep their hardcoded metadata migrated into i18n keys and join the "hide `is_tax_inclusive`" list alongside upstream's percentage/buyget templates.

**Tech Stack:** React + react-hook-form + Zod + i18next + Tailwind + `@8medusa/ui` (admin dashboard package)

---

## File Structure

Files modified in this plan:

| Path | Responsibility |
|---|---|
| `packages/admin/dashboard/src/i18n/translations/en.json` | Add `promotions.templates.<id>.title/description` keys for all 8 templates (5 base + 3 custom) |
| `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts` | Refactor to per-template `hiddenFields` variants; switch `title`/`description` to i18n keys; hide `is_tax_inclusive` on all templates except the 2 fixed-amount ones |
| `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx` | Wrap the `is_tax_inclusive` SwitchBox in a `hiddenFields` conditional; translate template card `label`/`description` via `t()` |
| `packages/admin/dashboard/src/routes/promotions/promotion-edit-details/components/edit-promotion-form/edit-promotion-details-form.tsx` | Remove the `is_tax_inclusive` SwitchBox (upstream treats the field as immutable post-creation); drop it from the Zod schema and update payload |
| `packages/medusa/src/api/admin/promotions/validators.ts` | Drop `is_tax_inclusive` from `AdminUpdatePromotion` to match upstream immutability semantics |

No other files should change. Verify with `git status` at the end of each task.

---

## Task 1: Add `promotions.templates` i18n keys to `en.json`

**Files:**
- Modify: `packages/admin/dashboard/src/i18n/translations/en.json` (add new `templates` block inside `promotions`)

**Rationale:** Upstream v2.13.6 moved template `title`/`description` from hardcoded strings into i18n keys. The fork currently has none because its 3 custom templates used hardcoded English. We add keys for all 8 templates (5 upstream base + 3 Lyra custom). No other language files are touched in this plan — i18next falls back to `en.json` when a key is missing in a locale.

- [ ] **Step 1: Locate the existing `promotions` object**

Run: `grep -n '"promotions": {' packages/admin/dashboard/src/i18n/translations/en.json`
Expected: Output `1978:  "promotions": {`

- [ ] **Step 2: Insert the `templates` block after `"sections"` (line ~1982)**

Edit `packages/admin/dashboard/src/i18n/translations/en.json`. Find:

```json
    "sections": {
      "details": "Promotion Details"
    },
    "tabs": {
```

Replace with:

```json
    "sections": {
      "details": "Promotion Details"
    },
    "templates": {
      "amount_off_products": {
        "title": "Amount off products",
        "description": "Discount specific products or collection of products"
      },
      "amount_off_order": {
        "title": "Amount off order",
        "description": "Discounts the total order amount"
      },
      "percentage_off_product": {
        "title": "Percentage off product",
        "description": "Discounts a percentage off selected products"
      },
      "percentage_off_order": {
        "title": "Percentage off order",
        "description": "Discounts a percentage of the total order amount"
      },
      "buy_get": {
        "title": "Buy X Get Y",
        "description": "Buy X product(s), get Y product(s)"
      },
      "spend_threshold_discount": {
        "title": "Spend Threshold Discount",
        "description": "Get a discount when order total exceeds a set amount"
      },
      "price_range_gift": {
        "title": "Buy in price range, get gift product",
        "description": "Get a gift product when the order total is within a specific price range"
      },
      "buy_x_get_percentage_off": {
        "title": "Buy X get percentage off",
        "description": "Buy X product(s), get a percentage off each product"
      }
    },
    "tabs": {
```

- [ ] **Step 3: Validate JSON parses**

Run: `python3 -c "import json; json.load(open('packages/admin/dashboard/src/i18n/translations/en.json'))" && echo OK`
Expected: `OK`

- [ ] **Step 4: Verify the 8 new keys resolve**

Run:
```bash
python3 -c "
import json
d=json.load(open('packages/admin/dashboard/src/i18n/translations/en.json'))
t=d['promotions']['templates']
ids=['amount_off_products','amount_off_order','percentage_off_product','percentage_off_order','buy_get','spend_threshold_discount','price_range_gift','buy_x_get_percentage_off']
for i in ids:
  assert t[i]['title'] and t[i]['description'], f'missing: {i}'
print('all 8 keys present')
"
```
Expected: `all 8 keys present`

- [ ] **Step 5: Commit**

```bash
git add packages/admin/dashboard/src/i18n/translations/en.json
git commit -m "i18n(dashboard): add promotions.templates keys for all 8 templates"
```

---

## Task 2: Refactor `templates.ts` — per-template hiddenFields, i18n keys, hide `is_tax_inclusive`

**Files:**
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts` (full file rewrite)

**Rationale:**
- Adopt upstream's pattern of per-template `hiddenFields` variants (e.g., `percentageOfProductHiddenFields`) rather than a single `commonHiddenFields`.
- Hide `is_tax_inclusive` on all templates where it is semantically meaningless: percentage-based (`percentage_off_product`, `percentage_off_order`), buy-get (`buy_get`), and all 3 Lyra custom templates. Only `amount_off_products` and `amount_off_order` (both fixed-amount) keep the toggle visible.
- Replace hardcoded English `title`/`description` strings with i18n keys `promotions.templates.<id>.title` / `promotions.templates.<id>.description`. (The consuming component will wrap these in `t()` — see Task 3.)
- Do **not** restore upstream's `shipping_discount` template (user decision).
- Preserve fork's `commonHiddenFields = ["type", "application_method.type", "application_method.allocation"]` (hides allocation globally — fork UX choice).

- [ ] **Step 1: Replace the entire file contents**

Overwrite `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts` with:

```typescript
const commonHiddenFields = [
  "type",
  "application_method.type",
  "application_method.allocation",
]

const amountOfProductHiddenFields = [...commonHiddenFields]

const amountOfOrderHiddenFields = [...commonHiddenFields]

const percentageOfProductHiddenFields = [
  ...commonHiddenFields,
  "is_tax_inclusive",
]

const percentageOfOrderHiddenFields = [
  ...commonHiddenFields,
  "is_tax_inclusive",
]

const buyGetHiddenFields = [
  ...commonHiddenFields,
  "application_method.value",
  "is_tax_inclusive",
]

const spendThresholdDiscountHiddenFields = [
  ...commonHiddenFields,
  "is_tax_inclusive",
]

const priceRangeGiftHiddenFields = [
  ...commonHiddenFields,
  "is_tax_inclusive",
]

const buyXGetPercentageOffHiddenFields = [
  ...commonHiddenFields,
  "rules",
  "is_tax_inclusive",
]

export const templates = [
  {
    id: "amount_off_products",
    type: "standard",
    title: "promotions.templates.amount_off_products.title",
    description: "promotions.templates.amount_off_products.description",
    hiddenFields: amountOfProductHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "each",
        target_type: "items",
        type: "fixed",
      },
    },
  },
  {
    id: "amount_off_order",
    type: "standard",
    title: "promotions.templates.amount_off_order.title",
    description: "promotions.templates.amount_off_order.description",
    hiddenFields: amountOfOrderHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "fixed",
      },
    },
  },
  {
    id: "percentage_off_product",
    type: "standard",
    title: "promotions.templates.percentage_off_product.title",
    description: "promotions.templates.percentage_off_product.description",
    hiddenFields: percentageOfProductHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "each",
        target_type: "items",
        type: "percentage",
      },
    },
  },
  {
    id: "percentage_off_order",
    type: "standard",
    title: "promotions.templates.percentage_off_order.title",
    description: "promotions.templates.percentage_off_order.description",
    hiddenFields: percentageOfOrderHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "percentage",
      },
    },
  },
  {
    id: "buy_get",
    type: "buy_get",
    title: "promotions.templates.buy_get.title",
    description: "promotions.templates.buy_get.description",
    hiddenFields: buyGetHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "buyget",
      application_method: {
        type: "percentage",
        value: 100,
        apply_to_quantity: 1,
        max_quantity: 1,
      },
    },
  },
  {
    id: "spend_threshold_discount",
    type: "standard",
    title: "promotions.templates.spend_threshold_discount.title",
    description: "promotions.templates.spend_threshold_discount.description",
    hiddenFields: spendThresholdDiscountHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "percentage",
      },
    },
  },
  {
    id: "price_range_gift",
    type: "standard",
    title: "promotions.templates.price_range_gift.title",
    description: "promotions.templates.price_range_gift.description",
    hiddenFields: priceRangeGiftHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "fixed",
      },
    },
  },
  {
    id: "buy_x_get_percentage_off",
    type: "standard",
    title: "promotions.templates.buy_x_get_percentage_off.title",
    description: "promotions.templates.buy_x_get_percentage_off.description",
    hiddenFields: buyXGetPercentageOffHiddenFields,
    defaults: {
      is_automatic: "false",
      is_tax_inclusive: false,
      type: "buyget",
      application_method: {
        type: "percentage",
        apply_to_quantity: 1,
        max_quantity: 1,
      },
    },
  },
]
```

- [ ] **Step 2: Verify all 8 template ids preserved**

Run: `grep -E '^\s+id: ' packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts | wc -l`
Expected: `8`

- [ ] **Step 3: Verify all 8 title keys reference existing translations**

Run:
```bash
python3 -c "
import json,re
d=json.load(open('packages/admin/dashboard/src/i18n/translations/en.json'))
t=d['promotions']['templates']
with open('packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts') as f: src=f.read()
ids=re.findall(r'promotions\.templates\.([a-z_]+)\.title', src)
for i in ids:
  assert i in t, f'missing i18n key for: {i}'
print(f'verified {len(ids)} title keys')
"
```
Expected: `verified 8 title keys`

- [ ] **Step 4: Verify `is_tax_inclusive` hidden on 6 of 8 templates**

Run: `grep -c '"is_tax_inclusive"' packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts`
Expected: `6` — one quoted `"is_tax_inclusive"` entry in each of the 6 "hidden" variants: `percentageOfProductHiddenFields`, `percentageOfOrderHiddenFields`, `buyGetHiddenFields`, `spendThresholdDiscountHiddenFields`, `priceRangeGiftHiddenFields`, `buyXGetPercentageOffHiddenFields`.

Also run: `grep -c 'is_tax_inclusive: false' packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts`
Expected: `8` — unquoted default value, one per template.

Verification: open the file and confirm only `amountOfProductHiddenFields` and `amountOfOrderHiddenFields` do NOT contain `"is_tax_inclusive"`.

- [ ] **Step 5: Commit**

```bash
git add packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/templates.ts
git commit -m "refactor(dashboard): per-template hiddenFields + i18n keys in promotion templates

- Adopt upstream v2.13.6 pattern of per-template hiddenFields variants
- Hide is_tax_inclusive on percentage/buyget templates and all 3 Lyra custom types
- Migrate title/description from hardcoded strings to i18n keys"
```

---

## Task 3: Translate template card label/description in `create-promotion-form.tsx`

**Files:**
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx:699-708`

**Rationale:** After Task 2, `template.title` and `template.description` are i18n *keys* (e.g. `"promotions.templates.amount_off_products.title"`), not display strings. The `<RadioGroup.ChoiceBox>` currently renders them verbatim — we must resolve them via the existing `t` function (already in scope via `useTranslation()`).

- [ ] **Step 1: Confirm current state**

Run: `sed -n '699,708p' packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx`
Expected output contains `label={template.title}` and `description={template.description}`.

- [ ] **Step 2: Apply the edit**

In `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx`, find:

```tsx
                              {templates.map((template) => {
                                return (
                                  <RadioGroup.ChoiceBox
                                    key={template.id}
                                    value={template.id}
                                    label={template.title}
                                    description={template.description}
                                  />
                                )
                              })}
```

Replace with:

```tsx
                              {templates.map((template) => {
                                return (
                                  <RadioGroup.ChoiceBox
                                    key={template.id}
                                    value={template.id}
                                    label={t(template.title)}
                                    description={t(template.description)}
                                  />
                                )
                              })}
```

- [ ] **Step 3: Verify `t` is already in scope**

Run: `grep -n 'const { t } = useTranslation' packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx`
Expected: one match (already present; no import needed).

- [ ] **Step 4: Commit**

```bash
git add packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx
git commit -m "feat(dashboard): resolve promotion template title/description via i18n"
```

---

## Task 4: Conditionally render `is_tax_inclusive` SwitchBox in create form

**Files:**
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx:868-874`

**Rationale:** The `is_tax_inclusive` toggle must only appear for the 2 fixed-amount templates (`amount_off_products`, `amount_off_order`). For the other 6 templates, the toggle is in their `hiddenFields` array (per Task 2) — we use the same `hiddenFields.includes(...)` check that already gates the `type` radio below it (line 876).

- [ ] **Step 1: Apply the edit**

In `packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx`, find:

```tsx
                  <SwitchBox
                    control={form.control}
                    name="is_tax_inclusive"
                    label={t("promotions.form.tax_inclusive.title")}
                    description={t("promotions.form.tax_inclusive.description")}
                  />
```

Replace with:

```tsx
                  {!currentTemplate?.hiddenFields?.includes(
                    "is_tax_inclusive"
                  ) && (
                    <SwitchBox
                      control={form.control}
                      name="is_tax_inclusive"
                      label={t("promotions.form.tax_inclusive.title")}
                      description={t("promotions.form.tax_inclusive.description")}
                    />
                  )}
```

- [ ] **Step 2: Verify `currentTemplate` is in scope at that location**

Run: `grep -n 'currentTemplate' packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx | head -5`
Expected: At least one `const currentTemplate = ...` declaration earlier in the component body. (The fork already uses `currentTemplate?.hiddenFields?.includes(...)` for other fields — see line 876 onward — so it is guaranteed to be in scope at line 868.)

- [ ] **Step 3: Commit**

```bash
git add packages/admin/dashboard/src/routes/promotions/promotion-create/components/create-promotion-form/create-promotion-form.tsx
git commit -m "feat(dashboard): hide is_tax_inclusive toggle on templates where it doesn't apply"
```

---

## Task 5: Remove `is_tax_inclusive` from the promotion edit form

**Files:**
- Modify: `packages/admin/dashboard/src/routes/promotions/promotion-edit-details/components/edit-promotion-form/edit-promotion-details-form.tsx`

**Rationale:** Upstream Medusa v2.13.6 documents that `is_tax_inclusive` is immutable after creation ("A promotion's tax-inclusiveness cannot be updated after it has been created"). The fork's edit form currently exposes a toggle and sends the value in the update payload, which conflicts with upstream semantics. Remove the toggle, the Zod field, the default initialization, and the payload entry. The detail view (which displays the value as read-only) is retained unchanged.

- [ ] **Step 1: Remove `is_tax_inclusive` from the Zod schema (line 23)**

Find:

```typescript
const EditPromotionSchema = zod.object({
  is_automatic: zod.string().toLowerCase(),
  code: zod.string().min(1),
  is_tax_inclusive: zod.boolean().optional(),
  status: zod.enum(["active", "inactive", "draft"]),
```

Replace with:

```typescript
const EditPromotionSchema = zod.object({
  is_automatic: zod.string().toLowerCase(),
  code: zod.string().min(1),
  status: zod.enum(["active", "inactive", "draft"]),
```

- [ ] **Step 2: Remove `is_tax_inclusive` from `defaultValues` (line 48)**

Find:

```typescript
    defaultValues: {
      is_automatic: promotion.is_automatic!.toString(),
      is_tax_inclusive: promotion.is_tax_inclusive ?? false,
      code: promotion.code,
```

Replace with:

```typescript
    defaultValues: {
      is_automatic: promotion.is_automatic!.toString(),
      code: promotion.code,
```

- [ ] **Step 3: Remove `is_tax_inclusive` from the mutation payload (line 74)**

Find:

```typescript
    await mutateAsync(
      {
        is_automatic: data.is_automatic === "true",
        is_tax_inclusive: data.is_tax_inclusive,
        code: data.code,
```

Replace with:

```typescript
    await mutateAsync(
      {
        is_automatic: data.is_automatic === "true",
        code: data.code,
```

- [ ] **Step 4: Remove the SwitchBox (line 180-185)**

Find:

```tsx
            <SwitchBox
              control={form.control}
              name="is_tax_inclusive"
              label={t("promotions.form.tax_inclusive.title")}
              description={t("promotions.form.tax_inclusive.description")}
            />
```

Delete all 6 lines (including surrounding blank lines if they create a double-blank).

- [ ] **Step 5: Remove unused `SwitchBox` import if no longer referenced**

Run: `grep -c 'SwitchBox' packages/admin/dashboard/src/routes/promotions/promotion-edit-details/components/edit-promotion-form/edit-promotion-details-form.tsx`

If the count is `1` (only the import remains), find and delete the import line:

```typescript
import { SwitchBox } from "../../../../../components/common/switch-box"
```

If count is `0` already (import absent), skip.

- [ ] **Step 6: Verify no dangling references**

Run: `grep -n 'is_tax_inclusive' packages/admin/dashboard/src/routes/promotions/promotion-edit-details/components/edit-promotion-form/edit-promotion-details-form.tsx`
Expected: no output (zero matches).

- [ ] **Step 7: Commit**

```bash
git add packages/admin/dashboard/src/routes/promotions/promotion-edit-details/components/edit-promotion-form/edit-promotion-details-form.tsx
git commit -m "fix(dashboard): remove is_tax_inclusive from promotion edit form

is_tax_inclusive is immutable post-creation per upstream v2.13.6 semantics;
the detail view still renders the value read-only."
```

---

## Task 6: Drop `is_tax_inclusive` from `AdminUpdatePromotion` validator

**Files:**
- Modify: `packages/medusa/src/api/admin/promotions/validators.ts`

**Rationale:** With the UI no longer submitting `is_tax_inclusive` on update (Task 5), keeping it in the validator would accept requests from non-UI clients that bypass the immutability rule. Align with upstream v2.13.6 which only permits `is_tax_inclusive` on `AdminCreatePromotion`.

- [ ] **Step 1: Locate both occurrences**

Run: `grep -n 'is_tax_inclusive' packages/medusa/src/api/admin/promotions/validators.ts`
Expected: 2 matches — one in `AdminCreatePromotion` (keep) and one in `AdminUpdatePromotion` (remove).

- [ ] **Step 2: Open the file and confirm the Update validator**

Read lines around the second `is_tax_inclusive` match.

- [ ] **Step 3: Remove the line from `AdminUpdatePromotion`**

Find the block (exact text will match the fork's current validator; the line looks like):

```typescript
  is_tax_inclusive: z.boolean().optional(),
```

inside the `AdminUpdatePromotion` schema. Delete only that line in the Update schema. Leave the identical line in `AdminCreatePromotion` untouched.

- [ ] **Step 4: Verify only one occurrence remains**

Run: `grep -c 'is_tax_inclusive' packages/medusa/src/api/admin/promotions/validators.ts`
Expected: `1`

- [ ] **Step 5: Commit**

```bash
git add packages/medusa/src/api/admin/promotions/validators.ts
git commit -m "fix(medusa): reject is_tax_inclusive on promotion update (immutable post-create)"
```

---

## Task 7: Build verification

**Files:** none

**Rationale:** The dashboard has no existing unit tests for these files, and admin UI changes cannot be meaningfully asserted via Jest. TypeScript + lint serve as the regression net; a dev-server browser check completes the verification (per `CLAUDE.md`: "For UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete").

- [ ] **Step 1: Type-check and build the dashboard**

Run: `cd packages/admin/dashboard && yarn build`
Expected: build succeeds with no new type errors. If errors reference the files in this plan, fix them before proceeding. Pre-existing errors (not in the files above) can be noted but left untouched.

- [ ] **Step 2: Type-check dependent core packages**

Run: `yarn build --filter=@8medusa/medusa --filter=@8medusa/types`
Expected: succeeds. The validator change (Task 6) is the only core-package touch; types package needs no change because `BasePromotion` keeps `is_tax_inclusive` (still valid on the model and on create).

- [ ] **Step 3: Lint changed files**

Run: `yarn lint:path packages/admin/dashboard/src/routes/promotions packages/admin/dashboard/src/i18n/translations/en.json packages/medusa/src/api/admin/promotions`
Expected: no new lint errors.

- [ ] **Step 4: Manual browser verification**

Start the dev server:

```bash
cd packages/admin/dashboard && yarn dev
```

In the browser, visit the admin promotions section and verify each of the following:

1. **Create promotion page** → 8 template cards render with the correct English titles/descriptions (not the raw i18n key strings).
2. **Select `Amount off products`** → the "Tax inclusive" toggle is visible above the Type radio.
3. **Select `Amount off order`** → toggle visible.
4. **Select `Percentage off product`** → toggle is **hidden**.
5. **Select `Percentage off order`** → toggle is **hidden**.
6. **Select `Buy X Get Y`** → toggle is **hidden**.
7. **Select `Spend Threshold Discount`** → toggle is **hidden**; custom min/max cart price fields still render.
8. **Select `Buy in price range, get gift product`** → toggle is **hidden**; gift price range fields still render.
9. **Select `Buy X get percentage off`** → toggle is **hidden**; buy-rules section still renders.
10. **Create a new tax-inclusive promotion** (e.g. amount_off_products) → submit, verify it is created with `is_tax_inclusive: true` visible in the detail view.
11. **Open the created promotion's edit page** → no "Tax inclusive" toggle is rendered; the value is shown read-only in the detail section only.
12. **Edit + save the promotion** → save succeeds; `is_tax_inclusive` is unchanged.

- [ ] **Step 5: Final sanity check**

Run: `git log --oneline -7`
Expected: 6 commits from this plan (one per task 1–6) on top of `7e01a9a9ff`.

Run: `git status`
Expected: working tree clean.

---

## Scope boundaries (what this plan does NOT change)

- Promotion calculation logic in `packages/core/utils/src/totals/promotion/index.ts` and `packages/modules/promotion/src/utils/compute-actions/line-items.ts` — already uses the fork's gross-total branch on `is_tax_inclusive`; no upstream delta exists between v2.12.2 and v2.13.6 for these files.
- The `is_tax_inclusive` backend (model, migration, `AdminCreatePromotion` validator, workflow step `prepare-adjustments-from-promotion-actions.ts`, query config) — already shipped in commit `efc900ca37`.
- Other language translation files (`ru.json`, `sk.json`, `hu.json`, `nl.json`, `vi.json`, `ko.json`, …) — missing `promotions.templates.<id>.title` keys will fall back to `en.json` via i18next default behavior. Translation tasks are out of scope for this merge.
- Version bumps / changeset files / npm publish — user handles.
- Non-promotion upstream deltas between v2.12.2 and v2.13.6 (framework, admin-bundler, DML, cart, order, etc.) — out of scope.
