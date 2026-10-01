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
      ck.innerHTML = '<span>&#127871; Ye website chhoti cookies use karti hai.</span>';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.textContent = 'Theek hai';
      ok.addEventListener('click', function () { lsSet('sq-cookie-ok', '1'); ck.remove(); });
      ck.appendChild(ok);
      document.body.appendChild(ck);
      setTimeout(function () { try { if (document.contains(ck) && !lsGet('sq-cookie-ok')) return; } catch (e) {} }, 20000);
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

      var tabs = { profile: '👤 Profile', history: '🕓 History', settings: '⚙️ Settings', alerts: '🔔 Alerts' };
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
          var pic = null; try { pic = JSON.parse(lsGet('sq-avatar') || 'null'); } catch (e) {}
          pane.innerHTML =
            '<div style="text-align:center;margin-bottom:10px">' +
            (pic ? '<img src="' + escapeHtml(pic) + '" alt="Profile" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid var(--sq-accent)">' : '<div style="width:72px;height:72px;border-radius:50%;background:var(--sq-accent);color:#1a0f26;display:inline-flex;align-items:center;justify-content:center;font-size:30px;font-weight:700">' + escapeHtml((m.name || 'S')[0]) + '</div>') +
            '</div>' +
            '<div class="sq-dash-row"><b>Naam</b><span>' + escapeHtml(m.name || '—') + '</span></div>' +
            '<div class="sq-dash-row"><b>Email</b><span>' + escapeHtml(m.email || '—') + '</span></div>' +
            '<div class="sq-dash-row"><b>Account</b><span>' + (isOwner() ? '👑 Owner (Admin)' : 'Visitor') + '</span></div>' +
            '<div class="sq-dash-row"><b>Gallery</b><span>Password se locked hai — card par click karen</span></div>' +
            '<button class="sq-dash-btn sq-ghost" type="button" id="sq-dash-vcard">💼 Digital Business Card download</button>' +
            '<button class="sq-dash-btn sq-ghost" type="button" id="sq-dash-logout">Logout</button>' +
            '<p class="sq-dash-note">Profile details, notes, favorites aur projects Growth Hub (profile card) mein hain.</p>';
          q('#sq-dash-logout', pane).addEventListener('click', function () {
            try { localStorage.removeItem('portfolio-auth-token'); } catch (e) {}
            window.sqToast('Logout ho gaya', 'ok');
            setTimeout(function () { location.reload(); }, 600);
          });
          q('#sq-dash-vcard', pane).addEventListener('click', function () {
            try {
              var vcf = 'BEGIN:VCARD\nVERSION:3.0\nFN:Saqib Iqbal\nORG:Student — Superior Group of Colleges, Layyah\nEMAIL:fizanali6267@gmail.com\nTEL:+923134182952\nURL:https://saqib-iqbal.vercel.app\nNOTE:Top student from Layyah, Pakistan\nEND:VCARD';
              var a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
              a.download = 'saqib-iqbal.vcf';
              a.click();
              window.sqToast('Business card download ho gaya', 'ok');
            } catch (err) { window.sqToast('Download nahi hua', 'err'); }
          });
        } else if (tab === 'history') {
          pane.innerHTML = '<p class="sq-dash-note" style="margin:0 0 6px">Load ho raha hai…</p>';
          fetch('/v1/x/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'account-info', token: token() }) })
            .then(function (r) { return r.json(); })
            .then(function (j) {
              var rows = '';
              var ll = (j && j.ok && j.lastLogins) || [];
              if (!ll.length) rows += '<div class="sq-dash-alert">Koi login history nahi — agli login par yahan dikhega (device + time).</div>';
              ll.forEach(function (l) {
                var d = new Date(l.ts);
                var ua = String(l.ua || '');
                var dev = /mobile/i.test(ua) ? '📱 Mobile' : /android/i.test(ua) ? '📱 Android' : '💻 Desktop';
                var brw = /chrome|crios/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : /edg/i.test(ua) ? 'Edge' : 'Browser';
                rows += '<div class="sq-dash-alert">' + dev + ' · ' + brw + '<br><span style="opacity:.65">' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString() + (l.ip ? ' · IP ' + escapeHtml(l.ip) : '') + '</span></div>';
              });
              var rv = [];
              try { rv = JSON.parse(lsGet('sq-recent') || '[]'); } catch (e) {}
              if (rv.length) {
                rows += '<h4 style="margin:10px 0 6px;color:var(--sq-accent);font-size:13px">Recently viewed</h4>';
                rv.forEach(function (r2) {
                  rows += '<div class="sq-dash-alert" style="cursor:pointer" data-jump="' + escapeHtml(r2.id) + '">' + escapeHtml(r2.label) + '<br><span style="opacity:.65">' + new Date(r2.ts).toLocaleString() + '</span></div>';
                });
              }
              pane.innerHTML = rows;
              qa('[data-jump]', pane).forEach(function (el) {
                el.addEventListener('click', function () { ov.remove(); var t = q('#' + el.getAttribute('data-jump')); if (t) t.scrollIntoView({ behavior: 'smooth' }); });
              });
            })
            .catch(function () { pane.innerHTML = '<div class="sq-dash-alert">History load nahi hui — dobara koshish karen.</div>'; });
        } else if (tab === 'settings') {
          var accent = (window.__sqSettings && window.__sqSettings.accent) || '#f0c96a';
          pane.innerHTML =
            '<label>Accent color</label><input type="color" id="sq-set-accent" value="' + escapeHtml(accent) + '">' +
            '<label>Profile picture (website photos)</label>' +
            '<div id="sq-avatars" style="display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px"></div>' +
            '<label>Animated background</label>' +
            '<button class="sq-dash-btn sq-ghost" type="button" id="sq-set-bg">' + (lsGet('sq-anim-bg') === '0' ? 'ON karen' : 'OFF karen') + '</button>' +
            '<button class="sq-dash-btn sq-ghost" type="button" id="sq-set-cursor">Custom cursor: ' + (lsGet('sq-cursor') === '1' ? 'OFF' : 'ON') + '</button>' +
            '<button class="sq-dash-btn sq-ghost" type="button" id="sq-set-a11y">Accessibility mode: ' + (lsGet('sq-a11y') === '1' ? 'OFF' : 'ON') + '</button>' +
            '<button class="sq-dash-btn" type="button" id="sq-set-save">Save settings</button>' +
            (isOwner() ? '<button class="sq-dash-btn sq-ghost" type="button" id="sq-set-maint">Maintenance mode: ' + ((window.__sqSettings && window.__sqSettings.maintenance) ? 'ON' : 'OFF') + '</button>' : '') +
            '<button class="sq-dash-btn sq-ghost" type="button" id="sq-set-del" style="color:#ff6b81;border-color:#ff6b8155">Delete account</button>' +
            '<p class="sq-dash-note">Theme (dark/light) upar wale toggle se badalti hai. Accent color sirf owner ke liye website par save hota hai.</p>';
          // avatar picker
          try {
            var av = q('#sq-avatars', pane);
            var pics = ['1000943911', '1000943912', '1000943913', '1000943914', '1000943915', '1000943944', '1000943946', '1000943947', '1000943951', '1000943952', '1000943954', '1000943966', '1000943976', '1000943977'];
            pics.forEach(function (p2) {
              var im = document.createElement('img');
              im.src = '/assets/photos/' + p2 + '.jpg';
              im.alt = 'photo';
              im.loading = 'lazy';
              im.style.cssText = 'width:44px;height:44px;border-radius:50%;object-fit:cover;cursor:pointer;border:2px solid transparent;flex:0 0 auto';
              var cur = null; try { cur = JSON.parse(lsGet('sq-avatar') || 'null'); } catch (e) {}
              if (cur && cur.indexOf(p2) !== -1) im.style.borderColor = 'var(--sq-accent)';
              im.addEventListener('click', function () {
                lsSet('sq-avatar', JSON.stringify(im.src));
                qa('img', av).forEach(function (x) { x.style.borderColor = 'transparent'; });
                im.style.borderColor = 'var(--sq-accent)';
                window.sqToast('Profile picture set ho gayi', 'ok');
              });
              av.appendChild(im);
            });
          } catch (e) {}
          q('#sq-set-bg', pane).addEventListener('click', function () {
            var t = q('#sq-anim-toggle'); if (t) t.click();
            this.textContent = lsGet('sq-anim-bg') === '0' ? 'ON karen' : 'OFF karen';
          });
          q('#sq-set-cursor', pane).addEventListener('click', function () {
            var on = lsGet('sq-cursor') === '1';
            lsSet('sq-cursor', on ? '0' : '1');
            applyCursor();
            this.textContent = 'Custom cursor: ' + (on ? 'ON' : 'OFF');
          });
          q('#sq-set-a11y', pane).addEventListener('click', function () {
            var on = lsGet('sq-a11y') === '1';
            lsSet('sq-a11y', on ? '0' : '1');
            applyA11y();
            this.textContent = 'Accessibility mode: ' + (on ? 'ON' : 'OFF');
          });
          var delBtn = q('#sq-set-del', pane);
          if (delBtn) delBtn.addEventListener('click', function () {
            var pw = window.prompt('Account delete karne ke liye apna password likhen:');
            if (pw === null) return;
            if (!pw) { window.sqToast('Password likha zaroori hai', 'err'); return; }
            fetch('/v1/x/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete-account', email: (me() || {}).email, password: pw }) })
              .then(function (r) { return r.json(); })
              .then(function (j) {
                if (j && j.ok) {
                  try { localStorage.clear(); } catch (e) {}
                  alert('Account delete ho gaya.');
                  location.href = '/';
                } else if (j && j.error === 'owner_protected') window.sqToast('Owner account delete nahi ho sakta', 'err');
                else if (j && j.error === 'bad credentials') window.sqToast('Password ghalat hai', 'err');
                else window.sqToast('Delete nahi hua', 'err');
              })
              .catch(function () { window.sqToast('Internet masla', 'err'); });
          });
          var mBtn = q('#sq-set-maint', pane);
          if (mBtn) mBtn.addEventListener('click', function () {
            var cur = (window.__sqSettings && window.__sqSettings.maintenance) || false;
            var b = this; b.textContent = 'Saving…';
            fetch('/v1/x/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token(), action: 'save-settings', maintenance: !cur }) })
              .then(function (r) { return r.json(); })
              .then(function (j) {
                if (j && j.ok) { window.__sqSettings = j.settings || window.__sqSettings; window.__sqSettings.maintenance = !cur; applyMaintenance(); window.sqToast(!cur ? 'Maintenance mode ON' : 'Maintenance mode OFF', 'ok'); }
                else window.sqToast('Save nahi hua', 'err');
                b.textContent = 'Maintenance mode: ' + (!cur ? 'ON' : 'OFF');
              })
              .catch(function () { window.sqToast('Save nahi hua', 'err'); b.textContent = 'Maintenance mode'; });
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

/* ============ Feature Batch 2 — sections & extras ============ */
(function () {
  'use strict';
  if (window.__sqEnh2) return;
  window.__sqEnh2 = true;

  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var GH_USER = 'saqibiqbaltesting-ai';

  /* ---- toggles / engines used by the dashboard ---- */
  window.applyCursor = function () {
    var on = lsGet('sq-cursor') === '1';
    document.documentElement.classList.toggle('sq-cursor-on', on && window.matchMedia('(pointer:fine)').matches);
  };
  window.applyA11y = function () {
    document.documentElement.classList.toggle('sq-a11y', lsGet('sq-a11y') === '1');
  };
  window.applyMaintenance = function () {
    var old = q('#sq-maint-bar'); if (old) old.remove();
    if (window.__sqSettings && window.__sqSettings.maintenance) {
      var b = document.createElement('div');
      b.id = 'sq-maint-bar';
      b.setAttribute('role', 'status');
      b.textContent = '🔧 Maintenance mode ON — visitors ke liye notice dikhta hai (site chalti rahegi).';
      document.body.appendChild(b);
    }
  };
  try { window.applyCursor(); window.applyA11y(); } catch (e) {}

  /* ---- section builder ---- */
  function buildSection(id, emoji, title, sub) {
    var s = document.createElement('section');
    s.className = 'section sq-sec';
    s.id = id;
    var h = document.createElement('div');
    h.className = 'section-header';
    var h2 = document.createElement('h2');
    h2.textContent = emoji + '  ' + title;
    h.appendChild(h2);
    if (sub) { var p = document.createElement('p'); p.className = 'sq-sec-sub'; p.textContent = sub; h.appendChild(p); }
    s.appendChild(h);
    return s;
  }
  function card(inner, cls) {
    var d = document.createElement('div');
    d.className = 'sq-card' + (cls ? ' ' + cls : '');
    d.innerHTML = inner;
    return d;
  }

  /* ---- content data ---- */
  var FUN = [
    '💻 Ye website maine khud banai — design bhi mera, code bhi mera, bugs bhi mere 😎',
    '🥇 9th class mein 483/545 marks (88.62%) — 1st position ke saath!',
    '🏆 1st position ki aadat Old The Cambridge Kids Campus Layyah se shuru hui',
    '🌙 Night owl hoon — raat ko sab se achi coding hoti hai',
    '🎵 Naat sun kar focus karna meri secret power hai',
    '📍 Layyah se hoon — chhota shehar, bare sapne',
    '🤖 Neeche AI chatbot sach mein baat karta hai — Gemini AI se chalta hai, jaadu nahi 😄',
    '✍️ English practice kar raha hoon — galtiyan bhi hoti hain, magar seekh raha hoon',
  ];
  var WORKING = [
    '📚 ICS part 1 — studies par full focus',
    '🌐 Web development seekh rahe hain (HTML, CSS, JavaScript)',
    '🤖 AI tools explore kar rahe hain — ye site Gemini AI chat se chalti hai',
    '✍️ English communication improve kar rahe hain',
  ];
  var STACK = [
    ['HTML', '#e34f26'], ['CSS', '#2965f1'], ['JavaScript', '#f0db4f'], ['React', '#61dafb'],
    ['Node.js', '#68a063'], ['Vercel', '#fff'], ['Git & GitHub', '#f34f29'], ['Gemini AI', '#8e6cf0'],
  ];
  var SKILLS = [
    ['Web Development', 75], ['Problem Solving', 85], ['Computer Basics', 90],
    ['Communication', 70], ['English', 65], ['Time Management', 80],
  ];
  var SECTION_NAMES = { 'sq-funfacts': '🎯 Fun Facts', 'sq-working': '🛠️ Currently Working On', 'sq-stack': '🧱 Tech Stack', 'sq-skills': '⚡ Interactive Skills', 'sq-projects': '🚀 Projects', 'sq-github': '🐙 GitHub Activity', 'sq-status': '📍 Live Status' };

  /* ---- inject sections after the hero ---- */
  var injectTries = 0;
  var injectTimer = setInterval(function () {
    try {
      var hero = q('.hero');
      injectTries++;
      if (!hero) { if (injectTries > 40) clearInterval(injectTimer); return; }
      clearInterval(injectTimer);
      if (q('#sq-funfacts')) return;
      var frag = document.createDocumentFragment();

      // Fun Facts
      var s1 = buildSection('sq-funfacts', '🎯', 'Fun Facts', 'Chhoti chhoti mazedaar baatein');
      var g1 = document.createElement('div'); g1.className = 'sq-grid';
      FUN.forEach(function (f) { g1.appendChild(card('<span class="sq-fact">' + f + '</span>')); });
      s1.appendChild(g1); frag.appendChild(s1);

      // Currently Working On
      var s2 = buildSection('sq-working', '🛠️', 'Currently Working On', 'Is waqt jis par kaam chal raha hai');
      var g2 = document.createElement('div'); g2.className = 'sq-grid';
      WORKING.forEach(function (f) { g2.appendChild(card('<span class="sq-fact">' + f + '</span>')); });
      s2.appendChild(g2); frag.appendChild(s2);

      // Tech Stack
      var s3 = buildSection('sq-stack', '🧱', 'Tech Stack', 'Ye website in technologies par bani hai');
      var g3 = document.createElement('div'); g3.className = 'sq-grid';
      STACK.forEach(function (t) {
        g3.appendChild(card('<b class="sq-stack-item" style="color:' + (t[1] === '#fff' ? 'var(--sq-accent)' : t[1]) + '">' + t[0] + '</b>', 'sq-center'));
      });
      s3.appendChild(g3); frag.appendChild(s3);

      // Interactive Skills (animated bars)
      var s4 = buildSection('sq-skills', '⚡', 'Interactive Skills', 'Skills with levels');
      var g4 = document.createElement('div'); g4.className = 'sq-skills';
      SKILLS.forEach(function (sk) {
        var row = document.createElement('div');
        row.className = 'sq-skill';
        row.innerHTML = '<div class="sq-skill-top"><span>' + sk[0] + '</span><b>0%</b></div><div class="sq-skill-bar"><i style="width:0" data-w="' + sk[1] + '"></i></div>';
        g4.appendChild(row);
      });
      s4.appendChild(g4); frag.appendChild(s4);

      // Projects (GitHub repos with filter/sort/compare)
      var s5 = buildSection('sq-projects', '🚀', 'Projects', 'Live GitHub repositories — filter, sort aur compare karen');
      s5.appendChild(card(
        '<div class="sq-pj-tools">' +
        '<input type="text" id="sq-pj-q" placeholder="Project dhonden…" aria-label="Filter projects">' +
        '<select id="sq-pj-sort" aria-label="Sort projects"><option value="updated">Recently updated</option><option value="stars">Stars</option><option value="name">Naam (A-Z)</option></select>' +
        '<button type="button" id="sq-pj-cmp-btn" disabled>⚖️ Compare (0/2)</button>' +
        '</div><div id="sq-pj-list"><p class="sq-dash-note">Repos load ho rahi hain…</p></div>'
      ));
      frag.appendChild(s5);

      // GitHub Activity
      var s6 = buildSection('sq-github', '🐙', 'GitHub Activity', 'Contribution graph aur profile');
      s6.appendChild(card(
        '<img id="sq-gh-chart" alt="GitHub contribution graph" src="https://ghchart.rshah.org/' + GH_USER + '" loading="lazy" style="width:100%;border-radius:8px;background:#111">' +
        '<a class="sq-gh-link" href="https://github.com/' + GH_USER + '" target="_blank" rel="noopener">GitHub profile dekhen ↗</a>'
      ));
      frag.appendChild(s6);

      // Live Status + business card
      var s7 = buildSection('sq-status', '📍', 'Live Status', 'Current status aur timezone');
      s7.appendChild(card(
        '<div class="sq-status-row"><span class="sq-dot"></span><b>Online — Layyah, Pakistan</b></div>' +
        '<div class="sq-dash-note">Timezone: Asia/Karachi (PKT) · Live clock neeche corner mein chal raha hai</div>'
      ));
      frag.appendChild(s7);

      hero.parentNode.appendChild(frag);

      /* ---- skills bar animation ---- */
      var skIO = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          skIO.unobserve(en.target);
          qa('.sq-skill', en.target).forEach(function (row, i) {
            var bar = q('.sq-skill-bar i', row), num = q('.sq-skill-top b', row);
            var target = +bar.getAttribute('data-w');
            setTimeout(function () {
              bar.style.width = target + '%';
              var t0 = null;
              function step(ts) {
                if (!t0) t0 = ts;
                var p = Math.min((ts - t0) / 900, 1);
                num.textContent = Math.round(target * p) + '%';
                if (p < 1) requestAnimationFrame(step);
              }
              requestAnimationFrame(step);
            }, i * 120);
          });
        });
      }, { threshold: 0.3 });
      skIO.observe(s4);

      /* ---- projects: fetch + filter + sort + compare ---- */
      var repos = [];
      function renderProjects() {
        var list = q('#sq-pj-list');
        if (!list) return;
        var query = (q('#sq-pj-q') || {}).value || '';
        var sort = (q('#sq-pj-sort') || {}).value || 'updated';
        var arr = repos.filter(function (r) { return r.name.toLowerCase().indexOf(query.toLowerCase()) !== -1; });
        if (sort === 'stars') arr.sort(function (a, b) { return b.stars - a.stars; });
        else if (sort === 'name') arr.sort(function (a, b) { return a.name.localeCompare(b.name); });
        else arr.sort(function (a, b) { return new Date(b.pushed) - new Date(a.pushed); });
        if (!arr.length) { list.innerHTML = '<p class="sq-dash-note">Koi project nahi mila.</p>'; return; }
        list.innerHTML = arr.map(function (r, i) {
          return '<div class="sq-pj"><input type="checkbox" class="sq-pj-check" data-i="' + repos.indexOf(r) + '" aria-label="Compare ' + esc(r.name) + '">' +
            '<div><b>' + esc(r.name) + '</b>' + (r.desc ? '<span>' + esc(r.desc) + '</span>' : '') +
            '<span class="sq-pj-meta">' + (r.lang ? '💻 ' + esc(r.lang) + ' · ' : '') + '⭐ ' + r.stars + ' · ' + new Date(r.pushed).toLocaleDateString() + '</span></div>' +
            '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">View ↗</a></div>';
        }).join('');
        qa('.sq-pj-check', list).forEach(function (c) {
          c.addEventListener('change', updateCmp);
        });
      }
      var cmpSel = [];
      function updateCmp() {
        cmpSel = qa('.sq-pj-check').filter(function (c) { return c.checked; }).map(function (c) { return +c.getAttribute('data-i'); }).slice(0, 2);
        var btn = q('#sq-pj-cmp-btn');
        if (btn) { btn.disabled = cmpSel.length !== 2; btn.textContent = '⚖️ Compare (' + cmpSel.length + '/2)'; }
      }
      var cmpBtn = q('#sq-pj-cmp-btn');
      if (cmpBtn) cmpBtn.addEventListener('click', function () {
        if (cmpSel.length !== 2) return;
        var a = repos[cmpSel[0]], b = repos[cmpSel[1]];
        window.sqToast('Compare: ' + a.name + ' vs ' + b.name);
        var html = '<h3 style="color:var(--sq-accent);margin:0 0 10px">⚖️ Project Comparison</h3>' +
          '<table class="sq-cmp"><tr><th></th><th>' + esc(a.name) + '</th><th>' + esc(b.name) + '</th></tr>' +
          '<tr><td>Language</td><td>' + esc(a.lang || '—') + '</td><td>' + esc(b.lang || '—') + '</td></tr>' +
          '<tr><td>Stars</td><td>' + a.stars + '</td><td>' + b.stars + '</td></tr>' +
          '<tr><td>Created</td><td>' + new Date(a.created).toLocaleDateString() + '</td><td>' + new Date(b.created).toLocaleDateString() + '</td></tr>' +
          '<tr><td>Last push</td><td>' + new Date(a.pushed).toLocaleDateString() + '</td><td>' + new Date(b.pushed).toLocaleDateString() + '</td></tr></table>' +
          '<button class="sq-dash-btn" type="button" onclick="this.closest(\'div\').remove()" style="margin-top:10px">Close</button>';
        var ov = document.createElement('div');
        ov.id = 'sq-dash-ov';
        var c = document.createElement('div'); c.id = 'sq-dash-card'; c.innerHTML = html;
        ov.appendChild(c); document.body.appendChild(ov);
        ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
      });
      ['sq-pj-q', 'sq-pj-sort'].forEach(function (id) {
        var el = q('#' + id);
        if (el) el.addEventListener(id === 'sq-pj-q' ? 'input' : 'change', renderProjects);
      });
      function loadRepos() {
        fetch('https://api.github.com/users/' + GH_USER + '/repos?sort=updated&per_page=30')
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!Array.isArray(j)) throw new Error('bad');
            repos = j.map(function (r) {
              return { name: r.name, desc: r.description || '', lang: r.language || '', stars: r.stargazers_count, url: r.html_url, pushed: r.pushed_at, created: r.created_at };
            });
            renderProjects();
          })
          .catch(function () {
            var l = q('#sq-pj-list');
            if (l) l.innerHTML = '<p class="sq-dash-note">Repos abhi load nahi huin — thodi der baad refresh karen.</p>';
          });
      }
      loadRepos();
      setInterval(function () { if (document.contains(q('#sq-pj-list'))) loadRepos(); }, 300000);

      /* ---- recently viewed tracking ---- */
      var secIO = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id, label = SECTION_NAMES[id];
          if (!label) return;
          var rv = [];
          try { rv = JSON.parse(lsGet('sq-recent') || '[]'); } catch (e) {}
          rv = rv.filter(function (r) { return r.id !== id; });
          rv.unshift({ id: id, label: label, ts: Date.now() });
          lsSet('sq-recent', JSON.stringify(rv.slice(0, 10)));
        });
      }, { threshold: 0.4 });
      SECTION_NAMES.keys ? null : Object.keys(SECTION_NAMES).forEach(function (id) {
        var el = q('#' + id); if (el) secIO.observe(el);
      });
    } catch (e) { clearInterval(injectTimer); }
  }, 500);

  /* ---- typing animation (hero sub) ---- */
  try {
    if (!REDUCED && !lsGet('sq-typed') && !(window.__sqSettings && window.__sqSettings.heroSub)) {
      setTimeout(function () {
        var sub = q('.hero-sub');
        if (!sub) return;
        var txt = sub.textContent || '';
        if (!txt || txt.length > 90) return;
        lsSet('sq-typed', '1');
        var i = 0;
        sub.textContent = '';
        var t = setInterval(function () {
          i++;
          sub.textContent = txt.slice(0, i);
          if (i >= txt.length) clearInterval(t);
        }, 28);
      }, 1200);
    }
  } catch (e) {}

  /* ---- subtle parallax (desktop only) ---- */
  try {
    if (!REDUCED && window.matchMedia('(pointer:fine)').matches) {
      var heroEls = null;
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          if (!heroEls) heroEls = qa('.hero-kicker,.hero-name,.hero-sub');
          var y = window.scrollY || document.documentElement.scrollTop;
          if (y < window.innerHeight) {
            heroEls.forEach(function (el, i) {
              el.style.transform = 'translateY(' + Math.min(y * (0.06 + i * 0.03), 60) + 'px)';
            });
          }
          ticking = false;
        });
      }, { passive: true });
    }
  } catch (e) {}

  /* ---- light particles in the animated bg layer ---- */
  try {
    if (!REDUCED) {
      var cv = document.createElement('canvas');
      cv.id = 'sq-particles';
      var bgLayer = q('#sq-anim-bg');
      if (bgLayer) {
        bgLayer.appendChild(cv);
        var ctx = cv.getContext('2d');
        var P = [];
        function sizeCv() { cv.width = innerWidth; cv.height = innerHeight; }
        sizeCv();
        window.addEventListener('resize', sizeCv);
        for (var i = 0; i < 36; i++) P.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.8 + .6 });
        var running = true;
        document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) requestAnimationFrame(draw); });
        function draw() {
          if (!running || q('#sq-anim-bg').classList.contains('sq-off')) { requestAnimationFrame(draw); return; }
          ctx.clearRect(0, 0, cv.width, cv.height);
          ctx.fillStyle = 'rgba(240,201,106,.5)';
          P.forEach(function (p) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = cv.width; if (p.x > cv.width) p.x = 0;
            if (p.y < 0) p.y = cv.height; if (p.y > cv.height) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
          });
          requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);
      }
    }
  } catch (e) {}

  /* ---- custom cursor (desktop, opt-in) ---- */
  try {
    var dot = document.createElement('div'); dot.id = 'sq-cursor';
    var ring = document.createElement('div'); ring.id = 'sq-cursor-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    var cx = -50, cy = -50, rx = -50, ry = -50;
    window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
    (function loop() {
      rx += (cx - rx) * 0.16; ry += (cy - ry) * 0.16;
      dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();
  } catch (e) {}

  /* ---- keyboard shortcuts modal + Esc closes my overlays ---- */
  try {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var d = q('#sq-dash-ov'); if (d) d.remove();
      }
      var tag = (e.target && e.target.tagName || '').toLowerCase();
      if (e.key === '?' && !/input|textarea|select/.test(tag)) {
        e.preventDefault();
        var old = q('#sq-dash-ov'); if (old) old.remove();
        var ov = document.createElement('div'); ov.id = 'sq-dash-ov';
        ov.innerHTML = '<div id="sq-dash-card"><h3 style="color:var(--sq-accent);margin:0 0 10px">⌨️ Keyboard Shortcuts</h3>' +
          '<div class="sq-dash-alert"><b>Ctrl + K</b> — Search kholen</div>' +
          '<div class="sq-dash-alert"><b>?</b> — Ye shortcuts list</div>' +
          '<div class="sq-dash-alert"><b>Esc</b> — Panel band karen</div>' +
          '<button class="sq-dash-btn" type="button" onclick="this.closest(\'div\').parentNode.remove()">Close</button></div>';
        document.body.appendChild(ov);
        ov.addEventListener('click', function (ev) { if (ev.target === ov) ov.remove(); });
      }
    });
  } catch (e) {}

  /* ---- lazy load images + maintenance banner + schema ---- */
  try {
    setTimeout(function () {
      qa('img').forEach(function (im) { if (!im.hasAttribute('loading')) im.setAttribute('loading', 'lazy'); });
    }, 2500);
    fetch('/v1/x/admin').then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok && j.settings && j.settings.maintenance) {
        window.__sqSettings = j.settings;
        window.applyMaintenance();
      }
    }).catch(function () {});
    var ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Saqib Iqbal",
      "description": "Top student from Layyah, Pakistan — computer studies, web projects and academic achievements.",
      "email": "mailto:fizanali6267@gmail.com",
      "telephone": "+923134182952",
      "address": { "@type": "PostalAddress", "addressLocality": "Layyah", "addressCountry": "PK" },
      "url": "https://saqib-iqbal.vercel.app"
    });
    document.head.appendChild(ld);
  } catch (e) {}
})();

