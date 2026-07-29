# Noah Lisewski — Portfolio

Personal portfolio site showcasing my projects, background, and resume. Live at **[mxlu42.github.io](https://mxlu42.github.io)**.

## Overview

A single-page portfolio built with plain HTML, CSS, and JavaScript — no framework or build step. The hero section features a fully playable Reversi (Othello) board driven by a JavaScript engine ported 1:1 from my original Python implementation ([Mxlu42/Reversi](https://github.com/Mxlu42/Reversi)), with move validation, disc-flipping, and turn logic mirrored method-for-method between the two codebases.

A companion page, [`process.html`](https://mxlu42.github.io/process.html), documents the workflow used to build the site.

## Tech Stack

- **HTML5 / CSS3** — semantic markup, custom design system (no CSS framework)
- **Vanilla JavaScript** — DOM rendering, game state, and UI interactions
- **GitHub Pages** — static hosting and deployment

## Project Structure

```
.
├── index.html           # Main portfolio page (about, work, roadmap, resume, contact)
├── process.html         # Case study: how the site was built
├── script.js            # Site interactions (nav, project grid, animations)
├── reversi-engine.js     # Reversi/Othello game engine (ported from Python)
├── style.css            # Design system and layout
└── resume_wp.pdf        # Downloadable resume
```

## Running Locally

No build step or dependencies required. Clone the repo and serve the directory with any static file server:

```bash
git clone https://github.com/Mxlu42/Mxlu42.github.io.git
cd Mxlu42.github.io
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Deployment

The site deploys automatically via **GitHub Pages** from the `main` branch.

## Contact

- **Email:** [noahlisewski@gmail.com](mailto:noahlisewski@gmail.com)
- **GitHub:** [@Mxlu42](https://github.com/Mxlu42)
