const fs = require('fs');
const path = require('path');

const jsContent = fs.readFileSync('c:/Users/DELL/Desktop/rrhh/docs-addon.js', 'utf8');
const injectionPrefix = '<!-- INJECTED DOCS ADDON START -->';
const injectionSuffix = '<!-- INJECTED DOCS ADDON END -->';
const scriptTag = `${injectionPrefix}\n<script>\n${jsContent}\n</script>\n${injectionSuffix}`;

function processDocs(docsDir) {
    if (!fs.existsSync(docsDir)) return;
    const files = fs.readdirSync(docsDir);
    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(docsDir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            // Replace existing injection or append new one
            if (content.includes(injectionPrefix)) {
                const regex = new RegExp(`${injectionPrefix}[\\s\\S]*?${injectionSuffix}`, 'g');
                content = content.replace(regex, scriptTag);
            } else {
                content = content.replace('</body>', `${scriptTag}\n</body>`);
            }

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Processed with enhanced addon: ${filePath}`);
        }
    });
}

const target = process.argv[2];
if (target === 'frontend') {
    processDocs('c:/Users/DELL/Desktop/rrhh/docs/frontend');
} else if (target === 'backend') {
    processDocs('c:/Users/DELL/Desktop/rrhh/docs/backend');
} else {
    processDocs('c:/Users/DELL/Desktop/rrhh/docs/frontend');
    processDocs('c:/Users/DELL/Desktop/rrhh/docs/backend');
}
