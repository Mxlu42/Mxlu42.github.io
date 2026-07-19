// ============================================================
//  Portfolio behavior: the Reversi board + project cards + reveals
// ============================================================

// ---- Project data (edit this list to add / remove projects) ----
const projects = [
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

// ---- Build the Reversi board (decorative signature element) ----
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function buildBoard() {
    const board = document.getElementById("board");
    if (!board) return;

    const cells = [];
    for (let i = 0; i < 64; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        const disc = document.createElement("div");
        disc.className = "disc";
        disc.innerHTML = '<div class="face black"></div><div class="face white"></div>';
        cell.appendChild(disc);
        board.appendChild(cell);
        cells.push({ cell, disc });

        // Click to cycle: empty -> black -> white -> empty
        cell.addEventListener("click", () => {
            if (!disc.classList.contains("on")) disc.classList.add("on");
            else if (!disc.classList.contains("white")) disc.classList.add("white");
            else disc.classList.remove("on", "white");
        });
    }

    // Standard Reversi opening: d4/e5 white, d5/e4 black (0-indexed row*8+col)
    const opening = [
        { idx: 27, white: true },  // d4
        { idx: 28, white: false }, // e4
        { idx: 35, white: false }, // d5
        { idx: 36, white: true },  // e5
    ];
    const place = (o, delay) => {
        setTimeout(() => {
            cells[o.idx].disc.classList.add("on");
            if (o.white) cells[o.idx].disc.classList.add("white");
        }, delay);
    };
    opening.forEach((o, i) => place(o, REDUCED ? 0 : 450 + i * 220));
}

// ---- Render project cards ----
function renderProjects() {
    const grid = document.getElementById("project-grid");
    if (!grid) return;
    grid.innerHTML = projects
        .map(
            (p) => `
        <article class="project-card reveal">
            <span class="card-disc" aria-hidden="true"></span>
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
            <div class="card-tags">${p.tags.map((t) => `<span class="card-tag">${t}</span>`).join("")}</div>
            <a class="card-link" href="${p.url}" target="_blank" rel="noopener">view on github &#8599;</a>
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
