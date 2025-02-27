// todo: automate json generation?
// todo: add date to posts? on json
// todo: add date filter (newest first)
// todo: search?


const postList = document.getElementById("post-list");
const postContent = document.getElementById("post-content");

const baseUrl = 'https://raw.githubusercontent.com/mayumon/nekorosis/main/blog_posts/';


function loadPost(post){
    fetch(`${baseUrl}${post}`)
        .then(response => response.text())
        .then(markdown => {postContent.innerHTML = marked.parse(markdown)})
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
            const postHash = post
                .replace(".md", "");
            link.href = "#" + postHash;

            // format post title (currently filename)
            link.textContent = post.replace(".md", "")
                .replace(/_/g, " ");

            link.onclick = () => loadPost(post)

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