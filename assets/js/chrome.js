/* Re. shared header: slims down on scroll, opens the mobile menu. */
(function () {
  var header = document.querySelector('.re-header');
  if (!header) return;

  function onScroll() { header.classList.toggle('is-compact', (window.scrollY || 0) > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var btn = header.querySelector('.re-menu-btn');
  var menu = header.querySelector('.re-mobile-menu');
  btn.addEventListener('click', function () {
    var open = menu.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
})();
