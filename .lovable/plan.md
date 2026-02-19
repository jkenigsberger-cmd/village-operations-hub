

# Generate Quote as PDF Instead of HTML

## What Changes

The quote download buttons ("הצעת מחיר ללקוח" and "דף תפעול לצוות") will produce a **PDF file** instead of an HTML file. We'll use the browser's built-in `window.print()` mechanism to convert the existing HTML template to PDF -- this is the simplest approach that requires no new dependencies.

## How It Works

The existing HTML document generation (`buildQuoteDocHTML`) already produces a fully styled, print-ready HTML document. We'll open it in a new browser window and trigger `window.print()`, which lets the user save as PDF using the browser's native "Save as PDF" printer.

## Technical Details

### File: `src/lib/quoteUtils.ts`

Replace the `downloadDocHTML` function with a new `downloadDocPDF` function:

```typescript
export const downloadDocPDF = (html: string, filename: string): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};
```

Also add a `@media print` block inside `commonStyles` to hide browser chrome and ensure clean PDF output (hide margins, set page size A4, etc.).

### File: `src/pages/AdminQuotes.tsx`

Update the import from `downloadDocHTML` to `downloadDocPDF` and use it in the `handleDownload` callback. The filenames stay the same (they appear in the print dialog title).

### No new dependencies needed

This approach uses the browser's native print-to-PDF. No external libraries required. The user clicks the button, a print dialog opens, and they choose "Save as PDF."

