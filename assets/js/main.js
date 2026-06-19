document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  btn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  const pathParts = window.location.pathname.split('/');
  const currentPage = pathParts[pathParts.length - 1] || 'index.html';
  document.querySelectorAll('.site-nav a').forEach((link) => {
    const target = link.getAttribute('href')?.split('/').pop();
    if (target === currentPage) {
      link.setAttribute('aria-current', 'page');
    }
  });

  initializePublications();
  initializeGroupCards();
  initializeRuntimeState();
});

const PUBLICATIONS_PER_PAGE = 12;
const publicationState = {
  all: [],
  filter: 'all',
  search: '',
  sort: 'relevance',
  page: 1,
  target: null,
  pagination: null,
  summary: null,
  searchInput: null,
  suggestions: null,
  activeSuggestionIndex: -1,
  sortSelect: null,
  clearButton: null
};

function initializePublications() {
  const target = document.getElementById('publication-list');
  if (!target) return;

  publicationState.target = target;
  publicationState.pagination = document.getElementById('publication-pagination');
  publicationState.summary = document.getElementById('publication-summary');
  publicationState.searchInput = document.getElementById('publication-search');
  publicationState.suggestions = document.getElementById('publication-suggestions');
  publicationState.sortSelect = document.getElementById('publication-sort');
  publicationState.clearButton = document.getElementById('publication-clear');
  publicationState.all = getPublicationData();

  bindPublicationFilters();
  bindPublicationSearch();
  renderPublications();
}

function getPublicationData() {
  const generatedPublications = window.RIS_GENERATED_PUBLICATIONS?.publications;
  const reviewedPublications = window.RIS_REVIEWED_DATA?.publications;

  const publications = Array.isArray(generatedPublications) && generatedPublications.length
    ? generatedPublications
    : reviewedPublications;

  return Array.isArray(publications) ? publications : [];
}

function getFilteredPublications() {
  let publications = getTagFilteredPublications();
  const query = normalizePublicationQuery(publicationState.search);

  if (query) {
    publications = publications.filter((publication) => {
      return getPublicationSearchText(publication).includes(query);
    });
  }

  return sortPublications(publications);
}

function getTagFilteredPublications() {
  if (publicationState.filter === 'all') {
    return publicationState.all;
  }

  return publicationState.all.filter((publication) => {
    const tags = Array.isArray(publication.tags) ? publication.tags : [];
    return tags.includes(publicationState.filter);
  });
}

function sortPublications(publications) {
  const sorted = [...publications];
  const compareTitle = (a, b) => String(a.title || '').localeCompare(String(b.title || ''));
  const compareAuthor = (a, b) => String(a.authors || '').localeCompare(String(b.authors || '')) || compareTitle(a, b);
  const compareDate = (a, b) => {
    const dateA = getPublicationSortDate(a);
    const dateB = getPublicationSortDate(b);
    return dateA === dateB ? compareTitle(a, b) : dateA > dateB ? -1 : 1;
  };

  if (publicationState.sort === 'relevance') {
    const query = normalizePublicationQuery(publicationState.search);
    if (!query) return sorted.sort(compareDate);

    return sorted.sort((a, b) => {
      const scoreA = getPublicationRelevanceScore(a, query);
      const scoreB = getPublicationRelevanceScore(b, query);
      return scoreA === scoreB ? compareDate(a, b) : scoreB - scoreA;
    });
  }

  if (publicationState.sort === 'oldest') {
    return sorted.sort((a, b) => {
      const dateA = getPublicationSortDate(a);
      const dateB = getPublicationSortDate(b);
      return dateA === dateB ? compareTitle(a, b) : dateA > dateB ? 1 : -1;
    });
  }

  if (publicationState.sort === 'title') {
    return sorted.sort(compareTitle);
  }

  if (publicationState.sort === 'author') {
    return sorted.sort(compareAuthor);
  }

  return sorted.sort(compareDate);
}

