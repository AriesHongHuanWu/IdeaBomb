# IdeaBomb

A real-time collaborative whiteboard where an AI assistant writes onto the canvas instead of replying in chat.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-ideabomb.awbest.tech-informational)](https://ideabomb.awbest.tech)

Planning sessions usually split across a whiteboard, a task list and a chat window. IdeaBomb puts all three on one infinite canvas: stickies, todo lists, calendars, Kanban columns, embeds and the arrows between them all live in Firestore, so several people on the same board see each other's cursors and edits as they happen. The chat panel reads the same board state, and when you ask it for a launch plan it emits a JSON action list that the client turns into real nodes and edges laid out on the canvas.

Live deployment: **https://ideabomb.awbest.tech**

## How it works

The app is a Vite + React SPA with no server of its own. Firestore is both the database and the sync channel, and two Cloudflare Pages Functions handle the things a browser cannot do.

### Data model

```
boards/{boardId}                 title, createdBy, allowedEmails, viewers, pageConfigs
  ├── nodes/{nodeId}             type, content, x, y, w, h, page, items, events, ...
  ├── edges/{edgeId}             from, to, page
  ├── cursors/{uid}              x, y, color, displayName, page, lastActive
  ├── presence/{uid}             uid, displayName, photoURL, lastActive
  └── messages/{msgId}           role, content, sender, isAI, createdAt
users/{uid}/ai_usage/{YYYY-MM-DD}   count      (daily AI quota)
settings/ai_config                  defaultDailyLimit, quotaEnabled, maintenanceMode
```

Every board is a document plus five subcollections. A "page" is just a string field on each node, so one board can hold several canvases without extra documents.

### Canvas rendering: `src/components/Whiteboard.jsx`

The largest module (~2,400 lines) owns pan, zoom and every node type.

- **Viewport.** A native non-passive `wheel` listener implements zoom-to-cursor: it converts the pointer to container coordinates, computes `scaleRatio = newScale / scale`, then sets `offset = mouse - (mouse - offset) * scaleRatio` so the point under the cursor stays fixed. Scale is clamped to 0.1–5. Two-finger `touchmove` drives the same scale from the pinch distance ratio.
- **Node types.** About 25 components share one `{ node, onUpdate }` contract: `NoteNode`, `TodoNode`, `CalendarNode` (react-big-calendar), `YouTubeNode`, `EmbedNode` (sandboxed iframe for Spotify/BandLab/YouTube), `KanbanNode`, `PomodoroNode`, `TimerNode`, `PollNode`, `DiceNode`, `CodeNode`, `ProgressNode`, `RatingNode`, `LabelNode`, `SectionNode` and others. `getScale(w, h)` derives font sizes, padding and icon sizes from the smaller of the width and height ratios so content stays readable when a node is resized.
- **Connections.** `getAnchors(n1, n2)` compares `|dx|` against `|dy|` between the two node centres to pick which sides face each other, returns the anchor points and a control-point bias, and `ConnectionLayer` draws a cubic bezier through them with an animated `strokeDashoffset`. While a node is being dragged, `dragOverrides` feeds live positions into the same function so edges follow without a Firestore round trip.
- **Selection.** Shift-drag opens a marquee; on pointer-up the hit set is computed with an axis-aligned bounding-box overlap test against every node. Dragging any member of a multi-selection applies the same delta to all of them through one `onBatchUpdate`.

### Sync and history: `src/components/BoardPage.jsx`

- One `onSnapshot` listener per subcollection. Nodes are sorted by `lastInteractedAt`/`createdAt` so z-order is stable across clients.
- Cursor broadcasts are throttled to 100 ms, and skipped entirely when `collaborators.length <= 1`. A solo user writes nothing to the `cursors` collection, which is where most of the write cost would otherwise go.
- Undo/redo is a pair of stacks holding `{ undo, redo }` closures rather than board snapshots, capped at 50 entries. Each mutation pushes its own inverse, so undo replays a Firestore write instead of diffing state.
- Export renders the canvas through `html2canvas`; import reads a JSON board file back into the node collection.

### AI: `src/components/ChatInterface.jsx` and `handleAIAction` in `BoardPage.jsx`

The chat panel calls `gemini-2.5-flash-lite` directly with the `googleSearch` tool enabled. Its system prompt does explicit intent detection: questions get a plain text answer, while "create / plan / brainstorm" requests must return a JSON array of actions. Board context (every node's type and content), the last ten chat messages and the current selection are appended to each prompt.

`handleAIAction` executes that array in a single `writeBatch`, in two passes:

1. **Nodes.** For each `create_node` it mints a UUID and records `idMap["n1"] = <uuid>`, so the model's local ids survive into Firestore. `update_node` matches by id or by substring of the existing content; `delete_node` also deletes the edges touching the removed node.
2. **Edges.** Every `create_edge` resolves `from`/`to` through `idMap`, falling back to real ids for nodes that already existed.

Layout is computed on the client rather than trusted from the model. A node named as the target of a `create_edge` is placed at `parent.x + parent.w + 100`, with `siblingTracker` stacking further children of the same parent downward. Unparented nodes go into a three-column grid starting at `globalFrontierX`, the right edge of all existing content on that page, so a generated flowchart never lands on top of what is already there. Every coordinate is clamped to the page's canvas size. Generated nodes are tagged `aiStatus: 'suggested'`.

Usage is metered per user per day in `users/{uid}/ai_usage/{date}`, with the limit read from `settings/ai_config` and per-user overrides editable in `src/components/AdminPage.jsx`.

### Around the canvas

`src/components/Dashboard.jsx` is the board browser: client-derived folders (a `folder` string on each board), batch move and delete with optimistic removal, and rename/share context menus. `src/components/TodoView.jsx` is a standalone task list backed by a top-level `todos` collection with priorities, due dates and email-based membership. Its "convert to whiteboard" action asks Gemini to group the tasks into named columns and returns JSON, but the coordinates are again computed locally: columns are laid out at `START_X + colIdx * (COL_WIDTH + COL_GAP)` with a header node per column and cards stacked beneath it.

### Access control: `firestore.rules`

Authorization is enforced server-side, not in the UI. `hasAccess(data)` passes for the board owner's uid or for an authenticated email present in `allowedEmails`; `isViewer(data)` marks read-only collaborators, and every write rule on the subcollections is gated on `hasAccess(getBoardData()) && !isViewer(...)`. Node writes are additionally validated: `content` at most 20,000 characters, `label` at most 500, fewer than 200 `items`, and `x`/`y` must be numbers.

### Edge functions: `functions/api/`

- `send-invite.js` posts a rendered HTML invitation to the Resend API using a server-side `RESEND_API_KEY`.
- `notify.js` sends Firebase Cloud Messaging pushes from the Cloudflare Workers runtime, where `firebase-admin` is unavailable. It builds the service-account JWT by hand: `pemToArrayBuffer` strips the PEM armour, `crypto.subtle.importKey` loads the PKCS#8 key as `RSASSA-PKCS1-v1_5` with SHA-256, `crypto.subtle.sign` signs the header/claim pair, and the assertion is exchanged at `oauth2.googleapis.com/token` for an access token scoped to `firebase.messaging`.

## Tech stack

| Layer | What is actually used |
|---|---|
| UI | React 18, React Router 6, Framer Motion, react-icons, react-markdown |
| Build | Vite 5, `vite-plugin-pwa` (autoUpdate service worker, manual vendor/firebase chunks) |
| Data | Firebase 10: Auth (Google), Firestore with `persistentLocalCache` + multi-tab manager, Cloud Messaging |
| AI | `@google/generative-ai`, model `gemini-2.5-flash-lite` |
| Canvas extras | `react-big-calendar` + `moment`, `html2canvas`, `uuid` |
| Serverless | Cloudflare Pages Functions, Resend for email, FCM HTTP v1 for push |
| Desktop shell | Electron 39 main process in `electron/main.cjs` (see limitations) |

## Getting started

Requires Node.js 20 or newer (`engines.node: ">=20"`).

```bash
git clone https://github.com/AriesHongHuanWu/IdeaBomb.git
cd IdeaBomb
npm install

cp .env.example .env      # then fill in the keys below
npm run dev               # http://localhost:5173
```

`.env.example` only lists the AI key, but `src/firebase.js` also reads the Firebase config from the environment, so a working local build needs:

```
VITE_GEMINI_API_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
```

Other scripts: `npm run build` (outputs `dist/`), `npm run preview`, `npm run lint`.

Deploying: `dist/` is a static bundle, and `functions/` is picked up automatically by Cloudflare Pages. Publish `firestore.rules` before letting anyone else onto a board, otherwise sharing has no server-side enforcement. `DEPLOYMENT.md` and `SELF_HOSTING.md` contain the original step-by-step notes, partly in Traditional Chinese.

## Status and limitations

Personal project, built solo over about three weeks in December 2025 (318 commits). It is deployed and usable, but it is not a maintained product and has no users to speak of.

Known gaps, all verifiable in the source:

- **The Gemini key is a `VITE_` variable**, so it is embedded in the client bundle. That is acceptable for a personal deployment and not acceptable for untrusted users. The daily AI quota is likewise checked in the browser before the call, so it constrains cost rather than enforcing a limit.
- **No automated tests and no CI.** Correctness rests on manual use.
- **The `/admin` console's email allow-list is commented out** in `AdminPage.jsx`. What it can actually read is limited by `firestore.rules`, not by the UI.
- **The Electron shell is not wired up.** `electron/main.cjs` exists and `electron` / `electron-builder` are in `devDependencies`, but `package.json` has no electron script, no `main` field and no builder config, so there is no working desktop build.
- **Hard limit of 200 nodes per board**, enforced client-side in `addNode`.
- Presence is swept on an interval rather than on disconnect, so a collaborator can linger briefly after closing the tab.
- The UI ships English and Traditional Chinese from `src/utils/constants.js`; any key missing from that dictionary renders as the key itself.
- Real-time editing has no conflict resolution beyond Firestore's last-write-wins. Two people editing the same node's text at the same moment will clobber each other.

## License

MIT. See [LICENSE](LICENSE).
