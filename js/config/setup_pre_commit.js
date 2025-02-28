// setup_pre_commit.js
// runs generate_posts.js script
// rewrites config.js

// run generate_posts.js script
const { execSync } = require('child_process');
const path = require('path');

const generatePostsPath = path.join(__dirname, 'generate_posts.js');

try {
    console.log("Running generate_posts.js...");
    execSync(`node ${generatePostsPath}`, { stdio: 'inherit' });
} catch (err) {
    console.error("generate_posts.js failed, aborting commit.");
    process.exit(1);
}

// rewrite config.js
const fs = require('fs');
const path2 = require('path');
const configPath = path2.join(__dirname, 'config.js');
const configContent = `// config.js
// current setting: deployment

const preview_mode = false;
export default preview_mode;
`;

try {
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('preview_mode set to false in config.js');
}
catch (err) {
    console.error('error writing config.js:', err);
    process.exit(1);
}