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
const existingPublications = await readExistingPublications();
const confusableCharacterMap = new Map([
  ['К', 'K'],
  ['к', 'k']
]);

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
    'Existing generated publications are preserved, and newly discovered publications are prepended on each update.',
    'Use stable author IDs when possible. Name-only searches can match the wrong researcher.'
  ],
  authors: [],
  previousCandidateCount: existingPublications.length,
  preservedPublicationCount: 0,
  newPublicationCount: 0,
  knownPublicationCount: 0,
  duplicateCount: 0,
  duplicates: [],
  warningCount: 0,
  warnings: [],
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

const deduped = mergeGeneratedPublications(collectedCandidates, existingPublications);
output.preservedPublicationCount = deduped.preservedPublicationCount;
output.newPublicationCount = deduped.newPublicationCount;
output.knownPublicationCount = deduped.knownPublicationCount;
output.duplicateCount = deduped.duplicates.length;
output.duplicates = deduped.duplicates;
output.warningCount = deduped.warnings.length;
output.warnings = deduped.warnings;
output.candidates = deduped.publications;

const siteOutput = {
  generatedAt,
  status: output.status,
  provider,
  authors: output.authors,
  previousCandidateCount: output.previousCandidateCount,
  preservedPublicationCount: output.preservedPublicationCount,
  newPublicationCount: output.newPublicationCount,
  knownPublicationCount: output.knownPublicationCount,
  warningCount: output.warningCount,
  publications: output.candidates
};

