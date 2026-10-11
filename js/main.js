(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  // track.js listens for these; nothing happens if it isn't loaded
  const emit = (type, detail = {}) => document.dispatchEvent(new CustomEvent('oms', { detail: { type, ...detail } }));

  /* ── data: everything here comes from the collective's public pages ── */
  const ROSTER = [
    { name: 'Ama', img: ['ama'], ig: 'amprettyama', tt: 'ewura_amapratt', yt: 'theprettyama' },
    { name: 'Ariana', img: ['ariana'], ig: 'bassey.ariana', tt: 'hajiahberry1', yt: 'ArianaBassey', note: 'Available for music and product promotions.' },
    { name: 'Angie', img: ['angie'], ig: 'nhaar_momo22', yt: 'yourlittlemomo' },
    { name: 'Evita', img: ['evita'], ig: 'ev_babie_', yt: 'ev_babie' },
    { name: 'Degold', img: ['degold-2', 'degold'], ig: 'eno.degold', tt: 'eno.degold', yt: 'only.degold' },
    { name: 'Zandi', img: ['zandi-2', 'zandi'], ig: 'zandimnyatheli', tt: 'zandi.mnyatheli', yt: 'zandimnyatheli' },
    { name: 'Siyanna', img: ['siyanna'], ig: 'realsiyanna', yt: 'realsiyanna' },
    { name: 'Nana Akua', img: ['nana-akua', 'nana-akua-2'], ig: '__nanaakua._', tt: 'prettydiva122' },
  ];

  const VIDEOS = [
    { id: 'AflPW7SKcjQ', title: 'Thrift Closet Update with Evita', views: '211K', len: '2:30', tag: 'haul' },
    { id: 'QoRtjKxqhuM', title: 'Closet Update: My New Favorites', views: '158K', len: '1:58', tag: 'haul' },
    { id: '9SwSCvu4Z7k', title: 'We Tried On Every Mr Price Bodysuit', views: '145K', len: '2:59', tag: 'haul' },
    { id: '9yAe_9bxVZ4', title: 'Summer Bikini Haul, Sea Point, Cape Town', views: '137K', len: '1:49', tag: 'swim' },
    { id: 'MUKXBk4qbmA', title: 'Church Dress Try-On Haul', views: '129K', len: '3:27', tag: 'haul' },
    { id: 'fvNY4BYeIO8', title: 'These Outfits Hit Different: A Styling Lookbook', views: '119K', len: '3:29', tag: 'haul' },
    { id: 'VtNbFqzGhxM', title: 'Models vs Twister', views: '75K', len: '16:13', tag: 'game' },
    { id: 'ieIY7UqQHCQ', title: 'The Cutest Beachwear Outfits of the Season', views: '72K', len: '2:02', tag: 'swim' },
    { id: 'ylYbHYYXv14', title: '3 Models Styled the Same $20 Outfit', views: '62K', len: '4:56', tag: 'game' },
    { id: '194-54OKlK0', title: 'Only Models Game Show: Behind the Scenes', views: '61K', len: '10:34', tag: 'bts' },
    { id: 'JmHC-luYHnk', title: 'Content Week with Only Models', views: '60K', len: '6:52', tag: 'bts' },
    { id: 'nCTH_iSR5HU', title: 'The Only Glute Workout Models Use', views: '16K', len: '2:46', tag: 'fit' },
  ];

  const pad = (n) => String(n).padStart(2, '0');
  const src = (f) => `assets/img/roster/${f}.jpg`;

  /* ── loader ── */
  const loader = $('#loader');
  const loaderCount = $('#loaderCount');
  let isReady = false;
  const ready = () => {
    if (isReady) return;
    isReady = true;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
    countUp();
  };
  if (reduced) { loaderCount.textContent = '100'; ready(); }
  else {
    const t0 = performance.now(), dur = 1700;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      loaderCount.textContent = Math.round(100 * (1 - Math.pow(1 - p, 3)));
      p < 1 ? requestAnimationFrame(tick) : setTimeout(ready, 180);
    };
    requestAnimationFrame(tick);
    setTimeout(ready, 4500); // rAF is paused in background tabs; never trap the page behind the loader
  }

  function countUp() {
    $$('[data-count]').forEach((el) => {
      const to = +el.dataset.count, suffix = el.dataset.suffix || '', width = +el.dataset.pad || 0;
      const fmt = (v) => String(v).padStart(width, '0') + suffix;
      if (reduced) { el.textContent = fmt(to); return; }
      const t0 = performance.now() + 700, dur = 1500;
      el.textContent = fmt(0);
      const tick = (t) => {
        const p = Math.max(0, Math.min(1, (t - t0) / dur));
        el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ── nav ── */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), askBtn = $('#askBtn');
  let lastY = 0;
  const onScrollNav = () => {
    const y = scrollY;
    nav.classList.toggle('is-stuck', y > 40);
    nav.classList.toggle('is-hidden', y > 600 && y > lastY && menu.hidden);
    askBtn.classList.toggle('is-in', y > innerHeight * .6);
    lastY = y;
  };
  const setMenu = (open) => {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
  };
  burger.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ── scroll reveals ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  const observeReveals = (root = document) => $$('.reveal', root).forEach((el) => io.observe(el));

  /* ── manifesto: words light up as you read down ── */
  const manifesto = $('#manifesto');
  const splitWords = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) { frag.append(part); return; }
          const s = document.createElement('span');
          s.className = 'w'; s.textContent = part; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n);
    });
  };
  splitWords(manifesto);
  const words = $$('.w', manifesto);
  const lightWords = () => {
    const r = manifesto.getBoundingClientRect(), vh = innerHeight;
    const p = Math.max(0, Math.min(1, (vh * .86 - r.top) / (r.height + vh * .34)));
    const upto = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < upto));
  };

  /* ── parallax on framed images ── */
  const frames = $$('[data-parallax]').map((el) => ({ el, img: $('img', el), k: +el.dataset.parallax }));
  const parallax = () => {
    if (reduced) return;
    const vh = innerHeight;
    frames.forEach(({ el, img, k }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const off = (r.top + r.height / 2 - vh / 2) * k;
      img.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0) scale(1.16)`;
    });
  };

  let ticking = false;
  let extras = () => {};
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScrollNav(); lightWords(); parallax(); extras(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', () => { lightWords(); parallax(); extras(); });
  onScrollNav(); lightWords(); parallax();

  /* ── roster ── */
  const list = $('#rosterList'), frame = $('#rosterFrame');
  const rIdx = $('#rosterIdx'), rHandle = $('#rosterHandle');
  ROSTER.forEach((c, i) => {
    const li = document.createElement('li');
    li.className = 'roster__item';
    li.innerHTML = `<button class="roster__btn" type="button" data-i="${i}" aria-label="Open ${c.name}'s profile">
      <span class="n">${pad(i + 1)}</span>
      <span class="name">${c.name}</span>
      <span class="meta"><span class="h">@${c.ig}</span>${icon('i-arrow')}<img class="thumb" src="${src(c.img[0])}" alt="" loading="lazy"></span>
    </button>`;
    list.append(li);
    const img = new Image();
    img.src = src(c.img[0]); img.alt = ''; img.dataset.i = i; img.loading = i ? 'lazy' : 'eager';
    if (!i) img.className = 'is-on';
    frame.append(img);
  });
  let current = 0;
  const stage = (i) => {
    if (i === current) return;
    const imgs = $$('img', frame);
    imgs.forEach((im) => im.classList.remove('is-prev'));
    imgs[current].classList.replace('is-on', 'is-prev');
    imgs[i].classList.add('is-on');
    current = i;
    rIdx.textContent = pad(i + 1);
    rHandle.textContent = '@' + ROSTER[i].ig;
  };
  list.addEventListener('pointerover', (e) => { const b = e.target.closest('.roster__btn'); if (b) stage(+b.dataset.i); });
  list.addEventListener('focusin', (e) => { const b = e.target.closest('.roster__btn'); if (b) stage(+b.dataset.i); });
  list.addEventListener('click', (e) => { const b = e.target.closest('.roster__btn'); if (b) openDrawer(+b.dataset.i, b); });

  /* ── overlays (drawer + lightbox) ── */
  let lastFocus = null, openOverlay = null;
  const show = (el, opener) => {
    lastFocus = opener || document.activeElement;
    openOverlay = el; el.hidden = false;
    document.body.classList.add('is-locked');
    $('[data-close]:not(div)', el).focus();
  };
  const hide = () => {
    if (!openOverlay) return;
    openOverlay.hidden = true;
    if (openOverlay.id === 'lightbox') $('#lightboxFrame').innerHTML = '';
    openOverlay = null;
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) hide(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (openOverlay) hide(); else if (!menu.hidden) setMenu(false); else if (!askPanel.hidden) setAsk(false);
  });

  const drawer = $('#drawer');
  let drawerCreator = null;
  function openDrawer(i, opener) {
    const c = ROSTER[i];
    drawerCreator = c.name;
    $('#drawerIdx').textContent = `Creator ${pad(i + 1)} / ${pad(ROSTER.length)}`;
    $('#drawerName').textContent = c.name;
    const platforms = [c.ig && 'Instagram', c.tt && 'TikTok', c.yt && 'YouTube'].filter(Boolean);
    const where = platforms.length > 1 ? platforms.slice(0, -1).join(', ') + ' and ' + platforms.at(-1) : platforms[0];
    $('#drawerNote').textContent = `${c.note ? c.note + ' ' : ''}Part of the Only Models collective. Find ${c.name} on ${where}.`;
    const media = $('#drawerMedia');
    media.className = 'drawer__media' + (c.img.length > 1 ? ' has-2' : '');
    media.innerHTML = c.img.map((f) => `<img src="${src(f)}" alt="${c.name}, Only Models creator">`).join('');
    media.scrollLeft = 0;
    $('#drawerLinks').innerHTML = [
      c.ig && `<li><a href="https://www.instagram.com/${c.ig}/" target="_blank" rel="noopener">${icon('i-ig')}@${c.ig}</a></li>`,
      c.tt && `<li><a href="https://www.tiktok.com/@${c.tt}" target="_blank" rel="noopener">${icon('i-tt')}@${c.tt}</a></li>`,
      c.yt && `<li><a href="https://www.youtube.com/@${c.yt}" target="_blank" rel="noopener">${icon('i-yt')}@${c.yt}</a></li>`,
    ].filter(Boolean).join('');
    $('.drawer__panel', drawer).scrollTop = 0;
    show(drawer, opener);
  }
  $('#drawerBook').addEventListener('click', () => {
    const name = drawerCreator;
    hide();
    setWho('brand');
    $$('#creatorChips .chip').forEach((ch) => { if (ch.textContent === name) ch.classList.add('is-on'); });
  });

  /* ── work grid + lightbox ── */
  const grid = $('#workGrid');
  grid.innerHTML = VIDEOS.map((v, i) => `
    <button class="vid reveal${i === 0 ? ' vid--lead' : ''}" type="button" data-id="${v.id}" data-tag="${v.tag}" style="--d:${(i % 3) * .07}s" aria-label="Play: ${v.title}">
      <span class="vid__thumb"><img src="assets/img/work/${v.id}.jpg" alt="" loading="lazy" width="960" height="540"><span class="vid__play">${icon('i-play')}${v.len}</span></span>
      <span class="vid__meta"><span class="vid__title">${v.title}</span><span class="vid__views"><b>${v.views}</b> views</span></span>
    </button>`).join('');
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.vid');
    if (!b) return;
    $('#lightboxFrame').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.id}?autoplay=1&rel=0&modestbranding=1" title="${b.getAttribute('aria-label')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    $('#lightboxFrame').style.backgroundImage = `url(assets/img/work/${b.dataset.id}.jpg)`;
    show($('#lightbox'), b);
  });
  $$('.filters .chip').forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    $$('.filters .chip').forEach((c) => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-selected', on); });
    let first = true;
    $$('.vid', grid).forEach((v) => {
      const keep = f === 'all' || v.dataset.tag === f;
      v.classList.toggle('is-out', !keep);
      v.classList.toggle('vid--lead', keep && first && f === 'all');
      if (keep) { first = false; v.classList.add('in'); }
    });
  }));

  /* ── reels: play what's on screen, drag to browse ── */
  const rail = $('#reelsRail');
  const reelIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting && !reduced) v.play().catch(() => {}); else v.pause();
    });
  }, { threshold: .55 });
  $$('video', rail).forEach((v) => reelIO.observe(v));
  let drag = null;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') drag = { x: e.clientX, left: rail.scrollLeft, moved: false }; });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) { drag.moved = true; rail.classList.add('is-drag'); }
    rail.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => { drag = null; rail.classList.remove('is-drag'); });

  /* ── enquiry form ── */
  const form = $('#form'), sent = $('#sent'), note = $('#formNote');
  $('#creatorChips').innerHTML = ROSTER.map((c) => `<button type="button" class="chip">${c.name}</button>`).join('');
  form.addEventListener('click', (e) => {
    const chip = e.target.closest('.chips .chip');
    if (!chip) return;
    const group = chip.closest('.chips');
    if (group.classList.contains('chips--single')) $$('.chip', group).forEach((c) => c !== chip && c.classList.remove('is-on'));
    chip.classList.toggle('is-on');
    chip.setAttribute('aria-pressed', chip.classList.contains('is-on'));
  });
  function setWho(who) {
    form.elements.who.value = who;
    $$('[data-for]', form).forEach((el) => { el.hidden = el.dataset.for !== who; });
    $('#msgLabel').textContent = who === 'brand' ? 'The brief, in a few lines' : 'Tell us about you and your content';
    $('button[type=submit]', form).firstChild.textContent = who === 'brand' ? 'Send enquiry ' : 'Apply to join ';
  }
  $$('input[name=who]', form).forEach((r) => r.addEventListener('change', () => setWho(r.value)));
  $$('a[href="#enquire"]').forEach((a) => a.addEventListener('click', () => {
    if (/creator/i.test(a.textContent)) setWho('creator');
  }));
  const picks = (name) => $$(`.chips[data-name="${name}"] .chip.is-on`, form).map((c) => c.textContent);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name, email = form.elements.email;
    const badName = !name.value.trim(), badEmail = !/^\S+@\S+\.\S+$/.test(email.value.trim());
    name.closest('.field').classList.toggle('is-bad', badName);
    email.closest('.field').classList.toggle('is-bad', badEmail);
    if (badName || badEmail) {
      note.textContent = badName ? 'Add your name so we know who to reply to.' : 'That email doesn’t look right. Check it and try again.';
      (badName ? name : email).focus();
      return;
    }
    note.textContent = '';
    const who = form.elements.who.value, first = name.value.trim().split(/\s+/)[0];
    const bits = [picks('type').join(', '), picks('creators').length && 'with ' + picks('creators').join(', '), picks('budget')[0], picks('timeline')[0]].filter(Boolean);
    $('#sentName').textContent = first + '.';
    $('#sentText').textContent = who === 'brand'
      ? `Your brief${bits.length ? ' (' + bits.join(' · ') + ')' : ''} is with the team. We’ll reply to ${email.value.trim()} with creators, a format and a quote.`
      : `Your application is with the team. If your content fits the collective, we’ll reply to ${email.value.trim()}.`;
    const val = (k) => form.elements[k].value.trim();
    emit('enquiry', who === 'brand'
      ? { who, name: val('name'), email: val('email'), company: val('company'), country: val('country'), campaign: picks('type'), creators: picks('creators'), budget: picks('budget')[0], timeline: picks('timeline')[0], message: val('message') }
      : { who, name: val('name'), email: val('email'), handle: val('handle'), country: val('country'), message: val('message') });
    // with tracking on, the enquiry reaches the site builder as a notification; say so
    $('#sentDemo').textContent = window.omsTrack
      ? 'Demo preview: this enquiry went to the site’s builder, not yet to the Only Models inbox.'
      : 'Demo preview: the form isn’t connected yet, so nothing was sent.';
    form.hidden = true; sent.hidden = false;
    sent.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  });
  $('#sentReset').addEventListener('click', () => {
    form.reset(); $$('.chip.is-on', form).forEach((c) => c.classList.remove('is-on'));
    setWho('brand'); sent.hidden = true; form.hidden = false;
  });

  /* ── assistant: one scripted engine, mounted inline and as the floating panel ── */
  const askPanel = $('#askPanel');
  const NAMES = ROSTER.map((c) => c.name);
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const listNames = (arr) => (arr.length > 1 ? arr.slice(0, -1).join(', ') + ' and ' + arr.at(-1) : arr[0]);
  const formOpts = (name) => $$(`.chips[data-name="${name}"] .chip`, form).map((c) => c.textContent);
  const findCreators = (text) => ROSTER.filter((c) => new RegExp(`\\b${c.name.replace(' ', '\\s*')}\\b`, 'i').test(text)).map((c) => c.name);
  const platformsOf = (c) => listNames([c.ig && 'Instagram', c.tt && 'TikTok', c.yt && 'YouTube'].filter(Boolean));

  const HOME = ['Start a brief', 'Who’s on the roster?', 'What do you make?', 'Rates & media kit', 'Where are you based?', 'I want to join'];
  const BOOK = /\b(book|hire|work with|collab|partner|campaign|brief|sponsor|promot|advertis)/i;
  const FALLBACK = 'That one is outside my script in this demo. The live assistant would answer it from the team’s own notes. For now I can start a brief with you, or point you to the <a href="#enquire" data-jump>enquiry form</a>.';
  const INFO = [
    { k: /are you (a |an )?(bot|ai|real|human|robot)|who are you/i, a: 'I’m the collective’s assistant, and this is a scripted demo. The live version answers from the team’s own rates, dates and FAQs.' },
    { k: /how (do|does|can|to)\b.*\b(book|hire|work|collab)/i, a: 'You send a brief with the campaign type, budget and timeline, and the team replies with creators, a format and a quote. I can put that brief together with you now.', quick: ['Start a brief', 'Rates & media kit'] },
    { k: /^(hi|hey|hello|yo|hiya|good (morning|afternoon|evening))\b/i, a: 'Hey! I can tell you about the roster, what we make and how booking works. Or I can start a brief with you now.' },
    { k: /rate|price|pricing|cost|fee|charge|how much|quote/i, a: 'Rates depend on the format and how many creators are involved, so the team quotes per brief. The <a href="media-kit.html">media kit</a> has the audience numbers.', quick: ['Start a brief', 'What do you make?'] },
    { k: /media ?kit|deck|stats|numbers|followers|reach|audience|views|subscribers/i, a: '392K followers on Instagram and more than 2 million views on YouTube. The full picture is in the <a href="media-kit.html">media kit</a>.', quick: ['Start a brief', 'Who’s on the roster?'] },
    { k: /join|apply|become|sign me|i'?m an? (model|creator)|audition|casting/i, a: 'Love that. Open the <a href="#enquire" data-jump data-who="creator">enquiry form</a>, switch to “I’m a creator” and share your handles.' },
    { k: /roster|who|creators?|models?|talent|girls/i, a: `Eight creators right now: ${listNames(NAMES)}. Type a name to meet one, or <a href="#roster" data-jump>see the roster</a>.`, quick: ['Zandi', 'Ama', 'Nana Akua', 'Start a brief'] },
    { k: /how long|turnaround|lead time|how soon|how fast|deadline/i, a: 'It depends on the format: a place in a haul moves faster than a full content week. Put your date in the brief and the team will confirm it.', quick: ['Start a brief'] },
    { k: /make|content|format|video|haul|shoot|service|offer|what do you do/i, a: 'Try-on hauls, styling lookbooks, game shows, content weeks on location, runway and events, plus short-form for Instagram, TikTok and YouTube. <a href="#work" data-jump>See it on screen</a>.', quick: ['Start a brief', 'Rates & media kit'] },
    { k: /where|based|location|country|city|ghana|south africa|cape town|accra/i, a: 'The collective is out of Ghana and South Africa. Recent shoots were filmed in Cape Town.' },
    { k: /human|person|someone|call|phone|whatsapp|contact|email|speak|talk to/i, a: 'The team replies to every brief by email. Start one with me now, or use the <a href="#enquire" data-jump>enquiry form</a>.', quick: ['Start a brief'] },
    { k: /patreon|exclusive|behind the scenes|bts/i, a: 'Extra behind-the-scenes and uncut videos live on the collective’s <a href="https://patreon.com/weareonlymodels" target="_blank" rel="noopener">Patreon</a>.' },
    { k: /merch|shop|clothing|store/i, a: 'Merch and clothing are on the way. Nothing to buy just yet.' },
    { k: /thank|cheers|great|perfect|awesome|nice/i, a: 'Anytime. Anything else?' },
  ];
  const intent = (text) => INFO.find((x) => x.k.test(text));

  const STEPS = [
    { key: 'type', ask: 'What kind of campaign is it?', opts: () => formOpts('type') },
    { key: 'creators', ask: 'Any creators in mind? Pick one, type a few names, or let us choose.', opts: () => [...NAMES, 'You choose'] },
    { key: 'budget', ask: 'Roughly what budget are you working with, in USD?', opts: () => formOpts('budget') },
    { key: 'timeline', ask: 'When do you need it live?', opts: () => formOpts('timeline') },
    { key: 'name', ask: 'Nearly there. Who should the team reply to?' },
    { key: 'email', ask: (b) => `Thanks, ${esc(b.name.split(/\s+/)[0])}. What’s the best email for the quote?` },
  ];
  const exact = (name, t) => formOpts(name).find((o) => o.toLowerCase() === t.trim().toLowerCase());
  const PARSE = {
    type: (t) => exact('type', t)
      || (/haul|try/i.test(t) && 'Try-on haul') || (/week/i.test(t) && 'Content week') || (/game|challenge|twister/i.test(t) && 'Game show / challenge')
      || (/event|runway|fashion show|launch/i.test(t) && 'Event or runway') || (/music|song|track/i.test(t) && 'Music promo')
      || (/shoot|photo|video/i.test(t) && 'Dedicated shoot') || 'Something else',
    creators: (t) => { const f = findCreators(t); return f.length ? f : ['You choose']; },
    budget: (t) => {
      const o = formOpts('budget'), hit = exact('budget', t);
      if (hit) return hit;
      const m = t.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k)?/i);
      if (!m) return o[4];
      const n = +m[1] * (m[2] ? 1000 : 1);
      return n < 1000 ? o[0] : n < 5000 ? o[1] : n < 15000 ? o[2] : o[3];
    },
    timeline: (t) => {
      const o = formOpts('timeline');
      return exact('timeline', t) || (/asap|now|urgent|immediately|this week/i.test(t) && o[0]) || (/months|quarter/i.test(t) && o[2]) || (/week|month|soon/i.test(t) && o[1]) || o[3];
    },
    name: (t) => t.replace(/^(i'?m|i am|it'?s|my name is|this is)\s+/i, '').trim().slice(0, 60),
    email: (t) => (t.match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [null])[0],
  };

  function createChat(root) {
    const closable = root.hasAttribute('data-closable');
    root.innerHTML = `
      <header class="chat__head">${icon('mark')}<div><b>Only Models assistant</b><small>Scripted demo · replies instantly</small></div>${closable ? `<button type="button" class="chat__close" aria-label="Close chat">${icon('i-close')}</button>` : ''}</header>
      <div class="chat__log" aria-live="polite"></div>
      <div class="chat__quick"></div>
      <form class="chat__form"><input placeholder="Ask about bookings, creators, formats…" aria-label="Your message" autocomplete="off"><button aria-label="Send">${icon('i-arrow')}</button></form>`;
    const log = $('.chat__log', root), quick = $('.chat__quick', root), input = $('input', root);
    const st = { flow: null, brief: {}, queue: Promise.resolve(), touched: false };

    const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
    const add = (html, cls) => {
      const m = document.createElement('div');
      m.className = 'msg ' + cls; m.innerHTML = html;
      log.append(m); log.scrollTop = log.scrollHeight;
      return m;
    };
    const me = (text) => { add('', 'msg--me').textContent = text; };
    const bot = async (html, cls = 'msg--bot') => {
      const t = add('<i></i><i></i><i></i>', 'msg--bot msg--typing');
      await wait(Math.min(1150, 380 + html.replace(/<[^>]+>/g, '').length * 9));
      t.remove();
      return add(html, cls);
    };
    const setQuick = (items = []) => { quick.innerHTML = items.map((q) => `<button type="button" class="chip">${q}</button>`).join(''); log.scrollTop = log.scrollHeight; };

    const nextStep = () => STEPS.find((s) => st.brief[s.key] == null);
    const askStep = async () => {
      const s = nextStep();
      if (!s) return summary();
      await bot(typeof s.ask === 'function' ? s.ask(st.brief) : s.ask);
      setQuick(s.opts ? s.opts() : []);
    };
    const startBrief = async (text) => {
      st.flow = 'brief'; st.brief = {};
      const found = findCreators(text);
      if (found.length) st.brief.creators = found;
      const type = PARSE.type(text);
      if (type !== 'Something else' && type !== 'Dedicated shoot') st.brief.type = type;
      if (/\$\s*\d|\d\s*k\b|budget/i.test(text)) st.brief.budget = PARSE.budget(text.replace(/.*?(?=\$\s*\d|\d[\d,.]*\s*k\b)/i, ''));
      if (/asap|urgent|this month|next month|this week|next week/i.test(text)) st.brief.timeline = PARSE.timeline(text);
      await bot(found.length
        ? `Good pick. I’ve noted ${listNames(found)}. A few quick questions and your brief is ready.`
        : 'Let’s put your brief together. A few quick questions and it’s ready for the team.');
      await askStep();
    };
    const answerStep = async (text) => {
      const s = nextStep();
      if (/^(cancel|stop|never ?mind|exit|quit)\b/i.test(text)) {
        st.flow = null;
        await bot('No problem, I’ve dropped the brief. Ask me anything else.');
        return setQuick(HOME);
      }
      if (/\?\s*$/.test(text)) {
        const hit = intent(text);
        if (hit) { await bot(hit.a); return askStep(); }
      }
      const v = PARSE[s.key](text);
      if (!v) {
        await bot(s.key === 'email' ? 'That doesn’t look like an email address. Could you type it again?' : 'Sorry, I missed that. Could you type it again?');
        return setQuick(s.opts ? s.opts() : []);
      }
      st.brief[s.key] = v;
      await askStep();
    };
    const summary = async () => {
      const b = st.brief;
      st.flow = 'done';
      // contact details stay in the chat; they are only sent if the visitor submits the form
      emit('brief', { campaign: b.type, creators: b.creators, budget: b.budget, timeline: b.timeline });
      await bot('Here’s your brief:');
      add(`<h5>Brief for Only Models</h5><dl>
        <dt>Campaign</dt><dd>${esc(b.type)}</dd>
        <dt>Creators</dt><dd>${esc(b.creators.join(', '))}</dd>
        <dt>Budget</dt><dd>${esc(b.budget)}</dd>
        <dt>Timeline</dt><dd>${esc(b.timeline)}</dd>
        <dt>Contact</dt><dd>${esc(b.name)}<br>${esc(b.email)}</dd></dl>
        <button type="button" class="btn btn--dark" data-handoff>Open my brief ${icon('i-arrow')}</button>`, 'msg--bot msg--card');
      setQuick(['Open my brief', 'Start over']);
    };
    const handoff = async () => {
      const b = st.brief;
      const pick = (name, vals) => $$(`.chips[data-name="${name}"] .chip`, form).forEach((c) => c.classList.toggle('is-on', vals.includes(c.textContent)));
      setWho('brand');
      pick('type', [b.type]); pick('creators', b.creators); pick('budget', [b.budget]); pick('timeline', [b.timeline]);
      form.elements.name.value = b.name; form.elements.email.value = b.email;
      sent.hidden = true; form.hidden = false;
      st.flow = null;
      await bot('Done. I’ve filled in the enquiry form with your brief, so you only need to check it and send.');
      setQuick(HOME);
      await wait(500);
      if (closable) setAsk(false);
      $('#enquire').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    };
    const creatorCard = async (name) => {
      const c = ROSTER.find((x) => x.name === name);
      await bot(`<img src="${src(c.img[0])}" alt=""><span><b>${c.name}</b> is part of the collective. ${c.note ? c.note + ' ' : ''}Find ${c.name} on ${platformsOf(c)}.</span>`, 'msg--bot msg--who');
      setQuick([`Book ${c.name}`, 'Who else is on the roster?', 'What do you make?']);
    };

    const handle = (text) => (st.queue = st.queue.then(async () => {
      setQuick([]);
      if (/^start over$/i.test(text)) return startBrief('');
      if (st.flow === 'done' && /open my brief/i.test(text)) return handoff();
      if (st.flow === 'done') st.flow = null;
      if (st.flow === 'brief') return answerStep(text);
      const early = INFO.slice(0, 2).find((x) => x.k.test(text));
      if (!early && BOOK.test(text)) return startBrief(text);
      const who = findCreators(text);
      if (!early && who.length === 1) return creatorCard(who[0]);
      const hit = early || intent(text);
      await bot(hit ? hit.a : FALLBACK);
      setQuick((hit && hit.quick) || HOME);
    }));
    const send = (text) => { me(text); return handle(text); };

    // only messages the visitor sends themselves are reported, never the autoplay demo
    const say = (text) => { emit('chat', { text, where: closable ? 'floating' : 'inline' }); return send(text); };
    quick.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) say(c.textContent); });
    $('form', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (v) { input.value = ''; say(v); }
    });
    log.addEventListener('click', (e) => {
      if (e.target.closest('[data-handoff]')) { st.queue = st.queue.then(handoff); return; }
      const a = e.target.closest('a[data-jump]');
      if (!a) return;
      if (a.dataset.who) setWho(a.dataset.who);
      if (closable) setAsk(false);
    });
    ['pointerdown', 'keydown'].forEach((ev) => root.addEventListener(ev, () => { st.touched = true; }));

    return {
      focus: () => input.focus({ preventScroll: true }),
      intro: () => {
        add('Hi, I’m the Only Models assistant. Ask about the roster, the formats or bookings, or I’ll start a brief with you.', 'msg--bot');
        setQuick(HOME);
      },
      // plays a short exchange so the demo explains itself; stops the moment the visitor touches the chat
      demo: async () => {
        for (const line of ['Hi! We’re a swimwear label. Can we book Zandi and Ama?', 'Content week']) {
          await wait(1100);
          for (const ch of line) {
            if (st.touched) { input.value = ''; return; }
            input.value += ch;
            await wait(24);
          }
          await wait(380);
          input.value = '';
          if (st.touched) return;
          await send(line);
        }
      },
    };
  }

  const inlineRoot = $('#chatInline');
  const inlineChat = createChat(inlineRoot);
  inlineChat.intro();
  new IntersectionObserver((entries, o) => {
    if (entries[0].isIntersecting) { o.disconnect(); inlineChat.demo(); }
  }, { threshold: .6 }).observe(inlineRoot);

  // the floating button steps aside while the inline assistant is on screen
  new IntersectionObserver((entries) => { askBtn.classList.toggle('is-away', entries[0].isIntersecting); }, { threshold: .25 }).observe(inlineRoot);

  const floatChat = createChat(askPanel);
  let floatStarted = false;
  function setAsk(open) {
    askPanel.hidden = !open;
    askBtn.setAttribute('aria-expanded', open);
    if (!open) return askBtn.focus({ preventScroll: true });
    if (!floatStarted) { floatStarted = true; floatChat.intro(); }
    floatChat.focus();
  }
  askBtn.addEventListener('click', () => setAsk(true));
  $('.chat__close', askPanel).addEventListener('click', () => setAsk(false));

  /* ── next-level details ── */
  const progress = $('#progress'), hero = $('.hero');
  const heroMedia = $('.hero__media'), heroInner = $('.hero__inner'), heroMark = $('.hero__mark');
  extras = () => {
    const y = scrollY;
    progress.style.transform = `scaleX(${Math.min(1, y / (document.documentElement.scrollHeight - innerHeight))})`;
    if (reduced || y > hero.offsetHeight) return;
    // the hero film pulls back into a rounded frame as the page takes over
    const p = Math.min(1, y / hero.offsetHeight);
    heroMedia.style.clipPath = `inset(${p * 7}% ${p * 4.5}% ${p * 4}% ${p * 4.5}% round ${p * 30}px)`;
    heroInner.style.transform = `translate3d(0, ${-p * 70}px, 0)`;
    heroInner.style.opacity = Math.max(0, 1 - p * 1.3);
    heroMark.style.translate = `0 ${-p * 90}px`;
  };
  extras();

  $$('h2.display').forEach((el) => { el.innerHTML = `<span class="rise">${el.innerHTML}</span>`; el.classList.add('reveal'); });
  $$('.frame, .enquire__img').forEach((el) => { el.classList.add('wipe'); io.observe(el); });

  const word = $('.foot__word');
  word.innerHTML = [...word.textContent].map((ch, i) => (ch === ' ' ? ' ' : `<span class="l" style="--i:${i}">${ch}</span>`)).join('');
  word.classList.add('is-split');
  io.observe(word);

  if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // a label that rides with the pointer over things you can open, play or drag
    const cursor = $('#cursor'), label = $('span', cursor);
    const targets = [['.roster__btn', 'View'], ['.vid', 'Play'], ['.reels__rail', 'Drag'], ['.seal', 'Brief']];
    addEventListener('pointermove', (e) => {
      cursor.style.setProperty('--x', e.clientX + 'px');
      cursor.style.setProperty('--y', e.clientY + 'px');
      const hit = e.target.closest ? targets.find(([sel]) => e.target.closest(sel)) : null;
      cursor.classList.toggle('is-on', !!hit);
      if (hit) label.textContent = hit[1];
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));

    // grid lines brighten under the pointer
    $$('.gridded:not(.gridded--cols)').forEach((sec) => {
      sec.addEventListener('pointermove', (e) => {
        const r = sec.getBoundingClientRect();
        sec.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`);
        sec.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`);
      }, { passive: true });
      sec.addEventListener('pointerleave', () => sec.style.setProperty('--mx', '-99rem'));
    });

    $$('.btn--solid, .nav__cta').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // drifting grids only animate while their section is on screen
  const liveGrids = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)));
  $$('.gridded--live').forEach((el) => liveGrids.observe(el));

  observeReveals();
  $('#year').textContent = new Date().getFullYear();
})();
