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

/* ---- 16. pin social-row to body so position:fixed is viewport-relative ----
   React re-renders (visitors count, theme, etc.) recreate .social-row inside
   hero-top after we've moved the original — that showed a duplicate icon row
   under "VIP Portfolio". Sweep forever: keep exactly ONE row pinned to body
   (marked data-sq-keep), hide any duplicate IN PLACE (don't detach — React
   owns those nodes and detaching under it risks reconciliation errors). */
(function socialFix(){
  if (window.__sqSocialFix) return; window.__sqSocialFix = true;
  function sweep(){
    try {
      var rows = document.querySelectorAll('.social-row');
      if (!rows.length) return;
      var keeper = null;
      for (var i = 0; i < rows.length; i++) {
        var el = rows[i];
        if (el.getAttribute('data-sq-keep') === '1' && el.parentNode === document.body) { keeper = el; break; }
      }
      if (!keeper) {
        for (var j = 0; j < rows.length; j++) {
          var cand = rows[j];
          if (cand.getAttribute('data-sq-hide') !== '1') {
            document.body.appendChild(cand);
            cand.setAttribute('data-sq-keep', '1');
            cand.style.display = '';
            keeper = cand;
            break;
          }
        }
      }
      for (var k = 0; k < rows.length; k++) {
        var dup = rows[k];
        if (dup === keeper) continue;
        dup.setAttribute('data-sq-hide', '1');
        if (dup.style.display !== 'none') dup.style.display = 'none';
      }
    } catch(e) {}
  }
  setInterval(sweep, 600);
  sweep();
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
      b.textContent = f[0];
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

  /* Kit: Suno hat gaya — user ne 4 naye features chunein (fav/copy/wallpaper/likes) */
  function sherId(s) {
    var h2 = 5381;
    for (var i = s.length - 1; i >= 0; i--) h2 = ((h2 * 33) ^ s.charCodeAt(i)) >>> 0;
    return 'sh' + h2.toString(36);
  }
  function sherFetch(url, opts) {
    try {
      var m = window.vellum;
      if (m && typeof m.fetch === 'function') return m.fetch(url, opts);
    } catch (e) {}
    return fetch(url, opts);
  }
  function getFavs() { try { return JSON.parse(localStorage.getItem('sq-sher-favs') || '[]'); } catch (e) { return []; } }
  function setFavs(a) { try { localStorage.setItem('sq-sher-favs', JSON.stringify(a)); } catch (e) {} }
  function getLiked() { try { return JSON.parse(localStorage.getItem('sq-sher-liked') || '[]'); } catch (e) { return []; } }
  function setLiked(a) { try { localStorage.setItem('sq-sher-liked', JSON.stringify(a)); } catch (e) {} }
  var likeStore = {};
  function refreshLikes() {
    sherFetch('/v1/x/sher-likes').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { likeStore = j || {}; paintLikes(); }).catch(function () {});
  }
  function paintLikes() {
    Array.prototype.forEach.call(document.querySelectorAll('.sq-like-count'), function (sp) {
      sp.textContent = likeStore[sp.dataset.sid] || 0;
    });
  }
  function favTabRefresh() {
    var t2 = document.getElementById('sq-fav-tab');
    if (t2) t2.innerHTML = '\u2764\uFE0F Pasand (' + getFavs().length + ')';
  }
  function sherWallpaper(sh) {
    var c = document.createElement('canvas'); c.width = 1080; c.height = 1080;
    var x = c.getContext('2d'); if (!x) return;
    var g = x.createLinearGradient(0, 0, 1080, 1080);
    g.addColorStop(0, '#1a0f26'); g.addColorStop(0.5, '#2b1230'); g.addColorStop(1, '#0d0714');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1080);
    x.strokeStyle = 'rgba(240,201,106,.55)'; x.lineWidth = 3; x.strokeRect(40, 40, 1000, 1000);
    x.strokeStyle = 'rgba(240,201,106,.25)'; x.lineWidth = 1; x.strokeRect(52, 52, 976, 976);
    x.fillStyle = '#f5e9d8'; x.textAlign = 'center';
    x.font = '46px "Noto Nastaliq Urdu", serif';
    var y = 500;
    sh.split(' | ').forEach(function (ln) { try { x.direction = 'rtl'; } catch (e) {} x.fillText(ln, 540, y); y += 100; });
    x.fillStyle = '#f0c96a'; x.font = '30px Georgia, serif';
    x.fillText('\u2014 Saqib Iqbal \u2014', 540, 960);
    var a = document.createElement('a');
    a.download = 'sher-saqib-iqbal.png';
    a.href = c.toDataURL('image/png');
    document.body.appendChild(a); a.click(); a.remove();
  }
  function renderSherCard(sh, grid) {
    var parts = sh.split(' | ');
    var sid = sherId(sh);
    var card = document.createElement('div');
    card.className = 'sq-sher-card';
    var p = document.createElement('p');
    p.className = 'sq-sher';
    var l1 = document.createElement('span'); l1.textContent = parts[0];
    var br = document.createElement('br');
    var l2 = document.createElement('span'); l2.textContent = parts[1];
    p.appendChild(l1); p.appendChild(br); p.appendChild(l2);
    if (parts[2]) {
      var em = document.createElement('span');
      em.className = 'sq-sher-emoji';
      em.textContent = ' ' + parts[2];
      p.appendChild(em);
    }
    var actRow = document.createElement('div');
    actRow.className = 'sq-sher-actions';
    function mk(cls, label) { var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-suno-btn ' + cls; b.innerHTML = label; return b; }
    var favB = mk('sq-favbtn', '\u2661 Pasand');
    function paintFav() { var on = getFavs().indexOf(sh) >= 0; favB.innerHTML = on ? '\u2764\uFE0F Pasand' : '\u2661 Pasand'; favB.classList.toggle('sq-on', on); }
    favB.onclick = function () {
      var a = getFavs(); var i = a.indexOf(sh);
      if (i >= 0) a.splice(i, 1); else a.unshift(sh);
      setFavs(a); paintFav(); favTabRefresh();
      if (active === '__fav') renderShers();
    };
    paintFav();
    var cpB = mk('sq-copybtn', '\uD83D\uDCCB Copy');
    cpB.onclick = function () {
      var txt = sh.split(' | ').join('\n') + '\n\n\u2014 Saqib Iqbal';
      var done = function () { cpB.innerHTML = '\u2705 Copy ho gaya'; setTimeout(function () { cpB.innerHTML = '\uD83D\uDCCB Copy'; }, 1600); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
        else done();
      } catch (e) { done(); }
    };
    var wpB = mk('sq-wallbtn', '\uD83D\uDDBC\uFE0F Wallpaper');
    wpB.onclick = function () { try { sherWallpaper(sh); } catch (e) {} };
    var lkB = mk('sq-likebtn', '\uD83D\uDD25 Like \u00B7 <span class="sq-like-count" data-sid="' + sid + '">' + (likeStore[sid] || 0) + '</span>');
    function paintLike() {
      var on = getLiked().indexOf(sid) >= 0;
      lkB.classList.toggle('sq-on', on);
      lkB.innerHTML = (on ? '\u2764\uFE0F Liked' : '\uD83D\uDD25 Like') + ' \u00B7 <span class="sq-like-count" data-sid="' + sid + '">' + (likeStore[sid] || 0) + '</span>';
    }
    lkB.onclick = function () {
      var a = getLiked(); var undo = a.indexOf(sid) >= 0;
      if (undo) a.splice(a.indexOf(sid), 1); else a.push(sid);
      setLiked(a);
      likeStore[sid] = Math.max(0, (likeStore[sid] || 0) + (undo ? -1 : 1));
      paintLike();
      sherFetch('/v1/x/sher-likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sid, undo: undo }) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j[sid] !== undefined) { likeStore[sid] = j[sid]; paintLikes(); } })
        .catch(function () {});
    };
    paintLike();
    var shBtn = mk('sq-share-btn', '\u2197 WhatsApp');
    shBtn.setAttribute('aria-label', 'Sher WhatsApp par share karein');
    shBtn.onclick = function () {
      var txt = sh.split(' | ').join('\n') + '\n\n\u2014 Saqib Iqbal\nhttps://saqib-iqbal.vercel.app/';
      window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    };
    actRow.appendChild(favB); actRow.appendChild(cpB); actRow.appendChild(wpB); actRow.appendChild(lkB); actRow.appendChild(shBtn);
    card.appendChild(actRow);
    card.appendChild(p);
    grid.appendChild(card);
  }
  function renderSherList(list) {
    sherGrid.innerHTML = '';
    if (!list.length) {
      var e = document.createElement('p');
      e.style.cssText = 'text-align:center;opacity:.6;padding:30px 0';
      e.textContent = 'Abhi koi sher pasand nahi kiya \u2014 kisi sher par \u2661 Pasand dabayen';
      sherGrid.appendChild(e);
      return;
    }
    list.forEach(function (sh) { renderSherCard(sh, sherGrid); });
    refreshLikes();
  }
  function renderShers() {
    if (active === '__fav') { renderSherList(getFavs()); return; }
    var cat = CATS.filter(function (c) { return c[0] === active; })[0] || CATS[0];
    renderSherList(cat[3]);
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

    /* ---- Lock: poetry password se protected hai (Kit: user request) ---- */
    var LOCK_PW = 'love';
    var unlocked = false;
    /* ---- Gallery-style overlay lock (v68: user ask — poetry lock photo/gallery ki tarah) ---- */
    var ov = null;
    var pendingPanel = null;
    function poetryOv() {
      if (ov && document.body.contains(ov)) return ov;
      if (!document.getElementById('sq-poetry-ov-style')) {
        var st = document.createElement('style');
        st.id = 'sq-poetry-ov-style';
        st.textContent = '#sq-poetry-ov{position:fixed;inset:0;z-index:11050;background:rgba(8,3,14,.97);display:flex;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}'
          + '#sq-poetry-ov-card{background:rgba(24,10,34,.98);border:1px solid #f0c96a;border-radius:14px;padding:24px 20px;width:min(88vw,320px);color:#fff;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.6)}'
          + '#sq-poetry-ov-card h3{margin:0 0 6px;font-size:16px;color:#f0c96a}#sq-poetry-ov-card p{margin:0 0 14px;font-size:12px;opacity:.7}'
          + '#sq-poetry-ov-in{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:9px;border:1px solid #ffffff30;background:#ffffff10;color:#fff;font-size:14px;text-align:center}'
          + '#sq-poetry-ov-in::placeholder{color:#ffffff60}'
          + '#sq-poetry-ov-btn{width:100%;margin-top:10px;padding:11px;border-radius:9px;border:none;background:#f0c96a;color:#1a0f26;font-weight:700;cursor:pointer;font-size:14px;font-family:inherit}'
          + '#sq-poetry-ov-err{display:none;color:#ff6b81;font-size:12.5px;margin-top:10px}'
          + '#sq-poetry-ov-back{width:100%;margin-top:8px;padding:11px;border-radius:9px;border:1px solid rgba(240,201,106,.4);background:transparent;color:#f0c96a;font-weight:600;cursor:pointer;font-size:14px;font-family:inherit}';
        document.head.appendChild(st);
      }
      ov = document.createElement('div');
      ov.id = 'sq-poetry-ov';
      ov.innerHTML = '<div id="sq-poetry-ov-card"><h3>\u{1F512} Poetry</h3><p>Ye poetry password se mehfooz hai</p>'
        + '<input id="sq-poetry-ov-in" type="password" placeholder="Password" autocomplete="off">'
        + '<button id="sq-poetry-ov-btn" type="button">Unlock</button>'
        + '<div id="sq-poetry-ov-err">Ghalat password \u2014 dobara koshish karein.</div>'
        + '<button id="sq-poetry-ov-back" type="button">\u2B05 Wapis jayein</button></div>';
      document.body.appendChild(ov);
      var inp = ov.querySelector('#sq-poetry-ov-in');
      var err = ov.querySelector('#sq-poetry-ov-err');
      function tryUnlock() {
        if (String(inp.value || '').trim().toLowerCase() === LOCK_PW) {
          unlocked = true;
          var target = pendingPanel;
          pendingPanel = null;
          closeOv();
          if (target) openPanel(target);
        } else {
          err.style.display = 'block';
          inp.value = '';
          try { inp.focus(); } catch (e) {}
        }
      }
      ov.querySelector('#sq-poetry-ov-btn').addEventListener('click', tryUnlock);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); tryUnlock(); } });
      ov.querySelector('#sq-poetry-ov-back').addEventListener('click', function () { closeOv(); });
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 100);
      return ov;
    }
    function closeOv() {
      if (ov) { try { ov.remove(); } catch (e) {} ov = null; }
    }

    /* ---- Cards (My Memories pattern): Sher pehle, phir Ghazal ---- */
    var cards = document.createElement('div');
    cards.className = 'sq-poetry-cards';
    var sherTotal = CATS.reduce(function (n, c) { return n + c[3].length; }, 0);
    function makeCard(title, sub) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sq-poetry-card';
      b.innerHTML = '<span class="sq-poetry-cardtitle">' + title + '</span><span class="sq-poetry-cardsub">' + sub + '</span>';
      return b;
    }
    var cardSher = makeCard('Sher', sherTotal + ' SHERS \u00B7 ' + CATS.length + ' CATEGORIES');
    var cardGhaz = makeCard('Ghazal', GHAZALS.length + ' GHAZALS \u00B7 CATEGORIZED');
    cards.appendChild(cardSher);
    cards.appendChild(cardGhaz);

    /* ---- Section 1: Sher ---- */
    var sher = makeSection('sq-poetry-sher', 'Sher', 'Dil se parhein — aur apni pasand ka font chunein');
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
    var favTab = document.createElement('button');
    favTab.type = 'button';
    favTab.className = 'sq-poetry-tab';
    favTab.id = 'sq-fav-tab';
    favTab.innerHTML = '\u2764\uFE0F Pasand (0)';
    favTab.onclick = function () {
      active = '__fav';
      Array.prototype.forEach.call(tabs.children, function (x) { x.classList.remove('active'); });
      favTab.classList.add('active');
      renderShers();
    };
    tabs.appendChild(favTab);
    favTabRefresh();
    sher.appendChild(tabs);
    sher.appendChild(sherGrid);

    /* ---- Section 2: Ghazal (attached under the same Poetry section) ---- */
    var ghaz = makeSection('sq-poetry-ghazal', 'Ghazal', 'Mukammal ghazlein — apni pasand ka font yahan bhi chalega');
    ghaz.appendChild(fontRow());
    ghaz.appendChild(ghazGrid);

    /* ---- Card clicks: ek waqt mein ek panel khulta hai, dobara click par band ---- */
    function closePanels() {
      sher.style.display = 'none';
      ghaz.style.display = 'none';
      cardSher.classList.remove('active');
      cardGhaz.classList.remove('active');
    }
    function openPanel(which) {
      closePanels();
      (which === 'sher' ? sher : ghaz).style.display = '';
      (which === 'sher' ? cardSher : cardGhaz).classList.add('active');
      try { (which === 'sher' ? sher : ghaz).scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
    }
    function showLock(which) {
      pendingPanel = which;
      try { poetryOv(); } catch (e) {}
    }
    cardSher.onclick = function () {
      if (!unlocked) { showLock('sher'); return; }
      if (sher.style.display !== 'none') { closePanels(); return; }
      openPanel('sher');
    };
    cardGhaz.onclick = function () {
      if (!unlocked) { showLock('ghazal'); return; }
      if (ghaz.style.display !== 'none') { closePanels(); return; }
      openPanel('ghazal');
    };

    function applyLock() {
      cards.style.display = '';
      if (!unlocked) closePanels();
    }

    /* ---- Poetry wrapper (like My Memories) ---- */
    var wrap = document.createElement('section');
    wrap.className = 'section sq-sec';
    wrap.id = 'sq-poetry';
    var whead = document.createElement('div');
    whead.className = 'section-header';
    whead.innerHTML = '<span class="mono-label">04 \u2014 Poetry</span>';
    var wsub = document.createElement('p');
    wsub.className = 'contact-sub';
    wsub.textContent = 'Sher aur Ghazal — ek hi chhat ke neeche';
    whead.appendChild(wsub);
    wrap.appendChild(whead);
    wrap.appendChild(cards);
    wrap.appendChild(sher);
    wrap.appendChild(ghaz);
    parent.appendChild(wrap);

    closePanels();
    applyLock();
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

  var SHOW_FIRST = 3; // pehle sirf 3 tracks nazar aayein, baqi 'See more' par
  var expandedCats = {};
  function renderList() {
    var host = els.list;
    host.innerHTML = '';
    var cat = active; // current playlist id
    var expanded = !!expandedCats[cat];
    var all = list();
    all.forEach(function (t, i) {
      if (!expanded && i >= SHOW_FIRST && i !== cur) return;
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
    var oldMore = document.getElementById('sq-music-more');
    if (oldMore) oldMore.remove();
    if (all.length > SHOW_FIRST) {
      var more = document.createElement('button');
      more.type = 'button';
      more.id = 'sq-music-more';
      more.className = 'sq-music-more';
      more.textContent = expanded
        ? '\u2014 Kam karein (See less) \u2014'
        : '\u2014 See more (' + (all.length - SHOW_FIRST) + ' baqi) \u2014';
      more.onclick = function () {
        expandedCats[cat] = !expanded;
        renderList();
      };
      host.appendChild(more);
    }
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
    var oldMusic = q('#music'); // original in-app Music section (replaced by rich player)
    // wait until the poetry sections exist (or clearly never will) so Music lands after Ghazal
    if (!oldMusic && !parent.querySelector('#sq-poetry-ghazal') && !parent.querySelector('#sq-music')) {
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
    head.innerHTML = '<h2>06 \u2014 Music</h2>';
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

    if (oldMusic && oldMusic.parentNode) oldMusic.parentNode.insertBefore(sec, oldMusic); else parent.appendChild(sec);
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
    var poetrySec = q('#sq-poetry');
    if (poetrySec && poetrySec.parentNode === parent) parent.insertBefore(sec, poetrySec);
    else parent.insertBefore(sec, host.nextSibling);
  }, 600);
})();

/* hireMe pill: ab Saqib World hub tile hai */

(function visitorMap(){
  return; // Visitor Map removed on user request
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
    head.innerHTML = '<h2>09 \u2014 Visitor Map</h2>';
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
    var gallerySec = q('#gallery');
    if (gallerySec && gallerySec.parentNode) gallerySec.parentNode.insertBefore(sec, gallerySec.nextSibling);
    else {
      var musicSec = q('#sq-music');
      if (musicSec && musicSec.parentNode === parent) parent.insertBefore(sec, musicSec);
      else parent.appendChild(sec);
    }

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
    var host = q('#sq-hearts');
    if (!host || !host.parentNode) return false;
    if (q('#sq-user-sher')) return true;
    var sec = mkSec('sq-user-sher', '07 \u2014 Aap ka Sher', 'Apna sher likhein — approve hone ke baad yahan sab dekhenge');
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
    host.parentNode.insertBefore(sec, host.nextSibling);

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
    var host = q('#gallery'); // Deewar e Dil lands right after My Memories
    if (host) host = { parentNode: host.parentNode, nextSibling: host.nextSibling };
    if (!host || !host.parentNode) return false;
    if (q('#sq-hearts')) return true;
    var sec = mkSec('sq-hearts', '12 \u2014 Deewar e Dil', 'Tap karein, dil lagayein — sab dilon ki ginti sab ko nazar aati hai');
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
    host.parentNode.insertBefore(sec, host.nextSibling);
    var sent = false;
    fetch('/v1/x/hearts').then(function (r) { return r.json(); }).then(function (d) { cnt.textContent = Number((d && d.count) || 0).toLocaleString(); }).catch(function () { cnt.textContent = '0'; });
    big.onclick = function () {
      var EMO = ['\u2764\uFE0F', '\u2764\uFE0F', '\u2764\uFE0F', '\uD83D\uDC95', '\uD83D\uDC9C'];
      for (var i = 0; i < 10; i++) {
        (function (i) {
          setTimeout(function () {
            var f = document.createElement('span');
            f.className = 'sq-heart-float';
            f.textContent = EMO[Math.floor(Math.random() * EMO.length)];
            f.style.left = (25 + Math.random() * 50) + '%';
            f.style.fontSize = (14 + Math.random() * 22) + 'px';
            f.style.marginLeft = (Math.random() * 36 - 18) + 'px';
            f.style.animationDuration = (0.9 + Math.random() * 0.7) + 's';
            big.appendChild(f);
            setTimeout(function () { f.remove(); }, 1800);
          }, i * 45);
        })(i);
      }
      big.classList.remove('sq-pop');
      void big.offsetWidth;
      big.classList.add('sq-pop');
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

  // Nav link pointing at the replaced in-app Music section now scrolls to the rich player
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href="#music"],[data-target="music"]') : null;
    if (!a) return;
    var t = q('#sq-music');
    if (t) { try { e.preventDefault(); } catch (err) {} t.scrollIntoView({ behavior: 'smooth' }); }
  }, true);

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
      ['\uD83C\uDFB5', 'Music', 'sq-music'],
      ['\u2764\uFE0F', 'Deewar e Dil', 'sq-hearts'],
      ['\uD83D\uDCDD', 'Aap ka Sher', 'sq-user-sher'],
      ['\uD83D\uDCF1', 'WhatsApp DPs', 'sq-dps'],
      ['\uD83D\uDCBC', 'Kaam poochein?', 'wa'],
      ['\uD83D\uDCC5', 'Aaj ka Target', 'sqx:target'],
      ['\u23F3', 'Countdown', 'sqx:countdown'],
      ['\uD83C\uDF19', 'Raat ka Sher', 'sqx:night'],
      ['\uD83C\uDFB5', 'Shuffle Naat', 'sqx:naat'],
      ['\uD83D\uDCAC', 'Apni Baat', 'sqx:baat'],
      ['\uD83D\uDCCA', 'Mood Diary', 'sqx:mood'],
      ['\uD83D\uDCD6', 'Aaj ki Ayat/Hadees', 'sqx:ayat'],
      ['\uD83D\uDCE8', 'Open When', 'sqx:openwhen'],
      ['\uD83C\uDF81', 'Gift Boxes', 'sqx:gifts'],
      ['\uD83C\uDFB0', 'Sher Roulette', 'sqx:roulette'],
      ['\uD83C\uDFA7', 'Scratch Card', 'sqx:scratch'],
      ['\uD83C\uDF19', 'Raat/Subah', 'sqx:daypart'],
      ['\uD83D\uDD10', 'Secret Vault', 'sqx:vault'],
      ['\u2764\uFE0F', 'Heartbeat Game', 'sqx:heartbeat'],
      ['\uD83D\uDC8B', 'Kiss Counter', 'sqx:kisses'],
      ['\uD83C\uDF9F\uFE0F', 'Date Tickets', 'sqx:tickets'],
      ['\uD83C\uDF7F', 'Movie Night', 'sqx:movie'],
      ['\uD83C\uDFB0', 'Surprise Machine', 'sqx:machine'],
      ['\uD83D\uDCF0', 'Postbox', 'sqx:postbox'],
      ['\uD83E\uDDF8', 'Memory Teddy', 'sqx:teddy'],
      ['\uD83E\uDE84', 'Magic Button', 'sqx:magic'],
      ['\uD83D\uDCF7', 'Then vs Now', 'sqx:thennow'],
      ['\u270D\uFE0F', 'Reply Back', 'sqx:replyback']
    ];
    var PAGE_SPLIT = 13;
    function makeTile(t, grid) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'sq-hub-tile';
      tile.innerHTML = '<span>' + t[0] + '</span>' + t[1];
      tile.onclick = function () {
        if (t[2].indexOf('sqx:') === 0) { var key = t[2].slice(4); setTimeout(function () { if (window.__sqHubFeature) window.__sqHubFeature(key); }, 120); return; }
        close();
        if (t[2] === 'wa') {
          window.open('https://wa.me/923134182952?text=' + encodeURIComponent('Assalam o Alaikum! Main aapki website dekhi \u2014 mujhe apne kaam ke baray mein batana tha.'), '_blank');
          return;
        }
        if (t[2] === 'sq-poetry-sher' || t[2] === 'sq-poetry-ghazal') {
          setTimeout(function () {
            var wrap = document.getElementById('sq-poetry');
            if (!wrap) return;
            var panel = document.getElementById(t[2]);
            if (!panel || panel.style.display === 'none') {
              var cs = wrap.querySelectorAll('.sq-poetry-card');
              if (cs.length) cs[t[2] === 'sq-poetry-sher' ? 0 : 1].click();
            }
            try { wrap.scrollIntoView({ behavior: 'smooth' }); } catch (e) {}
          }, 80);
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
    }
    var pageInfo = document.createElement('div');
    pageInfo.className = 'sq-f-note'; pageInfo.style.textAlign = 'center'; pageInfo.style.margin = '8px 0 0';
    var navRow = document.createElement('div');
    navRow.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:8px';
    var btnPrev = document.createElement('button'); btnPrev.type = 'button'; btnPrev.className = 'sq-f-btn2'; btnPrev.textContent = '\u2190 Wapas';
    var btnNext = document.createElement('button'); btnNext.type = 'button'; btnNext.className = 'sq-f-btn2'; btnNext.textContent = 'Aage \u2192';
    var page = 1;
    function showPage(p) {
      page = p;
      grid.innerHTML = '';
      var list = p === 1 ? TILES.slice(0, PAGE_SPLIT) : TILES.slice(PAGE_SPLIT);
      list.forEach(function (t) { makeTile(t, grid); });
      pageInfo.textContent = p === 1 ? '\u2B50 World' : '\u2728 Naya Zone';
      btnPrev.style.display = p === 1 ? 'none' : '';
      btnNext.style.display = p === 1 ? '' : 'none';
      panel.scrollTop = 0;
    }
    btnPrev.onclick = function () { showPage(1); };
    btnNext.onclick = function () { showPage(2); };
    navRow.appendChild(btnPrev); navRow.appendChild(btnNext);
    panel.appendChild(grid);
    panel.appendChild(pageInfo);
    panel.appendChild(navRow);
    showPage(1);
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

/* ===== Section order (user-chosen): bio, achievements, My Memories, Poetry, Quote, Music, Aap ka Sher, [CV], Guestbook, Quiz, Q&A, Deewar e Dil, Contact ===== */
(function reorderSections(){
  var ORDER = ['bio','achievements','gallery','sq-poetry','quote','sq-music','music','sq-user-sher','sq-daily-sher','guestbook','quiz','qa','sq-hearts','sq-zone','sq-funfacts','sq-working','sq-stack','sq-skills','sq-projects','sq-github','sq-status','contact'];
  var tries = 0;
  var t = setInterval(function(){
    tries++;
    var secs = [];
    for (var i = 0; i < ORDER.length; i++) {
      var el = document.getElementById(ORDER[i]);
      if (!el) { if (tries > 90) clearInterval(t); return; }
      secs.push(el);
    }
    clearInterval(t);
    for (var j = 0; j < secs.length; j++) {
      try { secs[j].parentNode.appendChild(secs[j]); } catch (e) {}
    }
  }, 600);
})();

/* ===== Kit: Saqib AI chat khulne par baaki floating buttons chhup jati hain — koi overlap nahi ===== */
(function () {
  'use strict';
  var FABS = ['sq-dock-btn', 'sq-hub-btn', 'sq-top-btn'];
  setInterval(function () {
    var panel = document.getElementById('sq-chat-panel');
    var open = false;
    try { open = !!(panel && window.getComputedStyle(panel).display !== 'none'); } catch (e) {}
    FABS.forEach(function (id) {
      var b = document.getElementById(id);
      if (!b) return;
      if (id === 'sq-hub-btn') {
        var gate = !document.getElementById('bio') && !document.getElementById('achievements');
        b.style.display = (open || gate) ? 'none' : '';
      } else {
        b.style.display = open ? 'none' : '';
      }
    });
  }, 350);
})();

/* ===== Kit: "App download" button — har page par, bottom-left (overlap-free) ===== */
(function () {
  'use strict';
  if (window.__sqAppBtn) return;
  window.__sqAppBtn = true;
  var deferred = null;
  try {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      var b = document.getElementById('sq-app-btn');
      if (b) b.textContent = '\uD83D\uDCF2 App install karein';
    });
  } catch (e) {}

  var st = document.createElement('style');
  st.textContent = [
    '#sq-app-btn{position:fixed;bottom:160px;left:14px;z-index:11000;border:1px solid rgba(233,123,156,.45);',
    'background:#0a0a0ecc;color:#f0c96a;backdrop-filter:blur(8px);border-radius:999px;padding:5px 12px;',
    'font:inherit;font-size:11px;cursor:pointer;box-shadow:0 4px 12px #0008;transition:transform .15s}',
    '#sq-app-btn:active{transform:scale(.94)}',
    '#sq-app-btn.sq-installed{display:none}',
    '#sq-app-overlay{position:fixed;inset:0;z-index:12000;background:#000a;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px}',
    '#sq-app-card{background:#12121a;border:1px solid rgba(233,123,156,.4);border-radius:16px;max-width:420px;width:100%;padding:22px;color:#e8e2d6;font:inherit}',
    '#sq-app-card h3{color:#f0c96a;margin:0 0 10px;font-size:17px}',
    '#sq-app-card li{margin:8px 0;font-size:14px;line-height:1.5}',
    '#sq-app-card .sq-app-x{float:right;background:none;border:none;color:#9a937f;font-size:20px;cursor:pointer}',
    '#sq-app-card .sq-app-note{margin-top:12px;font-size:12px;color:#9a937f}'
  ].join('');
  document.head.appendChild(st);

  function close() { var o = document.getElementById('sq-app-overlay'); if (o) o.remove(); }

  function openHowTo() {
    close();
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var steps = isIOS
      ? '<li>\u2460 Safari mein neeche <b>Share</b> \u29C9 button dabayen</li>' +
        '<li>\u2461 <b>"Add to Home Screen"</b> chunein</li>' +
        '<li>\u2462 <b>Add</b> dabayen \u2014 app ban jayegi \uD83C\uDF1F</li>'
      : '<li>\u2460 Chrome mein upar right \u22EE <b>(teen dot)</b> dabayen</li>' +
        '<li>\u2461 <b>"Add to Home screen"</b> ya <b>"Install app"</b> chunein</li>' +
        '<li>\u2462 <b>Install</b> dabayen \u2014 app ban jayegi \uD83C\uDF1F</li>';
    var ov = document.createElement('div');
    ov.id = 'sq-app-overlay';
    ov.innerHTML = '<div id="sq-app-card">' +
      '<button class="sq-app-x" type="button" aria-label="Band karein">\u00D7</button>' +
      '<h3>\uD83D\uDCF2 App ban jayen \u2014 10 second mein</h3>' +
      '<ol style="padding-left:18px">' + steps + '</ol>' +
      '<div class="sq-app-note">Ye website aap ke phone par app ki tarah install ho jayegi \u2014 apna icon, full screen, bilkul app jaisi.</div>' +
      '</div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.sq-app-x').addEventListener('click', close);
    document.body.appendChild(ov);
  }

  function build() {
    if (!document.body) return false;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'sq-app-btn';
    b.textContent = '\uD83D\uDCF2 App';
    b.setAttribute('aria-label', 'Website ko app ki tarah install karein');
    b.addEventListener('click', function () {
      if (deferred) { deferred.prompt(); deferred = null; }
      else openHowTo();
    });
    document.body.appendChild(b);
    try {
      if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
        b.classList.add('sq-installed');
      }
    } catch (e) {}
    return true;
  }
  var tries = 0;
  var t = setInterval(function () { tries++; if (build() || tries > 40) clearInterval(t); }, 500);
})();