await writeFile(candidatesOutputUrl, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(siteOutputUrl, `window.RIS_GENERATED_PUBLICATIONS = ${JSON.stringify(siteOutput, null, 2)};\n`);
console.log(`Wrote ${output.candidates.length} deduplicated publications to ${siteOutputUrl.pathname}`);
console.log(`Preserved ${output.preservedPublicationCount}, added ${output.newPublicationCount}, matched ${output.knownPublicationCount} already-known publications.`);

async function readExistingPublications() {
  try {
    const currentOutput = JSON.parse(await readFile(candidatesOutputUrl, 'utf8'));
    if (Array.isArray(currentOutput.candidates)) {
      return currentOutput.candidates;
    }
  } catch {
    // Fall back to the browser-ready mirror when the metadata file does not exist yet.
  }

  try {
    const siteOutput = await readFile(siteOutputUrl, 'utf8');
    const parsed = parseGeneratedPublicationMirror(siteOutput);
    return Array.isArray(parsed?.publications) ? parsed.publications : [];
  } catch {
    return [];
  }
}

function parseGeneratedPublicationMirror(source) {
  const match = source.match(/window\.RIS_GENERATED_PUBLICATIONS\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function mergeGeneratedPublications(freshPapers, storedPublications) {
  const existing = deduplicateStoredPublications(storedPublications);
  const fresh = deduplicateFreshPublications(freshPapers);
  const index = createPublicationIndex(existing.publications);
  const newPublications = [];
  const knownMatches = [];

  for (const publication of fresh.publications) {
    const keys = getPublicationKeys(publication);
    const knownPublication = keys.map((key) => index.get(key)).find(Boolean);

    if (knownPublication) {
      mergePublication(knownPublication, publication);
      knownMatches.push({
        title: publication.title,
        researcherName: publication.researcherName,
        duplicateOf: knownPublication.title,
        reason: 'already-preserved'
      });
      keys.forEach((key) => index.set(key, knownPublication));
      continue;
    }

    newPublications.push(publication);
    keys.forEach((key) => index.set(key, publication));
  }

  const publications = [
    ...newPublications.sort(comparePublications),
    ...existing.publications
  ];

  return {
    publications,
    preservedPublicationCount: existing.publications.length,
    newPublicationCount: newPublications.length,
    knownPublicationCount: knownMatches.length,
    duplicates: [
      ...existing.duplicates,
      ...fresh.duplicates
    ],
    warnings: [
      ...validatePublicationTitles(publications),
      ...validatePublicationNames(publications),
      ...validatePublicationMetadata(publications)
    ]
  };
}

function deduplicateStoredPublications(storedPublications) {
  const index = new Map();
  const publications = [];
  const duplicates = [];

  for (const storedPublication of storedPublications) {
    const publication = normalizeStoredPublication(storedPublication);
    if (!publication?.title || !publication.year) continue;

    const keys = getPublicationKeys(publication);
    const existing = keys.map((key) => index.get(key)).find(Boolean);

    if (existing) {
      mergePublication(existing, publication);
      duplicates.push({
        title: publication.title,
        researcherName: publication.researcherName,
        duplicateOf: existing.title,
        reason: 'duplicate-existing-publication'
      });
      keys.forEach((key) => index.set(key, existing));
      continue;
    }

    publications.push(publication);
    keys.forEach((key) => index.set(key, publication));
  }

  return { publications, duplicates };
}

function deduplicateFreshPublications(freshPapers) {
  const index = new Map();
  const publications = [];
  const duplicates = [];

  for (const paper of freshPapers) {
    const publication = createPublication(paper);
    const keys = getPublicationKeys(publication);
    const existing = keys.map((key) => index.get(key)).find(Boolean);

    if (existing) {
      mergePublication(existing, publication);
      duplicates.push({
        title: publication.title,
        researcherName: publication.researcherName,
        duplicateOf: existing.title,
        reason: 'duplicate-fresh-publication'
      });
      keys.forEach((key) => index.set(key, existing));
      continue;
    }

    publications.push(publication);
    keys.forEach((key) => index.set(key, publication));
  }

  return {
    publications: publications.sort(comparePublications),
    duplicates
  };
}

function createPublicationIndex(publications) {
  const index = new Map();

  for (const publication of publications) {
    getPublicationKeys(publication).forEach((key) => index.set(key, publication));
  }

  return index;
}

function createPublication(paper) {
  return {
    ...paper,
    title: cleanTitle(paper.title),
    authors: cleanTextField(paper.authors),
    venue: cleanTextField(paper.venue),
    researcherIds: uniqueValues([
      ...(Array.isArray(paper.researcherIds) ? paper.researcherIds : []),
      paper.researcherId
    ]),
    researcherNames: uniqueValues([
      ...(Array.isArray(paper.researcherNames) ? paper.researcherNames : []),
      paper.researcherName
    ]),
    tags: uniqueValues([
      ...(Array.isArray(paper.tags) ? paper.tags : []),
      ...inferPublicationTags(paper)
    ])
  };
}

function normalizeStoredPublication(publication) {
  if (!publication || typeof publication !== 'object') return null;

  return createPublication({
    ...publication,
    year: String(publication.year || ''),
    publicationDate: publication.publicationDate || '',
    researcherId: publication.researcherId || publication.researcherIds?.[0] || '',
    researcherName: publication.researcherName || publication.researcherNames?.[0] || ''
  });
}

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
      title: cleanTitle(paper.title),
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
    title: cleanTitle(work.display_name || ''),
    authors: (work.authorships || []).map((entry) => entry.author?.display_name).filter(Boolean).join(', '),
    year: String(work.publication_year || ''),
    venue: work.primary_location?.source?.display_name || work.host_venue?.display_name || '',
    source: 'openalex',
    sourceUrl: work.primary_location?.landing_page_url || work.id || '',
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
    ...(incoming.researcherIds || []),
    incoming.researcherId
  ]);
  existing.researcherNames = uniqueValues([
    ...(existing.researcherNames || []),
    existing.researcherName,
    ...(incoming.researcherNames || []),
    incoming.researcherName
  ]);
  existing.tags = uniqueValues([
    ...(existing.tags || []),
    ...(incoming.tags || []),
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
  if (/\b(education|curriculum|course|teaching|pedagogy)\b/.test(text)) tags.push('education');
  if (/autonom/.test(text)) tags.push('autonomy');
  if (/perception|vision|lidar|laser|sensor|scan/.test(text)) tags.push('perception');

  return tags;
}

function cleanTitle(value = '') {
  return normalizeConfusableCharacters(value)
    .replace(/\\[nrt]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTextField(value = '') {
  return normalizeConfusableCharacters(value)
    .replace(/\\[nrt]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeConfusableCharacters(value = '') {
  return [...String(value)]
    .map((character) => confusableCharacterMap.get(character) || character)
    .join('');
}

function validatePublicationTitles(publications) {
  const warnings = [];
  const seenTitles = new Map();

  publications.forEach((publication, index) => {
    const title = publication.title || '';
    const normalizedTitle = normalizeTitle(title);

    if (!normalizedTitle) {
      warnings.push(createPublicationWarning('missing-title', publication, index));
      return;
    }

    if (seenTitles.has(normalizedTitle)) {
      warnings.push(createPublicationWarning('duplicate-title', publication, index, {
        duplicateOf: seenTitles.get(normalizedTitle).title
      }));
    } else {
      seenTitles.set(normalizedTitle, publication);
    }

    if (title.length < 8) {
      warnings.push(createPublicationWarning('very-short-title', publication, index));
    }

    if (/<[^>]+>|&lt;|&gt;/.test(title)) {
      warnings.push(createPublicationWarning('html-in-title', publication, index));
    }

    if (/\s{2,}|\n|\t|\\[nrt]/.test(title)) {
      warnings.push(createPublicationWarning('spacing-in-title', publication, index));
    }

    if (/^(untitled|unknown|null|undefined|n\/a)$/i.test(title)) {
      warnings.push(createPublicationWarning('placeholder-title', publication, index));
    }

    if (/[\u0400-\u04ff]/.test(title)) {
      warnings.push(createPublicationWarning('cyrillic-in-title', publication, index));
    }
  });

  return warnings;
}

function validatePublicationNames(publications) {
  const warnings = [];

  publications.forEach((publication, index) => {
    const researcherNames = Array.isArray(publication.researcherNames)
      ? publication.researcherNames
      : [publication.researcherName].filter(Boolean);

    if (!researcherNames.length) {
      warnings.push(createPublicationWarning('missing-researcher-name', publication, index));
    }

    researcherNames.forEach((name) => {
      if (!isSoundPersonName(name)) {
        warnings.push(createPublicationWarning('suspicious-researcher-name', publication, index, { name }));
      }
    });

    if (!publication.authors || /^(unknown|null|undefined|n\/a)$/i.test(publication.authors)) {
      warnings.push(createPublicationWarning('missing-author-list', publication, index));
    }

    if (/[\u0400-\u04ff]/.test(publication.authors || '')) {
      warnings.push(createPublicationWarning('cyrillic-in-author-list', publication, index));
    }
  });

  return warnings;
}

function validatePublicationMetadata(publications) {
  const warnings = [];

  publications.forEach((publication, index) => {
    const tags = Array.isArray(publication.tags) ? publication.tags.filter(Boolean) : [];

    if (!tags.length) {
      warnings.push(createPublicationWarning('missing-tags', publication, index));
    }

    if (!cleanTextField(publication.venue)) {
      warnings.push(createPublicationWarning('missing-venue', publication, index));
    }
  });

  return warnings;
}

function createPublicationWarning(type, publication, index, extra = {}) {
  return {
    type,
    index,
    title: publication.title || '',
    researcherName: publication.researcherName || '',
    ...extra
  };
}

function isSoundPersonName(value = '') {
  const name = cleanTextField(value);
  return name.length >= 3
    && !/[0-9<>]/.test(name)
    && !/^(unknown|null|undefined|n\/a)$/i.test(name);
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
