#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

const configUrl = new URL('../assets/data/publication-authors.json', import.meta.url);
const outputUrl = new URL('../assets/data/publication-candidates.json', import.meta.url);
const dryRun = process.argv.includes('--dry-run');

const config = JSON.parse(await readFile(configUrl, 'utf8'));
const enabledAuthors = (config.authors || []).filter((author) => author.enabled !== false);
const provider = process.env.PUBLICATION_PROVIDER || config.provider || 'semantic-scholar';
const maxPapers = Number(config.maxPapersPerAuthor || 20);

if (dryRun) {
  console.log(JSON.stringify({
    provider,
    maxPapersPerAuthor: maxPapers,
    authors: enabledAuthors.map((author) => ({
      id: author.id,
      name: author.name,
      semanticScholarAuthorId: Boolean(author.semanticScholarAuthorId),
      openAlexAuthorId: Boolean(author.openAlexAuthorId)
    }))
  }, null, 2));
  process.exit(0);
}

const output = {
  generatedAt: new Date().toISOString(),
  status: 'ok',
  provider,
  notes: [
    'Candidates are generated from free scholarly APIs and require human review before being copied into assets/js/reviewed-data.js.',
    'Use stable author IDs when possible. Name-only searches can match the wrong researcher.'
  ],
  authors: [],
  candidates: []
};

for (const author of enabledAuthors) {
  try {
    const result = provider === 'openalex'
      ? await getOpenAlexAuthorPapers(author, maxPapers)
      : await getSemanticScholarAuthorPapers(author, maxPapers);

    output.authors.push(result.author);
    output.candidates.push(...result.papers);
  } catch (error) {
    output.status = 'partial';
    output.authors.push({
      id: author.id,
      name: author.name,
      status: 'error',
      error: error.message
    });
  }
}

await writeFile(outputUrl, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${output.candidates.length} candidate publications to ${outputUrl.pathname}`);

async function getSemanticScholarAuthorPapers(author, limit) {
  const fields = [
    'authorId',
    'name',
    'affiliations',
    'paperCount',
    'papers.paperId',
    'papers.title',
    'papers.year',
    'papers.authors',
    'papers.venue',
    'papers.url',
    'papers.externalIds',
    'papers.publicationVenue',
    'papers.publicationDate'
  ].join(',');

  const baseUrl = 'https://api.semanticscholar.org/graph/v1';
  const headers = { 'User-Agent': 'CU-RoboticsWeb publication updater' };
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  const authorData = author.semanticScholarAuthorId
    ? await fetchJson(`${baseUrl}/author/${encodeURIComponent(author.semanticScholarAuthorId)}?fields=${fields}`, headers)
    : await findSemanticScholarAuthor(baseUrl, author, fields, headers);

  const papers = (authorData.papers || [])
    .filter((paper) => paper.title && paper.year)
    .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
    .slice(0, limit)
    .map((paper) => ({
      researcherId: author.id,
      researcherName: author.name,
      title: paper.title,
      authors: formatSemanticScholarAuthors(paper.authors),
      year: String(paper.year),
      venue: paper.venue || paper.publicationVenue?.name || '',
      source: 'semantic-scholar',
      sourceUrl: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      doiUrl: paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : '',
      publicationDate: paper.publicationDate || ''
    }));

  return {
    author: {
      id: author.id,
      name: author.name,
      status: 'ok',
      matchedName: authorData.name || '',
      semanticScholarAuthorId: authorData.authorId || author.semanticScholarAuthorId || '',
      paperCount: authorData.paperCount || papers.length
    },
    papers
  };
}

async function findSemanticScholarAuthor(baseUrl, author, fields, headers) {
  const url = `${baseUrl}/author/search?query=${encodeURIComponent(author.name)}&limit=1&fields=${fields}`;
  const result = await fetchJson(url, headers);
  const match = result.data?.[0];
  if (!match) {
    throw new Error(`No Semantic Scholar author match for ${author.name}`);
  }
  return match;
}

async function getOpenAlexAuthorPapers(author, limit) {
  const apiKey = process.env.OPENALEX_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAlex now requires a free OPENALEX_API_KEY for API use.');
  }

  const authorId = author.openAlexAuthorId || await findOpenAlexAuthorId(author, apiKey);
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('filter', `authorships.author.id:${authorId}`);
  url.searchParams.set('sort', 'publication_date:desc');
  url.searchParams.set('per-page', String(limit));
  url.searchParams.set('api_key', apiKey);

  const data = await fetchJson(url);
  const papers = (data.results || []).map((work) => ({
    researcherId: author.id,
    researcherName: author.name,
    title: work.display_name || '',
    authors: (work.authorships || []).map((entry) => entry.author?.display_name).filter(Boolean).join(', '),
    year: String(work.publication_year || ''),
    venue: work.primary_location?.source?.display_name || work.host_venue?.display_name || '',
    source: 'openalex',
    sourceUrl: work.id || '',
    doiUrl: work.doi || '',
    publicationDate: work.publication_date || ''
  })).filter((paper) => paper.title && paper.year);

  return {
    author: {
      id: author.id,
      name: author.name,
      status: 'ok',
      openAlexAuthorId: authorId,
      paperCount: data.meta?.count || papers.length
    },
    papers
  };
}

async function findOpenAlexAuthorId(author, apiKey) {
  const url = new URL('https://api.openalex.org/authors');
  url.searchParams.set('search', author.name);
  url.searchParams.set('per-page', '1');
  url.searchParams.set('api_key', apiKey);
  const data = await fetchJson(url);
  const match = data.results?.[0];
  if (!match?.id) {
    throw new Error(`No OpenAlex author match for ${author.name}`);
  }
  return match.id;
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${response.url}`);
  }
  return response.json();
}

function formatSemanticScholarAuthors(authors = []) {
  return authors.map((entry) => entry.name).filter(Boolean).join(', ');
}
