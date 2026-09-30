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
    ['love','❤️','Love',[
      'Teri aankhon mein jo jaadu hai | Har nazar mein nayi dastaan likhi hai ❤️',
      'Dil ne tujh ko chun liya hai | Ab koi aur soojhta hi nahi',
      'Tere naam se shuru hoti hai | Har subah, har dua meri 🌅',
      'Ishq wo aag hai jo | Jalati bhi hai, roshan bhi karti hai 🔥',
      'Tum haso to lagta hai | Baharon ne ghar kar liya 🌸',
      'Teri ek muskurahat ke liye | Main duniya se lar jaaon ga',
      'Mohabbat apni kam nahi | Sab se badi daulat hai',
      'Dil ki gehraiyon mein | Tera hi naam likha hai ✍️',
      'Tere bina to zindagi | Aadhi si lagti hai',
      'Nazar jahan se uthti hai | Teri tasveer wahan milti hai 🖼️',
      'Chand ko dekh kar tujhe yaad aata hai | Ye ishq ka asar hai 🌙',
      'Tera hona hi kaafi hai | Baqi sab duniya ki marzi',
      'Mohabbat wo nahi ke mil jaye | Mohabbat wo hai ke na toot jaye 💗',
      'Teri baaton mein wo baat hai | Jo kahin aur nahi milti',
      'Dil ne tujh se hi poocha hai | Ye pyar kya hota hai 💞',
      'Tum aa jao to | Kaliyan bhi khil jayen 🌷',
      'Ishq mein doobne ka maza | Doob kar hi pata chalta hai 🌊',
      'Tere naam ki dhool bhi | Mere liye zevar hai',
      'Pyar wo jo nazron se | Dil tak jata hai 👀',
      'Teri kami khalti hai | Har khushi mein thori si',
      'Tu jo mile to | Manzilein khud chalein aayen 🛤️',
      'Ek tum ho jo sab ho | Ek ye duniya hai jis mein kuch nahi',
      'Mohabbat mein sab kuch dena | Magar apna hona sab se pyara hai 🎁',
      'Tere hone se hi | Ghar ko ghar kehte hain 🏡',
      'Dil ki duniya basi hai | Tere naam ke nagar mein 🏰',
      'Wo shaks meri duaon mein | Sab se gehri jagah rakhta hai 🤲',
      'Ishq bann kar reh jata hai | Jo dil mein utar jaye 💓',
      'Tere sath har raat | Jaise chandni ka shabab ho ✨',
      'Mohabbat parhti nahi | Mohabbat kar dikhayi jati hai 📖',
      'Mujhe tumsa koi | Doosra nahi chahiye tha kabhi',
    ]],
    ['sad','😢','Sad',[
      'Aansu bhi ajeeb hote hain | Aksar tanhai mein nikalte hain 😢',
      'Khamoshi bhi bohot kuch kehti hai | Sunne wala koi hota to',
      'Dard ki had wo hai | Jab muskurana bhi majboori lage 💔',
      'Log badal nahi jaate | Nazariya badal jata hai',
      'Wo to chale gaye | Yaadein peeche reh gayin',
      'Dil toota hai abhi | Awaz bhi nahi aayi',
      'Zakhm gehre hote hain | Jo nazar nahi aate',
      'Tanhai ka maza wo hi janta hai | Jis ne sab ko jate dekha ho 🌙',
      'Umeed ka diya na bujhne do | Chahe hawa tez ho 🪔',
      'Muskurana seekh liya | Magar dil rota reh gaya',
      'Jo apne hue nahi | Unki yaad bhi apni nahi hoti',
      'Kuch log ja kar | Khali jagah chhor jate hain 🪑',
      'Dard batane ka koi haq nahi | Har kisi ko apna haal',
      'Raaton ko neend kahan | Aankhein aayen to so jayen 🌃',
      'Gham bhi ghareeb hota hai | Saath kabhi kisi ke nahi nibhata',
      'Dil ne chaha jo | Muqaddar ne likha kuch aur tha ✍️',
      'Toot kar bhi khada hoon | Ye aadat achi nahi 🥀',
      'Log mile bhi to | Wafa milti nahi',
      'Apne hi chehre par | Parda pad gaya hai ab',
      'Ye dard bhi sath chalta hai | Jis ko chhora uska nahi 🚶',
      'Beachh se pehle soch lein | Rishton ki qeematein 💸',
      'Mai toot bhi jaaon | To mujh se sambhal lena 🫂',
      'Khushiyan baant raha tha | Sab ne hissa le liya',
      'Ab to adat si hai | Apne dukh chhupana 🎭',
      'Rona nahi hai mujhe | Bas thakan si reh gayi hai',
      'Koi poochh nahi leta | Dil kaisa hai yahan 🏙️',
      'Har koi apna safar | Tanhai mein katta hai',
      'Muskurahat ka mol | Kabhi sab ko nahi milta',
      'Bichharne wale | Yaadon mein reh jate hain 🌫️',
      'Dard ka saudagar | Sab se sasta tha main',
    ]],
    ['romantic','💕','Romantic',[
      'Teri saanson ki khushboo | Mere dil ka qarar hai 🌬️',
      'Haath mein haath rakh kar | Chalna seekh lein hum 💑',
      'Tere honton pe jo naam hai | Wo mera zaroor hona chahiye 💋',
      'Palkon pe bitha loonga | Har wo baat jo keh na sakhon 🥰',
      'Baarish ho aur tum saath ho | Bas ye maang liye hum ne 🌧️',
      'Tere kaan ke pass | Sirf mohabbat ki baatein karni hain 🤫',
      'Angdayi mein bhi tu | Neend mein bhi tu 🌙',
      'Meri duniya ka sunehra waqt | Tere aane wali sham hai 🌇',
      'Tum se mil kar lagta hai | Safar manzil tak pohnch gaya 🛖',
      'Tere liye likhi har pankti | Khud tere hue hai 💌',
      'Teri ungli pakad loon | To raasta bhool jaaon 🤝',
      'Mohabbat ka pehla paath | Teri hansi se shuru hota hai 📿',
      'Tere sath bitaya har lamha | Meri favorite kahani hai 📚',
      'Aankh mein aankh dhal kar | Baat karne ka maza hi aur hai 👁️',
      'Tu jahan bhi ho | Mera dil wahan tikka hai 📍',
      'Tere liye chand tak | Jaane ka irada tha 🚀',
      'Tera rona bhi pyara | Magar hasana zyada pyara 😊',
      'Hum dono ki kahani | Sitare bhi likhte hain ⭐',
      'Teri baahon ki garmi | Seharon ki chaaon si 🌴',
      'Milne ki fursat nahi | Magar yaad ka waqt nahi milta kabhi',
      'Tere naam ki chai | Sab se zyada strong chai ☕',
      'Tu hasse to main | Puray din ki thakan bhool jaaon 😌',
      'Mohabbat mein ye kya kya | Karein hum majboor ho kar 🎠',
      'Tere liye har ghazal | Har sher, har kitaab 📖',
      'Teri aankhon ka na hona | Meri raaton ki daulat hai 🌌',
      'Pyar mein thakne ka | Koi raasta nahi hota',
      'Tum ho to main hoon | Warna kuch bhi nahi 🫧',
      'Teri yaad se khushbu | Aati hai phoolon ki tarah 🌺',
      'Ek tu hai ek main hai | Aur bas mohabbat ki raat hai 🌃',
      'Tere sath jeena | Sirf jeena nahi, jee uthna hai 🕊️',
    ]],
    ['happy','😊','Happy',[
      'Khushi apne andar dhoondo | Bahar sab batate phiren ge 🔍',
      'Muskurana sasta hai | Is se mehnga koi naqab nahi 😄',
      'Aaj ka din tofa hai | Ise kholo aur jiyo 🎁',
      'Hanste hue jeene walon ke | Raste khud sanwar jate hain 🛣️',
      'Chhoti chhoti khushiyon mein | Bari raahat hai 🍵',
      'Jo mila hansi se | Wo agar se behtar hai 😌',
      'Zindagi ka maza | Chai aur dosti mein hai ☕',
      'Dil halka rakho | Saman baad mein utha lena 🎒',
      'Har subah naya mauka hai | Kal ka drama bhool jao 🌞',
      'Khud se mohabbat | Sab se pehli mohabbat hai 🪞',
      'Khush rehna bhi | Ek hunar hai 🎨',
      'Muskurahat muft mein milti hai | Ise waste na karo 😁',
      'Jo hua achha hua | Jo ho raha behtar ho raha hai 🌈',
      'Apni hansi se | Doosron ko bhi hansa do 🎉',
      'Zindagi ko zindagi kehne ka | Haq hanse walon ka hai 🤣',
      'Har mushkil ka jawab | Muskurahat se do 😎',
      'Khushiyon ki khoj mein | Matt bhatko, ye saath hai 🔆',
      'Din bhar ki thakan | Raat ki neend se dhul jati hai 😴',
      'Acha socho | Acha hoga — ye formula chalta hai 🧪',
      'Hansta hua banda | Kam se kam apna zaroor hota hai 😆',
      'Pareshaniyan aati jati hain | Hum to hamesha hain 💪',
      'Chai garam aur dil sada | Bas yehi zindagi hai ☕',
      'Har koi khush hai | Bas mood ka masla hai 🎭',
      'Aaj kuch acha kiya? | Kal ke liye target hai 🎯',
      'Khushi bantne se | Barhti hai — accounting nahi samajhi 📈',
      'Sar utha kar jiyo | Magar garden seedhi rakho 🦒',
      'Qismat ka likha bhi | Muskura kar padha jata hai 📜',
      'Har imtihan mein pass hone zaroori nahi | Seekhna zaroori hai 📚',
      'Zindagi ek playlist hai | Apne gaane khud chuno 🎧',
      'Bas jiyo | Baaqi sab excuses hain 🌞',
    ]],
    ['life','🌱','Life',[
      'Zindagi wo nahi jo mili hai | Zindagi wo hai jo banai hai 🌱',
      'Waqt sab ka badalta hai | Sabr ka phal meetha hota hai ⏳',
      'Manzil unhi ko milti hai | Jin ke sapnon mein jaan hoti hai 🎯',
      'Girna zindagi ka hissa hai | Uthna apna hosla hai 💪',
      'Kamyab log wo nahi jo kabhi na gire | Wo hain jo har gir kar uthe 🏔️',
      'Zindagi ka sab se bara aaina | Aap ke apne kaam hai 🪞',
      'Har raat ke baad | Subah zaroor aati hai 🌅',
      'Log aate jate rahenge | Aap ka kaam aapki pehchan hai 🛠️',
      'Jitna gehra paiyar karo | Utne gehre rahe ge 🌳',
      'Waqt ka ehtaram karo | Ye sab kuch le kar aata hai ⌛',
      'Mushkilein darwaze band karti nahi | Naye darwaze khol deti hain 🚪',
      'Jo aaj mehnat kar rahe ho | Kal wo kahani banegi 📖',
      'Zindagi chhoti hai | Magar asar gehra hota hai 🌊',
      'Apne sapno ko | Zaroorat se zyada izzat do 💭',
      'Taufeeq har kisi ko nahi | Achay ban kar rehne ki 🌟',
      'Sabar aur mehnat | In dono se bara jadu nahi 🪄',
      'Zindagi ko masla na samjho | Ye ek mouka hai 🎟️',
      'Har koi apni qismat | Khud likh sakta hai ✍️',
      'Doosron ke sapno mein aag lagane se acha hai | Apna diya khud jalao 🪔',
      'Koshish karne walon ki | Har nakaam koshish bhi kaam aati hai 🧗',
      'Ilm wo khazana hai | Jis ko lootna mushkil hai 📚',
      'Waqt sab ka ilaaj hai | Magar dosh bhi waqt ka hai ⚖️',
      'Achi soch se achi zindagi | Banti hai 🧠',
      'Zindagi mein wo mat karo | Jo kal sharminda kar de 🙈',
      'Dosti aur waqt | In dono ki qadar baad mein hoti hai ⏰',
      'Apni pehchan banane ke liye | Rukna mana nahi 🚩',
      'Har din thora behtar | Bas yehi formula hai ➕',
      'Aadatein aapki kismat | Banati hain 🔁',
      'Sach ki raah mushkil hai | Magar is se seedhi koi nahi 🛤️',
      'Zindagi ko samjho | Warna ye samajh jaye gi 🎲',
    ]],
    ['attitude','🦁','Attitude',[
      'Hum woh nahi jo sab se mile | Hum woh hain jo apne rakhein 🦁',
      'Zubaan chhoti hai | Magar baat bari hai 🗣️',
      'Chup rehna hamari kamzori nahi | Hoshiyari hai 🤐',
      'Level sab ka pata hai | Magar hum ghor nahi karte 😏',
      'Apni value khud rakho | Warna bazaar bata dein ge 🏷️',
      'Hum se panga | Waqt ki Nazar mein bohot mehnga hai ⚠️',
      'Do tareeqay hain | Hamara aur sab ka 🛣️',
      'Aqal mand apni baat se | Nahi apne amal se pehchana jata hai 🧠',
      'Jitna bhi bhaago | Apne aap se nahi bach paoge 🏃',
      'Sar uncha rakho | Magar shoulders seedhi 👑',
      'Hum duniya se nahi lagte | Duniya hum se lagti hai 🌍',
      'Jo zubaan samjhe nahi | Us ko khamoshi samjha deti hai 🤫',
      'Mehnat apni | Tariffein rab ki 💪',
      'Dushman jitna bara | Utna hi acha counter attack 🎯',
      'Hum rutbe se nahi | Akhlaq se baray hain 🎖️',
      'Apne liye jiyo | Log to kisi ka khair nahi 🙃',
      'Number ek hona zaroori nahi | Behtareen hona zaroori hai 🥇',
      'Jo aaj mehsoos ho raha hai | Kal ki kahani ban jayega 📖',
      'Apni fee | Khud tay karo 💼',
      'Har cheez ki qeemat | Har kisi se nahi pouchhi jati 💰',
      'Tehzeeb hamari pehchan hai | Magar hoshiyari bhi zaroori 🎭',
      'Do waqt ka khana kha kar | Sapne dekhna band nahi karna 🍽️',
      'Jo mila us par khush | Magar jo chahiye tha wo bhi yaad rakhna 🔥',
      'Himmat mand hi | Bara shahanshah hota hai 🦁',
      'Dosti mein sach | Dushmani mein izzat 🤝',
      'Hum apne sardar hain | Kisi ke tahat nahi rehna 🚩',
      'Jo guzri hum par | Wo kisi par na guzre 🙏',
      'Khamosh rah kar bhi | Sab kuch keh gaye 🎩',
      'Zamana jitna bharas ho | Hamari chandni ka asar nahi 🌕',
      'Apna waqt aayega | Magar aaj se tayyar hain ⏳',
    ]],
  ];

  var FONTS = [
    ['Bold Italic', 'Georgia, serif', 'italic', '700'],
    ['Dancing', "'Dancing Script', cursive", 'normal', '700'],
    ['Signature', "'Great Vibes', cursive", 'normal', '400'],
    ['Handy', "'Caveat', cursive", 'normal', '700'],
    ['Playfair', "'Playfair Display', Georgia, serif", 'italic', '700'],
  ];

  function build() {
    var host = q('.hero');
    if (!host || !host.parentNode) return false;
    var parent = host.parentNode;
    if (parent.querySelector('#sq-poetry')) return null; // already built
    var sec = document.createElement('section');
    sec.className = 'section sq-sec';
    sec.id = 'sq-poetry';

    var head = document.createElement('div');
    head.className = 'section-header';
    head.innerHTML = '<h2>🌿  Poetry</h2>';
    var sub = document.createElement('p');
    sub.className = 'sq-sec-sub';
    sub.textContent = 'Dil se parhen — aur apne pasand ka font chunein';
    head.appendChild(sub);
    sec.appendChild(head);

    // font picker
    var frow = document.createElement('div');
    frow.className = 'sq-poetry-fonts';
    frow.innerHTML = '<span class="sq-poetry-flabel">🖋️ Font:</span>';
    var saved = 0;
    try { saved = parseInt(localStorage.getItem('sq-poetry-font') || '0', 10) || 0; } catch (e) {}
    if (saved < 0 || saved >= FONTS.length) saved = 0;
    var fbtns = [];
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
        fbtns.forEach(function (x, k) { x.classList.toggle('active', k === i); });
        applyFont(i);
      };
      fbtns.push(b);
      frow.appendChild(b);
    });
    sec.appendChild(frow);

    // category tabs
    var tabs = document.createElement('div');
    tabs.className = 'sq-poetry-tabs';
    var grid = document.createElement('div');
    grid.className = 'sq-poetry-grid';
    var active = 'love';
    function applyFont(i) {
      var f = FONTS[i] || FONTS[0];
      grid.style.setProperty('--sq-sher-font', f[1]);
      grid.style.setProperty('--sq-sher-style', f[2]);
      grid.style.setProperty('--sq-sher-weight', f[3]);
    }
    CATS.forEach(function (cat) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sq-poetry-tab' + (cat[0] === active ? ' active' : '');
      b.innerHTML = cat[1] + ' ' + cat[2];
      b.onclick = function () {
        active = cat[0];
        Array.prototype.forEach.call(tabs.children, function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        render();
      };
      tabs.appendChild(b);
    });
    function render() {
      try {
        var cat = CATS.filter(function (c) { return c[0] === active; })[0] || CATS[0];
        grid.innerHTML = '';
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
          card.appendChild(p);
          grid.appendChild(card);
        });
      } catch (e) {}
    }
    sec.appendChild(tabs);
    sec.appendChild(grid);
    applyFont(saved);
    render();
    parent.appendChild(sec);
    return true;
  }

  var tries = 0;
  var t = setInterval(function () {
    try {
      tries++;
      var r = build();
      if (r !== false || tries > 60) clearInterval(t);
    } catch (e) { try { clearInterval(t); } catch (x) {} }
  }, 600);
})();
