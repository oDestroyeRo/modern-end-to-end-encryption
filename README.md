# MLS, explained

A 13-slide interactive web presentation about **Messaging Layer Security (MLS)**, designed for a developer-friendly talk of about 15 minutes.

## Open the presentation

Open **`index.html` directly in a browser**. It contains all styles, scripts, and SVG diagrams, and works offline without installing dependencies. Links to the reference documentation require internet access.

For a local server with Node.js 20 or later:

```sh
npm run dev
```

Open the printed address, normally `http://localhost:5173`. Set `PORT` to use another port. Reload the browser after editing the HTML.

## The story

1. **Why E2EE:** who holds the keys, and how TLS and E2EE protect different boundaries.
2. **History:** selected milestones from PGP and OTR to ratchets, the MLS protocol, and its architecture.
3. **How MLS works:** group update costs, KeyPackages, TreeKEM, epochs, message keys, and forward secrecy and recovery.
4. **How to use MLS:** an invitation-to-message walkthrough, OpenMLS Rust API excerpts, application responsibilities, and a three-question quiz.

The demonstrations include an encryption-boundary switch, clickable history, a group-size slider, an explorable ratchet tree, and an epoch lab with add/remove/update operations and offline catch-up.

## Presenting

| Control | Action |
| --- | --- |
| Right arrow, Space, Page Down | Next slide |
| Left arrow, Page Up | Previous slide |
| Home / End | First / last slide |
| O | Slide overview |
| N | Speaker notes for the current slide |
| R | References |
| F | Enter or exit fullscreen, when the browser permits it |
| ? | Keyboard help |
| Escape | Close a dialog |

Chapter buttons and progress markers also navigate. Tab groups support arrow keys, while sliders retain their native keyboard behavior. Fullscreen automatically fits the current slide and controls to the screen. On phones, the content stacks and scrolls vertically.

Use a URL ending in `#slide=7`, for example, to open the epoch lab. Exercise state lasts within the current tab and resets on reload. The presentation has no analytics, remote assets, or external runtime dependencies.

## Technical scope and sources

The diagrams and group lab are **conceptual simulations**, not a cryptographic implementation. The scaling chart illustrates envelopes in a full, balanced binary tree, not a benchmark or a guaranteed size for every Commit. The OpenMLS code is an API map with setup and application code omitted; it has not been compiled as a Rust program.

Sources are linked on slides and in the references dialog:

- [RFC 9420: The MLS Protocol](https://www.rfc-editor.org/rfc/rfc9420.html), July 2023.
- [RFC 9750: The MLS Architecture](https://www.rfc-editor.org/rfc/rfc9750.html), April 2025.
- [The OpenMLS Book](https://book.openmls.tech/), including the linked operation guides. API excerpts checked in November 2026.
- [Philip Zimmermann’s account of PGP](https://philzimmermann.com/EN/essays/WhyIWrotePGP.html).
- [The OTR project and its 2004 paper](https://otr.cypherpunks.ca/index.php).
- [Signal’s Double Ratchet specification](https://signal.org/docs/specifications/doubleratchet/).
- [The IETF’s MLS publication announcement](https://www.ietf.org/blog/mls-protocol-published/).

## Build and verify

```sh
npm ci
npx playwright install chromium
npm test
npm run build
```

If Google Chrome is already installed, use `PLAYWRIGHT_CHANNEL=chrome npm test` instead of installing Playwright’s Chromium. The browser checks cover navigation and history, the demonstrations, the membership and offline state transitions, quiz feedback, dialogs, fullscreen fitting, offline file use, and horizontal overflow at 1440, 768, and 390 pixels. Automated axe checks scan all 13 initial slide states for WCAG A/AA violations. They do not establish full accessibility conformance.

The build copies the standalone presentation to **`dist/index.html`** for delivery to any static host. It performs no deployment.

## GitHub Pages

The live presentation is published at:

**https://odestroyero.github.io/modern-end-to-end-encryption/**

Pages publishes the repository root from `feat/interactive-mls-presentation`. The `.nojekyll` file makes GitHub serve the standalone HTML directly. Pushes to this branch update the site automatically. If you change the publishing branch later, update the repository’s **Settings → Pages → Build and deployment** source to match.
