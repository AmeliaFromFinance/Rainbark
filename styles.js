/*
 * Rainbark: styles.
 *
 * Loaded just before page.js, which adds it to the page once. A function, so the panel size can be passed in.
 * Always dark, with a light pink accent. Everything is scoped to Rainbark's own elements.
 */
(window.__rainbarkParts = window.__rainbarkParts || {}).styles = ({ PANEL_WIDTH, PANEL_MAX_HEIGHT }) => {

  const STYLES = `
    #rb-panel, #rb-fab, .rb-toasts, #rb-guide {
      --rb-surface: #16121a;
      --rb-acrylic: rgba(22, 18, 26, .9);
      --rb-card: rgba(255, 255, 255, .045);
      --rb-card-hover: rgba(255, 255, 255, .075);
      --rb-card-press: rgba(255, 255, 255, .055);
      --rb-subtle: rgba(255, 255, 255, .06);
      --rb-subtle-hover: rgba(255, 255, 255, .1);
      --rb-stroke: rgba(255, 255, 255, .075);
      --rb-stroke-strong: rgba(255, 255, 255, .16);
      --rb-field: rgba(0, 0, 0, .3);
      --rb-text: #f7f0f5;
      --rb-muted: #b4a9b3;
      --rb-faint: #85798a;
      --rb-accent: #ffb3d1;
      --rb-accent-hover: #ffc8de;
      --rb-accent-press: #f39cc0;
      --rb-accent-soft: rgba(255, 179, 209, .13);
      --rb-accent-line: rgba(255, 179, 209, .4);
      --rb-on-accent: #3b0d24;
      --rb-ok: #8be3bd;
      --rb-ok-fill: rgba(139, 227, 189, .12);
      --rb-warn: #ffd68a;
      --rb-warn-fill: rgba(255, 214, 138, .09);
      --rb-warn-edge: rgba(255, 214, 138, .26);
      --rb-danger: #ff9494;
      --rb-danger-fill: #e5484d;
      --rb-danger-fill-hover: #cf3b40;
      --rb-shadow: 0 24px 60px rgba(0, 0, 0, .55), 0 4px 14px rgba(0, 0, 0, .35);
      --rb-font: "Segoe UI Variable Text", "Segoe UI", Inter, Roobert, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
      --rb-mono: ui-monospace, "Cascadia Code", SFMono-Regular, Menlo, Consolas, monospace;
      --rb-ease: cubic-bezier(.16, 1, .3, 1);
    }

    /* ---- Paw (toolbar button, floating button, panel header) ---- */
    .rb-paw { display: block; overflow: visible; }
    /* a thin grey edge keeps white and black pads visible on any background */
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
      width: 30px; height: 30px; padding: 0; border: 0; border-radius: 6px;
      background: transparent; color: #efeff1; cursor: pointer;
    }
    .rb-toolbtn:hover { background: rgba(255, 255, 255, .1); }
    .rb-toolbtn:active { background: rgba(255, 255, 255, .14); }
    #rb-toolbtn { flex: none; align-self: center; margin: 0 2px; }
    #rb-toolbtn[aria-expanded="true"] { background: rgba(255, 179, 209, .16); }
    #rb-fab {
      position: fixed; right: 20px; bottom: 20px; z-index: 99999;
      display: inline-flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; padding: 0; border-radius: 12px;
      border: 1px solid var(--rb-stroke-strong); background: var(--rb-surface); color: var(--rb-text);
      box-shadow: var(--rb-shadow); cursor: pointer; transition: transform .15s var(--rb-ease), background-color .15s ease;
    }
    #rb-fab:hover { background: #211b26; transform: translateY(-1px); }
    #rb-fab:focus-visible, #rb-toolbtn:focus-visible { outline: 2px solid #ffb3d1; outline-offset: 2px; }

    /* ---- Panel shell: acrylic surface, soft depth ---- */
    #rb-panel {
      position: fixed; z-index: 99999; box-sizing: border-box;
      display: flex; flex-direction: column;
      width: ${PANEL_WIDTH}px; max-height: ${PANEL_MAX_HEIGHT}px;
      background: var(--rb-acrylic); color: var(--rb-text);
      -webkit-backdrop-filter: blur(28px) saturate(1.4); backdrop-filter: blur(28px) saturate(1.4);
      border: 1px solid var(--rb-stroke-strong); border-radius: 14px; box-shadow: var(--rb-shadow);
      font: 400 13px/1.45 var(--rb-font); text-align: start; overflow: hidden; outline: none;
      opacity: 0; visibility: hidden; pointer-events: none;
      transform: translateY(8px) scale(.98); transform-origin: bottom right;
      transition: opacity .16s ease, transform .22s var(--rb-ease), visibility 0s linear .16s;
    }
    #rb-panel.rb-below { transform: translateY(-8px) scale(.98); transform-origin: top right; }
    #rb-panel.open {
      opacity: 1; visibility: visible; pointer-events: auto; transform: none;
      transition: opacity .16s ease, transform .22s var(--rb-ease), visibility 0s;
    }
    #rb-panel *, #rb-panel *::before, #rb-panel *::after { box-sizing: border-box; }
    #rb-panel [hidden] { display: none !important; }
    #rb-panel button, #rb-panel input, #rb-panel textarea, #rb-panel select { font-family: var(--rb-font); letter-spacing: normal; text-transform: none; }
    #rb-panel :is(button, input, textarea, select):focus-visible { outline: 2px solid var(--rb-accent); outline-offset: -2px; }
    #rb-panel :is(.rb-label-main, .rb-label-sub, .rb-note, .rb-section, .rb-callout-title, .rb-callout-body, .rb-confirm-text, .rb-empty, .rb-btn) {
      unicode-bidi: plaintext;
    }

    /* the palette in use, as a faint glow along the top edge */
    #rb-panel .rb-accent { flex: none; height: 2px; opacity: .85; }
    #rb-panel .rb-head {
      flex: none; display: grid; grid-template-columns: 32px 1fr 32px; align-items: center; gap: 6px;
      padding: 10px 10px 8px; transition: box-shadow .15s ease;
    }
    #rb-panel .rb-head--brand { grid-template-columns: 1fr 32px; padding-inline-start: 14px; }
    #rb-panel.is-scrolled .rb-head { box-shadow: 0 1px 0 var(--rb-stroke); }
    #rb-panel .rb-title {
      margin: 0; font: 600 14px/1.3 var(--rb-font); color: var(--rb-text); text-align: center;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #rb-panel .rb-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
    #rb-panel .rb-brand-mark {
      display: inline-flex; align-items: center; justify-content: center; flex: none;
      width: 30px; height: 30px; border-radius: 9px; background: var(--rb-subtle); box-shadow: inset 0 0 0 1px var(--rb-stroke);
    }
    #rb-panel .rb-brand .rb-paw { width: 20px; height: 20px; }
    #rb-panel .rb-brand .rb-title { text-align: start; font-size: 15px; font-weight: 650; letter-spacing: -.01em; flex: 0 1 auto; }
    #rb-panel .rb-status {
      display: inline-flex; align-items: center; gap: 6px; flex: none; height: 22px; padding: 0 9px 0 8px; border-radius: 11px;
      font-size: 11.5px; font-weight: 600; line-height: 1; white-space: nowrap;
      background: var(--rb-subtle); color: var(--rb-muted);
    }
    #rb-panel .rb-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    #rb-panel .rb-status--live { background: var(--rb-accent-soft); color: var(--rb-accent); }
    #rb-panel .rb-status--live::before { box-shadow: 0 0 0 3px rgba(255, 179, 209, .22); animation: rb-pulse 2.4s ease-in-out infinite; }
    #rb-panel .rb-status--setup { background: var(--rb-warn-fill); color: var(--rb-warn); }
    @keyframes rb-pulse { 50% { box-shadow: 0 0 0 5px rgba(255, 179, 209, 0); } }

    #rb-panel .rb-toolbar { flex: none; padding: 0 12px 10px; border-bottom: 1px solid var(--rb-stroke); }
    #rb-panel .rb-toolbar-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 8px; margin-top: 8px; }
    #rb-panel .rb-toolbar-row .rb-chips { flex: none; flex-wrap: nowrap; }
    #rb-panel .rb-toolbar .rb-note { margin: 8px 0 0; }
    #rb-panel .rb-toolbar-row .rb-note { margin: 0; }
    #rb-panel .rb-body {
      flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
      padding: 4px 12px 12px;
      scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, .18) transparent;
    }
    #rb-panel .rb-body::-webkit-scrollbar { width: 8px; }
    #rb-panel .rb-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, .18); border-radius: 4px; border: 2px solid transparent; background-clip: padding-box; }
    #rb-panel .rb-body.rb-enter-fwd  { animation: rb-enter-fwd .22s var(--rb-ease); }
    #rb-panel .rb-body.rb-enter-back { animation: rb-enter-back .22s var(--rb-ease); }
    @keyframes rb-enter-fwd  { from { opacity: 0; transform: translateX(14px); } }
    @keyframes rb-enter-back { from { opacity: 0; transform: translateX(-14px); } }
    /* lists that filter keep their height so the panel doesn't jump */
    #rb-panel:is([data-view="badges"], [data-view="palettes"]) { height: 100vh; }

    /* ---- Buttons ---- */
    #rb-panel .rb-iconbtn {
      display: inline-flex; align-items: center; justify-content: center; flex: none;
      width: 32px; height: 32px; padding: 0; margin: 0; border: 0; border-radius: 8px;
      background: transparent; color: var(--rb-text); cursor: pointer; transition: background-color .12s ease, color .12s ease;
    }
    #rb-panel .rb-iconbtn:hover { background: var(--rb-subtle-hover); }
    #rb-panel .rb-iconbtn:active { background: var(--rb-subtle); }
    #rb-panel .rb-iconbtn .rb-icon { width: 18px; height: 18px; fill: currentColor; }
    #rb-panel .rb-iconbtn--quiet { color: var(--rb-muted); }
    #rb-panel .rb-iconbtn--quiet:hover { color: var(--rb-text); }
    #rb-panel .rb-iconbtn--small { width: 26px; height: 26px; }
    #rb-panel .rb-iconbtn--small .rb-icon { width: 16px; height: 16px; }
    #rb-panel .rb-iconbtn--chip { flex: none; border-radius: 13px; background: var(--rb-subtle); color: var(--rb-text); }
    #rb-panel .rb-iconbtn[aria-disabled="true"] { opacity: .3; cursor: default; background: transparent; }

    #rb-panel .rb-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px; max-width: 100%;
      height: 32px; margin: 0; padding: 0 14px; border: 0; border-radius: 8px;
      font: 600 13px/1 var(--rb-font); white-space: nowrap; cursor: pointer;
      transition: background-color .12s ease, color .12s ease, box-shadow .12s ease;
    }
    #rb-panel .rb-btn .rb-icon { width: 17px; height: 17px; fill: currentColor; margin-inline-start: -3px; }
    #rb-panel .rb-btn--secondary { background: var(--rb-subtle); color: var(--rb-text); box-shadow: inset 0 0 0 1px var(--rb-stroke); }
    #rb-panel .rb-btn--secondary:hover { background: var(--rb-subtle-hover); }
    #rb-panel .rb-btn--secondary:active { background: var(--rb-subtle); color: var(--rb-muted); }
    #rb-panel .rb-btn--secondary.rb-btn--danger { color: var(--rb-danger); }
    #rb-panel .rb-btn--primary { background: var(--rb-accent); color: var(--rb-on-accent); box-shadow: inset 0 -1px 0 rgba(0, 0, 0, .12); }
    #rb-panel .rb-btn--primary:hover { background: var(--rb-accent-hover); }
    #rb-panel .rb-btn--primary:active { background: var(--rb-accent-press); }
    #rb-panel .rb-btn--destructive { background: var(--rb-danger-fill); color: #fff; }
    #rb-panel .rb-btn--destructive:hover { background: var(--rb-danger-fill-hover); }
    #rb-panel .rb-btn--text {
      height: auto; min-height: 30px; padding: 6px 8px; background: transparent; color: var(--rb-accent);
      white-space: normal; text-align: start; line-height: 1.3;
    }
    #rb-panel .rb-btn--text:hover { background: var(--rb-accent-soft); }
    #rb-panel .rb-btn--text.rb-btn--danger { color: var(--rb-danger); }
    #rb-panel .rb-btn--text.rb-btn--danger:hover { background: rgba(255, 148, 148, .1); }
    #rb-panel .rb-btn--block { display: flex; width: 100%; margin-top: 10px; }
    #rb-panel .rb-btn:disabled { opacity: .45; cursor: not-allowed; }

    #rb-panel .rb-chip {
      flex: none; height: 26px; white-space: nowrap; margin: 0; padding: 0 11px; border: 0; border-radius: 13px;
      background: var(--rb-subtle); color: var(--rb-text); font: 600 12px/1 var(--rb-font); cursor: pointer;
      box-shadow: inset 0 0 0 1px var(--rb-stroke); transition: background-color .12s ease, color .12s ease, box-shadow .12s ease;
    }
    #rb-panel .rb-chip:hover { background: var(--rb-subtle-hover); }
    #rb-panel .rb-chip[aria-pressed="true"] { background: var(--rb-accent-soft); color: var(--rb-accent); box-shadow: inset 0 0 0 1px var(--rb-accent-line); }
    #rb-panel .rb-chips { display: flex; flex-wrap: wrap; gap: 6px; }

    /* ---- Cards and rows ---- */
    #rb-panel .rb-section {
      margin: 16px 4px 6px; font-size: 11.5px; font-weight: 600; line-height: 1.4; letter-spacing: .02em; color: var(--rb-faint);
    }
    #rb-panel .rb-group {
      border-radius: 10px; background: var(--rb-card); box-shadow: inset 0 0 0 1px var(--rb-stroke); overflow: hidden;
    }
    #rb-panel .rb-group + .rb-group { margin-top: 8px; }
    #rb-panel .rb-group > * + * { box-shadow: 0 -1px 0 var(--rb-stroke); }
    #rb-panel .rb-group > .rb-row, #rb-panel .rb-group > .rb-badge-line { border-radius: 0; }

    #rb-panel .rb-row {
      position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px;
      width: 100%; min-height: 44px; margin: 0; padding: 8px 12px;
      border: 0; border-radius: 8px; background: transparent;
      color: var(--rb-text); font: inherit; text-align: start; cursor: pointer; transition: background-color .12s ease;
    }
    #rb-panel .rb-row:hover { background: var(--rb-card-hover); }
    #rb-panel button.rb-row:active { background: var(--rb-card-press); }
    #rb-panel .rb-row--static { cursor: default; }
    #rb-panel .rb-row--static:hover { background: transparent; }
    #rb-panel .rb-label { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; gap: 1px; }
    #rb-panel .rb-label-main { font-weight: 500; overflow-wrap: anywhere; }
    #rb-panel .rb-label-sub {
      display: flex; flex-wrap: wrap; align-items: center; column-gap: 6px; min-width: 0;
      color: var(--rb-muted); font-size: 12px; line-height: 1.4; overflow-wrap: anywhere;
    }
    #rb-panel .rb-lead { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1 1 auto; }
    #rb-panel .rb-lead-tile {
      display: inline-flex; align-items: center; justify-content: center; flex: none;
      width: 30px; height: 30px; border-radius: 8px; background: var(--rb-subtle); color: var(--rb-muted);
      font-size: 13px; font-weight: 700; transition: background-color .12s ease, color .12s ease;
    }
    #rb-panel .rb-lead-tile--channel { background: var(--rb-accent-soft); color: var(--rb-accent); }
    #rb-panel .rb-lead-icon { width: 18px; height: 18px; flex: none; fill: currentColor; }
    #rb-panel .rb-row:hover .rb-lead-tile { color: var(--rb-accent); }
    #rb-panel .rb-meta {
      display: flex; align-items: center; gap: 4px; flex: 0 1 auto; min-width: 0; max-width: 50%;
      color: var(--rb-muted); font-size: 12px; font-variant-numeric: tabular-nums;
    }
    #rb-panel .rb-meta-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #rb-panel .rb-meta > .rb-icon { width: 18px; height: 18px; fill: currentColor; color: var(--rb-faint); margin-inline-end: -4px; transition: transform .15s var(--rb-ease); }
    #rb-panel .rb-row:hover .rb-meta > .rb-icon { transform: translateX(2px); color: var(--rb-muted); }

    #rb-panel .rb-note { margin: 2px 4px 10px; color: var(--rb-muted); font-size: 12px; line-height: 1.5; }
    #rb-panel .rb-section + .rb-note { margin-top: -2px; }
    #rb-panel .rb-empty { padding: 22px 8px; color: var(--rb-muted); text-align: center; }
    #rb-panel .rb-empty .rb-pup { display: block; width: 56px; height: 56px; margin: 0 auto 10px; }
    #rb-panel .rb-empty .rb-btn { margin-top: 10px; }
    #rb-panel .rb-footer { display: flex; flex-wrap: wrap; gap: 8px; }
    #rb-panel .rb-footer .rb-btn { flex: 1 1 0; }
    #rb-panel .rb-credit {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 10px;
      margin: 16px 0 2px; color: var(--rb-faint); font-size: 11px; font-variant-numeric: tabular-nums;
    }
    #rb-panel .rb-credit > span + span::before { content: '·'; margin-inline-end: 10px; }

    /* ---- Switch ---- */
    #rb-panel .rb-switch-input {
      position: absolute; width: 1px; height: 1px; margin: 0; padding: 0;
      opacity: 0; pointer-events: none; inset-inline-end: 20px; top: 50%;
    }
    #rb-panel .rb-switch {
      position: relative; flex: none; width: 40px; height: 20px; border-radius: 10px;
      box-shadow: inset 0 0 0 1px var(--rb-muted); transition: background-color .15s ease, box-shadow .15s ease;
    }
    #rb-panel .rb-switch::after {
      content: ''; position: absolute; top: 5px; inset-inline-start: 5px; width: 10px; height: 10px; border-radius: 50%;
      background: var(--rb-muted); transition: transform .2s var(--rb-ease), width .12s ease, background-color .15s ease;
    }
    #rb-panel .rb-row:hover .rb-switch-input:not(:checked) + .rb-switch { box-shadow: inset 0 0 0 1px var(--rb-text); }
    #rb-panel .rb-row:hover .rb-switch-input:not(:checked) + .rb-switch::after { background: var(--rb-text); }
    #rb-panel .rb-row:active .rb-switch::after { width: 13px; }
    #rb-panel .rb-switch-input:checked + .rb-switch { background: var(--rb-accent); box-shadow: inset 0 0 0 1px var(--rb-accent); }
    #rb-panel .rb-row:hover .rb-switch-input:checked + .rb-switch { background: var(--rb-accent-hover); box-shadow: inset 0 0 0 1px var(--rb-accent-hover); }
    #rb-panel .rb-switch-input:checked + .rb-switch::after { transform: translateX(20px); background: var(--rb-on-accent); }
    #rb-panel .rb-row:active .rb-switch-input:checked + .rb-switch::after { transform: translateX(17px); }
    #rb-panel .rb-switch-input:focus-visible + .rb-switch { outline: 2px solid var(--rb-accent); outline-offset: 2px; }

    /* ---- Inputs ---- */
    #rb-panel .rb-input {
      display: block; width: 100%; height: 32px; margin: 0; padding: 0 10px;
      border: 0; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--rb-stroke), inset 0 -1px 0 var(--rb-stroke-strong);
      background: var(--rb-field); color: var(--rb-text); font: 400 13px/1 var(--rb-font);
      transition: box-shadow .12s ease, background-color .12s ease;
    }
    #rb-panel textarea.rb-input {
      height: auto; min-height: 32px; padding: 7px 10px; line-height: 1.45; resize: vertical; field-sizing: content;
    }
    #rb-panel .rb-input:hover { background: rgba(0, 0, 0, .4); }
    #rb-panel .rb-input:focus, #rb-panel .rb-input:focus-visible {
      outline: none; background: rgba(0, 0, 0, .45); box-shadow: inset 0 0 0 1px var(--rb-stroke), inset 0 -2px 0 var(--rb-accent);
    }
    #rb-panel .rb-input::placeholder { color: var(--rb-faint); opacity: 1; }
    #rb-panel select.rb-input { width: 100%; padding: 0 8px; cursor: pointer; color-scheme: dark; }
    #rb-panel select.rb-input option, #rb-panel select.rb-input optgroup { background: #1d1821; color: var(--rb-text); }
    #rb-panel .rb-search { position: relative; }
    #rb-panel .rb-search > .rb-icon {
      position: absolute; inset-inline-start: 10px; top: 50%; width: 15px; height: 15px; transform: translateY(-50%);
      fill: var(--rb-faint); pointer-events: none;
    }
    #rb-panel .rb-search .rb-input { padding-inline: 32px; }
    #rb-panel .rb-input::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
    #rb-panel .rb-search-clear {
      position: absolute; inset-inline-end: 5px; top: 50%; transform: translateY(-50%);
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; padding: 0; border: 0; border-radius: 6px;
      background: transparent; color: var(--rb-muted); cursor: pointer;
    }
    #rb-panel .rb-search-clear:hover { background: var(--rb-subtle-hover); color: var(--rb-text); }
    #rb-panel .rb-search-clear .rb-icon { width: 15px; height: 15px; fill: currentColor; }

    #rb-panel .rb-number {
      width: 58px; flex: none; padding: 0 4px; text-align: center; font-variant-numeric: tabular-nums;
      -moz-appearance: textfield; appearance: textfield;
    }
    #rb-panel .rb-number::-webkit-inner-spin-button, #rb-panel .rb-number::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

    #rb-panel .rb-range {
      --rb-fill: 50%;
      display: block; width: 100%; height: 22px; margin: 6px 0 0; padding: 0;
      background: transparent; cursor: pointer; -webkit-appearance: none; appearance: none;
    }
    #rb-panel .rb-range:focus-visible { outline: none; }
    #rb-panel .rb-range::-webkit-slider-runnable-track {
      height: 4px; border-radius: 2px;
      background: linear-gradient(to right, var(--rb-accent) var(--rb-fill), rgba(255, 255, 255, .16) var(--rb-fill));
    }
    #rb-panel .rb-range::-webkit-slider-thumb {
      -webkit-appearance: none; width: 18px; height: 18px; margin-top: -7px; border-radius: 50%;
      background: var(--rb-accent); border: 4px solid #2a2230; box-shadow: 0 0 0 1px var(--rb-stroke-strong);
      transition: border-width .12s ease;
    }
    #rb-panel .rb-range:hover::-webkit-slider-thumb { border-width: 3px; }
    #rb-panel .rb-range:active::-webkit-slider-thumb { border-width: 5px; }
    #rb-panel .rb-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 2px var(--rb-accent); }
    #rb-panel .rb-range::-moz-range-track { height: 4px; border-radius: 2px; background: rgba(255, 255, 255, .16); }
    #rb-panel .rb-range::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--rb-accent); }
    #rb-panel .rb-range::-moz-range-thumb {
      width: 10px; height: 10px; border-radius: 50%; background: var(--rb-accent); border: 4px solid #2a2230; box-shadow: 0 0 0 1px var(--rb-stroke-strong);
    }
    #rb-panel .rb-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 2px var(--rb-accent); }

    /* ---- Color bits ---- */
    #rb-panel .rb-swatch {
      display: inline-block; width: 10px; height: 10px; flex: none; border-radius: 50%;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .2);
    }
    #rb-panel .rb-hex { font-family: var(--rb-mono); font-size: 11.5px; letter-spacing: .01em; }
    #rb-panel .rb-chip-color { display: inline-flex; align-items: center; gap: 6px; }
    #rb-panel .rb-mini-strip { display: flex; width: 52px; height: 8px; border-radius: 4px; overflow: hidden; margin-inline-end: 2px; box-shadow: 0 0 0 1px var(--rb-stroke); }
    #rb-panel .rb-mini-strip span, #rb-panel .rb-strip span { flex: 1 1 0; min-width: 0; }

    #rb-panel .rb-strip-wrap { position: relative; margin: 6px 4px 0; padding: 14px 0 4px; }
    #rb-panel .rb-strip { display: flex; height: 28px; border-radius: 8px; overflow: hidden; box-shadow: 0 0 0 1px var(--rb-stroke); }
    #rb-panel .rb-strip--stepped { gap: 1px; }
    #rb-panel .rb-strip-marker { position: absolute; top: 0; bottom: 0; width: 0; pointer-events: none; transition: inset-inline-start .25s var(--rb-ease); }
    #rb-panel .rb-strip-marker::after {
      content: ''; position: absolute; top: 14px; bottom: 4px; inset-inline-start: -2px; width: 4px; border-radius: 2px;
      background: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .6);
    }
    #rb-panel .rb-strip-pin {
      position: absolute; top: 0; inset-inline-start: -10px; width: 20px; height: 20px; border-radius: 50%; z-index: 1;
      display: flex; align-items: center; justify-content: center;
      background: var(--rb-accent); box-shadow: 0 2px 6px rgba(0, 0, 0, .5);
    }
    #rb-panel .rb-strip-pin .rb-paw { width: 13px; height: 13px; color: var(--rb-on-accent); }
    #rb-panel .rb-strip-caption {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      margin: 6px 4px 12px; color: var(--rb-muted); font-size: 12px;
    }
    #rb-panel .rb-strip-caption .rb-chip-color { color: var(--rb-text); }

    #rb-panel .rb-setting { padding: 12px 12px 10px; }
    #rb-panel .rb-setting > .rb-input { margin-top: 8px; }
    #rb-panel .rb-setting-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

    /* ---- Hero: your next message ---- */
    #rb-panel .rb-hero {
      position: relative; margin: 2px 0 10px; padding: 10px 12px 12px; border-radius: 12px; overflow: hidden;
      background: linear-gradient(135deg, rgba(255, 179, 209, .1), rgba(255, 179, 209, .02) 60%), var(--rb-card);
      box-shadow: inset 0 0 0 1px var(--rb-stroke);
    }
    #rb-panel .rb-hero-label {
      display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;
      color: var(--rb-faint); font-size: 11.5px; font-weight: 600; letter-spacing: .02em;
    }
    #rb-panel .rb-hero-next { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; letter-spacing: 0; color: var(--rb-muted); }
    #rb-panel .rb-hero-next .rb-chip-color { color: var(--rb-text); }
    #rb-panel .rb-preview {
      padding: 8px 10px; border-radius: 8px; overflow-wrap: anywhere;
      background: rgba(0, 0, 0, .35); box-shadow: inset 0 0 0 1px var(--rb-stroke);
      font-size: 13px; line-height: 20px; unicode-bidi: plaintext;
    }
    #rb-panel .rb-preview .rb-badge-img { display: inline-block; vertical-align: middle; margin-inline-end: 5px; margin-top: -2px; }
    #rb-panel .rb-preview-name { font-weight: 700; }
    #rb-panel .rb-recent { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }
    #rb-panel .rb-recent-label { color: var(--rb-faint); font-size: 11.5px; font-weight: 600; }
    #rb-panel .rb-recent-dots { display: flex; gap: 6px; }
    #rb-panel .rb-dot {
      width: 18px; height: 18px; padding: 0; margin: 0; border: 0; border-radius: 50%; cursor: pointer;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22); transition: transform .15s var(--rb-ease);
    }
    #rb-panel .rb-dot:first-child { box-shadow: 0 0 0 2px var(--rb-surface), 0 0 0 3.5px var(--rb-accent); }
    #rb-panel .rb-dot:hover { transform: scale(1.18); }
    #rb-panel .rb-dot:focus-visible { outline-offset: 2px; }

    /* ---- Quick bar ---- */
    #rb-panel .rb-quick { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 4px; }
    #rb-panel .rb-chip--icon { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px 0 9px; border-radius: 15px; }
    #rb-panel .rb-chip--icon .rb-icon { width: 15px; height: 15px; fill: currentColor; }
    #rb-panel .rb-chip--icon:not([aria-pressed="true"]) .rb-icon { color: var(--rb-muted); }
    #rb-panel select.rb-quick-palette { flex: 1 1 110px; width: auto; min-width: 0; height: 30px; border-radius: 15px; padding: 0 10px; }

    /* ---- Status callouts and pills ---- */
    #rb-panel .rb-callout {
      display: flex; gap: 12px; align-items: flex-start; margin: 10px 0 0; padding: 12px;
      border-radius: 10px; background: var(--rb-warn-fill); box-shadow: inset 0 0 0 1px var(--rb-warn-edge);
    }
    #rb-panel .rb-callout--paused { background: var(--rb-accent-soft); box-shadow: inset 0 0 0 1px var(--rb-accent-line); }
    #rb-panel .rb-callout .rb-pup { flex: none; width: 38px; height: 38px; }
    #rb-panel .rb-callout-title { font-weight: 600; }
    #rb-panel .rb-callout-body { color: var(--rb-muted); font-size: 12px; }
    #rb-panel .rb-callout .rb-btn { margin: 6px 0 0; margin-inline-start: -8px; }

    #rb-panel .rb-pill {
      display: inline-flex; align-items: center; flex: none; height: 20px; padding: 0 8px; border-radius: 10px;
      font-size: 11.5px; font-weight: 600; line-height: 1; white-space: nowrap; font-variant-numeric: tabular-nums;
    }
    #rb-panel .rb-pill--ok   { background: var(--rb-ok-fill); color: var(--rb-ok); }
    #rb-panel .rb-pill--wait { background: var(--rb-warn-fill); color: var(--rb-warn); box-shadow: inset 0 0 0 1px var(--rb-warn-edge); }

    #rb-panel .rb-badge-img { width: 18px; height: 18px; flex: none; border-radius: 3px; }
    #rb-panel .rb-badge-img--blank { background: var(--rb-subtle); }
    #rb-panel .rb-mono { font-family: var(--rb-mono); font-size: 11px; }
    #rb-panel .rb-hash { align-items: flex-start; }
    #rb-panel .rb-hash .rb-pill { margin-top: 2px; }
    #rb-panel .rb-hash .rb-label-sub { white-space: normal; display: block; }
    #rb-panel .rb-diag-text { width: 100%; margin-top: 6px; font: 11px/1.4 var(--rb-mono); resize: vertical; }

    #rb-panel .rb-confirm-text { margin: 4px 4px 18px; color: var(--rb-muted); }
    #rb-panel .rb-confirm-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }

    /* ---- Badges ---- */
    #rb-panel .rb-badge-line { display: flex; align-items: center; padding-inline-start: 4px; }
    #rb-panel .rb-badge-line > .rb-row { flex: 1 1 auto; min-width: 0; width: auto; padding-inline-start: 6px; }
    #rb-panel .rb-badge-line:hover { background: var(--rb-card-hover); }
    #rb-panel .rb-badge-line:hover > .rb-row { background: transparent; }
    #rb-panel .rb-mark { width: 26px; height: 30px; color: var(--rb-faint); }
    #rb-panel .rb-mark:hover, #rb-panel .rb-mark:focus-visible { color: var(--rb-text); background: transparent; }
    #rb-panel .rb-mark .rb-icon { width: 17px; height: 17px; }
    #rb-panel .rb-mark[aria-pressed="true"] .rb-icon path { fill: currentColor; }
    #rb-panel .rb-mark--star[aria-pressed="true"] { color: #ffd479; }
    #rb-panel .rb-mark--pin[aria-pressed="true"] { color: var(--rb-accent); }
    #rb-panel .rb-scope { justify-content: flex-start; gap: 6px; }
    #rb-panel .rb-scope .rb-chip { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
    #rb-panel .rb-sort-row { display: flex; align-items: center; gap: 8px; min-height: 42px; padding: 2px 6px; }
    #rb-panel .rb-sort-row.is-dragging { position: relative; z-index: 1; background: #2a2230; box-shadow: 0 0 0 1px var(--rb-accent-line), 0 8px 20px rgba(0, 0, 0, .4); }
    #rb-panel .rb-sort-row.is-off .rb-badge-img, #rb-panel .rb-sort-row.is-off .rb-sort-name { opacity: .45; }
    #rb-panel .rb-sort-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
    #rb-panel .rb-sort-row .rb-iconbtn { flex: none; }
    #rb-panel .rb-grip {
      display: inline-flex; flex: none; align-items: center; justify-content: center; width: 24px; height: 30px; border-radius: 6px;
      color: var(--rb-faint); cursor: grab; touch-action: none;
    }
    #rb-panel .rb-grip .rb-icon { width: 16px; height: 16px; fill: currentColor; }
    #rb-panel .rb-grip:hover, #rb-panel .rb-sort-row.is-dragging .rb-grip { color: var(--rb-text); background: var(--rb-subtle); }
    #rb-panel .rb-sort-list.is-sorting, #rb-panel .rb-sort-list.is-sorting .rb-grip { cursor: grabbing; user-select: none; }

    /* ---- Pronouns ---- */
    #rb-panel .rb-pn-preview { display: block; margin-bottom: 10px; line-height: 1.9; }
    #rb-panel .rb-pn-line { overflow-wrap: anywhere; }
    #rb-panel .rb-pn-name { font-weight: 700; }
    #rb-panel .rb-field-row .rb-label-main { white-space: normal; }
    #rb-panel .rb-field-controls { display: inline-flex; flex: none; align-items: center; gap: 6px; }
    #rb-panel select.rb-select-inline { width: 172px; flex: 0 1 auto; min-width: 0; }
    #rb-panel .rb-color-input {
      flex: none; width: 32px; height: 32px; margin: 0; padding: 3px; border: 0; border-radius: 8px;
      background: var(--rb-field); box-shadow: inset 0 0 0 1px var(--rb-stroke); cursor: pointer;
    }
    #rb-panel .rb-note--warn { color: var(--rb-warn); }

    /* ---- Palettes ---- */
    #rb-panel .rb-flag {
      display: flex; flex: none; width: 40px; height: 16px; border-radius: 4px; overflow: hidden;
      box-shadow: 0 0 0 1px var(--rb-stroke-strong);
    }
    #rb-panel .rb-flag span { flex: 1 1 0; min-width: 0; }
    #rb-panel .rb-flag--empty { background: var(--rb-subtle); }
    #rb-panel .rb-palette { min-height: 40px; }
    #rb-panel .rb-palette.is-selected { background: var(--rb-accent-soft); }
    #rb-panel .rb-palette.is-selected::before {
      content: ''; position: absolute; inset-inline-start: 0; top: 10px; bottom: 10px; width: 3px; border-radius: 0 3px 3px 0; background: var(--rb-accent);
    }
    #rb-panel .rb-palette.is-selected .rb-label-main { font-weight: 600; }
    #rb-panel .rb-palette-check { flex: none; width: 18px; height: 18px; fill: var(--rb-accent); }

    /* ---- Shortcuts and snippets ---- */
    #rb-panel .rb-shortcuts {
      display: grid; grid-template-columns: minmax(0, max-content) 1fr; gap: 10px 12px; align-items: baseline;
      margin: 0; padding: 12px; transition: opacity .15s ease;
    }
    #rb-panel .rb-shortcuts.is-off { opacity: .45; }
    #rb-panel .rb-shortcuts dt, #rb-panel .rb-shortcuts dd { margin: 0; min-width: 0; }
    #rb-panel .rb-shortcuts dd { color: var(--rb-muted); font-size: 12px; line-height: 1.5; unicode-bidi: plaintext; }
    #rb-panel .rb-kbd {
      display: inline-block; max-width: 100%; padding: 2px 7px; border-radius: 6px; overflow-wrap: anywhere; white-space: nowrap;
      background: var(--rb-accent-soft); color: var(--rb-accent); box-shadow: inset 0 0 0 1px rgba(255, 179, 209, .2);
      font: 600 12px/1.55 var(--rb-mono);
    }
    #rb-panel .rb-snippet .rb-kbd { flex: none; max-width: 45%; }
    #rb-panel .rb-snippet-text {
      flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--rb-muted); font-size: 12px; unicode-bidi: plaintext;
    }
    #rb-panel .rb-snippet.is-warn .rb-snippet-text { color: var(--rb-warn); }
    #rb-panel .rb-field { padding: 6px 4px; }
    #rb-panel .rb-field-label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 600; color: var(--rb-muted); }
    #rb-panel .rb-text-hint { margin-top: 6px; color: var(--rb-muted); font-size: 11.5px; line-height: 1.4; }
    #rb-panel .rb-text-hint.is-warn { color: var(--rb-warn); }
    #rb-panel .rb-extras { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    #rb-panel .rb-extras-label { margin-top: 14px; }
    #rb-panel .rb-extras .rb-chip { font-family: var(--rb-mono); font-weight: 500; }
    #rb-panel .rb-editor-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 4px 2px; }
    #rb-panel .rb-editor-actions .rb-spacer { flex: 1 1 auto; }

    /* ---- Setup guide: a card beside the chat ---- */
    #rb-guide {
      position: fixed; z-index: 99998; box-sizing: border-box; width: 300px; padding: 16px 16px 14px; overflow: hidden;
      background: var(--rb-acrylic); color: var(--rb-text);
      -webkit-backdrop-filter: blur(28px) saturate(1.4); backdrop-filter: blur(28px) saturate(1.4);
      border: 1px solid var(--rb-stroke-strong); border-radius: 14px; box-shadow: var(--rb-shadow);
      font: 400 13px/1.5 var(--rb-font); text-align: start; animation: rb-guide-in .3s var(--rb-ease) both;
    }
    #rb-guide::before {
      content: ''; position: absolute; inset: 0 0 auto 0; height: 2px;
      background: linear-gradient(90deg, transparent, var(--rb-accent), transparent);
    }
    #rb-guide * { box-sizing: border-box; }
    #rb-guide .rb-guide-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    #rb-guide .rb-pup { flex: none; width: 40px; height: 40px; }
    #rb-guide .rb-guide-title { flex: 1 1 auto; min-width: 0; font-size: 15px; font-weight: 650; line-height: 1.3; }
    #rb-guide .rb-guide-x {
      display: inline-flex; flex: none; align-items: center; justify-content: center; width: 28px; height: 28px; margin: 0; padding: 0;
      border: 0; border-radius: 8px; background: transparent; color: var(--rb-muted); cursor: pointer;
    }
    #rb-guide .rb-guide-x:hover { background: var(--rb-subtle-hover); color: var(--rb-text); }
    #rb-guide .rb-guide-x .rb-icon { width: 16px; height: 16px; fill: currentColor; }
    #rb-guide .rb-guide-text { margin: 0 0 12px; color: var(--rb-muted); }
    #rb-guide .rb-guide-warn {
      margin: 0 0 10px; padding: 7px 10px; border-radius: 8px;
      background: var(--rb-warn-fill); color: var(--rb-warn); box-shadow: inset 0 0 0 1px var(--rb-warn-edge);
    }
    #rb-guide .rb-guide-steps {
      display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none;
      border-radius: 10px; background: var(--rb-card); box-shadow: inset 0 0 0 1px var(--rb-stroke); overflow: hidden;
    }
    #rb-guide .rb-guide-step { display: flex; gap: 10px; margin: 0; padding: 9px 10px; }
    #rb-guide .rb-guide-step + .rb-guide-step { box-shadow: 0 -1px 0 var(--rb-stroke); }
    #rb-guide .rb-guide-step.is-current { background: var(--rb-accent-soft); }
    #rb-guide .rb-guide-mark {
      display: inline-flex; flex: none; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%;
      background: var(--rb-subtle); color: var(--rb-muted); font-size: 12px; font-weight: 700; line-height: 1;
    }
    #rb-guide .is-current .rb-guide-mark { background: var(--rb-accent); color: var(--rb-on-accent); }
    #rb-guide .is-done .rb-guide-mark { background: var(--rb-ok-fill); color: var(--rb-ok); }
    #rb-guide .rb-guide-mark .rb-icon { width: 14px; height: 14px; fill: currentColor; }
    #rb-guide .rb-guide-step-text { flex: 1 1 auto; min-width: 0; }
    #rb-guide .rb-guide-step-title { font-weight: 600; }
    #rb-guide .is-done .rb-guide-step-title, #rb-guide .is-todo .rb-guide-step-title { color: var(--rb-muted); font-weight: 500; }
    #rb-guide .rb-guide-step-how { margin-top: 2px; color: var(--rb-muted); font-size: 12px; }
    #rb-guide .rb-guide-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; }
    #rb-guide .rb-guide-progress { color: var(--rb-faint); font-size: 12px; font-variant-numeric: tabular-nums; }
    #rb-guide .rb-guide-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    #rb-guide .rb-guide-btn {
      min-height: 32px; margin: 0; padding: 4px 14px; border: 0; border-radius: 8px;
      background: var(--rb-subtle); color: var(--rb-text); font: 600 13px/1.3 var(--rb-font); cursor: pointer;
      box-shadow: inset 0 0 0 1px var(--rb-stroke);
    }
    #rb-guide .rb-guide-btn:hover { background: var(--rb-subtle-hover); }
    #rb-guide .rb-guide-btn--primary { background: var(--rb-accent); color: var(--rb-on-accent); box-shadow: none; }
    #rb-guide .rb-guide-btn--primary:hover { background: var(--rb-accent-hover); }
    #rb-guide .rb-guide-btn--quiet { padding: 4px 10px; background: transparent; color: var(--rb-accent); box-shadow: none; }
    #rb-guide .rb-guide-btn--quiet:hover { background: var(--rb-accent-soft); }
    #rb-guide button:focus-visible { outline: 2px solid var(--rb-accent); outline-offset: 1px; }
    #rb-guide-ring {
      position: fixed; z-index: 99998; display: none; box-sizing: border-box; border-radius: 8px; pointer-events: none;
      box-shadow: 0 0 0 2px #ffb3d1, 0 0 0 5px rgba(255, 179, 209, .35); animation: rb-guide-ring 1.6s ease-in-out infinite;
    }
    @keyframes rb-guide-in { from { opacity: 0; transform: translateY(10px) scale(.98); } }
    @keyframes rb-guide-ring { 50% { box-shadow: 0 0 0 2px #ffb3d1, 0 0 0 12px rgba(255, 179, 209, 0); } }

    /* ---- Toasts ---- */
    .rb-toasts {
      position: fixed; top: 60px; left: 50%; transform: translateX(-50%); z-index: 100000;
      display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
    }
    .rb-toast {
      display: flex; align-items: center; gap: 10px; max-width: 340px; unicode-bidi: plaintext; padding: 9px 14px 9px 11px;
      border: 1px solid var(--rb-stroke-strong); border-radius: 10px; background: var(--rb-acrylic); color: var(--rb-text);
      -webkit-backdrop-filter: blur(24px) saturate(1.4); backdrop-filter: blur(24px) saturate(1.4);
      box-shadow: var(--rb-shadow); font: 500 13px/1.4 var(--rb-font);
      animation: rb-toast-in .25s var(--rb-ease) both;
    }
    .rb-toast .rb-icon, .rb-toast .rb-paw { flex: none; width: 18px; height: 18px; }
    .rb-toast--ok .rb-paw { color: var(--rb-accent); fill: currentColor; }
    .rb-toast--error { border-color: rgba(255, 148, 148, .35); }
    .rb-toast--error .rb-icon { fill: var(--rb-danger); }
    .rb-toast--out { animation: rb-toast-out .2s ease forwards; }
    @keyframes rb-toast-in { from { opacity: 0; transform: translateY(-8px) scale(.98); } }
    @keyframes rb-toast-out { to { opacity: 0; transform: translateY(-6px); } }

    @media (prefers-reduced-motion: reduce) {
      #rb-panel, #rb-panel *, .rb-toast, .rb-entry .rb-paw, .rb-paw .rb-paw-pad, #rb-guide, #rb-guide-ring, #rb-fab { transition: none !important; animation: none !important; }
    }
  `;

  return STYLES;
};
