

# Fix: Download blocked after saving new quote

## Problem
After creating a new quote, `selectedQuoteId` is set immediately, but `selectedQuote` (derived from `quotes.find(...)`) remains `null` until the realtime subscription refreshes the quotes array. Clicking download in that window shows "יש לשמור את ההצעה לפני הורדה".

## Solution
In `handleDownload`, fall back to constructing the quote data from form state when `selectedQuote` isn't available yet but `selectedQuoteId` exists.

## Change
**`src/pages/AdminQuotes.tsx`** — Update `handleDownload`:
- Check `selectedQuoteId` instead of `selectedQuote`
- When `selectedQuote` is null but `selectedQuoteId` exists, build the download data from form state (`editSnapshot`, `editClientDetails`, `editPricing`, `computedTotals`, etc.)
- This covers the race condition between save and realtime refresh

Single function change, ~10 lines modified.

