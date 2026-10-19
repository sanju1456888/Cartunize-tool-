(function () {
  'use strict';

  var LIVE = !/^YOUR_/.test(firebaseConfig.apiKey);
  var db = null;
  if (LIVE) { firebase.initializeApp(firebaseConfig); db = firebase.database(); }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var safeUrl = function (u) {
    u = String(u || '').trim();
    return /^(https?:\/\/|#|mailto:|tel:|\/|\.\/)/i.test(u) ? u : (u ? 'https://' + u : '#');
  };
  var isImg = function (s) { return /^(https?:)?\/\//i.test(String(s || '')) || /\.(png|jpe?g|webp|gif|svg)$/i.test(String(s || '')); };

  var S = {
    settings: Object.assign({}, DEMO.settings),
    tools: [], plans: [], videos: [], downloads: [], assets: [], posts: [], counts: {}
  };
  var cycle = 'm';

  function toArr(obj) {
    return Object.keys(obj || {}).map(function (id) { var o = obj[id] || {}; o.id = id; return o; })
      .filter(function (o) { return o.active !== false; })
      .sort(function (a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
  }
  function demoArr(list) { return list.map(function (o, i) { return Object.assign({ id: 'demo' + i }, o); }); }

  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }

  /* ---------- media helpers ---------- */
  function ytId(u) { var m = String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : null; }
  function thumbOf(v) {
    if (v.thumb) return v.thumb;
    var id = ytId(v.url || ''); return id ? 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg' : '';
  }
  function playerHtml(url) {
    url = String(url || '').trim();
    var id = ytId(url), m;
    if (id) return '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    if ((m = url.match(/vimeo\.com\/(\d+)/))) return '<iframe src="https://player.vimeo.com/video/' + m[1] + '?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>';
    if ((m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/))) return '<iframe src="https://drive.google.com/file/d/' + m[1] + '/preview" allow="autoplay" allowfullscreen></iframe>';
    if (!url) return '<div style="height:100%;display:grid;place-items:center;color:#8fa5cc">No video link</div>';
    return '<video controls autoplay playsinline src="' + esc(safeUrl(url)) + '"></video>';
  }
  function openVideo(v) {
    $('#mTitle').textContent = v.title || '';
    $('#mFrame').innerHTML = playerHtml(v.url);
    $('#mDesc').textContent = v.desc || '';
    $('#modal').classList.add('on');
  }
  function closeVideo() { $('#modal').classList.remove('on'); $('#mFrame').innerHTML = ''; }

  /* ---------- render ---------- */
  function renderSettings() {
    var s = S.settings, set = function (id, v) { var e = $('#' + id); if (e) e.textContent = v || ''; };
    document.title = (s.siteName || 'CARTUNIZE') + (s.tagline ? ' - ' + s.tagline : '');
    var logo = s.logoUrl ? '<img src="' + esc(s.logoUrl) + '" alt="' + esc(s.siteName) + '">' : '<span>' + esc(s.siteName || 'CARTUNIZE') + '</span>';
    ['logo', 'logo2', 'logo3'].forEach(function (id) { $('#' + id).innerHTML = logo; });

    var n = $('#notice');
    if (s.noticeText) { n.textContent = s.noticeText; n.classList.remove('hide'); } else n.classList.add('hide');

    set('hb1', s.heroBadge1 ? '🔑 ' + s.heroBadge1 : ''); $('#hb1').classList.toggle('hide', !s.heroBadge1);
    set('hb2', s.heroBadge2 ? '👑 ' + s.heroBadge2 : ''); $('#hb2').classList.toggle('hide', !s.heroBadge2);
    set('hTitle', s.heroTitle); set('hSub', s.heroSub);
    var hb = $('#hBtn'); hb.textContent = s.heroBtnText || 'Explore'; hb.href = safeUrl(s.heroBtnLink || '#tools');
    $('#hero').style.backgroundImage = s.heroImage ? 'url("' + String(s.heroImage).replace(/"/g, '%22') + '")' : '';

    $('#trust').innerHTML = [['⚡', s.trust1], ['♾️', s.trust2], ['🎧', s.trust3], ['🔑', s.trust4]]
      .filter(function (t) { return t[1]; })
      .map(function (t) { return '<div><i>' + t[0] + '</i>' + esc(t[1]) + '</div>'; }).join('');

    ['toolsTitle', 'toolsSub', 'plansTitle', 'plansSub', 'learnTitle', 'learnSub', 'downloadsTitle', 'downloadsSub',
      'assetsTitle', 'assetsSub', 'blogTitle', 'blogSub'].forEach(function (k) { set(k, s[k]); });

    set('pTag', s.pluginTag); set('pSub', s.pluginSub); set('pDesc', s.pluginDesc);
    var pt = $('#pTitle'); var parts = String(s.pluginTitle || '').split(' ');
    pt.innerHTML = parts.length > 1 ? esc(parts.slice(0, -1).join(' ')) + ' <span>' + esc(parts[parts.length - 1]) + '</span>' : esc(s.pluginTitle);
    var meta = []; if (s.pluginVersion) meta.push('Version: ' + s.pluginVersion); if (s.pluginSize) meta.push('Size: ' + s.pluginSize);
    set('pMeta', meta.join('   |   '));
    var pb = $('#pBtn'); pb.textContent = (s.pluginBtn || 'Download') + ' ⬇'; pb.href = safeUrl(s.pluginLink);
    $('#plugin').classList.toggle('hide', !s.pluginTitle);

    set('fText', s.footerText); set('copyText', s.copyright); set('yr', new Date().getFullYear());
    $('#yr').textContent = new Date().getFullYear();

    $('#stats').innerHTML = [1, 2, 3, 4].filter(function (i) { return s['stat' + i + 'v']; })
      .map(function (i) { return '<div><b>' + esc(s['stat' + i + 'v']) + '</b><small>' + esc(s['stat' + i + 'l']) + '</small></div>'; }).join('');

    var soc = [['whatsapp', 'WhatsApp', function (v) { return 'https://wa.me/' + String(v).replace(/\D/g, ''); }],
      ['telegram', 'Telegram', safeUrl], ['facebook', 'Facebook', safeUrl], ['youtube', 'YouTube', safeUrl],
      ['instagram', 'Instagram', safeUrl], ['email', 'Email', function (v) { return 'mailto:' + v; }]];
    $('#soc').innerHTML = soc.filter(function (x) { return s[x[0]]; })
      .map(function (x) { return '<a href="' + esc(x[2](s[x[0]])) + '" target="_blank" rel="noopener">' + x[1] + '</a>'; }).join('');
    var contact = s.whatsapp ? 'https://wa.me/' + String(s.whatsapp).replace(/\D/g, '') : (s.email ? 'mailto:' + s.email : '');
    $$('[data-contact]').forEach(function (a) { if (contact) { a.href = contact; a.target = '_blank'; } });
  }

  function renderTools() {
    var el = $('#toolsList');
    $('#tools').classList.toggle('hide', !S.tools.length);
    el.innerHTML = S.tools.map(function (t) {
      var ic = isImg(t.icon) ? '<img src="' + esc(t.icon) + '" alt="" loading="lazy">' : esc(t.icon || '🛠️');
      var tag = t.link ? 'a href="' + esc(safeUrl(t.link)) + '" target="_blank" rel="noopener"' : 'div';
      var end = t.link ? 'a' : 'div';
      return '<' + tag + ' class="tool"><div class="ic">' + ic + '</div><b>' + esc(t.name) + '</b><small>' + esc(t.desc) + '</small></' + end + '>';
    }).join('');
  }

  function renderPlans() {
    var cur = S.settings.currency || '₹';
    $('#plans').classList.toggle('hide', !S.plans.length);
    $('#plansList').innerHTML = S.plans.map(function (p) {
      var price = cycle === 'y' ? (Number(p.yearlyPrice) || Math.round(Number(p.price) * 12 * 0.78)) : Number(p.price);
      var per = cycle === 'y' ? 'year' : (p.period || 'month');
      var feats = String(p.features || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean)
        .map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      return '<div class="plan' + (p.badge ? ' pop' : '') + '">' +
        (p.badge ? '<div class="bd">' + esc(p.badge) + '</div>' : '') +
        (p.image ? '<img class="pimg" src="' + esc(p.image) + '" alt="" loading="lazy">' : '') +
        '<h3>' + esc(p.name) + '</h3><div class="tg">' + esc(p.tagline) + '</div>' +
        '<div class="price">' + esc(cur) + price.toLocaleString('en-IN') + ' <small>/ ' + esc(per) + '</small></div>' +
        '<a class="btn block" href="' + esc(safeUrl(p.buyLink)) + '" target="_blank" rel="noopener">Buy Now 🛒</a>' +
        '<ul>' + feats + '</ul>' +
        (p.deviceNote ? '<div class="dev">💻 ' + esc(p.deviceNote) + '</div>' : '') + '</div>';
    }).join('');
  }

  function renderVideos() {
    $('#learn').classList.toggle('hide', !S.videos.length);
    $('#videosList').innerHTML = S.videos.map(function (v, i) {
      var th = thumbOf(v);
      return '<button class="vid" data-v="' + i + '"><div class="th">' + (th ? '<img src="' + esc(th) + '" alt="" loading="lazy">' : '') +
        '<div class="play">▶</div>' + (v.duration ? '<div class="dur">' + esc(v.duration) + '</div>' : '') + '</div>' +
        '<div class="bd2"><b>' + esc(v.title) + '</b><small>' + esc(v.group) + '</small></div></button>';
    }).join('');
    $$('#videosList .vid').forEach(function (b) {
      b.addEventListener('click', function () { openVideo(S.videos[+b.getAttribute('data-v')]); });
    });
  }

  function renderDownloads() {
    $('#downloads').classList.toggle('hide', !S.downloads.length);
    $('#downloadsList').innerHTML = S.downloads.map(function (d) {
      var c = S.counts[d.id] || 0;
      var meta = [d.version ? 'v' + d.version : '', d.size, c ? c.toLocaleString() + ' downloads' : ''].filter(Boolean).join('  |  ');
      return '<div class="dl"><div class="im">' + (d.image ? '<img src="' + esc(d.image) + '" alt="" loading="lazy">' : '📦') + '</div>' +
        '<div class="tx"><b>' + esc(d.title) + '</b><small>' + esc(d.desc) + '</small><small style="display:block">' + esc(meta) + '</small></div>' +
        '<a class="btn" data-dl="' + esc(d.id) + '" href="' + esc(safeUrl(d.link)) + '" target="_blank" rel="noopener">Download</a></div>';
    }).join('');
  }

  function renderAssets() {
    $('#assets').classList.toggle('hide', !S.assets.length);
    $('#assetsList').innerHTML = S.assets.map(function (a) {
      return '<div class="card"><div class="ci">' + (a.image ? '<img src="' + esc(a.image) + '" alt="" loading="lazy">' : '🎞️') + '</div>' +
        '<div class="cb"><b>' + esc(a.title) + '</b><p>' + esc(a.desc) + '</p>' +
        '<a class="more" href="' + esc(safeUrl(a.link)) + '" target="_blank" rel="noopener" data-dl="' + esc(a.id) + '">Get it →</a></div></div>';
    }).join('');
  }

  function renderPosts() {
    $('#blog').classList.toggle('hide', !S.posts.length);
    $('#postsList').innerHTML = S.posts.map(function (p) {
      return '<article class="post"><div class="pi">' + (p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">' : '') + '</div>' +
        '<div class="pb"><div class="mt">' + (p.category ? '<span>' + esc(p.category) + '</span>' : '') + esc(p.date) + '</div>' +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.excerpt) + '</p><a href="' + esc(safeUrl(p.link)) + '" target="_blank" rel="noopener">Read More →</a></div></article>';
    }).join('');
  }

  function renderAll() { renderSettings(); renderTools(); renderPlans(); renderVideos(); renderDownloads(); renderAssets(); renderPosts(); }

  /* ---------- data ---------- */
  if (LIVE) {
    db.ref('settings').on('value', function (s) { S.settings = Object.assign({}, DEMO.settings, s.val() || {}); renderSettings(); });
    ['tools', 'plans', 'videos', 'downloads', 'assets', 'posts'].forEach(function (k) {
      db.ref(k).on('value', function (s) {
        S[k] = toArr(s.val());
        ({ tools: renderTools, plans: renderPlans, videos: renderVideos, downloads: renderDownloads, assets: renderAssets, posts: renderPosts })[k]();
      });
    });
    db.ref('counts').on('value', function (s) { S.counts = s.val() || {}; renderDownloads(); });
  } else {
    ['tools', 'plans', 'videos', 'downloads', 'assets', 'posts'].forEach(function (k) { S[k] = demoArr(DEMO[k]); });
    renderAll();
    toast('Demo mode: firebase-config.js এ আপনার Firebase তথ্য দিন');
  }
  renderSettings();

  /* download counter */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-dl]');
    if (a && LIVE) db.ref('counts/' + a.getAttribute('data-dl')).transaction(function (n) { return (n || 0) + 1; });
  });

  /* plan cycle */
  $$('#cycle button').forEach(function (b) {
    b.addEventListener('click', function () {
      cycle = b.getAttribute('data-c');
      $$('#cycle button').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderPlans();
    });
  });

  /* drawer */
  var drawer = $('#drawer'), ov = $('#overlay');
  function menu(open) { drawer.classList.toggle('on', open); ov.classList.toggle('on', open); }
  $('#openMenu').addEventListener('click', function () { menu(true); });
  $('#closeMenu').addEventListener('click', function () { menu(false); });
  ov.addEventListener('click', function () { menu(false); });
  $$('.drawer nav a, .drawer .logo').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });

  /* theme */
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    $('#themeLabel').textContent = t === 'dark' ? 'Night Mode' : 'Day Mode';
    $('#themeBtn').textContent = t === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('cartunize-theme', t); } catch (e) { }
  }
  var saved = 'dark'; try { saved = localStorage.getItem('cartunize-theme') || 'dark'; } catch (e) { }
  setTheme(saved);
  $('#themeBtn').addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* search */
  var sc = $('#search'), q = $('#q'), res = $('#results');
  function openSearch() { sc.classList.add('on'); q.value = ''; res.innerHTML = ''; setTimeout(function () { q.focus(); }, 50); }
  function closeSearch() { sc.classList.remove('on'); }
  $('#openSearch').addEventListener('click', openSearch);
  $('#closeSearch').addEventListener('click', closeSearch);
  q.addEventListener('input', function () {
    var t = q.value.trim().toLowerCase(), out = [];
    if (t) {
      var hit = function (o, keys) { return keys.some(function (k) { return String(o[k] || '').toLowerCase().indexOf(t) > -1; }); };
      S.tools.forEach(function (o) { if (hit(o, ['name', 'desc'])) out.push({ type: 'Tool', title: o.name, sub: o.desc, go: '#tools' }); });
      S.videos.forEach(function (o, i) { if (hit(o, ['title', 'desc', 'group'])) out.push({ type: 'Video', title: o.title, sub: o.group, vid: i }); });
      S.downloads.forEach(function (o) { if (hit(o, ['title', 'desc'])) out.push({ type: 'Download', title: o.title, sub: o.desc, url: o.link }); });
      S.assets.forEach(function (o) { if (hit(o, ['title', 'desc'])) out.push({ type: 'Asset', title: o.title, sub: o.desc, url: o.link }); });
      S.plans.forEach(function (o) { if (hit(o, ['name', 'tagline'])) out.push({ type: 'Plan', title: o.name, sub: o.tagline, go: '#plans' }); });
    }
    res.innerHTML = out.length ? out.map(function (r, i) {
      return '<button class="sr" data-i="' + i + '"><div><b>' + esc(r.title) + '</b><small>' + esc(r.sub) + '</small></div><span class="tag">' + r.type + '</span></button>';
    }).join('') : (t ? '<div class="empty">কিছু পাওয়া যায়নি</div>' : '');
    $$('.sr', res).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = out[+b.getAttribute('data-i')]; closeSearch();
        if (r.vid != null) openVideo(S.videos[r.vid]);
        else if (r.url) window.open(safeUrl(r.url), '_blank', 'noopener');
        else if (r.go) location.hash = r.go;
      });
    });
  });

  /* modal */
  $('#mClose').addEventListener('click', closeVideo);
  $('#modal').addEventListener('click', function (e) { if (e.target.id === 'modal') closeVideo(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeVideo(); closeSearch(); menu(false); } });

  /* newsletter */
  $('#nlForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var em = $('#nlEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast('সঠিক ইমেইল দিন');
    if (!LIVE) return toast('Demo mode: Firebase সেট করলে সেভ হবে');
    db.ref('subscribers').push({ email: em, at: firebase.database.ServerValue.TIMESTAMP })
      .then(function () { $('#nlEmail').value = ''; toast('Subscribed! ধন্যবাদ'); })
      .catch(function () { toast('আবার চেষ্টা করুন'); });
  });

  /* bottom nav highlight */
  var navs = $$('[data-nav]');
  window.addEventListener('hashchange', function () {
    navs.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === location.hash); });
  });
})();
