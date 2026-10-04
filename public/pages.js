/* Saqib portfolio — two-page split
   Home (index.html): personal info — bio, achievements, gallery, quote, CV, contact
   More (more.html):  everything else — poetry, shers, guestbook, quiz, Q&A, Deewar e Dil, Saqib Zone

   Defensive: if anything here fails, the site still works exactly as before. */
(function () {
  'use strict';

  var PAGE = window.SQ_PAGE === 'more' ? 'more' : 'home';

  /* Sections owned by the personal / home page */
  var HOME_IDS = [
    'bio',           /* 01 — Bio */
    'achievements',  /* 02 — Achievements */
    'gallery',       /* 03 — Gallery */
    'quote',         /* 05 — Quote of the day */
    'sq-cv-btn',     /* 08 — CV */
    'contact'
  ];

  /* Sections owned by the additional / more page */
  var MORE_IDS = [
    'sq-poetry',     /* 04 — Poetry */
    'music',         /* 06 — Music (Preact section — hidden once the rich player exists) */
    'sq-music',      /* 06 — Music (enhancements.js rich player) */
    'sq-user-sher',  /* 07 — Aap ka Sher */
    'guestbook',     /* 09 — Guestbook */
    'quiz',          /* 10 — Quiz */
    'qa',            /* 11 — Q&A */
    'sq-hearts',     /* 12 — Deewar e Dil */
    'sq-zone',       /* 13 — Saqib Zone */
    'sq-dps'
  ];

  /* Home-only blocks that are injected without a stable section id */
  var HOME_EXTRA_TEXT = ['Download CV', 'Contact me', 'Filter projects'];

  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function injectCss() {
    if (q('#sq-pages-css')) return;
    var st = document.createElement('style');
    st.id = 'sq-pages-css';
    st.textContent = [
      '.sq-hidden-page{display:none!important}',
      '#sq-page-nav{display:flex;justify-content:center;gap:14px;padding:34px 18px 30px;flex-wrap:wrap}',
      '#sq-page-nav a{display:inline-flex;align-items:center;gap:10px;padding:15px 30px;border-radius:999px;',
      'text-decoration:none;font-weight:700;font-size:15px;letter-spacing:.03em;',
      'background:linear-gradient(135deg,#e97b9c,#d9a94e);color:#fff;',
      'box-shadow:0 10px 30px rgba(233,123,156,.32);transition:transform .22s,box-shadow .22s}',
      '#sq-page-nav a:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(233,123,156,.45)}',
      '#sq-page-nav a.sq-ghost{background:transparent;color:inherit;border:1.5px solid rgba(233,123,156,.65);box-shadow:none}',
      '#sq-page-nav a.sq-ghost:hover{border-color:#e97b9c;box-shadow:0 10px 26px rgba(233,123,156,.22)}',
      '#sq-page-intro{max-width:660px;margin:0 auto;padding:40px 22px 8px;text-align:center}',
      '#sq-page-intro h1{font-size:clamp(26px,5vw,42px);margin:0 0 12px;letter-spacing:.01em}',
      '#sq-page-intro p{opacity:.75;line-height:1.7;margin:0;font-size:15px}',
      '.theme-light #sq-page-nav a.sq-ghost,body.light-mode #sq-page-nav a.sq-ghost{color:#241419}'
    ].join('');
    document.head.appendChild(st);
  }

  /* Hide the sections that belong to the other page.
     enhancements.js re-inserts sections via appendChild, which would drop a
     class-based hide — so we also set an inline style with priority. */
  function hideSections() {
    var ids = PAGE === 'home' ? MORE_IDS : HOME_IDS;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      /* On the more page the plain #music section is the SOURCE the rich
         #sq-music player is built from. Leave it alone until that player
         exists, then hide the plain copy so only one player shows. */
      if (id === 'music' && PAGE === 'more') {
        if (!document.getElementById('sq-music')) return;
      }
      el.classList.add('sq-hidden-page');
      try { el.style.setProperty('display', 'none', 'important'); } catch (e) {}
    });

    /* On the more page, also hide home-only blocks that have no stable id. */
    if (PAGE === 'more') {
      qa('.section').forEach(function (sec) {
        if (sec.classList.contains('sq-hidden-page')) return;
        var label = (q('.mono-label', sec) || {}).textContent || '';
        var head = (q('h1,h2,h3', sec) || {}).textContent || '';
        var text = label + ' ' + head;
        if (/download cv|contact me|filter projects/i.test(text)) {
          sec.classList.add('sq-hidden-page');
        }
      });
      /* The projects/GitHub block is not always inside a .section */
      qa('h1,h2,h3').forEach(function (h) {
        if (!/projects|github/i.test(h.textContent || '')) return;
        var host = h.closest('section') || h.parentElement;
        if (host) host.classList.add('sq-hidden-page');
      });
    }
  }

  function buildIntro() {
    if (PAGE !== 'more' || q('#sq-page-intro')) return;
    var box = document.createElement('div');
    box.id = 'sq-page-intro';
    box.innerHTML = '<h1>More from Saqib</h1><p>Poetry, shers, guestbook, quiz and the interactive corner of the portfolio.</p>';
    var app = document.getElementById('app');
    if (app) app.insertBefore(box, app.firstChild);
  }

  function buildNav() {
    var wrap = q('#sq-page-nav');
    if (wrap) { placeNav(wrap); return; }
    wrap = document.createElement('nav');
    wrap.id = 'sq-page-nav';
    var a = document.createElement('a');
    if (PAGE === 'home') {
      a.href = '/more';
      a.innerHTML = '<span>Explore More</span><span aria-hidden="true">\u2192</span>';
    } else {
      a.href = '/';
      a.className = 'sq-ghost';
      a.innerHTML = '<span aria-hidden="true">\u2190</span><span>Back to home</span>';
    }
    wrap.appendChild(a);
    placeNav(wrap);
  }

  /* Both pages keep the pill at the bottom. On home it slots in just above the
     footer block, so the tail of the page reads: contact form ->
     welcome/logout -> Explore More -> copyright. Re-run until the anchor exists. */
  function placeNav(wrap) {
    var app = document.getElementById('app');
    if (PAGE === 'home') {
      /* Target the copyright line specifically. Falling back to .logout-row
         would park the pill ABOVE the welcome/logout row, which is not what
         we want; better to wait a tick until .footer-note exists. */
      var anchor = q('#contact .footer-note');
      if (anchor && anchor.parentNode) {
        if (wrap.nextSibling !== anchor) anchor.parentNode.insertBefore(wrap, anchor);
      } else if (app) {
        app.appendChild(wrap);
      } else {
        document.body.appendChild(wrap);
      }
    } else if (app) {
      if (wrap.parentNode !== app) app.appendChild(wrap);
    } else {
      document.body.appendChild(wrap);
    }
  }

  function run() {
    injectCss();
    hideSections();
    buildIntro();
    buildNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 0); });
  } else {
    setTimeout(run, 0);
  }

  /* The app and enhancements.js inject sections over time — keep re-applying. */
  setInterval(function () {
    try { hideSections(); } catch (e) {}
    try { var n = q('#sq-page-nav'); if (n) placeNav(n); } catch (e) {}
  }, 1000);
})();
