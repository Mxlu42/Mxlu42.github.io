// ============================================================
//  Portfolio behavior: the Reversi board + project cards + reveals
// ============================================================

// ---- Project data (edit this list to add / remove projects) ----
const projects = [
    {
        title: "Fitness Dashboard",
        desc: "What I'm building now: a React frontend talking to a REST API, a Raspberry Pi, and hardware I'm wiring myself — a system that watches, measures, and responds to something real, designed to absorb everything I learn next.",
        tags: ["react", "rest api", "raspberry pi"],
        status: "in progress",
    },
    {
        title: "Robo-arm",
        desc: "A robotic arm project built at Technische Hochschule Mannheim — controlling motors and mechanics in C++, my first real step into hardware beyond a screen.",
        tags: ["c++", "robotics", "school"],
        url: "https://github.com/Mxlu42/Robo-arm",
    },
    {
        title: "Reversi",
        desc: "A playable Reversi / Othello engine in Python — board state, legal-move detection, disc flipping, and turn handling. The project this whole site is themed after.",
        tags: ["python", "game-logic"],
        url: "https://github.com/Mxlu42/Reversi",
    },
    {
        title: "Seminar",
        desc: "A seminar project built for CBS school in HTML — my first real structured web build, and where the layout bug started making sense.",
        tags: ["html", "school"],
        url: "https://github.com/Mxlu42/Seminar",
    },
    {
        title: "Github-Tutorial",
        desc: "A Python walk-through of Git and GitHub workflows — commits, branches, and not being afraid of version control.",
        tags: ["python", "git"],
        url: "https://github.com/Mxlu42/Github-Tutorial",
    },
];

// ---- Roadmap: future goals as "moves" (edit this list freely) ----
// status: "now" (in progress) · "next" · "later"  — controls the disc + chip
const roadmap = [
    {
        title: "Ship more AI features",
        status: "now",
        desc: "Go past calling an API — build real AI-powered features into my projects and understand what's under the hood.",
        label: "ai engineer roadmap",
        url: "https://roadmap.sh/ai-engineer",
    },
    {
        title: "Host my own server",
        status: "next",
        desc: "Stand up a home server I actually run — Linux, networking, deploys — instead of leaning on someone else's cloud.",
        label: "devops roadmap",
        url: "https://roadmap.sh/devops",
    },
    {
        title: "Learn Arduino & electronics",
        status: "later",
        desc: "Get hands-on with hardware: microcontrollers, sensors, and small builds that live off the screen.",
        label: "arduino docs",
        url: "https://docs.arduino.cc/learn/",
    },
];

function renderRoadmap() {
    const track = document.getElementById("roadmap-track");
    if (!track) return;
    const discClass = (s) => (s === "now" ? "now" : s === "done" ? "done" : "");
    track.innerHTML = roadmap
        .map(
            (r) => `
        <li class="rm-item reveal">
            <span class="node-disc ${discClass(r.status)}" aria-hidden="true"></span>
            <div class="rm-head">
                <h3>${r.title}</h3>
                <span class="rm-status ${r.status === "now" ? "now" : ""}">${r.status}</span>
            </div>
            <p>${r.desc}</p>
            <a class="rm-link" href="${r.url}" target="_blank" rel="noopener">${r.label} &#8599;</a>
        </li>`
        )
        .join("");
}

// ============================================================
//  Reversi UI — thin glue around the ported engine.
//  The rules live in reversi-engine.js (a faithful 1:1 port of the
//  Python engine at github.com/Mxlu42/Reversi). This file just draws
//  the board, handles clicks, and mirrors the Python play() loop's
//  turn/pass handling for a click-driven, 2-player hotseat game.
// ============================================================
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let game = null;          // active Reversi instance (from the engine)
let cells = [];           // { cell, disc } refs, index 0..63 (row-major)
let passedSide = null;    // 'B' | 'W' if a player was just skipped

const sideName = (p) => (p === "B" ? "Black" : "White");

function buildBoard() {
    const board = document.getElementById("board");
    if (!board || typeof Reversi === "undefined") return;

    cells = [];
    for (let i = 0; i < 64; i++) {
        const row = Math.floor(i / 8) + 1;
        const col = (i % 8) + 1;
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.type = "button";
        cell.setAttribute("aria-label", `Row ${row}, column ${col}`);
        const disc = document.createElement("div");
        disc.className = "disc";
        disc.innerHTML = '<div class="face black"></div><div class="face white"></div>';
        cell.appendChild(disc);
        board.appendChild(cell);
        cells.push({ cell, disc });
        cell.addEventListener("click", () => playAt(row, col));
    }

    newGame();

    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) resetBtn.addEventListener("click", newGame);
}

