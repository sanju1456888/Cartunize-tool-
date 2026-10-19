(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 2600); }

  if (/^YOUR_/.test(firebaseConfig.apiKey)) {
    document.body.innerHTML = '<div style="padding:30px;max-width:560px;margin:auto;font-family:sans-serif;color:#eaf2ff;line-height:1.7">' +
      '<h2>Firebase সেট করা হয়নি</h2><p><b>firebase-config.js</b> ফাইল খুলে আপনার Firebase প্রজেক্টের তথ্য বসান, তারপর এই পেজ রিলোড করুন।</p></div>';
    return;
  }

  firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth(), db = firebase.database();

  /* ---------- link helpers (hosted links) ---------- */
  function fixImage(u) {
    u = String(u || '').trim(); if (!u || !/^https?:/i.test(u)) return u;
    var m = u.match(/drive\.google\.com\/file\/d\/([^/?#]+)/) || u.match(/drive\.google\.com\/open\?id=([^&]+)/) || u.match(/drive\.google\.com\/uc\?[^#]*id=([^&]+)/);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1];
    if (/dropbox\.com/.test(u)) return u.replace(/[?&]dl=0/, '').replace(/(\?|&)raw=1/, '') + (u.indexOf('?') > -1 ? '&raw=1' : '?raw=1');
    return u;
  }
  function fixDownload(u) {
    u = String(u || '').trim(); if (!u) return u;
    var m = u.match(/drive\.google\.com\/file\/d\/([^/?#]+)/) || u.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (m) return 'https://drive.google.com/uc?export=download&id=' + m[1];
    if (/dropbox\.com/.test(u)) return u.replace(/dl=0/, 'dl=1');
    return u;
  }
  function ytId(u) { var m = String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : null; }
  var FIX = { image: fixImage, dl: fixDownload };

  /* ---------- schema ---------- */
  var F = {
    order: { k: 'order', l: 'ক্রম নম্বর (ছোট নম্বর আগে দেখাবে)', t: 'number' },
    active: { k: 'active', l: 'সাইটে দেখাবে', t: 'check' }
  };
  var COLL = {
    tools: { label: 'টুলস', icon: '🧰', main: 'name', sub: 'desc', img: 'icon', fields: [
      { k: 'name', l: 'টুলের নাম', t: 'text', req: 1 },
      { k: 'desc', l: 'ছোট বিবরণ', t: 'text' },
      { k: 'icon', l: 'আইকন', t: 'image', h: 'ইমোজি লিখুন (যেমন 🎬) অথবা ছবির hosted link দিন' },
      { k: 'link', l: 'ক্লিক লিংক (ঐচ্ছিক)', t: 'url' }, F.order, F.active] },
    plans: { label: 'প্ল্যান / প্রাইস', icon: '💳', main: 'name', sub: 'tagline', img: 'image', fields: [
      { k: 'name', l: 'প্ল্যানের নাম', t: 'text', req: 1 },
      { k: 'tagline', l: 'ট্যাগলাইন', t: 'text' },
      { k: 'price', l: 'মাসিক দাম', t: 'number', req: 1 },
      { k: 'yearlyPrice', l: 'বাৎসরিক দাম (ফাঁকা রাখলে ২২% ছাড়ে অটো হবে)', t: 'number' },
      { k: 'period', l: 'সময়কাল লেখা', t: 'text', ph: 'month' },
      { k: 'badge', l: 'ব্যাজ (যেমন Most Popular)', t: 'text' },
      { k: 'features', l: 'ফিচার লিস্ট (প্রতি লাইনে একটা)', t: 'area' },
      { k: 'deviceNote', l: 'ডিভাইস নোট', t: 'text', ph: '4 Devices' },
      { k: 'buyLink', l: 'Buy Now লিংক (WhatsApp / পেমেন্ট পেজ)', t: 'url' },
      { k: 'image', l: 'প্ল্যান ছবি (hosted link, ঐচ্ছিক)', t: 'image' }, F.order, F.active] },
    videos: { label: 'ভিডিও টিউটোরিয়াল', icon: '🎬', main: 'title', sub: 'group', img: 'thumb', fields: [
      { k: 'title', l: 'ভিডিওর নাম', t: 'text', req: 1 },
      { k: 'group', l: 'গ্রুপ / ক্যাটাগরি', t: 'text' },
      { k: 'url', l: 'ভিডিও hosted link', t: 'video', req: 1, h: 'YouTube, Vimeo, Google Drive বা সরাসরি .mp4 লিংক - সব চলবে' },
      { k: 'thumb', l: 'থাম্বনেইল hosted link (YouTube হলে ফাঁকা রাখলেও চলবে)', t: 'image' },
      { k: 'duration', l: 'সময়', t: 'text', ph: '12:30' },
      { k: 'desc', l: 'বিবরণ', t: 'area' }, F.order, F.active] },
    downloads: { label: 'ডাউনলোড', icon: '⬇️', main: 'title', sub: 'desc', img: 'image', fields: [
      { k: 'title', l: 'ফাইলের নাম', t: 'text', req: 1 },
      { k: 'desc', l: 'বিবরণ', t: 'text' },
      { k: 'link', l: 'ডাউনলোড hosted link', t: 'dl', req: 1, h: 'Google Drive / Dropbox / MediaFire / যেকোনো সরাসরি লিংক। Drive লিংক অটো ডাউনলোড লিংকে বদলে যাবে' },
      { k: 'version', l: 'ভার্সন', t: 'text', ph: '1.0.0' },
      { k: 'size', l: 'সাইজ', t: 'text', ph: '70 MB' },
      { k: 'image', l: 'আইকন / ছবি hosted link (ঐচ্ছিক)', t: 'image' }, F.order, F.active] },
    assets: { label: 'অ্যানিমেশন অ্যাসেট', icon: '🎞️', main: 'title', sub: 'desc', img: 'image', fields: [
      { k: 'title', l: 'অ্যাসেটের নাম', t: 'text', req: 1 },
      { k: 'desc', l: 'বিবরণ', t: 'text' },
      { k: 'image', l: 'কভার ছবি hosted link', t: 'image' },
      { k: 'link', l: 'ডাউনলোড / ডিটেইল লিংক', t: 'dl' }, F.order, F.active] },
    posts: { label: 'ব্লগ পোস্ট', icon: '📰', main: 'title', sub: 'excerpt', img: 'image', fields: [
      { k: 'title', l: 'শিরোনাম', t: 'text', req: 1 },
      { k: 'category', l: 'ক্যাটাগরি', t: 'text', ph: 'Blog' },
      { k: 'date', l: 'তারিখ', t: 'date' },
      { k: 'excerpt', l: 'সংক্ষিপ্ত লেখা', t: 'area' },
      { k: 'image', l: 'কভার ছবি hosted link', t: 'image' },
      { k: 'link', l: 'Read More লিংক', t: 'url' }, F.order, F.active] }
  };

  var SETTINGS = [
    { title: 'ব্র্যান্ড', fields: [
      { k: 'siteName', l: 'সাইটের নাম', t: 'text' },
      { k: 'logoUrl', l: 'লোগো hosted link (ফাঁকা থাকলে নাম লেখা দেখাবে)', t: 'image' },
      { k: 'noticeText', l: 'উপরের নোটিশ বার (ফাঁকা = লুকানো)', t: 'text' }] },
    { title: 'হিরো সেকশন', fields: [
      { k: 'heroTitle', l: 'হেডলাইন', t: 'text' },
      { k: 'heroSub', l: 'সাব টেক্সট', t: 'area' },
      { k: 'heroImage', l: 'ব্যাকগ্রাউন্ড ছবি hosted link', t: 'image' },
      { k: 'heroBadge1', l: 'ব্যাজ ১', t: 'text' }, { k: 'heroBadge2', l: 'ব্যাজ ২', t: 'text' },
      { k: 'heroBtnText', l: 'বাটন লেখা', t: 'text' }, { k: 'heroBtnLink', l: 'বাটন লিংক', t: 'url' }] },
    { title: 'ট্রাস্ট স্ট্রিপ (৪টি)', fields: [
      { k: 'trust1', l: 'আইটেম ১', t: 'text' }, { k: 'trust2', l: 'আইটেম ২', t: 'text' },
      { k: 'trust3', l: 'আইটেম ৩', t: 'text' }, { k: 'trust4', l: 'আইটেম ৪', t: 'text' }] },
    { title: 'সেকশনের শিরোনাম', fields: [
      { k: 'toolsTitle', l: 'টুলস শিরোনাম', t: 'text' }, { k: 'toolsSub', l: 'টুলস সাব টেক্সট', t: 'text' },
      { k: 'plansTitle', l: 'প্ল্যান শিরোনাম', t: 'text' }, { k: 'plansSub', l: 'প্ল্যান সাব টেক্সট', t: 'text' },
      { k: 'learnTitle', l: 'ভিডিও শিরোনাম', t: 'text' }, { k: 'learnSub', l: 'ভিডিও সাব টেক্সট', t: 'text' },
      { k: 'downloadsTitle', l: 'ডাউনলোড শিরোনাম', t: 'text' }, { k: 'downloadsSub', l: 'ডাউনলোড সাব টেক্সট', t: 'text' },
      { k: 'assetsTitle', l: 'অ্যাসেট শিরোনাম', t: 'text' }, { k: 'assetsSub', l: 'অ্যাসেট সাব টেক্সট', t: 'text' },
      { k: 'blogTitle', l: 'ব্লগ শিরোনাম', t: 'text' }, { k: 'blogSub', l: 'ব্লগ সাব টেক্সট', t: 'text' }] },
    { title: 'মেইন প্লাগিন ডাউনলোড বক্স', fields: [
      { k: 'pluginTag', l: 'ছোট ট্যাগ', t: 'text' }, { k: 'pluginTitle', l: 'প্লাগিনের নাম (ফাঁকা = পুরো বক্স লুকানো)', t: 'text' },
      { k: 'pluginSub', l: 'সাব হেডিং', t: 'text' }, { k: 'pluginDesc', l: 'বিবরণ', t: 'area' },
      { k: 'pluginBtn', l: 'বাটন লেখা', t: 'text' }, { k: 'pluginLink', l: 'ডাউনলোড hosted link', t: 'dl' },
      { k: 'pluginVersion', l: 'ভার্সন', t: 'text' }, { k: 'pluginSize', l: 'সাইজ', t: 'text' }] },
    { title: 'ফুটার, স্ট্যাটস ও সোশ্যাল', fields: [
      { k: 'footerText', l: 'ফুটার টেক্সট', t: 'area' }, { k: 'copyright', l: 'কপিরাইট লেখা', t: 'text' },
      { k: 'currency', l: 'মুদ্রার চিহ্ন', t: 'text' },
      { k: 'stat1v', l: 'স্ট্যাট ১ সংখ্যা', t: 'text' }, { k: 'stat1l', l: 'স্ট্যাট ১ লেখা', t: 'text' },
      { k: 'stat2v', l: 'স্ট্যাট ২ সংখ্যা', t: 'text' }, { k: 'stat2l', l: 'স্ট্যাট ২ লেখা', t: 'text' },
      { k: 'stat3v', l: 'স্ট্যাট ৩ সংখ্যা', t: 'text' }, { k: 'stat3l', l: 'স্ট্যাট ৩ লেখা', t: 'text' },
      { k: 'stat4v', l: 'স্ট্যাট ৪ সংখ্যা', t: 'text' }, { k: 'stat4l', l: 'স্ট্যাট ৪ লেখা', t: 'text' },
      { k: 'whatsapp', l: 'WhatsApp নম্বর (দেশ কোডসহ, যেমন 91XXXXXXXXXX)', t: 'text' },
      { k: 'telegram', l: 'Telegram লিংক', t: 'url' }, { k: 'facebook', l: 'Facebook লিংক', t: 'url' },
      { k: 'youtube', l: 'YouTube লিংক', t: 'url' }, { k: 'instagram', l: 'Instagram লিংক', t: 'url' },
      { k: 'email', l: 'ইমেইল', t: 'text' }] }
  ];

  var TABS = [{ id: 'dash', label: 'ড্যাশবোর্ড', icon: '📊' }, { id: 'settings', label: 'সাইট সেটিংস', icon: '⚙️' }]
    .concat(Object.keys(COLL).map(function (k) { return { id: k, label: COLL[k].label, icon: COLL[k].icon }; }))
    .concat([{ id: 'subs', label: 'সাবস্ক্রাইবার', icon: '✉️' }]);

  /* ---------- state ---------- */
  var DATA = { settings: {}, subscribers: {}, counts: {} };
  Object.keys(COLL).forEach(function (k) { DATA[k] = {}; });
  var tab = 'dash';

  /* ---------- auth ---------- */
  $('#loginBtn').addEventListener('click', function () {
    $('#lerr').classList.add('hide');
    auth.signInWithEmailAndPassword($('#em').value.trim(), $('#pw').value).catch(function (e) {
      var l = $('#lerr'); l.textContent = 'লগইন হয়নি: ' + e.message; l.classList.remove('hide');
    });
  });
  $('#pw').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#loginBtn').click(); });
  $('#resetBtn').addEventListener('click', function () {
    var em = $('#em').value.trim(); if (!em) return toast('আগে ইমেইল লিখুন');
    auth.sendPasswordResetEmail(em).then(function () { toast('রিসেট লিংক ইমেইলে পাঠানো হয়েছে'); }).catch(function (e) { toast(e.message); });
  });
  function logout() { auth.signOut(); }
  $('#logout').addEventListener('click', logout);
  $('#outBtn').addEventListener('click', logout);

  var started = false;
  auth.onAuthStateChanged(function (u) {
    if (!u) { $('#login').classList.remove('hide'); $('#app').classList.add('hide'); $('#notAdmin').classList.add('hide'); started = false; return; }
    db.ref('admins/' + u.uid).once('value').then(function (s) {
      if (s.val() === true) {
        $('#login').classList.add('hide'); $('#app').classList.remove('hide');
        if (!started) { started = true; boot(); }
      } else {
        $('#login').classList.remove('hide'); $('#app').classList.add('hide');
        $('#notAdmin').classList.remove('hide'); $('#uidBox').textContent = 'UID: ' + u.uid;
      }
    }).catch(function () {
      $('#login').classList.remove('hide'); $('#notAdmin').classList.remove('hide'); $('#uidBox').textContent = 'UID: ' + u.uid;
    });
  });

  /* ---------- boot ---------- */
  function boot() {
    $('#nav').innerHTML = TABS.map(function (t) { return '<button data-t="' + t.id + '">' + t.icon + ' ' + t.label + '</button>'; }).join('');
    $('#nav').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; go(b.getAttribute('data-t')); $('#side').classList.remove('on');
    });
    $('#menuBtn').addEventListener('click', function () { $('#side').classList.toggle('on'); });
    ['settings', 'subscribers', 'counts'].concat(Object.keys(COLL)).forEach(function (k) {
      db.ref(k).on('value', function (s) { DATA[k] = s.val() || {}; render(); });
    });
    go('dash');
  }
  function go(t) {
    tab = t;
    Array.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
    render();
  }

  function render() {
    var meta = TABS.filter(function (t) { return t.id === tab; })[0];
    $('#title').textContent = meta.icon + ' ' + meta.label;
    $('#barBtns').innerHTML = '';
    if (tab === 'dash') return renderDash();
    if (tab === 'settings') return renderSettings();
    if (tab === 'subs') return renderSubs();
    renderList(tab);
  }

  /* ---------- dashboard ---------- */
  function renderDash() {
    var cnt = function (o) { return Object.keys(o || {}).length; };
    var totalDl = Object.keys(DATA.counts).reduce(function (a, k) { return a + (Number(DATA.counts[k]) || 0); }, 0);
    var h = '<div class="grid">' + Object.keys(COLL).map(function (k) {
      return '<div class="stat"><b>' + cnt(DATA[k]) + '</b><small>' + COLL[k].icon + ' ' + COLL[k].label + '</small></div>';
    }).join('') + '<div class="stat"><b>' + cnt(DATA.subscribers) + '</b><small>✉️ সাবস্ক্রাইবার</small></div>' +
      '<div class="stat"><b>' + totalDl.toLocaleString() + '</b><small>মোট ডাউনলোড ক্লিক</small></div></div>';

    var dl = Object.keys(DATA.downloads).map(function (id) { return { t: DATA.downloads[id].title, n: DATA.counts[id] || 0 }; })
      .sort(function (a, b) { return b.n - a.n; });
    h += '<div class="panel" style="margin-top:18px"><h3>ডাউনলোড কাউন্ট</h3>' + (dl.length ?
      '<table><tr><th>ফাইল</th><th>ক্লিক</th></tr>' + dl.map(function (d) { return '<tr><td>' + esc(d.t) + '</td><td>' + d.n + '</td></tr>'; }).join('') + '</table>'
      : '<p style="color:var(--mut);font-size:13px;margin-top:8px">এখনো কোনো ডাউনলোড আইটেম নেই।</p>') + '</div>';

    h += '<div class="panel"><h3>শুরু করার জন্য</h3><p style="color:var(--mut);font-size:13px;margin:6px 0 12px">খালি ডাটাবেসে স্যাম্পল কনটেন্ট বসিয়ে দেখতে চাইলে নিচের বাটন চাপুন। যে সেকশনে আগে থেকে ডেটা আছে সেটা বদলাবে না।</p>' +
      '<button class="btn" id="seed">Demo ডেটা লোড করুন</button></div>';
    $('#content').innerHTML = h;
    $('#seed').addEventListener('click', seed);
  }
  function seed() {
    var ups = {};
    if (!Object.keys(DATA.settings).length) Object.keys(DEMO.settings).forEach(function (k) { ups['settings/' + k] = DEMO.settings[k]; });
    Object.keys(COLL).forEach(function (c) {
      if (Object.keys(DATA[c]).length) return;
      DEMO[c].forEach(function (o) { ups[c + '/' + db.ref(c).push().key] = o; });
    });
    if (!Object.keys(ups).length) return toast('সব সেকশনে আগে থেকেই ডেটা আছে');
    db.ref().update(ups).then(function () { toast('Demo ডেটা লোড হয়েছে'); }).catch(function (e) { toast(e.message); });
  }

  /* ---------- list view ---------- */
  function renderList(c) {
    var cfg = COLL[c], items = Object.keys(DATA[c]).map(function (id) { var o = DATA[c][id]; o.id = id; return o; })
      .sort(function (a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
    $('#barBtns').innerHTML = '<button class="btn" id="addBtn">+ নতুন যোগ করুন</button>';
    $('#addBtn').addEventListener('click', function () { openForm(c, null); });
    var vh = c === 'videos' || c === 'downloads' || c === 'assets' || c === 'tools' || c === 'plans' || c === 'posts';
    $('#content').innerHTML = (vh ? '<div class="hint">ছবি, ভিডিও বা ডাউনলোডের জন্য শুধু <b>hosted link</b> পেস্ট করুন (YouTube, Google Drive, Dropbox, ImgBB, Cloudinary ইত্যাদি)। ফাইল সার্ভারে আপলোড করতে হবে না।</div>' : '') +
      (items.length ? items.map(function (o) {
        var im = o[cfg.img] || '', thumb = cfg.img === 'thumb' && !im && ytId(o.url) ? 'https://img.youtube.com/vi/' + ytId(o.url) + '/hqdefault.jpg' : im;
        var th = /^(https?:)?\/\//.test(thumb) ? '<img src="' + esc(thumb) + '" alt="">' : esc(thumb || cfg.icon);
        var extra = c === 'downloads' ? ' · ' + (DATA.counts[o.id] || 0) + ' ক্লিক' : '';
        return '<div class="item' + (o.active === false ? ' off' : '') + '"><div class="th">' + th + '</div>' +
          '<div class="tx"><b>' + esc(o[cfg.main]) + (o.active === false ? '<span class="badge">লুকানো</span>' : '') + '</b><small>' + esc(o[cfg.sub]) + extra + '</small></div>' +
          '<div class="ac"><button class="btn s g" data-a="tg" data-id="' + o.id + '">' + (o.active === false ? 'দেখাও' : 'লুকাও') + '</button>' +
          '<button class="btn s ok" data-a="ed" data-id="' + o.id + '">এডিট</button>' +
          '<button class="btn s r" data-a="del" data-id="' + o.id + '">ডিলিট</button></div></div>';
      }).join('') : '<div class="panel" style="text-align:center;color:var(--mut)">এখনো কিছু নেই। "+ নতুন যোগ করুন" চাপুন।</div>');
    Array.prototype.forEach.call(document.querySelectorAll('#content [data-a]'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id'), a = b.getAttribute('data-a');
        if (a === 'ed') openForm(c, id);
        else if (a === 'tg') db.ref(c + '/' + id + '/active').set(DATA[c][id].active === false);
        else if (a === 'del' && confirm('সত্যিই ডিলিট করবেন? এটা ফেরানো যাবে না।')) {
          var rm = {}; rm[c + '/' + id] = null; if (c === 'downloads') rm['counts/' + id] = null;
          db.ref().update(rm).then(function () { toast('ডিলিট হয়েছে'); });
        }
      });
    });
  }

  /* ---------- form builder ---------- */
  function fieldHtml(f, v) {
    var id = 'f_' + f.k, val = v == null ? '' : v;
    var h = '';
    if (f.t === 'check') return '<label class="chk"><input type="checkbox" id="' + id + '"' + (v === false ? '' : ' checked') + '> ' + f.l + '</label>';
    h += '<label>' + f.l + (f.req ? ' *' : '') + (f.h ? '<br><small>' + f.h + '</small>' : '') + '</label>';
    if (f.t === 'area') h += '<textarea id="' + id + '" placeholder="' + esc(f.ph || '') + '">' + esc(val) + '</textarea>';
    else h += '<input id="' + id + '" type="' + (f.t === 'number' ? 'number' : f.t === 'date' ? 'date' : 'text') + '" value="' + esc(val) + '" placeholder="' + esc(f.ph || (f.t === 'url' || f.t === 'dl' || f.t === 'image' || f.t === 'video' ? 'https://...' : '')) + '">';
    if (f.t === 'image' || f.t === 'video') h += '<img class="pv" id="pv_' + f.k + '" alt="">';
    return h;
  }
  function bindPreview(f) {
    var inp = $('#f_' + f.k), pv = $('#pv_' + f.k); if (!pv) return;
    var up = function () {
      var u = inp.value.trim(), src = '';
      if (f.t === 'video') { var y = ytId(u); src = y ? 'https://img.youtube.com/vi/' + y + '/hqdefault.jpg' : ''; }
      else src = /^https?:/i.test(u) ? fixImage(u) : '';
      if (src) { pv.src = src; pv.style.display = 'block'; pv.onerror = function () { pv.style.display = 'none'; }; } else pv.style.display = 'none';
    };
    inp.addEventListener('input', up); up();
  }
  var current = null;
  function openModal(title, fields, data, onSave) {
    $('#mTitle').textContent = title;
    $('#mBody').innerHTML = '<div class="cols">' + fields.map(function (f) {
      var wide = f.t === 'area' || f.k === 'features' || f.t === 'check';
      return '<div' + (wide ? ' style="grid-column:1/-1"' : '') + '>' + fieldHtml(f, data[f.k]) + '</div>';
    }).join('') + '</div>';
    fields.forEach(bindPreview);
    current = { fields: fields, onSave: onSave };
    $('#modal').classList.add('on');
  }
  function collect(fields) {
    var out = {};
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i], el = $('#f_' + f.k), v;
      if (f.t === 'check') v = el.checked;
      else {
        v = el.value.trim();
        if (f.req && !v) { toast('"' + f.l + '" দিতে হবে'); el.focus(); return null; }
        if (f.t === 'number') v = v === '' ? null : Number(v);
        else if (FIX[f.t]) v = FIX[f.t](v);
      }
      out[f.k] = v;
    }
    return out;
  }
  $('#mCancel').addEventListener('click', function () { $('#modal').classList.remove('on'); });
  $('#mSave').addEventListener('click', function () {
    if (!current) return;
    var d = collect(current.fields); if (!d) return;
    current.onSave(d);
  });

  function openForm(c, id) {
    var cfg = COLL[c], data = id ? DATA[c][id] : { active: true, order: Object.keys(DATA[c]).length + 1, date: new Date().toISOString().slice(0, 10) };
    openModal((id ? 'এডিট: ' : 'নতুন: ') + cfg.label, cfg.fields, data, function (d) {
      var key = id || db.ref(c).push().key;
      Object.keys(d).forEach(function (k) { if (d[k] === null) d[k] = null; });
      db.ref(c + '/' + key).update(d).then(function () { $('#modal').classList.remove('on'); toast('সেভ হয়েছে ✔'); }).catch(function (e) { toast(e.message); });
    });
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    var h = '<div class="hint">এখানে বদলালে পাবলিক সাইটে সাথে সাথে লাইভ আপডেট হবে। সব ছবির জন্য hosted link দিন।</div>';
    SETTINGS.forEach(function (g, gi) {
      h += '<div class="panel"><h3>' + g.title + '</h3><div class="cols">' + g.fields.map(function (f) {
        var wide = f.t === 'area';
        var v = DATA.settings[f.k] != null ? DATA.settings[f.k] : '';
        return '<div' + (wide ? ' style="grid-column:1/-1"' : '') + '>' + fieldHtml(f, v) + '</div>';
      }).join('') + '</div></div>';
    });
    h += '<button class="btn" id="saveSet">সব সেটিংস সেভ করুন</button>';
    $('#content').innerHTML = h;
    SETTINGS.forEach(function (g) { g.fields.forEach(bindPreview); });
    $('#saveSet').addEventListener('click', function () {
      var all = [].concat.apply([], SETTINGS.map(function (g) { return g.fields; }));
      var d = collect(all); if (!d) return;
      db.ref('settings').update(d).then(function () { toast('সেটিংস সেভ হয়েছে ✔'); }).catch(function (e) { toast(e.message); });
    });
  }

  /* ---------- subscribers ---------- */
  function renderSubs() {
    var list = Object.keys(DATA.subscribers).map(function (id) { return { id: id, e: DATA.subscribers[id].email, at: DATA.subscribers[id].at }; })
      .sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    $('#barBtns').innerHTML = '<button class="btn g" id="copyAll">সব ইমেইল কপি</button>';
    $('#copyAll').addEventListener('click', function () {
      var t = list.map(function (x) { return x.e; }).join('\n');
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('কপি হয়েছে'); }).catch(function () { toast('কপি করা গেল না'); });
    });
    $('#content').innerHTML = list.length ? '<div class="panel"><table><tr><th>ইমেইল</th><th>তারিখ</th><th></th></tr>' + list.map(function (x) {
      return '<tr><td>' + esc(x.e) + '</td><td>' + (x.at ? new Date(x.at).toLocaleDateString() : '') + '</td><td><button class="btn s r" data-id="' + x.id + '">ডিলিট</button></td></tr>';
    }).join('') + '</table></div>' : '<div class="panel" style="text-align:center;color:var(--mut)">এখনো কেউ সাবস্ক্রাইব করেনি।</div>';
    Array.prototype.forEach.call(document.querySelectorAll('#content [data-id]'), function (b) {
      b.addEventListener('click', function () { if (confirm('ডিলিট করবেন?')) db.ref('subscribers/' + b.getAttribute('data-id')).remove(); });
    });
  }
})();
