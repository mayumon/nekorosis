// index.js

(async () => {
    const base = window.location.pathname.endsWith('index.html')
        ? 'blog_posts/'
        : 'https://raw.githubusercontent.com/mayumon/nekorosis/main/blog_posts/';
    try {
        const res = await fetch(base + 'posts.json');
        const { posts } = await res.json();
        // sort descending by date
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        const newest = posts[0];
        if (newest) {
            const thumb = document.getElementById('newest-thumb');
            const title = document.getElementById('newest-title');
            thumb.src = `assets/images/posts/${newest.image}`;
            thumb.alt = newest.title || newest.filename.replace('.md','');
            title.textContent = newest.title || newest.filename.replace('.md','').replace(/_/g,' ');
        }
    } catch(e) {
        console.error('Could not load newest post:', e);
    }
})();

// danmaku comments

const danmakuComments = [
    "so cool", "wowwwwww", "yea genius obviously", "awesome and cool and so awesome just wow honestly", "nice."
];

const NUM_LANES = 10;
const laneScores = new Array(NUM_LANES).fill(0);

function pickLane() {

    // decay
    for (let i = 0; i < NUM_LANES; i++) {
        laneScores[i] = Math.max(0, laneScores[i] - 1);
    }

    // array of weights
    const weights = laneScores.map(s => 1 / (s + 1));
    const total = weights.reduce((a, b) => a + b, 0);

    // pick a "random" lane proportional to weights
    let r = Math.random() * total;
    for (let i = 0; i < NUM_LANES; i++) {
        if (r < weights[i]) {

            // bump score
            laneScores[i] += 3;
            return i;
        }
        r -= weights[i];
    }

    const last = NUM_LANES - 1;
    laneScores[last]++;
    return last;
}

function launchDanmaku() {
    const container = document.querySelector("#newest-post-card .danmaku");
    if (!container) return;

    const text = danmakuComments[
        Math.floor(Math.random() * danmakuComments.length)
        ];

    const span = document.createElement("span");
    span.textContent = text;

    const lane = pickLane();
    span.style.top = `${(lane + 0.5) * (100 / NUM_LANES)}%`;

    container.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
}

setInterval(launchDanmaku, 500);