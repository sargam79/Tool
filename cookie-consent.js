/* ToolPond cookie notice for visitors in the UK and Europe.
   Works with the Google consent defaults already set in each page's <head>
   (ad_storage, ad_user_data, ad_personalization and analytics_storage start as "denied"
   for EEA, UK and Switzerland). Nothing is granted until the visitor chooses "Accept". */
(function () {
  'use strict';
  var KEY = 'tp_consent_v1';
  var EXTRA_TZ = ['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Faroe'];

  function inEurope() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      return tz.indexOf('Europe/') === 0 || EXTRA_TZ.indexOf(tz) !== -1;
    } catch (e) { return false; }
  }
  function read() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function gt() { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }
  function apply(granted) {
    var s = granted ? 'granted' : 'denied';
    gt('consent', 'update', { ad_storage: s, ad_user_data: s, ad_personalization: s, analytics_storage: s });
  }

  if (!inEurope()) return;

  var saved = read();
  if (saved && typeof saved.a === 'boolean') apply(saved.a);

  function css() {
    if (document.getElementById('tp-cc-css')) return;
    var st = document.createElement('style'); st.id = 'tp-cc-css';
    st.textContent =
      '#tp-cc{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#fff;color:#1f2937;border-top:1px solid #d1d5db;box-shadow:0 -4px 18px rgba(0,0,0,.12);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:14px 16px}' +
      '#tp-cc .in{max-width:980px;margin:0 auto;display:flex;gap:14px;align-items:center;flex-wrap:wrap}' +
      '#tp-cc p{margin:0;flex:1 1 340px}#tp-cc a{color:#0f4c81}' +
      '#tp-cc .b{display:flex;gap:10px;flex:0 0 auto}' +
      '#tp-cc button{font:inherit;font-weight:600;padding:9px 18px;border-radius:8px;border:2px solid #111827;background:#fff;color:#111827;cursor:pointer;min-width:120px}' +
      '#tp-cc button:hover,#tp-cc button:focus-visible{background:#111827;color:#fff}' +
      '@media(max-width:560px){#tp-cc .b{width:100%}#tp-cc button{flex:1}}' +
      '@media(prefers-color-scheme:dark){#tp-cc{background:#111827;color:#e5e7eb;border-color:#374151}#tp-cc a{color:#93c5fd}#tp-cc button{background:#111827;color:#f9fafb;border-color:#e5e7eb}#tp-cc button:hover,#tp-cc button:focus-visible{background:#f9fafb;color:#111827}}';
    document.head.appendChild(st);
  }
  function close() { var b = document.getElementById('tp-cc'); if (b) b.parentNode.removeChild(b); }
  function choose(a) { write({ a: a, t: Date.now() }); apply(a); close(); }

  function show() {
    if (document.getElementById('tp-cc')) return;
    css();
    var d = document.createElement('div');
    d.id = 'tp-cc'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie choices');
    d.innerHTML =
      '<div class="in"><p>We use cookies for analytics and to show ads. You can accept them or reject everything that is not essential. ' +
      'You can change your choice at any time with "Cookie settings" in the footer. ' +
      '<a href="/privacy-policy.html">Privacy policy</a></p>' +
      '<div class="b"><button type="button" id="tp-cc-no">Reject</button><button type="button" id="tp-cc-yes">Accept</button></div></div>';
    document.body.appendChild(d);
    document.getElementById('tp-cc-yes').onclick = function () { choose(true); };
    document.getElementById('tp-cc-no').onclick = function () { choose(false); };
  }
  window.tpCookieSettings = show;

  function footerLink() {
    var f = document.querySelector('.tp-ftr'); if (!f || f.querySelector('.tp-cc-link')) return;
    var p = document.createElement('p');
    p.className = 'tp-cc-link'; p.style.cssText = 'margin:.8rem 0 0;font-size:.85rem';
    p.innerHTML = '<a href="#" style="color:inherit;text-decoration:underline">Cookie settings</a>';
    p.firstChild.onclick = function (e) { e.preventDefault(); show(); };
    f.appendChild(p);
  }
  function init() { footerLink(); if (!saved) show(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
