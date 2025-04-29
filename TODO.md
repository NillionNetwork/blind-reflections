# Feature TODO List for Blind Reflections:

*   [ ] **Entry Editing:** Add an "Edit" icon/button to displayed entry cards. Create a modal or inline editing UI for modifying entry text.

*   [ ] **Entry Deleting:** Add a "Delete" icon/button to displayed entry cards. Add a confirmation step (e.g., modal) before deleting. Use the existing `deleteDataFromNodes` method in `SecretVaultWrapper`. Update local storage (`saveData`) and refresh the UI (`displayEntries`, `markDatesWithEntriesHelper`, `runAndLogInitialQuery` for histogram) after successful deletion.

*   [ ] **Mood Tracking:**
    *   [ ] Add a simple mood selector (e.g., 5 clickable emojis) to the "Add a memory" form.
    *   [ ] Modify the nilDB schema (`message_for_nildb`) to include a `mood` (string or number) field.
    *   [ ] Store mood data when saving entries (`saveEntry`).
    *   [ ] Display the mood visually on entry cards (e.g., show the selected emoji).

*   [ ] **Prompt Templates:**
    *   [ ] Define a list of common reflection prompts (e.g., "Summarize...", "Identify patterns...", "Brainstorm...").
    *   [ ] Add a dropdown or list UI element near the "Ask SecretLLM" button to select a template.
    *   [ ] Populate the private reflection input field when a template is selected.
