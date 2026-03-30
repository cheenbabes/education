# Standards → Create Lesson Flow — Design Plan

## Overview
Allow users to select specific standards from the Standards page search results and funnel them directly into lesson creation.

## User Flow
1. User visits `/standards` page
2. Searches standards in natural language (e.g., "fractions" or "animal habitats")
3. Matching standards appear with checkboxes
4. User selects 1-5 standards they want the lesson to cover
5. A floating "Create Lesson from X Standards" button appears
6. Clicking it navigates to `/create?standards=CODE1,CODE2,CODE3`
7. The Create Lesson page reads the `standards` query param
8. Selected standards are displayed as pills in a new "Required Standards" section
9. These standards are passed to the KG API as `required_standards` in the generation request
10. The AI generates a lesson that specifically addresses those standards

## Frontend Changes

### Standards Page (`/standards/page.tsx`)
- Add checkbox next to each standard in the list
- Add `selectedStandards` state (`Set<string>`)
- Show floating action bar at bottom when standards are selected:
  "Create lesson covering {n} standards →"
- Link to: `/create?standards=${encodeURIComponent(selectedCodes.join(','))}`

### Create Page (`/create/page.tsx`)
- Read `standards` query param (comma-separated codes)
- Display selected standards as removable pills in a new section above the "Create Lesson" button
- Pass `required_standards: string[]` to the KG API alongside existing params

## Backend Changes

### KG Service (`/create-lesson` endpoint)
- Accept optional `required_standards: list[str]` parameter
- Include these in the prompt to the LLM so the generated lesson specifically addresses those standards
- Ensure they appear in `standards_addressed` in the response

## UI/UX Considerations
- Max 5-7 standards selectable (more makes the lesson unfocused)
- Show a warning if standards span too many grade levels
- Allow removing individual standards from the selection on the create page
- Pre-populate the subject selection based on the standard types (Math standards → Math selected)
