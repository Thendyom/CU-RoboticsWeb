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
