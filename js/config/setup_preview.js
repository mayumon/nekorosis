// setup_preview.js
// runs generate_posts.js script
// rewrites config.js

// rewrite config.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, 'config.js');
const configContent =
    `// config.js
// current setting: local
    
const preview_mode = true;
export default preview_mode;
`;

try {
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('preview_mode set to true in config.js');
} catch (err) {
    console.error('error writing config.js:', err);
    process.exit(1);
}

// run generate_posts.js script
try {
    console.log('running generate_posts.js...');
    execSync('node generate_posts.js', { stdio: 'inherit' });
} catch (err) {
    console.error('generate_posts.js failed, aborting preview setup.');
    process.exit(1);
}
