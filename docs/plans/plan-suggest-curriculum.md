# Suggest a Curriculum — Placement Proposal

## Recommended Placements

### Primary: Explore Map Page (`/explore`)
Add a subtle "Don't see your curriculum?" prompt at the bottom of the InfoPanel (the right-side detail panel when a curriculum is selected) or below the ControlBar. This is where users are actively browsing curricula and most likely to notice a missing one.

**Implementation:**
- Add a small link/button at the bottom of the Explore page: "Don't see your curriculum? Suggest one →"
- Links to `/contact?subject=curriculum-suggestion` (pre-selects the "Curriculum Suggestion" subject in the contact form)

### Secondary: Compass Results Page (`/compass/results`)
After the curriculum recommendations section, add: "Missing your favorite curriculum? Let us know →"

### Tertiary: Footer (all pages)
Add "Suggest a Curriculum" to the footer links alongside About, Contact, etc.

## UX Flow
1. User clicks "Suggest a Curriculum"
2. Redirects to Contact page with subject pre-selected as "Curriculum Suggestion"
3. Contact form sends email via Resend to the team

No separate page needed — the contact form handles it.
