_**GHL Form: beacon-quiz**_

**Objective:** Capture leads from the BEACON self-assessment quiz, tag them, and trigger the results email.

---

### Form Fields

*   **Email Address:** (Email, Required)
*   **Quiz Score:** (Hidden, Text)
*   **Event:** (Hidden, Text, Default: "Beacon Quiz Results")

### Form Actions

*   **On Submit:**
    *   Add tag: `beacon-quiz`
    *   Trigger workflow: "Quiz Results Delivery"
    *   Redirect to a thank-you page with a confirmation message and a brief overview of their results category.
