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

const NUM_LANES = 10;  // how many horizontal tracks
const LANE_HEIGHT = 100 / NUM_LANES;  // percent per lane

function launchDanmaku() {
    const container = document.querySelector("#newest-post-card .danmaku");
    if (!container) return;

    // pick a random comment
    const text = danmakuComments[
        Math.floor(Math.random() * danmakuComments.length)
        ];

    // create the span
    const span = document.createElement("span");
    span.textContent = text;

    // pick a random lane 0…NUM_LANES-1
    const lane = Math.floor(Math.random() * NUM_LANES);

    // place in the middle of that lane
    const topPercent = (lane + 0.5) * LANE_HEIGHT;
    span.style.top = topPercent + "%";

    container.appendChild(span);

    // remove span after animation finishes
    span.addEventListener("animationend", () => {
        span.remove();
    });
}

setInterval(launchDanmaku, 500);