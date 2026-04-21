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
            
            // Reduce Radius Sizes
            content = content.replace(/rounded-\[3rem\]/g, 'rounded-2xl');
            content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-xl');
            content = content.replace(/rounded-\[2rem\]/g, 'rounded-xl');
            content = content.replace(/rounded-3xl/g, 'rounded-xl');
            content = content.replace(/rounded-2xl/g, 'rounded-lg');
            content = content.replace(/rounded-xl/g, 'rounded-md');

            // Fix table wraps (Admin table cells)
            content = content.replace(/<td([^>]*)whitespace-nowrap([^>]*)>/g, '<td$1whitespace-normal min-w-[200px]$2>');
            content = content.replace(/<td([^>]*)truncate([^>]*)>/g, '<td$1line-clamp-2 min-w-[200px]$2>');
            
            // Specific string replacements for AdminPeople
            if (file === 'AdminPeople.jsx') {
                content = content.replace(/Dossier/g, 'Profile');
                content = content.replace(/Intelligence Profile/g, 'Profile');
                content = content.replace(/Register New Asset/g, 'Add Person');
                content = content.replace(/Establish a new identity in the global talent directory\./g, 'Add a new person to the directory.');
                content = content.replace(/Abort Changes/g, 'Cancel');
                content = content.replace(/Regenerate\\s+Popularity/g, 'Update Popularity');
            }

            // Drawer backdrop opacity (darker and blurred)
            if (file === 'Drawer.jsx') {
                content = content.replace(/bg-black\/60/g, 'bg-black/85 backdrop-blur-md');
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${file}`);
            }
        }
    }
}

dirs.forEach(processFiles);
