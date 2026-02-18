
import fs from 'fs';
import path from 'path';

const dirs = ['components', 'hooks', 'lib'];
const rootDir = process.cwd();

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = [...results, ...walk(fullPath)];
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

let files = [];
dirs.forEach(d => {
    const fullPath = path.join(rootDir, d);
    files = [...files, ...walk(fullPath)];
});

let changedCount = 0;
let fileCount = 0;

console.log(`Scanning ${files.length} files for incorrect imports...`);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Pattern: from "pkg@1.2.3" or from 'pkg@1.2.3'
    // Matches: from ' or " + package name + @ + version + ' or "
    // Note: Version is specifically digits.digits.digits
    const regex = /(from\s+['"])([^'"]+)(@\d+\.\d+\.\d+)(['"])/g;

    content = content.replace(regex, (match, prefix, pkg, version, suffix) => {
        console.log(`Fixing import: ${pkg}${version} -> ${pkg} in ${path.basename(file)}`);
        return `${prefix}${pkg}${suffix}`;
    });

    // Also fix simple imports: import "pkg@1.2.3"
    const simpleImportRegex = /(import\s+['"])([^'"]+)(@\d+\.\d+\.\d+)(['"])/g;
    content = content.replace(simpleImportRegex, (match, prefix, pkg, version, suffix) => {
        console.log(`Fixing import: ${pkg}${version} -> ${pkg} in ${path.basename(file)}`);
        return `${prefix}${pkg}${suffix}`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
    }
    fileCount++;
});

console.log(`Finished processing ${fileCount} files. Fixed imports in ${changedCount} files.`);