/* ---- 16. pin social-row to body so position:fixed is viewport-relative ---- */
(function socialFix(){
  if (window.__sqSocialFix) return; window.__sqSocialFix = true;
  var tries = 0;
  var t = setInterval(function(){
    try {
      tries++;
      var row = document.querySelector('.social-row');
      if (!row) { if (tries > 60) clearInterval(t); return; }
      clearInterval(t);
      if (row.parentNode !== document.body) document.body.appendChild(row);
    } catch(e) { try { clearInterval(t); } catch(_){} }
  }, 400);
})();

/* ---- 17. keep 09-Contact as the VERY last section (right after Growth Hub) ---- */
(function contactLast(){
  if (window.__sqContactLast) return; window.__sqContactLast = true;
  var t = setInterval(function(){
    try {
      var c = document.getElementById('contact');
      if (!c || !c.parentNode) return;
      var p = c.parentNode;
      var g = document.getElementById('growth-hub');
      if (p.lastElementChild !== c) p.appendChild(c);
      if (g && g !== c && g.nextSibling !== c) p.insertBefore(g, c);
    } catch(e) {}
  }, 800);
})();

/* ---- 18. Welcome/Logout row + footer line move to the very bottom of Contact ---- */
(function contactBits(){
  if (window.__sqContactBits) return; window.__sqContactBits = true;
  var t = setInterval(function(){
    try {
      var c = document.getElementById('contact');
      if (!c) return;
      var w = c.querySelector('.logout-row');
      var f = c.querySelector('.footer-note');
      if (!w && !f) return;
      if (w) c.appendChild(w);
      if (f) c.appendChild(f);
      if (w && f && w.nextElementSibling !== f) c.insertBefore(f, w);
    } catch(e) {}
  }, 800);
})();

