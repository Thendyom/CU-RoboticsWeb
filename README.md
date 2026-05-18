# CU Robotics Web

Static website for the Robotics and Intelligent Systems program at Constructor University.

The site is a small academic hub for RIS: program context, people, research areas, Maurelli-focused publications, and practical student links. It is intentionally text-first for now. Photos are not used in the visible pages.

## Pages

- `index.html` - program overview and student-oriented introduction.
- `people.html` - program chairs and the Marine Systems and Robotics group.
- `projects.html` - research areas and example project directions.
- `publications.html` - selected Prof. Dr. Francesco Maurelli publications for now.
- `news.html` - student-facing starting points, research preparation, and official links.
- `groups.html` - research group overview.
- `groups/marine-systems-and-robotics.html` - Marine Systems and Robotics group page.

## Development

This is a plain HTML, CSS, and JavaScript site. Open `index.html` directly in a browser to preview it locally.

Main files:

- `assets/css/styles.css`
- `assets/js/main.js`
- `assets/js/reviewed-data.js`
- `CONTENT_REVIEW.md`

## GitHub Pages

The repository is ready for GitHub Pages because `index.html` is in the repository root.

Recommended settings:

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

After Pages is enabled, the public site should be available at:

`https://thendyom.github.io/CU-RoboticsWeb/`

## Content Notes

Program and people information should be checked against the official Constructor University pages before publishing major edits. Publications are intentionally limited to Prof. Dr. Francesco Maurelli for the current version.

Use `CONTENT_REVIEW.md` to track reviewed claims and sources. Use `assets/js/reviewed-data.js` for people, group, and publication entries that should be easier to maintain later.

Visible page content currently avoids photos. Keep any future images deliberate, sourced, and approved before adding them.
