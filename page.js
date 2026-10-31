/*
 * Rainbark: page script.
 *
 * Runs inside the Twitch page itself (the manifest loads it in the "MAIN" world at document start), because it has
 * to see the requests Twitch makes and reach Twitch's own chat box. Every chat message it changes your global badge
 * and name color, using the same requests Twitch's settings menus send, picked up from your own session.
 *
 * It has no access to extension APIs. bridge.js sits beside it and keeps a copy of the settings in extension storage.
 */

(function () {
  'use strict';

  /* =========================================================================
   * Configuration
   * ========================================================================= */

  const VERSION = '8.0.0';

  const HASH_KEYS = ['badges', 'selectBadge', 'updateColor'];
  const HASH_OPERATIONS = {
    badges:      'ChatSettings_Badges',
    selectBadge: 'ChatSettings_SelectGlobalBadge',
    updateColor: 'Chat_UpdateChatColorV2',
  };
  const OPERATION_TO_KEY = Object.fromEntries(Object.entries(HASH_OPERATIONS).map(([key, name]) => [name, key]));

  const WHEEL_DEFAULTS = { steps: 48, sat: 85, lBase: 55 };
  const WHEEL_LIMITS = { steps: [2, 360], sat: [0, 100], lBase: [0, 100] };

  const TIMING_DEFAULTS = { every: 1, gap: 0 };
  const TIMING_LIMITS = { every: [1, 20], gap: [0, 600] };
  const BLEND_MAX = 10;             // most in-between shades a palette can add between two colors
  const CUSTOM_COLOR_LIMIT = 64;
  const SNIPPET_LIMIT = 50;
  const FAVORITE_WEIGHT = 3;        // how many times as often a favorite badge comes up when shuffling
  const SNIPPET_TEXT_LIMIT = 500;   // Twitch's own limit for one chat message

  // The 15 colors Twitch gives every account, in rainbow order, with Twitch's own name for each.
  const TWITCH_COLORS = [
    ['#FF0000', 'Red'], ['#B22222', 'Firebrick'], ['#FF4500', 'OrangeRed'], ['#FF7F50', 'Coral'], ['#D2691E', 'Chocolate'],
    ['#DAA520', 'GoldenRod'], ['#9ACD32', 'YellowGreen'], ['#008000', 'Green'], ['#00FF7F', 'SpringGreen'], ['#2E8B57', 'SeaGreen'],
    ['#5F9EA0', 'CadetBlue'], ['#1E90FF', 'DodgerBlue'], ['#0000FF', 'Blue'], ['#8A2BE2', 'BlueViolet'], ['#FF69B4', 'HotPink'],
  ].map(([hex, name]) => ({ hex, name }));

  // Palettes: each is a list of colors to walk through, one per message. "rainbow" is built from the wheel settings
  // instead. A palette that starts and ends on the same color loops without repeating it.
  const stops = list => list.split(' ').map(hex => `#${hex}`);
  const PALETTE_GROUPS = [
    { id: 'basics', palettes: {
      rainbow: null,
      twitch:  TWITCH_COLORS.map(color => color.hex),
      pastel:  stops('FFADAD FFD6A5 FDFFB6 CAFFBF 9BF6FF A0C4FF BDB2FF FFC6FF'),
      sunset:  stops('6A3FA0 B5479E E8507A FF6B4A FF9A3C FFC94D FF9A3C FF6B4A E8507A B5479E 6A3FA0'),
      ocean:   stops('0077B6 0096C7 00B4D8 48CAE4 90E0EF 48CAE4 00B4D8 0096C7 0077B6'),
      forest:  stops('2D6A4F 40916C 52B788 74C69D 95D5B2 B7E4C7 95D5B2 74C69D 52B788 40916C 2D6A4F'),
      candy:   stops('FF8FAB FFB3C6 FFC8DD CDB4DB A2D2FF BDE0FE A2D2FF CDB4DB FFC8DD FFB3C6 FF8FAB'),
      fire:    stops('D00000 E85D04 F48C06 FAA307 FFBA08 FAA307 F48C06 E85D04 D00000'),
      autumn:  stops('9B2226 BB3E03 CA6702 EE9B00 E9D8A6 EE9B00 CA6702 BB3E03 9B2226'),
      aurora:  stops('00F5A0 00D9F5 5B8CFF 9D4EDD E05DD8 9D4EDD 5B8CFF 00D9F5 00F5A0'),
      neon:    stops('FF2079 FF6B00 FFEA00 39FF14 00F0FF 7D12FF'),
    } },
    { id: 'pride', palettes: {
      pride:       stops('E40303 FF8C00 FFED00 008026 004DFF 750787'),
      progress:    stops('FFFFFF FFAFC8 74D7EE 613915 000000 E40303 FF8C00 FFED00 008026 004DFF 750787'),
      philly:      stops('000000 784F17 E40303 FF8C00 FFED00 008026 004DFF 750787'),
      trans:       stops('5BCEFA F5A9B8 FFFFFF F5A9B8 5BCEFA'),
      nonbinary:   stops('FCF434 FFFFFF 9C59D1 2C2C2C'),
      genderqueer: stops('B57EDC FFFFFF 4A8123'),
      genderfluid: stops('FF76A4 FFFFFF C011D7 000000 2F3CBE'),
      agender:     stops('000000 BCC4C7 FFFFFF B7F684 FFFFFF BCC4C7 000000'),
      bigender:    stops('C479A2 EDA5CD D6C7E8 FFFFFF D6C7E8 9AC7E8 6D82D1'),
      trigender:   stops('FF95C5 9581FF 67D966 9581FF FF95C5'),
      pangender:   stops('FFF798 FEDDCD FFEBFB FFFFFF FFEBFB FEDDCD FFF798'),
      demiboy:     stops('7F7F7F C4C4C4 9DD7EA FFFFFF 9DD7EA C4C4C4 7F7F7F'),
      demigirl:    stops('7F7F7F C4C4C4 FDADC8 FFFFFF FDADC8 C4C4C4 7F7F7F'),
      androgyne:   stops('FE007F 9832FF 00B8E7'),
      neutrois:    stops('FFFFFF 1F9F00 000000'),
      maverique:   stops('FFF344 FFFFFF F49622'),
      transfem:    stops('73DEFF FFE2EE FFB5D6 FF8DC0 FFB5D6 FFE2EE 73DEFF'),
      transmasc:   stops('FF8ABD CDF5FE 9AEBFF 74DFFF 9AEBFF CDF5FE FF8ABD'),
      intersex:    stops('FFD800 7902AA'),
      lesbian:     stops('D52D00 FF9A56 FFFFFF D362A4 A30262'),
      mlm:         stops('078D70 26CEAA 98E8C1 FFFFFF 7BADE2 5049CC 3D1A78'),
      bi:          stops('D60270 9B4F96 0038A8'),
      pan:         stops('FF218C FFD800 21B1FF'),
      polysexual:  stops('F61CB9 07D569 1C92F6'),
      omni:        stops('FE9ACE FF53BF 200044 6760FE 8EA6FF'),
      abro:        stops('75CA91 B3E4C7 FFFFFF E695B5 D9446E'),
      ace:         stops('000000 A3A3A3 FFFFFF 800080'),
      aro:         stops('3DA542 A7D379 FFFFFF A9A9A9 000000'),
      aroace:      stops('E28C00 ECCD00 FFFFFF 62AEDC 203856'),
      demi:        stops('000000 FFFFFF 6E0070 D2D2D2'),
      demiro:      stops('000000 FFFFFF 3DA542 D2D2D2'),
      greyace:     stops('740194 AEB1AA FFFFFF AEB1AA 740194'),
      queer:       stops('000000 9AD9EA 00A3E8 B5E51D FFFFFF FFC90D FC6667 FEAEC9 000000'),
      polyam:      stops('009FE3 E50051 340C46 FCBF00'),
      bear:        stops('613704 D46300 FDDC62 FDE5B7 FFFFFF 545454 000000'),
      unlabeled:   stops('E6F9E3 FDFDFB DEEBF9 FAE1C2'),
    } },
  ];
  const PALETTES = Object.assign({}, ...PALETTE_GROUPS.map(group => group.palettes));
  // Extra words the palette search understands, on top of each palette's name.
  const PALETTE_ALIASES = {
    pride: 'gay lgbt lgbtq lgbtqia', progress: 'lgbt lgbtq', trans: 'transgender', nonbinary: 'enby nb non-binary', lesbian: 'wlw sapphic',
    mlm: 'gay vincian achillean', bi: 'bisexual', pan: 'pansexual', omni: 'omnisexual', abro: 'abrosexual', ace: 'asexual', aro: 'aromantic',
    aroace: 'aromantic asexual', demi: 'demisexual', demiro: 'demiromantic', greyace: 'grey gray graysexual', polyam: 'poly polyamorous',
    twitch: 'free default preset turbo prime', candy: 'cotton',
  };

  const SEED_DISABLED_BADGES = ['no_video', 'no_audio', 'premium', 'turbo', 'pogchamps-6-7'];
  const SEED_BLACKLIST       = [];

  const GRAPHQL_URL         = 'https://gql.twitch.tv/gql';
  const FALLBACK_CLIENT_ID  = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
  const STORAGE_KEY         = 'rainbark_state_v1';
  const LEGACY_STORAGE_KEYS = ['hueflux_state_v1', 'tbr_state_v2']; // settings carried over from earlier names

  const TOOLBAR_ANCHOR = '[data-test-selector="chat-input-buttons-container"]';
  const CHAT_INPUT     = '[data-a-target="chat-input"]';
  const GEAR_SELECTOR  = 'button[data-a-target="chat-settings"]';
  const IDENTITY_BUTTON = 'button[data-a-target="chat-badge-carousel-badge-icon"]';   // your badge in the chat box; opens Chat Identity

  const PANEL_WIDTH      = 344;
  const PANEL_MAX_HEIGHT = 640;
  const PANEL_GAP        = 8;
  const RECENT_LIMIT     = 8;      // colors kept in the panel's history row

  const RESERVED_PATHS = new Set(['videos', 'directory', 'settings', 'u', 'p', 'search', 'friends',
    'subscriptions', 'wallet', 'inventory', 'drops', 'popout', 'moderator', 'team', 'login', 'signup']);

  // Text and styles live in languages.js and styles.js, which the manifest loads just before this file.
  const PARTS = window.__rainbarkParts || {};
  delete window.__rainbarkParts;
  const { TEXT_GROUPS, LANGUAGES } = PARTS.text;
  const PRONOUN_LOOK = PARTS.pronounLook;

  const DEFAULT_TEXT = {};
  for (const group of TEXT_GROUPS) Object.assign(DEFAULT_TEXT, group.strings);

  /* =========================================================================
   * Shared helpers
   * ========================================================================= */

  // Everything logged is also kept (the last 80 lines) for "Copy diagnostics".
  const diagnostics = [];
  function log(...args) {
    console.log('%c[Rainbark]', 'color:#ffb3d1;font-weight:bold', ...args);
    const line = args.map(arg => (typeof arg === 'string' ? arg : arg instanceof Error ? `${arg.name}: ${arg.message}` : JSON.stringify(arg))).join(' ');
    diagnostics.push(`${new Date().toISOString().slice(11, 19)} ${line.slice(0, 300)}`);
    if (diagnostics.length > 80) diagnostics.shift();
  }

  const normalize = text => String(text || '').trim().toLowerCase();
  const clamp = (value, [min, max]) => Math.max(min, Math.min(max, Math.round(value)));
  // Window events carrying JSON text: how this script talks to bridge.js and pronouns.js (which run beside it).
  const emit = (name, data) => { try { window.dispatchEvent(new CustomEvent(name, { detail: JSON.stringify(data) })); } catch (error) { /* page is closing */ } };

  function createElement(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const propName in (props || {})) {
      const propValue = props[propName];
      if (propValue == null || propValue === false) continue;
      if (propName === 'style') { for (const key in propValue) if (key.startsWith('--')) node.style.setProperty(key, propValue[key]); else node.style[key] = propValue[key]; }
      else if (propName === 'class') node.className = propValue;
      else if (propName === 'text') node.textContent = propValue;
      else if (propName.startsWith('on') && typeof propValue === 'function') node.addEventListener(propName.slice(2), propValue);
      else node.setAttribute(propName, propValue === true ? '' : propValue);
    }
    return append(node, ...children);
  }
  // Like parent.append(), but skips null and false, so children can be left out with `condition ? child : null`.
  function append(parent, ...children) {
    for (const child of children.flat()) if (child != null && child !== false) parent.append(child.nodeType ? child : String(child));
    return parent;
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function createSvg(tag, attrs, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const name in (attrs || {})) node.setAttribute(name, attrs[name]);
    for (const child of children) if (child) node.append(child);
    return node;
  }

  const graphemeCount = text => {
    try { return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length; }
    catch (error) { return Array.from(text).length; }
  };

  /* =========================================================================
   * Artwork: icons, the rainbow paw and the pup
   * ========================================================================= */

  const STROKE = { fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

  const PAW_SHAPES = [
    ['path',    { class: 'rb-paw-pad rb-paw-main', d: 'M12 11.1c-2.85 0-6.3 3.75-6.3 6.5 0 1.85 1.35 2.9 3 2.9 1.25 0 2.05-.55 3.3-.55s2.05.55 3.3.55c1.65 0 3-1.05 3-2.9 0-2.75-3.45-6.5-6.3-6.5Z' }],
    ['ellipse', { class: 'rb-paw-pad rb-paw-toe1', cx: '5.3',  cy: '10.9', rx: '2.05', ry: '2.55', transform: 'rotate(-22 5.3 10.9)' }],
    ['ellipse', { class: 'rb-paw-pad rb-paw-toe2', cx: '9.3',  cy: '6.1',  rx: '2.15', ry: '2.75', transform: 'rotate(-8 9.3 6.1)' }],
    ['ellipse', { class: 'rb-paw-pad rb-paw-toe3', cx: '14.7', cy: '6.1',  rx: '2.15', ry: '2.75', transform: 'rotate(8 14.7 6.1)' }],
    ['ellipse', { class: 'rb-paw-pad rb-paw-toe4', cx: '18.7', cy: '10.9', rx: '2.05', ry: '2.55', transform: 'rotate(22 18.7 10.9)' }],
  ];

  // 24px glyphs. Chevrons, search and info are Twitch's own icon paths; the rest are drawn to match.
  const ICONS = {
    back:      [['path', { d: 'm14.207 5 1.414 1.414-5.793 5.793L15.621 18l-1.414 1.414L7 12.207 14.207 5Z' }]],
    forward:   [['path', { d: 'M13.793 12.207 8 6.414 9.414 5l7.207 7.207-7.207 7.207L8 18l5.793-5.793Z' }]],
    close:     [['path', { d: 'M6.707 5.293 12 10.586l5.293-5.293 1.414 1.414L13.414 12l5.293 5.293-1.414 1.414L12 13.414l-5.293 5.293-1.414-1.414L10.586 12 5.293 6.707l1.414-1.414Z' }]],
    search:    [['path', { d: 'M2 10.5a8.5 8.5 0 1 1 15.176 5.262l4.531 4.531-1.414 1.414-4.531-4.531A8.5 8.5 0 0 1 2 10.5Zm8.5 6.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z', 'fill-rule': 'evenodd', 'clip-rule': 'evenodd' }]],
    plus:      [['path', { d: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z' }]],
    info:      [['path', { d: 'M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm1 5v2h-2V6h2Zm0 4v8h-2v-8h2Z', 'fill-rule': 'evenodd', 'clip-rule': 'evenodd' }]],
    paw:       PAW_SHAPES,
    snowflake: [['path', { ...STROKE, d: 'M12 20.5V3.5M4.64 16.25l14.72-8.5M4.64 7.75l14.72 8.5M14.3 4.2 12 6.1 9.7 4.2M6.4 6.11l.49 2.94-2.79 1.04M4.1 13.91l2.79 1.04-.49 2.94M9.7 19.8l2.3-1.9 2.3 1.9M17.6 17.89l-.49-2.94 2.79-1.04M19.9 10.09l-2.79-1.04.49-2.94' }]],
    medal:     [['circle', { ...STROKE, cx: '12', cy: '9', r: '5' }], ['path', { ...STROKE, d: 'M9 13.3 7.5 21l4.5-2.5 4.5 2.5-1.5-7.7' }]],
    rainbow:   [['path', { ...STROKE, d: 'M3 17.5a9 9 0 0 1 18 0M6.5 17.5a5.5 5.5 0 0 1 11 0M10 17.5a2 2 0 0 1 4 0' }]],
    bone:      [['path', { d: 'M7.4 14.4 14.4 7.4l2.2 2.2-7 7Z' }], ['circle', { cx: '6.4', cy: '15.3', r: '2.5' }], ['circle', { cx: '8.7', cy: '17.6', r: '2.5' }],
                ['circle', { cx: '15.3', cy: '6.4', r: '2.5' }], ['circle', { cx: '17.6', cy: '8.7', r: '2.5' }]],
    globe:     [['circle', { ...STROKE, cx: '12', cy: '12', r: '9' }], ['path', { ...STROKE, d: 'M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3c-2.5 2.6-3.8 5.6-3.8 9s1.3 6.4 3.8 9' }]],
    undo:      [['path', { ...STROKE, d: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11' }]],
  };
  ICONS.prompt = [['path', { ...STROKE, d: 'm5 7 5 5-5 5M12.5 17.5H19' }]];
  ICONS.star = [['path', { ...STROKE, d: 'm12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6-4.5-4.2 6.1-.8L12 3.2Z' }]];
  ICONS.pin = [['path', { ...STROKE, d: 'M9 3.5h6l-1 6 3.5 3.5v1.5h-11V13L10 9.5l-1-6ZM12 14.5V21' }]];
  ICONS.clock = [['circle', { ...STROKE, cx: '12', cy: '12', r: '8.5' }], ['path', { ...STROKE, d: 'M12 7.5V12l3 2' }]];
  ICONS.pause = [['path', { ...STROKE, d: 'M9 6v12M15 6v12' }]];
  ICONS.tag = [['path', { ...STROKE, d: 'M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l7.9 7.9a1 1 0 0 1 0 1.4l-6.7 6.7a1 1 0 0 1-1.4 0Z' }], ['circle', { cx: '8.2', cy: '8.2', r: '1.6' }]];
  ICONS.copy = [['path', { ...STROKE, d: 'M8.5 8.5h10v11h-10zM5.5 15.5v-11h10' }]];
  ICONS.flag = [['path', { ...STROKE, d: 'M6 21V4M6 4.5h11.5l-2.4 3.9 2.4 3.9H6' }]];
  ICONS.sort = [['path', { ...STROKE, d: 'M8 4.5v15M4.5 8 8 4.5 11.5 8M16 19.5v-15M12.5 16l3.5 3.5 3.5-3.5' }]];
  ICONS.up = [['path', { d: 'm12 8.4 5.8 5.8-1.4 1.4-4.4-4.4-4.4 4.4-1.4-1.4L12 8.4Z' }]];
  ICONS.down = [['path', { d: 'm12 15.6-5.8-5.8 1.4-1.4 4.4 4.4 4.4-4.4 1.4 1.4-5.8 5.8Z' }]];
  ICONS.grip = [['circle', { cx: '9', cy: '6.5', r: '1.6' }], ['circle', { cx: '15', cy: '6.5', r: '1.6' }], ['circle', { cx: '9', cy: '12', r: '1.6' }],
                ['circle', { cx: '15', cy: '12', r: '1.6' }], ['circle', { cx: '9', cy: '17.5', r: '1.6' }], ['circle', { cx: '15', cy: '17.5', r: '1.6' }]];
  ICONS.gear = [['circle', { ...STROKE, cx: '12', cy: '12', r: '3' }], ['path', { ...STROKE, d: 'M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.5 7.5 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.4Z' }]];
  ICONS.keyboard = [['rect', { ...STROKE, x: '2.5', y: '6', width: '19', height: '12', rx: '2' }], ['path', { ...STROKE, d: 'M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14h8' }]];
  ICONS.plug = [['path', { ...STROKE, d: 'M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0V8ZM12 16.5V21' }]];
  ICONS.download = [['path', { ...STROKE, d: 'M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14' }]];
  ICONS.upload = [['path', { ...STROKE, d: 'M12 15.5v-11M7.5 9 12 4.5 16.5 9M5 19.5h14' }]];
  ICONS.shuffle = [['path', { ...STROKE, d: 'M3.5 7h3.2c4.6 0 6 10 10.6 10h3.2M3.5 17h3.2c1.6 0 2.8-1.2 3.8-2.8M13.5 9.8c1-1.6 2.2-2.8 3.8-2.8h3.2M18 4.5 20.5 7 18 9.5M18 14.5l2.5 2.5-2.5 2.5' }]];
  ICONS.check = [['path', { d: 'M9.5 15.086 18.793 5.793l1.414 1.414L9.5 17.914l-5.707-5.707 1.414-1.414L9.5 15.086Z' }]];

  function icon(name, className) {
    const svg = createSvg('svg', { viewBox: '0 0 24 24', width: '20', height: '20', 'aria-hidden': 'true', focusable: 'false', class: className || 'rb-icon' });
    for (const [tag, attrs] of ICONS[name]) svg.append(createSvg(tag, attrs));
    return svg;
  }

  // The rainbow paw: main pad is your current color, the four toes are the rest of the wheel.
  function pawIcon(className, colors) {
    const svg = icon('paw', `rb-paw ${className || ''}`.trim());
    if (colors) colors.forEach((color, index) => svg.style.setProperty(`--rb-pad-${index}`, color));
    return svg;
  }

  function pup(mood = 'happy') {
    const happy = mood === 'happy';
    const eyes = happy
      ? [createSvg('circle', { cx: '24', cy: '31', r: '3.2', fill: '#2a1d26' }), createSvg('circle', { cx: '40', cy: '31', r: '3.2', fill: '#2a1d26' }),
         createSvg('circle', { cx: '25.1', cy: '29.9', r: '1', fill: '#fff' }), createSvg('circle', { cx: '41.1', cy: '29.9', r: '1', fill: '#fff' })]
      : [createSvg('path', { d: 'M20.5 31.5q3.5 3 7 0M36.5 31.5q3.5 3 7 0', stroke: '#2a1d26', 'stroke-width': '2', fill: 'none', 'stroke-linecap': 'round' })];
    return createSvg('svg', { viewBox: '0 0 64 64', class: 'rb-pup', 'aria-hidden': 'true', focusable: 'false' },
      createSvg('path', { d: 'M32 9c13 0 21 9.5 21 23 0 14-9.5 23-21 23S11 46 11 32C11 18.5 19 9 32 9Z', fill: '#ffe7f1' }),
      createSvg('ellipse', { cx: '41', cy: '30.5', rx: '6.2', ry: '6', fill: '#ffc9de' }),
      createSvg('path', { d: 'M19.5 11.5C9 9.5 3.5 21 6.5 33.5c1.4 5.6 7.6 5.4 9.2-.2l3.8-13.5c1.1-3.9 2.6-7.2 0-8.3Z', fill: '#f58ab6' }),
      createSvg('path', { d: 'M44.5 11.5C55 9.5 60.5 21 57.5 33.5c-1.4 5.6-7.6 5.4-9.2-.2l-3.8-13.5c-1.1-3.9-2.6-7.2 0-8.3Z', fill: '#f58ab6' }),
      createSvg('ellipse', { cx: '32', cy: '42.5', rx: '10.5', ry: '7.5', fill: '#fff' }),
      createSvg('ellipse', { cx: '19.5', cy: '39.5', rx: '3', ry: '2', fill: '#ff7aa8', opacity: '.45' }),
      createSvg('ellipse', { cx: '44.5', cy: '39.5', rx: '3', ry: '2', fill: '#ff7aa8', opacity: '.45' }),
      ...eyes,
      createSvg('path', { d: 'M28.6 37.6c0-1.3 1.6-2 3.4-2s3.4.7 3.4 2c0 1.4-1.9 2.9-3.4 2.9s-3.4-1.5-3.4-2.9Z', fill: '#2a1d26' }),
      happy ? createSvg('path', { d: 'M30.3 45.2h3.4v2.6a1.7 1.7 0 0 1-3.4 0Z', fill: '#ff7aa8' }) : null,
      createSvg('path', { d: 'M32 40.5v2.6M28 43.6q2 2.1 4 0 2 2.1 4 0', stroke: '#2a1d26', 'stroke-width': '1.5', fill: 'none', 'stroke-linecap': 'round' }));
  }

  /* =========================================================================
   * Persistent state
   * ========================================================================= */

  // base: a built-in language, or 'auto' to follow Twitch.
  const defaultLang = () => ({ base: 'auto' });

  // The built-in language matching Twitch's own (then the browser's), or English.
  function pageLanguage() {
    const tags = [document.documentElement && document.documentElement.lang, ...(navigator.languages || []), navigator.language];
    for (const tag of tags) {
      const code = String(tag || '').toLowerCase().split('-')[0];
      if (code && Object.hasOwn(LANGUAGES, code)) return code;
    }
    return 'en';
  }
  const resolveBase = base => (base === 'auto' || !Object.hasOwn(LANGUAGES, base) ? pageLanguage() : base);
  const languageText = (code, key) => (LANGUAGES[code].strings[key] ?? DEFAULT_TEXT[key] ?? key);

  const defaults = () => ({
    badgeOn: true,
    colorOn: true,
    shortcutOn: true,
    paused: false,
    disabledBadges: SEED_DISABLED_BADGES.map(normalize),
    favoriteBadges: [],
    pinnedBadges: {},      // channel -> badge always worn there
    badgeOrder: 'shuffle', // or 'order'
    badgeSequence: [],     // your own badge order; empty means Twitch's order
    badgeSets: {},         // channel -> the only badges that rotate there
    lastBadge: null,       // the last badge the rotation picked, so "in order" carries on after a reload
    blacklist:      SEED_BLACKLIST.map(normalize),
    colorPos: {},
    hashes: {},
    wheel: { ...WHEEL_DEFAULTS },
    palette: 'rainbow',
    colorOrder: 'cycle',   // or 'random'
    blend: 0,
    customColors: [],
    snippets: [],
    freeFormat: 'hex',   // how Twitch wants its free colors sent; learned the first time one is used
    guideDone: false,    // the setup walkthrough has been finished or put off, so it won't open by itself again
    setupComplete: false, // all three hashes have been captured at some point; missing ones later mean Twitch changed something
    timing: { ...TIMING_DEFAULTS },   // change every N messages, and no sooner than N seconds after the last change
    pronouns: { ...PRONOUN_LOOK.DEFAULTS },   // whether and how pronoun tags show (pronouns.js puts them in)
    lang: defaultLang(),
    stats: { styled: 0 },  // messages that went out with a new badge or color
  });

  function cleanLang(raw) {
    const clean = defaultLang();
    if (isObject(raw) && Object.hasOwn(LANGUAGES, raw.base)) clean.base = raw.base;
    return clean;
  }

  const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
  // Lowercase ids (badges, channels), each once.
  const cleanIds = list => (Array.isArray(list) ? [...new Set(list.filter(item => typeof item === 'string').map(normalize).filter(Boolean))] : []);
  // channel -> value, keeping the entries `cleanValue` accepts (it returns null for the rest).
  function cleanChannelMap(raw, cleanValue) {
    const clean = {};
    if (isObject(raw)) for (const channel in raw) { const value = cleanValue(raw[channel]); if (normalize(channel) && value != null) clean[normalize(channel)] = value; }
    return clean;
  }
  // Numbers kept within their limits; anything missing gets its default (older saves also had settings since dropped).
  function cleanNumbers(raw, defaultValues, limits) {
    const clean = { ...defaultValues };
    for (const key in defaultValues) if (isObject(raw) && Number.isFinite(Number(raw[key])) && raw[key] !== null && raw[key] !== '') clean[key] = clamp(Number(raw[key]), limits[key]);
    return clean;
  }

  // '#RRGGBB' in capitals, or null if the text isn't a hex color. Three-digit colors are widened.
  function normalizeHex(text) {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(text || '').trim());
    if (!match) return null;
    const digits = match[1].length === 3 ? match[1].replace(/./g, digit => digit + digit) : match[1];
    return `#${digits.toUpperCase()}`;
  }

  const cleanPalette = id => (id === 'custom' || Object.hasOwn(PALETTES, id) ? id : 'rainbow');
  const cleanBlend = value => (Number.isFinite(value) ? clamp(value, [0, BLEND_MAX]) : 0);
  const cleanColors = list => (Array.isArray(list) ? list.map(normalizeHex).filter(Boolean).slice(0, CUSTOM_COLOR_LIMIT) : []);

  const isUsableToken = token => token.length >= 2 && token.length <= 32 && !/\s/.test(token);
  // Two words clash if they're the same, or one starts with the other (the longer one could never be typed).
  const tokensClash = (a, b) => { a = a.toLowerCase(); b = b.toLowerCase(); return a.startsWith(b) || b.startsWith(a); };

  // Keeps well-formed snippets only, and drops any whose word clashes with an earlier one.
  function cleanSnippets(list) {
    const clean = [];
    for (const item of Array.isArray(list) ? list : []) {
      if (!item || typeof item.trigger !== 'string' || typeof item.text !== 'string') continue;
      const trigger = item.trigger.trim(), text = item.text.trim().slice(0, SNIPPET_TEXT_LIMIT);
      if (!isUsableToken(trigger) || !text || clean.some(other => tokensClash(trigger, other.trigger))) continue;
      clean.push({ trigger, text });
      if (clean.length >= SNIPPET_LIMIT) break;
    }
    return clean;
  }

  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (raw == null) {
        for (const legacyKey of LEGACY_STORAGE_KEYS) {
          raw = localStorage.getItem(legacyKey);
          if (raw != null) { localStorage.setItem(STORAGE_KEY, raw); break; }
        }
      }
      return tidyState(JSON.parse(raw));
    } catch (error) { return defaults(); }
  }

  // Settings from storage, a file or another tab: anything missing gets its default, anything unusable is dropped.
  function tidyState(saved) {
    const raw = isObject(saved) ? saved : {};
    const clean = defaults();
    for (const key of ['badgeOn', 'colorOn', 'shortcutOn', 'paused', 'guideDone', 'setupComplete']) if (typeof raw[key] === 'boolean') clean[key] = raw[key];
    for (const key of ['disabledBadges', 'blacklist']) if (Array.isArray(raw[key])) clean[key] = cleanIds(raw[key]);
    clean.favoriteBadges = cleanIds(raw.favoriteBadges);
    clean.badgeSequence = cleanIds(raw.badgeSequence);
    clean.pinnedBadges = cleanChannelMap(raw.pinnedBadges, badgeId => (typeof badgeId === 'string' && normalize(badgeId)) || null);
    clean.badgeSets = cleanChannelMap(raw.badgeSets, ids => (Array.isArray(ids) ? cleanIds(ids) : null));
    clean.colorPos = cleanChannelMap(raw.colorPos, index => (Number.isInteger(index) && index >= 0 ? index : null));
    if (raw.badgeOrder === 'order') clean.badgeOrder = 'order';
    if (raw.colorOrder === 'random') clean.colorOrder = 'random';
    if (isObject(raw.stats) && Number.isInteger(raw.stats.styled) && raw.stats.styled > 0) clean.stats.styled = raw.stats.styled;
    if (typeof raw.lastBadge === 'string') clean.lastBadge = raw.lastBadge;
    if (isObject(raw.hashes)) for (const key of HASH_KEYS) if (typeof raw.hashes[key] === 'string' && raw.hashes[key]) clean.hashes[key] = raw.hashes[key];
    clean.setupComplete = clean.setupComplete || HASH_KEYS.every(key => clean.hashes[key]);
    clean.wheel = cleanNumbers(raw.wheel, WHEEL_DEFAULTS, WHEEL_LIMITS);
    clean.timing = cleanNumbers(raw.timing, TIMING_DEFAULTS, TIMING_LIMITS);
    clean.palette = cleanPalette(raw.palette);
    clean.blend = cleanBlend(raw.blend);
    clean.customColors = cleanColors(raw.customColors);
    clean.snippets = cleanSnippets(raw.snippets);
    if (['snake', 'camel', 'lower', 'upper'].includes(raw.freeFormat)) clean.freeFormat = raw.freeFormat;
    clean.pronouns = PRONOUN_LOOK.clean(raw.pronouns);
    clean.lang = cleanLang(raw.lang);
    if (Number.isFinite(raw.savedAt)) clean.savedAt = raw.savedAt;
    return clean;
  }

  // The userscript version of Rainbark may still be installed. Two copies would both change your badge and color,
  // so if one is already running this one only says so and stops.
  if (window.__rainbark || window.__rainbarkLoaded) {
    const warn = () => {
      const box = document.createElement('div');
      box.setAttribute('role', 'alert');
      box.textContent = languageText(pageLanguage(), 'app.duplicate');
      box.style.cssText = 'position:fixed;z-index:2147483647;inset-inline-end:12px;bottom:60px;max-width:300px;padding:10px 12px;border-radius:6px;'
        + 'background:#16121a;color:#f7f0f5;border:1px solid #ffd68a;font:13px/1.5 Inter,Roobert,Helvetica,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.4)';
      box.addEventListener('click', () => box.remove());
      document.body.append(box);
    };
    if (document.body) warn(); else document.addEventListener('DOMContentLoaded', warn, { once: true });
    return;
  }
  window.__rainbarkLoaded = true;

  // Whether this site already had Rainbark settings. If not, the extension's copy is used (see onBackup).
  let hadSavedSettings = (() => {
    try { return [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].some(key => localStorage.getItem(key) != null); } catch (error) { return false; }
  })();

  let state = loadState();

  const tellExtension = (type, payload) => emit('rainbark:to-extension', { type, ...payload });
  let backupTimer = null;
  function backUpSoon() {
    clearTimeout(backupTimer);
    backupTimer = setTimeout(() => tellExtension('save', { state: JSON.stringify(state) }), 400);
  }
  // Every save is stamped, so the newest copy wins between www.twitch.tv, the creator dashboard and other tabs.
  const writeLocal = () => {
    hadSavedSettings = true;   // from now on this site has settings of its own, so only newer copies are taken
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { log('save failed', error); }
  };
  const saveState = () => { state.savedAt = Date.now(); writeLocal(); backUpSoon(); };

  const isBadgeDisabled = badgeId => state.disabledBadges.includes(badgeId);
  const isChannelFrozen = login   => !!login && state.blacklist.includes(login);

  const capturedHashCount = () => HASH_KEYS.filter(key => state.hashes[key]).length;
  const hashesReady       = () => capturedHashCount() === HASH_KEYS.length;

  /* =========================================================================
   * Looking up text
   * ========================================================================= */

  let activeLanguage = resolveBase(state.lang.base);   // the built-in language in use
  function refreshLanguage() { activeLanguage = resolveBase(state.lang.base); }

  function setBaseLanguage(base) {
    state.lang.base = Object.hasOwn(LANGUAGES, base) ? base : 'auto';
    refreshLanguage();
  }

  function t(key, vars) {
    const text = languageText(activeLanguage, key);
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
  }

  // Shortcut words are the same in every language.
  const SHORTCUT_IDS = ['color', 'reset', 'freeze', 'unfreeze', 'pause', 'unpause', 'help'];
  const SHORTCUT_TOKENS = Object.fromEntries(SHORTCUT_IDS.map(id => [id, DEFAULT_TEXT[`shortcut.${id}`]]));
  const shortcutTokens = () => SHORTCUT_TOKENS;

  /* =========================================================================
   * GraphQL
   * ========================================================================= */

  const realFetch = window.fetch.bind(window);
  let authHeaders = null;

  function headersToObject(headers) {
    const result = {};
    if (!headers) return result;
    if (headers instanceof Headers) headers.forEach((value, key) => (result[key] = value));
    else if (Array.isArray(headers)) headers.forEach(([key, value]) => (result[key] = value));
    else Object.assign(result, headers);
    return result;
  }

  const hasAuthHeader    = headers => Object.keys(headers).some(key => key.toLowerCase() === 'authorization');
  const credentialsReady = () => !!authHeaders && hasAuthHeader(authHeaders);

  function graphqlHeaders() {
    const headers = Object.assign({}, authHeaders || {});
    const lowerKeys = Object.keys(headers).map(key => key.toLowerCase());
    if (!lowerKeys.includes('content-type')) headers['Content-Type'] = 'text/plain;charset=UTF-8';
    if (!lowerKeys.includes('client-id'))    headers['Client-Id'] = FALLBACK_CLIENT_ID;
    return headers;
  }

  async function callGraphQL(operationKey, variables) {
    const operationName = HASH_OPERATIONS[operationKey];
    const hash = state.hashes[operationKey];
    if (!operationName || !hash || !credentialsReady()) return null;
    try {
      const requestBody = [{ operationName, variables, extensions: { persistedQuery: { version: 1, sha256Hash: hash } } }];
      const response = await realFetch(GRAPHQL_URL, { method: 'POST', headers: graphqlHeaders(), body: JSON.stringify(requestBody) });
      const parsed = await response.json().catch(() => null);
      const result = parsed && parsed[0];
      const problems = result && result.errors ? result.errors.map(error => (error && error.message) || '?').join('; ') : null;
      log(`${operationName}: HTTP ${response.status}${problems ? `, errors: ${problems}` : result ? ', ok' : ', no reply'}`);
      if (result && result.errors && JSON.stringify(result.errors).includes('PersistedQueryNotFound')) {
        log(`${operationKey} hash is stale, clearing it for re-capture`);
        delete state.hashes[operationKey]; saveState(); renderPanel(); updateIndicator();
        openGuide();   // shows just the step Twitch needs to be seen doing again
        return null;
      }
      return result;
    } catch (error) { log(operationName, 'failed', error); return null; }
  }

  /* =========================================================================
   * Colors: the palette in use becomes `colorSequence`, the list walked one step per message
   * ========================================================================= */

  function hslToHex(hue, saturation, lightness) {
    saturation /= 100; lightness /= 100;
    const amplitude = saturation * Math.min(lightness, 1 - lightness);
    const channel = offset => {
      const segment = (offset + hue / 30) % 12;
      const value = lightness - amplitude * Math.max(-1, Math.min(segment - 3, 9 - segment, 1));
      return Math.round(255 * value).toString(16).padStart(2, '0');
    };
    return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
  }

  // Blending happens in Oklab, where halfway between two colors also looks halfway to the eye.
  const toLinear = value => { value /= 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; };
  const fromLinear = value => Math.round(255 * Math.min(1, Math.max(0, value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055)));

  function hexToOklab(hex) {
    const number = parseInt(hex.slice(1), 16);
    const r = toLinear(number >> 16 & 255), g = toLinear(number >> 8 & 255), b = toLinear(number & 255);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }

  function oklabToHex([lightness, a, b]) {
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                 -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                 -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return `#${rgb.map(value => fromLinear(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  }

  function mixHex(from, to, amount) {
    const start = hexToOklab(from), end = hexToOklab(to);
    return oklabToHex(start.map((value, index) => value + (end[index] - value) * amount));
  }

  // Adds `between` in-between shades after each color, including from the last color back round to the first.
  function blendColors(colors, between) {
    if (colors.length < 2 || !between) return [...colors];
    return colors.flatMap((color, index) => {
      const next = colors[(index + 1) % colors.length];
      return [color, ...Array.from({ length: between }, (_, step) => mixHex(color, next, (step + 1) / (between + 1)))];
    });
  }

  const rainbowColors = steps => Array.from({ length: Math.max(1, steps) },
    (_, index) => hslToHex((360 * index / steps) % 360, state.wheel.sat, state.wheel.lBase));

  // The colors a palette is made of, before blending. Null means "use the rainbow wheel".
  function paletteColors(id) {
    const colors = id === 'custom' ? state.customColors : PALETTES[id];
    if (!colors || !colors.length) return null;
    return colors.length > 2 && colors[0] === colors[colors.length - 1] ? colors.slice(0, -1) : colors;
  }

  let colorSequence = [];
  function buildColorSequence() {
    const colors = paletteColors(state.palette);
    if (!colors) colorSequence = rainbowColors(state.wheel.steps);
    else colorSequence = blendColors(colors, state.palette === 'twitch' ? 0 : state.blend); // blended shades wouldn't be free colors
  }
  buildColorSequence();

  function rebuildColorWheel() { buildColorSequence(); primeChannelColor(currentChannel()); updateIndicator(); }

  let activeColorChannel = null;
  let colorIndex = 0;
  let appliedColor = null; // your name color as far as Rainbark knows (set by it or by hand), shown in the toolbar paw
  const recentColors = [];  // newest first, this visit only

  function rememberColor(hex) {
    if (!hex || recentColors[0] === hex) return;
    const seen = recentColors.indexOf(hex);
    if (seen >= 0) recentColors.splice(seen, 1);
    recentColors.unshift(hex);
    recentColors.length = Math.min(recentColors.length, RECENT_LIMIT);
  }

  function channelColorIndex(login) {
    if (login && activeColorChannel === login) return colorIndex;
    return Number.isInteger(state.colorPos[login]) ? state.colorPos[login] : 0;
  }
  const channelColor = login => colorSequence[channelColorIndex(login) % colorSequence.length];

  // This channel's color first, then colors spread evenly around the rest of the palette. These paint the paw,
  // so it shows the palette and turns a little with every message.
  function pawColors() {
    const length = colorSequence.length;
    const start = channelColorIndex(currentChannel());
    return Array.from({ length: 5 }, (_, pad) => colorSequence[(start + Math.round(pad * length / 5)) % length]);
  }

  /* ---- Asking Twitch for a color ----
   * Custom hex colors need Turbo or Prime. Without them Twitch only accepts its 15 free colors, and it may want
   * those by name rather than by hex. So a free color is tried as hex first, then by name, and whichever way
   * Twitch accepts is remembered. Twitch's reply is read (when it includes your color) to tell whether a change stuck.
   */

  const TWITCH_BY_HEX = new Map(TWITCH_COLORS.map(color => [color.hex, color]));
  const snakeName = name => name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  const FREE_FORMATS = {
    hex:   color => color.hex,
    snake: color => snakeName(color.name),                 // blue_violet
    camel: color => color.name,                            // BlueViolet
    lower: color => color.name.toLowerCase(),              // blueviolet
    upper: color => snakeName(color.name).toUpperCase(),   // BLUE_VIOLET
  };
  const FREE_FORMATS_TO_TRY = ['hex', 'snake', 'camel'];   // "lower" and "upper" are only used once seen from Twitch itself

  // { color, format } for a free color written any of those ways, else null.
  function readFreeColor(value) {
    const text = String(value || '').trim();
    for (const color of TWITCH_COLORS)
      for (const format in FREE_FORMATS)
        if (FREE_FORMATS[format](color) === (format === 'hex' ? normalizeHex(text) : text)) return { color, format };
    return null;
  }

  const readColor = value => normalizeHex(value) || (readFreeColor(value) || { color: {} }).color.hex || null;

  // The first value under `key` anywhere in a reply that `accept` makes something of (by default: an object).
  function findInReply(value, key, accept = found => (isObject(found) ? found : null), depth = 0) {
    if (!value || typeof value !== 'object' || depth > 6) return null;
    for (const name in value) {
      const found = (name === key && accept(value[name])) || findInReply(value[name], key, accept, depth + 1);
      if (found) return found;
    }
    return null;
  }

  // The name color in Twitch's reply, if it sent one back.
  const colorInReply = reply => findInReply(reply, 'chatColor', found => (typeof found === 'string' ? readColor(found) : null));

  let lastRequestedColor = null;
  let replyRunsBehind = false; // Twitch's replies turned out to show the color before the change, so they're ignored

  // 'ok' (changed), 'rejected' (Twitch said no) or 'failed' (the request didn't happen; try again later)
  async function requestColor(value, hex) {
    const before = appliedColor, previousRequest = lastRequestedColor;
    const result = await callGraphQL('updateColor', { input: { color: value } });
    if (!result) return 'failed';
    lastRequestedColor = hex;
    if (result.errors) { log('color refused', value, result.errors); return 'rejected'; }
    const now = replyRunsBehind ? null : colorInReply(result.data);
    if (!now || now === hex) { appliedColor = hex; return 'ok'; }
    if (now === previousRequest && previousRequest !== before) { replyRunsBehind = true; appliedColor = hex; return 'ok'; }
    appliedColor = now;
    return before && now !== before ? 'ok' : 'rejected'; // 'ok' here: Twitch changed it, to a slightly different color
  }

  // What was last sent to Twitch from any twitch.tv tab, kept in site storage: a tab that gets focus back only re-sends
  // its color or pinned badge when another tab has changed it since.
  const LAST_SENT_KEY = 'rainbark_last_sent';
  function lastSent() {
    try { const saved = JSON.parse(localStorage.getItem(LAST_SENT_KEY) || 'null'); return isObject(saved) ? saved : {}; }
    catch (error) { return {}; }
  }
  function noteSent(changes) {
    try { localStorage.setItem(LAST_SENT_KEY, JSON.stringify({ ...lastSent(), ...changes })); } catch (error) { /* storage off */ }
  }

  let freeColorsRefused = false;   // Twitch turned down a free color every way this session
  let refusalToastShown = false;

  // One color change at a time, in the order they were asked for.
  let colorQueue = Promise.resolve();
  function setNameColor(hexColor) {
    const run = colorQueue.then(() => applyNameColor(hexColor));
    colorQueue = run.catch(error => log('color change failed', error));
    return run;
  }

  async function applyNameColor(hexColor) {
    const free = TWITCH_BY_HEX.get(hexColor);
    let outcome = 'failed';
    if (!free || freeColorsRefused) {
      outcome = await requestColor(hexColor, hexColor);
    } else {
      const formats = [state.freeFormat, ...FREE_FORMATS_TO_TRY.filter(format => format !== state.freeFormat)];
      for (const format of formats) {
        outcome = await requestColor(FREE_FORMATS[format](free), hexColor);
        if (outcome === 'ok' && state.freeFormat !== format) { state.freeFormat = format; saveState(); }
        if (outcome !== 'rejected') break;
      }
      if (outcome === 'rejected') freeColorsRefused = true;
    }
    if (outcome === 'ok') { log('color changed', appliedColor); rememberColor(appliedColor); noteSent({ color: appliedColor }); updateIndicator(true); }
    if (outcome === 'rejected') {
      updateIndicator();
      if (!refusalToastShown) {
        refusalToastShown = true;
        showToast(t(free ? 'toast.freeRejected' : 'toast.colorRejected', { color: hexColor }), 'error');
      }
    }
    return outcome;
  }

  const loadColorPosition = login => {
    activeColorChannel = login;
    colorIndex = Number.isInteger(state.colorPos[login]) ? state.colorPos[login] : 0;
  };

  // Sets this channel's current color. While Twitch's sign-in details aren't known yet it waits and retries;
  // a newer call replaces one that's still waiting.
  let primeRetryTimer = null;
  function primeChannelColor(login, attempt = 0) {
    clearTimeout(primeRetryTimer);
    if (!login || state.paused || !state.colorOn || isChannelFrozen(login)) return;
    if (!credentialsReady()) { if (attempt < 20) primeRetryTimer = setTimeout(() => primeChannelColor(login, attempt + 1), 500); return; }
    loadColorPosition(login);
    setNameColor(colorSequence[colorIndex % colorSequence.length]);
  }

  function restartChannelColor(login) {
    delete state.colorPos[login];
    if (activeColorChannel === login) colorIndex = 0;
    saveState(); renderPanel(); updateIndicator(); primeChannelColor(login);
  }

  // Moves on a step. A color Twitch refuses is skipped rather than retried forever; only a request that
  // never happened leaves the position where it was.
  // The new position is saved straight away, so nothing reading it while the request is on its way (a tab getting
  // focus back, say) puts the old color back on.
  // The step after `from`: the next color, or in random order any other color.
  function stepAfter(from) {
    const length = colorSequence.length;
    if (state.colorOrder !== 'random' || length < 3) return (from + 1) % length;
    const jump = 1 + Math.floor(Math.random() * (length - 1));
    return (from + jump) % length;
  }

  // What the next message in this channel will most likely get. Random order can't know, so it shows nothing.
  const upcomingColor = login => (state.colorOrder === 'random' ? null : colorSequence[(channelColorIndex(login) + 1) % colorSequence.length]);

  async function advanceColor(login) {
    if (activeColorChannel !== login) loadColorPosition(login);
    const previousIndex = colorIndex;
    const index = colorIndex = stepAfter(colorIndex % colorSequence.length);
    state.colorPos[login] = index; saveState();
    const outcome = await setNameColor(colorSequence[index % colorSequence.length]);
    if (outcome === 'failed' && state.colorPos[login] === index) {
      colorIndex = previousIndex; state.colorPos[login] = previousIndex; saveState();
    }
  }

  function selectPalette(id) {
    state.palette = cleanPalette(id);
    saveState();
    freeColorsRefused = false; refusalToastShown = false;
    rebuildColorWheel(); renderPanel();
  }

  /* =========================================================================
   * Badges: a new one each message, shuffled or in order, with favorites and per-channel pins
   * ========================================================================= */

  let ownedBadges = [];
  const badgeBags = new Map();  // shuffle rounds in progress: '' for everywhere, or a channel with its own set
  let currentBadgeId = null;  // the badge you're wearing, as far as Rainbark knows
  let lastPickedBadge = null; // the rotation's latest pick, set before Twitch confirms it (messages can come faster than replies)
  let badgeFromPin = false;   // true when that badge was put on by a channel's pin

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const isFavoriteBadge = badgeId => state.favoriteBadges.includes(badgeId);
  const badgeSetFor = login => (login && state.badgeSets[login]) || null;
  // Whether a badge takes part in the rotation in this channel: its own set if it has one, otherwise your switches.
  const inRotation = (badge, login) => { const set = badgeSetFor(login); return set ? set.includes(normalize(badge.setID)) : !isBadgeDisabled(badge.setID); };
  const enabledBadges = login => ownedBadges.filter(badge => inRotation(badge, login));
  const badgeById = badgeId => ownedBadges.find(badge => badge.setID === badgeId) || null;
  // Your badges in your own order. Badges you haven't placed (new ones) follow in Twitch's order.
  function orderedBadges() {
    if (!state.badgeSequence.length) return ownedBadges;
    const place = new Map(state.badgeSequence.map((badgeId, index) => [badgeId, index]));
    const rank = (badge, index) => (place.has(normalize(badge.setID)) ? place.get(normalize(badge.setID)) : state.badgeSequence.length + index);
    return ownedBadges.map((badge, index) => ({ badge, rank: rank(badge, index) })).sort((a, b) => a.rank - b.rank).map(entry => entry.badge);
  }

  const pinnedBadgeFor = login => (login && state.pinnedBadges[login] ? badgeById(state.pinnedBadges[login]) : null);

  // One round of the shuffle: every badge once, favorites FAVORITE_WEIGHT times, and the same badge
  // never twice in a row where that can be helped. The bag is used from its end.
  function newBadgeBag(login) {
    const round = enabledBadges(login).flatMap(badge => Array(isFavoriteBadge(badge.setID) ? FAVORITE_WEIGHT : 1).fill(badge.setID));
    const worn = lastPickedBadge || currentBadgeId;
    const noRepeats = bag => bag.every((badgeId, i) => badgeId !== (i === bag.length - 1 ? worn : bag[i + 1]));
    let bag = shuffle(round.slice());
    for (let tries = 0; tries < 100 && !noRepeats(bag); tries++) bag = shuffle(round.slice());   // a few tries always find one when one exists
    return bag;
  }

  function nextBadge(login) {
    const count = ownedBadges.length;
    if (state.badgeOrder === 'order') {
      const sequence = orderedBadges();
      const from = sequence.findIndex(badge => badge.setID === state.lastBadge);
      for (let step = 1; step <= count; step++) {
        const badge = sequence[(from + step) % count];
        if (inRotation(badge, login)) return badge;
      }
      return null;
    }
    const key = badgeSetFor(login) ? login : '';
    let bag = (badgeBags.get(key) || []).filter(badgeId => { const badge = badgeById(badgeId); return badge && inRotation(badge, login); });
    if (!bag.length) bag = newBadgeBag(login);
    const badge = bag.length ? badgeById(bag.pop()) : null;
    badgeBags.set(key, bag);
    if (badge) lastPickedBadge = badge.setID;
    return badge;
  }

  async function wearBadge(badge, fromPin) {
    const result = await callGraphQL('selectBadge', { input: { badgeSetID: badge.setID, badgeSetVersion: badge.version } });
    if (!result) return false;
    if (result.errors) { log('badge error', result.errors); return false; }
    log('badge changed', badge.setID);
    currentBadgeId = badge.setID; badgeFromPin = fromPin;
    noteSent({ badge: badge.setID });
    refreshLiveViews();
    return true;
  }

  async function advanceBadge(login = currentChannel()) {
    if (!ownedBadges.length) return loadBadges();
    const badge = nextBadge(login);
    if (badge && await wearBadge(badge, false)) { state.lastBadge = badge.setID; saveState(); }
  }

  // Puts on this channel's pinned badge, or goes back to rotating after leaving a pinned channel.
  // `force` re-sends the pin even if Rainbark thinks it's already on (another tab may have changed it).
  function primeChannelBadge(login, force) {
    if (state.paused || !state.badgeOn || !hashesReady() || !credentialsReady() || !ownedBadges.length) return;
    const pinned = pinnedBadgeFor(login);
    if (pinned) { if (force || currentBadgeId !== pinned.setID) return wearBadge(pinned, true); badgeFromPin = true; }
    else if (badgeFromPin) return advanceBadge(login);
  }

  async function loadBadges() {
    const result = await callGraphQL('badges', { channelLogin: currentChannel() || 'twitch' });
    if (!result) return;
    const available = result.data && result.data.currentUser && result.data.currentUser.availableBadges;
    if (!Array.isArray(available)) { log('no badges, logged in?'); return; }
    ownedBadges = available
      .filter(badge => badge && badge.setID)
      .map(badge => ({
        setID: badge.setID,
        version: badge.version || '1',
        title: badge.title || badge.setID,
        image: badge.image1x || null,
        image2x: badge.image2x || null,
      }));
    badgeBags.clear();
    const selected = findInReply(result.data, 'selectedBadge');
    if (!currentBadgeId && selected && typeof selected.setID === 'string') currentBadgeId = selected.setID;
    log(`loaded ${ownedBadges.length} badges`);
    primeChannelBadge(currentChannel());
    renderPanel();
  }

  /* =========================================================================
   * Channel tracking
   * ========================================================================= */

  // www.twitch.tv/<channel>, /popout/<channel>/chat, /embed/<channel>/chat, /moderator/<channel>,
  // and dashboard.twitch.tv/u/<you>/stream-manager (and its popout chat).
  function currentChannel() {
    const segments = location.pathname.split('/').filter(Boolean).map(normalize);
    const login = segment => (segment && /^[a-z0-9_]{1,25}$/.test(segment) ? segment : null);
    if (location.hostname === 'dashboard.twitch.tv') { const at = segments.indexOf('u'); return at >= 0 ? login(segments[at + 1]) : null; }
    if (['moderator', 'popout', 'embed'].includes(segments[0])) return segments[1] === 'u' ? null : login(segments[1]);
    return segments.length && !RESERVED_PATHS.has(segments[0]) ? login(segments[0]) : null;
  }

  let lastSeenChannel = null;
  function checkForChannelChange() {
    const login = currentChannel();
    if (login === lastSeenChannel) return;
    lastSeenChannel = login;
    primeChannelColor(login);
    primeChannelBadge(login);
    renderPanel();
    updateIndicator();
  }

  let lastReassertTime = 0;
  // Coming back to this tab: another Twitch tab may have changed your color or badge for its own channel. Put this
  // channel's back, but only if something actually changed, and not while a message and its change are under way
  // (they're setting it already).
  function reassertColorOnFocus() {
    const now = Date.now();
    if (now - lastReassertTime < 400) return;
    lastReassertTime = now;
    const login = currentChannel();
    if (!login || messagesUnderWay > 0) return;
    const sent = lastSent();
    const wanted = colorSequence.length ? colorSequence[(Number.isInteger(state.colorPos[login]) ? state.colorPos[login] : 0) % colorSequence.length] : null;
    if (!wanted || sent.color !== wanted) primeChannelColor(login);
    const pinned = pinnedBadgeFor(login);
    if (pinned && sent.badge !== pinned.setID) primeChannelBadge(login, true);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) reassertColorOnFocus(); });
  window.addEventListener('focus', reassertColorOnFocus);

  /* =========================================================================
   * Chat shortcuts: typed into the chat box, acted on instantly, never sent as typed
   *   >color     is replaced with your current hex
   *   >reset     this channel's color restarts from the first one
   *   >freeze    your color stops changing in this channel      (>unfreeze undoes it)
   *   >pause     badge and color changes stop everywhere        (>unpause undoes it)
   *   >help      opens the list of shortcuts
   *
   * Twitch's chat box is a Slate editor: it keeps its own model of the message and sends
   * that, not the on-screen text. So edits go through Slate's editor (found via React's
   * fiber tree), fall back to the beforeinput events Slate listens for, and only touch the
   * DOM directly for plain text boxes.
   * ========================================================================= */

  function colorShortcutText(token) {
    if (appliedColor) return appliedColor;
    showToast(t('toast.noColor', { token }), 'error');
    return null;
  }

  // For shortcuts that act on the channel you're in.
  function channelShortcutText(token) {
    if (currentChannel()) return '';
    showToast(t('toast.needChannel', { token }), 'error');
    return null;
  }

  function resetFromShortcut() {
    const login = currentChannel();
    restartChannelColor(login);
    if (state.paused)                 showToast(t('toast.restartPaused', { channel: login }));
    else if (isChannelFrozen(login))  showToast(t('toast.restartFrozen', { channel: login }));
    else if (!state.colorOn)          showToast(t('toast.restartOff', { channel: login }));
    else if (!hashesReady())          showToast(t('toast.restartSetup', { channel: login }));
    else                              showToast(t('toast.restarted', { channel: login }));
  }

  function freezeFromShortcut(freeze) {
    const login = currentChannel();
    const changed = setChannelFrozen(login, freeze);
    showToast(t(freeze ? (changed ? 'toast.frozen' : 'toast.alreadyFrozen') : (changed ? 'toast.unfrozen' : 'toast.notFrozen'), { channel: login }));
  }

  function pauseFromShortcut(pause) {
    const changed = setPaused(pause);
    showToast(t(pause ? (changed ? 'toast.paused' : 'toast.alreadyPaused') : (changed ? 'toast.unpaused' : 'toast.notPaused')));
  }

  // Opens the list without taking the cursor out of the chat box, and above the box so you can still see what you type.
  function showShortcutHelp() {
    if (!panel) return;
    if (isPanelOpen()) { panelClearsChatBox = true; setView('shortcuts', currentView === 'shortcuts' ? 0 : 1); }
    else openPanel('shortcuts', false);
  }

  // text(token): what replaces the word ('' removes it), or null to leave it as typed.
  // after(): runs only once the word has been replaced.
  const SHORTCUT_ACTIONS = {
    color:    { text: colorShortcutText },
    reset:    { text: channelShortcutText, after: resetFromShortcut },
    freeze:   { text: channelShortcutText, after: () => freezeFromShortcut(true) },
    unfreeze: { text: channelShortcutText, after: () => freezeFromShortcut(false) },
    pause:    { text: () => '', after: () => pauseFromShortcut(true) },
    unpause:  { text: () => '', after: () => pauseFromShortcut(false) },
    help:     { text: () => '', after: showShortcutHelp },
  };

  /* ---- Snippets: your own words that turn into saved text ---- */

  // Why a word can't be a snippet's shortcut: 'short', 'builtin' or 'taken'. Null when it's fine.
  function snippetProblem(trigger, ownIndex, tokens = shortcutTokens()) {
    trigger = String(trigger || '').trim();
    if (!isUsableToken(trigger)) return 'short';
    if (SHORTCUT_IDS.some(id => tokensClash(trigger, tokens[id]))) return 'builtin';
    if (state.snippets.some((other, index) => index !== ownIndex && tokensClash(trigger, other.trigger))) return 'taken';
    return null;
  }

  // Snippet extras. {pick:a|b|c} and {number:1-6} are random each time; the rest are filled in from what's current.
  const SNIPPET_EXTRAS = { channel: '{channel}', me: '{me}', color: '{color}', badge: '{badge}', palette: '{palette}', time: '{time}',
    date: '{date}', pick: '{pick:hi|hey|hello}', number: '{number:1-100}' };
  function expandSnippet(text) {
    const now = new Date();
    const badge = badgeById(currentBadgeId);
    const values = {
      channel: currentChannel(), color: appliedColor, me: viewerName(), badge: badge && badge.title, palette: paletteName(state.palette),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: now.toLocaleDateString(),
    };
    const random = count => Math.floor(Math.random() * count);
    return text.replace(/\s*\n\s*/g, ' ')
      .replace(/\{pick:([^{}]*)\}/g, (match, list) => { const choices = list.split('|').map(choice => choice.trim()).filter(Boolean); return choices.length ? choices[random(choices.length)] : match; })
      .replace(/\{number:\s*(-?\d{1,9})\s*-\s*(-?\d{1,9})\s*\}/g, (match, a, b) => { const low = Math.min(+a, +b), high = Math.max(+a, +b); return String(low + random(high - low + 1)); })
      .replace(/\{(channel|color|time|date|me|badge|palette)\}/g, (match, name) => values[name] || match);
  }

  function activeShortcuts() {
    const tokens = shortcutTokens();
    const builtIn = SHORTCUT_IDS.map(id => ({ id, token: tokens[id], ...SHORTCUT_ACTIONS[id] }));
    const snippets = state.snippets
      .filter((snippet, index) => !snippetProblem(snippet.trigger, index, tokens))
      .map(snippet => ({ id: 'snippet', token: snippet.trigger, wholeWord: true, text: () => expandSnippet(snippet.text) }));
    // longest first, so a word that ends with another word (">unpause" / "pause") wins
    return [...builtIn, ...snippets].sort((a, b) => b.token.length - a.token.length);
  }

  // Snippets only fire as a word of their own: at the start of the message or after a space.
  function matchShortcut(textBeforeCaret) {
    if (typeof textBeforeCaret !== 'string') return null;
    return activeShortcuts().find(shortcut => {
      const start = textBeforeCaret.length - shortcut.token.length;
      if (start < 0 || textBeforeCaret.slice(start).toLowerCase() !== shortcut.token.toLowerCase()) return false;
      return !shortcut.wholeWord || start === 0 || /\s/.test(textBeforeCaret[start - 1]);
    }) || null;
  }

  const isSlateEditor = candidate => !!candidate && typeof candidate === 'object' && Array.isArray(candidate.children)
    && 'selection' in candidate && typeof candidate.insertText === 'function' && typeof candidate.deleteBackward === 'function';

  function slateEditorFor(element) {
    const fiberKey = Object.keys(element).find(key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'));
    let fiber = fiberKey ? element[fiberKey] : null;
    for (let depth = 0; fiber && depth < 60; depth++, fiber = fiber.return) {
      const props = fiber.memoizedProps;
      if (!props || typeof props !== 'object') continue;
      if (isSlateEditor(props.editor)) return props.editor;
      if (isSlateEditor(props.value)) return props.value;
    }
    return null;
  }

  const samePoint = (a, b) => a.offset === b.offset && a.path.length === b.path.length && a.path.every((step, i) => step === b.path[i]);

  // Each replaceIn* returns the shortcut once its token has been swapped out.
  function replaceInSlate(editor) {
    const selection = editor.selection;
    if (!selection || !samePoint(selection.anchor, selection.focus)) return false;
    let node = editor;
    for (const index of selection.anchor.path) node = node && Array.isArray(node.children) ? node.children[index] : null;
    if (!node || typeof node.text !== 'string') return false;
    const shortcut = matchShortcut(node.text.slice(0, selection.anchor.offset));
    const replacement = shortcut && shortcut.text(shortcut.token);
    if (replacement == null) return false;
    for (let i = graphemeCount(shortcut.token); i > 0; i--) editor.deleteBackward('character');
    if (replacement) editor.insertText(replacement);
    return shortcut;
  }

  function domTextBeforeCaret(field) {
    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed || !selection.anchorNode || !field.contains(selection.anchorNode)) return null;
    if (selection.anchorNode.nodeType !== Node.TEXT_NODE) return null;
    return selection.anchorNode.textContent.slice(0, selection.anchorOffset).replace(/﻿/g, '');
  }

  // Returns true if an editor (Slate) handled the event and cancelled the browser's default.
  function fireBeforeInput(field, inputType, data) {
    const event = new InputEvent('beforeinput', { inputType, data: data == null ? null : data, bubbles: true, cancelable: true, composed: true });
    field.dispatchEvent(event);
    return event.defaultPrevented;
  }

  function replaceInContentEditable(field) {
    const shortcut = matchShortcut(domTextBeforeCaret(field));
    const replacement = shortcut && shortcut.text(shortcut.token);
    if (replacement == null) return false;
    const isSlate = field.hasAttribute('data-slate-editor');
    for (let i = graphemeCount(shortcut.token); i > 0; i--) {
      if (fireBeforeInput(field, 'deleteContentBackward')) continue;
      if (isSlate) { showToast(t('toast.chatBoxFailed', { token: shortcut.token }), 'error'); return false; }
      document.execCommand('delete');
    }
    if (replacement && !fireBeforeInput(field, 'insertText', replacement)) document.execCommand('insertText', false, replacement);
    return shortcut;
  }

  function replaceInTextField(field) {
    const caret = field.selectionStart;
    if (caret == null || caret !== field.selectionEnd) return false;
    const shortcut = matchShortcut(field.value.slice(0, caret));
    const replacement = shortcut && shortcut.text(shortcut.token);
    if (replacement == null) return false;
    const start = caret - shortcut.token.length;
    field.setSelectionRange(start, caret);
    // execCommand keeps undo history and notifies React; fall back to setting the value directly
    if (document.execCommand(replacement ? 'insertText' : 'delete', false, replacement)) return shortcut;
    const setValue = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value').set;
    setValue.call(field, field.value.slice(0, start) + replacement + field.value.slice(caret));
    field.setSelectionRange(start + replacement.length, start + replacement.length);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    return shortcut;
  }

  let shortcutBusy = false;
  function applyChatShortcut(field) {
    if (!state.shortcutOn || shortcutBusy || !field.isConnected) return;
    shortcutBusy = true;
    let applied = false;
    try {
      if (field.matches('textarea, input')) applied = replaceInTextField(field);
      else {
        const editor = slateEditorFor(field);
        applied = editor ? replaceInSlate(editor) : replaceInContentEditable(field);
      }
    } catch (error) { log('chat shortcut failed', error); }
    finally { shortcutBusy = false; }
    if (applied && applied.after) {
      try { applied.after(); } catch (error) { log('chat shortcut action failed', error); }
    }
  }

  let shortcutCheckQueued = false;
  function onChatInputEvent(event) {
    if (!state.shortcutOn || event.isComposing || shortcutBusy) return;
    const inputType = event.inputType || '';
    if (inputType.startsWith('delete') || inputType.startsWith('history')) return; // let undo/backspace restore a literal token
    const field = event.target && event.target.closest ? event.target.closest(CHAT_INPUT) : null;
    if (!field || shortcutCheckQueued) return;
    shortcutCheckQueued = true;
    // run after the editor has applied this keystroke to its own model
    setTimeout(() => { shortcutCheckQueued = false; applyChatShortcut(field); }, 0);
  }
  for (const type of ['beforeinput', 'input', 'compositionend']) document.addEventListener(type, onChatInputEvent, true);

  /* =========================================================================
   * Network hook: hash capture and outgoing-message detection
   * ========================================================================= */

  /*
   * Message timing. Twitch stamps each message with the badge and color you have at the moment it handles that message.
   * So the change for the next message only starts once Twitch has answered the one just sent (started any earlier,
   * it can overtake that message and land on it), and a message sent while a change is still on its way waits for it
   * (sent any earlier, it goes out with the old badge and color). Without both, quick messages repeat one color and
   * skip the next. Only quick messages ever wait: anything sent after the change has gone through goes straight out.
   */
  const HOLD_LIMIT_MS = 2500;   // never hold a message longer than this, whatever happens to a change
  const SETTLE_MS = 250;        // and give Twitch this long after a change before the next message
  let messagesSinceChange = 0, lastChangeAt = 0;
  let messagesUnderWay = 0;     // sent or waiting, and not yet through their change
  let changesDoneAt = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Runs when Twitch has accepted a message. Changes happen on every Nth message, and not sooner than the minimum gap.
  // Returns the change's requests, if it made any.
  function onChatMessageSent() {
    if (!hashesReady() || state.paused) return null;
    const login = currentChannel();
    messagesSinceChange++;
    const due = messagesSinceChange >= state.timing.every && Date.now() - lastChangeAt >= state.timing.gap * 1000;
    if (due) { messagesSinceChange = 0; lastChangeAt = Date.now(); }
    const changes = [];
    if (state.badgeOn && pinnedBadgeFor(login)) changes.push(primeChannelBadge(login));   // a pin holds whatever the timing
    else if (state.badgeOn && due) changes.push(advanceBadge(login));
    if (due && state.colorOn && login && !isChannelFrozen(login)) changes.push(advanceColor(login));
    if (!changes.some(Boolean)) return null;
    state.stats.styled++; saveState();
    return Promise.allSettled(changes).then(() => { changesDoneAt = Date.now(); });
  }

  // After Twitch answers a message: a message it dropped (a duplicate, slow mode and so on) never shows in chat, so
  // it doesn't use up a badge or color. Resolves once any change it set off has gone through.
  async function onSendReply(response) {
    let reply = null;
    try { reply = await response.clone().json(); } catch (error) { /* already read, or not JSON: assume it went */ }
    const dropped = reply && findInReply(reply, 'dropReason', found => (typeof found === 'string' && found ? found : null));
    if (dropped) { log(`message not sent (${dropped}), keeping the badge and color`); return; }
    await onChatMessageSent();
  }

  // Sends a chat message once the one before it has gone out, been answered, and had its change go through.
  // Messages keep their order, and each waits at most HOLD_LIMIT_MS for the one before it.
  let previousSent = Promise.resolve(), previousDone = Promise.resolve();
  function sendInTurn(send) {
    const sentBefore = previousSent, doneBefore = previousDone;
    let markSent, markDone;
    previousSent = new Promise(resolve => { markSent = resolve; });
    previousDone = new Promise(resolve => { markDone = resolve; });
    messagesUnderWay++;
    const started = Date.now();
    const sent = sentBefore
      .then(() => Promise.race([doneBefore, sleep(HOLD_LIMIT_MS)]))
      .then(() => { const settle = Math.min(SETTLE_MS, changesDoneAt + SETTLE_MS - Date.now()); return settle > 0 ? sleep(settle) : null; })
      .then(() => {
        const held = Date.now() - started;
        if (held >= 20) log(`message held ${held} ms for the badge and color change`);
        try { return send(); } finally { markSent(); }
      });
    sent.catch(() => markSent());
    sent.then(onSendReply).catch(() => {}).finally(() => { messagesUnderWay--; markDone(); });
    return sent;
  }

  function captureHashes(operations) {
    let changed = false;
    for (const op of operations) {
      if (!op || !op.operationName) continue;
      const key = OPERATION_TO_KEY[op.operationName];
      const hash = op.extensions && op.extensions.persistedQuery && op.extensions.persistedQuery.sha256Hash;
      if (key && hash && state.hashes[key] !== hash) {
        state.hashes[key] = hash;
        changed = true;
        log(`captured ${key} hash`);
        showToast(t('toast.hashFetched', { name: t(`hashes.${key}`) }));
      }
    }
    if (!changed) return;
    if (hashesReady()) state.setupComplete = true;
    saveState();
    renderPanel();
    renderGuide();
    updateIndicator();
    if (hashesReady()) { if (!ownedBadges.length) loadBadges(); else primeChannelBadge(currentChannel()); primeChannelColor(currentChannel()); }
  }

  // When you change your color by hand in Twitch, remember it so >color and the toolbar paw stay accurate.
  // If it was one of the free colors, this also shows how Twitch itself sends those.
  function noteManualColorChange(operations) {
    for (const op of operations) {
      if (!op || op.operationName !== HASH_OPERATIONS.updateColor) continue;
      const requested = op.variables && op.variables.input && op.variables.input.color;
      const hex = typeof requested === 'string' ? readColor(requested) : null;
      if (!hex) continue;
      const free = readFreeColor(requested);
      if (free && state.freeFormat !== free.format) { state.freeFormat = free.format; saveState(); }
      if (free) freeColorsRefused = false;
      appliedColor = hex;
      rememberColor(hex);
      noteSent({ color: hex });
      updateIndicator(true);
    }
  }

  // When you pick a badge by hand in Twitch, remember it so the preview stays right.
  function noteManualBadgeChange(operations) {
    for (const op of operations) {
      if (!op || op.operationName !== HASH_OPERATIONS.selectBadge) continue;
      const badgeId = op.variables && op.variables.input && op.variables.input.badgeSetID;
      if (typeof badgeId !== 'string' || !badgeId) continue;
      currentBadgeId = badgeId; badgeFromPin = false;
      noteSent({ badge: badgeId });
      refreshLiveViews();
    }
  }

  // Notes what a request to Twitch does; true when it sends a chat message.
  function inspectRequestBody(bodyText) {
    if (typeof bodyText !== 'string') return false;
    if (!bodyText.includes('sendChatMessage') && !bodyText.includes('ChatSettings') && !bodyText.includes('UpdateChatColor')) return false;
    let parsed;
    try { parsed = JSON.parse(bodyText); } catch (error) { return false; }
    const operations = Array.isArray(parsed) ? parsed : [parsed];
    captureHashes(operations);
    noteManualColorChange(operations);
    noteManualBadgeChange(operations);
    return operations.some(op => op && op.operationName === 'sendChatMessage');
  }

  window.fetch = function (requestInput, requestInit) {
    const args = arguments;
    let sendsMessage = false, laterBody = null;
    try {
      const requestUrl = typeof requestInput === 'string' ? requestInput : (requestInput && requestInput.url) || '';
      if (requestUrl.includes('gql.twitch.tv/gql')) {
        const requestHeaders = headersToObject((requestInit && requestInit.headers) || (requestInput && requestInput.headers));
        if (hasAuthHeader(requestHeaders)) {
          const firstAuth = !authHeaders; authHeaders = requestHeaders;
          if (firstAuth) { log('ready'); loadBadges(); primeChannelColor(currentChannel()); }
        }
        const requestBody = requestInit && typeof requestInit.body === 'string' ? requestInit.body : null;
        if (requestBody) sendsMessage = inspectRequestBody(requestBody);
        else if (requestInput instanceof Request) laterBody = requestInput.clone().text().catch(() => null);
      }
    } catch (error) { /* never break Twitch */ }
    if (sendsMessage) return sendInTurn(() => realFetch.apply(this, args));
    const result = realFetch.apply(this, args);
    if (laterBody) laterBody.then(text => { if (inspectRequestBody(text)) result.then(onSendReply).catch(() => {}); });
    return result;
  };

  const STYLES = PARTS.styles({ PANEL_WIDTH, PANEL_MAX_HEIGHT });

  function injectStyles() {
    if (document.getElementById('rb-styles')) return;
    document.head.append(createElement('style', { id: 'rb-styles', text: STYLES }));
  }

  /* =========================================================================
   * UI building blocks
   * ========================================================================= */

  let panel, panelBody, floatingButton;
  let currentView = 'main', viewMotion = 0, badgeSearchText = '', pendingConfirm = null, wheelPreviewHost = null;
  let paletteSearchText = '';
  let badgeScope = null, badgeScopeChannel = null;   // Badges view: 'all' (your switches) or 'here' (this channel's own set)
  let shortcutKeys = '';       // the browser's keyboard shortcut for opening the panel, when the extension has one
  let snippetDraft = null;     // the snippet being edited: { index (-1 for a new one), trigger, text }
  let confirmReturnKey = null; // control to refocus after a confirm view closes
  let panelClearsChatBox = false; // true while the panel was opened from chat: it sits above the chat box, not over it

  // live, paused, setup or off: what the header pill and the toolbar paw show.
  function overallStatus() {
    if (!hashesReady()) return 'setup';
    if (state.paused) return 'paused';
    return state.badgeOn || state.colorOn ? 'live' : 'off';
  }

  function panelHeader(titleText, backTo) {
    const close = iconButton('close', t('common.close'), () => closePanel(true), 'close', 'rb-iconbtn--quiet');
    if (!backTo) {
      const status = overallStatus();
      panel.append(createElement('div', { class: 'rb-head rb-head--brand' },
        createElement('div', { class: 'rb-brand' },
          createElement('span', { class: 'rb-brand-mark' }, pawIcon(null, pawColors())),
          createElement('h2', { class: 'rb-title', id: 'rb-title', text: titleText, title: titleText }),
          createElement('span', { class: `rb-status rb-status--${status}`, role: 'status', text: t(`status.${status}`) })),
        close));
      return;
    }
    panel.append(createElement('div', { class: 'rb-head' },
      iconButton('back', t('common.back'), () => setView(backTo, -1), 'back'),
      createElement('h2', { class: 'rb-title', id: 'rb-title', text: titleText, title: titleText }),
      close));
  }

  function iconButton(iconName, label, onClick, key, extraClass) {
    return createElement('button', {
      type: 'button', class: `rb-iconbtn${extraClass ? ' ' + extraClass : ''}`,
      'aria-label': label, title: label, 'data-rb-key': key, onclick: onClick,
    }, icon(iconName));
  }

  function textButton(label, variant, onClick, key, leadingIcon, tooltip) {
    const classes = ['rb-btn', ...variant.split(' ').map(part => `rb-btn--${part}`)].join(' ');
    return createElement('button', { type: 'button', class: classes, 'data-rb-key': key, title: tooltip, onclick: onClick },
      leadingIcon ? icon(leadingIcon) : null, label);
  }

  const sectionLabel = text => createElement('div', { class: 'rb-section', text });
  // A card of rows with hairlines between them. Leaves out empty slots.
  const group = (...rows) => append(createElement('div', { class: 'rb-group' }), ...rows);
  const note         = text => createElement('p', { class: 'rb-note', text });

  function labelBlock(mainText, subContent) {
    return createElement('span', { class: 'rb-label' },
      createElement('span', { class: 'rb-label-main', text: mainText }),
      subContent != null ? createElement('span', { class: 'rb-label-sub' }, subContent) : null);
  }

  function toggleRow({ label, sub, checked, onChange, key, ariaLabel, leading, tooltip }) {
    const input = createElement('input', {
      type: 'checkbox', role: 'switch', class: 'rb-switch-input', 'data-rb-key': key, 'aria-label': ariaLabel || label,
    });
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    const text = labelBlock(label, sub);
    return createElement('label', { class: 'rb-row', title: tooltip },
      leading ? createElement('span', { class: 'rb-lead' }, leading, text) : text,
      input,
      createElement('span', { class: 'rb-switch', 'aria-hidden': 'true' }));
  }

  function navRow(iconName, label, meta, targetView, sub) {
    return createElement('button', { type: 'button', class: 'rb-row rb-nav', 'data-rb-key': `nav:${targetView}`, onclick: () => setView(targetView, 1) },
      createElement('span', { class: 'rb-lead' }, createElement('span', { class: 'rb-lead-tile' }, icon(iconName, 'rb-icon rb-lead-icon')), labelBlock(label, sub)),
      createElement('span', { class: 'rb-meta' },
        typeof meta === 'string' ? createElement('span', { class: 'rb-meta-text', text: meta, title: meta }) : meta,
        icon('forward')));
  }

  function searchField({ placeholder, value, key, onInput }) {
    const input = createElement('input', {
      type: 'search', class: 'rb-input', placeholder, 'aria-label': placeholder,
      'data-rb-key': key, autocomplete: 'off', spellcheck: 'false', dir: 'auto',
    });
    input.value = value;
    const clear = createElement('button', {
      type: 'button', class: 'rb-search-clear', 'aria-label': t('common.clearSearch'), title: t('common.clearSearch'),
      hidden: !value, onclick: () => { input.value = ''; clear.hidden = true; onInput(''); input.focus(); },
    }, icon('close'));
    input.addEventListener('input', () => { clear.hidden = !input.value; onInput(input.value); });
    return createElement('div', { class: 'rb-search' }, icon('search'), input, clear);
  }

  function colorChip(hex) {
    return createElement('span', { class: 'rb-chip-color' },
      createElement('span', { class: 'rb-swatch', style: { background: hex } }),
      createElement('span', { class: 'rb-hex', text: hex }));
  }

  function sampleColors(count) {
    const samples = Math.min(count, colorSequence.length);
    return Array.from({ length: samples }, (_, i) => colorSequence[Math.floor(i * colorSequence.length / samples)]);
  }

  function miniStrip() {
    return createElement('span', { class: 'rb-mini-strip', 'aria-hidden': 'true' },
      sampleColors(16).map(hex => createElement('span', { style: { background: hex } })));
  }

  // A row in a list of channels, with a remove (×) button at the end.
  const removableRow = (content, removeLabel, onRemove, key) => createElement('div', { class: 'rb-row rb-row--static' },
    content, iconButton('close', removeLabel, onRemove, key, 'rb-iconbtn--quiet'));

  const pill = (tone, text) => createElement('span', { class: `rb-pill rb-pill--${tone}`, text });

  function callout(title, body, action, tone) {
    return createElement('div', { class: `rb-callout${tone ? ` rb-callout--${tone}` : ''}`, role: 'status' },
      pup('sleepy'),
      createElement('div', {},
        createElement('div', { class: 'rb-callout-title', text: title }),
        createElement('div', { class: 'rb-callout-body', text: body }),
        action));
  }
  const setupCallout = (title, actionText, key) => callout(title, t('setup.body', { count: capturedHashCount(), total: HASH_KEYS.length }),
    textButton(actionText, 'text', () => { closePanel(); openGuide(); }, key));

  function emptyState(message, action, mood) {
    return createElement('div', { class: 'rb-empty' }, pup(mood), createElement('div', { text: message }), action || null);
  }

  /* =========================================================================
   * UI-triggered state changes
   * ========================================================================= */

  // Both return true if something changed, false if it was already that way.
  function setChannelFrozen(login, frozen) {
    login = normalize(login);
    if (!login || isChannelFrozen(login) === frozen) return false;
    if (frozen) state.blacklist.push(login); else state.blacklist.splice(state.blacklist.indexOf(login), 1);
    saveState(); renderPanel(); updateIndicator();
    if (!frozen && login === currentChannel()) primeChannelColor(login);
    return true;
  }

  function toggleChannelBlacklist(login) { setChannelFrozen(login, !isChannelFrozen(normalize(login))); }

  function setPaused(paused) {
    if (state.paused === paused) return false;
    state.paused = paused;
    saveState(); renderPanel(); updateIndicator(); refreshEntryLabels();
    if (!paused) { primeChannelColor(currentChannel()); primeChannelBadge(currentChannel()); }
    return true;
  }

  function toggleFavoriteBadge(badgeId) {
    const index = state.favoriteBadges.indexOf(badgeId);
    if (index >= 0) state.favoriteBadges.splice(index, 1); else state.favoriteBadges.push(badgeId);
    saveState(); badgeBags.clear();
  }

  // Pins a badge to a channel, or unpins the channel when badgeId is null.
  function setBadgePin(login, badgeId) {
    if (badgeId) state.pinnedBadges[login] = badgeId; else delete state.pinnedBadges[login];
    saveState();
    primeChannelBadge(currentChannel());
    renderPanel();
  }

  function setBadgeOrder(order) {
    state.badgeOrder = order === 'order' ? 'order' : 'shuffle';
    saveState(); badgeBags.clear();
    renderPanel();
  }

  // Saves your own order. An order that matches Twitch's is stored as "no order of your own".
  function setBadgeSequence(badgeIds) {
    const twitchOrder = ownedBadges.map(badge => normalize(badge.setID));
    state.badgeSequence = badgeIds.length === twitchOrder.length && badgeIds.every((badgeId, index) => badgeId === twitchOrder[index]) ? [] : cleanIds(badgeIds);
    saveState();
  }

  // Switches a badge on or off in one channel's own set, starting the set from your usual switches.
  function setBadgeInSet(login, badgeId, enabled) {
    badgeId = normalize(badgeId);
    const set = state.badgeSets[login] || (state.badgeSets[login] = enabledBadges().map(badge => normalize(badge.setID)));
    const index = set.indexOf(badgeId);
    if (enabled && index < 0) set.push(badgeId); else if (!enabled && index >= 0) set.splice(index, 1);
    saveState(); badgeBags.clear();
  }

  function removeBadgeSet(login) {
    delete state.badgeSets[login];
    saveState(); badgeBags.clear(); renderPanel();
  }

  function setBadgeEnabled(badgeId, enabled, rerender = true) {
    badgeId = normalize(badgeId);
    const index = state.disabledBadges.indexOf(badgeId);
    if (enabled && index >= 0) state.disabledBadges.splice(index, 1);
    else if (!enabled && index < 0) state.disabledBadges.push(badgeId);
    saveState(); badgeBags.clear();
    if (rerender) renderPanel();
  }

  function askConfirm(config) {
    const active = document.activeElement;
    confirmReturnKey = active && panel.contains(active) ? active.getAttribute('data-rb-key') : null;
    pendingConfirm = { ...config, returnTo: currentView };
    setView('confirm', 1);
  }

  /* =========================================================================
   * Files: settings and translations
   * ========================================================================= */

  function downloadTextFile(filename, text) {
    const objectUrl = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = createElement('a', { href: objectUrl, download: filename });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function pickJsonFile(onData, failTextKey) {
    const fileInput = createElement('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          try { onData(JSON.parse(reader.result)); }
          catch (error) { log('import failed', error); showToast(t(failTextKey), 'error'); }
        };
        reader.readAsText(file);
      }
      fileInput.remove();
    });
    document.body.append(fileInput); fileInput.click();
  }

  function exportSettings() {
    downloadTextFile(`rainbark-settings-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2));
    log('settings exported');
    showToast(t('toast.exported'));
  }

  // Swaps in a whole new set of settings. `stamp`: count it as a change made here (so other tabs take it);
  // `prime`: put this channel's color and badge on straight away.
  function replaceState(newState, { stamp = true, prime = true } = {}) {
    state = newState;
    if (stamp) saveState(); else writeLocal();
    badgeBags.clear(); buildColorSequence(); refreshLanguage();
    refreshEntryLabels(); renderPanel(); renderGuide(); updateIndicator();
    if (prime) { primeChannelColor(currentChannel()); primeChannelBadge(currentChannel()); }
  }

  // Things learned in this browser, kept by Import and Reset: what Twitch's requests look like, how far the setup
  // and rotation got. Reset also keeps your own text, snippets and colors.
  const KEPT_ON_IMPORT = ['freeFormat', 'guideDone', 'setupComplete', 'lastBadge', 'stats'];
  const KEPT_ON_RESET = [...KEPT_ON_IMPORT, 'hashes', 'lang', 'snippets', 'customColors'];

  // Also accepts settings files from Hueflux, which have the same shape minus the text.
  function importSettings(imported) {
    if (!isObject(imported)) throw new Error('not an object');
    const clean = tidyState(imported);
    for (const key of KEPT_ON_IMPORT) clean[key] = state[key];
    clean.hashes = { ...state.hashes, ...clean.hashes };
    for (const key of ['customColors', 'snippets', 'lang']) if (!(key in imported)) clean[key] = state[key];
    replaceState(clean);
    log('settings imported');
    showToast(t('toast.imported'));
  }

  function resetSettings() {
    const fresh = defaults();
    for (const key of KEPT_ON_RESET) fresh[key] = state[key];
    replaceState(fresh);
    log('settings reset');
    showToast(t('toast.reset'));
  }

  function confirmReset() {
    askConfirm({
      title: t('confirm.reset.title'), body: t('confirm.reset.body'), action: t('confirm.reset.action'),
      onConfirm: resetSettings,
    });
  }

  function confirmForgetHashes() {
    askConfirm({
      title: t('confirm.forget.title'), body: t('confirm.forget.body'), action: t('confirm.forget.action'),
      onConfirm: () => { state.hashes = {}; saveState(); updateIndicator(); showToast(t('toast.hashesForgotten')); },
    });
  }

  /* =========================================================================
   * Views
   * ========================================================================= */

  // Your display name, read from Twitch's own sign-in cookie. Null when signed out.
  function viewerName() {
    try {
      const cookie = name => { const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)); return match ? decodeURIComponent(match[1]) : null; };
      const user = JSON.parse(cookie('twilight-user') || 'null');
      return (user && (user.displayName || user.login)) || cookie('name') || cookie('login') || null;
    } catch (error) { return null; }
  }

  // A chat line showing the badge and name color your next message will go out with.
  function messagePreview() {
    const badge = badgeById(currentBadgeId);
    const login = currentChannel();
    const next = login && !isChannelFrozen(login) && state.colorOn && !state.paused ? upcomingColor(login) : null;
    const copyable = hex => createElement('button', {
      type: 'button', class: 'rb-dot', style: { background: hex }, title: t('preview.copy', { color: hex }),
      'aria-label': t('preview.copy', { color: hex }), 'data-rb-key': `copy:${hex}`, onclick: () => copyColor(hex),
    });
    return createElement('div', { class: 'rb-hero' },
      createElement('div', { class: 'rb-hero-label' },
        createElement('span', { text: t('preview.label') }),
        next ? createElement('span', { class: 'rb-hero-next', title: t('preview.next') }, t('preview.next'), colorChip(next)) : null),
      createElement('div', { class: 'rb-preview', role: 'group', 'aria-label': t('preview.label') },
        badge ? badgeImage(badge) : null,
        createElement('span', { class: 'rb-preview-name', text: viewerName() || t('preview.you'), style: appliedColor ? { color: appliedColor } : null }),
        `: ${t('preview.text')}`),
      recentColors.length ? createElement('div', { class: 'rb-recent', role: 'group', 'aria-label': t('preview.recent') },
        createElement('span', { class: 'rb-recent-label', text: t('preview.recent') }),
        createElement('span', { class: 'rb-recent-dots' }, recentColors.map(copyable))) : null);
  }

  async function copyColor(hex) {
    try { await navigator.clipboard.writeText(hex); showToast(t('toast.copied', { color: hex })); }
    catch (error) { showToast(t('toast.copyFailed'), 'error'); }
  }

  // Pause, freeze this channel and palette, one tap away (and first in line when the panel opens from the keyboard).
  function quickBar() {
    const login = currentChannel();
    const chip = (key, iconName, label, pressed, onClick, tooltip) => createElement('button', {
      type: 'button', class: 'rb-chip rb-chip--icon', 'aria-pressed': String(pressed), 'data-rb-key': key, title: tooltip || label, onclick: onClick,
    }, icon(iconName), label);
    const select = createElement('select', { class: 'rb-input rb-quick-palette', 'aria-label': t('wheel.palette'), title: t('wheel.palette'), 'data-rb-key': 'quick:palette' },
      [...PALETTE_GROUPS.map(group => [group.id, Object.keys(group.palettes)]), ['yours', ['custom']]].map(([groupId, ids]) =>
        createElement('optgroup', { label: t(`palettes.group.${groupId}`) }, ids.map(id => createElement('option', { value: id, text: paletteName(id) })))));
    select.value = state.palette;
    select.addEventListener('change', () => selectPalette(select.value));
    return createElement('div', { class: 'rb-quick' },
      chip('quick:pause', 'pause', t('quick.pause'), state.paused, () => setPaused(!state.paused)),
      login ? chip('quick:freeze', 'snowflake', t('quick.freeze'), isChannelFrozen(login), () => toggleChannelBlacklist(login), t('channels.freeze', { channel: login })) : null,
      select);
  }

  function renderMain() {
    panelHeader(t('app.name'), null);
    const body = panelBody;
    body.append(messagePreview(), quickBar());

    if (state.paused) body.append(callout(t('paused.title'), t('paused.body'), textButton(t('paused.action'), 'text', () => setPaused(false), 'unpause'), 'paused'));
    if (!hashesReady()) body.append(setupCallout(t(repairing() ? 'guide.fix.title' : 'setup.title'), t('setup.action'), 'finish-setup'));

    body.append(sectionLabel(t('main.rotation')), group(
      toggleRow({
        label: t('badge.label'), sub: t('badge.sub'), leading: leadTile('medal'),
        checked: state.badgeOn, key: 'toggle:badge',
        onChange: on => { state.badgeOn = on; saveState(); renderPanel(); updateIndicator(); },
      }),
      toggleRow({
        label: t('color.label'), sub: t('color.sub'), leading: leadTile('rainbow'),
        checked: state.colorOn, key: 'toggle:color',
        onChange: on => { state.colorOn = on; saveState(); renderPanel(); updateIndicator(); if (on) primeChannelColor(currentChannel()); },
      })));

    const login = currentChannel();
    body.append(sectionLabel(t('channel.section')));
    if (!login) {
      body.append(group(createElement('div', { class: 'rb-row rb-row--static' }, labelBlock(t('channel.none')))));
    } else {
      const frozen = isChannelFrozen(login);
      const sub = frozen
        ? createElement('span', { text: t('channel.frozen') })
        : [colorChip(channelColor(login)), createElement('span', { text: t('channel.cycling') })];
      body.append(group(createElement('div', { class: 'rb-row rb-row--static' },
        createElement('span', { class: 'rb-lead' }, createElement('span', { class: 'rb-lead-tile rb-lead-tile--channel', text: login.slice(0, 1).toUpperCase() }), labelBlock(login, sub)),
        frozen ? null : iconButton('undo', t('channel.restart'), () => restartChannelColor(login), 'restart-color', 'rb-iconbtn--quiet'))));
    }

    body.append(sectionLabel(t('main.customize')), group(
      navRow('rainbow', t('nav.wheel'), miniStrip(), 'wheel', paletteName(state.palette)),
      navRow('medal', t('nav.badges'), ownedBadges.length ? t('common.count', { count: enabledBadges().length, total: ownedBadges.length }) : '–', 'badges', t('nav.badges.sub')),
      navRow('clock', t('nav.timing'), '', 'timing', timingMeta()),
      navRow('snowflake', t('nav.channels'), state.blacklist.length ? String(state.blacklist.length) : '', 'channels', t('nav.channels.sub'))));

    body.append(sectionLabel(t('main.chat')), group(
      navRow('prompt', t('nav.shortcuts'), t(state.shortcutOn ? 'common.on' : 'common.off'), 'shortcuts', t('nav.shortcuts.sub')),
      navRow('tag', t('nav.pronouns'), t(state.pronouns.on ? 'common.on' : 'common.off'), 'pronouns', t('nav.pronouns.sub'))));

    body.append(group(navRow('gear', t('nav.settings'), hashesReady() ? '' : pill('wait', t('status.setup')), 'settings', t('nav.settings.sub'))));

    body.append(createElement('div', { class: 'rb-credit' },
      createElement('span', { text: t('app.credit', { version: VERSION }) }),
      state.stats.styled ? createElement('span', { text: t('app.stats', { count: state.stats.styled.toLocaleString() }) }) : null));
  }

  const leadTile = iconName => createElement('span', { class: 'rb-lead-tile' }, icon(iconName, 'rb-icon rb-lead-icon'));

  function renderSettings() {
    panelHeader(t('settings.title'), 'main');
    const body = panelBody;

    const languageSelect = createElement('select', { class: 'rb-input rb-select-inline', 'aria-label': t('settings.language'), 'data-rb-key': 'settings-language' },
      createElement('option', { value: 'auto', text: t('settings.auto', { language: LANGUAGES[pageLanguage()].name }) }),
      Object.keys(LANGUAGES).map(code => createElement('option', { value: code, text: LANGUAGES[code].name })));
    languageSelect.value = state.lang.base;
    languageSelect.addEventListener('change', () => { setBaseLanguage(languageSelect.value); saveState(); refreshEntryLabels(); renderPanel(); });

    body.append(sectionLabel(t('settings.general')), group(
      createElement('div', { class: 'rb-row rb-row--static rb-field-row' },
        createElement('span', { class: 'rb-lead' }, leadTile('globe'), labelBlock(t('settings.language'))), languageSelect),
      createElement('div', { class: 'rb-row rb-row--static' },
        createElement('span', { class: 'rb-lead' }, leadTile('keyboard'), labelBlock(t('settings.shortcut'), t('settings.shortcutSub'))),
        createElement('code', { class: 'rb-kbd', dir: 'ltr', text: shortcutKeys || t('settings.shortcutNone') }))));

    body.append(sectionLabel(t('settings.setup')), group(
      navRow('plug', t('nav.hashes'), hashesReady() ? pill('ok', t('hashes.ready')) : pill('wait', t('common.count', { count: capturedHashCount(), total: HASH_KEYS.length })), 'hashes', t('nav.hashes.sub'))));

    body.append(sectionLabel(t('settings.backup')), note(t('settings.backupNote')),
      createElement('div', { class: 'rb-footer' },
        textButton(t('data.export'), 'secondary', exportSettings, 'export', 'download', t('data.exportTip')),
        textButton(t('data.import'), 'secondary', () => pickJsonFile(importSettings, 'toast.importFailed'), 'import', 'upload', t('data.importTip'))));

    body.append(sectionLabel(t('settings.reset')), note(t('data.resetTip')),
      textButton(t('data.reset'), 'secondary danger block', confirmReset, 'reset'));
  }

  function renderChannels() {
    panelHeader(t('channels.title'), 'main');
    const body = panelBody;
    body.append(note(t('channels.note')));

    const login = currentChannel();
    if (login && !isChannelFrozen(login))
      body.append(textButton(t('channels.freeze', { channel: login }), 'secondary block', () => toggleChannelBlacklist(login), 'freeze-current', 'plus'));

    if (!state.blacklist.length) { body.append(emptyState(t('channels.empty'), null, 'sleepy')); return; }
    body.append(sectionLabel(t('channels.title')), group(...state.blacklist.map(channelLogin => removableRow(
      createElement('span', { class: 'rb-lead' }, createElement('span', { class: 'rb-lead-tile rb-lead-tile--channel', text: channelLogin.slice(0, 1).toUpperCase() }),
        labelBlock(channelLogin, channelLogin === login ? t('channels.here') : null)),
      t('channels.remove', { channel: channelLogin }), () => toggleChannelBlacklist(channelLogin), `remove:${channelLogin}`))));
  }

  function badgeImage(badge) {
    if (!badge || !badge.image) return createElement('span', { class: 'rb-badge-img rb-badge-img--blank', 'aria-hidden': 'true' });
    return createElement('img', {
      class: 'rb-badge-img', src: badge.image, alt: '', loading: 'lazy', decoding: 'async',
      srcset: badge.image2x ? `${badge.image} 1x, ${badge.image2x} 2x` : null,
    });
  }

  // A small star or pin that stays lit while it's on.
  function markButton(kind, pressed, label, tooltip, key, onToggle) {
    const button = createElement('button', {
      type: 'button', class: `rb-iconbtn rb-mark rb-mark--${kind}`, 'aria-pressed': String(pressed), 'aria-label': label, title: tooltip,
      'data-rb-key': key,
      onclick: () => { const on = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(on)); onToggle(on); },
    }, icon(kind));
    return button;
  }

  function renderBadges() {
    panelHeader(t('badges.title'), 'main');
    const body = panelBody;

    if (!ownedBadges.length) {
      body.append(hashesReady()
        ? emptyState(t('badges.loading'))
        : emptyState(t('badges.needSetup'), textButton(t('badges.setup'), 'text', () => setView('hashes', 1), 'goto-hashes'), 'sleepy'));
      return;
    }

    const login = currentChannel();
    if (!login) badgeScope = 'all';
    else if (badgeScope === null || badgeScopeChannel !== login) { badgeScope = badgeSetFor(login) ? 'here' : 'all'; badgeScopeChannel = login; }
    const here = badgeScope === 'here';
    const scopeLogin = here ? login : null;
    const summary = note('');
    const updateSummary = () => { summary.textContent = t('badges.summary', { count: enabledBadges(scopeLogin).length, total: ownedBadges.length }); };
    updateSummary();

    const badgeLine = badge => createElement('div', { class: 'rb-badge-line' },
      markButton('star', isFavoriteBadge(badge.setID), t('badges.favorite', { badge: badge.title }), t('badges.favoriteTip', { times: FAVORITE_WEIGHT }),
        `fav:${badge.setID}`, () => toggleFavoriteBadge(badge.setID)),
      login ? markButton('pin', state.pinnedBadges[login] === badge.setID, t('badges.pin', { badge: badge.title, channel: login }),
        t('badges.pinTip', { channel: login }), `pin:${badge.setID}`, on => setBadgePin(login, on ? badge.setID : null)) : null,
      toggleRow({
        label: badge.title, tooltip: badge.setID, leading: badgeImage(badge),
        checked: inRotation(badge, scopeLogin), key: `badge:${badge.setID}`,
        onChange: enabled => {
          if (!here) { setBadgeEnabled(badge.setID, enabled, false); updateSummary(); return; }
          const first = !badgeSetFor(login);
          setBadgeInSet(login, badge.setID, enabled);
          if (first) renderPanel(); else updateSummary();
        },
      }));

    const list = createElement('div', { class: 'rb-group', role: 'group', 'aria-label': t('badges.title') });
    const fillList = () => {
      const query = normalize(badgeSearchText);
      const matches = orderedBadges().filter(badge => !query || badge.title.toLowerCase().includes(query) || badge.setID.includes(query));
      list.replaceChildren(...(matches.length ? matches.map(badgeLine) : [emptyState(t('badges.noMatch', { query: badgeSearchText.trim() }))]));
    };

    const orderChip = (order, labelKey, tipKey) => createElement('button', {
      type: 'button', class: 'rb-chip', 'aria-pressed': String(state.badgeOrder === order), title: t(tipKey), 'data-rb-key': `order:${order}`,
      text: t(labelKey), onclick: () => setBadgeOrder(order),
    });

    panel.append(createElement('div', { class: 'rb-toolbar' },
      searchField({ placeholder: t('badges.search'), value: badgeSearchText, key: 'badge-search',
        onInput: value => { badgeSearchText = value; fillList(); } }),
      createElement('div', { class: 'rb-toolbar-row' }, summary,
        createElement('div', { class: 'rb-chips' },
          orderChip('shuffle', 'badges.shuffle', 'badges.shuffleTip'), orderChip('order', 'badges.inOrder', 'badges.inOrderTip'),
          iconButton('sort', t('badges.arrange'), () => setView('arrange', 1), 'nav:arrange', 'rb-iconbtn--small rb-iconbtn--chip'))),
      login ? createElement('div', { class: 'rb-toolbar-row rb-scope', role: 'group', 'aria-label': t('badges.title') },
        ...[['all', t('badges.everywhere')], ['here', t('badges.here', { channel: login })]].map(([scope, label]) => createElement('button', {
          type: 'button', class: 'rb-chip', 'aria-pressed': String(badgeScope === scope), 'data-rb-key': `scope:${scope}`, text: label,
          onclick: () => { badgeScope = scope; renderPanel(); },
        }))) : null));

    if (here)
      append(body, note(t(badgeSetFor(login) ? 'badges.set.note' : 'badges.set.none', { channel: login })),
        badgeSetFor(login) ? textButton(t('badges.set.remove'), 'text', () => removeBadgeSet(login), 'remove-set') : null);

    const sets = Object.entries(state.badgeSets);
    if (!here && sets.length)
      body.append(sectionLabel(t('badges.sets')), note(t('badges.setsNote')),
        group(...sets.map(([channel, ids]) => removableRow(
          labelBlock(channel, t('common.count', { count: ownedBadges.filter(badge => ids.includes(normalize(badge.setID))).length, total: ownedBadges.length })),
          t('badges.set.removeFor', { channel }), () => removeBadgeSet(channel), `unset:${channel}`))));
    const pins = Object.entries(state.pinnedBadges);
    if (!here && pins.length)
      body.append(sectionLabel(t('badges.pinned')), note(t('badges.pinnedNote')),
        group(...pins.map(([channel, badgeId]) => {
          const badge = badgeById(badgeId);
          return removableRow(createElement('span', { class: 'rb-lead' }, badgeImage(badge), labelBlock(channel, badge ? badge.title : t('badges.gone'))),
            t('badges.unpin', { channel }), () => setBadgePin(channel, null), `unpin:${channel}`);
        })));
    if (!here && (sets.length || pins.length)) body.append(sectionLabel(t('badges.all')));
    body.append(list);
    fillList();
  }

  // Rows can be dragged by their grip. The row moves as the pointer passes its neighbours; onDrop runs once at the end.
  function enableDragSort(list, onDrop) {
    let dragged = null, pointerY = 0, scrollTimer = null;
    const scroller = () => list.closest('.rb-body');
    // Keeps the dragged row under the pointer by stepping it past each neighbour whose middle the pointer has crossed.
    const settle = () => {
      for (let previous = dragged.previousElementSibling; previous; previous = dragged.previousElementSibling) {
        const box = previous.getBoundingClientRect();
        if (pointerY >= box.top + box.height / 2) break;
        previous.before(dragged);
      }
      for (let next = dragged.nextElementSibling; next; next = dragged.nextElementSibling) {
        const box = next.getBoundingClientRect();
        if (pointerY <= box.top + box.height / 2) break;
        next.after(dragged);
      }
    };
    // Holding the row near the top or bottom edge scrolls the list, faster the closer it is.
    const autoScroll = () => {
      const body = scroller();
      if (!dragged || !body) return;
      const bounds = body.getBoundingClientRect();
      const edge = 36;
      const push = pointerY < bounds.top + edge ? pointerY - (bounds.top + edge) : pointerY > bounds.bottom - edge ? pointerY - (bounds.bottom - edge) : 0;
      if (!push) return;
      const before = body.scrollTop;
      body.scrollTop += Math.max(-18, Math.min(18, push / 2));
      if (body.scrollTop !== before) settle();
    };
    const onMove = event => { if (dragged) { pointerY = event.clientY; settle(); } };
    const onEnd = () => {
      if (!dragged) return;
      dragged.classList.remove('is-dragging'); list.classList.remove('is-sorting');
      dragged = null;
      clearInterval(scrollTimer);
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup', onEnd, true);
      document.removeEventListener('pointercancel', onEnd, true);
      onDrop();
    };
    list.addEventListener('pointerdown', event => {
      const grip = event.target.closest && event.target.closest('.rb-grip');
      if (!grip || event.button !== 0 || dragged) return;
      event.preventDefault();
      dragged = grip.closest('.rb-sort-row'); pointerY = event.clientY;
      dragged.classList.add('is-dragging'); list.classList.add('is-sorting');
      scrollTimer = setInterval(autoScroll, 30);
      document.addEventListener('pointermove', onMove, true);
      document.addEventListener('pointerup', onEnd, true);
      document.addEventListener('pointercancel', onEnd, true);
    });
  }

  function renderArrange() {
    panelHeader(t('badges.arrange'), 'badges');
    const body = panelBody;
    if (!ownedBadges.length) { body.append(emptyState(t('badges.loading'))); return; }

    const list = createElement('div', { class: 'rb-group rb-sort-list', role: 'list' });
    const resetButton = textButton(t('badges.twitchOrder'), 'text', () => { state.badgeSequence = []; saveState(); renderPanel(); }, 'order-reset');
    const refresh = () => {
      const rows = [...list.children];
      rows.forEach((row, index) => {
        row.querySelector('[data-move="up"]').setAttribute('aria-disabled', String(index === 0));
        row.querySelector('[data-move="down"]').setAttribute('aria-disabled', String(index === rows.length - 1));
      });
      resetButton.disabled = !state.badgeSequence.length;
    };
    const commit = () => { setBadgeSequence([...list.children].map(row => row.dataset.badge)); refresh(); };
    const moveButton = (row, badge, direction) => {
      const button = iconButton(direction, t(direction === 'up' ? 'badges.moveUp' : 'badges.moveDown', { badge: badge.title }), () => {
        const neighbour = direction === 'up' ? row.previousElementSibling : row.nextElementSibling;
        if (!neighbour) return;
        if (direction === 'up') neighbour.before(row); else neighbour.after(row);
        commit();
        button.focus({ preventScroll: true });   // moving the row drops focus
        row.scrollIntoView({ block: 'nearest' });
      }, `${direction}:${badge.setID}`, 'rb-iconbtn--quiet');
      button.setAttribute('data-move', direction);
      return button;
    };
    for (const badge of orderedBadges()) {
      const row = createElement('div', { class: `rb-sort-row${isBadgeDisabled(badge.setID) ? ' is-off' : ''}`, role: 'listitem', 'data-badge': normalize(badge.setID) });
      row.append(
        createElement('span', { class: 'rb-grip', title: t('badges.drag'), 'aria-hidden': 'true' }, icon('grip')),
        badgeImage(badge),
        createElement('span', { class: 'rb-sort-name', text: badge.title }),
        moveButton(row, badge, 'up'), moveButton(row, badge, 'down'));
      list.append(row);
    }
    enableDragSort(list, commit);
    body.append(note(t('badges.arrangeNote')), list, resetButton);
    refresh();
  }

  // A labelled drop-down in a row.
  function selectRow(label, key, options, value, onChange, extra) {
    const select = createElement('select', { class: 'rb-input rb-select-inline', 'aria-label': label, 'data-rb-key': key },
      options.map(([optionValue, optionText]) => createElement('option', { value: optionValue, text: optionText })));
    select.value = value;
    select.addEventListener('change', () => onChange(select.value));
    return createElement('div', { class: 'rb-row rb-row--static rb-field-row' }, labelBlock(label),
      createElement('span', { class: 'rb-field-controls' }, extra, select));
  }

  // The sample tags in the Pronouns view use the same stylesheet as the real ones, scoped to the panel.
  function updatePronounPreviewStyle() {
    let style = document.getElementById('rb-pn-preview');
    if (!style) document.head.append(style = createElement('style', { id: 'rb-pn-preview' }));
    style.textContent = PRONOUN_LOOK.css(state.pronouns, '#rb-panel');
  }

  function setPronounLook(changes, rerender = true) {
    state.pronouns = PRONOUN_LOOK.clean({ ...state.pronouns, ...changes });
    saveState(); sendPronounSettings(); updatePronounPreviewStyle();
    if (rerender) renderPanel(); else renderPronounPreview();
  }

  let pronounPreview = null;
  function renderPronounPreview() {
    if (!pronounPreview) return;
    const look = state.pronouns;
    const line = (name, color, parts, message) => createElement('div', { class: 'rb-pn-line' },
      createElement('span', { class: 'rb-pn-name', text: name, style: { color } }),
      look.on && look.chat ? createElement('span', { class: 'rb-pn', style: { '--rbp-name': color }, text: PRONOUN_LOOK.format(parts, look) }) : null,
      `: ${message}`);
    pronounPreview.replaceChildren(
      line('SleepySprout', '#FF69B4', ['She', 'Her'], 'hi chat!'),
      line('TofuWizard', '#1E90FF', ['They', 'Them'], 'gg'),
      line('MossyLantern', '#00C8AF', ['Any'], 'o7'));
  }

  function renderPronouns() {
    panelHeader(t('pronouns.title'), 'main');
    const body = panelBody;
    const look = state.pronouns;
    updatePronounPreviewStyle();
    pronounPreview = createElement('div', { class: 'rb-preview rb-pn-preview', role: 'img', 'aria-label': t('pronouns.preview') });
    const sample = changes => PRONOUN_LOOK.format(['She', 'Her'], { ...look, ...changes });
    const colorPicker = (key, label) => {
      const input = createElement('input', { type: 'color', class: 'rb-color-input', 'aria-label': t('pronouns.pickColor', { setting: label }),
        title: t('pronouns.pickColor', { setting: label }), 'data-rb-key': `pn:${key}` });
      input.value = look[key].toLowerCase();
      input.addEventListener('input', () => setPronounLook({ [key]: input.value }, false));
      return input;
    };
    // A drop-down for one of the look's choices; `optionText` writes each option (an example, or a translated name).
    const choice = (key, optionText, extra) => selectRow(t(`pronouns.${key === 'textCase' ? 'case' : key}`), `pn:${key}`,
      PRONOUN_LOOK.CHOICES[key].map(value => [value, optionText(value)]), look[key], value => setPronounLook({ [key]: value }), extra);

    append(body,
      pronounPreview,
      group(toggleRow({ label: t('pronouns.on'), sub: t('pronouns.onSub'), checked: look.on, key: 'pn:on', onChange: on => setPronounLook({ on }) })),
      document.querySelector('.pn-tag') ? createElement('p', { class: 'rb-note rb-note--warn', text: t('pronouns.conflict') }) : null);
    renderPronounPreview();
    if (look.on) body.append(
      sectionLabel(t('pronouns.where')), group(
        toggleRow({ label: t('pronouns.chat'), checked: look.chat, key: 'pn:chat', onChange: chat => setPronounLook({ chat }) }),
        toggleRow({ label: t('pronouns.about'), checked: look.about, key: 'pn:about', onChange: about => setPronounLook({ about }) })),
      sectionLabel(t('pronouns.look')), group(
        choice('textCase', value => sample({ textCase: value, brackets: 'none' })),
        choice('brackets', value => sample({ brackets: value })),
        choice('separator', value => sample({ separator: value, brackets: 'none' })),
        choice('color', value => t(`pronouns.color.${value}`), look.color === 'custom' ? colorPicker('customColor', t('pronouns.color')) : null),
        choice('background', value => t(`pronouns.bg.${value}`), look.background === 'custom' ? colorPicker('customBackground', t('pronouns.background')) : null),
        choice('shape', value => t(`pronouns.shape.${value}`)),
        choice('size', value => t(`pronouns.size.${value}`)),
        toggleRow({ label: t('pronouns.border'), checked: look.border, key: 'pn:border', onChange: border => setPronounLook({ border }, false) }),
        toggleRow({ label: t('pronouns.bold'), checked: look.bold, key: 'pn:bold', onChange: bold => setPronounLook({ bold }, false) })),
      textButton(t('pronouns.reset'), 'secondary block', () => setPronounLook({ ...PRONOUN_LOOK.DEFAULTS, on: look.on, chat: look.chat, about: look.about }), 'pn-reset'));
    body.append(note(t('pronouns.note')));
  }

  const timingMeta = () => (state.timing.every === 1 && !state.timing.gap ? t('timing.always')
    : [state.timing.every > 1 ? t('timing.meta', { count: state.timing.every }) : t('timing.always'),
       state.timing.gap ? t('timing.metaGap', { seconds: state.timing.gap }) : null].filter(Boolean).join(' · '));

  function renderTiming() {
    panelHeader(t('timing.title'), 'main');
    panelBody.append(note(t('timing.note')),
      group(...Object.keys(TIMING_DEFAULTS).map(key => sliderSetting({
        key, prefix: 'timing', min: TIMING_LIMITS[key][0], max: TIMING_LIMITS[key][1], value: state.timing[key], fallback: TIMING_DEFAULTS[key],
        onPreview: value => { state.timing[key] = value; }, onCommit: () => saveState(),
      }))),
      textButton(t('wheel.reset'), 'secondary block', () => { state.timing = { ...TIMING_DEFAULTS }; saveState(); renderPanel(); }, 'timing-reset'));
  }

  function drawWheelPreview() {
    const accent = panel && panel.querySelector('.rb-accent');
    if (accent) accent.style.background = accentGradient();
    const host = wheelPreviewHost;
    if (!host) return;
    const rowFlag = panel.querySelector('[data-rb-key="nav:palettes"] .rb-flag');
    if (rowFlag) rowFlag.replaceWith(paletteFlag(state.palette));
    const count = colorSequence.length;
    const login = currentChannel();
    const index = channelColorIndex(login) % count;

    const strip = createElement('div', {
      class: `rb-strip${count <= 72 ? ' rb-strip--stepped' : ''}`, role: 'img',
      'aria-label': t('wheel.preview', { count }),
    }, colorSequence.map(hex => createElement('span', { style: { background: hex } })));
    const marker = login
      ? createElement('span', { class: 'rb-strip-marker', style: { insetInlineStart: `${((index + 0.5) / count) * 100}%` }, 'aria-hidden': 'true' },
          createElement('span', { class: 'rb-strip-pin' }, pawIcon()))
      : null;

    host.replaceChildren(
      createElement('div', { class: 'rb-strip-wrap' }, strip, marker),
      createElement('div', { class: 'rb-strip-caption' },
        createElement('span', { text: t('wheel.perTrip', { count }) }),
        login ? colorChip(colorSequence[index]) : null));
  }

  let wheelCommitTimer = null;
  function commitWheel() {
    saveState();
    clearTimeout(wheelCommitTimer);
    wheelCommitTimer = setTimeout(rebuildColorWheel, 500); // avoid a color request per slider tick or keystroke
  }

  // A labelled slider with a number box. Its text comes from <prefix>.<key>, .hint and .tip.
  function sliderSetting({ key, prefix = 'wheel', min, max, value, fallback, onPreview, onCommit = commitWheel }) {
    const label = t(`${prefix}.${key}`);
    const range  = createElement('input', { type: 'range', class: 'rb-range', min, max, step: 1, 'aria-label': label, 'data-rb-key': `range:${key}` });
    const number = createElement('input', { type: 'number', class: 'rb-input rb-number', min, max, step: 1, 'aria-label': t('wheel.value', { label }), 'data-rb-key': `num:${key}` });
    range.value = number.value = value;

    const paintFill = () => range.style.setProperty('--rb-fill', `${((range.value - min) / (max - min)) * 100}%`);
    const preview = newValue => { onPreview(newValue); if (prefix === 'wheel') { buildColorSequence(); drawWheelPreview(); } };
    paintFill();

    range.addEventListener('input', () => { number.value = range.value; paintFill(); preview(Number(range.value)); });
    range.addEventListener('change', onCommit);
    number.addEventListener('change', () => {
      const typed = parseInt(number.value, 10);
      const newValue = clamp(Number.isFinite(typed) ? typed : fallback, [min, max]);
      number.value = range.value = newValue;
      paintFill(); preview(newValue); onCommit();
    });

    return createElement('div', { class: 'rb-setting', title: t(`${prefix}.${key}.tip`) },
      createElement('div', { class: 'rb-setting-top' }, labelBlock(label, t(`${prefix}.${key}.hint`)), number),
      range);
  }

  const wheelSetting = key => sliderSetting({
    key, min: WHEEL_LIMITS[key][0], max: WHEEL_LIMITS[key][1], value: state.wheel[key], fallback: WHEEL_DEFAULTS[key],
    onPreview: value => { state.wheel[key] = value; },
  });

  // Splits typed text into hex colors and the bits that aren't.
  function parseColorList(text) {
    const colors = [], bad = [];
    for (const piece of text.split(/[\s,;]+/).filter(Boolean)) {
      const hex = normalizeHex(piece);
      if (hex) colors.push(hex); else bad.push(piece);
    }
    return { colors: colors.slice(0, CUSTOM_COLOR_LIMIT), bad };
  }

  function customColorsEditor() {
    const field = createElement('textarea', {
      class: 'rb-input', rows: '3', placeholder: t('wheel.custom.placeholder'), 'aria-label': t('wheel.custom'),
      'data-rb-key': 'custom-colors', spellcheck: 'false', dir: 'ltr',
    });
    field.value = state.customColors.join(' ');
    const status = createElement('div', { class: 'rb-text-hint', 'aria-live': 'polite' });
    const read = () => {
      const { colors, bad } = parseColorList(field.value);
      status.textContent = bad.length ? t('wheel.custom.bad', { list: bad.slice(0, 3).join(', ') })
        : colors.length ? t('wheel.custom.count', { count: colors.length }) : t('wheel.custom.empty');
      status.classList.toggle('is-warn', bad.length > 0 || !colors.length);
      return colors;
    };
    field.addEventListener('input', () => { state.customColors = read(); buildColorSequence(); drawWheelPreview(); commitWheel(); });
    read();
    return createElement('div', { class: 'rb-setting' }, labelBlock(t('wheel.custom'), t('wheel.custom.hint')), field, status);
  }

  const paletteName = id => t(`palette.${id}`);

  // A little flag showing a palette's own colors.
  function paletteFlag(id) {
    const colors = id === 'rainbow' ? rainbowColors(12) : id === 'custom' ? state.customColors : PALETTES[id];
    return createElement('span', { class: `rb-flag${colors.length ? '' : ' rb-flag--empty'}`, 'aria-hidden': 'true' },
      colors.map(hex => createElement('span', { style: { background: hex } })));
  }

  function renderWheel() {
    panelHeader(t('wheel.title'), 'main');
    const body = panelBody;
    wheelPreviewHost = createElement('div');
    body.append(wheelPreviewHost);
    drawWheelPreview();

    body.append(group(
      createElement('button', { type: 'button', class: 'rb-row rb-nav', 'data-rb-key': 'nav:palettes', onclick: () => setView('palettes', 1) },
        createElement('span', { class: 'rb-lead' }, paletteFlag(state.palette), labelBlock(t('wheel.palette'), paletteName(state.palette))),
        createElement('span', { class: 'rb-meta' }, icon('forward'))),
      toggleRow({
        label: t('wheel.random'), sub: t('wheel.random.sub'), leading: leadTile('shuffle'),
        checked: state.colorOrder === 'random', key: 'toggle:random',
        onChange: on => { state.colorOrder = on ? 'random' : 'cycle'; saveState(); },
      })));

    if (state.palette === 'rainbow') {
      body.append(sectionLabel(t('wheel.tune')), group(...Object.keys(WHEEL_DEFAULTS).map(wheelSetting)));
      body.append(textButton(t('wheel.reset'), 'secondary block', () => {
        state.wheel = { ...WHEEL_DEFAULTS }; saveState(); rebuildColorWheel(); renderPanel();
      }, 'wheel-reset'));
    } else if (state.palette === 'twitch') {
      body.append(note(t('wheel.free.note')));
    } else {
      body.append(sectionLabel(t('wheel.tune')), group(
        state.palette === 'custom' ? customColorsEditor() : null,
        sliderSetting({ key: 'blend', min: 0, max: BLEND_MAX, value: state.blend, fallback: 0, onPreview: value => { state.blend = value; } })));
    }
  }

  function paletteRow(id) {
    const selected = state.palette === id;
    return createElement('button', {
      type: 'button', class: `rb-row rb-palette${selected ? ' is-selected' : ''}`, role: 'radio', 'aria-checked': String(selected),
      'data-rb-key': `palette:${id}`, onclick: () => selectPalette(id),
    },
      createElement('span', { class: 'rb-lead' }, paletteFlag(id), labelBlock(paletteName(id))),
      id === 'twitch' ? pill('ok', t('palettes.free')) : null,
      selected ? icon('check', 'rb-icon rb-palette-check') : null);
  }

  function renderPalettes() {
    panelHeader(t('palettes.title'), 'wheel');
    const groups = [...PALETTE_GROUPS.map(group => ({ id: group.id, ids: Object.keys(group.palettes) })), { id: 'yours', ids: ['custom'] }];
    const groupOf = group;   // `group` is shadowed below
    const list = createElement('div', { role: 'radiogroup', 'aria-label': t('palettes.title') });
    const fillList = () => {
      const query = normalize(paletteSearchText);
      const matches = id => !query || `${paletteName(id)} ${id} ${PALETTE_ALIASES[id] || ''}`.toLowerCase().includes(query);
      const sections = groups.flatMap(group => {
        const ids = group.ids.filter(matches);
        return ids.length ? [sectionLabel(t(`palettes.group.${group.id}`)), groupOf(...ids.map(paletteRow))] : [];
      });
      list.replaceChildren(...(sections.length ? sections : [emptyState(t('palettes.noMatch', { query: paletteSearchText.trim() }))]));
    };
    panel.append(createElement('div', { class: 'rb-toolbar' },
      searchField({ placeholder: t('palettes.search'), value: paletteSearchText, key: 'palette-search',
        onInput: value => { paletteSearchText = value; fillList(); } })));
    panelBody.append(note(t('palettes.note')), list);
    fillList();
  }

  // A plain-text report for asking for help: what's set up and what happened lately. Nothing secret: no sign-in
  // headers, cookies, your name or anyone else's.
  function diagnosticsReport() {
    const yes = value => (value ? 'yes' : 'no');
    const chatBox = document.querySelector(CHAT_INPUT);
    return [
      `Rainbark ${VERSION} diagnostics, ${new Date().toISOString()}`,
      `Page: ${location.hostname} · channel ${currentChannel() || 'none'} · Twitch language ${document.documentElement.lang || '?'}`,
      `Browser: ${navigator.userAgent}`,
      `Language: ${activeLanguage}${state.lang.base === 'auto' ? ' (following Twitch)' : ''}`,
      `Signed in: ${yes(viewerName())} · request details captured: ${yes(credentialsReady())}`,
      `Query hashes: ${HASH_KEYS.map(key => `${key} ${state.hashes[key] ? state.hashes[key].slice(0, 8) : 'missing'}`).join(', ')} · setup complete before: ${yes(state.setupComplete)}`,
      `Chat box: ${yes(chatBox)} · Slate editor: ${yes(chatBox && slateEditorFor(chatBox))} · paw button: ${document.getElementById('rb-toolbtn') ? 'in the chat bar' : 'floating'}`,
      `Badges: ${ownedBadges.length} owned, ${enabledBadges().length} on, ${state.badgeOrder}, ${state.favoriteBadges.length} favorites, ` +
        `${Object.keys(state.pinnedBadges).length} pins, ${Object.keys(state.badgeSets).length} sets, own order: ${yes(state.badgeSequence.length)}, wearing ${currentBadgeId || '?'}`,
      `Colors: ${state.palette} (${colorSequence.length}), blend ${state.blend}, now ${appliedColor || '?'}, free colors sent as ${state.freeFormat}, refused this visit: ${yes(freeColorsRefused)}`,
      `Switches: badge ${yes(state.badgeOn)}, color ${yes(state.colorOn)}, paused ${yes(state.paused)}, frozen channels ${state.blacklist.length}, ` +
        `every ${state.timing.every} message(s), gap ${state.timing.gap} s, shortcuts ${yes(state.shortcutOn)}, snippets ${state.snippets.length}, pronouns ${yes(state.pronouns.on)}`,
      '', 'Recent activity:', ...(diagnostics.length ? diagnostics.map(line => `  ${line}`) : ['  (nothing yet)']),
    ].join('\n');
  }

  async function copyDiagnostics() {
    const report = diagnosticsReport();
    try { await navigator.clipboard.writeText(report); showToast(t('toast.diagCopied')); return; } catch (error) { /* try the old way */ }
    const area = createElement('textarea', { class: 'rb-input rb-diag-text', readonly: 'readonly', rows: '8', 'data-rb-key': 'diag-text', dir: 'ltr' });
    area.value = report;
    document.body.append(area); area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (error) { /* not allowed */ }
    area.remove();
    if (copied) { showToast(t('toast.diagCopied')); return; }
    const slot = panel.querySelector('[data-rb-key="diag-slot"]');
    if (slot) { slot.replaceChildren(note(t('diag.manual')), area); area.focus(); area.select(); }
  }

  function renderHashes() {
    panelHeader(t('hashes.title'), 'settings');
    const body = panelBody;
    body.append(note(t('hashes.note')));

    body.append(group(...HASH_KEYS.map(key => {
      const hash = state.hashes[key];
      const sub = hash
        ? createElement('span', { class: 'rb-mono', text: `${hash.slice(0, 12)}…`, dir: 'ltr' })
        : t(`hashes.${key}.how`);
      return createElement('div', { class: 'rb-row rb-row--static rb-hash', title: HASH_OPERATIONS[key] },
        labelBlock(t(`hashes.${key}`), sub),
        hash ? pill('ok', t('hashes.fetched')) : pill('wait', t('hashes.waiting')));
    })));

    if (!hashesReady())
      body.append(textButton(t('guide.open'), 'primary block', () => { closePanel(); openGuide(); }, 'open-guide'));
    if (capturedHashCount())
      body.append(textButton(t('hashes.forget'), 'text danger', confirmForgetHashes, 'forget-hashes'));
    body.append(sectionLabel(t('diag.section')), note(t('diag.note')),
      textButton(t('diag.copy'), 'secondary block', copyDiagnostics, 'diag-copy', 'copy'),
      createElement('div', { 'data-rb-key': 'diag-slot' }));
  }

  function snippetRow(snippet, index, tokens) {
    const clashes = snippetProblem(snippet.trigger, index, tokens) === 'builtin';
    const preview = clashes ? t('snippets.clash') : snippet.text;
    return createElement('button', {
      type: 'button', class: `rb-row rb-snippet${clashes ? ' is-warn' : ''}`, 'data-rb-key': `snippet:${index}`, title: snippet.text,
      onclick: () => editSnippet(index),
    },
      createElement('span', { class: 'rb-lead' },
        createElement('code', { class: 'rb-kbd', dir: 'ltr', text: snippet.trigger }),
        createElement('span', { class: 'rb-snippet-text', text: preview })),
      createElement('span', { class: 'rb-meta' }, icon('forward')));
  }

  function renderShortcuts() {
    panelHeader(t('shortcuts.title'), 'main');
    const tokens = shortcutTokens();
    const list = createElement('dl', { class: `rb-shortcuts${state.shortcutOn ? '' : ' is-off'}` },
      SHORTCUT_IDS.flatMap(id => [
        createElement('dt', {}, createElement('code', { class: 'rb-kbd', dir: 'ltr', text: tokens[id] })),
        createElement('dd', { text: t(`shortcuts.desc.${id}`) }),
      ]));
    panelBody.append(
      group(toggleRow({
        label: t('shortcuts.enable'), sub: t('shortcuts.enableSub'), checked: state.shortcutOn, key: 'toggle:shortcut',
        onChange: on => { state.shortcutOn = on; saveState(); list.classList.toggle('is-off', !on); },
      })),
      sectionLabel(t('shortcuts.builtIn')), group(list),
      sectionLabel(t('snippets.section')), note(t('snippets.note')),
      state.snippets.length ? group(...state.snippets.map((snippet, index) => snippetRow(snippet, index, tokens))) : null,
      state.snippets.length < SNIPPET_LIMIT
        ? textButton(t('snippets.add'), 'secondary block', () => editSnippet(-1), 'snippet-add', 'plus')
        : note(t('snippets.full', { count: SNIPPET_LIMIT })));
  }

  function editSnippet(index) {
    const existing = state.snippets[index];
    snippetDraft = existing ? { index, trigger: existing.trigger, text: existing.text } : { index: -1, trigger: '', text: '' };
    setView('snippet', 1);
  }

  function renderSnippet() {
    const draft = snippetDraft;
    if (!draft) { currentView = 'shortcuts'; renderShortcuts(); return; }
    const isNew = draft.index < 0;
    panelHeader(t(isNew ? 'snippet.new' : 'snippet.editTitle'), 'shortcuts');

    const trigger = createElement('input', {
      type: 'text', class: 'rb-input', id: 'rb-snippet-trigger', placeholder: t('snippet.trigger.placeholder'), maxlength: '32',
      'data-rb-key': 'snippet-trigger', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', dir: 'ltr',
    });
    trigger.value = draft.trigger;
    const triggerHint = createElement('div', { class: 'rb-text-hint', 'aria-live': 'polite' });
    const text = createElement('textarea', {
      class: 'rb-input', id: 'rb-snippet-text', rows: '4', placeholder: t('snippet.text.placeholder'), maxlength: String(SNIPPET_TEXT_LIMIT),
      'data-rb-key': 'snippet-text', dir: 'auto',
    });
    text.value = draft.text;

    const closeEditor = () => { snippetDraft = null; setView('shortcuts', -1); };
    const save = textButton(t('snippet.save'), 'primary', () => {
      if (snippetProblem(draft.trigger, draft.index) || !draft.text.trim()) return;
      const entry = { trigger: draft.trigger.trim(), text: draft.text.trim().slice(0, SNIPPET_TEXT_LIMIT) };
      if (isNew) state.snippets.push(entry); else state.snippets[draft.index] = entry;
      saveState(); showToast(t('toast.snippetSaved')); closeEditor();
    }, 'snippet-save');

    const check = () => {
      const problem = snippetProblem(draft.trigger, draft.index);
      const showProblem = !!problem && !!draft.trigger.trim();
      triggerHint.textContent = showProblem ? t(`snippet.err.${problem}`) : t('snippet.trigger.hint');
      triggerHint.classList.toggle('is-warn', showProblem);
      save.disabled = !!problem || !draft.text.trim();
    };
    trigger.addEventListener('input', () => { draft.trigger = trigger.value; check(); });
    text.addEventListener('input', () => { draft.text = text.value; check(); });
    check();

    const remove = isNew ? null : textButton(t('snippet.delete'), 'text danger', () => askConfirm({
      title: t('confirm.snippet.title'), body: t('confirm.snippet.body', { trigger: state.snippets[draft.index].trigger }),
      action: t('confirm.snippet.action'),
      onConfirm: () => {
        state.snippets.splice(draft.index, 1); saveState();
        snippetDraft = null; currentView = 'shortcuts';
        showToast(t('toast.snippetDeleted'));
      },
    }), 'snippet-delete');

    // Each extra goes in where the cursor is.
    const extras = createElement('div', { class: 'rb-extras', role: 'group', 'aria-label': t('snippet.extras') },
      Object.entries(SNIPPET_EXTRAS).map(([name, token]) => createElement('button', {
        type: 'button', class: 'rb-chip', title: t(`snippet.extra.${name}`), 'aria-label': `${token}: ${t(`snippet.extra.${name}`)}`, 'data-rb-key': `extra:${name}`, text: token,
        onclick: () => {
          const start = text.selectionStart ?? text.value.length, end = text.selectionEnd ?? start;
          text.setRangeText(token, start, end, 'end');
          text.focus();
          text.dispatchEvent(new Event('input'));
        },
      })));

    panelBody.append(
      createElement('div', { class: 'rb-field' },
        createElement('label', { class: 'rb-field-label', for: 'rb-snippet-trigger', text: t('snippet.trigger') }), trigger, triggerHint),
      createElement('div', { class: 'rb-field' },
        createElement('label', { class: 'rb-field-label', for: 'rb-snippet-text', text: t('snippet.text') }), text,
        createElement('div', { class: 'rb-text-hint', text: t('snippet.text.hint') }),
        createElement('div', { class: 'rb-field-label rb-extras-label', text: t('snippet.extras') }), extras),
      createElement('div', { class: 'rb-editor-actions' },
        remove, createElement('span', { class: 'rb-spacer' }),
        textButton(t('common.cancel'), 'secondary', closeEditor, 'snippet-cancel'), save));
  }

  function renderConfirm() {
    const request = pendingConfirm;
    if (!request) { currentView = 'main'; renderMain(); return; }
    panelHeader(request.title, request.returnTo);
    panelBody.append(
      createElement('p', { class: 'rb-confirm-text', text: request.body }),
      createElement('div', { class: 'rb-confirm-actions' },
        textButton(t('common.cancel'), 'secondary', () => { pendingConfirm = null; setView(request.returnTo, -1); }, 'confirm-cancel'),
        textButton(request.action, 'destructive', () => {
          pendingConfirm = null;
          currentView = request.returnTo; viewMotion = -1;
          request.onConfirm();
          renderPanel();
        }, 'confirm-ok')));
  }

  /* =========================================================================
   * Setup guide: a card beside the chat that ticks off the three things Twitch has to be seen doing.
   * It sits outside the panel, because the panel opens right where Twitch's own chat menus do.
   * ========================================================================= */

  const GUIDE_WIDTH = 300;
  let guideCard = null, guideRing = null, guideTimer = null, guideSignature = '', guideStarted = false;
  let guideMode = 'setup', guideKeys = HASH_KEYS;   // 'repair': only the steps Twitch broke, after setup was done once
  const repairing = () => state.setupComplete && !hashesReady();

  const isGuideOpen = () => !!guideCard && guideCard.isConnected;

  function openGuide() {
    if (!document.body) return;
    injectStyles();
    const missing = HASH_KEYS.filter(key => !state.hashes[key]);
    if (!isGuideOpen()) {
      guideMode = repairing() ? 'repair' : 'setup';
      guideKeys = guideMode === 'repair' ? missing : HASH_KEYS;
    } else if (guideMode === 'repair') {
      guideKeys = HASH_KEYS.filter(key => guideKeys.includes(key) || missing.includes(key));
    }
    if (!isGuideOpen()) {
      guideCard = createElement('div', { id: 'rb-guide', role: 'region' });
      guideRing = createElement('div', { id: 'rb-guide-ring', 'aria-hidden': 'true' });
      document.body.append(guideCard, guideRing);
      clearInterval(guideTimer);
      guideTimer = setInterval(() => { if (guideSignature !== guideFacts()) renderGuide(); else positionGuide(); }, 500);
    }
    renderGuide();
  }

  // `remember`: don't open by itself again (finished, or put off).
  function closeGuide(remember = true) {
    clearInterval(guideTimer);
    if (guideCard) guideCard.remove();
    if (guideRing) guideRing.remove();
    guideCard = guideRing = null;
    if (remember && !state.guideDone) { state.guideDone = true; saveState(); }
  }

  // Opens the guide the first time a chat shows up, for someone who hasn't set Rainbark up yet.
  function startGuideOnce() {
    if (guideStarted) return;
    guideStarted = true;
    if (repairing() || (!hashesReady() && !state.guideDone)) openGuide();
  }

  // Everything the card's contents depend on, so it's only rebuilt when one of them changes.
  const guideFacts = () => [HASH_KEYS.map(key => (state.hashes[key] ? 1 : 0)).join(''), viewerName() ? 1 : 0,
    document.querySelector(TOOLBAR_ANCHOR) ? 1 : 0, activeLanguage].join('|');

  function renderGuide() {
    if (!isGuideOpen()) return;
    guideSignature = guideFacts();
    const done = guideKeys.every(key => state.hashes[key]);
    const fixing = guideMode === 'repair';
    if (done && !state.guideDone) { state.guideDone = true; saveState(); }
    const focusKey = guideCard.contains(document.activeElement) ? document.activeElement.getAttribute('data-rb-key') : null;
    const guideButton = (label, variant, key, onClick) => createElement('button', {
      type: 'button', class: `rb-guide-btn${variant ? ` rb-guide-btn--${variant}` : ''}`, 'data-rb-key': key, text: label, onclick: onClick,
    });
    const closeLabel = t(done ? 'common.close' : 'guide.later');
    const parts = [createElement('div', { class: 'rb-guide-head' },
      pup('happy'),
      createElement('div', { class: 'rb-guide-title', id: 'rb-guide-title',
        text: t(fixing ? (done ? 'guide.fix.done.title' : 'guide.fix.title') : (done ? 'guide.done.title' : 'guide.title')) }),
      createElement('button', { type: 'button', class: 'rb-guide-x', 'aria-label': closeLabel, title: closeLabel, 'data-rb-key': 'guide-x', onclick: () => closeGuide() }, icon('close')))];

    if (done) {
      parts.push(
        createElement('p', { class: 'rb-guide-text', text: t(fixing ? 'guide.fix.done.body' : 'guide.done.body') }),
        createElement('div', { class: 'rb-guide-actions' },
          fixing ? null : guideButton(t('guide.openPanel'), 'primary', 'guide-panel', () => { closeGuide(); openPanel('main'); }),
          guideButton(t('common.close'), fixing ? 'primary' : '', 'guide-close', () => closeGuide())));
    } else {
      const current = guideKeys.find(key => !state.hashes[key]);
      const problem = !viewerName() ? 'guide.signIn' : !document.querySelector(TOOLBAR_ANCHOR) ? 'guide.needChat' : null;
      parts.push(
        createElement('p', { class: 'rb-guide-text', text: t(fixing ? 'guide.fix.intro' : 'guide.intro') }),
        problem ? createElement('p', { class: 'rb-guide-warn', text: t(problem) }) : null,
        createElement('ol', { class: 'rb-guide-steps' }, guideKeys.map((key, index) => {
          const stepDone = !!state.hashes[key];
          return createElement('li', { class: `rb-guide-step ${stepDone ? 'is-done' : key === current ? 'is-current' : 'is-todo'}`, 'data-step': key,
            'aria-current': key === current ? 'step' : null },
            createElement('span', { class: 'rb-guide-mark', 'aria-hidden': 'true' }, stepDone ? icon('check') : String(index + 1)),
            createElement('div', { class: 'rb-guide-step-text' },
              createElement('div', { class: 'rb-guide-step-title', text: t(`guide.step.${key}`) }),
              key === current ? createElement('div', { class: 'rb-guide-step-how', text: t(`hashes.${key}.how`) }) : null));
        })),
        createElement('div', { class: 'rb-guide-foot' },
          createElement('span', { class: 'rb-guide-progress', role: 'status',
            text: t('guide.progress', { count: guideKeys.filter(key => state.hashes[key]).length, total: guideKeys.length }) }),
          guideButton(t('guide.later'), 'quiet', 'guide-later', () => closeGuide())));
    }
    guideCard.setAttribute('aria-labelledby', 'rb-guide-title');
    guideCard.classList.toggle('is-done', done);
    guideCard.replaceChildren(...parts.filter(Boolean));
    if (focusKey) { const again = guideCard.querySelector(`[data-rb-key="${focusKey}"]`) || guideCard.querySelector('button'); if (again) again.focus({ preventScroll: true }); }
    positionGuide();
  }

  // Beside the chat column when there's room (so Twitch's menus stay uncovered), otherwise in the top corner.
  // The ring marks what to click first.
  function positionGuide() {
    if (!isGuideOpen()) return;
    const margin = 12;
    const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
    const width = Math.min(GUIDE_WIDTH, viewportWidth - margin * 2);
    const toolbar = document.querySelector(TOOLBAR_ANCHOR);
    const rect = toolbar && toolbar.getBoundingClientRect();
    const style = { width: `${width}px`, top: 'auto', bottom: 'auto', left: 'auto' };
    const gap = 22;
    if (rect && rect.width && rect.left - gap - width >= margin) {
      style.left = `${rect.left - gap - width}px`; style.bottom = `${Math.max(margin, viewportHeight - rect.bottom)}px`;
    } else if (rect && rect.width && rect.right + gap + width <= viewportWidth - margin) {
      style.left = `${rect.right + gap}px`; style.bottom = `${Math.max(margin, viewportHeight - rect.bottom)}px`;
    } else {
      style.left = `${Math.max(margin, viewportWidth - width - margin)}px`; style.top = '58px';
    }
    Object.assign(guideCard.style, style);

    const pointAt = guideMode === 'repair' ? !guideKeys.every(key => state.hashes[key]) : !state.hashes.badges;
    const target = pointAt && (document.querySelector(IDENTITY_BUTTON) || document.querySelector(GEAR_SELECTOR));
    const box = target && target.getBoundingClientRect();
    if (!box || !box.width || !box.height) { guideRing.style.display = 'none'; return; }
    Object.assign(guideRing.style, { display: 'block', left: `${box.left - 3}px`, top: `${box.top - 3}px`, width: `${box.width + 6}px`, height: `${box.height + 6}px` });
  }

  const VIEWS = {
    main: renderMain, channels: renderChannels, timing: renderTiming, pronouns: renderPronouns, badges: renderBadges, arrange: renderArrange, wheel: renderWheel, palettes: renderPalettes,
    shortcuts: renderShortcuts, snippet: renderSnippet, hashes: renderHashes, settings: renderSettings, confirm: renderConfirm,
  };

  function accentGradient() {
    const stops = sampleColors(12);
    return stops.length > 1 ? `linear-gradient(90deg, ${stops.join(', ')})` : stops[0];
  }

  function renderPanel() {
    if (!panel) return;
    const previousView = panel.dataset.view;
    const sameView = previousView === currentView;
    const focused = document.activeElement;
    const hadFocus = !!focused && panel.contains(focused);
    const focusKey = hadFocus ? focused.getAttribute('data-rb-key') : null;
    const scrollTop = sameView && panelBody ? panelBody.scrollTop : 0;

    panel.replaceChildren(createElement('div', { class: 'rb-accent', 'aria-hidden': 'true', style: { background: accentGradient() } }));
    wheelPreviewHost = null;
    panelBody = createElement('div', { class: 'rb-body' });
    panelBody.addEventListener('scroll', () => panel.classList.toggle('is-scrolled', panelBody.scrollTop > 0), { passive: true });
    (VIEWS[currentView] || renderMain)();
    panel.append(panelBody);
    panel.dataset.view = currentView;

    panelBody.scrollTop = scrollTop;
    panel.classList.toggle('is-scrolled', panelBody.scrollTop > 0);

    if (hadFocus) {
      const find = key => (key ? panel.querySelector(`[data-rb-key="${CSS.escape(key)}"]`) : null);
      const target = sameView ? find(focusKey)
        : currentView === 'confirm' ? find('confirm-cancel')
        : currentView === 'snippet' ? find('snippet-trigger')
        : (previousView === 'confirm' && find(confirmReturnKey)) || find(`nav:${previousView}`) || find('back');
      (target || panel).focus({ preventScroll: true });
    }

    if (!sameView && viewMotion && panel.classList.contains('open'))
      panelBody.classList.add(viewMotion > 0 ? 'rb-enter-fwd' : 'rb-enter-back');
    viewMotion = 0;
    positionPanel();
  }

  function setView(viewName, motion = 0) { currentView = viewName; viewMotion = motion; renderPanel(); }

  // Live updates while the panel is open (e.g. chatting with it open): keep the color readouts current
  // without rebuilding the wheel view mid-drag or the text view mid-typing.
  function refreshLiveViews() {
    if (!panel || !panel.classList.contains('open')) return;
    if (currentView === 'main') renderPanel();
    else if (currentView === 'wheel') drawWheelPreview();
  }

  /* =========================================================================
   * Open / close / positioning / direction
   * ========================================================================= */

  const isPanelOpen = () => !!panel && panel.classList.contains('open');

  function visibleEntryButton() {
    const toolbarButton = document.getElementById('rb-toolbtn');
    for (const candidate of [toolbarButton, floatingButton]) {
      if (!candidate || !candidate.isConnected) continue;
      const rect = candidate.getBoundingClientRect();
      if (rect.width && rect.height) return candidate;
    }
    return null;
  }

  function positionPanel() {
    if (!isPanelOpen()) return;
    const margin = 8;
    const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
    const width = Math.min(PANEL_WIDTH, viewportWidth - margin * 2);
    const anchor = visibleEntryButton();

    let rightEdge = viewportWidth - 20, anchorTop = viewportHeight - 70, anchorBottom = viewportHeight - 20;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      const toolbar = anchor.closest(TOOLBAR_ANCHOR);
      rightEdge = toolbar ? toolbar.getBoundingClientRect().right : rect.right;
      anchorTop = rect.top; anchorBottom = rect.bottom;
    }
    if (panelClearsChatBox) {
      const field = document.querySelector(CHAT_INPUT);
      const box = field && (field.closest('.chat-wysiwyg-input-box, .chat-input__textarea') || field);
      const boxRect = box && box.getBoundingClientRect();
      if (boxRect && boxRect.height) anchorTop = Math.min(anchorTop, boxRect.top);
    }

    const spaceAbove = anchorTop - PANEL_GAP - margin;
    const spaceBelow = viewportHeight - anchorBottom - PANEL_GAP - margin;
    const placeAbove = spaceAbove >= 360 || spaceAbove >= spaceBelow;
    const left = Math.max(margin, Math.min(rightEdge - width, viewportWidth - width - margin));

    panel.classList.toggle('rb-below', !placeAbove);
    Object.assign(panel.style, {
      width: `${width}px`,
      left: `${left}px`,
      right: 'auto',
      top: placeAbove ? 'auto' : `${anchorBottom + PANEL_GAP}px`,
      bottom: placeAbove ? `${viewportHeight - anchorTop + PANEL_GAP}px` : 'auto',
      maxHeight: `${Math.max(200, Math.min(PANEL_MAX_HEIGHT, placeAbove ? spaceAbove : spaceBelow))}px`,
    });
  }

  function setExpanded(expanded) {
    document.querySelectorAll('.rb-entry').forEach(button => button.setAttribute('aria-expanded', String(expanded)));
  }

  function openPanel(view = 'main', takeFocus = true) {
    refreshLanguage();
    currentView = view; viewMotion = 0; pendingConfirm = null;
    panelClearsChatBox = !takeFocus;
    panel.classList.add('open');
    panel.dataset.view = '';
    renderPanel();
    setExpanded(true);
    if (takeFocus) requestAnimationFrame(() => panel.focus({ preventScroll: true }));
  }

  function closePanel(restoreFocus) {
    if (!isPanelOpen()) return;
    const focusWasInside = panel.contains(document.activeElement);
    panel.classList.remove('open');
    setExpanded(false);
    if (focusWasInside || restoreFocus === true) {
      const entry = visibleEntryButton();
      if (entry) entry.focus({ preventScroll: true });
    }
  }

  function togglePanel() { if (isPanelOpen()) closePanel(); else openPanel(); }

  /* =========================================================================
   * Toolbar paw: main pad = current name color, toes = the rest of the wheel
   * ========================================================================= */

  function indicatorColors() {
    if (!appliedColor) return null;
    const login = currentChannel();
    const cycling = !state.paused && state.colorOn && login && !isChannelFrozen(login) && hashesReady();
    if (!cycling) return Array(5).fill(appliedColor);
    return [appliedColor, ...pawColors().slice(1)];
  }

  function updateIndicator(wag) {
    const colors = indicatorColors();
    document.querySelectorAll('.rb-entry').forEach(button => {
      button.setAttribute('data-rb-state', state.paused ? 'paused' : colors ? 'live' : 'idle');
      if (colors) colors.forEach((color, index) => button.style.setProperty(`--rb-pad-${index}`, color));
      const paw = button.querySelector('.rb-paw');
      if (wag && paw && colors && !state.paused) {
        paw.classList.remove('rb-wag');
        void paw.getBoundingClientRect();
        paw.classList.add('rb-wag');
      }
    });
    if (wag) refreshLiveViews();
  }

  const entryTitle = () => t(state.paused ? 'app.paused' : 'app.name') + (shortcutKeys ? ` · ${t('app.shortcut', { keys: shortcutKeys })}` : '');

  // After any change to the language or wording.
  function refreshEntryLabels() {
    document.querySelectorAll('.rb-entry').forEach(button => {
      button.setAttribute('aria-label', t('app.open'));
      button.title = entryTitle();
    });
    sendPronounSettings();
  }

  /* =========================================================================
   * Toasts
   * ========================================================================= */

  let toastHost;
  function showToast(message, tone = 'ok') {
    if (!document.body) return;
    if (document.head) injectStyles();
    if (!toastHost || !toastHost.isConnected) {
      toastHost = createElement('div', { class: 'rb-toasts', role: 'status', 'aria-live': 'polite' });
      document.body.append(toastHost);
    }
    const glyph = tone === 'error' ? icon('info') : pawIcon();
    const toast = createElement('div', { class: `rb-toast rb-toast--${tone}` }, glyph, message);
    toastHost.append(toast);
    setTimeout(() => {
      toast.classList.add('rb-toast--out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
      setTimeout(() => toast.remove(), 400); // reduced-motion fallback: no animationend fires
    }, tone === 'error' ? 5000 : 3000);
  }

  /* =========================================================================
   * Entry-point injection (chat toolbar button, floating fallback)
   * ========================================================================= */

  // Clone Twitch's own gear button so ours inherits its exact size, hover and focus styling,
  // then swap in the paw. Falls back to a lookalike if the gear isn't there.
  function buildToolbarButton(container) {
    const gear = container.querySelector(GEAR_SELECTOR);
    let button;
    if (gear) {
      button = gear.cloneNode(true);
      for (const attr of ['data-a-target', 'data-test-selector', 'aria-describedby', 'aria-controls'])
        button.removeAttribute(attr);
      const glyph = button.querySelector('svg');
      if (glyph) glyph.replaceWith(pawIcon()); else button.replaceChildren(pawIcon());
    } else {
      button = createElement('button', { class: 'rb-toolbtn' }, pawIcon());
    }
    button.id = 'rb-toolbtn';
    button.type = 'button';
    button.classList.add('rb-entry');
    button.setAttribute('aria-label', t('app.open'));
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', String(isPanelOpen()));
    button.title = entryTitle();
    button.addEventListener('click', event => { event.stopPropagation(); togglePanel(); });
    return button;
  }

  function syncEntryPoint() {
    if (!panel) return;
    const ourButton = document.getElementById('rb-toolbtn');
    if (ourButton && ourButton.isConnected) {
      if (floatingButton.isConnected) floatingButton.remove();
      positionPanel(); // follow the toolbar if Twitch's layout shifted (theatre mode, chat resize)
      return;
    }
    const container = document.querySelector(TOOLBAR_ANCHOR);
    if (container) {
      const button = buildToolbarButton(container);
      const gear = container.querySelector(GEAR_SELECTOR);
      let group = gear;
      while (group && group.parentElement && group.parentElement !== container) group = group.parentElement;
      if (group && group.parentElement === container) container.insertBefore(button, group);
      else container.append(button);
      if (floatingButton.isConnected) floatingButton.remove();
      startGuideOnce();
    } else if (!floatingButton.isConnected) {
      document.body.append(floatingButton);
    }
    updateIndicator();
    positionPanel();
  }

  function addUI() {
    if (panel) return;
    injectStyles();
    panel = createElement('div', { id: 'rb-panel', role: 'dialog', 'aria-labelledby': 'rb-title', tabindex: '-1' });
    document.body.append(panel);
    floatingButton = createElement('button', {
      id: 'rb-fab', class: 'rb-entry', type: 'button', title: entryTitle(),
      'aria-label': t('app.open'), 'aria-haspopup': 'dialog', 'aria-expanded': 'false', onclick: () => togglePanel(),
    }, pawIcon());

    document.addEventListener('mousedown', event => {
      if (!isPanelOpen()) return;
      if (panel.contains(event.target)) return;
      if (event.target.closest && event.target.closest('#rb-toolbtn, #rb-fab')) return;
      closePanel();
    });
    panel.addEventListener('keydown', event => {
      // keep Twitch's player hotkeys (space, k, m, f…) from reacting to keys pressed inside the panel
      event.stopPropagation();
      if (event.key === 'Escape') closePanel(true);
    });
    window.addEventListener('resize', positionPanel);
    window.addEventListener('resize', positionGuide);

    syncEntryPoint();
    const observer = new MutationObserver(() => {
      if (observer.scheduled) return;
      observer.scheduled = true;
      requestAnimationFrame(() => { observer.scheduled = false; syncEntryPoint(); });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* =========================================================================
   * Talking to the extension (bridge.js and pronouns.js run beside this script)
   * ========================================================================= */

  // The extension keeps the newest settings from every Twitch site and tab, and sends them here when the page starts
  // and whenever another tab saves. A site with nothing of its own yet (the dashboard on first visit, or Twitch's
  // storage cleared) takes the copy as it is; otherwise only a newer copy is taken.
  function onBackup(json) {
    if (typeof json !== 'string') { if (hadSavedSettings) backUpSoon(); return; }
    let saved;
    try { saved = JSON.parse(json); } catch (error) { return; }
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
    const theirs = Number(saved.savedAt) || 0, ours = Number(state.savedAt) || 0;
    if (hadSavedSettings && theirs <= ours) { if (theirs < ours) backUpSoon(); return; }
    const restored = !hadSavedSettings && location.hostname === 'www.twitch.tv' && HASH_KEYS.some(key => saved.hashes && saved.hashes[key]);
    const first = !hadSavedSettings;
    hadSavedSettings = true;
    replaceState(tidyState(saved), { stamp: false, prime: first });
    if (hashesReady()) closeGuide(false);   // the walkthrough may have opened before the copy arrived
    if (restored) { log('settings restored from the extension copy'); showToast(t('toast.restored')); }
  }

  // pronouns.js (beside this script, with extension access) puts the tags in; it gets the settings and wording from here.
  function sendPronounSettings() {
    const look = state.pronouns;
    emit('rainbark:pronouns', { on: look.on, chat: look.chat, about: look.about, css: PRONOUN_LOOK.css(look), spec: PRONOUN_LOOK.spec(look),
      text: { title: t('pronouns.tagTitle'), label: t('pronouns.tagLabel') } });
  }

  function onExtensionMessage(message) {
    if (message.type === 'backup') onBackup(message.state);
    else if (message.type === 'shortcut' && typeof message.keys === 'string') { shortcutKeys = message.keys.slice(0, 40); refreshEntryLabels(); }
    else if (message.type === 'toggle-panel' && panel) {
      if (isPanelOpen()) { closePanel(true); return; }
      openPanel('main');
      if (message.keyboard) requestAnimationFrame(() => { const first = panel.querySelector('[data-rb-key="quick:pause"]'); if (first) first.focus(); });
    }
  }

  /* =========================================================================
   * Boot
   * ========================================================================= */

  if (document.body) addUI(); else document.addEventListener('DOMContentLoaded', addUI);
  setInterval(checkForChannelChange, 750);
  checkForChannelChange();

  window.addEventListener('rainbark:from-extension', event => {
    let message;
    try { message = JSON.parse(event.detail); } catch (error) { return; }
    if (isObject(message)) onExtensionMessage(message);
  });
  window.addEventListener('rainbark:pronouns-hello', sendPronounSettings);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tellExtension('hello'); });
  sendPronounSettings();
  tellExtension('hello');

  // Twitch can set its page language after this script starts, so follow it when it appears or changes.
  function watchPageLanguage() {
    const root = document.documentElement;
    if (!root) { document.addEventListener('DOMContentLoaded', watchPageLanguage, { once: true }); return; }
    new MutationObserver(() => {
      const before = activeLanguage;
      refreshLanguage();
      if (activeLanguage === before) return;
      refreshEntryLabels();
      if (panel && panel.classList.contains('open')) renderPanel();
    }).observe(root, { attributes: true, attributeFilter: ['lang'] });
  }
  watchPageLanguage();

  // The old userscript doesn't know about this copy. If it starts after us, say so.
  setTimeout(() => { if (window.__rainbark !== debugApi) showToast(t('app.duplicate'), 'error'); }, 4000);

  const debugApi = window.__rainbark = {
    state: () => state, badges: () => ownedBadges, hashes: () => state.hashes, reloadBadges: loadBadges,
    exportSettings, importJSON: importSettings, resetSettings, text: t, channel: currentChannel,
  };
  log('loaded');
})();
