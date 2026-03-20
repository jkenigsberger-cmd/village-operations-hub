

# Make App Public (Temporary)

## Change
**`src/components/AuthGate.tsx`** — Add `const PUBLIC_MODE = true;` at top, and `if (PUBLIC_MODE) return <>{children}</>;` as the first line inside the component, before any auth checks.

## To revert later
Just say **"הפעל אימות"** or **"enable auth"** and I'll flip `PUBLIC_MODE` back to `false`.

