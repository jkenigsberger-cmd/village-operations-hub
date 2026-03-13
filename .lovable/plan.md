

# Simplify Staff Section — Remove Detailed Breakdown

## Change
In the "צוות / מלווים / אחרים" sub-section of Step 3, replace the 5 separate fields (גברים, נשים, אבטחה, נהגים, אחרים) with a single numeric field for total staff/escorts count.

## File: `src/pages/GuestForm.tsx`

1. **State**: Remove `staff_men_count`, `staff_women_count`, `security_count`, `drivers_count`, `others_count`. Add single `staff_count` field.

2. **Prefill**: Map `snapshot.staffTotal` directly to `staff_count` instead of splitting across men/women.

3. **UI (Step 3, Staff section)**: Replace the 5 input fields with one field labeled "מספר אנשי צוות / מלווים / אחרים" with helper text "(אבטחה, נהגים, מלווים, אחרים)".

4. **Derived totals**: 
   - `סה״כ צוות = staff_count`
   - `סה״כ מגיעים = boys + girls + staff_count`

5. **Submission**: Update the submit payload to use `staff_count` instead of the 5 separate fields. Map to `staff_count` in the edge function call.

6. **Schedule auto-fill**: Update `addScheduleItem` to use `boys + girls + staff_count` for participant count default.