/* ===== Kit: Normal / Full site mode — Normal mein personal sections chhupe, Full (password "Love") mein sab ===== */
(function () {
  'use strict';
  if (window.__sqMode) return;
  window.__sqMode = true;

  var SECTIONS = ['sq-poetry', 'sq-daily-sher', 'sq-user-sher', 'sq-hearts', 'qa'];

  var st = document.createElement('style');
  st.textContent = [
    'body.sq-normal .sq-full-only > :not(.sq-mode-teaser){display:none!important}',
    '.sq-mode-teaser{display:none!important}',
    'body.sq-normal .sq-mode-teaser{display:block!important}',
    '.sq-mode-teaser{background:#12121a;border:1px solid rgba(233,123,156,.35);border-radius:14px;padding:26px 18px;text-align:center;color:#b9b2a0;font:inherit}',
    '.sq-mode-teaser .sq-mt-ico{font-size:30px;margin-bottom:8px}',
    '.sq-mode-teaser .sq-mt-t{color:#f0c96a;font-size:16px;margin-bottom:6px}',
    '.sq-mode-teaser .sq-mt-btn{margin-top:14px;background:linear-gradient(135deg,#e97b9c,#d9a94e);color:#fff;border:none;border-radius:999px;padding:10px 22px;font:inherit;font-size:14px;cursor:pointer}',
    '#sq-mode-btn{position:fixed;bottom:118px;left:14px;z-index:11000;border:1px solid rgba(240,201,106,.5);background:#0a0a0ecc;color:#f0c96a;backdrop-filter:blur(8px);border-radius:999px;padding:4px 11px;font:inherit;font-size:11px;cursor:pointer;box-shadow:0 4px 12px #0008;transition:transform .15s}',
    '#sq-mode-btn:active{transform:scale(.94)}',
    '#sq-mode-btn.sq-full-on{color:#5fdc8a;border-color:rgba(95,220,138,.5)}',
    '#sq-mode-ov{position:fixed;inset:0;z-index:12000;background:#000a;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px}',
    '#sq-mode-card{background:#12121a;border:1px solid rgba(233,123,156,.4);border-radius:16px;max-width:380px;width:100%;padding:22px;color:#e8e2d6;font:inherit}',
    '#sq-mode-card h3{color:#f0c96a;margin:0 0 8px;font-size:17px}',
    '#sq-mode-card input{width:100%;box-sizing:border-box;margin-top:10px;background:#16161f;border:1px solid #2e2e3a;border-radius:10px;padding:11px 13px;color:#e8e2d6;font:inherit;font-size:14px;outline:none}',
    '#sq-mode-card input:focus{border-color:#e97b9c}',
    '#sq-mode-err{color:#ff8f8f;font-size:13px;margin-top:8px;display:none}',
    '#sq-mode-card .sq-mb-row{display:flex;gap:8px;margin-top:12px}',
    '#sq-mode-card button.sq-mb{flex:1;border:none;border-radius:999px;padding:10px;font:inherit;font-size:14px;cursor:pointer}',
    '#sq-mode-card .sq-mb-ok{background:linear-gradient(135deg,#e97b9c,#d9a94e);color:#fff}',
    '#sq-mode-card .sq-mb-no{background:#22222c;color:#9a937f}'
  ].join('');
  document.head.appendChild(st);

  function modeGet() { try { return localStorage.getItem('sq-site-mode') || 'full'; } catch (e) { return 'full'; } }
  function modeSet(m) { try { localStorage.setItem('sq-site-mode', m); try { localStorage.setItem('sq-mode-chosen', '1'); } catch (e) {} } catch (e) {} }

  function applyMode() {
    var m = modeGet();
    document.body.classList.toggle('sq-normal', m === 'normal');
    var b = document.getElementById('sq-mode-btn');
    if (b) {
      b.textContent = m === 'full' ? '\u2606 Full mode ON' : '\u2605 Full mode';
      b.classList.toggle('sq-full-on', m === 'full');
    }
  }

  function closeOv() { var o = document.getElementById('sq-mode-ov'); if (o) o.remove(); }

  function toggle() {
    modeSet(modeGet() === 'full' ? 'normal' : 'full');
    applyMode();
  }

  function tagSections() {
    SECTIONS.forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec || sec.classList.contains('sq-full-only')) return;
      sec.classList.add('sq-full-only');
      var t = document.createElement('div');
      t.className = 'sq-mode-teaser';
      t.innerHTML = '<div class="sq-mt-ico">\uD83D\uDD12</div>' +
        '<div class="sq-mt-t">Ye Full mode mein hai</div>' +
        '<div>Normal mode mein kuch personal cheezein chhupi hui hain.</div>' +
        '<button class="sq-mt-btn" type="button">\u2605 Full mode on karein</button>';
      t.querySelector('.sq-mt-btn').addEventListener('click', toggle);
      sec.insertBefore(t, sec.firstChild);
    });
  }

  function build() {
    if (!document.body) return false;
    try {
      if ((localStorage.getItem('portfolio-auth-token') || '') && localStorage.getItem('sq-mode-chosen') !== '1') {
        localStorage.setItem('sq-site-mode', 'full');
      }
    } catch (e) {}
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'sq-mode-btn';
    b.setAttribute('aria-label', 'Normal ya Full mode');
    b.addEventListener('click', toggle);
    document.body.appendChild(b);
    applyMode();
    return true;
  }
  var tries = 0;
  var t = setInterval(function () {
    tries++;
    if (build()) {
      clearInterval(t);
      var t2 = setInterval(function () { tagSections(); }, 1200);
      setTimeout(function () { clearInterval(t2); tagSections(); }, 60000);
    }
    if (tries > 40) clearInterval(t);
  }, 500);
})();

/* ===== Kit: Performance lite — kamzor phone par blur/animations band, sections render sirf jab nazar aayen ===== */
(function () {
  'use strict';
  if (window.__sqPerf) return;
  window.__sqPerf = true;
  var weak = false;
  try {
    weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
           (navigator.deviceMemory && navigator.deviceMemory <= 4);
  } catch (e) {}
  /* sab devices: screen se bahar sections render na hon — lambe page par bari bachat */
  var universal = document.createElement('style');
  universal.textContent = 'section,.section{content-visibility:auto;contain-intrinsic-size:auto 600px}';
  document.head.appendChild(universal);
  if (!weak) return;
  var st = document.createElement('style');
  st.textContent = [
    'body.sq-lite *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
    'body.sq-lite section, body.sq-lite .section{content-visibility:auto;contain-intrinsic-size:auto 600px}',
    'body.sq-lite *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.1s!important}',
    'body.sq-lite .sq-heart-float{animation-duration:1s!important}',
    'body.sq-lite .sq-hearts-btn.sq-pop{animation-duration:.3s!important}'
  ].join('');
  document.head.appendChild(st);
  document.body.classList.add('sq-lite');
})();

/* ===== Kit: Saqib World ke 7 naye features (Target, Countdown, Raat ka Sher, Shuffle Naat, Apni Baat, Mood Diary, Ayat/Hadees) ===== */
(function () {
  'use strict';
  if (window.__sqHubFeatures) return;
  window.__sqHubFeatures = true;

  function lsG(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function me() {
    try {
      var t = (localStorage.getItem('portfolio-auth-token') || '').split('.')[0];
      if (!t) return null;
      return JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g, '+').replace(/_/g, '/')))));
    } catch (e) { return null; }
  }
  function isOwner() { var u = me(); return !!(u && String(u.email).toLowerCase() === 'fizanali6267@gmail.com'); }
  function dayIndex() { var d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000) + d.getFullYear(); }

  var st = document.createElement('style');
  st.textContent = [
    '#sq-feat-ov{position:fixed;inset:0;z-index:12000;background:#000a;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px}',
    '#sq-feat-card{background:#12121a;border:1px solid rgba(233,123,156,.4);border-radius:16px;max-width:420px;width:100%;max-height:82vh;overflow-y:auto;padding:20px;color:#e8e2d6;font:inherit;box-sizing:border-box}',
    '#sq-feat-card h3{color:#f0c96a;margin:0 0 12px;font-size:17px;padding-right:24px}',
    '#sq-feat-card .sq-fx{position:absolute;float:right;margin-top:-30px;background:none;border:none;color:#9a937f;font-size:20px;cursor:pointer}',
    '.sq-f-in{width:100%;box-sizing:border-box;background:#16161f;border:1px solid #2e2e3a;border-radius:10px;padding:10px 12px;color:#e8e2d6;font:inherit;font-size:14px;outline:none;margin:5px 0}',
    '.sq-f-in:focus{border-color:#e97b9c}',
    '.sq-f-btn{background:linear-gradient(135deg,#e97b9c,#d9a94e);color:#fff;border:none;border-radius:999px;padding:9px 20px;font:inherit;font-size:14px;cursor:pointer;margin:4px 4px 0 0}',
    '.sq-f-btn2{background:#22222c;color:#c9c2b0;border:none;border-radius:999px;padding:9px 18px;font:inherit;font-size:13px;cursor:pointer;margin:4px 0}',
    '.sq-f-row{display:flex;gap:6px;align-items:center;padding:7px 9px;background:#16161f;border-radius:9px;margin:5px 0;font-size:13px}',
    '.sq-f-row button{background:none;border:none;cursor:pointer;font-size:15px;color:#c9c2b0}',
    '.sq-f-row.done span{text-decoration:line-through;opacity:.5}',
    '.sq-f-big{font-size:22px;color:#f0c96a;text-align:center;padding:10px;line-height:1.9}',
    '.sq-f-note{font-size:12px;color:#9a937f;margin-top:10px;line-height:1.5}',
    '.sq-f-cd{display:flex;gap:6px;justify-content:center;margin:12px 0}',
    '.sq-f-cd div{background:#16161f;border-radius:10px;padding:8px 6px;min-width:56px;text-align:center}',
    '.sq-f-cd b{display:block;font-size:20px;color:#f0c96a}',
    '.sq-f-cd span{font-size:10px;color:#9a937f}',
    '.sq-f-moods{display:flex;gap:6px;justify-content:center;margin:10px 0}',
    '.sq-f-moods button{background:#16161f;border:1px solid #2e2e3a;border-radius:12px;padding:8px 6px;font-size:18px;cursor:pointer;flex:1}',
    '.sq-f-moods button.on{border-color:#f0c96a;background:#241d12}',
    '.sq-f-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:8px}',
    '.sq-f-cal span{font-size:13px;text-align:center;padding:3px 0;border-radius:6px;background:#16161f}',
    '.sq-f-cal span.h{background:none;color:#6d675a;font-size:9px;line-height:2.4}'
  ].join('');
  document.head.appendChild(st);

  function close() { var o = document.getElementById('sq-feat-ov'); if (o) o.remove(); }
  function modal(title, build) {
    close();
    var ov = document.createElement('div'); ov.id = 'sq-feat-ov';
    var card = document.createElement('div'); card.id = 'sq-feat-card';
    var x = document.createElement('button'); x.className = 'sq-fx'; x.type = 'button'; x.innerHTML = '\u00D7';
    x.setAttribute('aria-label', 'Band karein'); x.onclick = close;
    var h = document.createElement('h3'); h.textContent = title; h.appendChild(x);
    card.appendChild(h);
    build(card);
    ov.appendChild(card);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov);
    return card;
  }

  /* ---- 1. Aaj ka Target ---- */
  function target() {
    modal('\uD83D\uDCC5 Aaj ka Target', function (c) {
      var data = lsG('sq-targets', {});
      var t = today();
      function streak() {
        var n = 0; var d = new Date();
        if (!((data[today()] || []).some(function (x) { return x.d; }))) d.setDate(d.getDate() - 1);
        for (;;) {
          var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          if ((data[k] || []).some(function (x) { return x.d; })) { n++; d.setDate(d.getDate() - 1); } else break;
          if (n > 365) break;
        }
        return n;
      }
      function render() {
        c.querySelectorAll('.sq-f-list,.sq-f-streak').forEach(function (e) { e.remove(); });
        var s = document.createElement('div'); s.className = 'sq-f-streak sq-f-note';
        s.textContent = '\uD83D\uDD25 Streak: ' + streak() + ' din \u2014 rozana kam az kam ek target poora karein';
        c.appendChild(s);
        var l = document.createElement('div'); l.className = 'sq-f-list';
        (data[t] || []).forEach(function (item, i) {
          var r = document.createElement('div'); r.className = 'sq-f-row' + (item.d ? ' done' : '');
          var b = document.createElement('button'); b.type = 'button'; b.textContent = item.d ? '\u2705' : '\u2B1C';
          b.onclick = function () { item.d = item.d ? 0 : 1; lsS('sq-targets', data); render(); };
          var sp = document.createElement('span'); sp.textContent = ' ' + item.t;
          r.appendChild(b); r.appendChild(sp); l.appendChild(r);
        });
        if (!(data[t] || []).length) { var e = document.createElement('div'); e.className = 'sq-f-note'; e.textContent = 'Aaj ka target likh kar add karein \u2014 choti cheez, rozana.'; l.appendChild(e); }
        c.appendChild(l);
      }
      var inp = document.createElement('input'); inp.className = 'sq-f-in'; inp.placeholder = 'Aaj ka target likhein...'; inp.maxLength = 120;
      var add = document.createElement('button'); add.className = 'sq-f-btn'; add.type = 'button'; add.textContent = 'Add karein';
      add.onclick = function () {
        var v = inp.value.trim(); if (!v) return;
        data[t] = data[t] || []; data[t].unshift({ t: v.slice(0, 120), d: 0 });
        lsS('sq-targets', data); inp.value = ''; render();
      };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') add.click(); });
      c.appendChild(inp); c.appendChild(add);
      render();
    });
  }

  /* ---- 2. Countdown ---- */
  function countdown() {
    var saved = lsG('sq-countdown', null);
    modal('\u23F3 Countdown Corner', function (c) {
      var iv = null;
      function renderCd() {
        c.querySelectorAll('.sq-f-cd,.sq-f-note2,.sq-f-big').forEach(function (e) { e.remove(); });
        if (saved && saved.iso) {
          var d = new Date(saved.iso + 'T00:00:00');
          if (iv) clearInterval(iv);
          var box = document.createElement('div'); box.className = 'sq-f-cd';
          var lab = document.createElement('div'); lab.className = 'sq-f-big'; lab.style.fontSize = '15px'; lab.textContent = '\uD83C\uDFAF ' + (saved.label || 'Khaas din');
          c.appendChild(lab); c.appendChild(box);
          function tick() {
            var diff = d - new Date();
            if (diff <= 0) { lab.textContent = '\uD83C\uDF89 ' + (saved.label || 'Din aa gaya!'); box.innerHTML = ''; clearInterval(iv); return; }
            var dd = Math.floor(diff / 86400000), hh = Math.floor(diff / 3600000) % 24, mm = Math.floor(diff / 60000) % 60, ss = Math.floor(diff / 1000) % 60;
            var parts = [[dd, 'din'], [hh, 'ghantay'], [mm, 'minute'], [ss, 'second']];
            box.innerHTML = parts.map(function (p) { return '<div><b>' + p[0] + '</b><span>' + p[1] + '</span></div>'; }).join('');
          }
          tick(); iv = setInterval(tick, 1000);
        } else {
          var e = document.createElement('div'); e.className = 'sq-f-note sq-f-note2'; e.textContent = 'Koi khaas din set nahi \u2014 neeche se set karein (result day, Eid, birthday...).'; c.appendChild(e);
        }
      }
      var lab = document.createElement('input'); lab.className = 'sq-f-in'; lab.placeholder = 'Kis din ka intezar hai? (jaise Result Day)'; lab.maxLength = 60; lab.value = saved && saved.label || '';
      var dt = document.createElement('input'); dt.className = 'sq-f-in'; dt.type = 'date';
      if (saved && saved.iso) dt.value = saved.iso;
      var set = document.createElement('button'); set.className = 'sq-f-btn'; set.type = 'button'; set.textContent = saved && saved.iso ? 'Update karein' : 'Set karein';
      var clr = document.createElement('button'); clr.className = 'sq-f-btn2'; clr.type = 'button'; clr.textContent = 'Hatao';
      set.onclick = function () {
        if (!dt.value) return;
        saved = { label: lab.value.trim().slice(0, 60), iso: dt.value };
        lsS('sq-countdown', saved); renderCd();
      };
      clr.onclick = function () { saved = null; lsS('sq-countdown', null); lab.value = ''; renderCd(); };
      c.appendChild(lab); c.appendChild(dt); c.appendChild(set); c.appendChild(clr);
      renderCd();
      var mo = new MutationObserver(function () { if (!document.getElementById('sq-feat-ov')) { clearInterval(iv); mo.disconnect(); } });
      mo.observe(document.body, { childList: true });
    });
  }

  /* ---- 3. Raat ka Sher ---- */
  function nightSher() {
    var cats = (window.__sqPoetryCats || []).filter(function (c) { return c[0] === 'zindagi'; });
    var pool = cats.length ? cats[0][3] : [];
    var sh = pool.length ? pool[dayIndex() % pool.length] : 'Neend bhi ek nemat hai \u2014 Shab ba khair \uD83C\uDF19';
    var parts = sh.split(' | ');
    modal('\uD83C\uDF19 Raat ka Sher', function (c) {
      var hr = new Date().getHours();
      var greet = hr >= 4 && hr < 12 ? 'Assalam o Alaikum \u2600\uFE0F' : hr >= 17 || hr < 4 ? 'Shab ba khair \uD83C\uDF19' : 'Assalam o Alaikum \uD83C\uDF1E';
      var g = document.createElement('div'); g.className = 'sq-f-note'; g.textContent = greet + ' \u2014 aaj raat ka sher:';
      c.appendChild(g);
      var p = document.createElement('div'); p.className = 'sq-f-big';
      p.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif"; p.style.direction = 'rtl';
      p.textContent = parts.join('\n');
      c.appendChild(p);
      var sig = document.createElement('div'); sig.style.cssText = 'text-align:center;font-size:12px;color:#e97b9c'; sig.textContent = '\u2014 Saqib Iqbal \u2014';
      c.appendChild(sig);
      var cp = document.createElement('button'); cp.className = 'sq-f-btn'; cp.type = 'button'; cp.textContent = '\uD83D\uDCCB Copy';
      cp.onclick = function () {
        try { navigator.clipboard.writeText(parts.join('\n') + '\n\n\u2014 Saqib Iqbal'); } catch (e) {}
        cp.textContent = '\u2705 Copy ho gaya';
        setTimeout(function () { cp.textContent = '\uD83D\uDCCB Copy'; }, 1600);
      };
      c.appendChild(cp);
    });
  }

  /* ---- 4. Shuffle Naat — music section ke tabs ko DOM se drive karta hai ---- */
  function shuffleNaat() {
    var sec = document.getElementById('sq-music');
    if (!sec) { modal('\uD83C\uDFB5 Shuffle Naat', function (c) { c.appendChild(Object.assign(document.createElement('div'), { className: 'sq-f-note', textContent: 'Music section load nahi hua \u2014 dobara koshish karein.' })); }); return; }
    try { sec.scrollIntoView({ behavior: 'smooth' }); } catch (e) {}
    var tabs = sec.querySelectorAll('.sq-poetry-tab');
    var naatTab = null;
    Array.prototype.forEach.call(tabs, function (tb) { if (tb.textContent.indexOf('Naat') >= 0 || tb.textContent.indexOf('\u0646\u0627\u062A') >= 0) naatTab = tb; });
    if (!naatTab && tabs.length > 2) naatTab = tabs[2];
    if (naatTab) naatTab.click();
    setTimeout(function () {
      var rows = sec.querySelectorAll('.sq-music-track');
      if (!rows.length) return;
      var pick = rows[Math.floor(Math.random() * rows.length)];
      pick.click();
      modal('\uD83C\uDFB5 Shuffle Naat', function (c) {
        var n = document.createElement('div'); n.className = 'sq-f-note';
        n.textContent = '\uD83C\uDFB5 random naat chal rahi hai \u2014 Music section mein player dekhein. Dobara shuffle karne ke liye tile dobara dabayen.';
        c.appendChild(n);
      });
    }, 450);
  }

  /* ---- 5. Apni Baat ---- */
  function apniBaat() {
    var owner = isOwner();
    modal('\uD83D\uDCAC Apni Baat', function (c) {
      var box = document.createElement('div'); box.className = 'sq-f-big';
      box.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif";
      var val = localStorage.getItem('sq-baat-text') || '';
      function paint() {
        box.textContent = val ? val : 'Abhi koi baat mehfooz nahi.';
      }
      if (owner) {
        var ta = document.createElement('textarea'); ta.className = 'sq-f-in'; ta.rows = 4; ta.maxLength = 300;
        ta.placeholder = 'Apni baat likhein... (visitors ko yahi nazar aayegi)';
        ta.value = val;
        var save = document.createElement('button'); save.className = 'sq-f-btn'; save.type = 'button'; save.textContent = 'Save karein';
        save.onclick = function () {
          val = ta.value.trim().slice(0, 300);
          try { localStorage.setItem('sq-baat-text', val); } catch (e) {}
          paint(); save.textContent = '\u2705 Mehfooz ho gaya';
          setTimeout(function () { save.textContent = 'Save karein'; }, 1600);
        };
        c.appendChild(ta); c.appendChild(save);
      }
      c.appendChild(box);
      var n = document.createElement('div'); n.className = 'sq-f-note';
      n.textContent = owner ? 'Ye baat hub ke har visitor ko nazar aayegi.' : 'Saqib ki aaj ki baat \u2014 roz badal sakti hai.';
      c.appendChild(n);
      paint();
    });
  }

  /* ---- 6. Mood Diary ---- */
  function moodDiary() {
    var MOODS = [['\uD83D\uDE2D', 'bura din'], ['\uD83D\uDE22', 'udaas'], ['\uD83D\uDE10', 'normal'], ['\uD83D\uDE42', 'acha'], ['\uD83D\uDE04', 'zabardast']];
    modal('\uD83D\uDCCA Mood Diary', function (c) {
      var data = lsG('sq-moods', {});
      var t = today();
      function paint() {
        c.querySelectorAll('.sq-f-moods,.sq-f-cal,.sq-f-note').forEach(function (e) { e.remove(); });
        var row = document.createElement('div'); row.className = 'sq-f-moods';
        MOODS.forEach(function (m, i) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = m[0];
          b.title = m[1];
          if (data[t] === i) b.classList.add('on');
          b.onclick = function () { data[t] = i; lsS('sq-moods', data); paint(); };
          row.appendChild(b);
        });
        c.appendChild(row);
        var n = document.createElement('div'); n.className = 'sq-f-note'; n.textContent = 'Aaj ka mood tick karein \u2014 neeche poora mahina nazar aa raha hai:'; c.appendChild(n);
        var cal = document.createElement('div'); cal.className = 'sq-f-cal';
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { var s = document.createElement('span'); s.className = 'h'; s.textContent = d; cal.appendChild(s); });
        var now = new Date(), y = now.getFullYear(), mo = now.getMonth();
        var first = new Date(y, mo, 1).getDay(), off = (first + 6) % 7;
        for (var i = 0; i < off; i++) cal.appendChild(document.createElement('span'));
        var last = new Date(y, mo + 1, 0).getDate();
        for (var dd = 1; dd <= last; dd++) {
          var k = y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
          var s2 = document.createElement('span');
          s2.textContent = data[k] !== undefined ? MOODS[data[k]][0] : dd;
          if (k === t) s2.style.outline = '2px solid #f0c96a';
          cal.appendChild(s2);
        }
        c.appendChild(cal);
      }
      paint();
    });
  }

  /* ---- 7. Aaj ki Ayat/Hadees ---- */
  var AYAT = [
    ['\u0625\u0650\u0646\u0651\u064E \u0645\u064E\u0639\u064E \u0627\u0644\u0652\u0639\u064F\u0633\u0652\u0631\u0650 \u064A\u064F\u0633\u0652\u0631\u064B\u0627', 'Mushkil ke sath aasani hai.', 'Surah Ash-Sharh 94:6'],
    ['\u0623\u064E\u0644\u064E\u0627 \u0628\u0650\u0630\u0650\u0643\u0652\u0631\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u062A\u064E\u0637\u0645\u064E\u0626\u0646\u0651\u064F \u0627\u0644\u0652\u0642\u064F\u0644\u064F\u0648\u0628\u064F', 'Dil Allah ke zikr se hi mutmaeen hote hain.', 'Surah Ar-Rad 13:28'],
    ['\u0648\u064E\u0625\u0650\u0630\u064E\u0627 \u0645\u064E\u0631\u0650\u0636\u0652\u062A\u064F \u0641\u064E\u0647\u064F\u0648\u064E \u064A\u064E\u0634\u0652\u0641\u0650\u064A\u0646\u0650', 'Main bimar hota hoon to wahi mujhe shifa deta hai.', 'Surah Ash-Shuara 26:80'],
    ['\u0641\u064E\u0625\u0650\u0646\u0651\u0650\u064A \u0642\u064E\u0631\u0650\u064A\u0628\u064C', 'Main (dua bulaune wale ki) dua ka qareeb hoon.', 'Surah Al-Baqarah 2:186'],
    ['\u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0646\u064F\u0648\u0631\u064F \u0627\u0644\u0633\u0651\u064E\u0645\u064E\u0627\u0648\u064E\u0627\u062A\u0650 \u0648\u064E\u0627\u0644\u0652\u0623\u064E\u0631\u0652\u0636\u0650', 'Allah zameen aur asman ka noor hai.', 'Surah An-Noor 24:35'],
    ['\u0648\u064E\u0639\u064E\u0633\u064E\u0649 \u0623\u064E\u0646 \u062A\u064E\u0643\u0652\u0631\u064E\u0647\u064F\u0648\u0627 \u0634\u064E\u064A\u0652\u0626\u064B\u0627 \u0648\u064E\u0647\u064F\u0648\u064E \u062E\u064E\u064A\u0652\u0631\u064C \u0644\u0651\u064E\u0643\u064F\u0645\u0652', 'Ho sakta hai koi cheez aap ko napasand ho magar wo aap ke liye behtar ho.', 'Surah Al-Baqarah 2:216'],
    ['\u0625\u0650\u0646\u0651\u064E\u0645\u064E\u0627 \u0627\u0644\u0652\u0623\u064E\u0639\u0652\u0645\u064E\u0627\u0644\u064F \u0628\u0650\u0627\u0644\u0646\u0651\u0650\u064A\u0651\u064E\u0627\u062A\u0650', 'Amaal ka anmoh dar niyyat hai.', 'Hadees \u2014 Bukhari & Muslim'],
    ['\u0627\u0644\u062F\u0651\u0650\u064A\u0646\u064F \u0627\u0644\u0646\u0651\u064E\u0635\u0650\u064A\u062D\u064E\u0629\u064F', 'Deen hi naseehat hai.', 'Hadees \u2014 Muslim'],
    ['\u0645\u064E\u0646\u0652 \u0643\u064E\u0627\u0646\u064E \u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F \u0628\u0650\u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0648\u064E\u0627\u0644\u0652\u064A\u064E\u0648\u0652\u0645\u0650 \u0627\u0644\u0652\u0622\u062E\u0650\u0631\u0650 \u0641\u064E\u0644\u0652\u064A\u064E\u0642\u064F\u0644\u0652 \u062E\u064E\u064A\u0652\u0631\u064B\u0627 \u0623\u064E\u0648\u0652 \u0644\u0650\u064A\u064E\u0635\u0652\u0645\u064F\u062A\u0652', 'Jo iman rakhta ho wo achha kahe ya khamosh rahe.', 'Hadees \u2014 Bukhari'],
    ['\u062E\u064E\u064A\u0652\u0631\u064F\u0643\u064F\u0645\u0652 \u0645\u064E\u0646\u0652 \u062A\u064E\u0639\u064E\u0644\u0651\u064E\u0645\u064E \u0627\u0644\u0652\u0642\u064F\u0631\u0652\u0622\u0646\u064E \u0648\u064E\u0639\u064E\u0644\u0651\u064E\u0645\u064E\u0647\u064F', 'Behtareen shakhs wo hai jo Quran seekhe aur doosron ko sikhaye.', 'Hadees \u2014 Bukhari'],
    ['\u062A\u064E\u0628\u064E\u0633\u0651\u064F\u0645\u064F\u0643\u064E \u0641\u0650\u064A \u0648\u064E\u062C\u0652\u0647\u0650 \u0623\u064E\u062E\u0650\u064A\u0643\u064E \u0635\u064E\u062F\u064E\u0642\u064E\u0629\u064C', 'Apne bhai ke samne muskurana bhi sadqa hai.', 'Hadees \u2014 Tirmizi'],
    ['\u0627\u0644\u0652\u0645\u064F\u0633\u0652\u0644\u0650\u0645\u064F \u0645\u064E\u0646\u0652 \u0633\u064E\u0644\u0650\u0645\u064E \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u0644\u0650\u0645\u064F\u0648\u0646\u064E \u0645\u0650\u0646\u0652 \u0644\u0650\u0633\u064E\u0627\u0646\u0650\u0647\u0650 \u0648\u064E\u064A\u064E\u062F\u0650\u0647\u0650', 'Muslaman wo hai jis se doosre log us ki zuban aur hath se mehfooz rahen.', 'Hadees \u2014 Bukhari'],
    ['\u0648\u064E\u062A\u064E\u0639\u064E\u0627\u0648\u064E\u0646\u064F\u0648\u0627 \u0639\u064E\u0644\u064E\u0649 \u0627\u0644\u0652\u0628\u0650\u0631\u0651\u0650 \u0648\u064E\u0627\u0644\u062A\u0651\u064E\u0642\u0652\u0648\u064E\u0649\u0670', 'Neeki aur taqwa par aapas mein madad karo.', 'Surah Al-Maida 5:2'],
    ['\u0627\u0644\u0635\u0651\u064E\u0628\u0652\u0631\u064F \u062C\u064F\u0644\u064E\u0627\u0621\u064C', 'Sabr jalanay ki dawa hai.', 'Hadees \u2014 Muslim']
  ];
  function ayat() {
    var a = AYAT[dayIndex() % AYAT.length];
    modal('\uD83D\uDCD6 Aaj ki Ayat / Hadees', function (c) {
      var ar = document.createElement('div'); ar.className = 'sq-f-big';
      ar.style.fontFamily = "'Amiri','Scheherazade New',serif"; ar.style.direction = 'rtl'; ar.style.fontSize = '26px';
      ar.textContent = a[0];
      c.appendChild(ar);
      var tr = document.createElement('div'); tr.style.cssText = 'text-align:center;font-size:15px;line-height:1.7'; tr.textContent = '\u201C' + a[1] + '\u201D';
      c.appendChild(tr);
      var rf = document.createElement('div'); rf.className = 'sq-f-note'; rf.style.textAlign = 'center'; rf.textContent = a[2];
      c.appendChild(rf);
    });
  }

  window.__sqHubFeature = function (key) {
    if (key === 'target') target();
    else if (key === 'countdown') countdown();
    else if (key === 'night') nightSher();
    else if (key === 'naat') shuffleNaat();
    else if (key === 'baat') apniBaat();
    else if (key === 'mood') moodDiary();
    else if (key === 'ayat') ayat();
  };
})();

