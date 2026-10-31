/* Rainbark: welcome page. Fills in the text for the browser's language (see _locales). */
(() => {
  'use strict';
  const ext = globalThis.browser ?? globalThis.chrome;
  if (!ext || !ext.i18n) return;
  document.documentElement.lang = ext.i18n.getUILanguage();
  for (const node of document.querySelectorAll('[data-msg]')) {
    const text = ext.i18n.getMessage(node.dataset.msg);
    if (text) node.textContent = text;
  }
})();
