
Issue confirmed and root cause identified.

What is happening:
- The link fetch to backend works (the quote is returned with 200).
- The page goes blank due to a React runtime crash in `GuestForm`:
  - `Rendered more hooks than during the previous render`
  - `React has detected a change in the order of Hooks`
- Cause: a hook (`useMemo` for `mealsByDate`) is declared after conditional early returns (`quoteLoading`, `quoteError`, `!quoteId`, `done`), so first render and next render execute different hook counts.

Relevant file:
- `src/pages/GuestForm.tsx`

Implementation plan:
1. Fix hook-order violation in `GuestForm`
   - Move all hooks/derived hook values to run before any conditional `return`.
   - Specifically move `mealsByDate` `useMemo` (and keep other hook logic) above the early-return block.
   - Keep all existing business logic/UI behavior unchanged (quote prefill, meal preferences, submit flow).

2. Keep render guards, but only after hooks
   - Preserve existing early states:
     - loading screen
     - invalid/missing quote screen
     - not-approved quote screen
     - success screen
   - Ensure they run after hook declarations so hook order is stable across renders.

3. Regression safety checks (no functionality change)
   - Confirm link with approved quote opens form (not blank).
   - Confirm invalid quote still shows error screen (not blank).
   - Confirm no-quote URL still shows “invalid link” screen.
   - Confirm meal step behavior still works (arrival/departure lunch exclusivity + sandwich toggles).

4. Runtime verification
   - Re-open `/guest-form?quote=<approved-id>` in preview and published URL.
   - Check browser console has no hook-order errors.
   - Confirm `get-quote-for-form` request remains 200 and UI renders.

Scope/impact:
- Frontend-only fix, single file (`src/pages/GuestForm.tsx`).
- No database, schema, backend function, or quote logic changes.