/* ===== Kit: login gate par floating buttons chhupao (app/mode overlap fix) ===== */
(function () {
  'use strict';
  if (window.__sqGateHide) return;
  window.__sqGateHide = true;
  var last = null;
  setInterval(function () {
    var gate = !document.getElementById('bio') && !document.getElementById('achievements');
    ['sq-app-btn', 'sq-mode-btn'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.style.display = gate ? 'none' : '';
    });
  }, 500);
})();

/* ===== Kit: Saqib World phase-2 — Open When, Gift Boxes, Roulette, Scratch, Raat/Subah, Secret Vault ===== */
(function () {
  'use strict';
  var prev = window.__sqHubFeature;
  function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function dayIndex() { var d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000) + d.getFullYear(); }

  function modal2(title, build) {
    var old = document.getElementById('sq-feat-ov'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'sq-feat-ov';
    var card = document.createElement('div'); card.id = 'sq-feat-card';
    var x = document.createElement('button'); x.className = 'sq-fx'; x.type = 'button'; x.innerHTML = '\u00D7';
    x.setAttribute('aria-label', 'Band karein'); x.onclick = function () { ov.remove(); };
    var h = document.createElement('h3'); h.textContent = title; h.appendChild(x);
    card.appendChild(h); build(card);
    ov.appendChild(card);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }
  function sherPool() {
    var cats = window.__sqPoetryCats || [];
    var all = []; cats.forEach(function (c) { all = all.concat(c[3] || []); });
    return all;
  }
  function pickSher() { var p = sherPool(); return p.length ? p[Math.floor(Math.random() * p.length)].replace(' | ', '\n') : '\u2764\uFE0F'; }

  /* ---- Open When letters ---- */
  var LETTERS = [
    ['\u2764\uFE0F', 'Jab mujhe yaad aaye', 'To ye sher parho —\n\nKabhi kabhi to khud ko bhi yaad na aaye,\ntumhare bina to dil kuch bhi na laage.\n\nEk kaam karo: mere sath bitayi hui koi acchi yaad yaad karo. Muskuraye? \u2764\uFE0F'],
    ['\uD83E\uDEE0', 'Jab udaas ho', 'Suno — udaasi bhi guzar jati hai, bijli ki tarah chamakti hai aur guzar jati hai.\n\nAaj ka din aap ka nahi hai, kal ka to hai hi. Main hoon na? \uD83E\uDEE0'],
    ['\uD83C\uDF19', 'Jab neend na aaye', 'Phone rakh do \uD83D\uDE0C\n\nAankhein band karo, soch wo cheez jis se dil ko sukoon mila — dheere dheere neend aa hi jayegi.\n\nShab ba khair \uD83C\uDF19'],
    ['\uD83D\uDE04', 'Jab muskurane ka dil kare', 'Chalo ek raaz ki baat: aap ki muskurahat par sab ki nazar jati hai — aur ye sach hai.\n\nAaj muskurane ki wajah main hoon \uD83D\uDE04'],
    ['\uD83D\uDC94', 'Jab din bura ho', 'Bura din aap ki kamiyaan nahi, bas taqdeer ka ek kadam hai.\n\nDeep breath. Paani piyo. Chaadar odho. Kal phir se — aur behtar. \uD83D\uDC94'],
    ['\u2728', 'Jab pata karna ho main kaisa sochta hoon', 'Itna ke aap mil jao to din ka hisaab hi kuch aur ho jata hai.\n\nAam log se baat karna padta hai, aap se milna hota hai. \u2728'],
    ['\uD83C\uDF1C', 'Jab raat ko hamari yaad aaye', 'Raat ki baat hai... sitare bhi aaj kal aap ka zikr karte hain \uD83C\uDF1C\n\nAb ankhein band karo — milte hain khwab mein.']
  ];
  /* ---- Open When gate (v71: HAR refresh par lock dobara mangay — koi persistence nahi) ---- */
  var owOk = false;
  function owGate() {
    if (document.getElementById('sq-ow-ov')) return;
    if (!document.getElementById('sq-ow-ov-style')) {
      var st = document.createElement('style');
      st.id = 'sq-ow-ov-style';
      st.textContent = '#sq-ow-ov{position:fixed;inset:0;z-index:12100;background:rgba(8,3,14,.97);display:flex;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}'
        + '#sq-ow-ov-card{background:rgba(24,10,34,.98);border:1px solid #f0c96a;border-radius:14px;padding:24px 20px;width:min(88vw,320px);color:#fff;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.6)}'
        + '#sq-ow-ov-card h3{margin:0 0 6px;font-size:16px;color:#f0c96a}#sq-ow-ov-card p{margin:0 0 14px;font-size:12px;opacity:.7}'
        + '#sq-ow-ov-in{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:9px;border:1px solid #ffffff30;background:#ffffff10;color:#fff;font-size:14px;text-align:center}'
        + '#sq-ow-ov-in::placeholder{color:#ffffff60}'
        + '#sq-ow-ov-btn{width:100%;margin-top:10px;padding:11px;border-radius:9px;border:none;background:#f0c96a;color:#1a0f26;font-weight:700;cursor:pointer;font-size:14px;font-family:inherit}'
        + '#sq-ow-ov-err{display:none;color:#ff6b81;font-size:12.5px;margin-top:10px}'
        + '#sq-ow-ov-back{width:100%;margin-top:8px;padding:11px;border-radius:9px;border:1px solid rgba(240,201,106,.4);background:transparent;color:#f0c96a;font-weight:600;cursor:pointer;font-size:14px;font-family:inherit}';
      document.head.appendChild(st);
    }
    var ov = document.createElement('div');
    ov.id = 'sq-ow-ov';
    ov.innerHTML = '<div id="sq-ow-ov-card"><h3>\u{1F512} Open When</h3><p>Ye letters password se mehfooz hai</p>'
      + '<input id="sq-ow-ov-in" type="password" placeholder="Password" autocomplete="off">'
      + '<button id="sq-ow-ov-btn" type="button">Unlock</button>'
      + '<div id="sq-ow-ov-err">Ghalat password \u2014 dobara koshish karein.</div>'
      + '<button id="sq-ow-ov-back" type="button">\u2B05 Wapis jayein</button></div>';
    document.body.appendChild(ov);
    var inp = ov.querySelector('#sq-ow-ov-in');
    var err = ov.querySelector('#sq-ow-ov-err');
    function tryUnlock() {
      if (String(inp.value || '').trim().toLowerCase() === 'love') {
        owOk = true;
        ov.remove();
        openWhen();
      } else {
        err.style.display = 'block';
        inp.value = '';
        try { inp.focus(); } catch (e) {}
      }
    }
    ov.querySelector('#sq-ow-ov-btn').addEventListener('click', tryUnlock);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); tryUnlock(); } });
    ov.querySelector('#sq-ow-ov-back').addEventListener('click', function () { ov.remove(); });
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 100);
  }

  function openWhen() {
    modal2('\uD83D\uDCE8 Open When\u2026 Letters', function (c) {
      var unlockedL = owOk;
      function render() {
        c.querySelectorAll('.sq-ow-l').forEach(function (e) { e.remove(); });
        LETTERS.forEach(function (L, i) {
          var b = document.createElement('button');
          b.className = 'sq-f-btn2 sq-ow-l'; b.type = 'button';
          b.style.cssText += 'display:block;width:100%;text-align:left';
          b.textContent = L[0] + ' Kholay jab' + String(L[1]).replace(/^Jab/i, '');
          b.onclick = function () {
            if (!unlockedL) {
              var pw = prompt('Ye letter kholne ke liye password likhein:');
              if (pw === null) return;
              if (pw.trim().toLowerCase() !== 'love') { alert('Ghalat password \u2014 dobara koshish karein.'); return; }
              unlockedL = true; lsS('sq-openwhen-ok', '1'); render(); return;
            }
            modal2(L[0] + ' Kholay jab' + String(L[1]).replace(/^Jab/i, ''), function (cc) {
              var body = document.createElement('div');
              body.className = 'sq-f-big';
              body.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif";
              body.style.fontSize = '18px'; body.style.whiteSpace = 'pre-line'; body.style.direction = 'ltr';
              body.textContent = L[2];
              cc.appendChild(body);
              var sig = document.createElement('div'); sig.style.cssText = 'text-align:center;font-size:12px;color:#e97b9c'; sig.textContent = '\u2014 Saqib \u2014';
              cc.appendChild(sig);
            });
          };
          c.appendChild(b);
        });
        var n = document.createElement('div'); n.className = 'sq-f-note sq-ow-l';
        n.textContent = unlockedL ? 'Sab letters khule hain \u2764\uFE0F' : 'Letters ek password se khulte hain \u2014 wahi purana.';
        c.appendChild(n);
      }
      render();
    });
  }

  /* ---- Gift Boxes ---- */
  function gifts() {
    modal2('\uD83C\uDF81 Gift Boxes', function (c) {
      var n = document.createElement('div'); n.className = 'sq-f-note';
      n.textContent = 'Koi bhi box chunein \u2014 har ek mein ek surprise hai:';
      c.appendChild(n);
      var items = [
        ['\uD83C\uDF81', 'Ek Sher', function () { return pickSher(); }],
        ['\uD83D\uDC9C', 'Ek Tareef', function () { return 'Aap jaisa soch wala insaan kam hi dekha hai \u2014 sach mein.'; }],
        ['\uD83D\uDD10', 'Ek Raaz', function () { return 'Raaz ye hai ke raaz ka koi raaz nahi \u2014 aap hi sab se acche hain \uD83D\uDE0C'; }],
        ['\uD83E\uDD13', 'Ek Wada', function () { return 'Jo waqt aap ko mila, wo aap ka apna hai \u2014 dil se kamaya hua.'; }],
        ['\uD83C\uDFB5', 'Ek Gaana', function () { return 'Music section kholo aur koi bhi Naat shuffle karo \u2014 aaj ka gaana maine aap ke liye chuna hai \uD83C\uDFB5'; }],
        ['\uD83C\uDF1F', 'Ek Yaad', function () { return 'Wo purani baatein jo humne yahan likhi \u2014 Poetry section mein kabhi kabhi wahan jao, wahi hain.'; }],
        ['\u2728', 'Aakhri Surprise', function () { return 'Surprise ye hai: aap tak ye sab pahunchne tak itna sab kuch ho gaya \u2014 aur ye to shuruaat hai. \u2728'; }]
      ];
      items.forEach(function (it, i) {
        var b = document.createElement('button'); b.className = 'sq-f-btn2'; b.type = 'button';
        b.style.cssText += 'display:inline-block;margin:4px';
        b.textContent = it[0] + ' Box ' + (i + 1);
        b.onclick = function () {
          modal2('\uD83C\uDF81 Box ' + (i + 1) + ' \u2014 ' + it[1], function (cc) {
            var body = document.createElement('div'); body.className = 'sq-f-big';
            body.style.whiteSpace = 'pre-line'; body.textContent = it[2]();
            cc.appendChild(body);
          });
        };
        c.appendChild(b);
      });
    });
  }

  /* ---- Sher Roulette ---- */
  function roulette() {
    modal2('\uD83C\uDFB0 Sher Roulette', function (c) {
      var res = document.createElement('div'); res.className = 'sq-f-big';
      res.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif"; res.style.direction = 'rtl'; res.style.whiteSpace = 'pre-line';
      res.textContent = '\uD83C\uDFB0 Spin dabayein\u2026';
      var busy = false;
      var b = document.createElement('button'); b.className = 'sq-f-btn'; b.type = 'button'; b.textContent = '\uD83C\uDFB0 Spin!';
      b.onclick = function () {
        if (busy) return; busy = true;
        var frames = 0;
        var iv = setInterval(function () {
          res.textContent = pickSher();
          if (++frames > 14) { clearInterval(iv); busy = false; }
        }, 90);
      };
      c.appendChild(res); c.appendChild(b);
    });
  }

  /* ---- Scratch Card (rozana naya) ---- */
  var SCRATCH_MSGS = [
    'Aaj ka raaz: aap se behtar koi nahi \u2764\uFE0F',
    'Aaj apne aap par thoda extra hassan do \uD83D\uDE04',
    'Jo aaj karna hai, aaram se \u2014 sab ho jayega \u2728',
    'Koi yaad kar raha hai... shayad yahin kahin \uD83D\uDC9C',
    'Aaj ki dua: sukoon aap ke sath rahe \uD83C\uDF19',
    'Muskurahat sasti hai, asar gehra hai \uD83D\uDE04',
    'Aaj sirf apna khayal rakho \u2014 bas \u2764\uFE0F'
  ];
  function scratch() {
    var msg = SCRATCH_MSGS[dayIndex() % SCRATCH_MSGS.length];
    modal2('\uD83C\uDFA7 Roz ka Scratch Card', function (c) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;height:130px;border-radius:12px;overflow:hidden;margin-top:10px';
      var msg = document.createElement('div');
      msg.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;font-size:16px;color:#f0c96a;background:#16161f';
      msg.textContent = SCRATCH_MSGS[dayIndex() % SCRATCH_MSGS.length];
      var cv = document.createElement('canvas');
      cv.width = 380; cv.height = 130;
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair';
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#2a2a35'; ctx.fillRect(0, 0, 380, 130);
      ctx.fillStyle = '#6d675a'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Yahan ragar dein \uD83D\uDC46', 190, 68);
      var down = false, cleared = 0;
      function scrub(e) {
        if (!down) return;
        var r = cv.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        var y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(x * (380 / r.width), y * (130 / r.height), 18, 0, 7); ctx.fill();
        cleared++;
        if (cleared > 60) { cv.style.transition = 'opacity .6s'; cv.style.opacity = '0'; setTimeout(function () { cv.remove(); }, 650); }
      }
      cv.addEventListener('pointerdown', function (e) { down = true; scrub(e); });
      cv.addEventListener('pointermove', scrub);
      window.addEventListener('pointerup', function () { down = false; });
      wrap.appendChild(msg); wrap.appendChild(cv);
      c.appendChild(wrap);
      var n = document.createElement('div'); n.className = 'sq-f-note';
      n.textContent = 'Roz naya card \u2014 kal dobara kholein.';
      c.appendChild(n);
    });
  }

  /* ---- Raat / Subah ka Paigham ---- */
  function daypart() {
    var hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return ['\u2600\uFE0F', 'Good Morning', 'Naya din, nayi niyyat. Aaj ka target set karna na bhoolen \u2014 chhota sa hi sahi. \u2600\uFE0F'];
    if (hr >= 12 && hr < 17) return ['\uD83C\uDF1E', 'Assalam o Alaikum', 'Dopahar ki thakan par paani piyo aur lamba saans lo. Aadha din aur bhi aap ka hai. \uD83C\uDF1E'];
    if (hr >= 17 && hr < 21) return ['\uD83C\uDF07', 'Shaam mubarak', 'Shaam ki hawa mein sukoon hai \u2014 aaj ka din bhi guzar gaya, aap ne sambhal liya. \uD83C\uDF07'];
    return ['\uD83C\uDF19', 'Shab ba khair', 'Sone se pehle ek baat: aaj ka din jo bhi raha, kal ka aap ka hai. Aankhein band karo \u2014 milte hain khwab mein. \uD83C\uDF19'];
  }
  function daypartMsg() {
    var d = daypart();
    modal2(d[0] + ' ' + d[1], function (c) {
      var big = document.createElement('div'); big.className = 'sq-f-big';
      big.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif";
      big.textContent = d[2];
      c.appendChild(big);
      var n = document.createElement('div'); n.className = 'sq-f-note'; n.style.textAlign = 'center';
      n.textContent = 'Waqt dekh kar apne aap badalta hai \u2014 subah, dopahar, shaam, raat.';
      c.appendChild(n);
    });
  }

  /* ---- Secret Vault ---- */
  function vault() {
    modal2('\uD83D\uDD10 Secret Vault', function (c) {
      if (lsG('sq-vault-ok') === '1') { paint(); return; }
      var q = document.createElement('div'); q.style.cssText = 'font-size:14px;margin-top:6px';
      q.textContent = 'Yahan woh baat hai jo sab ke liye nahi. Jawab likhein:';
      var inp = document.createElement('input'); inp.className = 'sq-f-in'; inp.type = 'password';
      inp.placeholder = 'Jawab / password...'; inp.autocomplete = 'off';
      var err = document.createElement('div'); err.style.cssText = 'color:#ff8f8f;font-size:12px;display:none';
      err.textContent = 'Ye jawab nahi \u2014 dobara sochhein.';
      var b = document.createElement('button'); b.className = 'sq-f-btn'; b.type = 'button'; b.textContent = 'Kholein';
      b.onclick = function () {
        if ((inp.value || '').trim().toLowerCase() === 'saqi') { lsS('sq-vault-ok', '1'); c.querySelectorAll('.sq-vq').forEach(function (e) { e.remove(); }); paint(); }
        else err.style.display = 'block';
      };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') b.click(); });
      [q, inp, err, b].forEach(function (e) { e.classList.add('sq-vq'); c.appendChild(e); });
      function paint() {
        c.querySelectorAll('.sq-vq').forEach(function (e) { e.remove(); });
        var body = document.createElement('div'); body.className = 'sq-f-big';
        body.style.whiteSpace = 'pre-line';
        body.textContent = 'Vault khul gaya \uD83D\uDD13\n\nRaaz ki bhaanp laga li aap ne! Yahan aap kuch bhi rakh sakte hain \u2014 mujhe bolo, main isi jagah chhupa dunga. \uD83D\uDD10';
        c.appendChild(body);
        var lock = document.createElement('button'); lock.className = 'sq-f-btn2'; lock.type = 'button'; lock.textContent = 'Wapas band karein';
        lock.onclick = function () { try { localStorage.removeItem('sq-vault-ok'); } catch (e) {} c.querySelectorAll('div,body'); var o = document.getElementById('sq-feat-ov'); if (o) o.remove(); };
        c.appendChild(lock);
      }
    });
  }

  window.__sqHubFeature = function (key) {
    if (key === 'openwhen') owGate();
    else if (key === 'gifts') gifts();
    else if (key === 'roulette') roulette();
    else if (key === 'scratch') scratch();
    else if (key === 'daypart') daypartMsg();
    else if (key === 'vault') vault();
    else if (prev) prev(key);
  };
})();

