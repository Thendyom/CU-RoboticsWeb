# Content Review Log

This site should only publish claims that have been checked against official or scholarly sources. The visible copy should read like it was written for students and academics, not like a generic program brochure.

Last full review pass: 2026-06-14

## Source Baseline

| Source | Use | Checked |
| --- | --- | --- |
| https://constructorcampus.org/programs/undergraduate-education/robotics-intelligent-systems | Official RIS program facts, current curriculum structure, program chairs, admissions links | 2026-05-22 |
| https://constructor.university/sites/default/files/2026-02/RIS_Handbook_2025_v1_2_0.pdf | Current RIS handbook, degree structure, internship, study abroad, thesis, formal module references | 2026-05-22 |
| Provided Fall 2023 RIS handbook copy | Cross-check for the 4C model, 180 ECTS degree scope, internship, mobility window, and thesis structure | 2026-05-22 |
| https://constructor.university/faculty-member/prof-dr-francesco-maurelli | Maurelli role, contact profile, research interests, selected publications | 2026-05-22 |
| https://constructor.university/faculty-member/jakob-suchan | Suchan role and research profile | 2026-05-22 |
| https://constructor.university/research/school-computer-science-engineering/marine-systems-and-robotics | Marine Systems and Robotics group themes and leadership | 2026-05-22 |
| https://robotics.constructor.university/ | Constructor Robotics program link and wider research context | 2026-05-22 |
| https://robotics.constructor.university/research/ | Constructor Robotics application domains | 2026-05-22 |
| https://robotics.constructor.university/projects/ | Constructor Robotics funded project examples and listed funders | 2026-05-22 |
| https://robotics.constructor.university/publications/ | Constructor Robotics publication entries and DOI/source links | 2026-05-22 |
| https://www.semanticscholar.org/product/api | Free/public publication candidate API option and rate-limit reference | 2026-05-18 |
| https://developers.openalex.org/guides/authentication | Free OpenAlex API-key option and daily free usage reference | 2026-05-18 |
| https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows | Monthly GitHub Actions schedule syntax | 2026-05-18 |
| https://cnds.constructor.university/ | Academic structure and restrained department-site reference | 2026-05-18 |
| https://robotics.umich.edu/academics/graduate/new-graduate-students/ | Student-facing structure reference, not a factual source for RIS | 2026-05-18 |

## Page Review Status

| Page | Status | Notes |
| --- | --- | --- |
| `README.md` | Reviewed | Short current explanation and maintenance notes added. |
| `index.html` | Reviewed | Program facts checked against the official RIS page and current handbook. |
| `people.html` | Reviewed | Maurelli first; Suchan included only for verified program-chair context. |
| `publications.html` | Reviewed | Maurelli-only selected publications rendered from reviewed data. |
| `news.html` | Reviewed | Student-facing structure checked against the official RIS page and handbook. |
| `projects.html` | Reviewed | Research domains and project examples checked against Constructor Robotics pages. |
| `groups.html` | Reviewed | Uses reviewed data instead of `fetch()` for `file://` compatibility. |
| `groups/marine-systems-and-robotics.html` | Reviewed | Placeholder content replaced with reviewed MSR facts. |
| `graduate-paths.html` | Reviewed | Presents possible directions without claiming unverified graduate outcomes. Add individual entries only after the graduate has shared them. |
| `.github/workflows/publication-candidates.yml` | Reviewed | Monthly candidate refresh only; does not publish unreviewed papers. |

## Writing Rules

- Prefer direct statements over promotional claims.
- Link the source when a reader may reasonably ask, "where did that come from?"
- Do not list people, projects, or deadlines unless the source is current and public.
- Prefer the current program page and handbook for formal curriculum wording when older handbook copies differ in module names.
- Keep the selected publication list Maurelli-centered and source-backed for this version.
- Treat publication co-authors and tracked candidate authors separately; the current candidate author list contains only Francesco Maurelli.
- Do not add person or research photos in this pass.
- Use the reviewed data file for maintainable people, group, and publication entries.
- Treat monthly publication API results as candidates until they are reviewed.
- Publish graduate destinations only after the graduate has shared the name, class year, next step, and destination.
