/*
 * Rainbark: styles.
 *
 * Loaded into the Twitch page just before page.js, which picks it up from window.__rainbarkParts and
 * adds it to the page once. A function, so the panel size can be passed in.
 */
(window.__rainbarkParts = window.__rainbarkParts || {}).styles = ({ PANEL_WIDTH, PANEL_MAX_HEIGHT }) => {

  /* =========================================================================
   * Styles: Twitch's dark and light theme tokens, scoped to Rainbark elements.
   * Logical properties (inline-start/end) so the panel mirrors cleanly right-to-left.
   * ========================================================================= */

  const STYLES = `
    #rb-panel, #rb-fab, .rb-toasts, #rb-guide {
      --rb-surface: #1f1f23;
      --rb-raised: #26262c;
      --rb-sunken: #18181b;
      --rb-deep: #0e0e10;
      --rb-hover: rgba(83, 83, 95, .48);
      --rb-press: rgba(83, 83, 95, .55);
      --rb-secondary: rgba(83, 83, 95, .38);
      --rb-line: rgba(83, 83, 95, .48);
      --rb-line-strong: #53535f;
      --rb-text: #efeff1;
      --rb-muted: #adadb8;
      --rb-purple: #9147ff;
      --rb-purple-hover: #772ce8;
      --rb-purple-press: #5c16c5;
      --rb-focus: #a970ff;
      --rb-link: #bf94ff;
      --rb-ok: #00f593;
      --rb-ok-fill: rgba(0, 245, 147, .12);
      --rb-warn: #ffd37a;
      --rb-warn-fill: rgba(255, 211, 122, .08);
      --rb-warn-edge: rgba(255, 211, 122, .24);
      --rb-danger: #ff6b6b;
      --rb-danger-fill: #eb0400;
      --rb-danger-fill-hover: #bf0000;
      --rb-shadow: 0 6px 16px rgba(0, 0, 0, .4), 0 0 4px rgba(0, 0, 0, .4);
      --rb-font: Inter, Roobert, "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    html.tw-root--theme-light :is(#rb-panel, #rb-fab, .rb-toasts, #rb-guide) {
      --rb-surface: #ffffff;
      --rb-raised: #f2f2f3;
      --rb-sunken: #f7f7f8;
      --rb-deep: #ffffff;
      --rb-hover: rgba(83, 83, 95, .12);
      --rb-press: rgba(83, 83, 95, .2);
      --rb-secondary: rgba(83, 83, 95, .12);
      --rb-line: rgba(0, 0, 0, .12);
      --rb-line-strong: #c8c8d0;
      --rb-text: #0e0e10;
      --rb-muted: #53535f;
      --rb-focus: #772ce8;
      --rb-link: #772ce8;
      --rb-ok: #00804a;
      --rb-ok-fill: rgba(0, 166, 96, .12);
      --rb-warn: #8a5b00;
      --rb-warn-fill: rgba(255, 196, 0, .12);
      --rb-warn-edge: rgba(200, 140, 0, .35);
      --rb-danger: #d40000;
      --rb-shadow: 0 6px 16px rgba(0, 0, 0, .12), 0 0 4px rgba(0, 0, 0, .1);
    }

    /* ---- The paw (toolbar button, floating button, panel header) ---- */
    .rb-paw { display: block; overflow: visible; }
    /* the thin grey edge keeps white and black pads (plenty of flags have them) visible on any background */
    .rb-paw .rb-paw-pad { transition: fill .3s ease; stroke: rgba(127, 127, 127, .6); stroke-width: .7px; paint-order: stroke; }
    .rb-paw .rb-paw-main { fill: var(--rb-pad-0, currentColor) !important; }
    .rb-paw .rb-paw-toe1 { fill: var(--rb-pad-1, currentColor) !important; }
    .rb-paw .rb-paw-toe2 { fill: var(--rb-pad-2, currentColor) !important; }
    .rb-paw .rb-paw-toe3 { fill: var(--rb-pad-3, currentColor) !important; }
    .rb-paw .rb-paw-toe4 { fill: var(--rb-pad-4, currentColor) !important; }
    .rb-entry:is([data-rb-state="idle"], [data-rb-state="paused"]) .rb-paw-pad { fill: currentColor !important; }
    .rb-entry[data-rb-state="paused"] .rb-paw { opacity: .45; }
    .rb-entry .rb-paw { width: 20px; height: 20px; transform-origin: 50% 85%; }
    .rb-entry .rb-paw.rb-wag { animation: rb-wag .55s ease; }
    @keyframes rb-wag { 20% { transform: rotate(-14deg); } 45% { transform: rotate(11deg); } 70% { transform: rotate(-5deg); } }

    /* ---- Entry points ---- */
    .rb-toolbtn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; padding: 0; border: 0; border-radius: 4px;
      background: transparent; color: #efeff1; cursor: pointer;
    }
    .rb-toolbtn:hover { background: rgba(83, 83, 95, .48); }
    .rb-toolbtn:active { background: rgba(83, 83, 95, .55); }
    #rb-toolbtn { flex: none; align-self: center; margin: 0 2px; }
    #rb-toolbtn[aria-expanded="true"] { background: rgba(83, 83, 95, .55); }

    #rb-fab {
      position: fixed; right: 20px; bottom: 20px; z-index: 99999;
      display: inline-flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; padding: 0; border-radius: 8px;
      border: 1px solid var(--rb-line); background: var(--rb-surface); color: var(--rb-text);
      box-shadow: var(--rb-shadow); cursor: pointer;
    }
    #rb-fab:hover { background: var(--rb-raised); }
    #rb-fab:focus-visible, #rb-toolbtn:focus-visible { outline: 2px solid #a970ff; outline-offset: 1px; }

    /* ---- Panel shell ---- */
    #rb-panel {
      position: fixed; z-index: 99999; box-sizing: border-box;
      display: flex; flex-direction: column;
      width: ${PANEL_WIDTH}px; max-height: ${PANEL_MAX_HEIGHT}px;
      background: var(--rb-surface); color: var(--rb-text);
      border: 1px solid var(--rb-line); border-radius: 8px; box-shadow: var(--rb-shadow);
      font: 400 13px/1.5 var(--rb-font); text-align: start; overflow: hidden; outline: none;
      opacity: 0; visibility: hidden; pointer-events: none;
      transform: translateY(6px) scale(.98); transform-origin: bottom right;
      transition: opacity .12s ease, transform .12s ease, visibility 0s linear .12s;
    }
    #rb-panel.rb-below { transform: translateY(-6px) scale(.98); transform-origin: top right; }
    #rb-panel.open {
      opacity: 1; visibility: visible; pointer-events: auto; transform: none;
      transition: opacity .12s ease, transform .12s ease, visibility 0s;
    }
    #rb-panel *, #rb-panel *::before, #rb-panel *::after { box-sizing: border-box; }
    #rb-panel [hidden] { display: none !important; }
    #rb-panel button, #rb-panel input, #rb-panel textarea { font-family: var(--rb-font); letter-spacing: normal; text-transform: none; }
    #rb-panel :is(button, input, textarea):focus-visible { outline: 2px solid var(--rb-focus); outline-offset: -2px; }
    #rb-panel[dir="rtl"] .rb-flip { transform: scaleX(-1); }
    #rb-panel :is(.rb-label-main, .rb-label-sub, .rb-note, .rb-section, .rb-title, .rb-callout-title, .rb-callout-body,
      .rb-confirm-text, .rb-empty, .rb-text-hint, .rb-text-original, .rb-strip-caption > span, .rb-credit, .rb-btn, .rb-meta-text,
      .rb-field-label) {
      unicode-bidi: plaintext;
    }
    /* …but keep lines lined up with the panel's own direction */
    #rb-panel :is(.rb-label-main, .rb-note, .rb-section, .rb-brand .rb-title, .rb-callout-title, .rb-callout-body,
      .rb-confirm-text, .rb-text-hint, .rb-text-original) { text-align: left; }
    #rb-panel[dir="rtl"] :is(.rb-label-main, .rb-note, .rb-section, .rb-brand .rb-title, .rb-callout-title, .rb-callout-body,
      .rb-confirm-text, .rb-text-hint, .rb-text-original) { text-align: right; }

    #rb-panel .rb-accent { flex: none; height: 3px; }
    #rb-panel .rb-head {
      flex: none; display: grid; grid-template-columns: 30px 1fr 30px; align-items: center; gap: 6px;
      padding: 8px 8px 6px; transition: box-shadow .12s ease;
    }
    #rb-panel .rb-head--brand { grid-template-columns: 1fr 30px; padding-inline-start: 14px; }
    #rb-panel.is-scrolled .rb-head { box-shadow: 0 1px 0 var(--rb-line); }
    #rb-panel .rb-title {
      margin: 0; font: 600 14px/1.3 var(--rb-font); color: var(--rb-text); text-align: center;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #rb-panel .rb-brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
    #rb-panel .rb-brand .rb-paw { width: 22px; height: 22px; flex: none; }
    #rb-panel .rb-brand .rb-title { text-align: start; font-size: 15px; font-weight: 700; }
    #rb-panel .rb-toolbar { flex: none; padding: 2px 10px 8px; border-bottom: 1px solid var(--rb-line); }
    #rb-panel .rb-toolbar-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 8px; margin-top: 8px; }
    #rb-panel .rb-toolbar-row .rb-chips { flex: none; flex-wrap: nowrap; }
    #rb-panel .rb-body {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
      padding: 4px 10px 10px;
      scrollbar-width: thin; scrollbar-color: rgba(173, 173, 184, .35) transparent;
    }
    #rb-panel .rb-body::-webkit-scrollbar { width: 8px; }
    #rb-panel .rb-body::-webkit-scrollbar-thumb { background: rgba(173, 173, 184, .35); border-radius: 4px; }
    #rb-panel .rb-body.rb-enter-fwd  { animation: rb-enter-fwd .16s ease; }
    #rb-panel .rb-body.rb-enter-back { animation: rb-enter-back .16s ease; }
    #rb-panel[dir="rtl"] .rb-body.rb-enter-fwd  { animation-name: rb-enter-back; }
    #rb-panel[dir="rtl"] .rb-body.rb-enter-back { animation-name: rb-enter-fwd; }
    @keyframes rb-enter-fwd  { from { opacity: 0; transform: translateX(12px); } }
    @keyframes rb-enter-back { from { opacity: 0; transform: translateX(-12px); } }

    /* ---- Buttons ---- */
    #rb-panel .rb-iconbtn {
      display: inline-flex; align-items: center; justify-content: center; flex: none;
      width: 30px; height: 30px; padding: 0; margin: 0; border: 0; border-radius: 4px;
      background: transparent; color: var(--rb-text); cursor: pointer;
    }
    #rb-panel .rb-iconbtn:hover { background: var(--rb-hover); }
    #rb-panel .rb-iconbtn:active { background: var(--rb-press); }
    #rb-panel .rb-iconbtn .rb-icon { width: 20px; height: 20px; fill: currentColor; }
    #rb-panel .rb-iconbtn--quiet { color: var(--rb-muted); }
    #rb-panel .rb-iconbtn--quiet:hover { color: var(--rb-text); }
    #rb-panel .rb-iconbtn--small { width: 24px; height: 24px; }
    #rb-panel .rb-iconbtn--small .rb-icon { width: 16px; height: 16px; }

    #rb-panel .rb-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px; max-width: 100%;
      height: 30px; margin: 0; padding: 0 10px; border: 0; border-radius: 4px;
      font: 600 13px/1 var(--rb-font); white-space: nowrap; cursor: pointer;
      transition: background-color .1s ease, color .1s ease;
    }
    #rb-panel .rb-btn .rb-icon { width: 20px; height: 20px; fill: currentColor; margin-inline-start: -4px; }
    #rb-panel .rb-btn--secondary { background: var(--rb-secondary); color: var(--rb-text); }
    #rb-panel .rb-btn--secondary:hover { background: var(--rb-hover); }
    #rb-panel .rb-btn--secondary:active { background: var(--rb-press); }
    #rb-panel .rb-btn--secondary.rb-btn--danger { color: var(--rb-danger); }
    #rb-panel .rb-btn--primary { background: var(--rb-purple); color: #fff; }
    #rb-panel .rb-btn--primary:hover { background: var(--rb-purple-hover); }
    #rb-panel .rb-btn--primary:active { background: var(--rb-purple-press); }
    #rb-panel .rb-btn--destructive { background: var(--rb-danger-fill); color: #fff; }
    #rb-panel .rb-btn--destructive:hover { background: var(--rb-danger-fill-hover); }
    #rb-panel .rb-btn--text {
      height: auto; min-height: 28px; padding: 6px 8px; background: transparent; color: var(--rb-link);
      white-space: normal; text-align: start; line-height: 1.3;
    }
    #rb-panel .rb-btn--text:hover { background: var(--rb-hover); }
    #rb-panel .rb-btn--text.rb-btn--danger { color: var(--rb-danger); }
    #rb-panel .rb-btn--block { width: 100%; justify-content: flex-start; }
    #rb-panel .rb-btn:disabled { opacity: .5; cursor: not-allowed; }

    #rb-panel .rb-chip {
      flex: none; height: 24px; white-space: nowrap; margin: 0; padding: 0 10px; border: 0; border-radius: 12px;
      background: var(--rb-secondary); color: var(--rb-text); font: 600 12px/1 var(--rb-font); cursor: pointer;
    }
    #rb-panel .rb-chip:hover { background: var(--rb-hover); }
    #rb-panel .rb-chip[aria-pressed="true"] { background: var(--rb-purple); color: #fff; }

    /* ---- Rows ---- */
    #rb-panel .rb-row {
      position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px;
      width: 100%; min-height: 36px; margin: 0; padding: 6px 8px;
      border: 0; border-radius: 4px; background: transparent;
      color: var(--rb-text); font: inherit; text-align: start; cursor: pointer;
    }
    #rb-panel .rb-row:hover { background: var(--rb-hover); }
    #rb-panel button.rb-row:active { background: var(--rb-press); }
    #rb-panel .rb-row--static { cursor: default; }
    #rb-panel .rb-row--static:hover { background: transparent; }
    #rb-panel .rb-label { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
    #rb-panel .rb-label-main { overflow-wrap: anywhere; }
    #rb-panel .rb-label-sub {
      display: flex; flex-wrap: wrap; align-items: center; column-gap: 6px; min-width: 0;
      color: var(--rb-muted); font-size: 12px; line-height: 1.4; overflow-wrap: anywhere;
    }
    #rb-panel .rb-lead { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1 1 auto; }
    #rb-panel .rb-lead-icon { width: 20px; height: 20px; flex: none; color: var(--rb-muted); fill: currentColor; }
    #rb-panel .rb-row:hover .rb-lead-icon { color: var(--rb-text); }
    #rb-panel .rb-meta {
      display: flex; align-items: center; gap: 2px; flex: 0 1 auto; min-width: 0; max-width: 50%;
      color: var(--rb-muted); font-variant-numeric: tabular-nums;
    }
    #rb-panel .rb-meta-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #rb-panel .rb-meta .rb-icon { width: 20px; height: 20px; fill: currentColor; margin-inline-end: -4px; }

    #rb-panel .rb-section { margin: 10px 8px 2px; font-size: 12px; font-weight: 600; line-height: 1.4; color: var(--rb-muted); }
    #rb-panel .rb-divider { height: 1px; margin: 8px 0; border: 0; background: var(--rb-line); }
    #rb-panel .rb-note { margin: 2px 8px 10px; color: var(--rb-muted); font-size: 12px; line-height: 1.5; }
    #rb-panel .rb-empty { padding: 18px 8px; color: var(--rb-muted); text-align: center; }
    #rb-panel .rb-empty .rb-pup { display: block; width: 56px; height: 56px; margin: 0 auto 8px; }
    #rb-panel .rb-empty .rb-btn { margin-top: 8px; }
    #rb-panel .rb-footer { display: flex; flex-wrap: wrap; gap: 8px; }
    #rb-panel .rb-footer .rb-btn { flex: 1 1 auto; }
    #rb-panel .rb-credit {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin: 12px 0 0; color: var(--rb-muted); font-size: 11px;
    }
    #rb-panel .rb-credit .rb-paw { width: 12px; height: 12px; }

    /* ---- Switch ---- */
    #rb-panel .rb-switch-input {
      position: absolute; width: 1px; height: 1px; margin: 0; padding: 0;
      opacity: 0; pointer-events: none; inset-inline-end: 20px; top: 50%;
    }
    #rb-panel .rb-switch {
      position: relative; flex: none; width: 36px; height: 20px; border-radius: 10px;
      box-shadow: inset 0 0 0 2px var(--rb-muted); transition: background-color .15s ease, box-shadow .15s ease;
    }
    #rb-panel .rb-switch::after {
      content: ''; position: absolute; top: 4px; inset-inline-start: 4px; width: 12px; height: 12px; border-radius: 50%;
      background: var(--rb-muted); transition: transform .15s ease, background-color .15s ease;
    }
    #rb-panel .rb-row:hover .rb-switch-input:not(:checked) + .rb-switch { box-shadow: inset 0 0 0 2px var(--rb-text); }
    #rb-panel .rb-row:hover .rb-switch-input:not(:checked) + .rb-switch::after { background: var(--rb-text); }
    #rb-panel .rb-switch-input:checked + .rb-switch { background: var(--rb-purple); box-shadow: inset 0 0 0 2px var(--rb-purple); }
    #rb-panel .rb-row:hover .rb-switch-input:checked + .rb-switch { background: var(--rb-purple-hover); box-shadow: inset 0 0 0 2px var(--rb-purple-hover); }
    #rb-panel .rb-switch-input:checked + .rb-switch::after { transform: translateX(16px); background: #fff; }
    #rb-panel[dir="rtl"] .rb-switch-input:checked + .rb-switch::after { transform: translateX(-16px); }
    #rb-panel .rb-switch-input:focus-visible + .rb-switch { outline: 2px solid var(--rb-focus); outline-offset: 2px; }

    /* ---- Inputs ---- */
    #rb-panel .rb-input {
      display: block; width: 100%; height: 30px; margin: 0; padding: 0 10px;
      border: 1px solid var(--rb-line-strong); border-radius: 4px;
      background: var(--rb-sunken); color: var(--rb-text); font: 400 13px/1 var(--rb-font);
      transition: border-color .1s ease, box-shadow .1s ease, background-color .1s ease;
    }
    #rb-panel textarea.rb-input {
      height: auto; min-height: 30px; padding: 6px 10px; line-height: 1.4; resize: vertical; field-sizing: content;
    }
    #rb-panel .rb-input:hover { border-color: var(--rb-muted); }
    #rb-panel .rb-input:focus, #rb-panel .rb-input:focus-visible {
      outline: none; border-color: var(--rb-focus); box-shadow: 0 0 0 1px var(--rb-focus); background: var(--rb-deep);
    }
    #rb-panel .rb-input::placeholder { color: var(--rb-muted); opacity: 1; }
    #rb-panel .rb-input--short { width: 140px; flex: none; }
    #rb-panel select.rb-input { width: 100%; padding: 0 6px; cursor: pointer; color-scheme: dark; }
    #rb-panel .rb-field-stack { padding: 2px 8px 6px; }
    html.tw-root--theme-light #rb-panel select.rb-input { color-scheme: light; }
    #rb-panel .rb-search { position: relative; }
    #rb-panel .rb-search > .rb-icon {
      position: absolute; inset-inline-start: 8px; top: 50%; width: 16px; height: 16px; transform: translateY(-50%);
      fill: var(--rb-muted); pointer-events: none;
    }
    #rb-panel .rb-search .rb-input { padding-inline: 30px; }
    #rb-panel .rb-input::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
    #rb-panel .rb-search-clear {
      position: absolute; inset-inline-end: 4px; top: 50%; transform: translateY(-50%);
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; padding: 0; border: 0; border-radius: 4px;
      background: transparent; color: var(--rb-muted); cursor: pointer;
    }
    #rb-panel .rb-search-clear:hover { background: var(--rb-hover); color: var(--rb-text); }
    #rb-panel .rb-search-clear .rb-icon { width: 16px; height: 16px; fill: currentColor; }
    #rb-panel:is([data-view="badges"], [data-view="text"], [data-view="palettes"]) { height: 100vh; } /* clamped by max-height; stops resizing as you filter */
    #rb-panel .rb-toolbar .rb-note { margin: 8px 0 0; }
    #rb-panel .rb-toolbar-row .rb-note { margin: 0; }

    #rb-panel .rb-number {
      width: 56px; flex: none; padding: 0 4px; text-align: center; font-variant-numeric: tabular-nums;
      -moz-appearance: textfield; appearance: textfield;
    }
    #rb-panel .rb-number::-webkit-inner-spin-button, #rb-panel .rb-number::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

    #rb-panel .rb-range {
      --rb-fill: 50%;
      display: block; width: 100%; height: 20px; margin: 6px 0 0; padding: 0;
      background: transparent; cursor: pointer; -webkit-appearance: none; appearance: none;
    }
    #rb-panel .rb-range:focus-visible { outline: none; }
    #rb-panel .rb-range::-webkit-slider-runnable-track {
      height: 4px; border-radius: 2px;
      background: linear-gradient(to right, var(--rb-purple) var(--rb-fill), var(--rb-line-strong) var(--rb-fill));
    }
    #rb-panel[dir="rtl"] .rb-range::-webkit-slider-runnable-track {
      background: linear-gradient(to left, var(--rb-purple) var(--rb-fill), var(--rb-line-strong) var(--rb-fill));
    }
    #rb-panel .rb-range::-webkit-slider-thumb {
      -webkit-appearance: none; width: 14px; height: 14px; margin-top: -5px; border: 0; border-radius: 50%;
      background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .5);
    }
    #rb-panel .rb-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--rb-focus); }
    #rb-panel .rb-range::-moz-range-track { height: 4px; border-radius: 2px; background: var(--rb-line-strong); }
    #rb-panel .rb-range::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--rb-purple); }
    #rb-panel .rb-range::-moz-range-thumb {
      width: 14px; height: 14px; border: 0; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .5);
    }
    #rb-panel .rb-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px var(--rb-focus); }

    /* ---- Color bits ---- */
    #rb-panel .rb-swatch {
      display: inline-block; width: 10px; height: 10px; flex: none; border-radius: 50%;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .18);
    }
    #rb-panel .rb-hex { font-variant-numeric: tabular-nums; }
    #rb-panel .rb-mini-strip { display: flex; width: 48px; height: 8px; border-radius: 4px; overflow: hidden; margin-inline-end: 4px; }
    #rb-panel .rb-mini-strip span, #rb-panel .rb-strip span { flex: 1 1 0; min-width: 0; }

    #rb-panel .rb-strip-wrap { position: relative; margin: 4px 8px 0; padding: 14px 0 4px; }
    #rb-panel .rb-strip { display: flex; height: 24px; border-radius: 4px; overflow: hidden; }
    #rb-panel .rb-strip--stepped { gap: 1px; }
    #rb-panel .rb-strip-marker {
      position: absolute; top: 0; bottom: 0; width: 0; pointer-events: none;
      transition: inset-inline-start .2s ease;
    }
    #rb-panel .rb-strip-marker::after {
      content: ''; position: absolute; top: 14px; bottom: 4px; inset-inline-start: -2px; width: 4px; border-radius: 2px;
      background: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .65);
    }
    #rb-panel .rb-strip-pin {
      position: absolute; top: 0; inset-inline-start: -10px; width: 20px; height: 20px; border-radius: 50%; z-index: 1;
      display: flex; align-items: center; justify-content: center;
      background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .5);
    }
    #rb-panel .rb-strip-pin .rb-paw { width: 13px; height: 13px; color: #772ce8; }
    #rb-panel .rb-strip-caption {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      margin: 6px 8px 8px; color: var(--rb-muted); font-size: 12px;
    }
    #rb-panel .rb-strip-caption .rb-chip-color { color: var(--rb-text); }
    #rb-panel .rb-chip-color { display: inline-flex; align-items: center; gap: 6px; }

    #rb-panel .rb-setting { padding: 8px 8px 6px; }
    #rb-panel .rb-setting-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

    /* ---- Status ---- */
    #rb-panel .rb-callout {
      display: flex; gap: 10px; align-items: flex-start; margin: 2px 0 8px; padding: 10px;
      border-radius: 6px; background: var(--rb-warn-fill); box-shadow: inset 0 0 0 1px var(--rb-warn-edge);
    }
    #rb-panel .rb-callout--paused { background: rgba(145, 71, 255, .1); box-shadow: inset 0 0 0 1px rgba(145, 71, 255, .4); }
    #rb-panel .rb-callout .rb-pup { flex: none; width: 36px; height: 36px; }
    #rb-panel .rb-callout-title { font-weight: 600; }
    #rb-panel .rb-callout-body { color: var(--rb-muted); font-size: 12px; }
    #rb-panel .rb-callout .rb-btn { margin: 6px 0 0; margin-inline-start: -8px; }

    #rb-panel .rb-pill {
      display: inline-flex; align-items: center; flex: none; height: 20px; padding: 0 8px; border-radius: 10px;
      font-size: 12px; font-weight: 600; line-height: 1; white-space: nowrap; font-variant-numeric: tabular-nums;
    }
    #rb-panel .rb-pill--ok   { background: var(--rb-ok-fill); color: var(--rb-ok); }
    #rb-panel .rb-pill--wait { background: var(--rb-warn-fill); color: var(--rb-warn); box-shadow: inset 0 0 0 1px var(--rb-warn-edge); }

    #rb-panel .rb-badge-img { width: 18px; height: 18px; flex: none; border-radius: 2px; }
    #rb-panel .rb-badge-img--blank { background: var(--rb-secondary); }
    #rb-panel .rb-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
    #rb-panel .rb-hash { align-items: flex-start; }
    #rb-panel .rb-hash .rb-pill { margin-top: 2px; }
    #rb-panel .rb-hash .rb-label-sub { white-space: normal; display: block; }

    #rb-panel .rb-confirm-text { margin: 4px 8px 16px; color: var(--rb-text); }
    #rb-panel .rb-confirm-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; padding: 0 8px 2px; }

    /* ---- Message preview ---- */
    #rb-panel .rb-preview {
      margin: 2px 0 8px; padding: 7px 10px; border-radius: 6px; overflow-wrap: anywhere;
      background: var(--rb-sunken); box-shadow: inset 0 0 0 1px var(--rb-line);
      font-size: 13px; line-height: 20px; unicode-bidi: plaintext;
    }
    #rb-panel .rb-preview .rb-badge-img { display: inline-block; vertical-align: middle; margin-inline-end: 4px; margin-top: -2px; }
    #rb-panel .rb-preview-name { font-weight: 700; }

    /* ---- Badge list ---- */
    #rb-panel .rb-pn-preview { display: block; line-height: 1.9; }
    #rb-panel .rb-pn-line { overflow-wrap: anywhere; }
    #rb-panel .rb-pn-name { font-weight: 700; }
    #rb-panel .rb-field-controls { display: inline-flex; flex: none; align-items: center; gap: 6px; }
    #rb-panel select.rb-select-inline { width: 160px; flex: none; }
    #rb-panel .rb-color-input {
      flex: none; width: 30px; height: 30px; margin: 0; padding: 2px; border: 1px solid var(--rb-line-strong); border-radius: 4px;
      background: var(--rb-sunken); cursor: pointer;
    }
    #rb-panel .rb-note--warn { color: var(--rb-warn); }
    html.tw-root--theme-light #rb-panel .rb-note--warn { color: #6b4a00; }
    #rb-panel .rb-diag-text { width: 100%; margin-top: 6px; font: 11px/1.4 ui-monospace, Menlo, Consolas, monospace; resize: vertical; }
    #rb-panel .rb-extras { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    #rb-panel .rb-extras-label { margin-top: 12px; }
    #rb-panel .rb-extras .rb-chip { font-family: ui-monospace, Menlo, Consolas, monospace; font-weight: 500; }
    #rb-panel .rb-quick { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 8px; }
    #rb-panel .rb-chip--icon { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 10px 0 8px; border-radius: 14px; }
    #rb-panel .rb-chip--icon .rb-icon { width: 16px; height: 16px; fill: currentColor; }
    #rb-panel .rb-chip--icon:not([aria-pressed="true"]) .rb-icon { color: var(--rb-muted); }
    #rb-panel select.rb-quick-palette { flex: 1 1 120px; width: auto; min-width: 0; height: 28px; border-radius: 14px; padding: 0 8px; }
    #rb-panel .rb-scope { justify-content: flex-start; gap: 6px; }
    #rb-panel .rb-scope .rb-chip { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
    #rb-panel .rb-iconbtn--chip { flex: none; border-radius: 12px; background: var(--rb-secondary); color: var(--rb-text); }
    #rb-panel .rb-iconbtn[aria-disabled="true"] { opacity: .3; cursor: default; background: transparent; }
    #rb-panel .rb-sort-row { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 1px 4px; border-radius: 4px; }
    #rb-panel .rb-sort-row.is-dragging { background: var(--rb-raised); box-shadow: inset 0 0 0 1px var(--rb-purple); }
    #rb-panel .rb-sort-row.is-off .rb-badge-img, #rb-panel .rb-sort-row.is-off .rb-sort-name { opacity: .45; }
    #rb-panel .rb-sort-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
    #rb-panel .rb-sort-row .rb-iconbtn { flex: none; }
    #rb-panel .rb-grip {
      display: inline-flex; flex: none; align-items: center; justify-content: center; width: 26px; height: 30px; border-radius: 4px;
      color: var(--rb-muted); cursor: grab; touch-action: none;
    }
    #rb-panel .rb-grip .rb-icon { width: 18px; height: 18px; fill: currentColor; }
    #rb-panel .rb-grip:hover, #rb-panel .rb-sort-row.is-dragging .rb-grip { color: var(--rb-text); background: var(--rb-hover); }
    #rb-panel .rb-sort-list.is-sorting, #rb-panel .rb-sort-list.is-sorting .rb-grip { cursor: grabbing; user-select: none; }
    #rb-panel .rb-badge-line { display: flex; align-items: center; }
    #rb-panel .rb-badge-line > .rb-row { flex: 1 1 auto; min-width: 0; width: auto; padding-inline-start: 6px; }
    #rb-panel .rb-mark { width: 26px; height: 30px; color: var(--rb-muted); opacity: .55; }
    #rb-panel .rb-mark:hover, #rb-panel .rb-mark:focus-visible { opacity: 1; color: var(--rb-text); }
    #rb-panel .rb-mark .rb-icon { width: 18px; height: 18px; }
    #rb-panel .rb-mark[aria-pressed="true"] { opacity: 1; }
    #rb-panel .rb-mark[aria-pressed="true"] .rb-icon path { fill: currentColor; }
    #rb-panel .rb-mark--star[aria-pressed="true"] { color: #ffca5f; }
    #rb-panel .rb-mark--pin[aria-pressed="true"] { color: var(--rb-link); }
    html.tw-root--theme-light #rb-panel .rb-mark--star[aria-pressed="true"] { color: #c98a00; }
    #rb-panel .rb-chips { display: flex; flex-wrap: wrap; gap: 6px; }

    /* ---- Palettes ---- */
    #rb-panel .rb-flag {
      display: flex; flex: none; width: 44px; height: 14px; border-radius: 3px; overflow: hidden;
      box-shadow: 0 0 0 1px var(--rb-line-strong);
    }
    #rb-panel .rb-flag span { flex: 1 1 0; min-width: 0; }
    #rb-panel .rb-flag--empty { background: var(--rb-secondary); }
    #rb-panel .rb-palette.is-selected { background: var(--rb-secondary); }
    #rb-panel .rb-palette.is-selected .rb-label-main { font-weight: 600; }
    #rb-panel .rb-palette-check { flex: none; width: 20px; height: 20px; fill: var(--rb-link); }

    /* ---- Snippets ---- */
    #rb-panel .rb-snippet .rb-kbd { flex: none; max-width: 45%; }
    #rb-panel .rb-snippet-text {
      flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--rb-muted); font-size: 12px; unicode-bidi: plaintext;
    }
    #rb-panel .rb-snippet.is-warn .rb-snippet-text { color: var(--rb-warn); }
    #rb-panel .rb-field { padding: 6px 8px; }
    #rb-panel .rb-field-label { display: block; margin-bottom: 4px; font-size: 12px; font-weight: 600; color: var(--rb-muted); }
    #rb-panel .rb-editor-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 8px 2px; }
    #rb-panel .rb-editor-actions .rb-spacer { flex: 1 1 auto; }

    /* ---- Chat shortcuts ---- */
    #rb-panel .rb-shortcuts {
      display: grid; grid-template-columns: minmax(0, max-content) 1fr; gap: 10px 12px; align-items: baseline;
      margin: 0; padding: 6px 8px; transition: opacity .15s ease;
    }
    #rb-panel .rb-shortcuts.is-off { opacity: .5; }
    #rb-panel .rb-shortcuts dt, #rb-panel .rb-shortcuts dd { margin: 0; min-width: 0; }
    #rb-panel .rb-shortcuts dd { color: var(--rb-muted); font-size: 12px; line-height: 1.5; unicode-bidi: plaintext; }
    #rb-panel .rb-kbd {
      display: inline-block; max-width: 100%; padding: 1px 7px; border-radius: 4px; overflow-wrap: anywhere;
      background: var(--rb-secondary); color: var(--rb-text);
      font: 600 12px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    /* ---- Language & text ---- */
    #rb-panel .rb-field-row .rb-label-main { white-space: normal; }
    #rb-panel .rb-text-entry { position: relative; padding: 4px 8px; }
    #rb-panel .rb-text-entry.is-changed .rb-text-field { border-inline-start: 3px solid var(--rb-purple); }
    #rb-panel .rb-text-meta {
      display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 4px;
      color: var(--rb-muted); font-size: 11px; line-height: 1.4;
    }
    #rb-panel .rb-text-original { min-width: 0; overflow-wrap: anywhere; }
    #rb-panel .rb-text-revert {
      flex: none; margin: 0; padding: 0; border: 0; background: none; color: var(--rb-link);
      font: 600 11px/1.4 var(--rb-font); cursor: pointer;
    }
    #rb-panel .rb-text-revert:hover { text-decoration: underline; }
    #rb-panel .rb-text-hint { margin-top: 4px; color: var(--rb-muted); font-size: 11px; line-height: 1.4; }
    #rb-panel .rb-text-hint.is-warn { color: var(--rb-warn); }
    #rb-panel .rb-text-group + .rb-text-group { margin-top: 6px; }

    /* ---- Walkthrough: tour pages (in the panel) ---- */
    #rb-panel .rb-tour { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 12px 16px; text-align: center; }
    #rb-panel .rb-tour .rb-pup { width: 60px; height: 60px; }
    #rb-panel .rb-tour-dots { display: flex; gap: 6px; margin: 2px 0 6px; }
    #rb-panel .rb-tour-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--rb-line-strong); }
    #rb-panel .rb-tour-dots span.is-on { background: var(--rb-purple); }
    #rb-panel .rb-tour-title { margin: 0; font-size: 16px; font-weight: 700; line-height: 1.3; text-wrap: balance; unicode-bidi: plaintext; }
    #rb-panel .rb-tour-body { margin: 0 0 8px; color: var(--rb-muted); text-wrap: pretty; unicode-bidi: plaintext; }
    #rb-panel .rb-tour-open { gap: 4px; padding-inline-end: 6px; }
    #rb-panel .rb-tour-open .rb-icon { width: 18px; height: 18px; fill: currentColor; }
    #rb-panel .rb-btn:disabled { opacity: .45; cursor: default; }

    /* ---- Walkthrough: setup guide (a card beside the chat) ---- */
    #rb-guide {
      position: fixed; z-index: 99998; box-sizing: border-box; width: 300px; padding: 15px 14px 12px; overflow: hidden;
      background: var(--rb-surface); color: var(--rb-text); border: 1px solid var(--rb-line); border-radius: 8px; box-shadow: var(--rb-shadow);
      font: 400 13px/1.5 var(--rb-font); text-align: start; animation: rb-guide-in .22s ease both;
    }
    #rb-guide::before {
      content: ''; position: absolute; inset: 0 0 auto 0; height: 3px;
      background: linear-gradient(90deg, #ee2b2b, #f5a623, #5ad12b, #2ba8ee, #9147ff);
    }
    #rb-guide * { box-sizing: border-box; }
    #rb-guide :is(.rb-guide-title, .rb-guide-text, .rb-guide-warn, .rb-guide-step-title, .rb-guide-step-how, .rb-guide-progress) { unicode-bidi: plaintext; text-align: start; }
    #rb-guide .rb-guide-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    #rb-guide .rb-pup { flex: none; width: 40px; height: 40px; }
    #rb-guide .rb-guide-title { flex: 1 1 auto; min-width: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
    #rb-guide .rb-guide-x {
      display: inline-flex; flex: none; align-items: center; justify-content: center; width: 28px; height: 28px; margin: 0; padding: 0;
      border: 0; border-radius: 4px; background: transparent; color: var(--rb-muted); cursor: pointer;
    }
    #rb-guide .rb-guide-x:hover { background: var(--rb-hover); color: var(--rb-text); }
    #rb-guide .rb-guide-x .rb-icon { width: 18px; height: 18px; fill: currentColor; }
    #rb-guide .rb-guide-text { margin: 0 0 10px; color: var(--rb-muted); }
    #rb-guide .rb-guide-warn {
      margin: 0 0 10px; padding: 6px 8px; border-radius: 4px;
      background: var(--rb-warn-fill); color: var(--rb-warn); box-shadow: inset 0 0 0 1px var(--rb-warn-edge);
    }
    #rb-guide .rb-guide-steps { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
    #rb-guide .rb-guide-step { display: flex; gap: 10px; margin: 0; padding: 7px 8px; border-radius: 6px; }
    #rb-guide .rb-guide-step.is-current { background: var(--rb-secondary); }
    #rb-guide .rb-guide-mark {
      display: inline-flex; flex: none; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%;
      background: var(--rb-secondary); color: var(--rb-text); font-size: 12px; font-weight: 700; line-height: 1;
    }
    #rb-guide .is-current .rb-guide-mark { background: var(--rb-purple); color: #fff; }
    #rb-guide .is-done .rb-guide-mark { background: var(--rb-ok-fill); color: var(--rb-ok); }
    #rb-guide .rb-guide-mark .rb-icon { width: 14px; height: 14px; fill: currentColor; }
    #rb-guide .rb-guide-step-text { flex: 1 1 auto; min-width: 0; }
    #rb-guide .rb-guide-step-title { font-weight: 600; }
    #rb-guide .is-done .rb-guide-step-title, #rb-guide .is-todo .rb-guide-step-title { color: var(--rb-muted); }
    #rb-guide .rb-guide-step-how { margin-top: 2px; color: var(--rb-muted); font-size: 12px; }
    html.tw-root--theme-light #rb-guide .rb-guide-warn { color: #6b4a00; }
    #rb-guide .rb-guide-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }
    #rb-guide .rb-guide-progress { color: var(--rb-muted); font-size: 12px; }
    #rb-guide .rb-guide-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    #rb-guide .rb-guide-btn {
      min-height: 30px; margin: 0; padding: 4px 12px; border: 0; border-radius: 4px;
      background: var(--rb-secondary); color: var(--rb-text); font: 600 13px/1.3 var(--rb-font); cursor: pointer;
    }
    #rb-guide .rb-guide-btn:hover { background: var(--rb-hover); }
    #rb-guide .rb-guide-btn--primary { background: var(--rb-purple); color: #fff; }
    #rb-guide .rb-guide-btn--primary:hover { background: var(--rb-purple-hover); }
    #rb-guide .rb-guide-btn--quiet { padding: 4px 8px; background: transparent; color: var(--rb-link); }
    #rb-guide button:focus-visible { outline: 2px solid var(--rb-focus); outline-offset: 1px; }
    #rb-guide-ring {
      position: fixed; z-index: 99998; display: none; box-sizing: border-box; border-radius: 6px; pointer-events: none;
      box-shadow: 0 0 0 2px #a970ff, 0 0 0 5px rgba(169, 112, 255, .4); animation: rb-guide-ring 1.5s ease-in-out infinite;
    }
    @keyframes rb-guide-in { from { opacity: 0; transform: translateY(8px); } }
    @keyframes rb-guide-ring { 50% { box-shadow: 0 0 0 2px #a970ff, 0 0 0 11px rgba(169, 112, 255, 0); } }

    /* ---- Toasts ---- */
    .rb-toasts {
      position: fixed; top: 60px; left: 50%; transform: translateX(-50%); z-index: 100000;
      display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
    }
    .rb-toast {
      display: flex; align-items: center; gap: 8px; max-width: 320px; unicode-bidi: plaintext; padding: 8px 12px; padding-inline-start: 10px;
      border: 1px solid var(--rb-line); border-radius: 6px; background: var(--rb-surface); color: var(--rb-text);
      box-shadow: var(--rb-shadow); font: 600 13px/1.4 var(--rb-font);
      animation: rb-toast-in .18s ease both;
    }
    .rb-toast .rb-icon, .rb-toast .rb-paw { flex: none; width: 18px; height: 18px; }
    .rb-toast--ok .rb-paw { color: var(--rb-link); fill: currentColor; }
    .rb-toast--error .rb-icon { fill: var(--rb-danger); }
    .rb-toast--out { animation: rb-toast-out .2s ease forwards; }
    @keyframes rb-toast-in { from { opacity: 0; transform: translateY(-6px); } }
    @keyframes rb-toast-out { to { opacity: 0; transform: translateY(-6px); } }

    @media (prefers-reduced-motion: reduce) {
      #rb-panel, #rb-panel *, .rb-toast, .rb-entry .rb-paw, .rb-paw .rb-paw-pad, #rb-guide, #rb-guide-ring { transition: none !important; animation: none !important; }
    }
  `;

  return STYLES;
};