function getPublicationSortDate(publication) {
  return publication.publicationDate || `${publication.year || '0000'}-01-01`;
}

function getPublicationRelevanceScore(publication, query) {
  const fields = [
    { value: publication.title, weight: 24 },
    { value: publication.authors, weight: 18 },
    { value: publication.venue, weight: 14 },
    { value: publication.year, weight: 10 },
    { value: publication.researcherName, weight: 8 },
    { value: Array.isArray(publication.researcherNames) ? publication.researcherNames.join(' ') : '', weight: 8 },
    { value: Array.isArray(publication.tags) ? publication.tags.join(' ') : '', weight: 6 }
  ];

  return fields.reduce((score, field) => {
    const text = normalizePublicationQuery(field.value);
    if (!text.includes(query)) return score;
    return score + field.weight + (text.startsWith(query) ? field.weight : 0);
  }, 0);
}

function getPublicationSearchText(publication) {
  return normalizePublicationQuery([
    publication.title,
    publication.authors,
    publication.venue,
    publication.year,
    publication.researcherName,
    ...(Array.isArray(publication.researcherNames) ? publication.researcherNames : []),
    ...(Array.isArray(publication.tags) ? publication.tags : [])
  ].filter(Boolean).join(' '));
}

function normalizePublicationQuery(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function renderPublications() {
  const publications = getFilteredPublications();
  const totalPages = Math.max(1, Math.ceil(publications.length / PUBLICATIONS_PER_PAGE));

  if (!publicationState.target || !Array.isArray(publicationState.all)) return;
  if (publicationState.page > totalPages) publicationState.page = totalPages;

  const start = (publicationState.page - 1) * PUBLICATIONS_PER_PAGE;
  const visiblePublications = publications.slice(start, start + PUBLICATIONS_PER_PAGE);

  publicationState.target.innerHTML = '';
  visiblePublications.forEach((publication) => {
    publicationState.target.append(createPublicationCard(publication));
  });

  if (!visiblePublications.length) {
    const empty = document.createElement('p');
    empty.className = 'pub-empty';
    empty.textContent = 'No publications match the current search or filter.';
    publicationState.target.append(empty);
  }

  renderPublicationSummary(publications.length, start, visiblePublications.length);
  renderPublicationPagination(totalPages);
}

function createPublicationCard(publication) {
  const article = document.createElement('article');
  article.className = 'pub-card';
  article.dataset.tags = Array.isArray(publication.tags) ? publication.tags.join(' ') : '';

  const body = document.createElement('div');

  const year = document.createElement('p');
  year.className = 'pub-year';
  year.textContent = publication.year;

  const title = document.createElement('h2');
  title.textContent = publication.title;

  const meta = document.createElement('p');
  meta.className = 'pub-meta';
  meta.textContent = [publication.authors, publication.venue].filter(Boolean).join(' | ');

  body.append(year, title, meta);

  const href = publication.doiUrl || publication.scholarUrl || publication.sourceUrl;
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = publication.doiUrl ? 'DOI' : 'Source';

    article.append(body, link);
  } else {
    article.append(body);
  }

  return article;
}

function renderPublicationSummary(total, start, count) {
  if (!publicationState.summary) return;

  const query = publicationState.search.trim();
  const suffix = query ? ` for "${query}"` : '';

  if (!total) {
    publicationState.summary.textContent = `Showing 0 publications${suffix}`;
    return;
  }

  const first = start + 1;
  const last = start + count;
  publicationState.summary.textContent = `Showing ${first}-${last} of ${total} publications${suffix}`;
}

function renderPublicationPagination(totalPages) {
  const pagination = publicationState.pagination;
  if (!pagination) return;

  pagination.innerHTML = '';
  pagination.hidden = totalPages <= 1;
  if (totalPages <= 1) return;

  pagination.append(
    createPaginationButton('Previous', publicationState.page - 1, publicationState.page === 1)
  );

  for (let page = 1; page <= totalPages; page += 1) {
    pagination.append(createPaginationButton(String(page), page, false, page === publicationState.page));
  }

  pagination.append(
    createPaginationButton('Next', publicationState.page + 1, publicationState.page === totalPages)
  );
}