/* ===== Kit: Saqib World phase-3 — 10 creative features (heartbeat, kisses, tickets, movie, machine, postbox, teddy, magic, then-now, replyback) ===== */
(function () {
  'use strict';
  var prev = window.__sqHubFeature;
  function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function dayIndex() { var d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000) + d.getFullYear(); }
  function modal3(title, build) {
    var old = document.getElementById('sq-feat-ov'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'sq-feat-ov';
    var card = document.createElement('div'); card.id = 'sq-feat-card';
    var x = document.createElement('button'); x.className = 'sq-fx'; x.type = 'button'; x.innerHTML = '\u00D7';
    x.setAttribute('aria-label', 'Band karein'); x.onclick = function () { ov.remove(); };
    var h = document.createElement('h3'); h.textContent = title; h.appendChild(x);
    card.appendChild(h); build(card);
    ov.appendChild(card);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    var mo = new MutationObserver(function () {
      if (!document.body.contains(ov)) { mo.disconnect(); if (window.__sqPhase3Timer) { clearInterval(window.__sqPhase3Timer); window.__sqPhase3Timer = null; } }
    });
    mo.observe(document.body, { childList: true });
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function sherPool() {
    var cats = window.__sqPoetryCats || []; var all = [];
    cats.forEach(function (c) { all = all.concat(c[3] || []); });
    return all;
  }

  /* 31 — Heartbeat Synchronizer */
  function heartbeat() {
    modal3('\u2764\uFE0F Heartbeat Synchronizer', function (c) {
      var info = document.createElement('div'); info.className = 'sq-f-note';
      info.textContent = 'Dil ki raftan (beat) par tap karo \u2014 dekhein aap ke dil kitne sync hain! 10 taps.';
      var heart = document.createElement('div');
      heart.style.cssText = 'font-size:52px;text-align:center;user-select:none;cursor:pointer;animation:sq-beat .86s ease-in-out infinite';
      heart.textContent = '\u2764\uFE0F';
      if (!document.getElementById('sq-beat-kf')) {
        var st = document.createElement('style'); st.id = 'sq-beat-kf';
        st.textContent = '@keyframes sq-beat{0%,100%{transform:scale(1)}50%{transform:scale(1.22)}}';
        document.head.appendChild(st);
      }
      var res = document.createElement('div'); res.className = 'sq-f-big'; res.style.textAlign = 'center';
      var taps = 0, hits = 0, lastBeat = performance.now();
      heart.onpointerdown = function () {
        if (taps >= 10) return;
        taps++;
        var phase = (performance.now() - lastBeat) % 860;
        var off = Math.min(phase, 860 - phase);
        if (off < 200) { hits++; heart.style.filter = 'drop-shadow(0 0 12px #ff5f8f)'; } else { heart.style.filter = 'none'; }
        info.textContent = taps + '/10 taps \u2014 ' + hits + ' sync';
        if (taps === 10) {
          var pct = Math.round(hits * 10);
          res.textContent = pct >= 80 ? '\uD83D\uDC9E ' + pct + '% \u2014 dil bilkul ek raftan par! \uD83D\uDE0D' : pct >= 40 ? '\u2764\uFE0F ' + pct + '% \u2014 acha hai, thori aur practice!' : '\uD83D\uDC94 ' + pct + '% \u2014 dil ki raftan pakarna mushkil hai, dobara try?';
          info.textContent = 'Dobara khelne ke liye modal dobara kholen.';
        }
      };
      c.appendChild(info); c.appendChild(heart); c.appendChild(res);
    });
  }

  /* 32 — Kiss Counter */
  function kisses() {
    modal3('\uD83D\uDC8B Kiss Counter', function (c) {
      var n = document.createElement('div'); n.className = 'sq-f-big'; n.style.textAlign = 'center'; n.style.fontSize = '34px';
      var b = document.createElement('button'); b.className = 'sq-f-btn'; b.type = 'button'; b.style.cssText += 'font-size:16px'; 
      b.textContent = '\uD83D\uDC8B Kiss bhejein';
      function paint() { n.textContent = lsG('sq-kisses') ? lsG('sq-kisses') + ' kisses \uD83D\uDC8B' : '0 kisses'; }
      b.onclick = function () { lsS('sq-kisses', String((parseInt(lsG('sq-kisses') || '0', 10) || 0) + 1)); paint();
        var bonus = ['', '', '', '', '', '', '', '', '', '', '\u2728 10 kisses ho gaye!', '', '', '', '', '', '', '', '', '\uD83C\uDF1F 20!', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '\uD83C\uDF89 50!!'];
        var i = parseInt(lsG('sq-kisses'), 10);
        if (bonus[i]) n.textContent += ' ' + bonus[i];
      };
      paint(); c.appendChild(n); c.appendChild(b);
    });
  }

  /* 33 — Digital Date Tickets */
  function tickets() {
    modal3('\uD83C\uDF9F\uFE0F Digital Date Tickets', function (c) {
      var used = JSON.parse(lsG('sq-tickets-used') || '[]');
      var T = [['\uD83C\uDFAC', 'Movie Night', 'Aaj raat movie \u2014 popcorn zaroori hai'], ['\uD83C\uDF5B', 'Dinner', 'Ek khaas shaam, khaas jagah'], ['\uD83C\uDF19', 'Late Night Call', 'Raat ki baatein, subah tak']];
      T.forEach(function (t, i) {
        var isUsed = used.indexOf(i) >= 0;
        var b = document.createElement('button'); b.className = 'sq-f-btn2'; b.type = 'button'; b.style.cssText += 'display:block;width:100%;text-align:left;margin:6px 0;opacity:' + (isUsed ? '.55' : '1');
        b.textContent = (isUsed ? '\u2713 ' : '') + t[0] + '  ' + t[1] + ' \u2014 ' + t[2];
        b.onclick = function () {
          if (used.indexOf(i) >= 0) { alert('Ye ticket use ho chuki hai.'); return; }
          used.push(i); lsS('sq-tickets-used', JSON.stringify(used));
          modal3('\uD83C\uDF9F\uFE0F ' + t[1], function (cc) {
            var tk = document.createElement('div');
            tk.style.cssText = 'border:2px dashed #f0c96a;border-radius:12px;padding:18px;text-align:center;margin-top:10px';
            tk.innerHTML = '<div style="font-size:30px">' + t[0] + '</div><div style="font-size:18px;color:#f0c96a;margin:6px 0">ADMIT ONE</div><div style="font-size:14px">' + t[2] + '</div><div style="font-size:11px;color:#888;margin-top:8px">\u2014 Saqib \u2014</div>';
            cc.appendChild(tk);
          });
          setTimeout(function () { modal3('\uD83C\uDF9F\uFE0F Digital Date Tickets', tickets); }, 100);
        };
        c.appendChild(b);
      });
      var n = document.createElement('div'); n.className = 'sq-f-note';
      n.textContent = 'Ticket use karne ke liye click karein.';
      c.appendChild(n);
    });
  }

  /* 34 — Virtual Movie Night */
  function movie() {
    modal3('\uD83C\uDF7F Virtual Movie Night', function (c) {
      var linkIn = document.createElement('input'); linkIn.className = 'sq-f-in'; linkIn.type = 'url';
      linkIn.placeholder = 'Movie/playlist ka link (optional)...';
      linkIn.value = lsG('sq-movielink') || '';
      var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap';
      var cd = document.createElement('div'); cd.className = 'sq-f-big'; cd.style.textAlign = 'center';
      var note = document.createElement('div'); note.className = 'sq-f-note'; note.style.textAlign = 'center';
      note.textContent = 'Countdown shuru karein \u2014 dono ek sath ready ho jayen.';
      function start(mins) {
        if (window.__sqPhase3Timer) clearInterval(window.__sqPhase3Timer);
        var end = Date.now() + mins * 60000;
        window.__sqPhase3Timer = setInterval(function () {
          var left = end - Date.now();
          if (left <= 0) { clearInterval(window.__sqPhase3Timer); window.__sqPhase3Timer = null; cd.textContent = '\uD83C\uDF7F Shuru!'; if (lsG('sq-movielink')) { try { window.open(lsG('sq-movielink'), '_blank'); } catch (e) {} } return; }
          var m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
          cd.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        }, 1000);
      }
      [['30 min', 30], ['60 min', 60]].forEach(function (o) {
        var b = document.createElement('button'); b.className = 'sq-f-btn2'; b.type = 'button'; b.textContent = '\u25B6 ' + o[0];
        b.onclick = function () { lsS('sq-movielink', linkIn.value.trim()); start(o[1]); note.textContent = 'Countdown chal raha hai...'; };
        row.appendChild(b);
      });
      c.appendChild(linkIn); c.appendChild(row); c.appendChild(cd); c.appendChild(note);
    });
  }

  /* 35 — Surprise Machine */
  var MEMORIES = [
    'Wo pehli mulaqat jab sab kuch ruk sa gaya tha...',
    'Wo lambi baatein jo khatam hi nahi hoti theen.',
    'Ek adhoora message aur poori raat ka intezaar.',
    'Wo hansti hui tasveer jo aaj bhi sab se pyari hai.',
    'Wo chhoti si baat jo din bana gayi.'
  ];
  function machine() {
    modal3('\uD83C\uDFB0 Surprise Machine', function (c) {
      var win = document.createElement('div');
      win.style.cssText = 'border:2px solid #f0c96a;border-radius:12px;padding:16px;text-align:center;font-family:\'Noto Nastaliq Urdu\',\'Gulzar\',serif;min-height:70px;margin-top:10px;white-space:pre-line;direction:rtl';
      win.textContent = '...';
      var busy = false;
      var b = document.createElement('button'); b.className = 'sq-f-btn'; b.type = 'button'; b.textContent = '\uD83C\uDFB0 Lever kheencho!';
      b.onclick = function () {
        if (busy) return; busy = true;
        var frames = 0;
        var iv = setInterval(function () {
          win.textContent = Math.random() < .5 ? pick(MEMORIES) : pick(sherPool()).replace(' | ', '\n');
          if (++frames > 15) { clearInterval(iv); busy = false; }
        }, 90);
      };
      c.appendChild(win); c.appendChild(b);
      var n = document.createElement('div'); n.className = 'sq-f-note'; n.style.textAlign = 'center';
      n.textContent = 'Har pull par ek romantic yaad ya sher.';
      c.appendChild(n);
    });
  }

  /* 36 — Digital Postbox (rozana ek envelope) */
  var POSTBOX = [
    'Aaj ka envelope: ek baat jo din bhar sochti rahi \u2014 aap se baat kiye bagair din adhoora hai. \u2764\uFE0F',
    'Aaj ka envelope: aap ki hansi meri favorite awaz hai. Sach mein. \uD83D\uDE04',
    'Aaj ka envelope: jo log aap ko jaise samajhte hain, wo sirf aap ka surface dekhte hain \u2014 andar ka aap aur bhi khoobsurat hai. \u2728',
    'Aaj ka envelope: aaj kuch aisa kiya jo pehle nahi kiya? Main hoon sath. \uD83C\uDF1F',
    'Aaj ka envelope: ruk jao, ek lamba saans lo \u2014 aap bohat acha kar rahi hain. \uD83C\uDFB5',
    'Aaj ka envelope: mujhe aap par garv hai \u2014 roz, har haal mein. \uD83E\uDD70',
    'Aaj ka envelope: chand ko dekho \u2014 wo bhi aap ko dekh raha hoga, is tarah milte hain \uD83C\uDF19'
  ];
  function postbox() {
    modal3('\uD83D\uDCF0 Digital Postbox', function (c) {
      var today = dayIndex() % POSTBOX.length;
      for (var i = 0; i < POSTBOX.length; i++) {
        (function (i) {
          var open = i === today;
          var b = document.createElement('button'); b.className = 'sq-f-btn2'; b.type = 'button';
          b.style.cssText += 'display:block;width:100%;text-align:left;margin:5px 0;opacity:' + (open ? '1' : '.5');
          b.textContent = (open ? '\u2709\uFE0F' : '\uD83D\uDD12') + ' Envelope ' + (i + 1) + (open ? ' \u2014 aaj ka!' : ' \u2014 abhi band');
          b.onclick = function () {
            if (!open) { alert('Ye envelope kal khulega \u2014 roz ek naya letter aata hai.'); return; }
            modal3('\uD83D\uDCF0 Envelope ' + (i + 1), function (cc) {
              var body = document.createElement('div'); body.className = 'sq-f-big';
              body.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif"; body.style.whiteSpace = 'pre-line';
              body.textContent = POSTBOX[i];
              cc.appendChild(body);
            });
          };
          c.appendChild(b);
        })(i);
      }
    });
  }

  /* 37 — Memory Teddy */
  function teddy() {
    modal3('\uD83E\uDDF8 Memory Teddy', function (c) {
      var ted = document.createElement('div'); ted.style.cssText = 'font-size:56px;text-align:center;margin:8px 0';
      var lvl = document.createElement('div'); lvl.className = 'sq-f-note'; lvl.style.textAlign = 'center';
      function accessories(n) {
        var a = '';
        if (n >= 5) a += '\uD83C\uDF80'; if (n >= 12) a += '\uD83C\uDFA9'; if (n >= 20) a += '\u2764\uFE0F'; if (n >= 35) a += '\uD83D\uDC51'; if (n >= 50) a += '\uD83C\uDF1F';
        return a;
      }
      function paint() {
        var n = parseInt(lsG('sq-teddy') || '0', 10) || 0;
        ted.textContent = accessories(n) + '\uD83E\uDDF8' + accessories(n);
        lvl.textContent = n + ' treats \u2014 ' + (n >= 50 ? 'Teddy SHAHI ho gaya! \uD83D\uDC51' : n >= 35 ? 'Teddy crown ke qareeb...' : n >= 20 ? 'Teddy khush hai \u2764\uFE0F' : n >= 12 ? 'Teddy ko topi mil gayi \uD83C\uDFA9' : n >= 5 ? 'Teddy ko ribbon mil gaya \uD83C\uDF80' : 'Teddy ko treats khila kar accessories unlock karein');
      }
      var b = document.createElement('button'); b.className = 'sq-f-btn'; b.type = 'button'; b.textContent = '\uD83C\uDF69 Khilao';
      b.onclick = function () { lsS('sq-teddy', String((parseInt(lsG('sq-teddy') || '0', 10) || 0) + 1)); paint(); ted.style.transform = 'scale(1.15)'; setTimeout(function () { ted.style.transform = ''; }, 200); };
      ted.style.transition = 'transform .2s';
      paint(); c.appendChild(ted); c.appendChild(b); c.appendChild(lvl);
    });
  }

  /* 38 — Magic Button */
  function magic() {
    modal3('\uD83E\uDE84 Magic Button', function (c) {
      var out = document.createElement('div'); out.className = 'sq-f-big'; out.style.textAlign = 'center'; out.style.minHeight = '60px'; out.style.whiteSpace = 'pre-line';
      out.textContent = '\u2728';
      var b = document.createElement('button'); b.className = 'sq-f-btn'; b.type = 'button'; b.textContent = '\uD83E\uDE84 Make me smile';
      b.onclick = function () { out.textContent = Math.random() < .4 ? pick(sherPool()).replace(' | ', '\n') : pick(MEMORIES) + '\n\u2728'; };
      c.appendChild(out); c.appendChild(b);
    });
  }

  /* 39 — Then vs Now slider */
  function thennow() {
    modal3('\uD83D\uDCF7 Then vs Now', function (c) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;width:100%;max-width:340px;height:340px;margin:10px auto;border-radius:12px;overflow:hidden';
      var now = document.createElement('img'); now.src = 'assets/photos/1000943911.jpg';
      now.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
      var then = document.createElement('img'); then.src = 'assets/photos/1000943915.jpg';
      then.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;clip-path:inset(0 50% 0 0)';
      var lab1 = document.createElement('div'); lab1.textContent = '\u2190 Phir'; lab1.style.cssText = 'position:absolute;top:10px;left:10px;background:#000a;color:#fff;padding:2px 10px;border-radius:99px;font-size:12px';
      var lab2 = document.createElement('div'); lab2.textContent = 'Ab \u2192'; lab2.style.cssText = 'position:absolute;top:10px;right:10px;background:#000a;color:#fff;padding:2px 10px;border-radius:99px;font-size:12px';
      var rng = document.createElement('input'); rng.type = 'range'; rng.min = '0'; rng.max = '100'; rng.value = '50';
      rng.style.cssText = 'width:100%;max-width:340px;margin-top:10px';
      rng.oninput = function () { then.style.clipPath = 'inset(0 ' + (100 - rng.value) + '% 0 0)'; };
      wrap.appendChild(now); wrap.appendChild(then); wrap.appendChild(lab1); wrap.appendChild(lab2);
      c.appendChild(wrap); c.appendChild(rng);
      var n = document.createElement('div'); n.className = 'sq-f-note'; n.style.textAlign = 'center';
      n.textContent = 'Slider ghumao \u2014 pehli yaad se aaj tak.';
      c.appendChild(n);
    });
  }

  /* 40 — Reply Back */
  function replyback() {
    modal3('\u270D\uFE0F Reply Back', function (c) {
      var ta = document.createElement('textarea');
      ta.style.cssText = 'width:100%;min-height:90px;background:#0f0f16;color:#f0e6d2;border:1px solid #f0c96a55;border-radius:10px;padding:10px;font-size:14px;box-sizing:border-box';
      ta.placeholder = 'Apna khaas jawab yahan likhein...';
      ta.value = lsG('sq-replyback') || '';
      var b = document.createElement('button'); b.className = 'sq-f-btn'; b.type = 'button'; b.textContent = '\uD83D\uDCBE Mehfooz karein';
      b.onclick = function () { lsS('sq-replyback', ta.value.trim()); b.textContent = '\u2705 Mehfooz ho gaya'; setTimeout(function () { b.textContent = '\uD83D\uDCBE Mehfooz karein'; }, 1500); };
      var n = document.createElement('div'); n.className = 'sq-f-note';
      n.textContent = 'Ye jawab sirf aap ke device par mehfooz hota hai \u2014 bilkul private.';
      c.appendChild(ta); c.appendChild(b); c.appendChild(n);
    });
  }

  window.__sqHubFeature = function (key) {
    if (key === 'heartbeat') heartbeat();
    else if (key === 'kisses') kisses();
    else if (key === 'tickets') tickets();
    else if (key === 'movie') movie();
    else if (key === 'machine') machine();
    else if (key === 'postbox') postbox();
    else if (key === 'teddy') teddy();
    else if (key === 'magic') magic();
    else if (key === 'thennow') thennow();
    else if (key === 'replyback') replyback();
    else if (prev) prev(key);
  };
})();

/* ===== Kit: Global error helper — error dikhaye + Contact Saqib (WhatsApp) ===== */
(function () {
  'use strict';
  if (window.__sqErrHelper) return;
  window.__sqErrHelper = true;
  var lastShow = 0;
  function banner(msg) {
    var now = Date.now();
    if (now - lastShow < 20000) return;
    lastShow = now;
    var old = document.getElementById('sq-err-banner'); if (old) old.remove();
    var b = document.createElement('div'); b.id = 'sq-err-banner';
    b.setAttribute('role', 'alert');
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:13000;background:#5c1220;color:#ffe3e3;padding:12px 14px;font-size:13px;box-shadow:0 4px 16px #000a;direction:ltr';
    var t = document.createElement('div');
    t.style.cssText = 'max-width:640px;margin:0 auto';
    var line1 = document.createElement('div');
    line1.style.cssText = 'font-weight:600;margin-bottom:2px';
    line1.textContent = '\u26A0\uFE0F Oops \u2014 website mein ek masla hua';
    var line2 = document.createElement('div');
    line2.style.cssText = 'font-family:monospace;font-size:11px;word-break:break-all;opacity:.85;margin-bottom:3px';
    line2.textContent = String(msg || 'Unknown error').slice(0, 160);
    var line3 = document.createElement('div');
    line3.textContent = 'Contact Saqib to resolve this issue.';
    var row = document.createElement('div');
    row.style.cssText = 'margin-top:8px;display:flex;gap:8px;flex-wrap:wrap';
    var ok = document.createElement('button');
    ok.type = 'button';
    ok.style.cssText = 'background:#2fb967;color:#fff;border:0;border-radius:99px;padding:7px 16px;font-size:13px;cursor:pointer';
    ok.textContent = '\u2705 Okay \u2014 WhatsApp par baat karein';
    ok.onclick = function () {
      var txt = 'Assalam o Alaikum! Website par ye error aa raha hai:\n\n' + String(msg).slice(0, 300) + '\n\nPage: ' + location.href;
      window.open('https://wa.me/923134182952?text=' + encodeURIComponent(txt), '_blank');
      b.remove();
    };
    var no = document.createElement('button');
    no.type = 'button';
    no.style.cssText = 'background:transparent;color:#ffe3e3;border:1px solid #ffe3e355;border-radius:99px;padding:7px 14px;font-size:13px;cursor:pointer';
    no.textContent = '\u2716 Band karein';
    no.onclick = function () { b.remove(); };
    row.appendChild(ok); row.appendChild(no);
    t.appendChild(line1); t.appendChild(line2); t.appendChild(line3); t.appendChild(row);
    b.appendChild(t);
    document.body ? document.body.appendChild(b) : document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(b); });
  }
  var sqErrCount = 0;
  function sqErrAllowed(msg, filename) {
    // max 3 banners per session — a broken page shouldn't spam toasts
    if (sqErrCount >= 3) return false;
    var m = String(msg || '');
    var f = String(filename || '');
    // browser extensions / injected scripts — not our code, not our fix
    if (f.indexOf('chrome-extension://') === 0 || f.indexOf('moz-extension://') === 0 || f.indexOf('safari-extension://') === 0) return false;
    // cross-origin scripts are masked to this generic message — no actionable info
    if (m === 'Script error.' || m.indexOf('Script error') === 0) return false;
    // errors with no filename at all can't come from our own .js files —
    // our bundles always carry enhancements.js / index.html / features.js
    if (!f) return false;
    sqErrCount++;
    return true;
  }
  window.addEventListener('error', function (e) {
    if (e && e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) return;
    var msg = (e && e.message ? e.message : 'Error');
    var file = e && e.filename ? String(e.filename).split('/').pop() + ':' + e.lineno : '';
    if (!sqErrAllowed(msg + (file ? ' @ ' + file : ''), e && e.filename)) return;
    banner(msg + (file ? ' @ ' + file : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    var msg = r && r.message ? r.message : (r ? String(r).slice(0, 160) : 'Unknown rejection');
    var stack = (r && r.stack) ? String(r.stack) : '';
    // only surface rejections that originate from our own deployed code —
    // extension/CDN promise noise otherwise shows scary useless banners
    if (stack.indexOf('saqib-iqbal.vercel.app') === -1 && stack.indexOf('localhost') === -1) return;
    if (!sqErrAllowed(msg, 'rejection')) return;
    banner(msg);
  });
})();

