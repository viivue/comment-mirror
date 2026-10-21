<h1 align="center">Comment Mirror</h1>

<p align="center">
  <img alt="Figma plugin" src="https://img.shields.io/badge/Figma-plugin-F24E1E?logo=figma&logoColor=white">
  <img alt="Free" src="https://img.shields.io/badge/price-free-brightgreen">
</p>

<p align="center">
  Copy your Figma comments, with the same text and position, from an old duplicate into the file you're working in.
</p>

---

## Install (Figma desktop app)

1. Open the **Figma desktop app**.
2. Open the *new* duplicate file (the one that should receive the comments).
3. **Plugins → Development → Import plugin from manifest…**, pick `manifest.json` from this folder.
4. Run it: **Plugins → Development → Comment Mirror**.

## Create the token

The Plugin API can't read or write comments, so the plugin calls the Figma REST API with your personal access token.

1. Figma → your avatar → **Settings** → **Security** → **Personal access tokens** → **Generate new token**.
2. Choose an expiration and enable these scopes:
   - **Comments: Read** (`file_comments:read`)
   - **Comments: Write** (`file_comments:write`)
3. Copy the token right away (Figma shows it once) and paste it in the plugin.

No other scope is needed. A 403 means a missing scope or no access to the file;
a 404 means a wrong file key or no access for the token owner.

## Usage

<p align="center">
  <img width="360" alt="Comment Mirror plugin window" src="https://github.com/user-attachments/assets/4f1d6ee8-72aa-4f53-9929-5041a7aa367d">
</p>

1. Paste the token (*Remember token* stores it in `figma.clientStorage`; *Forget token* deletes it).
2. Paste the **source** file URL (`figma.com/design/KEY/...` or `/file/KEY/...`).
   The target is the open file; if its key can't be detected, a *Target file URL* field appears.
3. Click **Mirror comments**. The plugin reads both files' comments and shows the plan:
   number of POST requests and estimated time. Click **Start** to post. **Stop** finishes the current request and stops.
4. **Dry run** fetches and previews everything without posting.

## Rate limits

> **Note for Starter plan:** the plugin works on every plan, but Starter has the tightest API limits,
> so the plugin is throttled to stay within them. Paid plans may be faster, but the plugin uses the same pace everywhere.

- Comments endpoints are limited to about **5 requests per minute** on Starter, so the plugin sends
  **one request every 12 seconds**. 100 comments take about 20 minutes. Keep the plugin open.
- The plugin only calls `GET`/`POST /v1/files/:key/comments`. It never calls the file, nodes or images
  endpoints, which allow only ~20 requests per *month* on Starter.
- On HTTP 429 it waits `Retry-After` and retries, showing the plan tier and limit type if the browser exposes them.
  If Retry-After is over 5 minutes, it stops and lists the remaining comments as **not yet mirrored**.
  Run it again later: comments already in the target are skipped, so it resumes where it stopped.

## How comments are matched

- Canvas comments (x, y) are posted as is.
- Comments attached to a node (`node_id`) are posted as is **if that node id exists in this file**
  (duplicates normally keep node ids). Otherwise they are **orphaned**: not posted, listed with full text
  so you can re-add them by hand (*Copy all orphans*).
- A comment counts as "already exists" when message and position (node id + offset, or x,y) match a comment in the target.
  Replies are matched by message under the already-mirrored parent.
- The token is only sent in the `X-Figma-Token` header, never in a URL, and never logged.

## Files

- `manifest.json` – plugin config (network access limited to `api.figma.com`)
- `code.js` – main thread: token storage, file key, node-existence checks
- `ui.html` – UI, throttled REST calls and migration logic (no build step)
