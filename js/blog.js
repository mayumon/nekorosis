// blog.js
// blog page script

import preview_mode from './config/config.js';
import matter from "https://cdn.skypack.dev/gray-matter?min";

// ================================
// post-list
// ================================

const baseUrl = preview_mode
    ? 'blog_posts/'
    : 'https://raw.githubusercontent.com/mayumon/nekorosis/main/blog_posts/';

const postList = document.getElementById("post-list");
const postListContainer    = document.getElementById("post-list-container");
const rightColumn          = document.getElementById("right-column");
const postDisplayContainer = document.getElementById("post-display-container");
const postContent = document.getElementById("post-content");
const returnBtn = document.getElementById("return-btn");
let tagFilterContainer = document.getElementById("tag-filter");
const tagFilterParent    = tagFilterContainer.parentNode;

function loadPost(post){

    postContent.innerHTML = "";

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
        li.classList.add("post-item");
        const link = document.createElement("a");

        // format post-specific url
        const postHash = post.filename
            .replace(".md", "");
        link.href = "#" + postHash;

        link.onclick = () => {window.location.hash = postHash;};

        // show floppy disk thumbnail
        if (post.image){
            const img = document.createElement("img");
            img.src = `assets/images/posts/${post.image}`;
            img.alt = post.title || post.filename.replace(".md", "");
            img.classList.add("post-thumb");
            link.appendChild(img);
        }

        li.appendChild(link);

        // create hover title overlay
        const titleDiv = document.createElement("div");
        titleDiv.classList.add("post-title");
        titleDiv.textContent = post.title ||
            post.filename.replace(".md", "").replace(/_/g, " ");
        li.appendChild(titleDiv);

        postList.appendChild(li);
    })
}

// toggle grid vs compact view

function updateLayout() {

    // grab the current hash
    const hash = window.location.hash.slice(1);

    if (!hash) {
        // no post selected --> grid mode

        rightColumn.style.display = "none";

        if (tagFilterContainer.parentNode !== postDisplayContainer) {
            postDisplayContainer.insertBefore(
                tagFilterContainer,
                postDisplayContainer.firstChild
            );
        }

        if (postList.parentNode !== postDisplayContainer) {
            postDisplayContainer.appendChild(postList);
        }

        postList.classList.add("grid");

        postDisplayContainer.classList.remove("detail");
        returnBtn.classList.remove("visible");

        document.querySelectorAll("#post-list .post-thumb").forEach(img => {
            img.style.transform = "";
        });

    } else {
        // post is selected --> compact mode
        rightColumn.style.display = "";

        if (tagFilterContainer.parentNode !== tagFilterParent) {
            tagFilterParent.insertBefore(
                tagFilterContainer,
                tagFilterParent.firstChild
            );
        }

        if (postList.parentNode !== postListContainer) {
            postListContainer.appendChild(postList);
        }

        postList.classList.remove("grid");
        postDisplayContainer.classList.add("detail");
        returnBtn.classList.add("visible");

        document.querySelectorAll("#post-list .post-thumb").forEach(img => {

            const randomAngle = (Math.random() * 20) - 10; // angle adjust
            img.style.transform = `rotate(${randomAngle}deg) scale(0.8)`; // scale adjust
        });

        loadPost(hash + ".md");
    }
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

        tagFilterParent.replaceChild(tagFilterDiv, tagFilterContainer);
        tagFilterContainer = tagFilterDiv;

        // click listeners for tags
        const tagElements = tagFilterDiv.querySelectorAll(".tag");
        tagElements.forEach(elem => {
            elem.addEventListener("click", () => {
                tagElements.forEach(el => el.classList.remove("active"));
                elem.classList.add("active")
                renderPostList(posts, elem.dataset.tag);
                updateLayout();
            });
        });

        // default to all
        allTag.classList.add("active");
        renderPostList(posts,"all");
        updateLayout();

    })
    .catch(error => console.error("failed to fetch posts:", error));


// check for url post and fetch if needed
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const postFile = hash + '.md';
        loadPost(postFile);
    }
    updateLayout();
})

returnBtn.addEventListener("click", () => {
    window.location.hash = "";
});













