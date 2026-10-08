# Rainbark privacy policy

*Last updated: 8 October 2026*

Rainbark is a browser extension for Twitch chat. It has no servers of its own, no accounts, no analytics, no tracking and no ads. This page explains what it reads, what it keeps, and the one place it sends anything outside Twitch.

## What Rainbark reads on Twitch

Rainbark only runs on `www.twitch.tv` and `dashboard.twitch.tv`.

- **Twitch's own requests to change your badge and color.** When you use Twitch's Chat Identity menu, Rainbark notes which requests Twitch sent (their "query hashes") so it can send the same ones later. It also borrows the request headers Twitch's page uses, including your Twitch sign-in token, so its requests come from you exactly as Twitch's own would. The headers are kept in the page's memory only: they are never saved and never sent anywhere except to Twitch.
- **Your Twitch login and display name,** read from Twitch's `twilight-user` cookie, to know whose chat box it's working on. Nothing else in that cookie is used, and it isn't saved or sent anywhere.
- **The message you're typing,** only to turn chat shortcuts such as `>color` into their text before you send it. Rainbark doesn't keep or send your messages; Twitch receives them as usual.
- **Chat and the channel page,** to find usernames for pronoun tags (below) and to show its panel.

## What Rainbark sends

- **To Twitch:** the badge and color changes you've asked for, from the Twitch page, exactly as Twitch's own menus would send them.
- **To the pronouns API (`api.pronouns.alejo.io`),** when pronoun tags are on: the usernames of people whose messages appear in chat, and the name of the channel you're viewing (for the tag on its About panel). The API answers with the pronouns each person has chosen at [pr.alejo.io](https://pr.alejo.io). The requests don't include cookies or anything about you, but like any web request they reveal your IP address to that service. Answers are kept in memory for up to an hour. That service is run independently of Rainbark; see [pr.alejo.io](https://pr.alejo.io) for how it handles requests. You can turn pronoun tags off in the panel's Pronouns view, and then no usernames are sent.

Rainbark sends nothing else, to anyone. It never sells or shares data, and never uses it for anything but the features above.

## What Rainbark keeps

Your settings stay in your browser: in Twitch's site storage and in the extension's own storage, so they survive Twitch's site data being cleared. They include your palette and badge choices, per-channel positions, your snippets, any text you've reworded, and the query hashes noted above. They don't include your sign-in token or anyone's pronouns.

**Copy diagnostics** puts a short report on your clipboard only when you click it. It includes the channel you're on, your browser version and Rainbark's recent activity, but no sign-in details and no usernames. It goes wherever you paste it, and nowhere else.

## Removing your data

Uninstalling Rainbark removes its extension storage. Its settings in Twitch's site storage stay until you clear site data for twitch.tv (in your browser's settings, or from the site information menu beside the address bar). The panel's **Reset** and **Forget query hashes** buttons clear most settings without uninstalling.

## Contact

Questions or problems: [open an issue](../../issues) on this repository.

If this policy changes, the new version will be posted here with a new date.
