

# Restore Bathrooms & Showers Tab in Dashboard

## What will change

A dedicated "שירותים ומקלחות" (Bathrooms & Showers) tab will be added back to the dashboard navigation, giving quick access to view and manage all bathroom and shower facilities. This restores the tab that was previously removed.

## Approach

The tab will navigate to the existing `/facilities` page (which already has the full bathrooms/showers management UI with area expansion, status toggles, and report issue flow). This keeps the dashboard clean and avoids duplicating the facility management logic.

## Technical Changes

### 1. Add `MenuSection` type variant

**File: `src/components/MobileBottomNav.tsx`**

- Add `'bathrooms'` to the `MenuSection` type union
- Add a nav item `{ key: 'bathrooms', label: 'שירותים', icon: Bath }` to the `navItems` array (positioned after `'facilities'`)

### 2. Add menu item to desktop navigation

**File: `src/pages/Index.tsx`**

- Add `{ key: 'bathrooms', label: HE.nav.bathrooms, icon: Bath }` to the `menuItems` array (after `'facilities'`)
- Add a handler in the section change logic: when `'bathrooms'` is selected, navigate to `/facilities`

### 3. Handle navigation

**File: `src/pages/Index.tsx`**

- In the `setActiveSection` handler or via an `useEffect`, detect when `activeSection` becomes `'bathrooms'` and call `navigate('/facilities')` to open the dedicated facilities page

| File | Change |
|------|--------|
| `src/components/MobileBottomNav.tsx` | Add `'bathrooms'` to MenuSection type; add nav item with Bath icon |
| `src/pages/Index.tsx` | Add bathrooms menu item; navigate to `/facilities` when selected |

