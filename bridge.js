/*
 * Rainbark: bridge.
 *
 * page.js runs inside the Twitch page and can't use extension APIs. This script runs beside it and does the
 * things that need them:
 *   - keeps the newest copy of your settings in extension storage, shared by www.twitch.tv and the creator
 *     dashboard and every open tab, so they also survive Twitch's site data being cleared
 *   - passes on a click of the toolbar button, so it opens the Rainbark panel
 *
 * The two talk through window events carrying JSON text. Anything on the page could send those events too, so this
 * side only ever stores a settings blob under one key and never acts on what's inside it.
 */
(() => {
  'use strict';
  if (window.__rainbarkBridge) return;
  window.__rainbarkBridge = true;

  const ext = globalThis.browser ?? globalThis.chrome;
  const STORAGE_KEY = 'state';
  const MAX_STATE_LENGTH = 2 * 1024 * 1024;

  let stored = null;      // the copy in extension storage, as JSON text
  let storedAt = 0;       // when that copy was saved (its savedAt stamp)
  let loaded = false;     // extension storage has been read
  let pageAsked = false;  // page.js has said hello
  let stopped = false;

  // After the extension is updated or reloaded, this copy of the script loses its connection. Stop quietly.
  function stop() {
    stopped = true;
    window.removeEventListener('rainbark:to-extension', onPageMessage);
  }
  const connected = () => { try { return !!(ext.runtime && ext.runtime.id); } catch (error) { return false; } };

  function tellPage(type, payload) {
    window.dispatchEvent(new CustomEvent('rainbark:from-extension', { detail: JSON.stringify({ type, ...payload }) }));
  }

  function sendBackup() {
    if (loaded && pageAsked) tellPage('backup', { state: stored });
  }

  // A copy's savedAt stamp, or -1 when it isn't a settings object at all.
  function stampOf(json) {
    try { const parsed = JSON.parse(json); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Number(parsed.savedAt) || 0 : -1; }
    catch (error) { return -1; }
  }

  // Keeps the newest copy: an older one (from a tab that hadn't caught up yet) never replaces a newer one.
  let writing = Promise.resolve();
  function save(json) {
    if (typeof json !== 'string' || json.length > MAX_STATE_LENGTH || json === stored) return;
    const at = stampOf(json);
    if (at < 0 || (stored && at < storedAt)) return;
    stored = json; storedAt = at;
    writing = writing.then(() => ext.storage.local.set({ [STORAGE_KEY]: json })).catch(() => { if (!connected()) stop(); });
  }

  function load() {
    return Promise.resolve(ext.storage.local.get(STORAGE_KEY))
      .then(result => { stored = typeof result[STORAGE_KEY] === 'string' ? result[STORAGE_KEY] : null; storedAt = stored ? Math.max(0, stampOf(stored)) : 0; })
      .catch(() => {});
  }

  function onPageMessage(event) {
    if (stopped) return;
    if (!connected()) { stop(); return; }
    let message;
    try { message = JSON.parse(event.detail); } catch (error) { return; }
    if (!message || typeof message !== 'object') return;
    if (message.type === 'hello') { pageAsked = true; if (loaded) load().then(sendBackup); }
    else if (message.type === 'save') save(message.state);
  }
  window.addEventListener('rainbark:to-extension', onPageMessage);

  load().finally(() => {
    loaded = true;
    pageAsked = true;   // page.js starts first, so its hello may have gone out before this script was listening
    sendBackup();
  });

  // Another tab or site saved: pass it on (page.js only takes it if it's newer than its own).
  ext.storage.onChanged.addListener((changes, area) => {
    if (stopped || area !== 'local' || !changes[STORAGE_KEY] || typeof changes[STORAGE_KEY].newValue !== 'string') return;
    stored = changes[STORAGE_KEY].newValue; storedAt = Math.max(0, stampOf(stored));
    sendBackup();
  });

  // The toolbar button and the keyboard shortcut (see background.js).
  ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== 'toggle-panel' || stopped) return false;
    tellPage('toggle-panel', { keyboard: message.keyboard === true });
    sendResponse({ ok: true });
    return false;
  });

  // Which keys the shortcut is on, for the paw button's tooltip.
  Promise.resolve(ext.runtime.sendMessage({ type: 'shortcut' }))
    .then(reply => { if (reply && typeof reply.keys === 'string' && reply.keys) tellPage('shortcut', { keys: reply.keys }); })
    .catch(() => {});
})();
