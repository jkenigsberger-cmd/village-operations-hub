

# Separate Cleaning vs Maintenance and Fix Shower Visibility

## Problem

1. The "Bathrooms" tab mixes cleaning and maintenance issues together, showing facilities that either need cleaning OR are broken. This is confusing because cleaning tasks should go to the **Housekeeping** team, while broken/maintenance issues should go to the **Maintenance** team.

2. The "Bathrooms" tab only shows facilities that currently have issues -- if showers have no issues flagged, they don't appear, making it look like showers are missing entirely.

## Solution

### Remove the "Bathrooms" tab

Since we already have dedicated **Housekeeping** and **Maintenance** tabs that properly separate these concerns, the "Bathrooms" tab is redundant. Remove it from the navigation and redirect its responsibilities:

- Facilities needing **cleaning** (bathrooms, showers, common spaces) appear in the **Housekeeping** tab (already works this way)
- Facilities needing **maintenance** (BROKEN/MAINTENANCE) appear in the **Maintenance** tab (already works this way)

### Ensure showers appear alongside bathrooms in both tabs

Currently the Housekeeping tab labels facility cleaning items generically as "Facilities". We'll split them into "Bathrooms" and "Showers" sub-sections so both are clearly visible.

### Dashboard notification

The overview "Facilities Alert" tile will continue to sum maintenance + housekeeping counts, linking to the appropriate section.

## Technical Changes

### File: `src/pages/Index.tsx`

1. **Remove the `bathrooms` menu item** from the `menuItems` array (line ~271)
2. **Remove the `facilitiesNeedingAttention` variable** (line ~228-230) since it's no longer used
3. **Remove the entire `activeSection === 'bathrooms'` section** (lines ~766-799)
4. **Remove the `bathroomsCount` prop** from the MobileBottomNav component call (line ~345)
5. **In the Housekeeping section**: Split `facilitiesNeedingCleaning` into two sub-groups -- bathrooms (TOILET) and showers (SHOWER) -- so both appear with clear labels

### File: `src/components/MobileBottomNav.tsx`

1. Remove the `bathrooms` entry from the nav items array
2. Remove the `bathroomsCount` prop

### Summary of changes

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove bathrooms tab and its section; split facility cleaning items in Housekeeping into Bathrooms/Showers sub-sections |
| `src/components/MobileBottomNav.tsx` | Remove bathrooms nav item and count prop |

### Result

- **Housekeeping tab**: Shows tents, bathrooms, showers, and common spaces that need cleaning -- clearly labeled
- **Maintenance tab**: Shows bathrooms, showers, common spaces, and VIP facilities that are broken/need maintenance
- **No more redundant "Bathrooms" tab** that mixed both concerns
