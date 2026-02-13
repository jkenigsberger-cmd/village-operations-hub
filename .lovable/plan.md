

# Simple Password Gate for Pilot

## How It Works

1. When someone opens the app, they see a clean login screen with the Hador Haba logo and a single password field
2. They enter the shared password and click "Enter"
3. If correct, they get full access to the app for **7 days** on that device
4. After 7 days, they simply re-enter the same password and continue
5. All data is always safe in the database -- the password gate only controls who can view/use the app

## What the User Sees

- Clean, branded screen with the farm logo
- Single password field and an "Enter" button
- Error message if wrong password
- Works on both mobile and desktop

## What Gets Created/Modified

| File | Change |
|------|--------|
| New backend function: `verify-password` | Receives a password, checks it against a stored secret, returns valid/invalid |
| New secret: `APP_PASSWORD` | You will be asked to set your chosen password |
| New component: `src/components/PasswordGate.tsx` | Full-screen password entry UI |
| `src/App.tsx` | Wrap all routes with the PasswordGate component |

## Technical Details

**Backend function (`supabase/functions/verify-password/index.ts`):**
- Receives `{ password: string }` via POST
- Compares against a secret called `APP_PASSWORD`
- Returns `{ valid: true/false }`
- No auth header required (this IS the authentication)
- CORS headers for browser access

**PasswordGate component (`src/components/PasswordGate.tsx`):**
- On mount, checks `localStorage` for `village_auth_token` and `village_auth_expiry`
- If token exists and expiry is in the future, renders the app (children)
- If not, shows the password screen
- On correct password, stores a token and an expiry timestamp set to 7 days from now in `localStorage`
- Displays the Hador Haba logo and a right-to-left (RTL) Hebrew UI

**App.tsx changes:**
- Wrap the entire app content with `<PasswordGate>...</PasswordGate>`

**Secret setup:**
- You will be prompted to set the `APP_PASSWORD` secret with your chosen shared password
- You can change it anytime without touching any code

