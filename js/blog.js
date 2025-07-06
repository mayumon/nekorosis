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

    const header = document.getElementById('post-header');
    header.textContent = "";

    postContent.innerHTML = "";

    fetch(`${baseUrl}${post}`)
        .then(response => response.text())
        .then(markdown => {
            const parsed = matter(markdown);
            postContent.innerHTML = marked.parse(parsed.content);

            // set header title
            const header = document.getElementById('post-header');
            header.textContent = '▶ ' + parsed.data.title
                || '▶ ' + post.replace('.md','').replace(/_/g,' ');
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

        // create date
        if (post.date) {
            const dateObj = new Date(post.date);
            const dd = String(dateObj.getUTCDate()).padStart(2, '0');
            const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const yyyy = dateObj.getUTCFullYear();
            const dateDiv = document.createElement("div");
            dateDiv.classList.add("post-date");
            dateDiv.textContent = `${dd}-${mm}-${yyyy}`;
            li.appendChild(dateDiv);
        }

        postList.appendChild(li);
    })
}

// toggle grid vs detail view

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
        // post is selected --> detail mode
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
            img.style.transform = `rotate(${randomAngle}deg) scale(1)`; // scale adjust
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

        // create icon-row and label-row
        const iconRow  = document.createElement("div");
        iconRow.classList.add("icon-row");
        const labelRow = document.createElement("div");
        labelRow.classList.add("label-row");

        // helper: build one icon and one label, wiring them together
        function makeTagElements(tagName, count){
            // icon
            const img = document.createElement("img");
            img.dataset.tag = tagName;
            img.dataset.default = `assets/icons-tag/${tagName}.ico`;
            img.dataset.selected = `assets/icons-tag/selected.ico`;
            img.src = img.dataset.default;
            img.alt = tagName;
            img.classList.add("tag-icon");

            // label
            const span = document.createElement("span");
            span.textContent = `${tagName} (${count})`;
            span.dataset.tag = tagName;
            span.classList.add("tag-label");

            // click both the same way
            [img, span].forEach(el => {
                el.addEventListener("click", () => {
                    // 1) remove “active” from everything
                    iconRow.querySelectorAll(".tag-icon").forEach(i => {
                        i.classList.remove("active");
                        i.src = i.dataset.default;
                    });
                    labelRow.querySelectorAll(".tag-label").forEach(l => {
                        l.classList.remove("active");
                    });

                    // add active to clicked
                    const icon = iconRow.querySelector(`img[data-tag="${tagName}"]`);
                    const label = labelRow.querySelector(`span[data-tag="${tagName}"]`);
                    icon.classList.add("active");
                    label.classList.add("active");

                    // swap image
                    icon.src = icon.dataset.selected;

                    // filter
                    renderPostList(posts, tagName);
                    updateLayout();
                });
            });

            return { img, span };
        }

        // create all option
        const all = makeTagElements("all", posts.length);
        iconRow.appendChild(all.img);
        labelRow.appendChild(all.span);

        // create tags options
        sortedTags.forEach(tag => {
            const { img, span } = makeTagElements(tag, tagCounts[tag]);
            iconRow.appendChild(img);
            labelRow.appendChild(span);
        });

        tagFilterDiv.appendChild(iconRow);
        tagFilterDiv.appendChild(labelRow);
        tagFilterParent.replaceChild(tagFilterDiv, tagFilterContainer);
        tagFilterContainer = tagFilterDiv;

        // default to all
        all.img.classList.add("active");
        all.img.src = all.img.dataset.selected;
        all.span.classList.add("active");
        renderPostList(posts, "all");
        updateLayout();

        document.querySelectorAll('.tag-icon').forEach(img => {
            img.setAttribute('draggable', 'false');
            img.addEventListener('dragstart', e => e.preventDefault());
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
    updateLayout();
})

returnBtn.addEventListener("click", () => {
    window.location.hash = "";
});













