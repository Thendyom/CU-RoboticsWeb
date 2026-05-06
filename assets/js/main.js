document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  btn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach((link) => {
    const target = link.getAttribute('href');
    if (target === currentPage) {
      link.setAttribute('aria-current', 'page');
    }
  });

  const filterButtons = document.querySelectorAll('[data-filter]');
  const publications = document.querySelectorAll('.pub-card[data-tags]');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
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
});
