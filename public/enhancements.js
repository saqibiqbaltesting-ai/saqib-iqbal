/* Saqib portfolio — enhancements v1
   Self-contained, defensive: every feature is wrapped so a failure here can
   never break the main site. Safe to remove the <script> tag at any time. */
(function () {
  'use strict';
  if (window.__sqEnh) return;
  window.__sqEnh = true;

  var OWNER = 'fizanali6267@gmail.com';
  var REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function token() { return lsGet('portfolio-auth-token') || ''; }
  function me() {
    try {
      var t = token().split('.')[0];
      if (!t) return null;
      return JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g, '+').replace(/_/g, '/')))));
    } catch (e) { return null; }
  }
  function isOwner() { var m = me(); return !!(m && String(m.email).toLowerCase() === OWNER); }

  /* ============ 1. Toast notifications ============ */
  var toastBox = null;
  function ensureToasts() {
    if (toastBox && document.contains(toastBox)) return toastBox;
    toastBox = document.createElement('div');
    toastBox.id = 'sq-toasts';
    document.body.appendChild(toastBox);
    return toastBox;
  }
  window.sqToast = function (msg, type, ms) {
    try {
      var box = ensureToasts();
      var t = document.createElement('div');
      t.className = 'sq-toast' + (type === 'err' ? ' sq-err' : type === 'ok' ? ' sq-ok' : '');
      t.setAttribute('role', 'status');
      t.textContent = msg;
      box.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('sq-show'); });
      setTimeout(function () {
        t.classList.remove('sq-show');
        setTimeout(function () { t.remove(); }, 300);
      }, ms || 3200);
    } catch (e) {}
  };

  /* ============ 2. Loading splash ============ */
  try {
    if (!lsGet('sq-seen-splash')) {
      var sp = document.createElement('div');
      sp.id = 'sq-splash';
      sp.innerHTML = '<div class="sq-splash-name">Saqib Iqbal</div><div class="sq-splash-bar"><i></i></div>';
      document.body.appendChild(sp);
      lsSet('sq-seen-splash', '1');
      setTimeout(function () { try { sp.remove(); } catch (e) {} }, 1600);
      window.addEventListener('load', function () { setTimeout(function () { try { sp.remove(); } catch (e) {} }, 1100); });
    }
  } catch (e) {}

  /* ============ 3. Scroll progress bar ============ */
  try {
    var bar = document.createElement('div');
    bar.id = 'sq-progress';
    document.body.appendChild(bar);
    var progTick = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      var top = q('#sq-top-btn');
      if (top) top.classList.toggle('sq-on', h.scrollTop > 600);
    };
    window.addEventListener('scroll', progTick, { passive: true });
    progTick();
  } catch (e) {}

  /* ============ 4. Back to top ============ */
  try {
    var topBtn = document.createElement('button');
    topBtn.id = 'sq-top-btn';
    topBtn.type = 'button';
    topBtn.title = 'Upar jayen';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.innerHTML = '&#8593;';
    topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); });
    document.body.appendChild(topBtn);
  } catch (e) {}

  /* ============ 5. Ctrl+K opens search ============ */
  try {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        var fab = q('#sq-fab');
        if (fab) fab.click();
      }
    });
  } catch (e) {}

  /* ============ 6. Cookie pill ============ */
  try {
    if (!lsGet('sq-cookie-ok')) {
      var ck = document.createElement('div');
      ck.id = 'sq-cookie';
      ck.innerHTML = '<span>&#127871; Ye website aap ka behtar tajurba dene ke liye chhoti cookies use karti hai.</span>';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.textContent = 'Theek hai';
      ok.addEventListener('click', function () { lsSet('sq-cookie-ok', '1'); ck.remove(); });
      ck.appendChild(ok);
      document.body.appendChild(ck);
      setTimeout(function () { try { if (document.contains(ck) && !lsGet('sq-cookie-ok')) return; } catch (e) {} }, 20000);
      setTimeout(function () { try { ck.remove(); } catch (e) {} }, 30000);
    }
  } catch (e) {}

  /* ============ 7. Animated background + switch ============ */
  try {
    var bg = document.createElement('div');
    bg.id = 'sq-anim-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = '<i></i><i></i><i></i>';
    function applyBg() { bg.classList.toggle('sq-off', lsGet('sq-anim-bg') === '0' || REDUCED); }
    applyBg();
    document.body.insertBefore(bg, document.body.firstChild);
    var tg = document.createElement('button');
    tg.id = 'sq-anim-toggle';
    tg.type = 'button';
    tg.title = 'Animated background on / off';
    tg.setAttribute('aria-label', 'Animated background switch');
    tg.innerHTML = '&#10024;';
    tg.addEventListener('click', function () {
      var off = lsGet('sq-anim-bg') === '0';
      lsSet('sq-anim-bg', off ? '1' : '0');
      applyBg();
      window.sqToast(off ? 'Animated background ON' : 'Animated background OFF');
    });
    document.body.appendChild(tg);
  } catch (e) {}

  /* ============ 8. Scroll reveal + counters ============ */
  try {
    if (!REDUCED && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('sq-in');
          // animate plain-number stats once
          qa('b, strong', en.target).forEach(function (el) {
            if (el.__sqCounted) return;
            var txt = (el.textContent || '').trim();
            if (!/^\d+$/.test(txt) || +txt < 2 || +txt > 100000) return;
            el.__sqCounted = true;
            var target = +txt, t0 = null;
            function step(ts) {
              if (!t0) t0 = ts;
              var p = Math.min((ts - t0) / 900, 1);
              el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
              if (p < 1) requestAnimationFrame(step);
            }
            el.textContent = '0';
            requestAnimationFrame(step);
          });
          io.unobserve(en.target);
        });
      }, { threshold: 0.08 });
      function scan() {
        var page = q('.page');
        if (!page) return;
        qa('.page > *').forEach(function (el) {
          if (el.__sqRev || el.id === 'sq-splash') return;
          el.__sqRev = true;
          el.classList.add('sq-reveal');
          io.observe(el);
        });
      }
      scan();
      var mo = new MutationObserver(function () { setTimeout(scan, 300); });
      try { mo.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
    }
  } catch (e) {}

  /* ============ 9. Contact form: subject + spam protection + toasts ============ */
  try {
    // fetch wrapper: inject subject + honeypot into contact POSTs, toast the result
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (url.indexOf('/v1/x/contact') !== -1 && init && init.method === 'POST' && typeof init.body === 'string' && init.body.indexOf('"action"') === -1) {
          var b = JSON.parse(init.body);
          var form = q('#sq-contact-form');
          if (form) {
            var sub = q('.sq-cf-subject', form);
            var hp = q('.sq-hp', form);
            if (sub) b.subject = sub.value.slice(0, 120);
            if (hp) b.website = hp.value;
            init = Object.assign({}, init, { body: JSON.stringify(b) });
          }
          return _fetch.call(window, input, init).then(function (res) {
            res.clone().json().then(function (j) {
              if (j && j.ok) window.sqToast('✅ Message mil gaya, shukriya!', 'ok');
              else if (j && j.error === 'bad_email') window.sqToast('⚠️ Sahih email likhen', 'err');
              else if (j && j.error === 'slow_down') window.sqToast('⚠️ Bohat jaldi jaldi bhej rahe hain, thodi der baad koshish karen', 'err');
              else window.sqToast('⚠️ Message nahi pohncha, dobara koshish karen', 'err');
            }).catch(function () {});
            return res;
          }, function (err) {
            window.sqToast('⚠️ Internet masla — message nahi gaya', 'err');
            throw err;
          });
        }
      } catch (e) {}
      return _fetch.apply(window, arguments);
    };

    var cfTries = 0;
    var cfTimer = setInterval(function () {
      try {
        var form = q('#sq-contact-form');
        cfTries++;
        if (!form) { if (cfTries > 60) clearInterval(cfTimer); return; }
        clearInterval(cfTimer);
        if (q('.sq-cf-subject', form)) return;

        var ta = q('textarea', form);
        var subject = document.createElement('input');
        subject.className = 'sq-cf-subject';
        subject.type = 'text';
        subject.maxLength = 120;
        subject.placeholder = 'Subject (kis ke baare mein hai?)';
        subject.style.cssText = 'width:100%;box-sizing:border-box;padding:11px 13px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:inherit;font-size:14px;font-family:inherit;margin:0 0 10px';
        if (ta && ta.parentNode) ta.parentNode.insertBefore(subject, ta);

        var hp = document.createElement('input');
        hp.className = 'sq-hp';
        hp.type = 'text';
        hp.name = 'website';
        hp.tabIndex = -1;
        hp.autocomplete = 'off';
        hp.setAttribute('aria-hidden', 'true');
        form.appendChild(hp);

        // validation before the legacy send handler runs
        form.addEventListener('click', function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('button') : null;
          if (!btn || !/send/i.test(btn.textContent || '')) return;
          var email = (q('input[placeholder*="mail"]', form) || {}).value || '';
          if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
            e.preventDefault(); e.stopPropagation();
            window.sqToast('⚠️ Sahih email likhen (ya khali chhod dein)', 'err');
            return;
          }
          var msg = (ta || {}).value || '';
          if (!msg.trim()) {
            e.preventDefault(); e.stopPropagation();
            window.sqToast('⚠️ Pehle message likhen', 'err');
          }
        }, true);
      } catch (e) { clearInterval(cfTimer); }
    }, 400);
  } catch (e) {}

  /* ============ 10. User Dashboard ============ */
  try {
    var btn = document.createElement('button');
    btn.id = 'sq-dash-btn';
    btn.type = 'button';
    btn.title = 'Dashboard';
    btn.setAttribute('aria-label', 'User dashboard');
    btn.innerHTML = '&#128100;';
    btn.addEventListener('click', openDash);
    document.body.appendChild(btn);
    setInterval(function () { btn.style.display = token() ? 'flex' : 'none'; }, 900);

    function openDash() {
      var old = q('#sq-dash-ov');
      if (old) { old.remove(); return; }
      var m = me() || {};
      var ov = document.createElement('div');
      ov.id = 'sq-dash-ov';
      var card = document.createElement('div');
      card.id = 'sq-dash-card';
      ov.appendChild(card);
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });

      var tabs = { profile: '👤 Profile', settings: '⚙️ Settings', alerts: '🔔 Alerts' };
      function render(tab) {
        card.innerHTML = '';
        var h = document.createElement('h3'); h.textContent = 'Dashboard'; card.appendChild(h);
        var s = document.createElement('p'); s.className = 'sq-dash-sub'; s.textContent = 'Salam, ' + (m.name || 'Dost') + '!'; card.appendChild(s);
        var tb = document.createElement('div'); tb.className = 'sq-dash-tabs';
        Object.keys(tabs).forEach(function (k) {
          var b = document.createElement('button');
          b.type = 'button'; b.textContent = tabs[k];
          if (k === tab) b.className = 'sq-cur';
          b.addEventListener('click', function () { render(k); });
          tb.appendChild(b);
        });
        card.appendChild(tb);
        var pane = document.createElement('div'); pane.className = 'sq-dash-pane';

        if (tab === 'profile') {
          pane.innerHTML =
            '<div class="sq-dash-row"><b>Naam</b><span>' + escapeHtml(m.name || '—') + '</span></div>' +
            '<div class="sq-dash-row"><b>Email</b><span>' + escapeHtml(m.email || '—') + '</span></div>' +
            '<div class="sq-dash-row"><b>Account</b><span>' + (isOwner() ? '👑 Owner (Admin)' : 'Visitor') + '</span></div>' +
            '<div class="sq-dash-row"><b>Gallery</b><span>Password se locked hai — card par click karen</span></div>' +
            '<button class="sq-dash-btn sq-ghost" type="button" id="sq-dash-logout">Logout</button>' +
            '<p class="sq-dash-note">Profile details, notes, favorites aur projects Growth Hub (profile card) mein hain.</p>';
          q('#sq-dash-logout', pane).addEventListener('click', function () {
            try { localStorage.removeItem('portfolio-auth-token'); } catch (e) {}
            window.sqToast('Logout ho gaya', 'ok');
            setTimeout(function () { location.reload(); }, 600);
          });
        } else if (tab === 'settings') {
          var accent = (window.__sqSettings && window.__sqSettings.accent) || '#f0c96a';
          pane.innerHTML =
            '<label>Accent color</label><input type="color" id="sq-set-accent" value="' + escapeHtml(accent) + '">' +
            '<label>Animated background</label>' +
            '<button class="sq-dash-btn sq-ghost" type="button" id="sq-set-bg">' + (lsGet('sq-anim-bg') === '0' ? 'ON karen' : 'OFF karen') + '</button>' +
            '<button class="sq-dash-btn" type="button" id="sq-set-save">Save settings</button>' +
            '<p class="sq-dash-note">Theme (dark/light) upar wale toggle se badalti hai. Accent color sirf owner ke liye website par save hota hai.</p>';
          q('#sq-set-bg', pane).addEventListener('click', function () {
            var t = q('#sq-anim-toggle'); if (t) t.click();
            this.textContent = lsGet('sq-anim-bg') === '0' ? 'ON karen' : 'OFF karen';
          });
          q('#sq-set-save', pane).addEventListener('click', function () {
            var c = q('#sq-set-accent', pane).value;
            document.documentElement.style.setProperty('--sq-accent', c);
            lsSet('sq-accent-local', c);
            var b = this;
            b.textContent = 'Saving…';
            fetch('/v1/x/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token(), action: 'save-settings', accent: c }) })
              .then(function (r) { return r.json(); })
              .then(function (j) { window.sqToast(j && j.ok ? '✅ Settings save ho gayin' : 'Sirf owner ke liye save hota hai', j && j.ok ? 'ok' : 'err'); b.textContent = 'Save settings'; })
              .catch(function () { window.sqToast('Save nahi hua', 'err'); b.textContent = 'Save settings'; });
          });
        } else {
          pane.innerHTML =
            '<div class="sq-dash-alert">🎉 Naye features: search (Ctrl+K), dashboard, contact form aur animated background ab live hain.</div>' +
            '<div class="sq-dash-alert">📸 Gallery dekhne ke liye kisi gallery card par click karen — password lagta hai.</div>' +
            '<div class="sq-dash-alert">🤖 Saqib AI chat bottom-right bubble mein hai.</div>';
        }
        card.appendChild(pane);
      }
      render('profile');
    }

    function escapeHtml(x) {
      return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
  } catch (e) {}

  /* ============ 11. Owner settings apply (hero text + accent) ============ */
  try {
    var applyAccent = function (c) {
      if (c && /^#[0-9a-fA-F]{3,8}$/.test(c)) document.documentElement.style.setProperty('--sq-accent', c);
    };
    var local = lsGet('sq-accent-local');
    if (local) applyAccent(local);
    fetch('/v1/x/admin').then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok || !j.settings) return;
      window.__sqSettings = j.settings;
      applyAccent(j.settings.accent);
      var sub = String(j.settings.heroSub || '');
      if (sub) {
        var applySub = function () { qa('.hero-sub').forEach(function (el) { if (el.textContent !== sub) el.textContent = sub; }); };
        applySub();
        setInterval(applySub, 3000);
      }
    }).catch(function () {});
  } catch (e) {}

  /* ============ 12. PWA service worker (network-only, no caching) ============ */
  try {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    }
  } catch (e) {}

  /* ============ 13. Skip link (accessibility) ============ */
  try {
    var skip = document.createElement('a');
    skip.className = 'sq-skip';
    skip.href = '#main';
    skip.textContent = 'Content par jayen';
    document.body.insertBefore(skip, document.body.firstChild);
  } catch (e) {}

  /* ============ 14. Hero name = home link ============ */
  try {
    var navTries = 0;
    var navTimer = setInterval(function () {
      try {
        var name = q('.hero-name');
        navTries++;
        if (!name) { if (navTries > 40) clearInterval(navTimer); return; }
        clearInterval(navTimer);
        name.style.cursor = 'pointer';
        name.title = 'Home';
        var clicks = 0, pend = null;
        name.addEventListener('click', function (e) {
          e.preventDefault();
          clicks++;
          // single click -> home; 5 rapid clicks still trigger the secret easter egg
          if (pend) clearTimeout(pend);
          pend = setTimeout(function () {
            if (clicks === 1 && location.pathname !== '/') location.href = '/';
            else if (clicks === 1) window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
            clicks = 0;
          }, 420);
        });
      } catch (e) { clearInterval(navTimer); }
    }, 500);
  } catch (e) {}
})();