function createPaginationButton(label, page, disabled, current = false) {
  const button = document.createElement('button');
  button.className = 'pagination-button';
  button.type = 'button';
  button.textContent = label;
  button.disabled = disabled;
  button.setAttribute('aria-current', current ? 'page' : 'false');

  button.addEventListener('click', () => {
    if (disabled || current) return;
    publicationState.page = page;
    renderPublications();
  });

  return button;
}

function bindPublicationFilters() {
  const filterButtons = document.querySelectorAll('[data-filter]');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      publicationState.filter = button.dataset.filter || 'all';
      publicationState.page = 1;

      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });

      renderPublications();
      renderPublicationSuggestions();
    });
  });
}

function bindPublicationSearch() {
  const searchInput = publicationState.searchInput;
  const sortSelect = publicationState.sortSelect;
  const clearButton = publicationState.clearButton;

  searchInput?.addEventListener('input', () => {
    publicationState.search = searchInput.value;
    publicationState.page = 1;
    syncPublicationClearButton();
    syncPublicationSearchState();
    renderPublicationSuggestions();
    renderPublications();
  });

  searchInput?.addEventListener('focus', () => {
    renderPublicationSuggestions();
  });

  searchInput?.addEventListener('keydown', (event) => {
    handlePublicationSuggestionKeydown(event);
  });

  sortSelect?.addEventListener('change', () => {
    publicationState.sort = sortSelect.value || 'relevance';
    publicationState.page = 1;
    renderPublications();
  });

  clearButton?.addEventListener('click', () => {
    publicationState.search = '';
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    publicationState.page = 1;
    syncPublicationClearButton();
    syncPublicationSearchState();
    hidePublicationSuggestions();
    renderPublications();
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target && typeof target.closest === 'function' && !target.closest('.publication-search-field')) {
      hidePublicationSuggestions();
    }
  });

  syncPublicationClearButton();
  syncPublicationSearchState();
}

function syncPublicationClearButton() {
  if (!publicationState.clearButton) return;
  publicationState.clearButton.hidden = !normalizePublicationQuery(publicationState.search);
}

function syncPublicationSearchState() {
  if (!publicationState.searchInput) return;
  const active = Boolean(normalizePublicationQuery(publicationState.search));
  publicationState.searchInput.classList.toggle('is-active', active);
  publicationState.searchInput.setAttribute('aria-expanded', active && !publicationState.suggestions?.hidden ? 'true' : 'false');
}

function renderPublicationSuggestions() {
  const suggestions = publicationState.suggestions;
  const query = normalizePublicationQuery(publicationState.search);
  if (!suggestions || !query) {
    hidePublicationSuggestions();
    return;
  }

  const matches = getPublicationSuggestionValues(getTagFilteredPublications(), query);
  suggestions.replaceChildren();
  publicationState.activeSuggestionIndex = -1;

  if (!matches.length) {
    hidePublicationSuggestions();
    return;
  }

  matches.forEach((suggestion, index) => {
    const button = document.createElement('button');
    button.className = 'publication-suggestion';
    button.type = 'button';
    button.id = `publication-suggestion-${index}`;
    button.dataset.value = suggestion.value;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', 'false');

    const value = document.createElement('span');
    value.textContent = suggestion.value;

    const type = document.createElement('small');
    type.textContent = suggestion.type;

    button.append(value, type);
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });
    button.addEventListener('click', () => {
      applyPublicationSuggestion(suggestion.value);
    });
    suggestions.append(button);
  });

  suggestions.hidden = false;
  syncPublicationSearchState();
}