/* ---- 19. Poetry section — 6 categories x 30 shers, font changer ---- */
(function poetry(){
  if (window.__sqPoetry) return; window.__sqPoetry = true;
  var q = function (s) { return document.querySelector(s); };

  var CATS = [
    ['love','❤️','محبت',[
      'تیری آنکھوں میں جو جادو ہے | ہر نظر میں نئی داستان لکھی ہے ❤️',
      'دل نے تجھ کو چن لیا ہے | اب کوئی اور سوجھتا ہی نہیں',
      'تیرے نام سے شروع ہوتی ہے | ہر صبح، ہر دعا میری 🌅',
      'عشق وہ آگ ہے جو | جلاتی بھی ہے، روشن بھی کرتی ہے 🔥',
      'تم ہنسو تو لگتا ہے | بہاروں نے گھر کر لیا 🌸',
      'تیری ایک مسکراہٹ کے لیے | میں دنیا سے لڑ جاؤں گا',
      'محبت اپنی کم نہیں | سب سے بڑی دولت ہے',
      'دل کی گہرائیوں میں | تیرا ہی نام لکھا ہے ✍️',
      'تیرے بنا تو زندگی | آدھی سی لگتی ہے',
      'نظر جہاں سے اٹھتی ہے | تیری تصویر وہاں ملتی ہے 🖼️',
      'چاند کو دیکھ کر تجھے یاد آتا ہے | یہ عشق کا اثر ہے 🌙',
      'تیرا ہونا ہی کافی ہے | باقی سب دنیا کی مرضی',
      'محبت وہ نہیں کہ مل جائے | محبت وہ ہے کہ نہ ٹوٹ جائے 💗',
      'تیری باتوں میں وہ بات ہے | جو کہیں اور نہیں ملتی',
      'دل نے تجھ سے ہی پوچھا ہے | یہ پیار کیا ہوتا ہے 💞',
      'تم آ جاؤ تو | کلیاں بھی کھل جائیں 🌷',
      'عشق میں ڈوبنے کا مزا | ڈوب کر ہی پتا چلتا ہے 🌊',
      'تیرے نام کی خاک بھی | میرے لیے زیور ہے',
      'پیار وہ جو نظروں سے | دل تک جاتا ہے 👀',
      'تیری کمی بھلتی ہے | ہر خوشی میں تھوڑی سی',
      'تو جو ملے تو | منزلیں خود چلیں آئیں 🛤️',
      'ایک تم ہو جو سب ہو | ایک یہ دنیا ہے جس میں کچھ نہیں',
      'محبت میں سب کچھ دینا | مگر اپنا ہونا سب سے پیارا ہے 🎁',
      'تیرے ہونے سے ہی | گھر کو گھر کہتے ہیں 🏡',
      'دل کی دنیا بسی ہے | تیرے نام کے نگر میں 🏰',
      'وہ شخص میری دعاؤں میں | سب سے گہری جگہ رکھتا ہے 🤲',
      'عشق بن کر رہ جاتا ہے | جو دل میں اتر جائے 💓',
      'تیرے ساتھ ہر رات | جیسے چاندنی کا شتاب ہو ✨',
      'محبت پڑھتی نہیں | محبت کر دکھائی جاتی ہے 📖',
      'مجھے تم جیسا کوئی | دوسرا نہیں چاہیے تھا کبھی',
    ]],
    ['sad','😢','اداس',[
      'آنسو بھی عجیب ہوتے ہیں | اکثر تنہائی میں نکلتے ہیں 😢',
      'خاموشی بھی بہت کچھ کہتی ہے | سننے والا کوئی ہوتا تو',
      'درد کی حد وہ ہے | جب مسکرانا بھی مجبوری لگے 💔',
      'لوگ بدل نہیں جاتے | نظریہ بدل جاتا ہے',
      'وہ تو چلے گئے | یادیں پیچھے رہ گئیں',
      'دل ٹوٹا ہے ابھی | آواز بھی نہیں آئی',
      'زخم گہرے ہوتے ہیں | جو نظر نہیں آتے',
      'تنہائی کا مزا وہی جانتا ہے | جس نے سب کو جاتے دیکھا ہو 🌙',
      'امید کا دیا نہ بجھنے دو | چاہے ہوا تیز ہو 🪔',
      'مسکرانا سیکھ لیا | مگر دل روتا رہ گیا',
      'جو اپنے ہوئے نہیں | ان کی یاد بھی اپنی نہیں ہوتی',
      'کچھ لوگ جا کر | خالی جگہ چھوڑ جاتے ہیں 🪑',
      'درد بتانے کا کوئی حق نہیں | ہر کسی کو اپنا حال',
      'راتوں کو نیند کہاں | آنکھیں آئیں تو سو جائیں 🌃',
      'غم بھی غریب ہوتا ہے | ساتھ کبھی کسی کا نہیں نبھاتا',
      'دل نے چاہا جو | مقدر نے لکھا کچھ اور تھا ✍️',
      'ٹوٹ کر بھی کھڑا ہوں | یہ عادت اچھی نہیں 🥀',
      'لوگ ملیں بھی تو | وفا ملتی نہیں',
      'اپنے ہی چہرے پر | پردہ پڑ گیا ہے اب',
      'یہ درد بھی ساتھ چلتا ہے | جس کو چھوڑا اس کا نہیں 🚶',
      'بچھڑنے سے پہلے سوچ لیں | رشتوں کی قیمتیں 💸',
      'ہنسانا بھول گیا ہوں | آنسوؤں کے سوا کچھ نہیں',
      'رشتے کتابوں جیسے ہوتے ہیں | پڑھنے والا چاہیے',
      'کچھ لوگ ٹوٹ کر بھی | سب کے کام آتے ہیں',
      'دکھ بانٹنے سے کم ہوتا ہے | پھر بھی کوئی بانٹتا کہاں ہے',
      'شہر بھرا پڑا ہے | پھر بھی تنہا ہوں',
      'یادیں بن گئیں ساتھی | جب سب نے ہاتھ چھوڑا',
      'چہرے مسکرا رہے ہیں | منزلیں اجنبی ہیں',
      'وقت سب کا دکھاتا ہے | اپنا وقت کہاں 🕰️',
      'اداس شام سکھاتی ہے | صبر کی زبان 🌥️',
    ]],
    ['romantic','💕','رومانوی',[
      'تیری سانسوں میں میری | دھڑکن کی آواز ہے',
      'تیرے قریب آ کر | میں نے سکون پایا ہے',
      'چاند تیری اور | میں تیری رات 💫',
      'تیرے نام سے شروع | ہر خیال میرا',
      'تیری ہنسی میں بسا ہے | میرا دل',
      'پیار تیرا مجھ پر | موسموں جیسا ہے',
      'تیرے ساتھ گزری شام | راتوں سے پیاری ہے 🌆',
      'تیری خوشبو سے | ماحول بھی جھومتا ہے',
      'تیرے ساتھ ہر موسم | سب سے پیارا لگتا ہے',
      'تیری نظروں میں اتر جاؤں | بس یہی ارادہ ہے',
      'پیار دو حروف نہیں | پوری زندگی ہے',
      'تیرے لیے ہر دعا | میری فریاد بھی ہے',
      'تیرے بغیر ادھوری | ہر کہانی میری',
      'ہاتھ تیرا تھام لوں | راستے خود چل پڑیں',
      'تیرے مزاج کی خبر | مجھے بھی ہے',
      'تم سوچو تو میں | پوری رات جاگتا ہوں',
      'تیری ہر ادا پر | مجھے ناز ہوتا ہے',
      'پیار کا مزہ | چھپا کر جانے میں ہے',
      'تیرے ایک اشارے پر | سب کچھ چھوڑ دوں گا',
      'تم میری دعا ہو | جو کبھی ادھوری نہیں',
      'تیرے ساتھ موسموں کا | حساب نہیں رکھنا',
      'دل چاہتا ہے | وقت تھم جائے یہیں',
      'تیرے ساتھ ہر نشانی | میری پسند کی',
      'پیار وہ جو بغیر شرط | سب قبول کرے',
      'تیری ہنسی پر دنیا | قربان میری',
      'میں نے چاہا تجھ کو | بے ساختہ دل سے',
      'تیرے نام کا پہلا حرف | میری پسند کا نشان',
      'ہر رات تیری باتوں کے | خوابوں میں گزرتی ہے',
      'تم آؤ تو | چاند بھی دیکھتا رہے 🌙',
      'تیری محبت وہ دولت ہے | جو کبھی نہ ختم ہو',
    ]],
    ['happy','😊','خوشی',[
      'خوشی اپنے ساتھ لاؤ | دکھ سب کے بانٹو',
      'ہنستی شکل میری | سب سے بڑی نشانی ہے',
      'چھوٹی سی بات پر بھی | دل سے ہنسو',
      'ہر دن ایک تحفہ ہے | جھولی بھر لو',
      'مسکراہٹ مفت ہے | سب کو دو',
      'خوشیاں چھوٹی ہوں | مگر اپنی',
      'آج کا دن | کل کی یاد بنے گا',
      'بس یہی زندگی ہے | ہنسنا اور ہنسانا',
      'موسم بھی ہنستا ہے | جب دل خوش ہو',
      'اداسی سے لڑنے کی دوا | ایک ہنسی ہے',
      'خوش رہو | دنیا خود خوش ہوگی',
      'بچوں جیسی خوشی | سچ والی ہے',
      'چائے اور اچھا موڈ | دن بن دیتے ہیں ☕',
      'ہر مشکل کا جواب | ایک مسکراہٹ ہے',
      'اپنے قدموں پر چلو | راستے خود بن جائیں گے',
      'خوشی کی تلاش نہ کرو | بنو خوشی',
      'دوسروں کی خوشی میں | اپنی خوشی ڈھونڈو',
      'آج سوچا کچھ اچھا | تو دن اچھا گیا',
      'ہنسنا گناہ نہیں | سب سے سستی دوا ہے',
      'وقت گزر جائے گا | یادوں میں ہنسنا',
      'ڈر کے آگے جیت ہے | ہنس کر جھانکو',
      'چھوٹی سی خوشی | بڑے دکھ کی دوا',
      'روز ایک نیا تجربہ | زندگی رنگین بناتا ہے',
      'آسمان کا رنگ بدلتا ہے | موڈ بھی بدلو',
      'ہر نقصان میں چھپی ہوتی ہے | ایک نعمت',
      'جس نے ہنسنا سیکھا | اس نے جینا سیکھا',
      'خواب دیکھنا بند نہ کرو | ان پر کبھی دن آتا ہے',
      'لوگ اپنی مسکراہٹ کے | دیوانے بنے رہتے ہیں',
      'سادگی میں چھپی ہوتی ہے | اصل خوشی',
      'آج ہے تو کل بھی ہوگا | بس مسکرانا نہ بھولو',
    ]],
    ['life','🌱','زندگی',[
      'زندگی ایک سفر ہے | منزلیں اپنی اپنی',
      'خوشی بھی گزرتی ہے | غم بھی گزر جاتا ہے',
      'کوشش کرتے رہو | ایک دن کامیابی ضرور ہے',
      'زندگی کو آسان نہیں | خوبصورت بناؤ',
      'گرنا معمولی بات ہے | اٹھ جانا کمال ہے',
      'ہر رات کے بعد | صبح ضرور آتی ہے',
      'محنتی لوگ کبھی | خالی نہیں لوٹتے',
      'دنیا بھاگتی ہے | سبق پڑھانے آتی ہے',
      'عادتیں مقدر بن جاتی ہیں',
      'زندگی مختصر ہے | اچھے کام کرو',
      'دکھ سبق سکھاتا ہے | خوشی یہ بھلا دیتی ہے',
      'اپنی قیمت خود رکھو | مول لینے والے بہت',
      'وقت کی قدر کرو | یہی اصل سرمایہ ہے',
      'رشتے نبھاؤ | دنیا نبھا جائے گی',
      'ہار ماننے والا | جیتنے سے محروم رہا',
      'لوگوں میں رہو تو | لوگوں جیسا بنو',
      'چھوٹی خوشیوں کو | بڑا نام دو',
      'ہر دن کچھ سیکھو | ایک دن پروان چڑھو گے',
      'اپنا گھر کچھ بھی ہو | اپنی جگہ بہتر ہے',
      'وقت بتاتا ہے | کون اپنا کون پرایا',
      'مشکل وقت میں | اپنے ہی پہچانے جاتے ہیں',
      'صبر پھل دیتی ہے | جلدی پچھتاوا',
      'ہنس کر جیو | یہی زندگی ہے',
      'اپنے عمل کو دیکھو | دنیا کی باتوں نہیں',
      'کوشش جاری ہے | یہ سب سے بڑی جیت ہے',
      'دوستی وفا مانگتی ہے | باقی سب رسمیں ہیں',
      'سبق پرانا | امتحان نیا ہر بار',
      'کامیابی کا مزہ | جدوجہد کے بعد ہے',
      'جو بیج بوتے ہو | وہی کاٹو گے',
      'زندگی چلتی رہے گی | ساتھ نبھاؤ گے تو خوبصورت',
    ]],
    ['attitude','🦁','انداز',[
      'ہم اپنی ہی دھن کے | پکے ہوئے ہیں',
      'بولنے والے بہت | کرنے والے کم',
      'دنیا جو کہے | میرا کام بولتا ہے',
      'محنتی کی عزت | ہر جگہ ہوتی ہے',
      'میں نے سب کو دیکھا | اب خود پر یقین ہے',
      'گر کر اٹھنا میری | پہچان بن گئی',
      'خواب سجا رکھے ہیں | پورے کر کے دکھائیں گے',
      'لوگوں کی باتوں سے | کام نہیں بنتے',
      'میں وہ نہیں جو | ہر کسی کو ملے',
      'شور نہیں | کام بولتا ہے',
      'اپنی محنت کا | میوہ خود ملے گا',
      'وقت بدلتا ہے | میں نہیں بدلتا',
      'دشمنوں کو بھی | میری محنت ماننی پڑتی ہے',
      'مجھے چاہیے ہی کیا | دنیا خود پہچان لے گی',
      'ہنس کر جھانکو | اندر صرف محنت ہے',
      'اپنی روشنی خود | جلاتے ہیں ہم',
      'بادشاہ وہی | جس کا دل بڑا ہو',
      'دکھ سے جیں گے | مگر جھکیں گے نہیں',
      'بولو کم | کرو زیادہ',
      'سب سے بڑی طاقت | اچھا ہونا ہے',
      'خاموش لوگوں کے | جذبات گہرے ہوتے ہیں',
      'میرا انداز اپنا ہے | کسی کی نقل نہیں',
      'سفر شروع کیا ہے | منزل خود چلی آئے گی',
      'میری خاموشی | میری طاقت ہے',
      'جس نے ٹوٹ کر بھی | کھڑے ہونا سیکھا',
      'رات جتنی لمبی | صبح اتنی روشن',
      'میں اپنی منزل | اکیلے چلوں گا',
      'محنتی ہیں ہم | حادثوں سے نہیں ڈرتے',
      'تاج اپنے سر | خود رکھا ہے 👑',
      'جو مل گیا اس پر شکر | جو نہیں وہ کوشش',
    ]],
  ];

  var FONTS = [
    ['نستعلیق', "'Noto Nastaliq Urdu', serif", 'normal', '400'],
    ['نستعلیق موٹا', "'Noto Nastaliq Urdu', serif", 'normal', '700'],
    ['گلزار', "'Gulzar', serif", 'normal', '400'],
    ['امیری', "'Amiri', serif", 'normal', '400'],
    ['صحیفہ', "'Scheherazade New', serif", 'normal', '400'],
    ['لطیف', "'Lateef', serif", 'normal', '400'],
  ];

  var GHAZALS = [
    ['gh1','🌹','پہلی محبت',[
      'وہ چاند سی محبوبہ ہے | مگر میری دعا ہے',
      'اسی کا تو ذکر ہے | ہر بات میں وفا ہے',
      'نظر بھی ہٹتی نہیں | بس ایک ہی ادا ہے',
      'ملے تو کیا کہوں کیسے | یہ عشق کا اثر ہے',
    ]],
    ['gh2','🌙','رات کے ستارے',[
      'یہ رات بھی عجیب ہے | ستارے بھی ساتھ ہیں',
      'ستارے گن کر میں نے | کچھ خواب سجائے ہیں',
      'کوئی تو ہوگا پاس | دل میں یہ آس ہے',
      'تنہائی بھی بھلی لگے | جب تیرا خیال ہے',
    ]],
    ['gh3','🔥','انداز تو دیکھو',[
      'ہم اپنی ہی دھن میں ہیں | یہ عادت پرانی ہے',
      'محنت ہماری طاقت ہے | یہ پہچان پرانی ہے',
      'گر کر اٹھنا سیکھ لیا | یہ داستان پرانی ہے',
      'منزل دور نہیں اب | بس ہمت جواں ہے',
    ]],
    ['gh4','😢','بچھڑنے کا درد',[
      'لوگ ملتے ہیں، جاتے ہیں | یہ سلسلہ چلتا ہے',
      'دل سے جو گیا وہ پھر | یادوں میں رہتا ہے',
      'آنسو بھی کبھی کبھی | مسکراہٹ بن جاتا ہے',
      'زخم وقت کے ساتھ ساتھ | درد بھی کم کرتا ہے',
    ]],
    ['gh5','😊','خوشی کا تحفہ',[
      'چھوٹی سی خوشی پہ بھی | شکر ادا کریں',
      'ہر دن نئی امید | نیا سویرا کریں',
      'مشکل جو آئے راہ میں | ہنس کر اتاریں',
      'زندگی کو اپنی بنا | ایسے ہی جئیں',
    ]],
    ['gh6','🌱','زندگی کا دستور',[
      'زندگی ایک کتاب ہے | ہر دن نیا صفحہ ہے',
      'جو بیت گیا سو بات ہے | آنے والا وقت ہے',
      'گھبرانا کیا اس میں | ہمت ہی جواں ہے',
      'محنت کا پھل یہ ہے | وہ اپنے آپ آتا ہے',
    ]],
    ['gh7','💖','دل کی بات',[
      'یہ دل بھی عجیب ہے | شکوہ نہیں کرتا',
      'چپ چپ سا رہ کر بھی | سب کچھ ہی کہتا ہے',
      'پیار چھپانا چاہا | نظر نے لے آیا',
      'چاہنے والے کا چہرہ | سب کچھ بتا دیتا ہے',
    ]],
    ['gh8','🦁','کام کی بات',[
      'ہم بات کم کرتے ہیں | کام زیادہ کرتے ہیں',
      'گرنے والے گرنے رہیں | ہم اٹھایا کرتے ہیں',
      'محنت میں جو لگا ہے | وقت کٹتا نہیں ہے',
      'پھل اپنے آپ آتا ہے | جب دم بھرتا ہے',
    ]],
    ['gh9','🌸','دوستی',[
      'دوستی کا مطلب لو | حق کا پتہ چلتا ہے',
      'مشکل جب گھیریں تو | ساتھ وہی کھلتا ہے',
      'دنیا بھلے بھول جائے | یار نہیں بھولتا',
      'چاند سے بھی قریب ہے | یہ جو نام ہے',
    ]],
    ['gh10','🖼️','یادیں',[
      'پرانی یادیں عجیب ہیں | ساتھ چلتی ہیں',
      'بچھڑے ہوئے لمحوں کو | پھر سے ملاتی ہیں',
      'ہر گلی، ہر موڑ پر | کچھ تو بچی ہے',
      'وہی پرانا چہرہ | یاد میں مسکراتی ہیں',
    ]],
    ['gh11','✨','خواب',[
      'خواب بڑے رکھو | حوصلہ بلند رکھو',
      'نیند کم، خواب زیادہ | یہ پہچان رکھو',
      'تھک کر جو گر جاؤ | پھر سے اٹھ جانا',
      'جیت انہی کو ہوتی ہے | جو لڑنا جانتے ہیں',
    ]],
    ['gh12','🤲','دعا',[
      'میری دعاؤں میں سب | خوشیاں تیری ہیں',
      'ہر اک صبح تیرے لیے | دعا میری ہے',
      'راہ میں ہر اک سے | سچ بولنا سیکھا ہے',
      'ماں کی دعا جنت | یہ تو سب کو پتا ہے',
    ]],
  ];

  function applyFont(i) {
    var f = FONTS[i] || FONTS[0];
    ['sq-poetry-sher', 'sq-poetry-ghazal'].forEach(function (id) {
      var g = document.getElementById(id);
      if (!g) return;
      g.style.setProperty('--sq-sher-font', f[1]);
      g.style.setProperty('--sq-sher-style', f[2]);
      g.style.setProperty('--sq-sher-weight', f[3]);
    });
    allFontBtns.forEach(function (b, k) { b.classList.toggle('active', k % FONTS.length === i); });
  }

  function fontRow() {
    var frow = document.createElement('div');
    frow.className = 'sq-poetry-fonts';
    frow.innerHTML = '<span class="sq-poetry-flabel">\u{1F58B}\uFE0F Font:</span>';
    FONTS.forEach(function (f, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sq-poetry-fontbtn' + (i === saved ? ' active' : '');
      b.style.fontFamily = f[1];
      b.style.fontStyle = f[2];
      b.style.fontWeight = f[3];
      b.textContent = 'Aa';
      b.title = f[0];
      b.setAttribute('aria-label', 'Poetry font: ' + f[0]);
      b.onclick = function () {
        try { localStorage.setItem('sq-poetry-font', String(i)); } catch (e) {}
        applyFont(i);
      };
      allFontBtns.push(b);
      frow.appendChild(b);
    });
    return frow;
  }

  function makeSection(id, title, sub) {
    var sec = document.createElement('section');
    sec.className = 'section sq-sec';
    sec.id = id;
    var head = document.createElement('div');
    head.className = 'section-header';
    head.innerHTML = '<h2>' + title + '</h2>';
    var p = document.createElement('p');
    p.className = 'sq-sec-sub';
    p.textContent = sub;
    head.appendChild(p);
    sec.appendChild(head);
    return sec;
  }

  function renderShers() {
    var cat = CATS.filter(function (c) { return c[0] === active; })[0] || CATS[0];
    sherGrid.innerHTML = '';
    cat[3].forEach(function (sh) {
      var parts = sh.split(' | ');
      var card = document.createElement('div');
      card.className = 'sq-sher-card';
      var p = document.createElement('p');
      p.className = 'sq-sher';
      var l1 = document.createElement('span');
      l1.textContent = parts[0];
      var br = document.createElement('br');
      var l2 = document.createElement('span');
      l2.textContent = parts[1];
      p.appendChild(l1); p.appendChild(br); p.appendChild(l2);
      if (parts[2]) {
        var em = document.createElement('span');
        em.className = 'sq-sher-emoji';
        em.textContent = ' ' + parts[2];
        p.appendChild(em);
      }
      var sb = document.createElement('button');
      sb.type = 'button';
      sb.className = 'sq-suno-btn';
      sb.innerHTML = '\uD83D\uDD0A Suno';
      sb.setAttribute('aria-label', 'Sher sunein');
      sb.onclick = function () {
        if (!window.speechSynthesis) { sb.textContent = 'Sunna mojood nahi'; return; }
        if (sb.dataset.on === '1') { window.speechSynthesis.cancel(); sb.dataset.on = ''; sb.innerHTML = '\uD83D\uDD0A Suno'; return; }
        Array.prototype.forEach.call(document.querySelectorAll('.sq-suno-btn'), function (b) { if (b !== sb) { b.dataset.on = ''; b.innerHTML = '\uD83D\uDD0A Suno'; } });
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(sh.replace(/ \| /g, ', ').replace(/[^\u0600-\u06FF\s\u060C\u061F.!]/g, ''));
        u.lang = 'ur-PK'; u.rate = 0.92;
        var vs = window.speechSynthesis.getVoices();
        var v = vs.filter(function (vv) { return /^ur/i.test(vv.lang); })[0] || vs.filter(function (vv) { return /^hi/i.test(vv.lang); })[0];
        if (v) u.voice = v;
        u.onend = function () { sb.dataset.on = ''; sb.innerHTML = '\uD83D\uDD0A Suno'; };
        sb.dataset.on = '1'; sb.innerHTML = '\u25B6 Sun raha hai...';
        try { document.dispatchEvent(new CustomEvent('sq-badge', { detail: 'sunai' })); } catch (e) {}
        window.speechSynthesis.speak(u);
      };
      var shBtn = document.createElement('button');
      shBtn.type = 'button';
      shBtn.className = 'sq-suno-btn sq-share-btn';
      shBtn.innerHTML = '\u2197 WhatsApp';
      shBtn.setAttribute('aria-label', 'Sher WhatsApp par share karein');
      shBtn.onclick = function () {
        var txt = sh.replace(/ \| /g, '\n') + '\n\n\u2014 Saqib Iqbal\nhttps://saqib-iqbal.vercel.app/';
        window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      };
      var actRow = document.createElement('div');
      actRow.className = 'sq-sher-actions';
      actRow.appendChild(sb);
      actRow.appendChild(shBtn);
      card.appendChild(actRow);
      card.appendChild(p);
      sherGrid.appendChild(card);
    });
  }

  function renderGhazals() {
    ghazGrid.innerHTML = '';
    GHAZALS.forEach(function (g) {
      var card = document.createElement('div');
      card.className = 'sq-ghazal-card';
      var h = document.createElement('p');
      h.className = 'sq-ghazal-title';
      h.textContent = g[1] + ' ' + g[2];
      card.appendChild(h);
      g[3].forEach(function (cp) {
        var parts = cp.split(' | ');
        var p = document.createElement('p');
        p.className = 'sq-couplet';
        var l1 = document.createElement('span');
        l1.textContent = parts[0];
        p.appendChild(l1);
        p.appendChild(document.createElement('br'));
        var l2 = document.createElement('span');
        l2.textContent = parts[1];
        p.appendChild(l2);
        card.appendChild(p);
      });
      ghazGrid.appendChild(card);
    });
  }

  function build() {
    var host = q('.hero');
    if (!host || !host.parentNode) return false;
    var parent = host.parentNode;
    if (parent.querySelector('#sq-poetry-sher')) return null; // already built

    /* ---- Section 1: Sher ---- */
    var sher = makeSection('sq-poetry-sher', '\u{1F58B}\uFE0F Sher', 'Dil se parhein — aur apni pasand ka font chunein');
    sher.appendChild(fontRow());
    var tabs = document.createElement('div');
    tabs.className = 'sq-poetry-tabs';
    CATS.forEach(function (cat) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sq-poetry-tab' + (cat[0] === active ? ' active' : '');
      b.innerHTML = cat[1] + ' ' + cat[2];
      b.onclick = function () {
        active = cat[0];
        Array.prototype.forEach.call(tabs.children, function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        renderShers();
      };
      tabs.appendChild(b);
    });
    sher.appendChild(tabs);
    sher.appendChild(sherGrid);
    parent.appendChild(sher);

    /* ---- Section 2: Ghazal ---- */
    var ghaz = makeSection('sq-poetry-ghazal', '\u{1F3BC} Ghazal', 'Mukammal ghazlein — apni pasand ka font yahan bhi chalega');
    ghaz.appendChild(fontRow());
    ghaz.appendChild(ghazGrid);
    parent.appendChild(ghaz);

    applyFont(saved);
    renderShers();
    renderGhazals();
    return true;
  }

  var allFontBtns = [];
  var saved = 0;
  try { saved = parseInt(localStorage.getItem('sq-poetry-font') || '0', 10) || 0; } catch (e) {}
  if (saved < 0 || saved >= FONTS.length) saved = 0;
  var active = 'love';
  var sherGrid = document.createElement('div');
  sherGrid.className = 'sq-poetry-grid';
  var ghazGrid = document.createElement('div');
  ghazGrid.className = 'sq-poetry-grid';

  var tries = 0;
  var t = setInterval(function () {
    try {
      tries++;
      var r = build();
      if (r !== false || tries > 60) clearInterval(t);
    } catch (e) { try { clearInterval(t); } catch (x) {} }
  }, 600);
  window.__sqPoetryCats = CATS;
})();


