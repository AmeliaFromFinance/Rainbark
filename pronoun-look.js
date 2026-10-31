/*
 * Rainbark: how pronoun tags look.
 *
 * Used by the panel (page.js) for its live preview, and to hand pronouns.js (which puts the tags in chat) a
 * ready-made stylesheet and the formatting choices, so the preview and the real tags always match.
 */
(window.__rainbarkParts = window.__rainbarkParts || {}).pronounLook = (() => {
  'use strict';

  const DEFAULTS = {
    on: true, chat: true, about: true,
    textCase: 'asis',        // asis She/Her · lower she/her · upper SHE/HER · first She/her
    brackets: 'none',        // none · round (She/Her) · square [She/Her]
    separator: 'slash',      // slash She/Her · spaced She / Her · dot She · Her
    color: 'purple',         // purple (Twitch's accent) · name (the chatter's name color) · custom
    customColor: '#BF94FF',
    background: 'tint',      // tint (a soft wash of the text color) · none · custom
    customBackground: '#2F2F35',
    border: true, shape: 'pill', bold: true,
    size: 'small',           // small (a little under chat text) · chat (the same size)
  };
  const CHOICES = {
    textCase: ['asis', 'lower', 'upper', 'first'], brackets: ['none', 'round', 'square'], separator: ['slash', 'spaced', 'dot'],
    color: ['purple', 'name', 'custom'], background: ['tint', 'none', 'custom'], shape: ['pill', 'rounded', 'square'], size: ['small', 'chat'],
  };
  const SWITCHES = ['on', 'chat', 'about', 'border', 'bold'];
  const HEX = /^#[0-9a-f]{6}$/i;

  function clean(raw) {
    const look = { ...DEFAULTS };
    if (!raw || typeof raw !== 'object') return look;
    for (const key of SWITCHES) if (typeof raw[key] === 'boolean') look[key] = raw[key];
    for (const key in CHOICES) if (CHOICES[key].includes(raw[key])) look[key] = raw[key];
    for (const key of ['customColor', 'customBackground']) if (HEX.test(raw[key])) look[key] = raw[key].toUpperCase();
    return look;
  }

  const CASES = {
    asis: text => text,
    lower: text => text.toLowerCase(),
    upper: text => text.toUpperCase(),
    first: text => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
  };
  const SEPARATORS = { slash: '/', spaced: ' / ', dot: ' · ' };
  const BRACKETS = { none: ['', ''], round: ['(', ')'], square: ['[', ']'] };

  // How a tag's words are put together; pronouns.js gets this as plain data (see applySpec).
  const spec = look => ({ join: SEPARATORS[look.separator], brackets: BRACKETS[look.brackets], textCase: look.textCase });
  const applySpec = (parts, { join, brackets, textCase }) => brackets[0] + (CASES[textCase] || CASES.asis)(parts.join(join)) + brackets[1];

  // ['She', 'Her'] -> "She/Her", "(she/her)" and so on.
  const format = (parts, look) => applySpec(parts, spec(look));

  // The stylesheet for tags inside `scope` (a selector, or '' for the whole page).
  function css(look, scope = '') {
    const tag = `${scope} .rb-pn.rb-pn`.trim();
    const text = look.color === 'custom' ? look.customColor : look.color === 'name' ? 'var(--rbp-name, var(--rbp-purple))' : 'var(--rbp-purple)';
    const fill = look.background === 'none' ? 'transparent'
      : look.background === 'custom' ? look.customBackground : 'color-mix(in srgb, var(--rbp-fg) 16%, transparent)';
    const boxed = look.background !== 'none' || look.border;
    return `
      ${tag} {
        --rbp-purple: #bf94ff; --rbp-fg: ${text};
        display: inline-block; margin: 0 .1em 0 .4em; padding: 0 ${boxed ? '.5em' : '.1em'};
        border-radius: ${{ pill: '.9em', rounded: '.3em', square: '0' }[look.shape]};
        background: ${fill}; box-shadow: ${look.border ? 'inset 0 0 0 1px color-mix(in srgb, var(--rbp-fg) 38%, transparent)' : 'none'};
        color: var(--rbp-fg); font-family: inherit; font-size: ${look.size === 'chat' ? '1em' : '.85em'}; font-weight: ${look.bold ? 600 : 400};
        font-style: normal; line-height: 1.55; letter-spacing: normal; text-transform: none; text-decoration: none;
        white-space: nowrap; vertical-align: baseline; cursor: pointer; unicode-bidi: isolate;
      }
      html.tw-root--theme-light ${tag} { --rbp-purple: #772ce8; }
      ${tag}:hover { filter: brightness(1.18); text-decoration: none; }
      ${tag}:focus { outline: none; }
      ${tag}:focus-visible { outline: 2px solid #a970ff; outline-offset: 1px; }
      ${tag}.rb-pn--heading { margin-inline-start: .5em; font-size: .62em; line-height: 1.7; vertical-align: .18em; }`;
  }

  return { DEFAULTS, CHOICES, clean, format, spec, css, CASES };
})();
