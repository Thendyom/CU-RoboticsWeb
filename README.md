# CU Robotics Web

Static website for the Robotics and Intelligent Systems program at Constructor University.

The site is a small academic hub for RIS: program context, people, research areas, selected publications, and practical student links. It is intentionally text-first for now. Photos are not used in the visible pages.

## Pages

- `index.html` - program overview and student-oriented introduction.
- `people.html` - program chairs and the Marine Systems and Robotics group.
- `projects.html` - research areas and example project directions.
- `publications.html` - selected publications, currently centered on Prof. Dr. Francesco Maurelli.
- `news.html` - student-facing starting points, research preparation, and official links.
- `groups.html` - research group overview.
- `groups/marine-systems-and-robotics.html` - Marine Systems and Robotics group page.

## Development

This is a plain HTML, CSS, and JavaScript site. Open `index.html` directly in a browser to preview it locally.

Main files:

- `assets/css/styles.css`
- `assets/js/main.js`
- `assets/js/reviewed-data.js`
- `assets/data/publication-authors.json`
- `assets/data/publication-candidates.json`
- `scripts/update-publication-candidates.mjs`
- `CONTENT_REVIEW.md`

## Publication Candidate Updates

The site can refresh publication candidates once a month through GitHub Actions.

- Workflow: `.github/workflows/publication-candidates.yml`
- Schedule: first day of each month at 06:17 UTC
- Default provider: Semantic Scholar public API
- Output: `assets/data/publication-candidates.json`

The workflow does not publish new papers directly to the visible site. It only updates the candidate file. Reviewed publications should still be copied into `assets/js/reviewed-data.js` after checking the author match, title, venue, year, and source link.

To test the updater without making API calls:

```sh
node scripts/update-publication-candidates.mjs --dry-run
```

To use OpenAlex instead, add a free `OPENALEX_API_KEY` repository secret and set `PUBLICATION_PROVIDER` to `openalex` in the workflow. Semantic Scholar can run without a key, but adding `SEMANTIC_SCHOLAR_API_KEY` as a repository secret is more reliable.

## GitHub Pages

The repository is ready for GitHub Pages because `index.html` is in the repository root.

Recommended settings:

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

After Pages is enabled, the public site should be available at:

`https://thendyom.github.io/CU-RoboticsWeb/`

## Content Notes

Program and people information should be checked against the official Constructor University pages and current RIS handbook before publishing major edits. Publications are intentionally centered on Prof. Dr. Francesco Maurelli.

Use `CONTENT_REVIEW.md` to track reviewed claims and sources. Use `assets/js/reviewed-data.js` for people, group, and publication entries that should be easier to maintain later.

Visible page content currently avoids photos. Keep any future images deliberate, sourced, and approved before adding them.
