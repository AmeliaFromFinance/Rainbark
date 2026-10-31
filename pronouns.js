/*
 * Rainbark: pronoun tags.
 *
 * Watches the page for chat usernames and the channel's About heading, asks background.js for each person's
 * pronouns (from pr.alejo.io) and puts a small tag after their name. The tag links to pr.alejo.io, where anyone
 * can set or change their own. Whether and how tags show comes from the panel (page.js) through window events:
 * a stylesheet and the formatting choices, both made by pronoun-look.js.
 *
 * Works with Twitch's own chat, FrankerFaceZ's chat (which replaces Twitch's chat lines) and, best effort, 7TV's.
 */
(() => {
  'use strict';
  if (window.__rainbarkPronouns) return;
  window.__rainbarkPronouns = true;

  const ext = globalThis.browser ?? globalThis.chrome;

  const SETTINGS_URL   = 'https://pr.alejo.io';
  const ERROR_RETRY_MS = 60 * 1000;
  const CACHE_PRUNE_AT = 3000;
  const LOGIN_PATTERN  = /^[a-z0-9_]{1,25}$/;

  // Chat usernames. Twitch, FFZ, VOD replay and whispers all use .chat-author__display-name.
  const NAME_SELECTOR  = '.chat-author__display-name, .seventv-chat-user-username';
  // The tag goes right after the clickable name wrapper (so it also follows a localized name's "(login)"), never
  // inside it, or clicking the tag would open the user card.
  const NAME_WRAPPER   = '.chat-line__username, .seventv-chat-user';
  const MESSAGE_LINE   = '.chat-line__message, [data-a-target="chat-line-message"], .vod-message, .seventv-message';
  const ABOUT_HEADING  = '[data-a-target="about-panel"] h3';
  const OTHER_TAGS     = '.pn-tag';   // the separate Pronoun Tags extension: if it's there, leave pronouns to it

  // First path segments that aren't channels (for the About heading).
  const RESERVED_PATHS = new Set(['videos', 'directory', 'settings', 'u', 'p', 'search', 'friends', 'subscriptions',
    'wallet', 'inventory', 'drops', 'popout', 'moderator', 'team', 'login', 'signup', 'embed', 'downloads', 'jobs',
    'turbo', 'prime', 'store', 'messages', 'payments', 'subs', 'following']);

  let look = null;                                  // { on, chat, about, css, spec } from the panel; nothing happens until it arrives
  let text = { title: '', label: '{pronouns}' };    // tooltip and screen reader wording, in the panel's language
  let stopped = false, deferring = false;

  /* ---- Settings from the panel ---- */

  let styleElement = null;
  function applyStyle() {
    if (!look || !document.documentElement) return;
    if (!styleElement || !styleElement.isConnected) {
      styleElement = document.createElement('style');
      styleElement.id = 'rb-pn-style';
      (document.head || document.documentElement).append(styleElement);
    }
    styleElement.textContent = look.css;
  }

  const active = () => !!look && look.on && !stopped && !deferring;

  window.addEventListener('rainbark:pronouns', event => {
    let message;
    try { message = JSON.parse(event.detail); } catch (error) { return; }
    if (!message || typeof message !== 'object') return;
    const spec = message.spec;
    if (!spec || typeof spec.join !== 'string' || !Array.isArray(spec.brackets) || typeof message.css !== 'string') return;
    const before = look;
    look = { on: message.on === true, chat: message.chat === true, about: message.about === true, css: message.css,
      spec: { join: spec.join, brackets: spec.brackets.map(String).slice(0, 2), textCase: String(spec.textCase) } };
    if (message.text && typeof message.text.title === 'string' && typeof message.text.label === 'string') text = message.text;
    applyStyle();
    if (!active()) { removeAllTags(); return; }
    if (!before || !before.on || before.chat !== look.chat || before.about !== look.about) { fullScanQueued = true; scheduleFlush(); }
    refreshAll();   // re-writes every tag's text for the new case, brackets and separator
  });

  // Only tags this script made (the panel's preview uses the same class).
  // ['She', 'Her'] with the panel's choices: "She/Her", "(she · her)" and so on.
  const CASES = { lower: text => text.toLowerCase(), upper: text => text.toUpperCase(),
    first: text => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() };
  function formatLabel(parts) {
    const { join, brackets, textCase } = look.spec;
    const joined = parts.join(join);
    return (brackets[0] || '') + (CASES[textCase] ? CASES[textCase](joined) : joined) + (brackets[1] || '');
  }

  function removeAllTags() {
    document.querySelectorAll('a.rb-pn[data-rb-pn-for]').forEach(tag => tag.remove());
  }

  /* ---- Lookups (answered by background.js, cached here until the expiry it gives) ---- */

  const cache = new Map();      // login -> { parts: string[]|null, expiresAt }
  const inFlight = new Set();
  const retryAt = new Map();    // login -> time a failed lookup may be retried

  const isFresh = entry => !!entry && entry.expiresAt > Date.now();

  function pruneCache() {
    if (cache.size < CACHE_PRUNE_AT) return;
    for (const [login, entry] of cache) if (!isFresh(entry)) cache.delete(login);
  }

  function requestPronouns(login) {
    if (!active() || isFresh(cache.get(login)) || inFlight.has(login) || (retryAt.get(login) || 0) > Date.now()) return;
    inFlight.add(login);
    let reply;
    try {
      reply = ext.runtime.sendMessage({ type: 'pronouns:lookup', login });
    } catch (error) {
      inFlight.delete(login);
      stopIfOrphaned(error);
      return;
    }
    Promise.resolve(reply)
      .then(result => {
        if (result && result.ok) {
          cache.set(login, { parts: Array.isArray(result.parts) && result.parts.length ? result.parts.map(String) : null, expiresAt: result.expiresAt });
          retryAt.delete(login);
          pruneCache();
        } else {
          scheduleRetry(login, (result && result.retryAt) || Date.now() + ERROR_RETRY_MS);
        }
      })
      .catch(error => { scheduleRetry(login, Date.now() + ERROR_RETRY_MS); stopIfOrphaned(error); })
      .finally(() => { inFlight.delete(login); renderLogin(login); });
  }

  // A failed lookup is retried later, as long as that person's name is still on the page.
  function scheduleRetry(login, when) {
    retryAt.set(login, when);
    setTimeout(() => { if (document.querySelector(`[data-rb-pn-login="${login}"]`)) requestPronouns(login); }, Math.max(0, when - Date.now()) + 50);
  }

  // After the extension is updated or reloaded, this copy of the script loses its connection. Stop quietly.
  function stopIfOrphaned(error) {
    const message = String((error && error.message) || error);
    let connected = false;
    try { connected = !!(ext.runtime && ext.runtime.id); } catch (_) { /* Firefox: dead object */ }
    if (connected && !/context invalidated/i.test(message)) return;
    stopped = true;
    observer.disconnect();
  }

  /* ---- Whose name an element is ---- */

  function normalizeLogin(value) {
    const login = String(value || '').trim().replace(/^[(@]+|[)]+$/g, '').toLowerCase();
    return LOGIN_PATTERN.test(login) ? login : null;
  }

  function loginForName(nameEl) {
    const line = nameEl.closest(MESSAGE_LINE);
    const wrapper = nameEl.closest(NAME_WRAPPER) || nameEl.parentElement;
    const intlLogin = wrapper && wrapper.querySelector('.chat-author__intl-login');
    const candidates = [
      nameEl.getAttribute('data-a-user'),              // Twitch
      line && line.getAttribute('data-a-user'),         // Twitch, on the message line
      line && line.getAttribute('data-user'),           // FrankerFaceZ
      intlLogin && intlLogin.textContent,               // localized display name, e.g. "日本語 (login)"
      nameEl.textContent,                               // display names only differ from logins by case
    ];
    for (const candidate of candidates) {
      const login = normalizeLogin(candidate);
      if (login) return login;
    }
    return null;
  }

  function channelFromPath() {
    if (location.hostname !== 'www.twitch.tv') return null;
    const login = normalizeLogin(location.pathname.split('/').filter(Boolean)[0]);
    return login && !RESERVED_PATHS.has(login) ? login : null;
  }

  /* ---- Tags
   *   data-rb-pn-login   whose pronouns go here
   *   data-rb-pn-slot    "after" (chat name: the tag follows it) or "inside" (About heading: the tag is appended)
   * ---- */

  function anchorFor(nameEl) {
    const wrapper = nameEl.closest(NAME_WRAPPER);
    if (wrapper) return wrapper;
    // Elsewhere, step out of any link or button around the name so the tag isn't nested in it.
    const line = nameEl.closest(MESSAGE_LINE);
    const interactive = nameEl.closest('a, button, [role="button"]');
    return interactive && interactive !== line && (!line || line.contains(interactive)) ? interactive : nameEl;
  }

  function existingTag(target) {
    if (target.dataset.rbPnSlot === 'inside') return target.querySelector(':scope > a.rb-pn[data-rb-pn-for]');
    const next = anchorFor(target).nextElementSibling;
    return next && next.matches('a.rb-pn[data-rb-pn-for]') ? next : null;
  }

  function createTag(heading) {
    const tag = document.createElement('a');
    tag.className = heading ? 'rb-pn rb-pn--heading' : 'rb-pn';
    tag.dataset.rbPnFor = '';
    tag.href = SETTINGS_URL;
    tag.target = '_blank';
    tag.rel = 'noopener noreferrer';
    // Clicks shouldn't reach Twitch's chat handlers (user card, reply and so on).
    tag.addEventListener('click', event => event.stopPropagation());
    return tag;
  }

  function render(target) {
    const login = target.dataset.rbPnLogin;
    if (!login) return;
    const entry = cache.get(login);
    let tag = existingTag(target);
    const wanted = active() && (target.dataset.rbPnSlot === 'inside' ? look.about : look.chat);

    if (!wanted) { if (tag) tag.remove(); return; }
    if (!isFresh(entry)) {
      // Waiting on a (re)lookup. Keep a tag that's already right for this person; drop one that belonged to someone
      // else (the About heading after switching channels).
      if (tag && tag.dataset.rbPnFor !== login) tag.remove();
      return;
    }
    if (!entry.parts) { if (tag) tag.remove(); return; }

    const inside = target.dataset.rbPnSlot === 'inside';
    if (!tag) {
      tag = createTag(inside);
      if (inside) target.append(tag); else anchorFor(target).after(tag);
    }
    tag.dataset.rbPnFor = login;
    if (!inside) {
      const nameColor = getComputedStyle(target).color;
      if (nameColor) tag.style.setProperty('--rbp-name', nameColor);
    }
    const label = formatLabel(entry.parts), spoken = text.label.replace('{pronouns}', label);
    if (tag.textContent !== label) tag.textContent = label;
    if (tag.title !== text.title) tag.title = text.title;
    if (tag.getAttribute('aria-label') !== spoken) tag.setAttribute('aria-label', spoken);
  }

  function renderLogin(login) {
    document.querySelectorAll(`[data-rb-pn-login="${login}"]`).forEach(render);
  }

  function refreshAll() {
    document.querySelectorAll('[data-rb-pn-login]').forEach(target => { render(target); requestPronouns(target.dataset.rbPnLogin); });
  }

  function track(target, login, slot) {
    if (target.dataset.rbPnLogin !== login) target.dataset.rbPnLogin = login;
    if (target.dataset.rbPnSlot !== slot) target.dataset.rbPnSlot = slot;
    render(target);
    requestPronouns(login);
  }

  /* ---- Finding names as Twitch adds them ---- */

  function processName(nameEl) {
    const login = loginForName(nameEl);
    if (login) track(nameEl, login, 'after');
  }

  function scan(root) {
    if (root.nodeType !== Node.ELEMENT_NODE || root.classList.contains('rb-pn')) return;
    if (root.matches(NAME_SELECTOR)) processName(root);
    root.querySelectorAll(NAME_SELECTOR).forEach(processName);
  }

  function syncAboutPanel() {
    const heading = document.querySelector(ABOUT_HEADING);
    const login = heading && channelFromPath();
    if (login) track(heading, login, 'inside');
  }

  let pendingRoots = [];
  let fullScanQueued = false;
  let flushScheduled = false;

  function flush() {
    flushScheduled = false;
    if (stopped || !look) return;
    const wasDeferring = deferring;
    deferring = !!document.querySelector(OTHER_TAGS);
    if (deferring) { if (!wasDeferring) removeAllTags(); pendingRoots = []; return; }
    if (wasDeferring) fullScanQueued = true;
    if (!look.on) { pendingRoots = []; return; }
    const roots = pendingRoots;
    pendingRoots = [];
    if (fullScanQueued) { fullScanQueued = false; scan(document.body); }
    else for (const root of roots) if (root.isConnected) scan(root);
    syncAboutPanel();
  }

  function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    // Before the next paint when visible, so cached tags appear with the message itself.
    if (document.hidden) setTimeout(flush, 250); else requestAnimationFrame(flush);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE || node.classList.contains('rb-pn')) continue;
        pendingRoots.push(node);
      }
      // A tag wiped out by Twitch re-rendering around it (the name stayed): look at that spot again.
      for (const node of mutation.removedNodes)
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('rb-pn')) pendingRoots.push(mutation.target);
    }
    if (pendingRoots.length > 2000) { pendingRoots = []; fullScanQueued = true; }
    // Always flush: the About heading can change through text-only updates (switching channels).
    scheduleFlush();
  });

  function start() {
    observer.observe(document.documentElement, { childList: true, subtree: true });
    fullScanQueued = true;
    scheduleFlush();
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  // page.js answers straight away with the settings (it may also have sent them before this script was listening).
  window.dispatchEvent(new CustomEvent('rainbark:pronouns-hello'));
})();