function getPublicationSuggestionValues(publications, query) {
  const values = [];

  publications.forEach((publication) => {
    values.push({ value: publication.title, type: 'Title', weight: 50 });
    values.push({ value: publication.venue, type: 'Venue', weight: 30 });
    values.push({ value: publication.year, type: 'Year', weight: 20 });
    values.push({ value: publication.researcherName, type: 'Researcher', weight: 20 });

    (Array.isArray(publication.researcherNames) ? publication.researcherNames : []).forEach((name) => {
      values.push({ value: name, type: 'Researcher', weight: 20 });
    });

    (Array.isArray(publication.tags) ? publication.tags : []).forEach((tag) => {
      values.push({ value: tag, type: 'Topic', weight: 18 });
    });

    getAuthorSuggestionValues(publication.authors).forEach((author) => {
      values.push({ value: author, type: 'Author', weight: 38 });
    });
  });

  return uniquePublicationSuggestions(values, query).slice(0, 8);
}

function getAuthorSuggestionValues(authors = '') {
  return String(authors)
    .split(',')
    .map((author) => author.trim())
    .filter((author) => author.length >= 3);
}

function uniquePublicationSuggestions(values, query) {
  const seen = new Set();

  return values
    .map((suggestion) => ({
      ...suggestion,
      value: String(suggestion.value || '').trim()
    }))
    .filter((suggestion) => {
      const key = normalizePublicationQuery(suggestion.value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return key.includes(query);
    })
    .sort((a, b) => {
      const scoreA = getSuggestionScore(a, query);
      const scoreB = getSuggestionScore(b, query);
      return scoreA === scoreB ? a.value.localeCompare(b.value) : scoreB - scoreA;
    });
}

function getSuggestionScore(suggestion, query) {
  const text = normalizePublicationQuery(suggestion.value);
  return suggestion.weight + (text.startsWith(query) ? suggestion.weight : 0);
}

function handlePublicationSuggestionKeydown(event) {
  const suggestions = publicationState.suggestions;
  if (!suggestions || suggestions.hidden) return;

  const items = Array.from(suggestions.querySelectorAll('.publication-suggestion'));
  if (!items.length) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActivePublicationSuggestion(Math.min(publicationState.activeSuggestionIndex + 1, items.length - 1));
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActivePublicationSuggestion(Math.max(publicationState.activeSuggestionIndex - 1, 0));
  }

  if (event.key === 'Enter' && publicationState.activeSuggestionIndex >= 0) {
    event.preventDefault();
    applyPublicationSuggestion(items[publicationState.activeSuggestionIndex].dataset.value);
  }

  if (event.key === 'Escape') {
    hidePublicationSuggestions();
  }
}

