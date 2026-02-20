_**BEACON Challenge Hub Structure**_

**Objective:** Create a comprehensive and engaging 30-day challenge experience within GoHighLevel.

---

### Landing Page

*   **Headline:** Join the 30-Day BEACON Challenge
*   **Sub-headline:** Go from idea to impact in just one month.
*   **Video:** A short video from Robert "Digital Grandpa" Burr explaining the challenge.
*   **Enrollment Form:**
    *   First Name
    *   Email Address
*   **On Submit:**
    *   Add tag: `beacon-challenge-participant`
    *   Set custom field `challenge_start_date` to the current date.
    *   Trigger workflow: "BEACON Challenge - Pre-Challenge Sequence"

### Challenge Hub Page (Members Area)

*   **Progress Bar:** A visual representation of the user's progress through the 30-day challenge.
*   **Daily Prompts:** A new prompt unlocked each day, guiding the user through the BEACON framework.
*   **Badges:** Gamified badges awarded for completing key milestones (e.g., "BEACON Initiate," "Clarity Champion," "Impact Architect").
*   **Community Forum:** A dedicated space for participants to connect, share their progress, and ask questions.
*   **Resource Library:** A collection of all challenge materials, including videos, worksheets, and templates.

### Email Sequences

*   **Pre-Challenge (5 emails):**
    *   Welcome and what to expect.
    *   How to prepare for the challenge.
    *   The importance of community.
    *   Setting your intention for the challenge.
    *   Final reminder before the challenge begins.
*   **Daily (30 emails):**
    *   A new email each day with the daily prompt and a link to the Challenge Hub.
*   **Post-Challenge (7 emails):**
    *   Congratulations and celebration of completion.
    *   How to maintain momentum.
    *   Invitation to the BEACON Mastery Program (Tier 2 upsell).
    *   Case studies of successful challenge participants.
    *   Final call to action for the Mastery Program.
    *   Request for feedback on the challenge.
    *   Long-term vision and continued support.

### Badge Logic

*   **BEACON Initiate:** Awarded on Day 1.
*   **Clarity Champion:** Awarded after completing the "Alignment" module (Day 15).
*   **Impact Architect:** Awarded on Day 30 upon completion of the challenge.
*   **Completion Certificate:** A downloadable certificate awarded at the end of the challenge.