/* ===== Kit: Music section (Songs + Tilawat) — YouTube IFrame API behind an audio-style player ===== */
(function () {
  'use strict';
  function q(s) { return document.querySelector(s); }

  var SONGS = [{"id":"cerYfcoPnjI","title":"Oy Kamla Yar Tan Wat Yar Hondin | Slowed+Reverb Saraiki Song|Shafaullah Rokri Song | Saraiki Song"},{"id":"RfTeNHzyRuU","title":"Jinde Naal Dil laya { Slowed+Reverb } || Super Hits Saraiki Songs || slowed new song 2024 | Saraiki"},{"id":"5ZtlnftpXTg","title":"Akhiyan Mila Ke Dhola {Slowed & Reverb} | Slowed Saraiki Song || Duniya to Sohna Mahi | Saraiki song"},{"id":"DbIRbTUHquU","title":"Jay Disya Na Manu Mukh Tera {Slowed +Reverb} | Hathan Diya Lakeera Punjabi Song | Rahat Fateh Ali"},{"id":"cZAYAkC2k6A","title":"Dhola Ty Main Haan Kathey {Slowed &Reverb } Song || Slowed Saraiki Song || New Saraiki Song 2024"},{"id":"8B8L18Z-FEM","title":"Chitty Waal Thi Gay {Slowed +Reverb} |Shafa Ullah Khan Rokhri Saraiki Song | Slowed Saraiki Hit Song"},{"id":"sb8iqa9XB60","title":"Thaki Thaiyan Aan { Slowed & Reverb}|Zeeshan Rokhri Song |Slowed And Reverb Saraiki Songs"},{"id":"7EK_XWy82fA","title":"Dhola Jo bewafa He { Slowed + Reverb } | Shafa Ullah Khan Rokhri #SaraikiSong | #ReverbSaraikiSongs"},{"id":"axrrqmLFuM8","title":"Sajna Ve mil powen hai { Slowed & Reverb }|| Sajna jay Mil paway a Song | Slowed Reverb Punjabi Song"},{"id":"yGtrZlBRNNs","title":"Vighar Gai Ae Thore Dina Toun {SLOWED +REVERB} | New Saraiki Song | Best Saraiki Song #SaraikiSong"},{"id":"Ip4lonaaSLk","title":"Dhola Manu Janda Aye (Slowed & Reverb) Saraiki Song || Saraiki Slowed and Reverb Songs| Dhola song"},{"id":"f1hpQc7ubms","title":"Yar Waal Aya ae {Slowed+Reverb}Song| New Saraiki Song | Kamli Kamli hoi wadi a | Slowed Saraiki song"},{"id":"fbeXgsoE-Iw","title":"Tere Hundiya Pende nahi sa {Slowed & Reverb}|Shafaullah Khan Rokhri saraiki Song|Slowed Saraiki Song"},{"id":"KAoo4fIMJnU","title":"Zamane di na Man Dhola Slowed+Reverb Lofi | Punjabi Song | Shafa Ullah Khan Rokhari"},{"id":"SaKdd8roBvk","title":"Soniayan Akhaian Kajlay Bharya | Shafaullah Khan Rokhri Song | Slowed and Reverb song |Saraiki Songs"},{"id":"qK8kDhEQNWY","title":"Chal Dowan Chaliye Sunary Kol (Slowed+Reverb)| #ChalDowanChaliye #ChalDowanChaliyeSlowed #reverbsong"},{"id":"zylrW4dzbiQ","title":"Aik Howay To { Slowed + Reverb } Aik Howay Main || Shafaullah Khan Rokhri | Saraiki Slowed Song"},{"id":"PgnJSfOSVOY","title":"Kitni Makhmoor Hai Tumhari Ankhain (Slowed & Reverb ) || Shafaullah Khan Rokhri Songs | Reverb Songs"},{"id":"dyRJEDWRkZs","title":"Sari Duniya Bholai betha ho { Slowed + Reverb } Song | kitni Chahat Chupaye betha ho |Sajjad Solangi"},{"id":"T-ghMbRaoYo","title":"Chalray Chalray waal {Slowed + Reverb}| Shafaullah Khan Rokhri |Slowed and Reverb song |Saraiki song"},{"id":"gMTo_j73Wvs","title":"Chal Bottle Chaa Dildar {Slowed+Reverb}Song | Shafaullah Khan Rokhri Song|Saraiki Slowed Reverb Song"},{"id":"xNkpPyTCgJw","title":"Assalam o Alaikum aoo g {Slowed +Reverb} |Zeeshan Rokhri New Song |TikTok Viral Songs | Punjab songs"},{"id":"GVFHiFoqe6w","title":"Meda Dil Pia Thendy ( Slowed + Reverb ) | Ahmad Nawaz Chena | Saraiki Slowed and Reverb #saraikisong"},{"id":"IBm_Pmz_Xgk","title":"Jy Ghar Mere To Away ( Slowed+Reverb ) | Phulay dy haar pawesa Jy Ghar mere to awy song"},{"id":"QfkGDSpkMRM","title":"Shala Sardari Qaim Hovi | Musafir Tede Watna Tun | Basit Naeemi | Saraiki Slow Sad Song #saraikisong"},{"id":"S_if4gi0hcM","title":"Main Suti Paii Nu (Slowed+Reverb)|Shafaullah khan rokhri Song |#SaraikiSongSlowed | Rokhari songs"},{"id":"DzToNraltY4","title":"Ay Gali Be Wafawa Di ( Slowed & Reverb )| Punjabi Song #punjabisong #punjabislowedreverb #Naseebolal"},{"id":"pWRXph0UH3s","title":"Gila Teda Kariye (Slowed & Reverb) Asa Mar na Jaiye | Shafaullah Khan Rokhri Song #saraikisong"},{"id":"DyZHR0cUiBQ","title":"Mekho So Chowa lay Phol Main Ni Taroray { Slowed+Reverb }| Saraiki Slowed Song | Reverb song Saraiki"},{"id":"5mvn3QXTFm4","title":"Kawra Kawra ( Slowed + Reverb ) Shafaullah Khan Rokhri"},{"id":"EhoShqTLr-w","title":"Mar Mar Ke Taa Milay c (Slowed + Reverb) | Punjabi Sad Song 💔 #amrindergillsongs"},{"id":"F14ZAD0_U-0","title":"Rab Sain Likh Chori Rozi Vich Pardesan De ( Slowed + Reverb ) | New Saraiki song Punjabi Slowed Song"},{"id":"GblFVNWTAAE","title":"Meda Ranjhna (Slowed + Reverb) Zeeshan Rokhri | Slowed + Reverb song | Saraiki Song Slowed Reverb"},{"id":"duDLDKUgxdw","title":"Rab Di Zaat To Dar Na Kar Maghrori Aye (TikTok Viral Song) | New Punjabi Song"},{"id":"Ycjsc1iwJjY","title":"kamli Nal laa Akhaiyan (Slowed + Reverb) | Onchi dokana ty pekhe pakwan hundan #SaraikiSong"},{"id":"rJtmyk5zcXA","title":"Way Kamla Yar Ta Wat Yar Hudan { Slowed+ Reverb } | Saraiki Song"},{"id":"WVmO64Amdn4","title":"Main Haan Garibni Ji - Shafaullah Khan Rokhri | Saraiki Song Slowed Reverb"},{"id":"1gJ1P7KggFI","title":"Tu Banse Dhola kain Naseeban Walay Da ( Slowed + Reverb ) | Shafaullah Khan Rokhri"},{"id":"3X2OFwy5d_I","title":"\"Meray Sajan Ko Akho Na Enj Khafa(Slowed Reverb) | Shafaullah khan rokhri song | Saraiki Slowed Song"}];
  var PARAS = [{"id":"Zbnq02nVDF8","label":"Para 1","title":"Al Quran Full Terjemahan Bahasa Indonesia dan Inggris | PARA 1 | JUZUK 1"},{"id":"BU_mhUfx3yw","label":"Para 2","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 2 | JUZUK 2"},{"id":"qFKqSO6-37o","label":"Para 3","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 3 | JUZUK 3"},{"id":"noyQ265xtUk","label":"Para 4","title":"Quran Full Translation in Indonesian and English | QURAN PARA 4 | JUZ 4"},{"id":"vB7thMibR50","label":"Para 5","title":"Full Quran with Indonesian and English Translation | QURAN PARA 5 | JUZ 5"},{"id":"1Q7oW_XEdSI","label":"Para 6","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris| QURAN PARA 6 | JUZUK 6"},{"id":"1NfXabv2CJI","label":"Para 7","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 7 | JUZUK 7"},{"id":"UI0AM_lUmsc","label":"Para 8","title":"Quran Full Indonesian and English Translation | QURAN PARA 8 | JUZ 8"},{"id":"yDIvf8jw4Dc","label":"Para 9","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 9 | JUZUK 9"},{"id":"HLbA07pDWEU","label":"Para 10","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 10 | JUZUK 10"},{"id":"3w_kp9dFat0","label":"Para 11","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 11 | JUZUK 11"},{"id":"2T7VL8A9XIk","label":"Para 12","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 12 | JUZUK 12"},{"id":"rEFuNihNDCo","label":"Para 13","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 13 | JUZUK 13"},{"id":"r0SoEmKNZlg","label":"Para 14","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 14 | JUZUK 14"},{"id":"F1iIhvi5LDw","label":"Para 15","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 15 | JUZUK 15"},{"id":"uSRRwvXEy7I","label":"Para 16","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 16 | JUZUK 16"},{"id":"hxIuXlS3nLM","label":"Para 17","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 17 | JUZUK 17"},{"id":"d6EgV-Hn81g","label":"Para 18","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 18 | JUZUK 18"},{"id":"KF9YV_sssr4","label":"Para 19","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 19 | JUZUK 19"},{"id":"5UP2z0ZNFfY","label":"Para 20","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 20 | JUZUK 20"},{"id":"nSa6W-k61dM","label":"Para 21","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 21 | JUZUK 21"},{"id":"Bm_Awst_Ozk","label":"Para 22","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 22 | JUZUK 22"},{"id":"8sX7dD_cgC0","label":"Para 23","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 23 | JUZUK 23"},{"id":"CCM_Wg_nbU0","label":"Para 24","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 24 | JUZUK 24"},{"id":"M_d9eUVWCrM","label":"Para 25","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 25 | JUZUK 25"},{"id":"2X8sm49VdC4","label":"Para 26","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 26 | JUZUK 26"},{"id":"DvYBQ0wu7Ic","label":"Para 27","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 27 | JUZUK 27"},{"id":"riLnZmLx4_8","label":"Para 28","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 28 | JUZUK 28"},{"id":"zeSd2MtpMfk","label":"Para 29","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 29 | JUZUK 29"},{"id":"T-2F4wtWjpw","label":"Para 30","title":"Quran Full Terjemahan Bahasa Indonesia dan Inggris | QURAN PARA 30 | JUZUK 30"}];

  var CATS = [
    ['songs', '\uD83C\uDFB5 Songs', 'Songs playlist — ek ke baad ek chalti hain'],
    ['quran', '\uD83D\uDD4A\uFE0F Tilawat-e-Quran', '30 Paras — Para 1 se Para 30 tak'],
    ['naat', '\uD83D\uDC99 Naat', 'Naatein — Ghulam Mustafa Qadri aur dost'],
    ['qawwali', '\uD83C\uDFB6 Qawwali', 'Nusrat Fateh Ali Khan — hazri kalam']
  ];
  var NAATS = [{"id":"JLkCad_qAng","title":"New Naat - Ghulam Mustafa Qadri - Kabay Ki Ronaq - Official Video - Heera Gold"},{"id":"vgmgAdAu2ew","title":"Jagha Ji Lagane ki Duniya Nhi Hai - Ghulam Mustafa Qadri"},{"id":"qTGu_ZpNEH0","title":"Meri Baat Ban Gayi Hai - Ghulam Mustafa Qadri - Naat - M Media Gold"},{"id":"GIrrG1fznBU","title":"New Naat Sharif | Ghulam Mustafa Qadri | Gham Ho Gaye Beshumar | Heera Gold | Hou Karam Sarkar Ab"},{"id":"F1eGsxVr7Po","title":"Hara Gumbad Jo Dekhoge Zamana Bhool Jaoge Naat | Heart Touching Naat | Ghulam Mustafa Qadri| Studio5"},{"id":"2EkYCgqRt5M","title":"Menu Shoq Madine Jawan Da - Ghulam Mustafa Qadri - Official video"},{"id":"uKPb4Tq_klA","title":"New Rabi Ul Awal Title Naat 2020 | Pukaro Ya Rasool Allah صلى الله عليه وسلم | Ghulam Mustafa Qadri"},{"id":"POQFRfV3by8","title":"Heart Touching Naat - Ghulam Mustafa Qadri - Haal e Dil - Official Video - M Media Gold"},{"id":"TLFXHiyGV_o","title":"Dar e Nabi Par | Ghulam Mustafa Qadri | 2021 Heart Touching Naat | Kids Naat | Studio5"},{"id":"05mLbp5yyzQ","title":"Ankhon Ka Tara Naam e Mohammad - Ghulam Mustafa Qadri - Heart Touching Naat"},{"id":"OSoQVyAlOOU","title":"Rabi Ul Awal Naat | Ghulam Mustafa Qadri | Gali Gali Saj Gayi - Hum Apne Nabi Pak Se | Studio5"},{"id":"uRhLDd7pnho","title":"New Heart Touching Naat - Mustafa Apke Jesa - Ghulam Mustafa Qadri - Official Video - Heera Gold"},{"id":"ELsBOmfW-nM","title":"New Naat - Sukoon Paya - Ghulam Mustafa Qadri - Official Video - Safa Islamic"},{"id":"M9PIEjsg_5I","title":"Ghulam Mustafa - Eid Mubarak - Hajj Kalam - Qurbani Ka Mausam - RWDS"},{"id":"QKwVG4KoY-8","title":"Jashn e Amad e Rasool Allah he Allah || Bibi Amna ke Phool | Ghulam Mustafa Qadri | New Milad Album"},{"id":"EvsrF0IrAkg","title":"New Naat - Hum Ko Bulana Ya Rasool Allah - Ghulam Mustafa Qadri - Official Video -Safa Islamic"},{"id":"I6r2nRufiZM","title":"2021 Milad Special Nasheed | Noor Wala Aaya Hai | Ghulam Mustafa Qadri | New Rabi Ul Awal Kids"},{"id":"vmJ4AMo_sXc","title":"Wajay Allah Wali Taar - Ghulam Mustafa Qadri - Arfana Kalam 2021 - Meem Production"},{"id":"HRwL70lzixc","title":"Meraj ko Chalay Dulha || Meraj Shareef Super hit kalam || Ghulam Mustafa Qadri"},{"id":"OlLVclhLD8Q","title":"2024 Ramadan Best Special Nasheed | Ghulam Mustafa Qadri Mah e Ramzan Hai | Hi-Tech Islamic Naats"},{"id":"bdoThhh4-8o","title":"Ramadan Nasheed | Mustafa Mustafa | Ramzan Naat | Ahmed Raza Qadri & Ghulam Mustafa Qadri | Studio5"},{"id":"6vjLjM3TaV4","title":"Beautiful Naat - Ghulam Mustafa Qadri - Zameen Maili Nahi Hoti - Official Video - Heera Gold"},{"id":"tqiF-3Q16HE","title":"Tu Kuja Man Kuja • Ghulam Mustafa Qadri • New Very Beautiful Nasheed 2021• Naat Update"},{"id":"m81jvJ1Ezkw","title":"New Rabi Ul Awal Title Naat 2020 | Aa Gaye Rasoolallah | Ghulam Mustafa Qadri | Milad Special"},{"id":"xBqDaiH_cTg","title":"Manqabat 2022 | Taj Ul Shariyya | Ghulam Mustafa Qadri"},{"id":"Jt4yyyHwK4U","title":"Dam Mast Qalandar Umar Umar | New Manqabat 2021 | Ghulam Mustafa Qadri"},{"id":"SXquwYQeZjI","title":"Warafana Laka Zikrak | Ghulam Mustafa Qadri | New Naat"},{"id":"wzcmMjt30AM","title":"New Rabiulawal Naat - Ghulam Mustafa Qadri - Amna K Laal Aye - Official Video - Heera Gold"},{"id":"fokdo9obdBo","title":"Best & Most Beautiful Naat 2022 | Woh Mera Nabi Hai | Ghulam Mustafa Qadri | Kids Special Nasheed"},{"id":"J_D6QPdOhEM","title":"Har Waqt Tassawur Main Madinay Ki Gali | Ghulam Mustafa Qadri | Naat 2024"},{"id":"g86BJIOFg34","title":"Ab to Bas ek hi dhun hai ke Madina Dekhon | Ghulam Mustafa Qadri | Official Video"},{"id":"MvKf8x3woRI","title":"New Manqabat Aala Hazrat - Raza Baadshah - Ghulam Mustafa Qadri | 4K Video |"},{"id":"MYNjWzIctDA","title":"New Rabi Ul Awal Title Kalam | Jashn e Milad | Ghulam Mustafa Qadri"},{"id":"Bl5HGq_8XE0","title":"2021 Ramadan Kids Special Naat | Ghulam Mustafa Qadri | Aye Sabz Gumbad Wale"},{"id":"r7vGnH0Pag0","title":"Phir K Gali Gali | Ghulam Mustafa Qadri | Official Video"},{"id":"9CwLSy-amZ0","title":"Emotional kalam || Unka Mangta hoon || Ghulam Mustafa Qadri"},{"id":"nPExoPYxU64","title":"New Hajj Kalam 2021 || Hara Gumbad - Ghulam Mustafa Qadri"},{"id":"Ne9KIbZ7c6U","title":"Qaseeda Burda Shareef - Ghulam Mustafa Qadri - Official Video"},{"id":"EV5jeUg0y9o","title":"New Manqabat Imam Hussain | Badshah Ya Hussain | Ghulam Mustafa Qadri |"},{"id":"2tOykgj7hlc","title":"Tere Sadqay mein Aaqa || New Kalam 2022 || Hasbi rabbi jallallah || Ghulam Mustafa Qadri"},{"id":"LYqTNn29GLw","title":"Kya Bataon K Kiya Madina Hai - Ghulam Mustafa Qadri - Official Video"},{"id":"7FMn5NFoY0Q","title":"Taiba Ke Jaane Wale - Ghulam Mustafa Qadri - Official Video"},{"id":"Tvuh068s1O8","title":"New Beautiful Manqbat 2020 | Nazr e Karam Jillani | Ghulam Mustafa Qadri"},{"id":"civysHwcRsw","title":"New Manqabat 2022 || Hazrat Abu Bakrr Siddique || Ghulam Mustafa Qadri"},{"id":"AAP--01ICpY","title":"Ghous Ka Karam Ghous Ki Ata || Gyarvi Sharif - Ghulam Mustafa Qadri - Manqabat 2021"},{"id":"OXG-g5xUTMw","title":"Na Cricket Sharart kay liay aaya hay | Mah e Ramzan Ibadat kay liay Aaya hay - Ghulam Mustafa Qadri-"},{"id":"e5sfvQAIU-0","title":"Tajdar e Haram || Super Hit Kalam 2022 || Ghulam Mustafa Qadri - New Style"},{"id":"f1g1lWVPkcc","title":"Tanam Farsooda Jaan Para - Ghulam Mustafa Qadri | Official Video |"},{"id":"8v-6THqssQI","title":"Chan do Tukday ho Janda aye || Ghulam Mustafa Qadri || 2022 ||"},{"id":"LZfjnI6TVUc","title":"Dama Dam Mast Qalandar - Manqabat Hazrat Umar Farooq - Ghulam Mustafa Qadri | Muharram ul Haram"},{"id":"DxfWXt47g04","title":"Mein Madinay Chala | Complete Video Shoot in Madina Pak | Ghulam Mustafa Qadri"},{"id":"p0YHksb96OU","title":"Almadad Ya Ghous ul Azam - Ghulam Mustafa Qadri - Official video"},{"id":"GgMw49P3OBU","title":"Dil Sey Milad Hum Manaien Gey - Milad Titel Kalam - Ghulam Mustafa Qadri"},{"id":"FhMMRQs7J_w","title":"Kab Gunahon Se Kinara Main Karunga Ya Rab || Moral Story || Emotional Munajat | Ghulam Mustafa Qadri"},{"id":"FYc_KTB6OFs","title":"Haidri Rang | Manqabat | Mola Ali A.S. | 13 Rajab | Jashn e Wiladat | Ghulam Mustafa Qadri"},{"id":"07SkgSGj6l0","title":"Lakhon Darood aur Lakhon Sallam - Shab e Meraj - Ghulam Mustafa Qadri"},{"id":"lBT0GhEcpUs","title":"|| Sahaba Sahaba Hamare Sahaba || NEW KALAM 2022 || Ghulam Mustafa Qadri"},{"id":"YULjg44pyZE","title":"New Milad Special Kalam - Jashan Manaien Gey Hum Mil Kar - Ghulam Mustafa Qadri - Official Video"},{"id":"-nigswgMN3U","title":"New Ramzan Naat 2023 - Jab Gumbad e Khazra Pe Wo Pehli Nazar Gai -Ghulam Mustafa Qadri"},{"id":"QHG6-qNzHTY","title":"Pohanchon Dar e Sarkar صلى الله عليه وسلم pay | Ghulam Mustafa Qadri | Official Video"},{"id":"22xSPenylx0","title":"Konain Dey Wali Da Darbar Bara Sohna | Ghulam Mustafa Qadri"},{"id":"PKzemQ5t6BI","title":"Dar hey kitna pyaara pyaara || NEW KALAM 2022 || Ghulam Mustafa Qadri"}];
  var QAWALIS = [{"id":"k9plOYAmpBU","title":"Shah-e-Mardane Ali ( Remix ) || Nusrat Fateh Ali Khan Full Remix Qawali || Atiq's Creations"},{"id":"50pkaaM-YnA","title":"Othe Amlan De Hony Ne Navede || Nusrat Fateh Ali Khan ||Best Qwali ||#NFAK"},{"id":"AffgSkmDFgk","title":"Unke Andaz e karam Nusrat Fateh Ali Khan Best Qawwali"},{"id":"WzlO79d3S8c","title":"Coke Studio Season 11| Piya Ghar Aaya| Fareed Ayaz| Abu Muhammad Qawwal and Brothers"},{"id":"Nqwmh4WXMmo","title":"Allah hu Allah hu ,Qawali by Nusrat Fateh ali Khan,One of the greatest Qawali"},{"id":"VyvlJoV_q8s","title":"Je Tu Rab Nu Manuna Phly Yaar Nu Mana Ustad Nusrat Fateh Ali Khan RGH HD Video (hafizabadi)"},{"id":"29kYSbMUSuA","title":"Woh Bhi Apne Na Hue (NFAK Remix) | Unke Andaz-e-Karam"},{"id":"TBxtqzGsI7U","title":"🎶 Je Tu Akhiyan De Samne Nahi Rehna | Nusrat Fateh Ali Khan | NFAK Qawwali ❤️ | Sufi Kalam"},{"id":"q4NVp-aFZSw","title":"Tumhein Dillagi Bhool Jani Paray Gi| Ustad Nusrat Fateh Ali Khan| Best Ever|"},{"id":"2Rz5cZjvBzU","title":"Dam Dam Ali Ali Kar | Nusrat Fateh Ali Khan | Powerful Original Qawwali | Bazm-e-Nusrat"},{"id":"9YByMu_W7E8","title":"Kali Kali Zulfon Ke Phande Na Dalo | Nusrat Fateh Ali Khan | Qawwali | NFAK"},{"id":"zk0-f92gg9A","title":"'Bhar Do Jholi Meri' FULL VIDEO Song - Adnan Sami | Bajrangi Bhaijaan | Salman Khan Pritam"}];

  var active = 'songs';
  var player = null;
  var playerReady = false;
  var pendingPlay = null;   // track index waiting for player ready
  var playing = false;
  var cur = 0;              // current track index in active list
  var vol = 80;
  try { vol = parseInt(localStorage.getItem('sq-music-vol') || '80', 10) || 80; } catch (e) {}
  if (vol < 0 || vol > 100) vol = 80;

  function list() { return active === 'songs' ? SONGS : active === 'naat' ? NAATS : active === 'qawwali' ? QAWALIS : PARAS; }
  function trackOf(i) {
    var t = list()[i];
    return t ? (t.label ? t.label + ' — ' + t.title : t.title) : '';
  }
  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  var els = {}; // cached elements

  function renderList() {
    var host = els.list;
    host.innerHTML = '';
    list().forEach(function (t, i) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'sq-music-track' + (i === cur ? ' active' : '');
      var num = document.createElement('span');
      num.className = 'sq-music-num';
      num.textContent = t.label ? String(i + 1) : '\u25B6';
      var label = document.createElement('span');
      label.className = 'sq-music-label';
      label.textContent = t.label ? t.label + ' — ' + t.title : t.title;
      row.appendChild(num);
      row.appendChild(label);
      row.onclick = function () { select(i, true); };
      host.appendChild(row);
    });
  }

  function updateRows() {
    Array.prototype.forEach.call(els.list.children, function (row, i) {
      row.classList.toggle('active', i === cur);
    });
    els.nowPlaying.textContent = trackOf(cur) || 'Koi track chuna nahin gaya';
    document.title = playing ? '\u25B6 ' + trackOf(cur) : document.title.replace(/^\u25B6 /, '');
  }

  function loadYT() {
    if (window.YT && window.YT.Player) { ready(); return; }
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = function () { ready(); };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }

  function ready() {
    if (player) return;
    player = new YT.Player('sq-music-yt', {
      height: '180', width: '320',
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: function () {
          playerReady = true;
          try { player.setVolume(vol); } catch (e) {}
          if (pendingPlay !== null) { var i = pendingPlay; pendingPlay = null; playIndex(i); }
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.PLAYING) {
            playing = true; els.playBtn.textContent = '\u23F8'; updateRows(); tickTime();
          } else if (e.data === YT.PlayerState.PAUSED) {
            playing = false; els.playBtn.textContent = '\u25B6'; updateRows();
          } else if (e.data === YT.PlayerState.ENDED) {
            playing = false; els.playBtn.textContent = '\u25B6';
            if (cur + 1 < list().length) select(cur + 1, true); else updateRows();
          }
        }
      }
    });
  }

  function playIndex(i) {
    cur = i;
    var t = list()[i];
    if (!t) return;
    if (!playerReady) { pendingPlay = i; loadYT(); return; }
    try { player.loadVideoById(t.id); } catch (e) { pendingPlay = i; loadYT(); return; }
    playing = true;
    els.playBtn.textContent = '\u23F8';
    updateRows();
    setTimeout(tickTime, 800);
  }

  function select(i, autoplay) {
    cur = i;
    updateRows();
    renderList();
    if (autoplay) playIndex(i);
  }

  function togglePlay() {
    if (!playerReady) { playIndex(cur); return; }
    try {
      if (playing) { player.pauseVideo(); playing = false; els.playBtn.textContent = '\u25B6'; }
      else {
        if (cur < 0 || cur >= list().length) cur = 0;
        if (!els.nowPlaying.dataset.loaded || els.nowPlaying.dataset.loaded !== String(cur)) {
          playIndex(cur);
        } else { player.playVideo(); playing = true; els.playBtn.textContent = '\u23F8'; try { document.dispatchEvent(new CustomEvent('sq-badge', { detail: 'music' })); } catch (e) {} }
      }
      els.nowPlaying.dataset.loaded = String(cur);
    } catch (e) { playIndex(cur); }
  }

  var timeTimer = null;
  function tickTime() {
    if (timeTimer) return;
    timeTimer = setInterval(function () {
      if (!playerReady || !playing) { return; }
      try {
        var d = player.getDuration(), c = player.getCurrentTime();
        if (d > 0 && isFinite(c) && c >= 0) {
          els.seek.value = String(Math.max(0, Math.min(1000, Math.round((c / d) * 1000))));
          els.time.textContent = fmt(c) + ' / ' + fmt(d);
        }
      } catch (e) {}
    }, 700);
  }

  function build() {
    var host = q('.hero');
    if (!host || !host.parentNode) return false;
    var parent = host.parentNode;
    // wait until the poetry sections exist (or clearly never will) so Music lands after Ghazal
    if (!parent.querySelector('#sq-poetry-ghazal') && !parent.querySelector('#sq-music')) {
      if (build._tries === undefined) build._tries = 0;
      build._tries++;
      if (build._tries < 75) return false; // poetry module polls every 600ms too
    }
    if (parent.querySelector('#sq-music')) return true; // already built

    var sec = document.createElement('section');
    sec.className = 'section sq-sec';
    sec.id = 'sq-music';
    var head = document.createElement('div');
    head.className = 'section-header';
    head.innerHTML = '<h2>\uD83C\uDFB5 Music</h2>';
    var p = document.createElement('p');
    p.className = 'sq-sec-sub';
    p.textContent = 'Songs, Tilawat, Naat aur Qawwali — poori playlist';
    head.appendChild(p);
    sec.appendChild(head);

    var tabs = document.createElement('div');
    tabs.className = 'sq-poetry-tabs';
    CATS.forEach(function (cat) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sq-poetry-tab' + (cat[0] === active ? ' active' : '');
      b.innerHTML = cat[1];
      b.onclick = function () {
        active = cat[0];
        cur = 0;
        Array.prototype.forEach.call(tabs.children, function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        els.sub.textContent = cat[2];
        renderList(); updateRows();
        if (playing) playIndex(0);
      };
      tabs.appendChild(b);
    });
    sec.appendChild(tabs);

    var card = document.createElement('div');
    card.className = 'sq-music-player';

    var yt = document.createElement('div');
    yt.id = 'sq-music-yt';
    yt.className = 'sq-music-yt';
    card.appendChild(yt);

    var np = document.createElement('div');
    np.className = 'sq-music-now';
    np.textContent = 'Koi track chuna nahin gaya';
    card.appendChild(np);
    els.nowPlaying = np;

    var seekRow = document.createElement('div');
    seekRow.className = 'sq-music-seekrow';
    var t0 = document.createElement('span'); t0.textContent = '0:00';
    var seek = document.createElement('input');
    seek.type = 'range'; seek.min = '0'; seek.max = '1000'; seek.value = '0';
    seek.className = 'sq-music-seek';
    seek.setAttribute('aria-label', 'Seek');
    seek.oninput = function () {
      if (!playerReady) return;
      try {
        var d = player.getDuration();
        if (d > 0) player.seekTo((parseInt(seek.value, 10) / 1000) * d, true);
      } catch (e) {}
    };
    var t1 = document.createElement('span'); t1.textContent = '0:00';
    t1.className = 'sq-music-time';
    seekRow.appendChild(t0); seekRow.appendChild(seek); seekRow.appendChild(t1);
    els.seek = seek; els.time = t1;
    card.appendChild(seekRow);

    var ctr = document.createElement('div');
    ctr.className = 'sq-music-controls';
    function mkBtn(txt, fn, big, label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sq-music-btn' + (big ? ' big' : '');
      b.textContent = txt;
      if (label) b.setAttribute('aria-label', label);
      b.onclick = fn;
      return b;
    }
    ctr.appendChild(mkBtn('\u23EE', function () {
      var n = list().length;
      select((cur - 1 + n) % n, true);
    }, false, 'Previous'));
    var playBtn = mkBtn('\u25B6', togglePlay, true, 'Play / Pause');
    ctr.appendChild(playBtn);
    els.playBtn = playBtn;
    ctr.appendChild(mkBtn('\u23ED', function () {
      var n = list().length; select((cur + 1) % n, true);
    }, false, 'Next'));
    ctr.appendChild(mkBtn('\uD83C\uDFB2', function () {
      var ci = Math.floor(Math.random() * CATS.length);
      var c = CATS[ci];
      active = c[0];
      cur = Math.floor(Math.random() * list().length);
      Array.prototype.forEach.call(tabs.children, function (x) { x.classList.remove('active'); });
      tabs.children[ci].classList.add('active');
      els.sub.textContent = c[2];
      renderList(); updateRows();
      select(cur, true);
      try { document.dispatchEvent(new CustomEvent('sq-badge', { detail: 'music' })); } catch (e) {}
    }, false, 'Koi bhi chalao'));
    var volWrap = document.createElement('span');
    volWrap.className = 'sq-music-vol';
    volWrap.innerHTML = '\uD83D\uDD0A';
    var volR = document.createElement('input');
    volR.type = 'range'; volR.min = '0'; volR.max = '100'; volR.value = String(vol);
    volR.className = 'sq-music-volrange';
    volR.setAttribute('aria-label', 'Volume');
    volR.oninput = function () {
      vol = parseInt(volR.value, 10);
      try { if (playerReady) player.setVolume(vol); } catch (e) {}
      try { localStorage.setItem('sq-music-vol', String(vol)); } catch (e) {}
    };
    volWrap.appendChild(volR);
    ctr.appendChild(volWrap);
    card.appendChild(ctr);
    sec.appendChild(card);

    var sub = document.createElement('p');
    sub.className = 'sq-sec-sub';
    sub.textContent = CATS[0][2];
    els.sub = sub;
    sec.appendChild(sub);

    var listEl = document.createElement('div');
    listEl.className = 'sq-music-list';
    sec.appendChild(listEl);
    els.list = listEl;

    parent.appendChild(sec);
    renderList();
    updateRows();
    loadYT();
    makePlayerWhenApi();
    return true;
  }

  function makePlayerWhenApi() {
    var n = 0;
    var iv = setInterval(function () {
      n++;
      if ((window.YT && window.YT.Player) || n > 40) {
        clearInterval(iv);
        if (window.YT && window.YT.Player) ready();
      }
    }, 500);
  }

  var tries = 0;
  var t = setInterval(function () {
    try {
      tries++;
      var r = build();
      if (r !== false || tries > 70) clearInterval(t);
    } catch (e) { try { clearInterval(t); } catch (x) {} }
  }, 600);
})();


