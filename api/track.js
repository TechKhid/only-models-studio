// Vercel serverless function: turns site events into ntfy push notifications.
//
// The ntfy topic lives in an environment variable so it never ships to the
// browser (anyone who knows a topic name can read it). Location comes from
// Vercel's geo headers, so no third-party lookup is needed and the visitor's
// IP address is never forwarded or stored.
//
// Env: NTFY_TOPIC (required), NTFY_SERVER (default https://ntfy.sh), NTFY_TOKEN (optional)

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const hits = new Map();

const clean = (v, n = 160) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, n);
const list = (v, n = 8) => (Array.isArray(v) ? v.slice(0, n).map((x) => clean(x, 60)).filter(Boolean) : []);
const duration = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

function place(headers) {
  const decode = (v) => { try { return decodeURIComponent(v || ''); } catch { return v || ''; } };
  const cc = clean(headers['x-vercel-ip-country'], 2).toUpperCase();
  let country = cc;
  try { country = new Intl.DisplayNames(['en'], { type: 'region' }).of(cc) || cc; } catch { /* unknown code */ }
  const flag = /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : '';
  const text = [clean(decode(headers['x-vercel-ip-city']), 60), country].filter(Boolean).join(', ') || 'Unknown location';
  return { text, flag };
}

function device(ua, touch) {
  const os = /android/i.test(ua) ? 'Android' : /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /windows/i.test(ua) ? 'Windows'
    : /mac os x/i.test(ua) ? (touch ? 'iPadOS' : 'macOS') : /linux/i.test(ua) ? 'Linux' : 'Unknown OS';
  const kind = /ipad|tablet/i.test(ua) || os === 'iPadOS' ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'phone' : 'computer';
  const browser = /instagram/i.test(ua) ? 'Instagram in-app browser' : /fban|fbav/i.test(ua) ? 'Facebook in-app browser'
    : /tiktok|musical_ly|bytedance/i.test(ua) ? 'TikTok in-app browser' : /whatsapp/i.test(ua) ? 'WhatsApp in-app browser'
    : /edg\//i.test(ua) ? 'Edge' : /samsungbrowser/i.test(ua) ? 'Samsung Internet' : /firefox|fxios/i.test(ua) ? 'Firefox'
    : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Unknown browser';
  return `${os} ${kind} · ${browser}`;
}

