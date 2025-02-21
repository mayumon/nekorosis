// todo: add posts fetching
const posts = ["example_post.md", "i_love_pngs.md"];

const postList = document.getElementById("post-list");
const postContent = document.getElementById("post-content");

function loadPost(post){
    fetch(`blog_posts/${post}`)
        .then(response => response.text())
        .then(markdown => {postContent.innerHTML = marked.parse(markdown)})
        .catch(error => console.error("failed to load post:", error));
}

// display posts
posts.forEach(post => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#";

    // format post title (currently filename)
    link.textContent = post.replace(".md", "")
        .replace(/_/g, " ");

    link.onclick = () => loadPost(post)

    li.appendChild(link);
    postList.appendChild(li);
})