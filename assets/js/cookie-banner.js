/**
 * AIXXEN cookie / GDPR consent banner.
 *
 * Behaviour
 *  - On first visit, a banner appears at the bottom of the page.
 *  - Three equally prominent buttons: Accept all · Reject all · Customise.
 *  - "Customise" opens a modal with cookie categories (essential / analytics /
 *    marketing). Essential is always on and locked. Others default to OFF
 *    until the user opts in (GDPR opt-in, not opt-out).
 *  - Choice is saved to localStorage under `aixxen.cookieConsent.v1`.
 *  - A footer link with id="manage-cookies" re-opens the modal anytime.
 *
 * Implementation note
 *  - The launch site does NOT load any analytics or marketing scripts today,
 *    so this banner is mostly disclosure. The structure is in place so we can
 *    gate future scripts on `window.AixxenConsent.has('analytics')` etc.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'aixxen.cookieConsent.v1';
  var DEFAULT_STATE = {
    version: 1,
    timestamp: null,
    essential: true,   // always on; locked
    analytics: false,
    marketing: false,
  };

  // ── Storage ────────────────────────────────────────────────────────────

  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed.version !== 1) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function save(state) {
    state.version = 1;
    state.timestamp = new Date().toISOString();
    state.essential = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* quota — silently drop */ }
  }

  // Public API for future scripts to gate themselves
  window.AixxenConsent = {
    has: function (category) {
      var s = load();
      if (!s) return false;
      return Boolean(s[category]);
    },
    open: function () { openModal(); },
    reset: function () {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      showBanner();
    },
  };

  // ── Styles (injected once) ─────────────────────────────────────────────

  var STYLES = [
    '#aixxen-cookie-banner, #aixxen-cookie-modal *,',
    '#aixxen-cookie-banner *, #aixxen-cookie-modal { box-sizing: border-box; }',
    '#aixxen-cookie-banner {',
    '  position: fixed; left: 0; right: 0; bottom: 0; z-index: 1000;',
    '  background: #1f1f1f; color: #ffffff;',
    '  border-top: 1px solid #000;',
    '  font-family: Inter, system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif;',
    '  font-size: 13px; line-height: 1.55;',
    '  padding: 1rem 1.25rem;',
    '  display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;',
    '  box-shadow: 0 -10px 30px rgba(0,0,0,0.18);',
    '}',
    '#aixxen-cookie-banner.is-hidden { display: none; }',
    '#aixxen-cookie-banner p { margin: 0; flex: 1 1 320px; }',
    '#aixxen-cookie-banner a { color: #ffffff; text-decoration: underline; text-underline-offset: 2px; }',
    '#aixxen-cookie-banner .cb-actions { display: flex; gap: .5rem; flex-wrap: wrap; }',
    '#aixxen-cookie-banner button {',
    '  font: inherit; cursor: pointer;',
    '  padding: .55rem 1rem;',
    '  border: 1px solid #6b727f;',
    '  background: transparent; color: #ffffff;',
    '  font-size: 12px; font-weight: 600; letter-spacing: .2px;',
    '  transition: background .15s, border-color .15s;',
    '}',
    '#aixxen-cookie-banner button:hover { background: #2e2e2e; border-color: #ffffff; }',
    '#aixxen-cookie-banner button.cb-primary { background: #ffffff; color: #1f1f1f; border-color: #ffffff; }',
    '#aixxen-cookie-banner button.cb-primary:hover { background: #f3f3f3; }',

    '#aixxen-cookie-modal {',
    '  position: fixed; inset: 0; z-index: 1001;',
    '  background: rgba(0,0,0,0.45);',
    '  display: flex; align-items: center; justify-content: center;',
    '  padding: 1.25rem;',
    '  font-family: Inter, system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif;',
    '}',
    '#aixxen-cookie-modal.is-hidden { display: none; }',
    '#aixxen-cookie-modal .cb-modal-card {',
    '  background: #ffffff; color: #1f1f1f;',
    '  border: 1px solid #e0e0e0;',
    '  width: min(560px, 100%); max-height: 90vh; overflow-y: auto;',
    '  padding: 1.5rem;',
    '}',
    '#aixxen-cookie-modal h2 { font-size: 1.25rem; font-weight: 700; margin: 0 0 .5rem; line-height: 1.2; }',
    '#aixxen-cookie-modal p { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0 0 1rem; }',
    '#aixxen-cookie-modal .cb-cat {',
    '  border: 1px solid #e0e0e0; padding: .85rem 1rem; margin-bottom: .5rem;',
    '  display: flex; gap: 1rem; align-items: flex-start;',
    '}',
    '#aixxen-cookie-modal .cb-cat-text { flex: 1; }',
    '#aixxen-cookie-modal .cb-cat-text strong { display: block; font-size: 13px; color: #1f1f1f; margin-bottom: .15rem; }',
    '#aixxen-cookie-modal .cb-cat-text small { font-size: 12px; color: #6b7280; line-height: 1.5; }',
    '#aixxen-cookie-modal .cb-toggle {',
    '  position: relative; display: inline-block; width: 36px; height: 20px;',
    '  flex-shrink: 0; margin-top: 2px;',
    '}',
    '#aixxen-cookie-modal .cb-toggle input { opacity: 0; width: 0; height: 0; }',
    '#aixxen-cookie-modal .cb-toggle .slider {',
    '  position: absolute; cursor: pointer; inset: 0; background: #d0d0d0;',
    '  transition: background .15s;',
    '}',
    '#aixxen-cookie-modal .cb-toggle .slider::before {',
    '  position: absolute; content: ""; height: 14px; width: 14px;',
    '  left: 3px; top: 3px; background: #ffffff; transition: transform .15s;',
    '}',
    '#aixxen-cookie-modal .cb-toggle input:checked + .slider { background: #1f1f1f; }',
    '#aixxen-cookie-modal .cb-toggle input:checked + .slider::before { transform: translateX(16px); }',
    '#aixxen-cookie-modal .cb-toggle input:disabled + .slider { background: #b0b0b0; cursor: not-allowed; }',
    '#aixxen-cookie-modal .cb-modal-actions {',
    '  display: flex; gap: .5rem; flex-wrap: wrap; margin-top: 1rem;',
    '  justify-content: flex-end;',
    '}',
    '#aixxen-cookie-modal .cb-modal-actions button {',
    '  font: inherit; cursor: pointer;',
    '  padding: .55rem 1rem;',
    '  border: 1px solid #c8c8c8;',
    '  background: #ffffff; color: #1f1f1f;',
    '  font-size: 12px; font-weight: 600; letter-spacing: .2px;',
    '}',
    '#aixxen-cookie-modal .cb-modal-actions button:hover { border-color: #1f1f1f; }',
    '#aixxen-cookie-modal .cb-modal-actions button.cb-primary { background: #1f1f1f; color: #ffffff; border-color: #1f1f1f; }',
    '#aixxen-cookie-modal .cb-modal-actions button.cb-primary:hover { background: #000000; }',
  ].join('\n');

  // ── DOM ────────────────────────────────────────────────────────────────

  var bannerEl = null;
  var modalEl = null;

  function injectStyles() {
    if (document.getElementById('aixxen-cookie-styles')) return;
    var style = document.createElement('style');
    style.id = 'aixxen-cookie-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function buildBanner() {
    var el = document.createElement('div');
    el.id = 'aixxen-cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<p>' +
        'AIXXEN uses essential cookies to make this site work. With your consent, we may also use analytics and marketing cookies in the future. ' +
        '<a href="cookies.html">Cookie policy</a> · <a href="privacy.html">Privacy</a>.' +
      '</p>' +
      '<div class="cb-actions">' +
        '<button type="button" data-cb="reject">Reject all</button>' +
        '<button type="button" data-cb="customise">Customise</button>' +
        '<button type="button" class="cb-primary" data-cb="accept">Accept all</button>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('[data-cb="accept"]').addEventListener('click', function () {
      save({ analytics: true, marketing: true });
      hideBanner();
    });
    el.querySelector('[data-cb="reject"]').addEventListener('click', function () {
      save({ analytics: false, marketing: false });
      hideBanner();
    });
    el.querySelector('[data-cb="customise"]').addEventListener('click', function () {
      openModal();
    });
    return el;
  }

  function buildModal() {
    var el = document.createElement('div');
    el.id = 'aixxen-cookie-modal';
    el.className = 'is-hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Cookie preferences');
    el.innerHTML =
      '<div class="cb-modal-card">' +
        '<h2>Cookie preferences</h2>' +
        '<p>We respect your privacy. Choose which cookie categories you allow. You can change this anytime via the "Manage cookies" link in the footer.</p>' +

        '<div class="cb-cat">' +
          '<div class="cb-cat-text">' +
            '<strong>Essential</strong>' +
            '<small>Required for the site to work — remembers your cookie choice and any session state. Cannot be disabled.</small>' +
          '</div>' +
          '<label class="cb-toggle"><input type="checkbox" checked disabled><span class="slider"></span></label>' +
        '</div>' +

        '<div class="cb-cat">' +
          '<div class="cb-cat-text">' +
            '<strong>Analytics</strong>' +
            '<small>Anonymous usage statistics so we can improve the site. None are loaded today; this toggle is the on/off switch for future analytics.</small>' +
          '</div>' +
          '<label class="cb-toggle"><input type="checkbox" data-cat="analytics"><span class="slider"></span></label>' +
        '</div>' +

        '<div class="cb-cat">' +
          '<div class="cb-cat-text">' +
            '<strong>Marketing</strong>' +
            '<small>Cookies used by ad networks or attribution tools. None are loaded today.</small>' +
          '</div>' +
          '<label class="cb-toggle"><input type="checkbox" data-cat="marketing"><span class="slider"></span></label>' +
        '</div>' +

        '<div class="cb-modal-actions">' +
          '<button type="button" data-cb="modal-reject">Reject all</button>' +
          '<button type="button" class="cb-primary" data-cb="modal-save">Save preferences</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    function getToggles() {
      return {
        analytics: el.querySelector('[data-cat="analytics"]'),
        marketing: el.querySelector('[data-cat="marketing"]'),
      };
    }

    el.querySelector('[data-cb="modal-save"]').addEventListener('click', function () {
      var t = getToggles();
      save({ analytics: t.analytics.checked, marketing: t.marketing.checked });
      closeModal();
      hideBanner();
    });
    el.querySelector('[data-cb="modal-reject"]').addEventListener('click', function () {
      save({ analytics: false, marketing: false });
      closeModal();
      hideBanner();
    });
    el.addEventListener('click', function (e) {
      if (e.target === el) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.classList.contains('is-hidden')) closeModal();
    });
    return el;
  }

  function showBanner() {
    if (!bannerEl) bannerEl = buildBanner();
    bannerEl.classList.remove('is-hidden');
  }
  function hideBanner() {
    if (bannerEl) bannerEl.classList.add('is-hidden');
  }
  function openModal() {
    if (!modalEl) modalEl = buildModal();
    var existing = load();
    var t = {
      analytics: modalEl.querySelector('[data-cat="analytics"]'),
      marketing: modalEl.querySelector('[data-cat="marketing"]'),
    };
    t.analytics.checked = Boolean(existing && existing.analytics);
    t.marketing.checked = Boolean(existing && existing.marketing);
    modalEl.classList.remove('is-hidden');
  }
  function closeModal() {
    if (modalEl) modalEl.classList.add('is-hidden');
  }

  // ── Footer "Manage cookies" hook ──────────────────────────────────────

  function wireManageLink() {
    var triggers = document.querySelectorAll('[data-cookie-manage], #manage-cookies');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────

  function init() {
    injectStyles();
    wireManageLink();
    if (!load()) {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
