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
  initializeRuntimeState();
});

const PUBLICATIONS_PER_PAGE = 12;
const publicationState = {
  all: [],
  filter: 'all',
  page: 1,
  target: null,
  pagination: null,
  summary: null
};

function initializePublications() {
  const target = document.getElementById('publication-list');
  if (!target) return;

  publicationState.target = target;
  publicationState.pagination = document.getElementById('publication-pagination');
  publicationState.summary = document.getElementById('publication-summary');
  publicationState.all = getPublicationData();

  bindPublicationFilters();
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
  if (publicationState.filter === 'all') {
    return publicationState.all;
  }

  return publicationState.all.filter((publication) => {
    const tags = Array.isArray(publication.tags) ? publication.tags : [];
    return tags.includes(publicationState.filter);
  });
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
    empty.textContent = 'No publications match this filter.';
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

  if (!total) {
    publicationState.summary.textContent = 'Showing 0 publications';
    return;
  }

  const first = start + 1;
  const last = start + count;
  publicationState.summary.textContent = `Showing ${first}-${last} of ${total} publications`;
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
    });
  });
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
