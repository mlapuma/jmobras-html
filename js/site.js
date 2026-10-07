const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');
if (toggle && menu) {
 const closeMenu = (restoreFocus = false) => {
  menu.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menu');
  if (restoreFocus) toggle.focus();
 };
 toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
 });
 menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
 document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });
 document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
 const desktop = window.matchMedia('(min-width: 841px)');
 desktop.addEventListener('change', event => { if (event.matches) closeMenu(); });
}
