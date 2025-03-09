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

// render post list given a filter tag
function renderPostList(posts, filterTag = "all"){
    postList.innerHTML = "";
    const filteredPosts = filterTag === "all"
        ? posts
        : posts.filter(post => Array.isArray(post.tags) && post.tags.includes(filterTag));

    filteredPosts.forEach(post => {
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
    })
}


// fetch and display posts
fetch(`${baseUrl}posts.json`)
    .then(response => response.json())
    .then(data => {
        const posts = data.posts;

        // build tag counts
        const tagCounts = {};

        posts.forEach(post =>{

            if (Array.isArray(post.tags)) {

                post.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        // sort tags by descending count, then alphabetically
        const sortedTags = Object.keys(tagCounts).sort((a,b) => {

            if (tagCounts[b] !== tagCounts[a]){
                return tagCounts[b] - tagCounts[a];

            } else {
                return a.localeCompare(b);
            }
        });

        // create tag filter container - move to html
        const tagFilterDiv = document.createElement("div");
        tagFilterDiv.id = "tag-filter";

        // create all option
        const allTag = document.createElement("span");
        allTag.classList.add("tag");
        allTag.textContent = `all (${posts.length})`;
        allTag.dataset.tag = "all";
        tagFilterDiv.appendChild(allTag);

        // create tags options
        sortedTags.forEach(tag => {
            const tagElem = document.createElement("span");
            tagElem.classList.add("tag");
            tagElem.textContent = `${tag} (${tagCounts[tag]})`;
            tagElem.dataset.tag = tag;
            tagFilterDiv.appendChild(tagElem);
        });

        const tagFilterContainer = document.getElementById("tag-filter");
        tagFilterContainer.parentNode.replaceChild(tagFilterDiv, tagFilterContainer);

        // click listeners for tags
        const tagElements = tagFilterDiv.querySelectorAll(".tag");
        tagElements.forEach(elem => {
            elem.addEventListener("click", () => {
                tagElements.forEach(el => el.classList.remove("active"));
                elem.classList.add("active")
                renderPostList(posts, elem.dataset.tag);
            });
        });

        // default to all
        allTag.classList.add("active");
        renderPostList(posts,"all");

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