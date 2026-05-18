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

  renderPublications();
  bindPublicationFilters();
});

function renderPublications() {
  const target = document.getElementById('publication-list');
  const data = window.RIS_REVIEWED_DATA;
  const publications = data?.publications;

  if (!target || !Array.isArray(publications)) return;

  target.innerHTML = '';
  publications.forEach((publication) => {
    const article = document.createElement('article');
    article.className = 'pub-card';
    article.dataset.tags = publication.tags.join(' ');

    const body = document.createElement('div');

    const year = document.createElement('p');
    year.className = 'pub-year';
    year.textContent = publication.year;

    const title = document.createElement('h2');
    title.textContent = publication.title;

    const meta = document.createElement('p');
    meta.className = 'pub-meta';
    meta.textContent = `${publication.authors} | ${publication.venue}`;

    const checked = document.createElement('p');
    checked.className = 'pub-source';
    checked.textContent = `Checked ${publication.checkedDate}`;

    body.append(year, title, meta, checked);

    const link = document.createElement('a');
    link.href = publication.doiUrl || publication.scholarUrl || publication.sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = publication.doiUrl ? 'DOI' : 'Source';

    article.append(body, link);
    target.append(article);
  });
}

function bindPublicationFilters() {
  const filterButtons = document.querySelectorAll('[data-filter]');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      const publications = document.querySelectorAll('.pub-card[data-tags]');

      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });

      publications.forEach((publication) => {
        const tags = publication.dataset.tags.split(/\s+/);
        publication.classList.toggle('is-hidden', filter !== 'all' && !tags.includes(filter));
      });
    });
  });
}
