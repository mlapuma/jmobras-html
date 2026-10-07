const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');
if (toggle && menu) {
 const desktop = window.matchMedia('(min-width: 841px)');
 const links = Array.from(menu.querySelectorAll('a'));
 const isOpen = () => menu.classList.contains('is-open');
 const closeMenu = (restoreFocus = false) => {
  menu.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menu');
  if (restoreFocus) toggle.focus();
 };
 toggle.addEventListener('click', () => {
  if (isOpen()) {
   closeMenu();
   return;
  }
  menu.classList.add('is-open');
  document.body.classList.add('menu-open');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'Fechar menu');
  if (links.length) links[0].focus();
 });
 links.forEach(link => link.addEventListener('click', () => {
  const wasOpen = isOpen();
  closeMenu();
  const destination = new URL(link.href, window.location.href);
  if (!wasOpen || destination.origin !== location.origin ||
      destination.pathname.replace(/\/index\.html$/, '/') !==
      location.pathname.replace(/\/index\.html$/, '/') || !destination.hash) return;
  const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
  if (target) {
   if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
   target.focus({ preventScroll: true });
  }
 }));
 document.addEventListener('keydown', event => {
  if (!isOpen() || desktop.matches) return;
  if (event.key === 'Escape') {
   event.preventDefault();
   closeMenu(true);
   return;
  }
  if (event.key !== 'Tab') return;
  const first = toggle;
  const last = links[links.length - 1] || toggle;
  if (event.shiftKey && document.activeElement === first) {
   event.preventDefault();
   last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
   event.preventDefault();
   first.focus();
  }
 });
 document.addEventListener('click', event => {
  if (isOpen() && !event.target.closest('.nav')) closeMenu();
 });
 document.addEventListener('focusin', event => {
  if (isOpen() && !event.target.closest('.nav')) closeMenu();
 });
 desktop.addEventListener('change', event => { if (event.matches) closeMenu(); });
}
