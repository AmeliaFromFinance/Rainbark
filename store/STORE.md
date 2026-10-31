# Rainbark: store listing

Everything the Chrome Web Store, Firefox Add-ons and Edge Add-ons forms ask for, ready to paste.

- **Package:** `./package.sh` → `dist/rainbark-<version>.zip` (the same zip for all three stores)
- **Privacy policy URL:** `https://github.com/AmeliaFromFinance/Rainbark/blob/main/PRIVACY.md`
- **Website:** `https://rainbark.sinist3r.lol`
- **Support:** `https://github.com/AmeliaFromFinance/Rainbark/issues`
- **Images:** this folder (see the table at the end)

## Listing text

**Name:** Rainbark

**Summary** (Chrome shows the manifest's 132-character description; Firefox's summary allows 250):

> A new chat badge and name color with every Twitch message: rainbow, pastel, pride flags and more, plus pronouns and chat shortcuts.

**Description** (plain text; Edge needs at least 250 characters):

```
Every message you send in Twitch chat gets a new global badge and a new name color.

COLORS
- A rainbow wheel, pastel, sunset and other palettes, 36 pride flags, Twitch's 15 free colors, or your own list.
- Each channel remembers where it is in the palette. Freeze a channel to keep one color there.
- Go through the palette in order, or in random order.

BADGES
- Shuffled or in your own order. Switch badges off, star favorites so they come up more often, pin one badge to a channel, or give a channel its own set.

AND MORE
- How often: every message, every few messages, or at most once every so many seconds.
- Pronouns from pr.alejo.io next to people's names, styled the way you like.
- Chat shortcuts: type >color and it becomes your current hex code. Add your own snippets.
- Alt+Shift+R opens the panel with quick Pause, Freeze and palette buttons.
- Recent colors at a glance. Click one to copy its hex code.
- Works in the creator dashboard's chat too.
- English, Español, Français, Deutsch, Português, Русский and 日本語.

GETTING STARTED
Open any Twitch channel while signed in. A paw button appears below the chat box and a short setup card walks you through it: open Chat Identity, pick any badge, pick any color. Rainbark then reuses those same requests.

Most palettes need Twitch Turbo or Prime, because Twitch only lets those accounts pick any color. The "Twitch free colors" palette works for everyone.

PRIVACY
No servers, no analytics, no ads. Badge and color changes go to Twitch exactly as Twitch's own menus send them. With pronouns on, the usernames of people in chat are sent to the pronouns API at api.pronouns.alejo.io. Settings stay in your browser.

Rainbark isn't made by or affiliated with Twitch.
```

**Category:** pick the closest social or communication category in each store: for example Social Networking on Chrome, Social & Communication on Firefox, and Social on Edge. The lists change, so go by what each form offers.

**Search terms** (Edge, up to 7): `twitch`, `chat`, `name color`, `badge`, `rainbow`, `pride`, `pronouns`

## Chrome Web Store and Edge: privacy practices

**Single purpose:**

> Rainbark personalizes your own presence in Twitch chat: it changes your chat badge and name color as you send messages, with chat helpers that support that (pronoun tags beside names and typing shortcuts).

**Permission justifications:**

| Asked about | Answer |
|---|---|
| `storage` | Keeps the user's settings (palettes, badge choices, per-channel positions, snippets) in extension storage, so they survive Twitch's site data being cleared and are shared between twitch.tv tabs and the creator dashboard. |
| Host permission `https://api.pronouns.alejo.io/*` | Looks up the pronouns that chatters have set at pr.alejo.io, so they can be shown next to their names. Only usernames are sent. |
| Content scripts on `https://www.twitch.tv/*` and `https://dashboard.twitch.tv/*` | The extension only works in Twitch chat: it adds its panel there, changes the user's badge and color, shows pronoun tags and expands chat shortcuts. One script runs in the page's main world because it must see the requests Twitch's own Chat Identity menu sends and edit Twitch's chat box, which an isolated content script can't reach. |

**Remote code:** No, I am not using remote code.

**Data usage:** tick these, then all three certifications (not sold; not used or transferred for unrelated purposes; not used for creditworthiness or lending):

| Category | Why |
|---|---|
| Personally identifiable information | Reads the user's own Twitch login and display name from Twitch's cookie, to know whose chat box it's working on. Used in the page only. |
| Authentication information | Uses the Twitch session header that Twitch's page already sends, so badge and color changes come from the user. Kept in memory only and sent only to Twitch. |
| Personal communications | Reads the chat message being typed, only to expand shortcuts like >color before it's sent. Not kept or sent elsewhere. |
| Web history | The name of the Twitch channel being viewed is sent to the pronouns API, for the tag on its About panel. |
| User activity | Watches the requests Twitch's own page makes, to learn which ones change the badge and color. |
| Website content | Reads Twitch chat to find usernames; those usernames are sent to the pronouns API to look up pronouns. |

## Firefox Add-ons

- **Listing:** "On this site" (public). Choose "On your own" only for a private, signed copy.
- **Compatibility:** Firefox. Tick Android only after trying it there.
- **Source code:** No. The code isn't minified or bundled. Upload the files exactly as they are in the repository; don't run `strip_comments.py` on this zip, because Mozilla counts removing comments as minifying and would then ask for the source.
- **Data collection:** already declared in `manifest.json`: required `websiteContent` and `browsingActivity`, for the pronoun lookups. Firefox shows this in the install prompt.
- **Privacy policy:** tick "This add-on has a privacy policy" and paste the text of `PRIVACY.md`.
- **License:** the one in your repository's LICENSE file.
- **Add-on URL:** `rainbark`, if it's free. Then the listing is `https://addons.mozilla.org/firefox/addon/rainbark/`.

## Notes for reviewers

Paste into Firefox's "Notes for Reviewers" and Chrome/Edge's certification notes:

```
Rainbark changes the user's own Twitch chat badge and name color as they chat.

How to test: sign in to Twitch, open any channel's chat, and follow the setup card beside the chat (open Chat Identity, pick a badge, pick a color). Then send a message: the badge and name color change. The paw button below the chat box opens the panel.

Why page.js runs in the MAIN world: Twitch has no public API for changing these, so the extension reuses the exact requests Twitch's own Chat Identity menu sends. It needs the page's fetch to see those requests, and the page's React state to edit the chat box for chat shortcuts. Neither is reachable from an isolated content script. The Twitch session header it reuses stays in page memory and is only sent back to Twitch (gql.twitch.tv), the same as Twitch's own menu does.

bridge.js and pronouns.js run in the isolated world: bridge.js keeps a copy of the settings in extension storage; pronouns.js adds pronoun tags. background.js looks up pronouns at api.pronouns.alejo.io (usernames only) and handles the toolbar button and keyboard shortcut.

No remote code, no analytics, no other servers. The source is not minified.
```

## Images

| File | Size | Used by |
|---|---|---|
| `screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png` | 1280×800 | Chrome (at least 1, up to 5), Edge (up to 6), Firefox |
| `promo-small.png` | 440×280 | Chrome (required), Edge (optional) |
| `logo-300.png` | 300×300 | Edge store logo |

Chrome's store icon is the 128×128 icon already in the zip.
