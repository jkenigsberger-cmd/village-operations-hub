
# Add Global Search to All Standalone Pages

## What will change

The search button (magnifying glass icon) that currently exists only on the main dashboard will be added to the header of every standalone page: **Facilities** (Bathrooms & Showers), **Activities** (Common Spaces), and **Neighborhood** pages. This means you can search for any tent, bathroom, shower, or activity space from anywhere in the app without navigating back to the dashboard first.

The existing search engine and its index will be reused -- no changes to how search works, just making it accessible everywhere.

## Technical Details

### Files to modify

| File | Change |
|------|--------|
| `src/pages/Facilities.tsx` | Import `GlobalSearch` and add it to the page header, next to the title |
| `src/pages/Activities.tsx` | Import `GlobalSearch` and add it to the page header |
| `src/pages/Neighborhood.tsx` | Import `GlobalSearch` and add it to the page header |

### Implementation

For each page, add the `GlobalSearch` component in the header area. The search button will be placed at the top-right of the header (in RTL layout, top-left visually) so it is always accessible.

**Example for Facilities.tsx (same pattern for the others):**

```typescript
import { GlobalSearch } from '@/components/GlobalSearch';
```

Then in the header section, wrap the title row in a flex container with the search button:

```tsx
<div className="flex items-start justify-between">
  <div>
    <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
      <Bath className="w-10 h-10" />
      {HE.pages.bathroomsShowers}
    </h1>
    <p className="text-muted-foreground text-lg mt-2">...</p>
  </div>
  <GlobalSearch />
</div>
```

No changes are needed to the `GlobalSearch` component itself or the search index -- it already indexes tents, facilities, and activity spaces and navigates to the correct page with focus parameters.