/* ===== Kit: Roz ka Sher + Hire-Me WhatsApp + Visitor Map ===== */
(function dailySher(){
  function q(s){ return document.querySelector(s); }
  var tries = 0;
  var t = setInterval(function(){
    tries++;
    var cats = window.__sqPoetryCats;
    var host = q('.hero');
    if (!host || !host.parentNode) return;
    var parent = host.parentNode;
    if (parent.querySelector('#sq-daily-sher')) { clearInterval(t); return; }
    if (!cats && tries > 40) { clearInterval(t); return; }
    if (!cats) return;
    clearInterval(t);
    var pool = [];
    cats.forEach(function(c){ c[3].forEach(function(sh){ pool.push({ sher: sh, cat: c[2] }); }); });
    if (!pool.length) return;
    var day = Math.floor(Date.now() / 86400000);
    var pick = pool[day % pool.length];
    var parts = pick.sher.split(' | ');
    var sec = document.createElement('section');
    sec.className = 'section sq-sec';
    sec.id = 'sq-daily-sher';
    var head = document.createElement('div');
    head.className = 'section-header';
    head.innerHTML = '<h2>\uD83C\uDFB2 Roz ka Sher</h2>';
    var p = document.createElement('p');
    p.className = 'sq-sec-sub';
    p.textContent = 'Har roz ek naya sher — aaj: ' + pick.cat;
    head.appendChild(p);
    sec.appendChild(head);
    var card = document.createElement('div');
    card.className = 'sq-daily-card';
    var txt = document.createElement('p');
    txt.className = 'sq-daily-text';
    var l1 = document.createElement('span'); l1.textContent = parts[0] || pick.sher;
    txt.appendChild(l1);
    if (parts[1]) {
      txt.appendChild(document.createElement('br'));
      var l2 = document.createElement('span'); l2.textContent = parts[1];
      txt.appendChild(l2);
    }
    card.appendChild(txt);
    sec.appendChild(card);
    var sherSec = q('#sq-poetry-sher');
    if (sherSec && sherSec.parentNode === parent) parent.insertBefore(sec, sherSec);
    else parent.insertBefore(sec, host.nextSibling);
  }, 600);
})();

