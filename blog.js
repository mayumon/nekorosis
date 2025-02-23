const postList = document.getElementById("post-list");
const postContent = document.getElementById("post-content");

function loadPost(post){
    fetch(`blog_posts/${post}`)
        .then(response => response.text())
        .then(markdown => {postContent.innerHTML = marked.parse(markdown)})
        .catch(error => console.error("failed to load post:", error));
}

// fetch and display posts
fetch('blog_posts/posts.json')
    .then(response => response.json())
    .then(data => {
        data.posts.forEach(post => {
            const li = document.createElement("li");
            const link = document.createElement("a");
            link.href = "#";

            // format post title (currently filename)
            link.textContent = post.replace(".md", "")
                .replace(/_/g, " ");

            link.onclick = () => loadPost(post)

            li.appendChild(link);
            postList.appendChild(li);
        });
    })
    .catch(error => console.error("failed to fetch posts:", error));

// todo: add date filter (newest first)
// todo: search?

// ☆ todo: github api/raw post fetching?