/* ===== Kit: Saqib Zone section — 20 naye features (Dua se Khwab Tabeer tak) ===== */
(function () {
  'use strict';
  if (window.__sqZoneInit) return;
  window.__sqZoneInit = true;
  function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsJ(k, d) { try { return JSON.parse(lsG(k)) || d; } catch (e) { return d; } }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function dayIndex() { var d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000) + d.getFullYear(); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function q(s) { return document.querySelector(s); }
  function modal4(title, build) {
    var old = document.getElementById('sq-feat-ov'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'sq-feat-ov';
    var card = document.createElement('div'); card.id = 'sq-feat-card';
    var x = document.createElement('button'); x.className = 'sq-fx'; x.type = 'button'; x.innerHTML = '\u00D7';
    x.setAttribute('aria-label', 'Band karein'); x.onclick = function () { ov.remove(); };
    var h = document.createElement('h3'); h.textContent = title; h.appendChild(x);
    card.appendChild(h); build(card);
    ov.appendChild(card);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }
  function btn(c, txt, fn, small) {
    var b = document.createElement('button'); b.type = 'button';
    b.className = small ? 'sq-f-btn2' : 'sq-f-btn'; b.textContent = txt; b.onclick = fn;
    c.appendChild(b); return b;
  }
  function big(c, txt) { var d = document.createElement('div'); d.className = 'sq-f-big'; d.style.whiteSpace = 'pre-line'; d.style.textAlign = 'center'; d.textContent = txt; c.appendChild(d); return d; }
  function note(c, txt) { var d = document.createElement('div'); d.className = 'sq-f-note'; d.textContent = txt; c.appendChild(d); return d; }
  function burst(emojis, n) {
    for (var i = 0; i < n; i++) {
      (function (i) {
        var s = document.createElement('div');
        s.textContent = pick(emojis);
        s.style.cssText = 'position:fixed;z-index:12999;pointer-events:none;bottom:-40px;left:' + (15 + Math.random() * 60) + '%;font-size:' + (16 + Math.random() * 20) + 'px;transition:transform 1.4s ease-out,opacity 1.4s';
        document.body.appendChild(s);
        setTimeout(function () { s.style.transform = 'translateY(-' + (300 + Math.random() * 250) + 'px) rotate(' + (Math.random() * 60 - 30) + 'deg)'; s.style.opacity = '0'; }, 30 + i * 50);
        setTimeout(function () { s.remove(); }, 1800);
      })(i);
    }
  }
  var POETRY = window.__sqPoetryCats || [];
  function sherPool() { var a = []; POETRY.forEach(function (c) { a = a.concat(c[3] || []); }); return a; }

  /* 1 Dua Corner */
  var DUAS = ['Ya Allah, meri har mushkil ko asani bana \u2014 aameen.', 'Aye mere Rub, mera dil ko sukoon de aur mere kaamon mein barkat \u2014 aameen.', 'Meri duayein qabool ho aur meri umeedein kam na ho \u2014 aameen.', 'Har din ka rizq, hifazat aur sehat ka shukriya \u2014 aameen.', 'Jo log mere liye dua karte hain unhe bhi khushyan dein \u2014 aameen.', 'Ilm mein izafa, dil mein noor \u2014 aameen.', 'Gham ko khushi mein badal dene wala tu hi hai \u2014 aameen.', 'Mere walidain par reham \u2014 aameen.'];
  function dua() { var d = DUAS[dayIndex() % DUAS.length]; modal4('\uD83D\uDE4C Dua Corner \u2014 aaj ki dua', function (c) { var b = big(c, d); b.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif"; note(c, 'Roz nayi dua \u2014 dil se parhein.'); }); }

  /* 2 Gulab Bhejo */
  function gulab() {
    modal4('\uD83C\uDF39 Gulab Bhejo', function (c) {
      var n = big(c, (lsG('sq-roses') || '0') + ' \uD83C\uDF39');
      var s = note(c, 'Gulab bhejte rahen \u2014 ginti mehfooz rehti hai.');
      btn(c, '\uD83C\uDF39 Gulab bhejein', function () {
        lsS('sq-roses', String((parseInt(lsG('sq-roses') || '0', 10) || 0) + 1));
        n.textContent = lsG('sq-roses') + ' \uD83C\uDF39';
        burst(['\uD83C\uDF39', '\uD83C\uDF39', '\u2764\uFE0F'], 6);
      });
    });
  }

  /* 3 Voice Note Corner */
  function voice() {
    modal4('\uD83C\uDF99\uFE0F Voice Note Corner', function (c) {
      var rec = null, chunks = [], busy = false;
      var status = note(c, 'Record dabayen \u2014 20 second tak awaz.');
      var list = document.createElement('div'); list.style.marginTop = '8px';
      function paint() {
        list.innerHTML = '';
        var notes = lsJ('sq-voice', []);
        notes.forEach(function (nt, i) {
          var a = document.createElement('audio'); a.controls = true; a.src = nt; a.style.cssText = 'width:100%;margin:4px 0';
          var row = document.createElement('div');
          row.appendChild(a);
          var del = document.createElement('button'); del.type = 'button'; del.className = 'sq-f-btn2'; del.textContent = '\u2716';
          del.onclick = function () { var ns = lsJ('sq-voice', []); ns.splice(i, 1); lsS('sq-voice', JSON.stringify(ns)); paint(); };
          row.appendChild(del);
          list.appendChild(row);
        });
      }
      var b = btn(c, '\u23FA Record shuru', function () {
        if (busy) return;
        if (!rec) { status.textContent = 'Mic ki ijazat nahi mili.'; return; }
        busy = true; chunks = [];
        rec.start(); b.textContent = '\u23F9 Rukein (max 20s)';
        var to = setTimeout(function () { if (rec.state === 'recording') rec.stop(); }, 20000);
        rec.onstop = function () {
          clearTimeout(to); busy = false; b.textContent = '\u23FA Record shuru';
          var blob = new Blob(chunks, { type: 'audio/webm' });
          var fr = new FileReader();
          fr.onload = function () {
            try {
              var ns = lsJ('sq-voice', []); ns.push(fr.result); lsS('sq-voice', JSON.stringify(ns)); paint();
            } catch (e) { status.textContent = 'Jaga nahi bachi \u2014 purana note delete karein.'; }
          };
          fr.readAsDataURL(blob);
        };
        b.onclick = function () { if (rec.state === 'recording') rec.stop(); b.onclick = arguments.callee ? b.onclick : null; location.hash = ''; btnRebind(); };
        function btnRebind() { b.textContent = '\u23F9 Rukein'; b.onclick = function () { if (rec && rec.state === 'recording') rec.stop(); }; }
      });
      c.appendChild(list);
      var notes = lsJ('sq-voice', []); paint();
      if (!navigator.mediaDevices || !window.MediaRecorder) { status.textContent = 'Is browser mein recording nahi chalti.'; return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (str) {
        rec = new MediaRecorder(str);
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      }).catch(function () { status.textContent = 'Mic ki ijazat nahi mili \u2014 browser settings check karein.'; });
    });
  }

  /* 4 Aaj ka Sabaq */
  var SABAQ = ['Jo log doosron ke kaam aate hain, wo sab ke dil mein rehte hain.', 'Sach ki hamesha jeet hoti hai \u2014 waqt lagta hai magar hoti hai.', 'Shukar karne wala kam se kam nahi hota.', 'Ilm wo daulat hai jo kharch karne par barhti hai.', 'Maa ki dua jannat ki hawa hai.', 'Jo waqt ke qadar kare, waqt us ki qadar karta hai.', 'Neki chhupi bhi to phoolon jaisi mehak ati hai.', 'Sabr ka phal meetha hota hai.', 'Doosron ke liye dua karo \u2014 farishte likhte hain.', 'Koshish karne walo ki kabhi haar nahi hoti.'];
  function sabaq() { modal4('\uD83D\uDCD6 Aaj ka Sabaq', function (c) { var b = big(c, SABAQ[dayIndex() % SABAQ.length]); b.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif"; note(c, 'Roz ek naya sabaq \u2014 dil par lagayein.'); }); }

  /* 5 Nazar Utaro */
  function nazar() {
    modal4('\uD83E\uDDFF Nazar Utaro', function (c) {
      var n = big(c, (lsG('sq-nazar') || '0') + ' \uD83E\uDDFF');
      btn(c, '\uD83E\uDDFF Nazar utarein', function () {
        lsS('sq-nazar', String((parseInt(lsG('sq-nazar') || '0', 10) || 0) + 1));
        n.textContent = lsG('sq-nazar') + ' \uD83E\uDDFF';
        burst(['\uD83E\uDDFF', '\u2728'], 5);
      });
      note(c, 'Buri nazar se hifazat \u2014 jitni martaba chahein.');
    });
  }

  /* 6 Mystery Pass */
  function mystery() {
    modal4('\uD83C\uDFF0 Mystery Pass', function (c) {
      var last = parseInt(lsG('sq-mystery-day') || '0', 10) || 0;
      var diff = dayIndex() - last;
      if (diff >= 7 || last === 0) {
        lsS('sq-mystery-day', String(dayIndex()));
        big(c, '\uD83C\uDF81 SPECIAL SURPRISE UNLOCKED!');
        var s = big(c, Math.random() < .5 ? pick(sherPool()).replace(' | ', '\n') : 'Aap is website ki sab se khaas shakhsiyat hain \u2014 yahi asli surprise hai. \u2728');
        s.style.fontFamily = "'Noto Nastaliq Urdu','Gulzar',serif";
        note(c, 'Agla surprise 7 din baad \u2014 rozana aayen!');
      } else {
        big(c, '\uD83D\uDD12 Pass abhi band hai');
        note(c, 'Surprise mein ' + (7 - diff) + ' din bache hain. Rozana aate rahen \u2014 jaldi khulega!');
      }
    });
  }

  /* 7 Soch Badlo */
  var SOCH = ['Ye raat guzar jayegi \u2014 subah aap ki hai.', 'Jo aaj mushkil hai, kal wo aap ki taaqat ki kahani hogi.', 'Aap us se zyada strong hain jitna aap samajhte hain.', 'Chhote kadam bhi manzil hain \u2014 rukna manzil nahi.', 'Aaj bas ek achha kaam karein \u2014 baqi khud ba khud theek hoga.', 'Dil ko halka karna hai? Apni saans ko 4 ginti tak lein \u2014 4 rakhein \u2014 4 chhod dein.'];
  function soch() { modal4('\uD83D\uDCAD Soch Badlo', function (c) { var d = big(c, '\u2728'); btn(c, '\uD83D\uDCAD Naya soch', function () { d.textContent = pick(SOCH); }); note(c, 'Jab udaasi bhaari lage \u2014 ek naya soch.'); }); }

  /* 8 Sapno ka Naqsha */
  function sapne() {
    modal4('\uD83D\uDDFA\uFE0F Sapno ka Naqsha \u2014 bucket list', function (c) {
      var inp = document.createElement('input'); inp.className = 'sq-f-in'; inp.placeholder = 'Ek sapna likhein...';
      var list = document.createElement('div'); list.style.marginTop = '8px';
      function paint() {
        list.innerHTML = '';
        lsJ('sq-sapne', []).forEach(function (s, i) {
          var row = document.createElement('div');
          row.style.cssText = 'display:flex;gap:6px;align-items:center;margin:4px 0';
          var t = document.createElement('span'); t.textContent = '\u2B50 ' + s; t.style.cssText = 'flex:1;font-size:14px';
          var del = document.createElement('button'); del.type = 'button'; del.className = 'sq-f-btn2'; del.textContent = '\u2716';
          del.onclick = function () { var ns = lsJ('sq-sapne', []); ns.splice(i, 1); lsS('sq-sapne', JSON.stringify(ns)); paint(); };
          row.appendChild(t); row.appendChild(del); list.appendChild(row);
        });
        if (!lsJ('sq-sapne', []).length) note(list, 'Abhi koi sapna nahi \u2014 pehla likhein!');
      }
      btn(c, '\u2B50 JAMA karein', function () { var v = (inp.value || '').trim(); if (!v) return; var ns = lsJ('sq-sapne', []); ns.push(v); lsS('sq-sapne', JSON.stringify(ns)); inp.value = ''; paint(); });
      c.appendChild(inp); c.appendChild(list); paint();
    });
  }

  /* 9 Namaz Check-in */
  var NAMAZ = ['Fajr', 'Zohar', 'Asar', 'Maghrib', 'Isha'];
  function namaz() {
    modal4('\u26F3 Namaz Check-in', function (c) {
      var key = 'sq-namaz-' + today();
      var state = lsJ(key, [false, false, false, false, false]);
      var done = big(c, '');
      function paint() {
        var count = state.filter(Boolean).length;
        done.textContent = count + '/5 namazein \u2014 ' + (count === 5 ? '\u2728 MashaAllah, poora din!' : '');
        list.innerHTML = '';
        NAMAZ.forEach(function (nm, i) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-f-btn2';
          b.style.cssText += 'display:block;width:100%;text-align:left;margin:4px 0;opacity:' + (state[i] ? '.6' : '1');
          b.textContent = (state[i] ? '\u2611 ' : '\u2610 ') + nm;
          b.onclick = function () { state[i] = !state[i]; lsS(key, JSON.stringify(state)); paint(); };
          list.appendChild(b);
        });
      }
      var list = document.createElement('div');
      c.appendChild(done); c.appendChild(list); paint();
      note(c, 'Har namaz ke baad tick karein \u2014 hisaab rozana naya.');
    });
  }

  /* 10 Rang Bharo */
  var COLORS = ['#e97b9c', '#f0c96a', '#7bd4a0', '#7bb2e9', '#c48be9', '#ef8763'];
  function rang() {
    modal4('\uD83C\uDFA8 Rang Bharo', function (c) {
      var g = document.createElement('div');
      g.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:3px;margin-top:10px';
      var ci = 0;
      for (var i = 0; i < 64; i++) {
        (function (i) {
          var cell = document.createElement('div');
          cell.style.cssText = 'aspect-ratio:1;border-radius:6px;background:#1c1c26;cursor:pointer';
          cell.onclick = function () { cell.style.background = COLORS[ci % COLORS.length]; ci = (ci + 1) % COLORS.length; };
          g.appendChild(cell);
        })(i);
      }
      c.appendChild(g);
      note(c, 'Har tap par naya rang \u2014 apna pattern banayein.');
    });
  }

  /* 11 Yaad-e-Wasl */
  function yaad() {
    modal4('\uD83D\uDCC5 Yaad-e-Wasl', function (c) {
      var inp = document.createElement('input'); inp.className = 'sq-f-in'; inp.placeholder = 'Khaas tareekh (2026-12-25) + naam...';
      var list = document.createElement('div');
      function paint() {
        list.innerHTML = '';
        lsJ('sq-yaad', []).forEach(function (m, i) {
          var d = Math.ceil((new Date(m.date) - new Date()) / 86400000);
          var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;align-items:center;margin:4px 0';
          var t = document.createElement('span'); t.style.cssText = 'flex:1;font-size:14px';
          t.textContent = '\u2764\uFE0F ' + m.name + ' \u2014 ' + (d > 0 ? d + ' din bache' : d === 0 ? 'AAJ KA DIN!' : Math.abs(d) + ' din ho gaye');
          var del = document.createElement('button'); del.type = 'button'; del.className = 'sq-f-btn2'; del.textContent = '\u2716';
          del.onclick = function () { var ns = lsJ('sq-yaad', []); ns.splice(i, 1); lsS('sq-yaad', JSON.stringify(ns)); paint(); };
          row.appendChild(t); row.appendChild(del); list.appendChild(row);
        });
        if (!lsJ('sq-yaad', []).length) note(list, 'Koi tareekh add nahi \u2014 jaise koi khaas din.');
      }
      btn(c, '\u2764\uFE0F Add karein', function () {
        var v = (inp.value || '').trim(); if (!v) return;
        var mDate = v.match(/(\d{4}-\d{2}-\d{2})/);
        var ns = lsJ('sq-yaad', []);
        ns.push({ name: v.replace(/(\d{4}-\d{2}-\d{2})/, '').trim() || 'Khaas din', date: mDate ? mDate[1] : today() });
        lsS('sq-yaad', JSON.stringify(ns)); inp.value = ''; paint();
      });
      c.appendChild(inp); c.appendChild(list); paint();
      note(c, 'Format: tareekh likhein, phir naam \u2014 "2026-12-25 Birthday".');
    });
  }

  /* 12 Palm Reader */
  function palm() {
    modal4('\uD83D\uDD2E Palm Reader \u2014 mazahiya', function (c) {
      var out = big(c, '\u270B Haath rakhein aur dabayen...');
      btn(c, '\u270B Haath parhein', function () {
        out.textContent = pick([
          'Aap ki kismat mein kamyabi likhi hai \u2014 bas thora sabr. \uD83C\uDF1F',
          'Dil ka line kehta hai: koi khaas shakhs aap ke sath hai \u2014 yehi website uski nishani hai. \u2764\uFE0F',
          'Zindagi ki lakeer seedhi nahi, magar hamesha oopar jati hai. \u2197\uFE0F',
          'Aap jald apni mehnat ka phal dekhein ge \u2014 chhoti si khushkhabri aa rahi hai. \uD83C\uDF81',
          'Hath par likha hai: aaj koi aisi baat sunenge jo dil khush kar de. \uD83C\uDFB5',
          'Paiso ki line strong hai \u2014 halanki kharch bhi strong hai. \uD83D\uDE04'
        ]);
      });
      note(c, 'Ye sirf mazah ke liye hai \u2014 asli taqdeer mehnat se banti hai.');
    });
  }

  /* 13 Mood Radio */
  function radio() {
    modal4('\uD83C\uDFA7 Mood Radio', function (c) {
      note(c, 'Mood chunein \u2014 Music section mein mulk ka best milta hai.');
      var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px';
      [['\uD83D\uDE04 Khushi', 'Naat'], ['\uD83D\uDE0C Sukoon', 'Tilawat'], ['\uD83E\uDD7A Udaasi', 'Qawwali']].forEach(function (m) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-f-btn2'; b.textContent = m[0];
        b.onclick = function () {
          var mus = q('#sq-music'); if (!mus) { alert('Music section nahi mila.'); return; }
          var tabs = mus.querySelectorAll('.sq-poetry-tab'); var found = false;
          tabs.forEach(function (t) { if (t.textContent.indexOf(m[1]) >= 0) { t.click(); found = true; } });
          setTimeout(function () {
            var tracks = mus.querySelectorAll('.sq-music-track');
            if (tracks.length) tracks[Math.floor(Math.random() * tracks.length)].click();
            var ov = document.getElementById('sq-feat-ov'); if (ov) ov.remove();
          }, 450);
        };
        row.appendChild(b);
      });
      c.appendChild(row);
    });
  }

  /* 14 Sandook */
  function sandook() {
    modal4('\uD83D\uDCDC Sandook \u2014 apni chithiyan', function (c) {
      var inp = document.createElement('textarea');
      inp.style.cssText = 'width:100%;min-height:70px;background:#0f0f16;color:#f0e6d2;border:1px solid #f0c96a55;border-radius:10px;padding:10px;font-size:14px;box-sizing:border-box';
      inp.placeholder = 'Nayi chithi likhein (Sirf aap ke device par mehfooz)...';
      var list = document.createElement('div');
      function paint() {
        list.innerHTML = '';
        lsJ('sq-sandook', []).forEach(function (l, i) {
          var row = document.createElement('div');
          row.style.cssText = 'border:1px dashed #f0c96a55;border-radius:10px;padding:8px;margin:6px 0;font-size:13px;white-space:pre-line';
          row.textContent = '\u2709 ' + l;
          var del = document.createElement('button'); del.type = 'button'; del.className = 'sq-f-btn2'; del.textContent = '\u2716';
          del.style.cssText += 'float:right';
          del.onclick = function () { var ns = lsJ('sq-sandook', []); ns.splice(i, 1); lsS('sq-sandook', JSON.stringify(ns)); paint(); };
          row.appendChild(del); list.appendChild(row);
        });
        if (!lsJ('sq-sandook', []).length) note(list, 'Sandook khali hai \u2014 pehli chithi likhein.');
      }
      btn(c, '\u2709 Sandook mein daalein', function () { var v = (inp.value || '').trim(); if (!v) return; var ns = lsJ('sq-sandook', []); ns.push(v); lsS('sq-sandook', JSON.stringify(ns)); inp.value = ''; paint(); });
      c.appendChild(inp); c.appendChild(list); paint();
    });
  }

  /* 15 Aadat Tracker */
  function aadat() {
    modal4('\uD83C\uDFC3 Aadat Tracker', function (c) {
      var inp = document.createElement('input'); inp.className = 'sq-f-in'; inp.placeholder = 'Apni achhi aadat likhein (parhna / exercise)...';
      var done = big(c, '');
      var list = document.createElement('div');
      function paint() {
        var h = lsG('sq-aadat-name') || '';
        if (!h) { done.textContent = 'Pehle aadat chunein.'; list.innerHTML = ''; return; }
        var days = lsJ('sq-aadat', {});
        var t = today();
        if (!days[t]) days[t] = false;
        var streak = 0; var d = new Date();
        while (days[d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()]) { streak++; d.setDate(d.getDate() - 1); }
        done.textContent = h + ' \u2014 streak: ' + streak + ' din \uD83D\uDD25';
        list.innerHTML = '';
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-f-btn';
        b.textContent = days[t] ? '\u2611 Aaj ho gaya' : '\u2610 Aaj ka tick lagayen';
        b.onclick = function () { days[t] = !days[t]; lsS('sq-aadat', JSON.stringify(days)); paint(); };
        list.appendChild(b);
      }
      btn(c, '\u2705 Aadat set karein', function () { var v = (inp.value || '').trim(); if (v) { lsS('sq-aadat-name', v); paint(); } });
      c.appendChild(inp); c.appendChild(done); c.appendChild(list); paint();
    });
  }

  /* 16 Zindagi ka Paimana */
  function paimana() {
    modal4('\uD83C\uDF08 Zindagi ka Paimana', function (c) {
      var days = lsJ('sq-mood-w', {});
      var t = today();
      var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;justify-content:center;margin:10px 0';
      var msg = big(c, '');
      function paint() {
        row.innerHTML = '';
        for (var i = 1; i <= 5; i++) {
          (function (i) {
            var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-f-btn2';
            b.textContent = ['', '\uD83D\uDE1E', '\uD83D\uDE10', '\uD83D\uDE0A', '\uD83D\uDE04', '\uD83E\uDD70'][i];
            b.onclick = function () { days[t] = i; lsS('sq-mood-w', JSON.stringify(days)); paint(); };
            if (days[t] === i) b.style.cssText += 'border-color:#f0c96a;color:#f0c96a';
            row.appendChild(b);
          })(i);
        }
        var g = document.createElement('div');
        g.style.cssText = 'display:flex;gap:3px;align-items:flex-end;height:70px;justify-content:center;margin-top:8px';
        var dt = new Date(); var bars = 0;
        for (var k = 6; k >= 0; k--) {
          var d2 = new Date(dt); d2.setDate(d2.getDate() - k);
          var kk = d2.getFullYear() + '-' + (d2.getMonth() + 1) + '-' + d2.getDate();
          var v = days[kk] || 0;
          var bar = document.createElement('div');
          bar.style.cssText = 'width:26px;background:' + (v ? '#f0c96a' : '#33333f') + ';height:' + (v ? v * 14 : 4) + 'px;border-radius:4px 4px 0 0';
          bar.title = kk;
          g.appendChild(bar); bars += v ? 1 : 0;
        }
        c.querySelectorAll('.sq-mood-graph').forEach(function (e) { e.remove(); });
        g.className = 'sq-mood-graph';
        msg.textContent = bars ? 'Is hafte ' + bars + '/7 din ka mood record hua.' : 'Aaj ka mood chunein \u2014 hafta bhar ka graph banega.';
        c.appendChild(g);
      }
      c.appendChild(row); paint();
    });
  }

  /* 17 Andaaz-e-Saqib */
  function andaaz() {
    modal4('\uD83C\uDFAD Andaaz \u2014 Sunehri Batein', function (c) {
      var out = big(c, '\u201C...\u201D');
      btn(c, '\uD83C\uDFAD Nayi baat', function () {
        out.textContent = pick([
          '\u201CJo dil se mile, wo dil jeet leta hai.\u201D',
          '\u201CKamyabi wo nahi jo mil jaye \u2014 kamyabi wo hai jo milne par dil ko sukoon de.\u201D',
          '\u201CSacha dost wo jo mauzood bhi ho aur majboor bhi na kare.\u201D',
          '\u201CZindagi chhoti hai \u2014 bari baatein karo, pyar se.\u201D',
          '\u201CJo mila us par shukar, jo mila us par khush \u2014 yehi asal daulat hai.\u201D'
        ]);
      });
      note(c, 'Sunehri baatein \u2014 dil se nikali hui.');
    });
  }

  /* 18 Himmat ka Khoont */
  var HIMMAT = ['Sabh kuch theek ho jayega \u2014 hamesha hota hai.', 'Aap ne pehle bhi mushkil waqt dekha hai \u2014 aap ne haar nahi mani.', 'Aaj ka din aap ke khilaf hai, aap ke sath nahi.', 'Bas ek kadam \u2014 bas aaj ka kadam.', 'Aap akela nahi hain \u2014 koi yaad kar raha hai.', 'Rona bhi ibadat hai kabhi kabhi \u2014 phir uth kar himmat bhi.', 'Mushkilein aap ki taqdeer nahi, aap ka imtihan hai \u2014 aur aap pass honge.', 'Aaj bas sota jayen \u2014 kal subah sab kuch thora asan hoga.', 'Aap se bohat log pyar karte hain \u2014 bhool na jayen.', 'Ye din guzar jayega \u2014 aur aap zor se aayenge. \u2728'];
  function himmat() {
    modal4('\uD83D\uDEE1\uFE0F Himmat ka Khoont', function (c) {
      var idx = 0;
      var out = big(c, 'Tap karte jayen \u2014 himmat badhti jayegi');
      btn(c, '\uD83D\uDEE1\uFE0F Ek khoont aur', function () {
        out.textContent = HIMMAT[idx % HIMMAT.length];
        idx++;
      });
    });
  }

  /* 19 Sher Puzzle */
  function puzzle() {
    modal4('\uD83E\uDDE9 Sher Puzzle', function (c) {
      var target = pick(sherPool());
      var parts = target.split(' | ');
      var line = parts[0] || target;
      var words = line.split(' ').filter(Boolean);
      var answer = [];
      var status = note(c, 'Alfaaz par tap karein \u2014 tarteeb banayen.');
      var answerBox = document.createElement('div');
      answerBox.style.cssText = 'min-height:44px;border:1px dashed #f0c96a66;border-radius:10px;padding:8px;margin:8px 0;font-family:\'Noto Nastaliq Urdu\',\'Gulzar\',serif;font-size:18px;direction:rtl;text-align:center';
      var bank = document.createElement('div');
      bank.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center';
      var shuffled = words.slice().sort(function () { return Math.random() - .5; });
      var buttons = [];
      function paintAnswer() {
        answerBox.textContent = answer.map(function (w) { return w.w; }).join(' ');
        bank.querySelectorAll('button').forEach(function (b, i) { b.style.display = answer.some(function (a) { return a.i === i; }) ? 'none' : ''; });
        if (answer.length === words.length) {
          var ok = answer.map(function (a) { return a.w; }).join(' ') === line;
          status.textContent = ok ? '\u2728 Sahi! Zabardast!' : '\u2716 Ghalat tarteeb \u2014 Reset karein.';
        } else status.textContent = 'Alfaaz par tap karein \u2014 tarteeb banayen.';
      }
      shuffled.forEach(function (w, i) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-f-btn2';
        b.style.cssText += 'font-family:\'Noto Nastaliq Urdu\',\'Gulzar\',serif;font-size:16px';
        b.textContent = w;
        b.onclick = function () { answer.push({ w: w, i: i }); paintAnswer(); };
        buttons.push(b); bank.appendChild(b);
      });
      btn(c, '\u21BA Reset', function () { answer = []; paintAnswer(); });
      c.appendChild(answerBox); c.appendChild(bank);
      paintAnswer();
    });
  }

  /* 20 Khwab Tabeer */
  function khwab() {
    modal4('\uD83C\uDF20 Khwab Tabeer \u2014 mazahiya', function (c) {
      var inp = document.createElement('input'); inp.className = 'sq-f-in'; inp.placeholder = 'Apna khwab likhein...';
      var out = big(c, '');
      btn(c, '\uD83C\uDF20 Tabeer batayen', function () {
        var v = (inp.value || '').trim();
        if (!v) { out.textContent = 'Pehle khwab likhein :)'; return; }
        out.textContent = pick([
          '\u201C' + v.slice(0, 40) + '\u201D \u2014 iska matlab: koi khaas shakhs aap ke bare mein soch raha hai. \uD83D\uDC9C',
          'Ye khwab khushi ki nishani hai \u2014 jald achhi khabar milegi. \u2728',
          'Iska tabeer: aap ka dil sukoon chahta hai \u2014 aaj aaram karein. \uD83C\uDF19',
          'Tabeer: safar mein barkat \u2014 koi purana dost yaad karega. \uD83D\uDCDE',
          'Ye khwab kehta hai: mushkil asan ho rahi hai \u2014 himmat na harein. \uD83C\uDF1F'
        ]) + ' (Mazahiya tabeer \u2014 asli ilm sirf Allah ko hai.)';
      });
      c.appendChild(inp); c.appendChild(out);
      note(c, 'Sirf maza ke liye \u2014 haqeeqi ilm sirf Allah ke pass hai.');
    });
  }

  var ZONE_TILES = [
    ['\uD83D\uDE4C', 'Dua Corner', dua], ['\uD83C\uDF39', 'Gulab Bhejo', gulab], ['\uD83C\uDF99\uFE0F', 'Voice Note', voice],
    ['\uD83D\uDCD6', 'Aaj ka Sabaq', sabaq], ['\uD83E\uDDFF', 'Nazar Utaro', nazar], ['\uD83C\uDFF0', 'Mystery Pass', mystery],
    ['\uD83D\uDCAD', 'Soch Badlo', soch], ['\uD83D\uDDFA\uFE0F', 'Sapno ka Naqsha', sapne], ['\u26F3', 'Namaz Check-in', namaz],
    ['\uD83C\uDFA8', 'Rang Bharo', rang], ['\uD83D\uDCC5', 'Yaad-e-Wasl', yaad], ['\uD83D\uDD2E', 'Palm Reader', palm],
    ['\uD83C\uDFA7', 'Mood Radio', radio], ['\uD83D\uDCDC', 'Sandook', sandook], ['\uD83C\uDFC3', 'Aadat Tracker', aadat],
    ['\uD83C\uDF08', 'Zindagi ka Paimana', paimana], ['\uD83C\uDFAD', 'Andaaz', andaaz], ['\uD83D\uDEE1\uFE0F', 'Himmat ka Khoont', himmat],
    ['\uD83E\uDDE9', 'Sher Puzzle', puzzle], ['\uD83C\uDF20', 'Khwab Tabeer', khwab]
  ];
  function build() {
    if (q('#sq-zone')) return true;
    var host = q('#sq-hearts');
    if (!host || !host.parentNode) return false;
    var sec = document.createElement('section');
    sec.className = 'section sq-sec'; sec.id = 'sq-zone';
    var head = document.createElement('div'); head.className = 'section-header';
    head.innerHTML = '<h2>13 \u2014 Saqib Zone</h2>';
    var p = document.createElement('p'); p.className = 'sq-sec-sub';
    p.textContent = '20 khaas cheezein \u2014 dua, khushyan, khel aur maza';
    head.appendChild(p); sec.appendChild(head);
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:6px';
    ZONE_TILES.forEach(function (t) {
      var tile = document.createElement('button');
      tile.type = 'button'; tile.className = 'sq-hub-tile';
      tile.innerHTML = '<span>' + t[0] + '</span>' + t[1];
      tile.onclick = function () { t[2](); };
      grid.appendChild(tile);
    });
    sec.appendChild(grid);
    host.parentNode.insertBefore(sec, host.nextSibling);
    return true;
  }
  var tries = 0;
  var iv = setInterval(function () { if (build() || ++tries > 50) clearInterval(iv); }, 1200);
})();

/* ===== Kit: Cursor Picker v2 — cursor + trails (sparkle / heart / comet fixed) ===== */
(function () {
  'use strict';
  if (window.__sqCursor) return;
  window.__sqCursor = true;
  function lsS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsG(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var fine = window.matchMedia && window.matchMedia('(pointer:fine)').matches;

  function cursorPNG(kind) {
    var cv = document.createElement('canvas'); cv.width = 32; cv.height = 32;
    var x = cv.getContext('2d'); if (!x) return '';
    x.textBaseline = 'middle'; x.textAlign = 'center';
    if (kind === 'ring') {
      x.strokeStyle = '#f0c96a'; x.lineWidth = 3;
      x.shadowColor = '#f0c96a'; x.shadowBlur = 8;
      x.beginPath(); x.arc(16, 16, 9, 0, 7); x.stroke();
      x.beginPath(); x.arc(16, 16, 2, 0, 7); x.fillStyle = '#f0c96a'; x.fill();
    } else if (kind === 'orb') {
      var g = x.createLinearGradient(6, 6, 26, 26);
      g.addColorStop(0, '#e97b9c'); g.addColorStop(1, '#f0c96a');
      x.fillStyle = g; x.shadowColor = '#e97b9c'; x.shadowBlur = 10;
      x.beginPath(); x.arc(16, 16, 9, 0, 7); x.fill();
      x.fillStyle = '#ffffffcc'; x.beginPath(); x.arc(12, 12, 3, 0, 7); x.fill();
    } else if (kind === 'sparkle') {
      x.font = '24px serif'; x.fillText('\u2728', 16, 17);
      x.font = '12px serif'; x.fillText('\u2B50', 26, 26);
    } else if (kind === 'heart') {
      x.font = '24px serif'; x.fillText('\u2764\uFE0F', 16, 17);
    } else if (kind === 'comet') {
      x.font = '24px serif'; x.fillText('\uD83D\uDCAB', 16, 17);
    } else if (kind === 'crown') { x.font = '22px serif'; x.fillText('\uD83D\uDC51', 16, 17); }
    else if (kind === 'crescent') { x.font = '22px serif'; x.fillText('\uD83C\uDF19', 16, 17); }
    else if (kind === 'heartdot') { x.font = '20px serif'; x.fillText('\u2764\uFE0F', 16, 17); }
    try { return cv.toDataURL('image/png'); } catch (e) { return ''; }
  }

  /* trail icons per cursor kind (sparkle / heart / comet / mix) */
  var TRAILS = {
    mix: ['\u2728'],
    sparkle: ['\u2728', '\u2B50', '\uD83D\uDCAB'],
    heart: ['\u2764\uFE0F', '\uD83D\uDC9C'],
    comet: ['\uD83D\uDCAB', '\u2728', '\u2604\uFE0F']
  };

  function apply(kind) {
    if (kind === 'normal') {
      document.body.style.cursor = '';
      window.__sqTrailIcons = null;
      lsS('sq-cursor', 'normal');
      return;
    }
    var url = cursorPNG(kind === 'mix' ? 'ring' : kind);
    document.body.style.cursor = url ? 'url(' + url + ') 16 16, auto' : '';
    window.__sqTrailIcons = TRAILS[kind] || null;
    lsS('sq-cursor', kind);
  }
  window.sqApplyCursor = apply;

  /* trail spawner — chalta hai jab trail cursor ON ho */
  var lastT = 0;
  function spawn(e) {
    var icons = window.__sqTrailIcons;
    if (!icons || !icons.length) return;
    var now = Date.now();
    if (now - lastT < 55) return;
    lastT = now;
    var s = document.createElement('div');
    s.textContent = icons[Math.floor(Math.random() * icons.length)];
    s.style.cssText = 'position:fixed;z-index:12998;pointer-events:none;left:' + (e.clientX - 10 + (Math.random() * 12 - 6)) + 'px;top:' + (e.clientY - 10 + (Math.random() * 12 - 6)) + 'px;font-size:14px;opacity:1;transition:transform 1.2s ease-out,opacity 1.2s;will-change:transform,opacity';
    document.body.appendChild(s);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        s.style.transform = 'translateY(26px) scale(.35) rotate(' + (Math.random() * 40 - 20) + 'deg)';
        s.style.opacity = '0';
      });
    });
    setTimeout(function () { try { s.remove(); } catch (e2) {} }, 1500);
  }
  document.addEventListener('mousemove', spawn, { passive: true });
  document.addEventListener('pointermove', function (e) { if (!e.pointerType || e.pointerType === 'mouse') spawn(e); }, { passive: true });

  var CURSORS = [
    ['normal', '\u2B1C Normal', 'Default cursor'],
    ['ring', '\uD83D\uDFE1 Golden Glow Ring', 'Chamakta sunehri ring'],
    ['sparkle', '\u2728 Sparkle Trail', 'Sitare girte hain'],
    ['heart', '\u2764\uFE0F Heart Trail', 'Dillay peeche urte hain'],
    ['crown', '\uD83D\uDC51 Crown', 'Sunehri taj'],
    ['comet', '\uD83D\uDCAB Comet Trail', 'Dhumaketu tail'],
    ['crescent', '\uD83C\uDF19 Crescent Glow', 'Chand cursor'],
    ['orb', '\uD83D\uDD2E Gradient Orb', 'Rang badalta ball'],
    ['mix', '\uD83C\uDFAF Mix Mode', 'Ring + sparkle combo']
  ];

  function picker() {
    var old = document.getElementById('sq-feat-ov'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'sq-feat-ov';
    var card = document.createElement('div'); card.id = 'sq-feat-card';
    var x = document.createElement('button'); x.className = 'sq-fx'; x.type = 'button'; x.innerHTML = '\u00D7';
    x.setAttribute('aria-label', 'Band karein'); x.onclick = function () { ov.remove(); };
    var h = document.createElement('h3'); h.textContent = '\uD83D\uDDBC\uFE0F Cursor chunein'; h.appendChild(x);
    card.appendChild(h);
    var cur = lsG('sq-cursor') || 'normal';
    CURSORS.forEach(function (cs) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-f-btn2';
      b.style.cssText += 'display:block;width:100%;text-align:left;margin:5px 0;' + (cur === cs[0] ? 'border-color:#f0c96a;color:#f0c96a' : '');
      b.innerHTML = '<span style="font-family:inherit">' + cs[1] + '</span><br><span style="font-size:11px;opacity:.7;font-family:inherit">' + cs[2] + '</span>';
      if (fine && cs[0] !== 'normal') {
        try {
          var pu = cursorPNG(cs[0] === 'mix' ? 'ring' : cs[0]);
          if (pu) b.style.cursor = 'url(' + pu + ') 16 16, auto';
        } catch (e) {}
      }
      b.onclick = function () { apply(cs[0]); ov.remove(); };
      card.appendChild(b);
    });
    ov.appendChild(card);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }
  function isTouchOnly() {
    try { return window.matchMedia('(hover: none), (pointer: coarse)').matches; } catch (e) { return false; }
  }
  function injectBtn() {
    var anchor = document.querySelector('.font-toggle');
    if (!anchor || !anchor.parentNode) return false;
    var b = document.getElementById('sq-cursor-btn');
    if (b) { if (b.parentNode !== anchor.parentNode) anchor.parentNode.insertBefore(b, anchor); return true; }
    b = document.createElement('button');
    b.type = 'button'; b.id = 'sq-cursor-btn'; b.className = 'nav-toggle sq-cursor-toggle';
    b.innerHTML = '<span style="font-size:14px" aria-hidden="true">\uD83D\uDDBC\uFE0F</span>';
    b.setAttribute('aria-label', 'Cursor change karein');
    b.title = 'Cursor chunein';
    try {
      var cs = window.getComputedStyle(anchor);
      ['width','height','border-radius','background','border','box-shadow','color','font-size','line-height','display','align-items','justify-content','padding','margin'].forEach(function (p) { b.style[p] = cs[p]; });
      b.style.flexShrink = '0';
    } catch (e) {}
    b.onclick = function () {
      if (isTouchOnly()) {
        var msg = '\uD83D\uDDA5\uFE0F Ye function sirf laptop / computer par kaam karta hai';
        if (window.sqToast) window.sqToast(msg);
        else alert(msg);
        return;
      }
      picker();
    };
    anchor.parentNode.insertBefore(b, anchor);
    return true;
  }
  var applied = false;
  setInterval(function () {
    var ok = injectBtn();
    if (!applied && ok) { applied = true; apply(lsG('sq-cursor') || 'normal'); }
  }, 1200);
})();

/* ===== Kit v34: mobile icon sizes + categories dots + left dock ===== */
(function () {
  'use strict';
  /* ---------- CSS (body ke end par inject — sab se aakhri word) ---------- */
  var css = [
    '/* --- v34 fixes --- */',
    /* dots (ab ☰ categories) — cursor icon ke baad, Aa uske baad */
    'html body #sq-dots-btn{inset-inline-end:56px!important;right:56px!important;z-index:12;flex-shrink:0;font-size:15px!important}',
    'html body .font-toggle{inset-inline-end:104px!important;right:104px!important}',
    /* left widgets default chhupi — dock khulne par nikalti hain */
    'html body #sq-dock-left-btn{position:fixed;bottom:18px;inset-inline-start:18px;left:18px;right:auto;z-index:11006;width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;font-size:21px;line-height:1;padding:0;background:linear-gradient(135deg,#7c5cff,#e97b9c 60%,#f0c96a);color:#fff;box-shadow:0 8px 24px #7c5cff66;transition:transform .25s,box-shadow .25s}',
    'html body #sq-dock-left-btn:active{transform:scale(.92)}',
    'body.sq-dock-left-open #sq-dock-left-btn{transform:rotate(90deg) scale(1.05);box-shadow:0 0 0 5px #ffffff33,0 8px 24px #7c5cff66}',
    /* left widgets default chhupi — dock khulne par nikalti hain */
    'html body #sq-app-btn,html body #sq-mode-btn,html body #sq-pk-clock,html body #sq-refresh-btn,html body #sq-anim-toggle{opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .22s,visibility .22s,transform .22s,bottom .22s}',
    'body.sq-dock-left-open #sq-refresh-btn{opacity:1!important;visibility:visible!important;transform:none;bottom:140px!important;left:20px!important}',
    'body.sq-dock-left-open #sq-pk-clock{opacity:1!important;visibility:visible!important;transform:none;bottom:200px!important;left:14px!important}',
    'body.sq-dock-left-open #sq-anim-toggle{opacity:1!important;visibility:visible!important;transform:none;bottom:244px!important;left:20px!important}',
    'body.sq-dock-left-open #sq-mode-btn{opacity:1!important;visibility:visible!important;transform:none;bottom:300px!important;left:14px!important}',
    'body.sq-dock-left-open #sq-app-btn{opacity:1!important;visibility:visible!important;transform:none;bottom:344px!important;left:20px!important}',
    /* gate (login) par naye buttons chhupi — class-based taake :has() na support karne wale phones par bhi chale */
    'body.sq-on-gate #sq-dots-btn,body.sq-on-gate #sq-dock-left-btn,body.sq-on-gate #sq-magic-btn{display:none!important}',
    'body:has(.gate-overlay) #sq-dots-btn,body:has(.gate-overlay) #sq-dock-left-btn,body:has(.gate-overlay) #sq-magic-btn{display:none!important}',
    'body:has(.font-panel) #sq-magic-btn,body:has(.font-panel) #sq-dots-btn,body:has(.font-panel) #sq-cursor-btn,body:has(.font-panel) #sq-dock-btn,body:has(.font-panel) #sq-dock-left-btn,body:has(.font-panel) #sq-top-btn,body:has(.font-panel) #sq-bottom-btn,body:has(.font-panel) #sq-fab,body:has(.font-panel) #sq-hub-btn,body:has(.font-panel) #sq-pk-clock,body:has(.font-panel) #sq-refresh-btn,body:has(.font-panel) #sq-app-btn,body:has(.font-panel) #sq-mode-btn{display:none!important}',
    /* dots menu panel */
    '#sq-dots-ov{position:fixed;inset:0;z-index:12000;background:#000a;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px}',
    '#sq-dots-card{background:rgba(24,10,34,.98);border:1px solid #f0c96a;border-radius:14px;padding:18px 16px;width:min(92vw,340px);max-height:80vh;overflow-y:auto;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.6);font-family:inherit}',
    '#sq-dots-card h3{margin:0 0 10px;font-size:17px;color:#f0c96a;display:flex;justify-content:space-between;align-items:center;gap:10px}',
    '#sq-dots-card .sq-fx{width:30px;height:30px;border-radius:50%;border:1px solid #ffffff22;background:transparent;color:#fff;font-size:16px;cursor:pointer;line-height:1}',
    '#sq-dots-card .sq-f-btn2{display:block;width:100%;text-align:left;margin:5px 0;padding:10px 12px;border-radius:10px;border:1px solid #ffffff22;background:#ffffff0d;color:#fff;font:inherit;font-size:13.5px;cursor:pointer;transition:border-color .15s,color .15s}',
    '#sq-dots-card .sq-f-btn2:hover{border-color:#f0c96a;color:#f0c96a}',
    '#sq-dots-empty{font-size:12px;opacity:.6;text-align:center;padding:14px 0}',
    '#sq-top-btn,#sq-bottom-btn{right:25px!important;inset-inline-end:25px!important}',
    /* duplicate social-row (React re-render) — sweeper data-sq-hide lagata hai */
    '.social-row[data-sq-hide]{display:none!important}',
    /* right column: sab buttons ka center ek hi line par — + , home, upar/neeche */
    'html body #sq-hub-btn{right:22px!important;inset-inline-end:22px!important}',
    'body.sq-dock-open #sq-anim-toggle,body.sq-dock-open #sq-dash-btn{right:25px!important;inset-inline-end:25px!important}',
    /* gate (login/signup) par bhi right column seedhi line mein */
    'body.sq-on-gate:not(.sq-chat-open) #sq-dock-btn,body.sq-on-gate:not(.sq-chat-open) #sq-hub-btn{opacity:1!important;visibility:visible!important;display:block!important}',
    'body:has(.gate-overlay):not(.sq-chat-open) #sq-dock-btn,body:has(.gate-overlay):not(.sq-chat-open) #sq-hub-btn{opacity:1!important;visibility:visible!important;display:block!important}',
    'body.sq-chat-open #sq-dock-btn,body.sq-chat-open #sq-chat-btn,body.sq-chat-open #sq-hub-btn,body.sq-chat-open #sq-fab,body.sq-chat-open #sq-anim-toggle,body.sq-chat-open #sq-dash-btn,body.sq-chat-open #sq-top-btn,body.sq-chat-open #sq-bottom-btn,body.sq-chat-open #sq-dock-left-btn,body.sq-chat-open #sq-dots-btn,body.sq-chat-open #sq-magic-btn,body.sq-chat-open #sq-pk-clock,body.sq-chat-open #sq-refresh-btn{display:none!important}',
    /* gate par PK time left side par nazar aaye */
    'body.sq-on-gate #sq-pk-clock{opacity:1!important;visibility:visible!important;transform:none!important;left:14px!important;inset-inline-start:14px!important;bottom:24px!important;z-index:11500!important;display:block!important}',
    /* premium welcome — login/signup ke baad */
    '#sq-welcome{position:fixed;inset:0;z-index:13200;display:flex;align-items:center;justify-content:center;padding:4vh 4vw;background:rgba(8,5,12,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);pointer-events:none;transition:opacity .45s;opacity:0}',
    '#sq-welcome.sq-wl-on{opacity:1;pointer-events:auto}',
    '#sq-welcome .sq-wl-card{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;width:min(92vw,900px);max-height:88vh;border-radius:24px;padding:48px 64px 40px;background:linear-gradient(135deg,rgba(24,10,34,.97),rgba(10,7,14,.97));border:1px solid transparent;background-clip:padding-box;box-shadow:0 18px 50px rgba(0,0,0,.55),0 0 0 1px rgba(240,201,106,.35),0 0 60px rgba(233,123,156,.3);color:#fff;font-family:inherit;text-align:center}',
    '#sq-welcome .sq-wl-card::before{content:"";position:absolute;inset:0;border-radius:24px;padding:2px;background:linear-gradient(120deg,#f0c96a,#e97b9c,#7c5cff,#f0c96a);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}',
    '#sq-welcome .sq-wl-kicker{font-size:13px;letter-spacing:.3em;color:#f0c96a;font-weight:700;margin-bottom:14px}',
    '#sq-welcome .sq-wl-title{margin:0 0 16px;font-size:clamp(26px,6vw,44px);font-weight:800;background:linear-gradient(90deg,#f0c96a,#e97b9c);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.2}',
    '#sq-welcome .sq-wl-sub{margin:0 auto;font-size:clamp(14px,2.4vw,17px);line-height:1.7;color:#e9dff3;max-width:640px}',
    '#sq-welcome .sq-wl-x{position:absolute;top:12px;right:12px;width:44px;height:44px;border-radius:50%;border:1px solid #ffffff22;background:#ffffff0d;color:#fff;font-size:22px;cursor:pointer;line-height:1;z-index:2}',
    '#sq-welcome .sq-wl-x:active{transform:scale(.94)}',
    '#sq-welcome .sq-wl-timer{margin-top:26px;font-size:11px;letter-spacing:.14em;color:#ffffff66;font-weight:600}',
    '#sq-welcome .sq-wl-bar{position:absolute;left:0;right:0;bottom:0;height:4px;background:#ffffff14}',
    '#sq-welcome .sq-wl-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#f0c96a,#e97b9c);transition:width 20s linear}',
    /* 1) mobile: top icons chhote, laptop par same — media block sab se aakhir mein */
    '@media (max-width:640px){',
    'html body .lang-toggle{width:64px!important;min-width:64px!important;padding:4px 4px!important;min-height:32px!important;font-size:11.5px!important}',
    'html body .theme-toggle{width:32px!important;height:32px!important;left:calc(max(8px, env(safe-area-inset-left)) + 68px)!important;inset-inline-start:calc(max(8px, env(safe-area-inset-left)) + 68px)!important}',
    'html body .social-row{left:calc(max(8px, env(safe-area-inset-left)) + 106px)!important;inset-inline-start:calc(max(8px, env(safe-area-inset-left)) + 106px)!important;gap:4px!important}',
    'html body .wa-top{width:30px!important;height:30px!important}',
    'html body .wa-top svg{width:14px!important;height:14px!important}',
    'html body .nav-toggle{width:32px!important;height:32px!important}',
    'html body .font-toggle{inset-inline-end:116px!important;right:116px!important}',
    'html body #sq-cursor-btn{width:32px!important;height:32px!important;inset-inline-end:44px!important;right:44px!important}',
    'html body #sq-dots-btn{width:32px!important;height:32px!important;inset-inline-end:80px!important;right:80px!important;font-size:13px!important}',
    'html body .nav-toggle:not(.font-toggle):not(.sq-cursor-toggle):not(.sq-dots-toggle){display:none!important}',
    'html body .wa-top{width:32px!important;height:32px!important}',
    'html body .font-toggle{width:32px!important;height:32px!important}',
    'html body .lang-toggle,html body .theme-toggle,html body .social-row,html body .wa-top,html body .font-toggle,html body #sq-dots-btn,html body #sq-cursor-btn{top:calc(max(12px,env(safe-area-inset-top)) + 4px)!important}',
    'html body .social-row{left:calc(max(8px, env(safe-area-inset-left)) + 112px)!important;inset-inline-start:calc(max(8px, env(safe-area-inset-left)) + 112px)!important}',
    'html body #sq-dock-btn{width:44px!important;height:44px!important;font-size:19px!important;right:23px!important;inset-inline-end:23px!important}',
    'html body #sq-dock-left-btn{width:44px!important;height:44px!important;font-size:19px!important}',
    '}',
    /* ===== Kit v51: sab icons screen edges se chipke hue (flush), groups ke andar tight packing ===== */
    /* NOTE: html body prefix zaroori — warna v48/v49 ke html-body-prefixed !important rules jeet jate hain */
    /* bottom-right column: right edge se lage (44px dock center = 22, hub 46 center = 23, 40px wale center = 22) */
    'html body #sq-dock-btn{right:0px!important;inset-inline-end:0px!important}',
    'html body #sq-hub-btn{right:1px!important;inset-inline-end:1px!important}',
    'html body #sq-top-btn,html body #sq-bottom-btn,html body #sq-anim-toggle,html body #sq-dash-btn{right:2px!important;inset-inline-end:2px!important}',
    'html body #sq-fab{right:0px!important;inset-inline-end:0px!important}',
    /* bottom-left column: left edge se lage (44px dock center = 22, magic 40 center = 22) */
    'html body #sq-dock-left-btn{left:0px!important;inset-inline-start:0px!important}',
    'html body #sq-magic-btn{top:auto!important;bottom:130px!important;left:auto!important;right:2px!important;inset-inline-start:auto!important;inset-inline-end:2px!important}',
    /* v54: magic ◐ ab LEFT column mein — left ✦ ke upar (bottom:74, left:2) */
    'html body #sq-magic-btn{top:auto!important;bottom:74px!important;left:10px!important;inset-inline-start:10px!important;right:auto!important;inset-inline-end:auto!important;width:44px!important;height:44px!important;font-size:18px!important}',
    /* v54: + (dock) open hone par upar ke permanent column icons hide — x dabane par wapas */
    'html body.sq-dock-open #sq-hub-btn,html body.sq-dock-open #sq-top-btn,html body.sq-dock-open #sq-bottom-btn{display:none!important}',
    /* v55: dock open = right column ke saare items EK seedhi line (center 27) aur bina overlap ke stack */
    'html body.sq-dock-open #sq-chat-btn{bottom:86px!important;right:0!important;inset-inline-end:0!important}',
    'html body.sq-dock-open #sq-fab{bottom:148px!important;right:5px!important;inset-inline-end:5px!important}',
    'html body.sq-dock-open #sq-anim-toggle{bottom:202px!important;left:auto!important;inset-inline-start:auto!important;right:7px!important;inset-inline-end:7px!important}',
    'html body.sq-dock-open #sq-dash-btn{bottom:254px!important;left:auto!important;inset-inline-start:auto!important;right:7px!important;inset-inline-end:7px!important}',
    /* mobile: dock 44px hai (center 22) — chat/fab/anim/dash centers bhi 22 par */
    '@media (max-width:640px){html body.sq-dock-open #sq-chat-btn{right:-5px!important;inset-inline-end:-5px!important}html body.sq-dock-open #sq-fab{right:0!important;inset-inline-end:0!important}html body.sq-dock-open #sq-anim-toggle,html body.sq-dock-open #sq-dash-btn{right:2px!important;inset-inline-end:2px!important}}',
    'html body #sq-top-btn{bottom:132px!important}',
    'html body #sq-bottom-btn{bottom:184px!important}',
    'html body #sq-pk-clock{left:2px!important;inset-inline-start:2px!important}',
    'html body #sq-refresh-btn,html body #sq-anim-toggle,html body #sq-app-btn{left:2px!important;inset-inline-start:2px!important}',
    'html body #sq-mode-btn{left:2px!important;inset-inline-start:2px!important}',
    '@media (max-width:640px){',
    /* top-left group: bilkul left edge se, ek ke sath ek */
    'html body .lang-toggle{left:0px!important;inset-inline-start:0px!important;border-top-left-radius:0!important;border-bottom-left-radius:0!important}',
    'html body .theme-toggle{left:66px!important;inset-inline-start:66px!important}',
    'html body .social-row{left:102px!important;inset-inline-start:102px!important}',
    /* top-right group: bilkul right edge se, ek ke sath ek */
    'html body #sq-cursor-btn{right:0px!important;inset-inline-end:0px!important;border-top-right-radius:0!important;border-bottom-right-radius:0!important}',
    'html body #sq-dots-btn{right:36px!important;inset-inline-end:36px!important}',
    'html body .font-toggle{right:72px!important;inset-inline-end:72px!important}',
    /* VIP Portfolio line upar: hero top padding kam — neeche ka sab content bhi utna upar */
    'html body .hero{padding-top:22px!important}',
    '}'
  ].join('\n');
  function addCss() {
    if (document.getElementById('sq-v34-css')) return;
    var st = document.createElement('style');
    st.id = 'sq-v34-css';
    st.textContent = css;
    (document.body || document.head).appendChild(st);
  }
  if (document.body) addCss(); else document.addEventListener('DOMContentLoaded', addCss);

  /* ---------- 3) left dock — + jaisa, lekin khoobsurat sitara ---------- */
  (function () {
    function mk() {
      if (!document.body) return false;
      if (document.getElementById('sq-dock-left-btn')) return true;
      var b = document.createElement('button');
      b.id = 'sq-dock-left-btn';
      b.type = 'button';
      b.setAttribute('aria-label', 'Menu kholen');
      b.title = 'Menu';
      b.innerHTML = '\u2726';
      b.addEventListener('click', function () { document.body.classList.toggle('sq-dock-left-open'); });
      document.body.appendChild(b);
      return true;
    }
    if (document.body) mk(); else document.addEventListener('DOMContentLoaded', mk);
    setInterval(function () {
      var panel = document.getElementById('sq-chat-panel');
      var open = false;
      try { open = !!(panel && window.getComputedStyle(panel).display !== 'none'); } catch (e) {}
      var b = document.getElementById('sq-dock-left-btn');
      if (b) b.style.display = open ? 'none' : '';
      if (open) document.body.classList.remove('sq-dock-left-open');
    }, 400);
  })();

  /* ---------- 2) three dots — categories menu (cursor icon ke pehle) ---------- */
  (function () {
    function mk() {
      if (!document.body) return false;
      var ex = document.getElementById('sq-dots-btn');
      if (ex) {
        var cb2 = document.getElementById('sq-cursor-btn');
        try { if (cb2 && cb2.parentNode && cb2.nextSibling !== ex) cb2.parentNode.insertBefore(ex, cb2.nextSibling); } catch (e) {}
        return true;
      }
      var anchor = document.querySelector('.font-toggle');
      if (!anchor || !anchor.parentNode) return false;
      var ref = document.getElementById('sq-cursor-btn') || anchor;
      var d = document.createElement('button');
      d.type = 'button'; d.id = 'sq-dots-btn'; d.className = 'nav-toggle sq-dots-toggle';
      d.innerHTML = '<span style="font-size:15px;line-height:1" aria-hidden="true">\u2630</span>';
      d.setAttribute('aria-label', 'Categories kholen');
      d.title = 'Categories';
      d.onclick = openMenu;
      try {
        var cs = window.getComputedStyle(anchor);
        ['width','height','border-radius','background','border','box-shadow','color','font-size','line-height','display','align-items','justify-content','padding','margin'].forEach(function (p) { d.style[p] = cs[p]; });
        d.style.flexShrink = '0';
      } catch (e) {}
      /* cursor icon ke BAAD insert karo */
      if (ref.parentNode) ref.parentNode.insertBefore(d, ref.nextSibling);
      return true;
    }
    var tries = 0;
    var iv = setInterval(function () { if (mk() || ++tries > 60) clearInterval(iv); }, 800);
    function openMenu() {
      var old = document.getElementById('sq-dots-ov');
      if (old) { old.remove(); return; }
      var ov = document.createElement('div'); ov.id = 'sq-dots-ov';
      var card = document.createElement('div'); card.id = 'sq-dots-card';
      var x = document.createElement('button'); x.className = 'sq-fx'; x.type = 'button'; x.innerHTML = '\u00D7';
      x.setAttribute('aria-label', 'Band karein'); x.onclick = function () { ov.remove(); };
      var h = document.createElement('h3'); h.textContent = '\uD83D\uDDC2\uFE0F Categories'; h.appendChild(x);
      card.appendChild(h);
      var items = [], seen = {};
      var NICE = { bio: '01 \u2014 Bio', achievements: '02 \u2014 Achievements', gallery: '03 \u2014 My Memories (Gallery)', quote: '05 \u2014 Quote of the Day', guestbook: '09 \u2014 Guestbook', quiz: '10 \u2014 Quiz', qa: '11 \u2014 Q&A', contact: '14 \u2014 Contact', 'sq-poetry': '04 \u2014 Poetry', 'sq-music': '06 \u2014 Music', 'sq-user-sher': '07 \u2014 Aap ka Sher', 'sq-hearts': '12 \u2014 Deewar e Dil', 'sq-zone': '13 \u2014 Saqib Zone' };
      var secs = document.querySelectorAll('section.section[id]');
      for (var i = 0; i < secs.length; i++) {
        var id = secs[i].id; if (!id || seen[id]) continue; seen[id] = true;
        var h2 = secs[i].querySelector('h2');
        var label = NICE[id] || ((h2 && h2.textContent.trim()) || id);
        items.push({ id: id, label: label });
      }
      if (document.getElementById('sq-dock-btn')) items.unshift({ id: 'top', label: '\u2302 Top / Hero' });
      if (!items.length) items.push({ id: null, label: 'Is page par koi category nahi' });
      items.forEach(function (it) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-f-btn2';
        var label = it.label || it.id;
        if (label.length > 34) label = label.slice(0, 33) + '\u2026';
        b.textContent = label;
        b.onclick = function () {
          ov.remove();
          if (!it.id) return;
          if (it.id === 'top') { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); } return; }
          var el = document.getElementById(it.id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        };
        card.appendChild(b);
      });
      ov.appendChild(card);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }
  })();



  /* ---------- 4) MAGIC THEME ENGINE — ek website, 5 mukhtalif visual identities ---------- */
  (function () {
    if (window.__sqMagicTheme) return;
    window.__sqMagicTheme = true;
    var THEMES = [
      ['midnight', '\uD83C\uDF19 Modern Dark', 'Glassmorphism, glowing accents, premium dark', '#0b0713', '#f0c96a'],
      ['luxury', '\u2728 Luxury Premium', 'Cream aur gold, elegant serif look', '#f6efe3', '#b8860b'],
      ['cyber', '\u26A1 Futuristic Cyber', 'Neon glow, grid background, mono font', '#01050c', '#22d3ee'],
      ['minimal', '\u25FB Minimal Clean', 'Safed, sharp corners, zero shadows', '#ffffff', '#111110'],
      ['creative', '\uD83C\uDFA8 Creative', 'Bold gradients, playful aur energetic', '#7f00ff', '#ff5d8f'],
      ['ocean', '\uD83C\uDF0A Ocean Deep', 'Gehri navy, aqua glow, wave feel', '#020c1f', '#38bdf8'],
      ['emerald', '\uD83C\uDF3F Emerald Forest', 'Dark green, organic aur fresh', '#03130c', '#34d399'],
      ['royal', '\uD83D\uDC51 Royal Violet', 'Violet + gold, shaahi andaz', '#0d0618', '#a78bfa'],
      ['rose', '\uD83C\uDF39 Rose Noir', 'Romantic dark maroon, rose glow', '#150409', '#fb7185'],
      ['sunset', '\uD83C\uDF05 Sunset Warm', 'Warm orange-pink, cozy vibe', '#1a0b04', '#fb923c']
    ];
    var KEY = 'sq-theme';
    function themeName(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i][0] === id) return THEMES[i][1]; return 'Theme'; }
    function currentTheme() {
      var a = document.documentElement.getAttribute('data-sq-theme');
      return a || 'midnight';
    }
    function applyTheme(id, silent) {
      var root = document.documentElement;
      if (THEMES.map(function (t) { return t[0]; }).indexOf(id) === -1) id = 'midnight';
      root.setAttribute('data-sq-theme', id);
      /* site ka apna light palette light themes ke sath sync — baaki sab untouched */
      if (id === 'luxury' || id === 'minimal') root.classList.add('theme-light');
      else root.classList.remove('theme-light');
      try { localStorage.setItem(KEY, id); } catch (e) {}
      if (!silent) {
        var reduce = false;
        try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
        if (!reduce) {
          root.classList.add('sq-morphing');
          setTimeout(function () { root.classList.remove('sq-morphing'); }, 900);
        }
        if (window.sqToast) window.sqToast(themeName(id) + ' \u2014 naya look lag gaya');
      }
    }
    window.sqApplyTheme = applyTheme;
    /* saved theme load (purani values migrate: emerald/ocean/rose/royal -> midnight, light -> luxury) */
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'light') saved = 'luxury';
    else if (saved === 'emerald' || saved === 'ocean' || saved === 'rose' || saved === 'royal' || saved === 'default') saved = 'midnight';
    applyTheme(saved || 'midnight', true);
    /* engine CSS */
    function addCss() {
      if (document.getElementById('sq-magic-css')) return;
      var css = [
        /* cinematic transition helper */
        'html.sq-morphing,html.sq-morphing body,html.sq-morphing *{transition:background-color .7s ease,color .7s ease,border-color .7s ease,box-shadow .7s ease,opacity .7s ease!important}',
        '@media (prefers-reduced-motion:reduce){html.sq-morphing,html.sq-morphing body,html.sq-morphing *,html[data-sq-theme="creative"] body{animation:none!important;transition:none!important}}',
        /* magic icon — header ke andar (desktop), mobile par dock ke upar float */
        'html body #sq-magic-btn{position:fixed;top:calc(max(12px,env(safe-area-inset-top)) + 4px);right:152px;z-index:11005;width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--bg-soft);color:var(--accent);cursor:pointer;font-size:17px;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35);transition:transform .2s,box-shadow .3s,color .4s,border-color .4s}',
        'html body #sq-magic-btn:hover{transform:scale(1.08)}',
        'html body #sq-magic-btn:active{transform:scale(.92)}',
        /* icon khud theme ke sath morph hota hai */
        'html[data-sq-theme="midnight"] #sq-magic-btn{color:#f0c96a;border-color:rgba(240,201,106,.45);text-shadow:0 0 10px rgba(240,201,106,.55);box-shadow:0 0 14px rgba(240,201,106,.2)}',
        'html[data-sq-theme="luxury"] #sq-magic-btn{color:#b8860b;border-color:rgba(184,134,11,.5);box-shadow:0 4px 14px rgba(138,101,8,.25)}',
        'html[data-sq-theme="cyber"] #sq-magic-btn{color:#22d3ee;border-color:rgba(34,211,238,.55);text-shadow:0 0 10px rgba(34,211,238,.9);box-shadow:0 0 16px rgba(34,211,238,.4)}',
        'html[data-sq-theme="minimal"] #sq-magic-btn{color:#111;border-color:rgba(0,0,0,.25);box-shadow:none}',
        'html[data-sq-theme="creative"] #sq-magic-btn{background:linear-gradient(135deg,#ff5d8f,#ffb703);color:#fff;border-color:transparent;box-shadow:0 0 16px rgba(255,93,143,.5)}',
        /* ---------- THEME 1: midnight — glass polish on current dark ---------- */
        'html[data-sq-theme="midnight"] .nav-menu,html[data-sq-theme="midnight"] .font-panel,html[data-sq-theme="midnight"] .gb-item,html[data-sq-theme="midnight"] .gal-card,html[data-sq-theme="midnight"] .tile,html[data-sq-theme="midnight"] .sq-hub-tile{backdrop-filter:blur(10px) saturate(1.25);-webkit-backdrop-filter:blur(10px) saturate(1.25);box-shadow:0 10px 30px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.06)}',
        'html[data-sq-theme="midnight"] .hero-name{text-shadow:0 0 34px rgba(240,201,106,.22)}',
        /* ---------- THEME 2: luxury — cream + gold, serif ---------- */
        ':root[data-sq-theme="luxury"]{--bg:#f6efe3;--bg-soft:#efe6d4;--ink:#2d2013;--ink-dim:#6d5a41;--ink-mute:#a3927a;--accent:#b8860b;--accent-deep:#8a6508;--gold:#a67c2e;--line:rgba(140,101,8,.25);--sq-accent:#b8860b}',
        'html[data-sq-theme="luxury"] body{background-color:#f6efe3!important;background-image:radial-gradient(70% 45% at 80% -5%,rgba(184,134,11,.1),transparent 70%),radial-gradient(50% 35% at 0% 30%,rgba(184,134,11,.06),transparent 70%)!important;background-attachment:fixed}',
        'html[data-sq-theme="luxury"] h1,html[data-sq-theme="luxury"] h2,html[data-sq-theme="luxury"] h3,html[data-sq-theme="luxury"] .hero-name{font-family:var(--serif)!important;letter-spacing:.015em}',
        'html[data-sq-theme="luxury"] .btn{border-radius:6px;font-family:var(--serif);letter-spacing:.14em;box-shadow:0 6px 18px rgba(138,101,8,.28)}',
        'html[data-sq-theme="luxury"] .gal-card,html[data-sq-theme="luxury"] .gb-item,html[data-sq-theme="luxury"] .tile,html[data-sq-theme="luxury"] .sq-hub-tile,html[data-sq-theme="luxury"] .nav-menu,html[data-sq-theme="luxury"] .font-panel,html[data-sq-theme="luxury"] .gate-card{border-radius:10px;box-shadow:0 12px 34px rgba(60,40,10,.14);border-color:rgba(140,101,8,.3)}',
        /* ---------- THEME 3: cyber — neon grid ---------- */
        ':root[data-sq-theme="cyber"]{--bg:#01050c;--bg-soft:#04101f;--ink:#d8faff;--ink-dim:#7fd6e8;--ink-mute:#4e7f8f;--accent:#22d3ee;--accent-deep:#0891b2;--gold:#f472d0;--line:rgba(34,211,238,.28);--sq-accent:#22d3ee;--serif:ui-monospace,Menlo,Consolas,monospace;--mono:ui-monospace,Menlo,Consolas,monospace}',
        'html[data-sq-theme="cyber"] body{background-color:#01050c!important;background-image:linear-gradient(rgba(34,211,238,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.05) 1px,transparent 1px),radial-gradient(60% 40% at 50% 0%,rgba(34,211,238,.12),transparent 70%)!important;background-size:34px 34px,34px 34px,100% 100%!important;background-attachment:fixed!important}',
        'html[data-sq-theme="cyber"] h1,html[data-sq-theme="cyber"] h2,html[data-sq-theme="cyber"] h3,html[data-sq-theme="cyber"] .hero-name{text-shadow:0 0 14px rgba(34,211,238,.5);letter-spacing:.05em}',
        'html[data-sq-theme="cyber"] .btn{border-radius:4px;background:linear-gradient(135deg,#0891b2,#22d3ee);box-shadow:0 0 18px rgba(34,211,238,.4)}',
        'html[data-sq-theme="cyber"] .gal-card,html[data-sq-theme="cyber"] .gb-item,html[data-sq-theme="cyber"] .tile,html[data-sq-theme="cyber"] .sq-hub-tile,html[data-sq-theme="cyber"] .nav-menu,html[data-sq-theme="cyber"] .font-panel,html[data-sq-theme="cyber"] .gate-card{border-radius:4px;border:1px solid rgba(34,211,238,.4);box-shadow:0 0 16px rgba(34,211,238,.14),inset 0 0 14px rgba(34,211,238,.05)}',
        /* ---------- THEME 4: minimal — white, sharp, flat ---------- */
        ':root[data-sq-theme="minimal"]{--bg:#ffffff;--bg-soft:#f6f6f5;--ink:#131312;--ink-dim:#4a4a46;--ink-mute:#8d8d88;--accent:#131312;--accent-deep:#000000;--gold:#131312;--line:rgba(0,0,0,.14);--sq-accent:#131312;--serif:"Helvetica Neue",Helvetica,Arial,sans-serif;--mono:"Helvetica Neue",Helvetica,Arial,sans-serif}',
        ':root[data-sq-theme="minimal"] body{background:#ffffff!important}:root[data-sq-theme="minimal"] canvas{display:none!important}:root[data-sq-theme="minimal"] .hero,:root[data-sq-theme="minimal"] section,:root[data-sq-theme="minimal"] .gal-card,:root[data-sq-theme="minimal"] .gb-item,:root[data-sq-theme="minimal"] .tile,:root[data-sq-theme="minimal"] .sq-hub-tile,:root[data-sq-theme="minimal"] .nav-menu,:root[data-sq-theme="minimal"] .font-panel,:root[data-sq-theme="minimal"] .gate-card{background-image:none!important}:root[data-sq-theme="minimal"] #sq-dots-btn,:root[data-sq-theme="minimal"] #sq-cursor-btn,:root[data-sq-theme="minimal"] #sq-dock-btn,:root[data-sq-theme="minimal"] #sq-dock-left-btn,:root[data-sq-theme="minimal"] #sq-refresh-btn,:root[data-sq-theme="minimal"] #sq-app-btn,:root[data-sq-theme="minimal"] #sq-mode-btn{background:#fff!important;color:#111!important;border:1px solid rgba(0,0,0,.25)!important;box-shadow:none!important;text-shadow:none!important}',
        ':root[data-sq-theme="minimal"] .btn{background:linear-gradient(180deg,#33332f,#121210)!important;color:#f6f4ef!important;border:1px solid #454540!important;border-radius:2px!important;letter-spacing:.16em!important;box-shadow:0 16px 34px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.42)!important;text-shadow:0 1px 0 rgba(0,0,0,.4)!important}',
        'html[data-sq-theme="minimal"] .gal-card,html[data-sq-theme="minimal"] .gb-item,html[data-sq-theme="minimal"] .tile,html[data-sq-theme="minimal"] .sq-hub-tile,html[data-sq-theme="minimal"] .nav-menu,html[data-sq-theme="minimal"] .font-panel,html[data-sq-theme="minimal"] .gate-card,html[data-sq-theme="minimal"] .hero-name{text-shadow:none!important}',
        'html[data-sq-theme="minimal"] .gal-card,html[data-sq-theme="minimal"] .gb-item,html[data-sq-theme="minimal"] .tile,html[data-sq-theme="minimal"] .sq-hub-tile,html[data-sq-theme="minimal"] .nav-menu,html[data-sq-theme="minimal"] .font-panel{border-radius:0!important;box-shadow:none!important;border:1px solid rgba(0,0,0,.16)}',
        'html[data-sq-theme="minimal"] .hero-name{letter-spacing:-.02em!important}',
        ':root[data-sq-theme="minimal"] .btn:hover{background:linear-gradient(180deg,#3d3d38,#1a1a17)!important;color:#ffffff!important;box-shadow:0 22px 44px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.5)!important;transform:translateY(-2px) scale(1.02)!important}',
        ':root[data-sq-theme="minimal"] .btn:active{transform:scale(.98)!important}',
        ':root[data-sq-theme="minimal"] .btn-ghost{background:linear-gradient(180deg,#ffffff,#f0eee8)!important;color:#131312!important;border:1px solid #131312!important;box-shadow:0 12px 26px rgba(0,0,0,.14),inset 0 1px 0 #ffffff!important}',
        ':root[data-sq-theme="minimal"] .btn-ghost:hover{background:#131312!important;color:#ffffff!important;box-shadow:0 20px 40px rgba(0,0,0,.3)!important;transform:translateY(-2px) scale(1.02)!important}',
        ':root[data-sq-theme="minimal"] .btn{background:linear-gradient(180deg,#2e2e2a,#131312)!important}',
        ':root[data-sq-theme="minimal"] .btn::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:rgba(255,255,255,.25);z-index:1}',
        ':root[data-sq-theme="minimal"] .btn-ghost{transition:background .35s ease,color .35s ease,transform .3s ease,box-shadow .3s ease}',
        /* ---------- THEME 5: creative — animated bold gradient ---------- */
        ':root[data-sq-theme="creative"]{--bg:#2b1055;--bg-soft:#3b1668;--ink:#fff7fb;--ink-dim:#ffd6ec;--ink-mute:#e0a7f0;--accent:#ff5d8f;--accent-deep:#ff8fab;--gold:#ffb703;--line:rgba(255,141,184,.35);--sq-accent:#ff5d8f;--serif:"Trebuchet MS",Verdana,sans-serif;--mono:"Trebuchet MS",Verdana,sans-serif}',
        '@keyframes sqCreativeBg{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}',
        'html[data-sq-theme="creative"] body{background:linear-gradient(135deg,#7f00ff,#e100ff 35%,#ff5d8f 65%,#ffb703)!important;background-size:300% 300%!important;background-attachment:fixed!important;animation:sqCreativeBg 18s ease infinite}',
        'html[data-sq-theme="creative"] .btn{border-radius:999px;background:linear-gradient(90deg,#ffb703,#ff5d8f);box-shadow:0 8px 22px rgba(255,93,143,.4);font-weight:700}',
        'html[data-sq-theme="creative"] .gal-card,html[data-sq-theme="creative"] .gb-item,html[data-sq-theme="creative"] .tile,html[data-sq-theme="creative"] .sq-hub-tile,html[data-sq-theme="creative"] .nav-menu,html[data-sq-theme="creative"] .font-panel,html[data-sq-theme="creative"] .gate-card{border-radius:20px;border:2px solid rgba(255,255,255,.28);box-shadow:0 12px 34px rgba(120,20,120,.3)}',
        'html[data-sq-theme="creative"] .gal-card:hover,html[data-sq-theme="creative"] .tile:hover{transform:rotate(-1.2deg) scale(1.03)}',
        'html[data-sq-theme="creative"] .hero-name{text-shadow:0 4px 24px rgba(80,0,120,.5)}',
        /* ---------- THEME 6: ocean — deep navy + aqua ---------- */
        ':root[data-sq-theme="ocean"]{--bg:#020c1f;--bg-soft:#06182f;--ink:#e8f6ff;--ink-dim:#a8cfe8;--ink-mute:#6f93ab;--accent:#38bdf8;--accent-deep:#0284c7;--gold:#7dd3fc;--line:rgba(56,189,248,.24);--sq-accent:#38bdf8}',
        ':root[data-sq-theme="ocean"] body{background-color:#020c1f!important;background-image:radial-gradient(70% 45% at 80% -5%,rgba(56,189,248,.14),transparent 70%),radial-gradient(50% 35% at 0% 30%,rgba(56,189,248,.07),transparent 70%),radial-gradient(40% 25% at 50% 110%,rgba(14,165,233,.1),transparent 70%)!important;background-attachment:fixed}',
        ':root[data-sq-theme="ocean"] .btn{border-radius:14px;background:linear-gradient(135deg,#0284c7,#38bdf8);box-shadow:0 8px 24px rgba(56,189,248,.35)}',
        ':root[data-sq-theme="ocean"] .gal-card,:root[data-sq-theme="ocean"] .gb-item,:root[data-sq-theme="ocean"] .tile,:root[data-sq-theme="ocean"] .sq-hub-tile,:root[data-sq-theme="ocean"] .nav-menu,:root[data-sq-theme="ocean"] .font-panel,:root[data-sq-theme="ocean"] .gate-card{border-radius:16px;border-color:rgba(56,189,248,.3);box-shadow:0 10px 30px rgba(2,12,31,.5),inset 0 1px 0 rgba(125,211,252,.1)}',
        ':root[data-sq-theme="ocean"] .hero-name,:root[data-sq-theme="ocean"] h1,:root[data-sq-theme="ocean"] h2{text-shadow:0 0 26px rgba(56,189,248,.35)}',
        /* ---------- THEME 7: emerald — organic forest ---------- */
        ':root[data-sq-theme="emerald"]{--bg:#03130c;--bg-soft:#082018;--ink:#ecfdf5;--ink-dim:#b3ddc9;--ink-mute:#7ba692;--accent:#34d399;--accent-deep:#059669;--gold:#a7f3d0;--line:rgba(52,211,153,.22);--sq-accent:#34d399}',
        ':root[data-sq-theme="emerald"] body{background-color:#03130c!important;background-image:radial-gradient(70% 45% at 80% -5%,rgba(52,211,153,.13),transparent 70%),radial-gradient(50% 35% at 0% 30%,rgba(16,185,129,.08),transparent 70%)!important;background-attachment:fixed}',
        ':root[data-sq-theme="emerald"] .btn{border-radius:18px;background:linear-gradient(135deg,#059669,#34d399);box-shadow:0 8px 24px rgba(52,211,153,.3)}',
        ':root[data-sq-theme="emerald"] .gal-card,:root[data-sq-theme="emerald"] .gb-item,:root[data-sq-theme="emerald"] .tile,:root[data-sq-theme="emerald"] .sq-hub-tile,:root[data-sq-theme="emerald"] .nav-menu,:root[data-sq-theme="emerald"] .font-panel,:root[data-sq-theme="emerald"] .gate-card{border-radius:22px;border-color:rgba(52,211,153,.3);box-shadow:0 10px 30px rgba(3,19,12,.5)}',
        ':root[data-sq-theme="emerald"] .hero-name{text-shadow:0 0 30px rgba(52,211,153,.3)}',
        /* ---------- THEME 8: royal — violet + gold shaahi ---------- */
        ':root[data-sq-theme="royal"]{--bg:#0d0618;--bg-soft:#180c2e;--ink:#f5f0ff;--ink-dim:#d2c4f0;--ink-mute:#9d8cc0;--accent:#a78bfa;--accent-deep:#7c3aed;--gold:#f0c96a;--line:rgba(167,139,250,.24);--sq-accent:#a78bfa;--serif:Georgia,"Times New Roman",serif}',
        ':root[data-sq-theme="royal"] body{background-color:#0d0618!important;background-image:radial-gradient(70% 45% at 80% -5%,rgba(167,139,250,.15),transparent 70%),radial-gradient(50% 35% at 0% 30%,rgba(240,201,106,.07),transparent 70%)!important;background-attachment:fixed}',
        ':root[data-sq-theme="royal"] h1,:root[data-sq-theme="royal"] h2,:root[data-sq-theme="royal"] .hero-name{font-family:var(--serif)!important;font-style:italic;letter-spacing:.01em}',
        ':root[data-sq-theme="royal"] .btn{border-radius:8px;font-family:var(--serif);letter-spacing:.1em;background:linear-gradient(135deg,#7c3aed,#a78bfa);box-shadow:0 8px 24px rgba(124,58,237,.4)}',
        ':root[data-sq-theme="royal"] .gal-card,:root[data-sq-theme="royal"] .gb-item,:root[data-sq-theme="royal"] .tile,:root[data-sq-theme="royal"] .sq-hub-tile,:root[data-sq-theme="royal"] .nav-menu,:root[data-sq-theme="royal"] .font-panel,:root[data-sq-theme="royal"] .gate-card{border-radius:12px;border:1px solid rgba(240,201,106,.35);box-shadow:0 12px 34px rgba(13,6,24,.6)}',
        /* ---------- THEME 9: rose — romantic noir ---------- */
        ':root[data-sq-theme="rose"]{--bg:#150409;--bg-soft:#260a14;--ink:#fff0f4;--ink-dim:#e6b8c6;--ink-mute:#b07f8f;--accent:#fb7185;--accent-deep:#e11d48;--gold:#fda4af;--line:rgba(251,113,133,.24);--sq-accent:#fb7185;--serif:Georgia,serif}',
        ':root[data-sq-theme="rose"] body{background-color:#150409!important;background-image:radial-gradient(70% 45% at 80% -5%,rgba(251,113,133,.16),transparent 70%),radial-gradient(50% 35% at 0% 30%,rgba(225,29,72,.1),transparent 70%)!important;background-attachment:fixed}',
        ':root[data-sq-theme="rose"] .btn{border-radius:999px;background:linear-gradient(135deg,#e11d48,#fb7185);box-shadow:0 8px 26px rgba(251,113,133,.4)}',
        ':root[data-sq-theme="rose"] h1,:root[data-sq-theme="rose"] h2,:root[data-sq-theme="rose"] .hero-name{font-family:var(--serif)!important;text-shadow:0 0 24px rgba(251,113,133,.35)}',
        ':root[data-sq-theme="rose"] .gal-card,:root[data-sq-theme="rose"] .gb-item,:root[data-sq-theme="rose"] .tile,:root[data-sq-theme="rose"] .sq-hub-tile,:root[data-sq-theme="rose"] .nav-menu,:root[data-sq-theme="rose"] .font-panel,:root[data-sq-theme="rose"] .gate-card{border-radius:18px;border-color:rgba(251,113,133,.35);box-shadow:0 10px 30px rgba(21,4,9,.55)}',
        /* ---------- THEME 10: sunset — warm cozy ---------- */
        ':root[data-sq-theme="sunset"]{--bg:#1a0b04;--bg-soft:#2b1408;--ink:#fff4ea;--ink-dim:#f0cdb0;--ink-mute:#b8987f;--accent:#fb923c;--accent-deep:#ea580c;--gold:#fdba74;--line:rgba(251,146,60,.24);--sq-accent:#fb923c}',
        ':root[data-sq-theme="sunset"] body{background-color:#1a0b04!important;background-image:linear-gradient(180deg,rgba(251,146,60,.12),rgba(26,11,4,0) 40%),radial-gradient(60% 40% at 50% 0%,rgba(234,88,12,.2),transparent 70%)!important;background-attachment:fixed}',
        ':root[data-sq-theme="sunset"] .btn{border-radius:12px;background:linear-gradient(135deg,#ea580c,#fb923c);box-shadow:0 8px 24px rgba(251,146,60,.35)}',
        ':root[data-sq-theme="sunset"] .gal-card,:root[data-sq-theme="sunset"] .gb-item,:root[data-sq-theme="sunset"] .tile,:root[data-sq-theme="sunset"] .sq-hub-tile,:root[data-sq-theme="sunset"] .nav-menu,:root[data-sq-theme="sunset"] .font-panel,:root[data-sq-theme="sunset"] .gate-card{border-radius:14px;border-color:rgba(251,146,60,.3);box-shadow:0 10px 30px rgba(26,11,4,.5)}',
        ':root[data-sq-theme="sunset"] .hero-name{text-shadow:0 4px 30px rgba(251,146,60,.35)}',
        /* ---------- button polish — boring buttons ko premium ---------- */
        'html[data-sq-theme] .btn{position:relative;overflow:hidden;font-weight:700;border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);box-shadow:0 12px 30px color-mix(in srgb,var(--accent) 40%,transparent),inset 0 1px 0 rgba(255,255,255,.3)}',
        'html[data-sq-theme] .btn::after{content:"";position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg);transition:left .55s ease;pointer-events:none}',
        'html[data-sq-theme] .btn:hover::after{left:145%}',
        'html[data-sq-theme] .btn:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 18px 40px color-mix(in srgb,var(--accent) 55%,transparent),inset 0 1px 0 rgba(255,255,255,.35)}',
        'html[data-sq-theme] .btn:active{transform:translateY(0) scale(.98)}',
        /* primary: har theme mein accent-based depth gradient (minimal apna rakhta hai) */
        'html[data-sq-theme]:not([data-sq-theme="minimal"]) .btn{background-image:linear-gradient(100deg,color-mix(in srgb,var(--accent) 86%,#ffffff),color-mix(in srgb,var(--accent) 62%,#000000))!important;text-shadow:0 1px 2px rgba(0,0,0,.25)}',
        /* ghost: flimsy border nahi — frosted glass premium (accent tint fill + glow + inner highlight) */
        'html[data-sq-theme]:not([data-sq-theme="minimal"]) .btn-ghost{background:linear-gradient(100deg,color-mix(in srgb,var(--accent) 16%,transparent),color-mix(in srgb,var(--accent) 34%,transparent))!important;color:var(--accent)!important;border:1px solid color-mix(in srgb,var(--accent) 75%,transparent)!important;box-shadow:0 14px 32px color-mix(in srgb,var(--accent) 30%,transparent),inset 0 1px 0 rgba(255,255,255,.35)!important;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}',
        'html[data-sq-theme]:not([data-sq-theme="minimal"]) .btn-ghost::after{background:linear-gradient(105deg,transparent,color-mix(in srgb,var(--accent) 22%,transparent),transparent)}',
        'html[data-sq-theme]:not([data-sq-theme="minimal"]) .btn-ghost:hover{border-color:var(--accent);box-shadow:0 20px 44px color-mix(in srgb,var(--accent) 48%,transparent),inset 0 1px 0 rgba(255,255,255,.45)!important;transform:translateY(-2px) scale(1.02)}',
        /* ---------- gate (signup/login) text contrast — light themes par bhi readable ---------- */
        ':root[data-sq-theme] .gate-overlay{color:#f5eee9}',
        ':root[data-sq-theme] .gate-sub{color:#d8c5bf!important;opacity:1}',
        ':root[data-sq-theme] .gate-kicker{color:#d9a94e!important}',
        ':root[data-sq-theme] .gate-foot{color:#a89490!important;opacity:1}',
        ':root[data-sq-theme] .gate-switch{color:#f5eee9}',
        ':root[data-sq-theme] .gate-switch button,:root[data-sq-theme] .gate-switch a{color:#e97b9c!important}',
        ':root[data-sq-theme] .gate-divider{color:#a89490!important}',
        /* ---------- panel: Choose Your Experience ---------- */
        '#sq-magic-ov{position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px}',
        '#sq-magic-card{background:rgba(16,10,26,.98);border:1px solid rgba(240,201,106,.55);border-radius:16px;padding:18px 16px;width:min(92vw,380px);max-height:82vh;overflow-y:auto;color:#fff;box-shadow:0 14px 50px rgba(0,0,0,.6);font-family:inherit}',
        '#sq-magic-card h3{margin:0 0 2px;font-size:16.5px;color:#f0c96a;display:flex;justify-content:space-between;align-items:center;gap:10px;font-weight:600}',
        '#sq-magic-card .sq-mg-sub{font-size:12px;opacity:.6;margin:0 0 12px}',
        '#sq-magic-card .sq-mg-x{width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:transparent;color:#fff;font-size:16px;cursor:pointer;line-height:1}',
        '#sq-magic-card .sq-mg-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin:6px 0;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#fff;font:inherit;cursor:pointer;transition:border-color .2s,transform .15s,background .2s}',
        '#sq-magic-card .sq-mg-opt:hover{border-color:#f0c96a;transform:translateY(-1px)}',
        '#sq-magic-card .sq-mg-opt.sq-cur{border-color:#f0c96a;background:rgba(240,201,106,.12)}',
        '#sq-magic-card .sq-mg-prev{width:46px;height:34px;border-radius:8px;flex-shrink:0;border:1px solid rgba(255,255,255,.3)}',
        '#sq-magic-card .sq-mg-name{font-weight:600;font-size:13.5px;display:block}',
        '#sq-magic-card .sq-mg-desc{font-size:11.5px;opacity:.65;display:block;margin-top:1px}',
        '#sq-magic-card .sq-mg-check{margin-left:auto;color:#f0c96a;font-size:15px;flex-shrink:0}',
        /* mobile: dock ke upar float (header small screens par bharta hai) */
        '@media (max-width:640px){html body #sq-magic-btn{top:auto;right:auto;bottom:74px;left:20px;width:40px;height:40px;font-size:17px}}',
      ].join('\n');
      var st = document.createElement('style');
      st.id = 'sq-magic-css';
      st.textContent = css;
      document.head.appendChild(st);
    }
    function openPanel() {
      var old = document.getElementById('sq-magic-ov');
      if (old) { old.remove(); return; }
      var ov = document.createElement('div'); ov.id = 'sq-magic-ov';
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Theme chunein');
      var card = document.createElement('div'); card.id = 'sq-magic-card';
      var x = document.createElement('button'); x.className = 'sq-mg-x'; x.type = 'button'; x.innerHTML = '\u00D7';
      x.setAttribute('aria-label', 'Band karein'); x.onclick = function () { ov.remove(); };
      var h = document.createElement('h3'); h.innerHTML = '\u2726 Choose Your Experience'; h.appendChild(x);
      card.appendChild(h);
      var sub = document.createElement('p'); sub.className = 'sq-mg-sub';
      sub.textContent = 'Ek hi website \u2014 mukhtalif duniya. Data aur content same rehta hai.';
      card.appendChild(sub);
      var cur = currentTheme();
      THEMES.forEach(function (t) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-mg-opt' + (cur === t[0] ? ' sq-cur' : '');
        b.setAttribute('aria-label', t[1] + ' theme');
        var prev = document.createElement('span'); prev.className = 'sq-mg-prev';
        prev.style.background = t[0] === 'creative'
          ? 'linear-gradient(120deg,#7f00ff,#ff5d8f,#ffb703)'
          : 'linear-gradient(135deg,' + t[3] + ' 55%,' + t[4] + ' 55%)';
        var tx = document.createElement('span');
        tx.innerHTML = '<span class="sq-mg-name">' + t[1] + '</span><span class="sq-mg-desc">' + t[2] + '</span>';
        b.appendChild(prev); b.appendChild(tx);
        if (cur === t[0]) { var c = document.createElement('span'); c.className = 'sq-mg-check'; c.innerHTML = '\u2713'; b.appendChild(c); }
        b.onclick = function () { applyTheme(t[0]); ov.remove(); };
        card.appendChild(b);
      });
      ov.appendChild(card);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
      });
      document.body.appendChild(ov);
      var first = card.querySelector('.sq-mg-opt'); if (first) first.focus();
    }
    function mk() {
      if (!document.body) return false;
      if (document.getElementById('sq-magic-btn')) return true;
      addCss();
      var b = document.createElement('button');
      b.id = 'sq-magic-btn';
      b.type = 'button';
      b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="display:block"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>'; /* magic icon - SVG, har device par render hota hai */
      b.setAttribute('aria-label', 'Magic theme badlein');
      b.title = 'Choose Your Experience';
      b.onclick = openPanel;
      document.body.appendChild(b);
      return true;
    }
    if (document.body) mk(); else document.addEventListener('DOMContentLoaded', mk);
  })();

  /* ---------- premium welcome — login/signup complete hote hi ek bara, khoobsurat message ---------- */
  (function () {
    function getTok() { try { return localStorage.getItem('portfolio-auth-token') || ''; } catch (e) { return ''; } }
    function nameOf() {
      try {
        var p = getTok().split('.')[1] || '';
        if (!p) return '';
        p = p.replace(/-/g, '+').replace(/_/g, '/');
        while (p.length % 4) p += '=';
        var m = JSON.parse(decodeURIComponent(escape(atob(p))));
        return (m && (m.name || m.fullName)) ? String(m.name || m.fullName).split(' ')[0].replace(/[<>&]/g, '') : '';
      } catch (e) { return ''; }
    }
    var shown = false;
    var wasIn = !!getTok();
    setInterval(function () {
      var t = getTok();
      if (t && !wasIn && !shown) {
        wasIn = true;
        try { if (sessionStorage.getItem('sq-welcomed') === '1') return; } catch (e) {}
        try { sessionStorage.setItem('sq-welcomed', '1'); } catch (e) {}
        show();
      } else if (!t) { wasIn = false; }
    }, 600);
    function show() {
      if (document.getElementById('sq-welcome')) return;
      var nm = nameOf();
      var w = document.createElement('div');
      w.id = 'sq-welcome';
      w.innerHTML =
        '<div class="sq-wl-card">' +
          '<button class="sq-wl-x" aria-label="Welcome band karein">\u00D7</button>' +
          '<div class="sq-wl-kicker">\u2726 PREMIUM MEMBER \u2726</div>' +
          '<div class="sq-wl-title">Khush Amdeed' + (nm ? ', ' + nm.replace(/[<>&]/g, '') : '') + '!</div>' +
          '<p class="sq-wl-sub">Aap ka account activate ho gaya hai \u2014 ab portfolio ka har corner sirf aap ke liye khula hai. Gallery, poetry, quiz aur bohat kuch \u2014 maza karein! \u2728</p>' +
          '<div class="sq-wl-timer">Yeh message <span id="sq-wl-sec">20</span> second mein khud band ho jayega</div>' +
          '<div class="sq-wl-bar"><i></i></div>' +
        '</div>';
      document.body.appendChild(w);
      requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add('sq-wl-on'); }); });
      var gone = false;
      function hide() {
        if (gone) return; gone = true;
        w.classList.remove('sq-wl-on');
        setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 600);
      }
      w.querySelector('.sq-wl-x').onclick = hide;
      var bar = w.querySelector('.sq-wl-bar i');
      if (bar) requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = '0%'; }); });
      var left = 20;
      var tick = setInterval(function () {
        left--;
        try { var s = document.getElementById('sq-wl-sec'); if (s) s.textContent = String(Math.max(left, 0)); } catch (e) {}
        if (left <= 0) clearInterval(tick);
      }, 1000);
      setTimeout(hide, 20000);
    }
  })();

  /* ---------- Kit v50: gate-class watch + chat-open par saare floating buttons chhupao ---------- */
  /* Purane mobile browsers :has() support nahi karte — is liye body par sq-on-gate class lagate hain
     aur chat khulne par dock-open widgets (jo chat panel ke upar float kar rahe the) inline chhupate hain. */
  (function () {
    var IDS = ['sq-dock-btn', 'sq-chat-btn', 'sq-hub-btn', 'sq-fab', 'sq-anim-toggle', 'sq-dash-btn', 'sq-top-btn', 'sq-bottom-btn', 'sq-dock-left-btn', 'sq-dots-btn', 'sq-pk-clock', 'sq-refresh-btn'];
    setInterval(function () {
      var b = document.body;
      if (!b) return;
      var gate = false, open = false;
      try { gate = !!(document.querySelector('.gate-overlay') || document.querySelector('.gate-card')); } catch (e) {}
      try {
        var p = document.getElementById('sq-chat-panel');
        open = !!(p && window.getComputedStyle(p).display !== 'none');
      } catch (e) {}
      try {
        b.classList.toggle('sq-on-gate', gate);
        b.classList.toggle('sq-chat-open', open);
      } catch (e) {}
      if (open) {
        for (var i = 0; i < IDS.length; i++) {
          var el = document.getElementById(IDS[i]);
          if (el) el.style.display = 'none';
        }
        try { b.classList.remove('sq-dock-open'); b.classList.remove('sq-dock-left-open'); } catch (e) {}
      } else {
        for (var j = 0; j < IDS.length; j++) {
          var el2 = document.getElementById(IDS[j]);
          if (el2 && el2.style.display === 'none') el2.style.display = '';
        }
      }
    }, 400);
  })();
})();

