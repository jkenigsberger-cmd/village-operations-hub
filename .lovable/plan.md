

# Fix: "הצעת מחיר ללקוח" Button Does Nothing for Unsaved Quotes

## The Problem

The "הצעת מחיר ללקוח" (Client Quote) and "דף תפעול לצוות" (Operational Doc) buttons silently do nothing when the quote has not been saved yet. The `handleDownload` function (line 211) checks `if (!selectedQuote) return;` and exits without any feedback.

## The Fix

### File: `src/pages/AdminQuotes.tsx`

Two changes:

1. **Add a toast message** when the user clicks download without a saved quote, so they understand why nothing happens:

```typescript
const handleDownload = useCallback((type: 'client' | 'operational') => {
  if (!selectedQuote) {
    toast({ title: 'יש לשמור את ההצעה לפני הורדה', variant: 'destructive' });
    return;
  }
  // ... rest unchanged
}, [selectedQuote, computedTotals, editSnapshot.groupName, editTitle]);
```

2. **Optionally disable the buttons visually** when no quote is saved, by adding `disabled={!selectedQuoteId}` to both download buttons (lines 603 and 607). This gives a clear visual cue that saving is required first.

### No other files change

The download logic itself (`buildQuoteDocHTML`, `downloadDocHTML`) is correct. The only issue is missing user feedback when the precondition (saved quote) is not met.

