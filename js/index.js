// index.js

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    collectionGroup,
    limit
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { db } from "./auth.js";

(async () => {
    const base = window.location.pathname.endsWith('index.html')
        ? 'blog_posts/'
        : 'https://raw.githubusercontent.com/mayumon/nekorosis/main/blog_posts/';
    try {
        const res = await fetch(base + 'posts.json');
        const { posts } = await res.json();

        // sort descending by date todo: change this one dreadful day
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        const newest = posts[0];
        if (newest) {
            const thumb = document.getElementById('newest-thumb');
            const title = document.getElementById('newest-title');
            thumb.src = `assets/images/posts/${newest.image}`;
            const postId = newest.filename.replace('.md','');
            thumb.alt = newest.title || postId;
            title.textContent = newest.title || newest.filename.replace('.md','').replace(/_/g,' ');

            initDanmakuComments(postId);

            const a = document.getElementById('newest-link');
            a.href = `blog.html#${postId}`;
        }
    } catch(e) {
        console.error('Could not load newest post:', e);
    }
})();

// ================================
// danmaku comments
// ================================

let danmakuComments = [];

function initDanmakuComments(postId) {
    const chatRef = collection(db, "posts", postId, "chat");
    const q = query(chatRef, orderBy("createdAt", "asc"));

    // real-time listener
    onSnapshot(q, snapshot => {
        // just pull out the `.message` field from each doc
        danmakuComments = snapshot.docs.map(doc => doc.data().message);
    });
}

const NUM_LANES = 10;
const laneAvailableAt = new Array(NUM_LANES).fill(0);
const TICK_MS = 300;

// how many pixels per second comments travel
const SPEED_PX_PER_SEC = 100;

function pickLane() {
    const now = performance.now();

    // find free lanes
    const freeLanes = [];
    for (let i = 0; i < NUM_LANES; i++) {
        if (laneAvailableAt[i] <= now) freeLanes.push(i);
    }

    // if none free, pick the soonest freed
    let lane;
    if (freeLanes.length > 0) {
        lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
    } else {
        lane = laneAvailableAt
            .map((t,i) => ({i,t}))
            .reduce((a,b) => a.t < b.t ? a : b).i;
    }

    return lane;
}

function launchDanmaku() {
    const container = document.querySelector("#newest-post-card .danmaku");
    if (!container || danmakuComments.length === 0) return;

    // get & clamp text
    let text = danmakuComments[
        Math.floor(Math.random() * danmakuComments.length)
        ] || "";

    if (text.length > 40) text = text.slice(0,40) + "…";

    // create comment
    const span = document.createElement("span");
    span.textContent = text;
    container.appendChild(span);

    // choose lane
    const lane = pickLane();
    span.style.top = `${(lane + 0.5) * (100 / NUM_LANES)}%`;

    // measure width & compute duration
    const width = span.getBoundingClientRect().width;
    const containerW = container.getBoundingClientRect().width;
    const distance = containerW + width;
    const duration = distance / SPEED_PX_PER_SEC;

    // schedule lane free time
    const now = performance.now();
    laneAvailableAt[lane] = now + (duration * 1000);

    // animate
    span.style.whiteSpace = "nowrap";
    span.style.position = "absolute";
    span.style.right = `-${width}px`;
    span.style.animation = `slide-left ${duration}s linear`;
    span.addEventListener("animationend", () => span.remove());
}

setInterval(launchDanmaku, TICK_MS);


// ================================
// nano * radio 365
// ================================

async function loadSongOfDay() {
    // fetch song list
    const resp = await fetch('assets/nanoradio.json');
    const songs = await resp.json();

    // get today date (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0,10);

    // find respective entry
    const entry = songs.find(s => s.date === today);
    if (!entry) return;  // todo: nothing found view

    // update DOM
    const link = document.getElementById('song-link');
    const thumb = document.getElementById('song-thumb');
    const title = document.getElementById('song-title');

    link.href = `https://www.youtube.com/watch?v=${entry.videoId}`;
    thumb.src  = `https://img.youtube.com/vi/${entry.videoId}/mqdefault.jpg`;
    thumb.alt  = entry.title;
    title.textContent = entry.title;
}

loadSongOfDay();


// ================================
// activity feed
// ================================

function timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)   return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const activityList = document.getElementById("activity-list");
const feedQuery = query(
    collectionGroup(db, "chat"),
    orderBy("createdAt", "desc"),
    limit(12)
);

onSnapshot(feedQuery, (snapshot) => {
    activityList.innerHTML = "";

    snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();


        const postId = docSnap.ref.parent.parent?.id || "unknown";
        const when = data.createdAt && data.createdAt.toDate
            ? timeAgo(data.createdAt.toDate())
            : "";

        const li = document.createElement("li");

        const name = document.createElement("strong");
        name.textContent = data.username || "anon";
        li.appendChild(name);

        li.appendChild(document.createTextNode(" sent a message in "));

        const a = document.createElement("a");

        a.href = `blog.html#${encodeURIComponent(postId)}`;
        a.textContent = postId;

        li.appendChild(a);

        if (when) {
            li.appendChild(document.createTextNode(` (${when})`));
        }

        activityList.appendChild(li);
    });
});
