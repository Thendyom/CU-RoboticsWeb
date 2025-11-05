# CU-RoboticsWeb

Prototype microsite for Constructor University robotics research activity (Robotics Title hub).

## Brand integration

- Use the official Constructor University logotype from the brand kit. Color version on light backgrounds, white version on dark backgrounds. Email [marketing@constructor.university](mailto:marketing@constructor.university) for the authoritative SVGs, vector files, and color tokens from the brand identity style guide.
- Do not redraw, recolor, stretch, add effects, or place the logo on noisy photographic backgrounds. Maintain the minimum clear space defined in the guide; until official minima are confirmed, stick to a pragmatic 28–32 px height on mobile and scale proportionally.
- Header implementation follows the recommended snippet with a `<picture>` element that swaps to the white mark for dark themes. Alt text is `Constructor University` to meet accessibility guidance.
- Accent colors should reference the official palette once the branding pack is in hand. Update `assets/img/cu-logo-*.svg` with the sanctioned artwork when it arrives.

## Information architecture

- Primary navigation: People, Projects, Groups, Publications, News.
- `groups.html` lists research groups from `assets/data/groups.json`. Each entry links to both a group landing page under `groups/` and the official CMS page when available.
- Group landing pages (example: `groups/marine-systems-and-robotics.html`) reuse existing cards by filtering client-side via `data-group` attributes on people and projects.
- Publications will remain a single Zotero feed. Tag items in Zotero with `group:<slug>` (e.g. `group:marine-systems-and-robotics`) so pages can filter client-side without extra maintenance.

## Priorities for faculty stakeholders

1. **Accuracy & compliance** – Correct logos, colors, tone, and links back to the official lab/university pages.
2. **Low maintenance** – One Zotero group powers publications; static JSON powers group listings.
3. **Visibility** – Dedicated pages for people, projects, news, and seminars mirroring the Robotics microsite structure.
4. **Recruiting** – Highlight theses, student assistant positions, and other openings under Opportunities.
5. **Outreach** – Simple updates for news items and seminar listings.
6. **Continuity** – Cross-link to the Robotics program page for prospective students.
