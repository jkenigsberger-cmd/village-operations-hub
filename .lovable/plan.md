

# Add Introductory Text to Client Quote PDF

## What
Insert the provided Hebrew introductory text block into the client-facing quote PDF, between the header (logo + title) and the "פרטי לקוח" section.

## File: `src/lib/quoteUtils.ts`

### Change (lines ~303-304 in `buildClientDocHTML`)

After the closing `</div>` of the `.header` block (line 303) and before `<h2>פרטי לקוח</h2>` (line 305), insert a new styled `<div>` containing:

1. **Subtitle**: "הצעת מחיר לסמינרים וימי עיון לצוותי חינוך"
2. **Intro paragraph**: "בית הדור הבא מציע מרחב לחיבור..."
3. **Principles section** ("עקרונות החוויה בבית הדור הבא") as a styled list with 4 items
4. **Content tracks section** ("יש לנו שלושה מסלולי תוכן אפשריים") with 3 items (שיבולת, אלומה, שדה) — each with bold name + description
5. **Transition line**: "עלויות פעילות:" as a lead-in to the existing pricing section

### Styling
- Use existing theme colors (`#0b2fd6` for headings)
- Compact spacing to avoid excessive page length
- Principles as a clean list with em-dash or bullet styling
- Content tracks as bold name + dash + description
- Add minimal CSS for `.intro-section` inline in `commonStyles` or scoped within the div