/* hireMe pill: ab Saqib World hub tile hai */

(function visitorMap(){
  function q(s){ return document.querySelector(s); }
  var tries = 0;
  var t = setInterval(function(){
    tries++;
    var host = q('.hero');
    if (!host || !host.parentNode) return;
    var parent = host.parentNode;
    if (parent.querySelector('#sq-visitor-map')) { clearInterval(t); return; }
    if (tries > 50) { clearInterval(t); return; }
    clearInterval(t);

    var sec = document.createElement('section');
    sec.className = 'section sq-sec';
    sec.id = 'sq-visitor-map';
    var head = document.createElement('div');
    head.className = 'section-header';
    head.innerHTML = '<h2>\uD83C\uDF0D Visitor Map</h2>';
    var p = document.createElement('p');
    p.className = 'sq-sec-sub';
    p.textContent = 'Log kahan se aa rahe hain — shehar aur mulk';
    head.appendChild(p);
    sec.appendChild(head);
    var mapDiv = document.createElement('div');
    mapDiv.id = 'sq-vmap-canvas';
    sec.appendChild(mapDiv);
    var listEl = document.createElement('div');
    listEl.className = 'sq-vmap-list';
    listEl.textContent = 'Load ho raha hai...';
    sec.appendChild(listEl);
    var musicSec = q('#sq-music');
    if (musicSec && musicSec.parentNode === parent) parent.insertBefore(sec, musicSec);
    else parent.appendChild(sec);

    function render(geo) {
      listEl.innerHTML = '';
      if (!geo || !geo.length) { listEl.innerHTML = '<span class="sq-vmap-item">Abhi tak koi entry nahin — aap pehle hain! \uD83C\uDF1F</span>'; return; }
      geo.slice(0, 40).forEach(function (g) {
        var s = document.createElement('span');
        s.className = 'sq-vmap-item';
        var place = g.city && g.city !== 'Unknown' ? g.city : (g.country || 'Namaloom');
        s.textContent = '\uD83D\uDCCD ' + place + (g.country ? ', ' + g.country : '') + ' \u00D7' + g.n;
        listEl.appendChild(s);
      });
      if (window.L && document.getElementById('sq-vmap-canvas')) {
        try {
          var map = L.map('sq-vmap-canvas', { scrollWheelZoom: false, attributionControl: true });
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '\u00A9 OpenStreetMap' }).addTo(map);
          var pts = geo.filter(function (g) { return g.lat || g.lon; });
          if (pts.length) {
            pts.forEach(function (g) { L.circleMarker([g.lat, g.lon], { radius: 4 + Math.min(10, g.n), color: '#db4b77', fillColor: '#db4b77', fillOpacity: .75 }).addTo(map).bindTooltip((g.city || '') + (g.country ? ', ' + g.country : '') + ' \u00D7' + g.n); });
            map.fitBounds(pts.map(function (g) { return [g.lat, g.lon]; }), { padding: [24, 24], maxZoom: 8 });
          } else map.setView([30, 69], 2);
        } catch (e) { mapDiv.style.display = 'none'; }
      } else { mapDiv.style.display = 'none'; }
    }

    fetch('/v1/x/visitor-geo').then(function (r) { return r.json(); }).then(function (d) { render(d.geo || []); }).catch(function () { render([]); });

    try {
      if (!sessionStorage.getItem('sq-vmap-seen')) {
        sessionStorage.setItem('sq-vmap-seen', '1');
        fetch('/v1/x/visitor-geo', { method: 'POST' }).catch(function () {});
      }
    } catch (e) {}
  }, 600);
})();


