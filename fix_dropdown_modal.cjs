const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src/pages/admin'),
  path.join(__dirname, 'src/components/admin')
];

function processFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processFiles(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let original = fs.readFileSync(fullPath, 'utf8');
            let content = original;
            
            // Replace undefined bg-background-primary with correct theme token
            content = content.replace(/bg-background-primary/g, 'bg-surface');

            // Replace missing focus colors
            content = content.replace(/bg-background-secondary/g, 'bg-surface-2');

            // Fix native HTML dropdown styling using 'dark:[color-scheme:dark]' for the app
            // However, a simpler way is ensuring options don't have bugged styles

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${file}`);
            }
        }
    }
}

dirs.forEach(processFiles);

// Also add color-scheme to index.css
const cssPath = path.join(__dirname, 'src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('color-scheme: dark;')) {
    // Inject it into dark theme block
    css = css.replace('.dark, :root:not(.light) {', '.dark, :root:not(.light) {\n  color-scheme: dark;');
    css = css.replace('.light {', '.light {\n  color-scheme: light;');
    fs.writeFileSync(cssPath, css);
    console.log('Updated index.css');
}
