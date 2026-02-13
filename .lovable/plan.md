

# Move Mobile Navigation from Bottom to Top

## What Changes

Move the mobile navigation bar from the bottom of the screen to the top (below the header), matching the desktop layout. This creates a consistent experience across all devices.

## Changes (2 files)

### 1. `src/components/MobileBottomNav.tsx`

- Rename component to `MobileTopNav` (keep file name for minimal disruption)
- Change positioning from `fixed bottom-0` to `sticky top-0` with appropriate z-index
- Change `border-t-2` to `border-b` to match desktop nav styling
- Remove the `bottom-nav` class
- Adjust padding/sizing to be slightly more compact (matching the desktop nav bar style)
- Keep horizontal scroll, fade indicators, and all 10 tabs as-is

### 2. `src/pages/Index.tsx`

- Remove `pb-20` bottom padding (was needed to prevent content hiding behind the fixed bottom nav)
- Move the `MobileBottomNav` component from the bottom of the JSX to directly after the header (and before `<main>`)
- Change the desktop nav from `hidden md:block` to just keeping both navs but showing the right one per breakpoint:
  - Mobile nav: `md:hidden`
  - Desktop nav: `hidden md:block` (unchanged)

## Technical Details

**MobileBottomNav.tsx positioning change:**
```
// Before
className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border md:hidden bottom-nav relative"

// After  
className="sticky top-0 z-40 bg-card border-b border-border md:hidden"
```

**Index.tsx layout change:**
```
// Before
<div className="min-h-screen bg-background pb-20 md:pb-0">
  <header>...</header>
  <nav className="hidden md:block">...</nav>  {/* desktop */}
  <main>...</main>
  <MobileBottomNav ... />  {/* at bottom */}
</div>

// After
<div className="min-h-screen bg-background">
  <header>...</header>
  <MobileBottomNav ... />  {/* right after header, mobile only */}
  <nav className="hidden md:block">...</nav>  {/* desktop */}
  <main>...</main>
</div>
```

The sticky header and sticky mobile nav will stack naturally. Since the header is `sticky top-0 z-10` and the mobile nav needs to sit just below it, we will make the mobile nav non-sticky (just in normal document flow below the header) so it scrolls away with content -- matching how the desktop nav behaves.

