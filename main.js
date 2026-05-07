// main.js — modal opener and history binding.
// No third-party deps. Loaded with `defer` so DOM is ready by execution.

const MODAL_ID = 'doc-modal';
const DOC_PATH = /^\/(research|patent)\/[^/]+\/?$/;

document.addEventListener('DOMContentLoaded', () => {
  setupModal();
  bindRowClicks();

  if (DOC_PATH.test(location.pathname)) {
    openModal(location.pathname);
  }

  window.addEventListener('popstate', () => {
    if (DOC_PATH.test(location.pathname)) openModal(location.pathname);
    else closeModal();
  });
});

function setupModal() {
  const dialog = document.createElement('dialog');
  dialog.id = MODAL_ID;
  dialog.innerHTML = `
    <div class="modal-progress" role="presentation"></div>
    <button class="modal-close" type="button" aria-label="Close">×</button>
    <div class="modal-scroll">
      <div class="modal-content"></div>
    </div>
  `;
  document.body.appendChild(dialog);

  dialog.addEventListener('click', e => { if (e.target === dialog) closeModal(); });
  dialog.querySelector('.modal-close').addEventListener('click', closeModal);
  dialog.querySelector('.modal-scroll').addEventListener('scroll', updateProgress);
  dialog.addEventListener('close', () => {
    if (DOC_PATH.test(location.pathname)) {
      history.pushState(null, '', '/');
    }
  });
}

function bindRowClicks() {
  document.addEventListener('click', e => {
    const a = e.target.closest('.preview-link');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!DOC_PATH.test(href)) return;
    e.preventDefault();
    if (location.pathname !== href) history.pushState(null, '', href);
    openModal(href);
  });
}

async function openModal(path) {
  const modal = document.getElementById(MODAL_ID);
  const content = modal.querySelector('.modal-content');
  content.innerHTML = '<p class="modal-loading">Loading…</p>';
  if (!modal.open) modal.showModal();

  const fetchPath = path.endsWith('/') ? path : path + '/';
  try {
    const res = await fetch(fetchPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const dom = new DOMParser().parseFromString(html, 'text/html');
    const node = dom.querySelector('main article') || dom.querySelector('main');
    if (!node) throw new Error('No <main> in fallback page');
    content.innerHTML = '';
    content.appendChild(node.cloneNode(true));
    modal.querySelector('.modal-scroll').scrollTop = 0;
    updateProgress();
  } catch (err) {
    content.innerHTML = `<p>Couldn't load this page. <a href="${path}">Open it directly</a>.</p>`;
  }
}

function closeModal() {
  const modal = document.getElementById(MODAL_ID);
  if (modal && modal.open) modal.close();
}

function updateProgress() {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) return;
  const scroll = modal.querySelector('.modal-scroll');
  const bar = modal.querySelector('.modal-progress');
  if (!scroll || !bar) return;
  const denom = Math.max(1, scroll.scrollHeight - scroll.clientHeight);
  bar.style.transform = `scaleX(${scroll.scrollTop / denom})`;
}