function build(b, ctx) {
  const who = `Visitor ${clean(b.v, 8) || '?'}${ctx.ref ? ` · link tag “${ctx.ref}”` : ''}`;
  const where = `${ctx.place.flag} ${ctx.place.text}`.trim();
  switch (b.type) {
    case 'open': {
      const visits = Math.max(1, Math.min(999, parseInt(b.visits, 10) || 1));
      return {
        title: `${ctx.place.flag} Site opened · ${ctx.place.text}`.trim(),
        tags: ['eyes'], priority: 4,
        lines: [
          visits > 1 ? `Returning visitor, visit ${visits}` : 'New visitor',
          ctx.ref && `Link tag: ${ctx.ref}`,
          b.referrer && `Came from: ${clean(b.referrer, 80)}`,
          ctx.device,
          b.tz && `Their time: ${clean(b.local, 30)} (${clean(b.tz, 40)})`,
          `Screen ${clean(b.screen, 14)} · ${clean(b.lang, 12)}`,
          `Page ${clean(b.page, 60)} · visitor ${clean(b.v, 8)}`,
        ],
      };
    }
    case 'mediakit':
      return { title: `Media kit opened · ${ctx.place.text}`, tags: ['page_facing_up'], priority: 4, lines: [ctx.device, who] };
    case 'chat':
      return {
        title: `Chat started · ${ctx.place.text}`, tags: ['speech_balloon'], priority: 3,
        lines: [`“${clean(b.text, 240)}”`, `Via the ${b.where === 'floating' ? 'floating' : 'on-page'} assistant`, who],
      };
    case 'brief':
      return {
        title: `Chat brief built · ${clean(b.campaign, 40) || 'campaign'}`, tags: ['clipboard'], priority: 4,
        lines: [
          `Creators: ${list(b.creators).join(', ') || 'not chosen'}`,
          `Budget: ${clean(b.budget, 30)}`, `Timeline: ${clean(b.timeline, 30)}`,
          `From ${where}`, who,
        ],
      };
    case 'enquiry': {
      const creator = b.who === 'creator';
      const name = clean(b.name, 60) || 'someone';
      return {
        title: creator ? `Creator application · ${name}` : `New enquiry · ${name}${b.company ? ` (${clean(b.company, 50)})` : ''}`,
        tags: ['incoming_envelope'], priority: 5,
        lines: [
          `Email: ${clean(b.email, 100)}`,
          b.handle && `Handle: ${clean(b.handle, 60)}`,
          b.country && `Country: ${clean(b.country, 50)}`,
          list(b.campaign).length && `Campaign: ${list(b.campaign).join(', ')}`,
          list(b.creators, 10).length && `Creators: ${list(b.creators, 10).join(', ')}`,
          b.budget && `Budget: ${clean(b.budget, 30)}`,
          b.timeline && `Timeline: ${clean(b.timeline, 30)}`,
          b.message && `Message: ${clean(b.message, 600)}`,
          `Sent from ${where}`, who,
        ],
      };
    }
    case 'summary': {
      const secs = Math.max(0, Math.min(86400, parseInt(b.seconds, 10) || 0));
      const chats = parseInt(b.chats, 10) || 0;
      return {
        title: `Visit summary · ${duration(secs)} · ${ctx.place.text}`, tags: ['bar_chart'], priority: 2,
        lines: [
          `Scrolled ${Math.max(0, Math.min(100, parseInt(b.scroll, 10) || 0))}% of ${clean(b.page, 60)}`,
          list(b.sections, 10).length && `Saw: ${list(b.sections, 10).join(', ')}`,
          list(b.profiles).length && `Opened profiles: ${list(b.profiles).join(', ')}`,
          list(b.videos).length && `Played: ${list(b.videos).join(', ')}`,
          chats > 0 && `Chat messages: ${chats}`,
          list(b.clicks).length && `Clicked: ${list(b.clicks).join(', ')}`,
          who,
        ],
      };
    }
    default:
      return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  // only the site itself may report events
  const origin = req.headers.origin || req.headers.referer || '';
  let originHost = '';
  try { originHost = new URL(origin).host; } catch { /* not a URL */ }
  if (!originHost || originHost !== req.headers.host) return res.status(403).end();

  const ua = clean(req.headers['user-agent'], 300);
  if (!ua || /bot|crawl|spider|preview|headless|lighthouse|monitor|vercel-screenshot/i.test(ua)) return res.status(204).end();

  const ip = clean((req.headers['x-forwarded-for'] || '').split(',')[0], 60) || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return res.status(429).end();
  hits.set(ip, [...recent, now]);
  if (hits.size > 5000) hits.clear();

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 6000) return res.status(400).end();

  const note = build(body, { place: place(req.headers), device: device(ua, !!body.touch), ref: clean(body.ref, 40) });
  if (!note) return res.status(400).end();

  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    console.warn('NTFY_TOPIC is not set; dropped event:', note.title);
    return res.status(204).end();
  }

  try {
    const r = await fetch(process.env.NTFY_SERVER || 'https://ntfy.sh', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.NTFY_TOKEN ? { authorization: `Bearer ${process.env.NTFY_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        topic,
        title: note.title,
        message: note.lines.filter(Boolean).join('\n'),
        tags: note.tags,
        priority: note.priority,
        click: `https://${req.headers.host}/`,
      }),
    });
    if (!r.ok) console.error('ntfy rejected the event:', r.status, await r.text());
  } catch (err) {
    console.error('ntfy publish failed:', err);
  }
  return res.status(204).end();
};