function newGame() {
    game = new Reversi();     // engine sets the standard opening + Black to move
    passedSide = null;
    renderBoard();
}

function playAt(row, col) {
    if (!game || game.game_over) return;
    if (!game.is_valid_move(row, col)) return;   // engine decides legality

    passedSide = null;
    game.make_move(row, col);
    game.switch_player();                         // play() switches after a move

    // Mirror play()/check_game_over: end, or auto-skip a player with no moves.
    if (game.check_game_over()) {
        game.game_over = true;
    } else if (game.get_valid_moves().length === 0) {
        passedSide = game.current_player;         // this side gets skipped
        game.switch_player();
    }

    renderBoard();
}

// Row-major set of "row,col" strings the current player may legally play.
function legalSet() {
    if (!game || game.game_over) return new Set();
    return new Set(game.get_valid_moves().map(([r, c]) => `${r},${c}`));
}

function counts() {
    let black = 0, white = 0;
    for (const row of game.board.playboard) {
        for (const cell of row) {
            if (cell === "B") black++;
            else if (cell === "W") white++;
        }
    }
    return { black, white };
}

function renderBoard() {
    const legal = legalSet();
    cells.forEach(({ cell, disc }, i) => {
        const row = Math.floor(i / 8) + 1;
        const col = (i % 8) + 1;
        const v = game.board.playboard[row - 1][col - 1]; // null | 'B' | 'W'
        disc.classList.toggle("on", v !== null);
        disc.classList.toggle("white", v === "W");
        const canPlay = legal.has(`${row},${col}`);
        cell.classList.toggle("playable", canPlay);
        cell.disabled = game.game_over || !canPlay;
    });
    renderStatus(legal.size);
}

function renderStatus(legalCount) {
    const { black, white } = counts();
    const bEl = document.getElementById("score-black");
    const wEl = document.getElementById("score-white");
    if (bEl) bEl.textContent = black;
    if (wEl) wEl.textContent = white;

    const disc = document.getElementById("turn-disc");
    const name = document.getElementById("turn-name");
    const msg = document.getElementById("game-msg");

    if (game.game_over) {
        if (name) name.textContent = "Game over";
        if (disc) disc.className = "turn-disc";
        if (msg) {
            msg.textContent =
                black === white ? "It's a tie."
                    : `${black > white ? "Black" : "White"} wins ${Math.max(black, white)}–${Math.min(black, white)}.`;
        }
        return;
    }

    const turn = game.current_player; // 'B' | 'W'
    if (name) name.textContent = `${sideName(turn)} to move`;
    if (disc) disc.className = `turn-disc ${turn === "B" ? "black" : "white"}`;
    if (msg) {
        if (passedSide) {
            msg.textContent = `${sideName(passedSide)} had no move — skipped.`;
        } else {
            msg.textContent = `${legalCount} legal move${legalCount === 1 ? "" : "s"}.`;
        }
    }
}

// ---- Render project cards ----
function renderProjects() {
    const grid = document.getElementById("project-grid");
    if (!grid) return;
    grid.innerHTML = projects
        .map(
            (p) => `
        <article class="project-card reveal${p.status ? " is-wip" : ""}">
            <span class="card-disc" aria-hidden="true"></span>
            <div class="card-head">
                <h3>${p.title}</h3>
                ${p.status ? `<span class="card-status">${p.status}</span>` : ""}
            </div>
            <p>${p.desc}</p>
            <div class="card-tags">${p.tags.map((t) => `<span class="card-tag">${t}</span>`).join("")}</div>
            ${p.url
                ? `<a class="card-link" href="${p.url}" target="_blank" rel="noopener">view on github &#8599;</a>`
                : `<span class="card-link card-link-muted">building now &mdash; repo coming soon</span>`}
        </article>`
        )
        .join("");
}

// ---- Scroll reveal ----
function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (REDUCED || !("IntersectionObserver" in window)) {
        items.forEach((el) => el.classList.add("visible"));
        return;
    }
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("visible");
                    io.unobserve(e.target);
                }
            });
        },
        { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
}

// ---- Mobile nav ----
function initNav() {
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
        const open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
            links.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        })
    );
}

document.addEventListener("DOMContentLoaded", () => {
    buildBoard();
    renderProjects();
    renderRoadmap();
    initReveal();
    initNav();
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
});