/* ===== v59: default font Pacifico — har device par ek dafa migrate, panel ki choice phir bhi respected ===== */
(function () {
  try {
    if (!localStorage.getItem('sq-font-migrated')) {
      var f = localStorage.getItem('portfolio-font');
      if (!f || f === 'classic') localStorage.setItem('portfolio-font', 'pacifico');
      localStorage.setItem('sq-font-migrated', '1');
    }
  } catch (e) {}
  setInterval(function () {
    try {
      var f2 = localStorage.getItem('portfolio-font');
      var b = document.body;
      if (!b || f2 !== 'pacifico') return;
      var cur = b.style.fontFamily;
      if (cur && cur.indexOf('Pacifico') < 0) b.style.fontFamily = '"Pacifico", cursive';
    } catch (e) {}
  }, 500);
})();

/* ===== v63: right column gap khatam — visible buttons ka cascade restack ===== */
(function () {
  try {
    if (window.__sqRestack) return; window.__sqRestack = true;
    var ORDER = ['sq-dock-btn', 'sq-hub-btn', 'sq-top-btn', 'sq-bottom-btn'];
    var SLOTS = [18, 74, 132, 184];
    setInterval(function () {
      try {
        var i = 0;
        ORDER.forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) return;
          var cs = getComputedStyle(el);
          var vis = cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
          if (document.body.classList.contains('sq-dock-open') && id === 'sq-hub-btn') {
            if (el.style.getPropertyValue('bottom')) el.style.removeProperty('bottom');
            return;
          }
          if (vis && i < SLOTS.length) { el.style.setProperty('bottom', SLOTS[i] + 'px', 'important'); i++; }
        });
      } catch (e) {}
    }, 400);
  } catch (e) {}
})();

