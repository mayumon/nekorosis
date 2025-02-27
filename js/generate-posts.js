// automated posts.json generation
// run: node generate-posts.js

const fs = require('fs')
const path = require('path')
const postsDir = path.join(__dirname, "../blog_posts");

fs.readdir(postsDir, (err,files) => {

    if(err) {
        console.error("error reading blog_posts folder:", err);
        return;
    }

    const posts = files.filter(file => file.endsWith(".md"));

    const jsonData = { posts };

    const jsonFilePath = path.join(postsDir, "posts.json");

    fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (err) => {

        if (err) {
            console.error("error writing posts.json:", err);
        }

        else {
            console.log("posts.json generated successfully")
        }

    });
});