/* ===== Kit: Aap ka Sher + Deewar e Dil + Chhupay Badges ===== */
(function () {
  function q(s) { return document.querySelector(s); }
  function mkSec(id, title, sub) {
    var sec = document.createElement('section');
    sec.className = 'section sq-sec';
    sec.id = id;
    var head = document.createElement('div');
    head.className = 'section-header';
    head.innerHTML = '<h2>' + title + '</h2>';
    var p = document.createElement('p');
    p.className = 'sq-sec-sub';
    p.textContent = sub;
    head.appendChild(p);
    sec.appendChild(head);
    return sec;
  }

  /* ---- Aap ka Sher ---- */
  function buildUserSher() {
    var host = q('#sq-music');
    if (!host || !host.parentNode) return false;
    if (q('#sq-user-sher')) return true;
    var sec = mkSec('sq-user-sher', '\u270D\uFE0F Aap ka Sher', 'Apna sher likhein — approve hone ke baad yahan sab dekhenge');
    var card = document.createElement('div');
    card.className = 'sq-user-sher-card';
    var ta = document.createElement('textarea');
    ta.className = 'sq-user-sher-ta';
    ta.rows = '3';
    ta.maxLength = 400;
    ta.placeholder = 'Apna sher yahan likhein...';
    ta.setAttribute('aria-label', 'Apna sher likhein');
    card.appendChild(ta);
    var row = document.createElement('div');
    row.className = 'sq-user-sher-row';
    var nm = document.createElement('input');
    nm.type = 'text';
    nm.className = 'sq-user-sher-name';
    nm.maxLength = 40;
    nm.placeholder = 'Aap ka naam (optional)';
    nm.setAttribute('aria-label', 'Aap ka naam');
    row.appendChild(nm);
    try {
      var au = JSON.parse(localStorage.getItem('portfolio-auth-local') || 'null');
      if (au && au.name) nm.value = String(au.name).slice(0, 40);
    } catch (e) {}
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sq-user-sher-btn';
    btn.textContent = 'Bhejein';
    row.appendChild(btn);
    card.appendChild(row);
    var msg = document.createElement('p');
    msg.className = 'sq-user-sher-msg';
    card.appendChild(msg);
    sec.appendChild(card);
    var listEl = document.createElement('div');
    listEl.className = 'sq-user-sher-list';
    sec.appendChild(listEl);
    host.parentNode.insertBefore(sec, host);

    var token = '';
    try { token = localStorage.getItem('portfolio-auth-token') || ''; } catch (e) {}
    var isOwner = false;
    try {
      var au2 = JSON.parse(localStorage.getItem('portfolio-auth-local') || 'null');
      isOwner = !!(au2 && au2.email && String(au2.email).toLowerCase() === 'fizanali6267@gmail.com');
    } catch (e) {}

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function renderItem(el, s, pending) {
      var it = document.createElement('div');
      it.className = 'sq-user-sher-item';
      it.innerHTML = '<p>' + esc(s.text) + '</p><span>' + esc(s.name) + (pending ? ' \u00B7 intezar e tarteeb' : '') + '</span>';
      if (pending && isOwner) {
        var br = document.createElement('div');
        br.className = 'sq-user-sher-admin';
        var ap = document.createElement('button');
        ap.type = 'button'; ap.textContent = 'Approve'; ap.className = 'sq-user-sher-ap';
        ap.onclick = function () {
          fetch('/v1/x/user-shers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'approve', id: s.id, token: token }) }).then(function () { it.remove(); });
        };
        var dl = document.createElement('button');
        dl.type = 'button'; dl.textContent = 'Delete'; dl.className = 'sq-user-sher-dl';
        dl.onclick = function () {
          fetch('/v1/x/user-shers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: s.id, token: token }) }).then(function () { it.remove(); });
        };
        br.appendChild(ap); br.appendChild(dl);
        it.appendChild(br);
      }
      el.appendChild(it);
    }
    function loadList() {
      var url = isOwner ? '/v1/x/user-shers' : '/v1/x/user-shers';
      fetch(url).then(function (r) { return r.json(); }).then(function (d) {
        listEl.innerHTML = '';
        var shers = (d && d.shers) || [];
        if (!shers.length) {
          var empty = document.createElement('p');
          empty.className = 'sq-user-sher-empty';
          empty.textContent = 'Abhi tak koi sher nahi aya — pehla sher aap bhejein!';
          listEl.appendChild(empty);
        }
        shers.forEach(function (s) { renderItem(listEl, s, false); });
        if (isOwner && token) {
          fetch('/v1/x/user-shers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'list-all', token: token }) }).then(function (r) { return r.json(); }).then(function (d2) {
            if (d2 && d2.pending && d2.pending.length) {
              var ph = document.createElement('h3');
              ph.className = 'sq-user-sher-pendhead';
              ph.textContent = 'Intezar mein (' + d2.pending.length + ') — sirf aap ko nazar aa rahe hain';
              listEl.parentNode.insertBefore(ph, listEl);
              d2.pending.forEach(function (s) { renderItem(listEl, s, true); });
            }
          }).catch(function () {});
        }
      }).catch(function () {});
    }
    btn.onclick = function () {
      var text = ta.value.trim();
      if (text.length < 10) { msg.textContent = 'Sher thora lamba likhein (kam az kam 10 hroof).'; return; }
      btn.disabled = true;
      fetch('/v1/x/user-shers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'submit', sher: text, name: nm.value }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          btn.disabled = false;
          if (d && d.ok) {
            ta.value = '';
            msg.textContent = 'Shukriya! Aap ka sher check ke baad yahan chhapega.';
            try { document.dispatchEvent(new CustomEvent('sq-badge', { detail: 'shair' })); } catch (e) {}
          } else { msg.textContent = (d && d.error) || 'Kuch masla hua, dobara koshish karein.'; }
        })
        .catch(function () { btn.disabled = false; msg.textContent = 'Kuch masla hua, dobara koshish karein.'; });
    };
    loadList();
    return true;
  }

  /* ---- Deewar e Dil ---- */
  function buildHearts() {
    var host = q('#sq-user-sher');
    if (!host || !host.parentNode) return false;
    if (q('#sq-hearts')) return true;
    var sec = mkSec('sq-hearts', '\u2764\uFE0F Deewar e Dil', 'Tap karein, dil lagayein — sab dilon ki ginti sab ko nazar aati hai');
    var card = document.createElement('div');
    card.className = 'sq-hearts-card';
    var big = document.createElement('button');
    big.type = 'button';
    big.className = 'sq-hearts-btn';
    big.innerHTML = '\u2764\uFE0F';
    big.setAttribute('aria-label', 'Dil lagayein');
    var cnt = document.createElement('div');
    cnt.className = 'sq-hearts-count';
    cnt.textContent = '\u2026';
    card.appendChild(big);
    card.appendChild(cnt);
    sec.appendChild(card);
    host.parentNode.insertBefore(sec, host);
    var sent = false;
    fetch('/v1/x/hearts').then(function (r) { return r.json(); }).then(function (d) { cnt.textContent = Number((d && d.count) || 0).toLocaleString(); }).catch(function () { cnt.textContent = '0'; });
    big.onclick = function () {
      var f = document.createElement('span');
      f.className = 'sq-heart-float';
      f.textContent = '\u2764\uFE0F';
      big.appendChild(f);
      setTimeout(function () { f.remove(); }, 1200);
      if (!sent) {
        sent = true;
        big.classList.add('done');
        fetch('/v1/x/hearts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ add: 1 }) })
          .then(function (r) { return r.json(); })
          .then(function (d) { cnt.textContent = Number((d && d.count) || 0).toLocaleString(); })
          .catch(function () {});
      }
      try { document.dispatchEvent(new CustomEvent('sq-badge', { detail: 'dil' })); } catch (e) {}
    };
    return true;
  }

  /* ---- Chhupay Badges ---- */
  var BADGES = [
    ['sunai', '\uD83D\uDD0A', 'Suno Star', 'Pehla sher sunein'],
    ['music', '\uD83C\uDFB5', 'Music Lover', 'Music chalayen'],
    ['dil', '\u2764\uFE0F', 'Dil Baat', 'Deewar e Dil par dil lagayen'],
    ['shair', '\u270D\uFE0F', 'Shair e Azim', 'Apna sher bhejein'],
    ['ghoomo', '\uD83E\uDD3D', 'Explorer', '5 sections dekhein']
  ];
  function earned() {
    try { return JSON.parse(localStorage.getItem('sq-badges') || '[]'); } catch (e) { return []; }
  }
  function unlock(id) {
    var have = earned();
    if (have.indexOf(id) !== -1) return;
    have.push(id);
    try { localStorage.setItem('sq-badges', JSON.stringify(have)); } catch (e) {}
    var b = null;
    for (var i = 0; i < BADGES.length; i++) if (BADGES[i][0] === id) b = BADGES[i];
    if (!b) return;
    var t = document.createElement('div');
    t.className = 'sq-badge-toast';
    t.innerHTML = '<span>' + b[1] + '</span> Badge mila: <strong>' + b[2] + '</strong>';
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 30);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 400); }, 3500);
    renderTray();
  }
  document.addEventListener('sq-badge', function (e) { try { unlock(e.detail); } catch (err) {} });

  function buildBadges() {
    if (!document.body) return false;
    if (q('#sq-badge-tray')) return true;
    var tray = document.createElement('button');
    tray.type = 'button';
    tray.id = 'sq-badge-tray';
    tray.innerHTML = '\uD83C\uDFC5';
    tray.setAttribute('aria-label', 'Badges dekhein');
    var seen = {};
    BADGES.forEach(function (b) { seen[b[0]] = false; });
    tray.onclick = function () {
      var open = q('#sq-badge-panel');
      if (open) { open.remove(); return; }
      var panel = document.createElement('div');
      panel.id = 'sq-badge-panel';
      var have = earned();
      var h = document.createElement('h3');
      h.textContent = 'Aap ke Badges';
      panel.appendChild(h);
      BADGES.forEach(function (b) {
        var got = have.indexOf(b[0]) !== -1;
        var it = document.createElement('div');
        it.className = 'sq-badge-item' + (got ? ' got' : '');
        it.innerHTML = '<span>' + b[1] + '</span><div><strong>' + b[2] + '</strong><em>' + b[3] + '</em></div>';
        panel.appendChild(it);
      });
      document.body.appendChild(panel);
      setTimeout(function () { document.addEventListener('click', function close(ev) { if (!panel.contains(ev.target) && ev.target !== tray) { panel.remove(); document.removeEventListener('click', close); } }); }, 30);
    };
    document.body.appendChild(tray);
    renderTray();
    /* Explorer: distinct sections seen */
    try {
      var seenIds = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id || 'anon';
          if (id && !seenIds[id]) {
            seenIds[id] = true;
            var distinct = Object.keys(seenIds).filter(function (k) { return k !== 'anon'; }).length;
            if (distinct >= 5) { unlock('ghoomo'); io.disconnect(); }
          }
        });
      }, { threshold: 0.25 });
      var watch = function () { document.querySelectorAll('section[id]').forEach(function (s) { io.observe(s); }); };
      watch();
      setTimeout(watch, 4000);
    } catch (e) {}
    return true;
  }
  function renderTray() {
    var tray = q('#sq-badge-tray');
    if (!tray) return;
    var have = earned();
    var n = BADGES.filter(function (b) { return have.indexOf(b[0]) !== -1; }).length;
    tray.innerHTML = '\uD83C\uDFC5' + (n ? '<b>' + n + '</b>' : '');
    tray.classList.toggle('has', n > 0);
  }

  var tries = 0;
  var t = setInterval(function () {
    tries++;
    var a = buildUserSher(), b2 = buildHearts(), c = buildBadges();
    if ((a && b2 && c) || tries > 75) clearInterval(t);
  }, 600);
})();


