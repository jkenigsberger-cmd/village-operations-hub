
# Add "לינה" (Sleeping) Shortcut Button to the VIP Neighborhood Page

## Problem

The neighborhoods list in the dashboard has a shortcut button to jump to the Sleeping tab, but when you navigate into the individual VIP neighborhood page (`/neighborhood/VIP`), there's no way to quickly jump to the Sleeping tab. You have to go back to the dashboard and manually switch.

## Solution

Add a "לינה" button in the VIP neighborhood page header (next to the stats), and wire it to navigate back to the dashboard's Sleeping tab.

## Changes

### 1. `src/pages/Index.tsx`
- Read `location.state?.section` on mount using `useLocation` from react-router
- If a `section` value is passed via navigation state, set `activeSection` to it
- This enables other pages to navigate to `/` with a specific section pre-selected

### 2. `src/pages/Neighborhood.tsx`
- Import `Moon` icon from lucide-react and `useNavigate` (already imported)
- Add a "לינה" button in the header area (alongside the stats row), visible only when `isVIPNeighborhood` is true
- On click, navigate to `'/'` with `{ state: { section: 'sleeping' } }`
- Style it identically to the existing shortcut in the neighborhoods section (outline variant, small size, with Moon icon)

## Technical Details

**Index.tsx** -- add location state handling:
```typescript
const location = useLocation();

useEffect(() => {
  if (location.state?.section) {
    setActiveSection(location.state.section);
  }
}, [location.state]);
```

**Neighborhood.tsx** -- add button in VIP header:
```typescript
{isVIPNeighborhood && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => navigate('/', { state: { section: 'sleeping' } })}
  >
    <Moon className="w-4 h-4 ml-1" />
    לינה
  </Button>
)}
```
