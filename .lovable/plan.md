

# Fix: Sleeping Shortcut Button Visibility on Group Allocation Page

## Problem

The "לינה" button was placed **inside** the `min-w-0` div (the text content area), which clips overflow content and hides the button. It needs to be a **sibling** element at the same flex level as the back arrow and group info.

## Fix

### File: `src/pages/GroupAllocation.tsx` (lines 88-111)

Restructure the header so the button sits at the top level of the flex row, alongside the back arrow and the group info block:

```
<div className="flex items-center gap-3">
  [Back Arrow Button]
  <div className="min-w-0 flex-1">    <!-- group name + metadata -->
    <h1>...</h1>
    <div>...dates...pax...</div>
  </div>
  <Button ...>לינה</Button>           <!-- moved HERE, outside min-w-0 -->
</div>
```

This ensures:
- The button is always visible at the right side of the header
- The `min-w-0` div only contains the text (which can truncate)
- The flex layout keeps everything aligned

### No other files change