/* ===== Kit: Sub-home Hub (Saqib World) — dock ke sath floating button ===== */
(function () {
  function q(s) { return document.querySelector(s); }
  function close() { var ov = q('#sq-hub-overlay'); if (ov) ov.remove(); }
  function open() {
    var ov = q('#sq-hub-overlay');
    if (ov) { close(); return; }
    ov = document.createElement('div');
    ov.id = 'sq-hub-overlay';
    var panel = document.createElement('div');
    panel.className = 'sq-hub-panel';
    var head = document.createElement('div');
    head.className = 'sq-hub-head';
    head.innerHTML = '<h3>\uD83C\uDFE0 Saqib World</h3>';
    var sub = document.createElement('p');
    sub.className = 'sq-hub-sub';
    sub.textContent = 'Saqib ki duniya \u2014 dekho, suno, enjoy karo';
    head.appendChild(sub);
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'sq-hub-close'; x.innerHTML = '\u00D7';
    x.setAttribute('aria-label', 'Band karein');
    x.onclick = close;
    head.appendChild(x);
    panel.appendChild(head);
    var grid = document.createElement('div');
    grid.className = 'sq-hub-grid';
    var TILES = [
      ['\u270D\uFE0F', 'Shayari', 'sq-poetry-sher'],
      ['\uD83D\uDCD6', 'Ghazal', 'sq-poetry-ghazal'],
      ['\uD83C\uDFB5', 'Music', 'music'],
      ['\u2764\uFE0F', 'Deewar e Dil', 'sq-hearts'],
      ['\uD83D\uDCDD', 'Aap ka Sher', 'sq-user-sher'],
      ['\uD83D\uDDFA\uFE0F', 'Visitor Map', 'sq-visitor-map'],
      ['\uD83D\uDCBC', 'Kaam poochein?', 'wa'],
      ['\uD83C\uDFC5', 'Badges', null]
    ];
    TILES.forEach(function (t) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'sq-hub-tile';
      tile.innerHTML = '<span>' + t[0] + '</span>' + t[1];
      tile.onclick = function () {
        close();
        if (t[2] === 'wa') {
          window.open('https://wa.me/923134182952?text=' + encodeURIComponent('Assalam o Alaikum! Main aapki website dekhi \u2014 mujhe apne kaam ke baray mein batana tha.'), '_blank');
          return;
        }
        if (t[2] === null) {
          setTimeout(function () { var tr = q('#sq-badge-tray'); if (tr) tr.click(); }, 220);
          return;
        }
        setTimeout(function () {
          if (t[2] === 'top') { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); } return; }
          var el = document.getElementById(t[2]);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      };
      grid.appendChild(tile);
    });
    panel.appendChild(grid);
    var back = document.createElement('button');
    back.type = 'button'; back.className = 'sq-hub-back';
    back.innerHTML = '<span>\u25C0</span>Wapas';
    back.setAttribute('aria-label', 'Wapas home par jayen');
    back.onclick = close;
    ov.appendChild(back);
    ov.appendChild(panel);
    ov.onclick = function (e) { if (e.target === ov) close(); };
    document.body.appendChild(ov);
  }
  function build() {
    if (!document.body || !q('#sq-dock-btn')) return false;
    if (q('#sq-hub-btn')) return true;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'sq-hub-btn';
    b.innerHTML = '\uD83C\uDFE0';
    b.setAttribute('aria-label', 'Saqib World hub kholen');
    b.onclick = open;
    document.body.appendChild(b);
    return true;
  }
  var tries = 0;
  var t = setInterval(function () { tries++; if (build() || tries > 40) clearInterval(t); }, 600);
})();
