

# Add "Upgraded Coffee" Option to Group Management

## Summary
Add a yes/no toggle for "קפה משודרג" (upgraded coffee) on the group creation/edit form, and display a small badge/indicator on the group card in the groups list when enabled.

## No Database Migration Needed
The `groups` table stores flexible JSONB fields, but this is a simple boolean that fits best as a dedicated column. A migration will add `upgraded_coffee boolean default false` to the `groups` table.

## Technical Changes

### 1. Database Migration
- Add column `upgraded_coffee` (boolean, default `false`, nullable) to the `groups` table.

### 2. `src/types/adminGroups.ts`
- Add `upgradedCoffee?: boolean` to the `GroupRecord` interface.

### 3. `src/hooks/useAdminGroups.ts`
- In `mapDbRowToGroup`: map `row.upgraded_coffee` to `upgradedCoffee`.
- In `addGroup`: include `upgraded_coffee: group.upgradedCoffee || false`.
- In `updateGroup`: handle `updates.upgradedCoffee` mapping to `upgraded_coffee`.

### 4. `src/hooks/useSupabaseGroups.ts`
- Same mapping changes as `useAdminGroups.ts` (this is the other groups hook).

### 5. `src/pages/AdminGroupEdit.tsx` -- Group Form
- Add a Switch toggle labeled "☕ קפה משודרג" in the group details section (near the notes or group type area).
- Wire it to `upgradedCoffee` state in the form, included on save.

### 6. `src/pages/AdminGroups.tsx` -- Group Card
- After the status badges (line ~232), add a small coffee badge when `group.upgradedCoffee` is true:
  - A pill/badge with a coffee icon and "קפה משודרג" text, styled distinctly (e.g., brown/amber tones).