function setActivePublicationSuggestion(index) {
  const suggestions = publicationState.suggestions;
  if (!suggestions) return;

  const items = Array.from(suggestions.querySelectorAll('.publication-suggestion'));
  publicationState.activeSuggestionIndex = index;

  items.forEach((item, itemIndex) => {
    const active = itemIndex === index;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  if (publicationState.searchInput && items[index]) {
    publicationState.searchInput.setAttribute('aria-activedescendant', items[index].id);
  }
}

function applyPublicationSuggestion(value) {
  publicationState.search = value;
  if (publicationState.searchInput) {
    publicationState.searchInput.value = value;
    publicationState.searchInput.focus();
    publicationState.searchInput.removeAttribute('aria-activedescendant');
  }

  publicationState.page = 1;
  syncPublicationClearButton();
  syncPublicationSearchState();
  hidePublicationSuggestions();
  renderPublications();
}

function hidePublicationSuggestions() {
  const suggestions = publicationState.suggestions;
  if (!suggestions) return;

  suggestions.hidden = true;
  suggestions.replaceChildren();
  publicationState.activeSuggestionIndex = -1;

  if (publicationState.searchInput) {
    publicationState.searchInput.setAttribute('aria-expanded', 'false');
    publicationState.searchInput.removeAttribute('aria-activedescendant');
  }
}

function initializeGroupCards() {
  const target = document.getElementById('group-cards');
  if (!target) return;

  const groups = window.RIS_REVIEWED_DATA?.groups;
  renderGroupCards(target, Array.isArray(groups) ? groups : []);
}

function renderGroupCards(target, groups) {
  target.replaceChildren();

  if (!groups.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No research groups listed yet.';
    target.append(empty);
    return;
  }

  groups.forEach((group) => {
    target.append(createGroupCard(group));
  });
}

function createGroupCard(group) {
  const article = document.createElement('article');
  article.className = 'card project-card';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'Research group';

  const title = document.createElement('h2');
  title.textContent = group.name || 'Research group';

  const summary = document.createElement('p');
  summary.textContent = group.summary || '';

  const links = document.createElement('p');
  links.className = 'links';

  const groupPage = document.createElement('a');
  groupPage.href = getGroupPageHref(group);
  groupPage.textContent = 'Group page';
  links.append(groupPage);

  if (group.officialUrl) {
    const officialPage = document.createElement('a');
    officialPage.href = group.officialUrl;
    officialPage.target = '_blank';
    officialPage.rel = 'noopener';
    officialPage.textContent = 'Official page';
    links.append(officialPage);
  }

  article.append(eyebrow, title, summary, links);
  return article;
}

function getGroupPageHref(group) {
  const slug = String(group.slug || '').replace(/[^a-z0-9-]/gi, '');
  return slug ? `groups/${slug}.html` : 'projects.html';
}

function initializeRuntimeState() {
  const marker = document.querySelector('.brand-mark');
  const key = 37;
  const routeToken = [6, 82, 78, 69];
  let markerTouches = 0;
  let resetTimer = 0;

  const matchesRouteToken = () => {
    return window.location.hash.toLowerCase() === decodeRuntimeToken(routeToken, key);
  };

  const revealPanel = () => {
    if (document.querySelector('.runtime-panel')) return;

    const lines = [
      [119, 111, 116, 8, 97, 95, 73, 12, 79, 91, 70, 73, 66, 7, 68, 70, 77],
      [104, 71, 78, 70, 93, 75, 66, 66, 72, 92, 21, 5, 114, 78, 69, 9, 104, 78, 66, 94, 75],
      [118, 79, 64, 70, 72, 70, 17, 12, 76, 92, 76, 77, 79, 81, 77, 77, 10, 66, 66, 13, 94, 67, 68, 79, 73, 8, 90, 67, 76, 68, 89],
      [102, 73, 73, 91, 93, 88, 94, 79, 89, 65, 93, 5, 115, 73, 65, 95, 79, 89, 95, 68, 90, 86, 5, 116, 110, 123]
    ].map((values) => decodeRuntimeToken(values, key));

    const panel = document.createElement('aside');
    panel.className = 'runtime-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', lines[0]);

    const title = document.createElement('strong');
    title.textContent = lines[0];

    const detail = document.createElement('div');
    lines.slice(1).forEach((line) => {
      const row = document.createElement('p');
      row.textContent = line;
      detail.append(row);
    });

    const close = document.createElement('button');
    close.className = 'runtime-panel-close';
    close.type = 'button';
    close.textContent = 'Close';

    const dismiss = () => {
      panel.classList.add('is-closing');
      window.setTimeout(() => {
        panel.remove();
      }, 180);
    };

    close.addEventListener('click', dismiss);
    panel.append(title, detail, close);
    document.body.append(panel);
    window.setTimeout(dismiss, 12000);
  };

  if (matchesRouteToken()) {
    revealPanel();
  }

  window.addEventListener('hashchange', () => {
    if (matchesRouteToken()) {
      revealPanel();
    }
  });

  marker?.addEventListener('click', (event) => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
    }

    markerTouches += 1;
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      markerTouches = 0;
    }, 1800);

    if (markerTouches >= 7) {
      markerTouches = 0;
      revealPanel();
    }
  });
}

function decodeRuntimeToken(values, key) {
  return values
    .map((value, index) => String.fromCharCode(value ^ (key + (index % 11))))
    .join('');
}