/* ===== v76: WhatsApp DPs — Boys/Girls cards (100+100, 640x640, WhatsApp-fit) ===== */
(function () {
  try {
    if (window.__sqDps) return; window.__sqDps = true;
    var CATS = [
      { key: 'boys', label: 'For Boys', count: 100, pre: 'B' },
      { key: 'girls', label: 'For Girls', count: 100, pre: 'G' }
    ];
    var CSS = '#sq-dps-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px;max-width:640px;margin:0 auto}' +
      '.sq-dps-card{position:relative;border-radius:20px;overflow:hidden;cursor:pointer;border:1px solid rgba(233,123,156,.4);box-shadow:0 10px 30px #0006,0 0 0 1px #ffffff10 inset;transition:transform .2s,box-shadow .2s;padding:0;background:none}' +
      '.sq-dps-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px #e97b9c55}' +
      '.sq-dps-card img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}' +
      '.sq-dps-card .sq-dps-label{position:absolute;left:0;right:0;bottom:0;padding:26px 14px 12px;background:linear-gradient(transparent,#000000d9);color:#fff;font-weight:700;font-size:15px;display:flex;justify-content:space-between;align-items:center;letter-spacing:.03em}' +
      '.sq-dps-card .sq-dps-count{font-size:12px;font-weight:600;background:#e97b9c55;border:1px solid #e97b9c88;border-radius:999px;padding:3px 10px}' +
      '#sq-dps-ov{position:fixed;inset:0;z-index:12000;background:#07070ccf;backdrop-filter:blur(8px);display:flex;flex-direction:column}' +
      '#sq-dps-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;color:#f2d9e1;font-weight:700;letter-spacing:.04em;border-bottom:1px solid #ffffff14}' +
      '#sq-dps-x{border:none;background:transparent;color:#f2d9e1;font-size:22px;cursor:pointer;padding:4px 10px}' +
      '.sq-dps-body{flex:1;overflow-y:auto;padding:16px}' +
      '.sq-dps-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}' +
      '.sq-dps-thumb{padding:0;border:none;background:none;border-radius:14px;overflow:hidden;cursor:pointer;aspect-ratio:1/1;border:1px solid #ffffff18;transition:transform .15s}' +
      '.sq-dps-thumb:hover{transform:scale(1.04)}' +
      '.sq-dps-thumb img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.sq-dps-view{display:flex;flex-direction:column;align-items:center;gap:14px;padding:10px 0 24px}' +
      '.sq-dps-view img{width:min(84vw,420px);aspect-ratio:1/1;object-fit:cover;border-radius:18px;border:1px solid #ffffff22;box-shadow:0 20px 60px #000c}' +
      '.sq-dps-dl{display:inline-flex;align-items:center;gap:8px;padding:12px 26px;border-radius:999px;border:none;cursor:pointer;font-weight:700;font-size:15px;color:#fff;background:linear-gradient(135deg,#e97b9c,#d9a94e);box-shadow:0 8px 24px #e97b9c66;text-decoration:none}' +
      '.sq-dps-back{border:none;background:#ffffff14;color:#f2d9e1;border-radius:999px;padding:10px 22px;cursor:pointer;font-weight:600}';
    function injectCss() {
      if (document.getElementById('sq-dps-style')) return;
      var s = document.createElement('style'); s.id = 'sq-dps-style'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    function mkSec(id, title, sub) {
      var sec = document.createElement('section');
      sec.className = 'section sq-sec'; sec.id = id;
      var head = document.createElement('div'); head.className = 'section-header';
      head.innerHTML = '<h2>' + title + '</h2>';
      var p = document.createElement('p'); p.className = 'sq-sec-sub'; p.textContent = sub;
      head.appendChild(p); sec.appendChild(head);
      return sec;
    }
    function dpSrc(cat, n) { return 'assets/dps/' + cat.key + '/' + cat.pre + String(n).padStart(3, '0') + '.png'; }
    function ensureSection() {
      if (document.getElementById('sq-dps')) return true;
      if (!document.body) return false;
      injectCss();
      var sec = mkSec('sq-dps', '\ud83d\udcf1 WhatsApp DPs', 'Profile picture ke liye ready DPs \u2014 har DP 640\u00d7640 square, WhatsApp par perfect fit');
      var grid = document.createElement('div'); grid.id = 'sq-dps-cards';
      CATS.forEach(function (c) {
        var card = document.createElement('button');
        card.type = 'button'; card.className = 'sq-dps-card';
        card.setAttribute('aria-label', c.label + ' DPs kholen');
        var img = document.createElement('img'); img.src = dpSrc(c, 1); img.alt = c.label + ' DP preview'; img.loading = 'lazy';
        var lab = document.createElement('span'); lab.className = 'sq-dps-label';
        lab.innerHTML = '<span>' + c.label + '</span><span class="sq-dps-count">' + c.count + ' DPs</span>';
        card.appendChild(img); card.appendChild(lab);
        card.onclick = function () { openOv(c); };
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      var anchor = document.getElementById('contact');
      var target = anchor && anchor.closest ? (anchor.closest('section') || anchor) : null;
      (target && target.parentNode ? target.parentNode : document.body).insertBefore(sec, target || null);
      return true;
    }
    function closeOv(ov) {
      ov.remove();
      document.body.style.overflow = '';
    }
    function openOv(cat) {
      var old = document.getElementById('sq-dps-ov'); if (old) old.remove();
      var ov = document.createElement('div'); ov.id = 'sq-dps-ov';
      var head = document.createElement('div'); head.id = 'sq-dps-head';
      head.innerHTML = '<span>\ud83d\udcf1 WhatsApp DPs \u2014 ' + cat.label + '</span>';
      var x = document.createElement('button'); x.id = 'sq-dps-x'; x.textContent = '\u00d7';
      x.setAttribute('aria-label', 'Band karein');
      x.onclick = function () { closeOv(ov); };
      head.appendChild(x);
      var body = document.createElement('div'); body.className = 'sq-dps-body';
      var grid = document.createElement('div'); grid.className = 'sq-dps-grid';
      for (var i = 1; i <= cat.count; i++) {
        (function (n) {
          var t = document.createElement('button');
          t.type = 'button'; t.className = 'sq-dps-thumb';
          var im = document.createElement('img'); im.src = dpSrc(cat, n); im.alt = cat.label + ' DP ' + n; im.loading = 'lazy';
          t.appendChild(im);
          t.onclick = function () { showView(cat, n); };
          grid.appendChild(t);
        })(i);
      }
      body.appendChild(grid);
      ov.appendChild(head); ov.appendChild(body);
      document.body.appendChild(ov);
      document.body.style.overflow = 'hidden';
      ov.addEventListener('click', function (e) { if (e.target === ov) closeOv(ov); });
    }
    function showView(cat, n) {
      var ov = document.getElementById('sq-dps-ov'); if (!ov) return;
      var body = ov.querySelector('.sq-dps-body');
      body.innerHTML = '';
      var view = document.createElement('div'); view.className = 'sq-dps-view';
      var im = document.createElement('img'); im.src = dpSrc(cat, n); im.alt = cat.label + ' DP ' + n;
      var dl = document.createElement('a'); dl.className = 'sq-dps-dl'; dl.textContent = '\u2b07\ufe0f Download DP';
      dl.href = dpSrc(cat, n); dl.download = 'whatsapp-dp-' + cat.key + '-' + String(n).padStart(3, '0') + '.png';
      var back = document.createElement('button'); back.className = 'sq-dps-back'; back.textContent = '\u2190 Wapas';
      back.onclick = function () { openOv(cat); };
      view.appendChild(im); view.appendChild(dl); view.appendChild(back);
      body.appendChild(view);
    }
    var iv = setInterval(function () { ensureSection(); }, 1200);
  } catch (e) {}
})();
