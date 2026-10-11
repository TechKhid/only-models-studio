// Visit tracking: reports opens, key actions and a per-visit summary to /api/track,
// which forwards them as ntfy notifications. No cookies and no precise geolocation;
// the visitor id is a random string kept in this browser's storage.
//
//   ?notrack      stop counting this browser (use it on your own devices)
//   ?track=on     start counting it again
//   ?track=debug  log events to the console instead of sending them
//   ?ref=name     tag a link so the notification says who it was sent to
(() => {
  'use strict';

  const qs = new URLSearchParams(location.search);
  const store = (area, k, v) => {
    try { if (v === undefined) return area.getItem(k); area.setItem(k, v); } catch (e) { /* storage blocked */ }
    return null;
  };
  const LS = (k, v) => store(localStorage, k, v);
  const SS = (k, v) => store(sessionStorage, k, v);

  if (qs.has('notrack')) LS('oms_notrack', '1');
  if (qs.get('track') === 'on') { try { localStorage.removeItem('oms_notrack'); } catch (e) { /* storage blocked */ } }
  const DEBUG = qs.get('track') === 'debug';
  const LOCAL = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (LS('oms_notrack') || (LOCAL && !DEBUG)) return;
  window.omsTrack = true;

  const vid = LS('oms_vid') || (LS('oms_vid', Math.random().toString(36).slice(2, 10)), LS('oms_vid')) || 'nostore';
  const newSession = !SS('oms_sid');
  if (newSession) {
    SS('oms_sid', '1');
    LS('oms_visits', String((parseInt(LS('oms_visits'), 10) || 0) + 1));
  }
  const ref = qs.get('ref') || qs.get('to') || qs.get('utm_source') || SS('oms_ref') || '';
  if (ref) SS('oms_ref', ref);

  let referrer = '';
  try { const h = new URL(document.referrer).host; if (h !== location.host) referrer = h; } catch (e) { /* no referrer */ }

  const base = () => ({
    v: vid, visits: parseInt(LS('oms_visits'), 10) || 1, ref, referrer,
    page: location.pathname,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    local: new Date().toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
    lang: navigator.language,
    screen: `${screen.width}×${screen.height}`,
    touch: navigator.maxTouchPoints > 0,
  });
  const post = (type, data, leaving) => {
    const body = JSON.stringify({ type, ...base(), ...data });
    if (DEBUG) return console.log('[track]', type, JSON.parse(body));
    if (leaving && navigator.sendBeacon) return navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
  };

  if (newSession) post('open');
  if (/media-kit/.test(location.pathname) && !SS('oms_kit')) { SS('oms_kit', '1'); post('mediakit'); }

  /* ── what happened during the visit ── */
  const seen = { sections: new Set(), profiles: new Set(), videos: new Set(), clicks: new Set() };
  let maxScroll = 0, chats = 0, activeMs = 0, since = document.hidden ? 0 : performance.now();

  const onScroll = () => {
    const h = document.documentElement.scrollHeight;
    maxScroll = Math.max(maxScroll, Math.min(100, Math.round(((scrollY + innerHeight) / h) * 100)));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const NAMES = { top: 'Hero', collective: 'Collective', roster: 'Roster', work: 'On screen', reels: 'Shorts', brands: 'For brands', assistant: 'Assistant', enquire: 'Enquiry form' };
  if ('IntersectionObserver' in window) {
    // a section counts once it crosses the middle of the screen
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && NAMES[e.target.id]) seen.sections.add(NAMES[e.target.id]); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('main section[id]').forEach((s) => io.observe(s));
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest ? e.target : null;
    if (!t) return;
    const profile = t.closest('.roster__btn'), video = t.closest('.vid'), link = t.closest('a');
    if (profile) seen.profiles.add(profile.querySelector('.name').textContent.trim());
    if (video) seen.videos.add((video.getAttribute('aria-label') || '').replace(/^Play:\s*/, ''));
    if (t.closest('#askBtn')) seen.clicks.add('Opened chat');
    if (t.closest('[data-handoff]')) seen.clicks.add('Opened brief from chat');
    if (!link) return;
    if (link.getAttribute('href') === '#enquire') seen.clicks.add(link.classList.contains('seal') ? 'Brands welcome seal' : link.textContent.trim() || 'Enquire');
    else if (link.target === '_blank') { try { seen.clicks.add('Out: ' + new URL(link.href).host.replace(/^www\./, '')); } catch (err) { /* odd link */ } }
  }, true);

  // main.js announces chat and form moments on this event
  document.addEventListener('oms', (e) => {
    const d = e.detail || {};
    if (d.type === 'chat') { chats += 1; if (chats === 1 && !SS('oms_chat')) { SS('oms_chat', '1'); post('chat', d); } }
    if (d.type === 'brief' || d.type === 'enquiry') post(d.type, d);
  });

  /* ── one summary when they leave (a few at most if they keep coming back to the tab) ── */
  let lastKey = '';
  const summary = () => {
    if (since) { activeMs += performance.now() - since; since = 0; }
    const seconds = Math.round(activeMs / 1000);
    const sentSoFar = parseInt(SS('oms_sum'), 10) || 0;
    const data = {
      seconds, scroll: maxScroll, chats,
      sections: [...seen.sections], profiles: [...seen.profiles], videos: [...seen.videos], clicks: [...seen.clicks],
    };
    const key = JSON.stringify([data.scroll, data.sections, data.profiles, data.videos, data.clicks, data.chats]);
    if (seconds < 5 || sentSoFar >= 3 || key === lastKey) return;
    lastKey = key;
    SS('oms_sum', String(sentSoFar + 1));
    post('summary', data, true);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) summary(); else if (!since) since = performance.now();
  });
  addEventListener('pagehide', summary);
})();
