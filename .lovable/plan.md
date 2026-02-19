

# Fix: Toast Messages Stay Too Long and Block the UI

## The Problem

Toast notifications (like "ההצעה נמחקה") remain visible for ~16 minutes because the removal delay is set to `1,000,000` milliseconds. They block buttons and make it hard to continue working.

## The Fix

### File: `src/hooks/use-toast.ts`

One change on line 6:

```
Before:  const TOAST_REMOVE_DELAY = 1000000;
After:   const TOAST_REMOVE_DELAY = 4000;
```

This makes toasts auto-dismiss after 4 seconds -- long enough to read, short enough to not get in the way.

No other files need to change.

