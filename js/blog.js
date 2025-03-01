// blog.js
// blog page script

import preview_mode from './config/config.js';
import matter from "https://cdn.skypack.dev/gray-matter?min";

const baseUrl = preview_mode
    ? 'blog_posts/'
    : 'https://raw.githubusercontent.com/mayumon/nekorosis/main/blog_posts/';

const postList = document.getElementById("post-list");
const postContent = document.getElementById("post-content");

function loadPost(post){
    fetch(`${baseUrl}${post}`)
        .then(response => response.text())
        .then(markdown => {
            const parsed = matter(markdown);
            postContent.innerHTML = marked.parse(parsed.content);
        })
        .catch(error => console.error("failed to load post:", error));
}


// fetch and display posts
fetch(`${baseUrl}posts.json`)
    .then(response => response.json())
    .then(data => {
        data.posts.forEach(post => {
            const li = document.createElement("li");
            const link = document.createElement("a");

            // format post-specific url
            const postHash = post.filename
                .replace(".md", "");
            link.href = "#" + postHash;

            // format post title (currently filename)
            link.textContent = post.title ||
                post.filename.replace(".md", "").replace(/_/g, " ");

            link.onclick = () => loadPost(post.filename)

            li.appendChild(link);
            postList.appendChild(li);
        });
    })
    .catch(error => console.error("failed to fetch posts:", error));


// check for url post and fetch if needed
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const postFile = hash + '.md';
        loadPost(postFile);
    }
})