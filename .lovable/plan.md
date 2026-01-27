

## Plan: Add Settings Button to Navigation

### Summary
Add a visible Settings (הגדרות) button to the main navigation header so users can easily access the Settings page, Admin Groups, and data management features.

---

### What Will Be Added

A Settings button with a gear icon (⚙️) in the header area, next to the Global Search component.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  🏕️ חוות אהרונסון                    [🔍 חיפוש...]  [⚙️ הגדרות]        │
│     Glow Glamping & Ha-Dor Ha-Ba                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Changes Required

**File: `src/pages/Index.tsx`**

1. **Import the Settings icon** from lucide-react (line ~36):
   - Add `Settings` to the import list

2. **Add Settings button in the header** (around line 205):
   - Place a Settings button next to `<GlobalSearch />`
   - Button will navigate to `/settings` on click
   - Style: outline variant, includes gear icon and Hebrew label "הגדרות"

---

### Technical Implementation

```tsx
// In the header section, after GlobalSearch:
<div className="flex items-center gap-3">
  <GlobalSearch />
  <Button 
    variant="outline" 
    onClick={() => navigate('/settings')}
    className="flex items-center gap-2"
  >
    <Settings className="w-5 h-5" />
    <span className="hidden sm:inline">{HE.nav.settings}</span>
  </Button>
</div>
```

**Design notes:**
- On mobile: Shows only the gear icon (label hidden with `hidden sm:inline`)
- On desktop: Shows both icon and "הגדרות" label
- Uses existing `Button` component with `outline` variant for subtle appearance
- Uses existing translation `HE.nav.settings` for the label

---

### Result

After this change:
- Settings button visible in the top-right header area
- One click navigates directly to `/settings`
- From Settings, users can access Admin Groups (ניהול קבוצות / הזמנות)
- Mobile-friendly with icon-only display on small screens

