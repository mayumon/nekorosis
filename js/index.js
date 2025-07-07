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