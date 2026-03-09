

# Redesign Step 2 (חלוקת אוהלים) — Structured Tent Table with Accessible Option

## Village Tent Inventory (for max limits)

| Type | Hebrew Label | Beds/Tent | Max Tents | Source |
|------|-------------|-----------|-----------|--------|
| צוות (Staff/VIP) | אוהלי צוות — 3 מיטות | 3 | 10 | VIP 80-89 |
| קבוצה (Group) | אוהלי קבוצה — 6 מיטות | 6 | 9 | N5 (5) + N6 (4) |
| חברותא (Chevruta) | אוהלי חברותא — 8 מיטות | 8 | 31 | N1-N3 (24) + N4 (4) + N7 regular (3) |
| נגיש (Accessible) | אוהל נגיש — 3 מיטות | 3 | 1 | N7 tent 74 |

## UI Design (matching reference image style)

1. **Info box** — light gray card listing available tent types with bed counts
2. **Table with 4 rows**, each row has: tent type label (fixed) | boys count input | girls count input
   - Row 1: אוהלי צוות (3 מיטות) — max 10 total
   - Row 2: אוהלי חברותא (8 מיטות) — max 31 total
   - Row 3: אוהלי קבוצה (6 מיטות) — max 9 total
   - Row 4: אוהל נגיש (3 מיטות) ♿ — max 1 total
3. **All rows are fixed** (no dropdown needed) — each type appears once
4. **Optional notes** textarea below for special requests

## Form State Changes

Replace `tent_distribution_notes: string` with structured data:

```ts
tent_distribution: [
  { type: 'staff', label: 'אוהלי צוות (3 מיטות)', maxTents: 10, beds: 3, girls: 0, boys: 0 },
  { type: 'chevruta', label: 'אוהלי חברותא (8 מיטות)', maxTents: 31, beds: 8, girls: 0, boys: 0 },
  { type: 'group', label: 'אוהלי קבוצה (6 מיטות)', maxTents: 9, beds: 6, girls: 0, boys: 0 },
  { type: 'accessible', label: 'אוהל נגיש ♿ (3 מיטות)', maxTents: 1, beds: 3, girls: 0, boys: 0 },
]
```

Keep `tent_distribution_notes` for free-text additions.

## Validation
- Each row: `boys + girls <= maxTents`
- Accessible row: `boys + girls <= 1`
- Number inputs use `min=0` and dynamically computed `max`

## Submission
Serialize `tent_distribution` array into the existing `tent_distribution_notes` field as a readable string summary, so no database migration is needed. The edge function and `guest_form_submissions` table remain unchanged.

## File: `src/pages/GuestForm.tsx`
- Add `TENT_TYPES` constant array with type, label, beds, maxTents
- Add `tent_distribution` array to form state (4 fixed rows)
- Replace Step 2 textarea with: info card + styled table (header row + 4 data rows with number inputs)
- Accessible row gets a ♿ badge
- On submit, format tent_distribution into a human-readable string for `tent_distribution_notes`

