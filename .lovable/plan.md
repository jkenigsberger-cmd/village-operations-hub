

# Add Gender Breakdown to Staff & Drivers Groups

## Problem
Currently only the Students group has boys/girls (גברים/נשים) breakdown. Staff and Drivers/Security groups only have a total count.

## Approach
Since the DB schema only has `boys_count` and `girls_count` columns (for students), we'll store staff and drivers gender breakdown in the `special_diets` JSON payload (already used as a flexible data bag) under keys like `staffMen`, `staffWomen`, `driversMen`, `driversWomen`.

## Changes

### 1. `src/pages/GuestForm.tsx` — Form state + UI + submission

**Form state**: Add 4 new fields:
- `staff_men_count`, `staff_women_count`
- `drivers_men_count`, `drivers_women_count`

**UI (Step 3)**: For both Staff and Drivers/Security cards, after the total count input, add a gender row identical to the Students card pattern:
- Two side-by-side inputs: "גברים" and "נשים"
- The total count input becomes read-only and auto-computes from men + women
- Subtotal bar shows the sum

**Submission**: Store gender breakdown in `special_diets` JSON:
```json
{ "staffMen": 5, "staffWomen": 3, "driversMen": 2, "driversWomen": 1, ... }
```

Also update `staff_count` to be `staffMen + staffWomen` and drivers total in `general_notes` to use sum of `driversMen + driversWomen`.

### 2. `src/components/GuestFormResponseView.tsx` — Response viewer

In the Staff and Drivers/Security `ParticipantGroupCard`s, extract gender counts from `special_diets` JSON and display them as two `CountRow`s ("גברים" / "נשים") matching the Students card layout.

### 3. `supabase/functions/submit-guest-form/index.ts`

No changes needed — `special_diets` is already passed through as JSON.

