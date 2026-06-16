#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

const configUrl = new URL('../assets/data/publication-authors.json', import.meta.url);
const candidatesOutputUrl = new URL('../assets/data/publication-candidates.json', import.meta.url);
const siteOutputUrl = new URL('../assets/js/generated-publications.js', import.meta.url);
const dryRun = process.argv.includes('--dry-run');

const config = JSON.parse(await readFile(configUrl, 'utf8'));
const enabledAuthors = (config.authors || []).filter((author) => author.enabled !== false);
const provider = process.env.PUBLICATION_PROVIDER || config.provider || 'semantic-scholar';
const maxPapers = Number(config.maxPapersPerAuthor || 20);
const generatedAt = new Date().toISOString();

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
  generatedAt,
  status: 'ok',
  provider,
  notes: [
    'Publications are generated from free scholarly APIs and mirrored into assets/js/generated-publications.js for the visible site.',
    'Papers are deduplicated by DOI and normalized title before publishing.',
    'Use stable author IDs when possible. Name-only searches can match the wrong researcher.'
  ],
  authors: [],
  duplicateCount: 0,
  duplicates: [],
  candidates: []
};
const collectedCandidates = [];

for (const author of enabledAuthors) {
  try {
    const result = provider === 'openalex'
      ? await getOpenAlexAuthorPapers(author, maxPapers)
      : await getSemanticScholarAuthorPapers(author, maxPapers);

    output.authors.push(result.author);
    collectedCandidates.push(...result.papers);
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

const deduped = deduplicatePublications(collectedCandidates);
output.duplicateCount = deduped.duplicates.length;
output.duplicates = deduped.duplicates;
output.candidates = deduped.publications;

const siteOutput = {
  generatedAt,
  status: output.status,
  provider,
  authors: output.authors,
  publications: output.candidates
};

await writeFile(candidatesOutputUrl, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(siteOutputUrl, `window.RIS_GENERATED_PUBLICATIONS = ${JSON.stringify(siteOutput, null, 2)};\n`);
console.log(`Wrote ${output.candidates.length} deduplicated publications to ${siteOutputUrl.pathname}`);

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
  const url = `${baseUrl}/author/search?query=${encodeURIComponent(author.name)}&limit=10&fields=${fields}`;
  const result = await fetchJson(url, headers);
  const matches = result.data || [];
  const affiliationHint = normalizeText(author.affiliationHint || '');
  const affiliationMatch = affiliationHint
    ? matches.find((entry) => hasAffiliationHint(entry, affiliationHint))
    : null;
  const match = affiliationMatch || matches[0];

  if (!match) {
    throw new Error(`No Semantic Scholar author match for ${author.name}`);
  }
  return match;
}

async function getOpenAlexAuthorPapers(author, limit) {
  const apiKey = process.env.OPENALEX_API_KEY || '';

  const authorId = author.openAlexAuthorId || await findOpenAlexAuthorId(author, apiKey);
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('filter', `authorships.author.id:${authorId}`);
  url.searchParams.set('sort', 'publication_date:desc');
  url.searchParams.set('per-page', String(limit));
  if (apiKey) {
    url.searchParams.set('api_key', apiKey);
  }

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
  url.searchParams.set('per-page', '10');
  if (apiKey) {
    url.searchParams.set('api_key', apiKey);
  }
  const data = await fetchJson(url);
  const matches = data.results || [];
  const affiliationHint = normalizeText(author.affiliationHint || '');
  const affiliationMatch = affiliationHint
    ? matches.find((entry) => hasOpenAlexAffiliationHint(entry, affiliationHint))
    : null;
  const match = affiliationMatch || matches[0];
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

function hasAffiliationHint(author, affiliationHint) {
  return (author.affiliations || []).some((affiliation) => {
    return normalizeText(affiliation).includes(affiliationHint);
  });
}

function hasOpenAlexAffiliationHint(author, affiliationHint) {
  const institutions = [
    ...(author.last_known_institutions || []),
    ...(author.affiliations || []).map((affiliation) => affiliation.institution)
  ];

  return institutions.some((institution) => {
    return normalizeText(institution?.display_name || '').includes(affiliationHint);
  });
}

function deduplicatePublications(papers) {
  const index = new Map();
  const publications = [];
  const duplicates = [];

  for (const paper of papers) {
    const keys = getPublicationKeys(paper);
    const existing = keys.map((key) => index.get(key)).find(Boolean);

    if (existing) {
      mergePublication(existing, paper);
      duplicates.push({
        title: paper.title,
        researcherName: paper.researcherName,
        duplicateOf: existing.title
      });
      keys.forEach((key) => index.set(key, existing));
      continue;
    }

    const publication = {
      ...paper,
      researcherIds: uniqueValues([paper.researcherId]),
      researcherNames: uniqueValues([paper.researcherName]),
      tags: inferPublicationTags(paper)
    };

    publications.push(publication);
    keys.forEach((key) => index.set(key, publication));
  }

  return {
    publications: publications.sort(comparePublications),
    duplicates
  };
}

function getPublicationKeys(paper) {
  const doi = normalizeDoi(paper.doiUrl);
  const title = normalizeTitle(paper.title);

  return uniqueValues([
    doi ? `doi:${doi}` : '',
    title ? `title:${title}` : ''
  ]);
}

function mergePublication(existing, incoming) {
  for (const field of ['authors', 'venue', 'sourceUrl', 'doiUrl', 'publicationDate']) {
    if (!existing[field] && incoming[field]) {
      existing[field] = incoming[field];
    }
  }

  existing.researcherIds = uniqueValues([
    ...(existing.researcherIds || []),
    existing.researcherId,
    incoming.researcherId
  ]);
  existing.researcherNames = uniqueValues([
    ...(existing.researcherNames || []),
    existing.researcherName,
    incoming.researcherName
  ]);
  existing.tags = uniqueValues([
    ...(existing.tags || []),
    ...inferPublicationTags(incoming)
  ]);
}

function comparePublications(a, b) {
  const dateA = a.publicationDate || `${a.year || '0000'}-01-01`;
  const dateB = b.publicationDate || `${b.year || '0000'}-01-01`;

  if (dateA !== dateB) {
    return dateA > dateB ? -1 : 1;
  }

  return String(a.title || '').localeCompare(String(b.title || ''));
}

function inferPublicationTags(paper) {
  const text = normalizeText(`${paper.title || ''} ${paper.venue || ''}`);
  const tags = [];

  if (/\b(auv|marine|ocean|underwater|sonar)\b/.test(text)) tags.push('marine');
  if (/\bslam\b|locali[sz]ation|navigation/.test(text)) tags.push('slam');
  if (/education|curriculum|course|teaching|learning/.test(text)) tags.push('education');
  if (/autonom/.test(text)) tags.push('autonomy');
  if (/perception|vision|lidar|laser|sensor|scan/.test(text)) tags.push('perception');

  return tags;
}

function normalizeDoi(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:/, '')
    .replace(/\/$/, '');
}

function normalizeTitle(value = '') {
  return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function uniqueValues(values) {
  return values.filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);
}
