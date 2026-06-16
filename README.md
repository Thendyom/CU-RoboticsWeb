# CU Robotics Web

Static website for the Robotics and Intelligent Systems program at Constructor University.

The site is a small academic hub for RIS: program context, people, research areas, selected publications, graduate paths, and practical student links. Its visual approach is text-first, without photos on the visible pages.

## Pages

- `index.html` - program overview and student-oriented introduction.
- `people.html` - program chairs and the Marine Systems and Robotics group.
- `projects.html` - research areas and example project directions.
- `publications.html` - selected publications from tracked RIS faculty publication sources.
- `news.html` - student-facing starting points, research preparation, and a bachelor's thesis framework.
- `graduate-paths.html` - possible next steps and, when available, graduate destinations grouped by class year.
- `groups.html` - research group overview.
- `groups/marine-systems-and-robotics.html` - Marine Systems and Robotics group page.

## Development

This is a plain HTML, CSS, and JavaScript site. Open `index.html` directly in a browser to preview it locally.

Main files:

- `assets/css/styles.css`
- `assets/js/main.js`
- `assets/js/reviewed-data.js`
- `assets/js/generated-publications.js`
- `assets/downloads/RIS_Bachelor_Thesis_Example_Bundle.zip`
- `assets/data/publication-authors.json`
- `assets/data/publication-candidates.json`
- `scripts/update-publication-candidates.mjs`
- `CONTENT_REVIEW.md`

## Publication Updates

The site can refresh publication data once a month through GitHub Actions.

- Workflow: `.github/workflows/publication-candidates.yml`
- Schedule: first day of each month at 06:17 UTC
- Default provider: Semantic Scholar public API
- Outputs: `assets/data/publication-candidates.json` and `assets/js/generated-publications.js`

The workflow now publishes the generated publication list directly to the visible site through `assets/js/generated-publications.js`. The older reviewed publication entries in `assets/js/reviewed-data.js` remain as a fallback when the generated file is empty or has not run yet.

The tracked author list for the updater lives in `assets/data/publication-authors.json`. It currently contains one enabled author: Francesco Maurelli. Add more professors as additional enabled authors. Use stable Semantic Scholar or OpenAlex author IDs where possible; name-only searches can match the wrong researcher.

Generated papers are deduplicated before display. The updater first matches DOI values when available, then normalized paper titles, so co-authored papers from multiple tracked professors should appear once.

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

Program and people information should be checked against the official Constructor University pages and current RIS handbook before publishing major edits. Generated publication updates should use stable author IDs where possible and be spot-checked after changing the tracked author list.

Use `CONTENT_REVIEW.md` to track reviewed claims and sources. Use `assets/js/reviewed-data.js` for people, group, and publication entries that should be easier to maintain later.

Visible page content currently avoids photos. Keep any future images deliberate, sourced, and approved before adding them.
