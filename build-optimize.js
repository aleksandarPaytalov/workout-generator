/**
 * Build Script - Minify CSS and JavaScript
 * Creates optimized versions of all CSS and JS files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting optimization build...\n');

// Directories
const cssDir = 'css';
const jsDir = 'js';
const distCssDir = 'dist/css';
const distJsDir = 'dist/js';

// Create dist directories
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}
if (!fs.existsSync(distCssDir)) {
  fs.mkdirSync(distCssDir, { recursive: true });
}
if (!fs.existsSync(distJsDir)) {
  fs.mkdirSync(distJsDir, { recursive: true });
}

// Function to get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Minify CSS files
console.log('📦 Minifying CSS files...');
const cssFiles = getAllFiles(cssDir).filter(f => f.endsWith('.css'));
let cssCount = 0;
let cssSaved = 0;

cssFiles.forEach(file => {
  const relativePath = path.relative(cssDir, file);
  const outputPath = path.join(distCssDir, relativePath);
  const outputDir = path.dirname(outputPath);

  // Create subdirectories if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const originalSize = fs.statSync(file).size;
    execSync(`npx cleancss -o "${outputPath}" "${file}"`, { stdio: 'pipe' });
    const minifiedSize = fs.statSync(outputPath).size;
    const saved = originalSize - minifiedSize;
    cssSaved += saved;
    cssCount++;
    console.log(`  ✅ ${file} → ${outputPath} (saved ${(saved / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error(`  ❌ Error minifying ${file}:`, error.message);
  }
});

console.log(`\n✅ Minified ${cssCount} CSS files, saved ${(cssSaved / 1024).toFixed(2)} KB\n`);

// Minify JavaScript files
console.log('📦 Minifying JavaScript files...');
const jsFiles = getAllFiles(jsDir).filter(f => f.endsWith('.js'));
let jsCount = 0;
let jsSaved = 0;

jsFiles.forEach(file => {
  const relativePath = path.relative(jsDir, file);
  const outputPath = path.join(distJsDir, relativePath);
  const outputDir = path.dirname(outputPath);

  // Create subdirectories if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const originalSize = fs.statSync(file).size;
    execSync(`npx terser "${file}" -o "${outputPath}" --compress --mangle`, { stdio: 'pipe' });
    const minifiedSize = fs.statSync(outputPath).size;
    const saved = originalSize - minifiedSize;
    jsSaved += saved;
    jsCount++;
    console.log(`  ✅ ${file} → ${outputPath} (saved ${(saved / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error(`  ❌ Error minifying ${file}:`, error.message);
  }
});

console.log(`\n✅ Minified ${jsCount} JS files, saved ${(jsSaved / 1024).toFixed(2)} KB\n`);

// Copy other necessary files
console.log('📋 Copying other files...');

// Copy index.html
fs.copyFileSync('index.html', 'dist/index.html');
console.log('  ✅ Copied index.html');

// Copy manifest.json
fs.copyFileSync('manifest.json', 'dist/manifest.json');
console.log('  ✅ Copied manifest.json');

// Copy service-worker.js (minify it too)
try {
  execSync('npx terser "service-worker.js" -o "dist/service-worker.js" --compress --mangle', { stdio: 'pipe' });
  console.log('  ✅ Minified and copied service-worker.js');
} catch (error) {
  console.error('  ❌ Error minifying service-worker.js:', error.message);
}

// Copy offline.html
fs.copyFileSync('offline.html', 'dist/offline.html');
console.log('  ✅ Copied offline.html');

// Copy assets directory
if (fs.existsSync('assets')) {
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  copyDir('assets', 'dist/assets');
  console.log('  ✅ Copied assets directory');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('🎉 Optimization Complete!');
console.log('='.repeat(60));
console.log(`📦 Total CSS saved: ${(cssSaved / 1024).toFixed(2)} KB`);
console.log(`📦 Total JS saved: ${(jsSaved / 1024).toFixed(2)} KB`);
console.log(`📦 Total saved: ${((cssSaved + jsSaved) / 1024).toFixed(2)} KB`);
console.log('='.repeat(60));
console.log('\n✅ Optimized files are in the "dist" directory');
console.log('💡 To test: cd dist && python -m http.server 8080\n');

