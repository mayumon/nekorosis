// generate_posts.js
// automated posts.json generation
// run: node generate_posts.js

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter');
const postsDir = path.join(__dirname, "../../blog_posts");

fs.readdir(postsDir, (err,files) => {

    if(err) {
        console.error("error reading blog_posts folder:", err);
        return;
    }

    const posts = files.filter(file => file.endsWith(".md"))
        .map(file => {
            const filePath = path.join(postsDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const parsed = matter(fileContent);

            return {
                filename: file,
                title: parsed.data.title || file.replace(".md", ""),
                date: parsed.data.date || null
            };
        });

    // sort posts chronologically
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

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