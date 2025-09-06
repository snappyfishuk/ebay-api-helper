// checkFiles.js - Run this with: node checkFiles.js
const fs = require("fs");
const path = require("path");

// Configuration
const PROJECT_DIR = "./src"; // Change this to your source directory
const IGNORE_DIRS = ["node_modules", ".git", "build", "dist", ".next"];

const fileStats = {
  ".js": [],
  ".jsx": [],
  ".ts": [],
  ".tsx": [],
  ".css": [],
  other: [],
};

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip ignored directories
      if (!IGNORE_DIRS.includes(file)) {
        scanDirectory(fullPath);
      }
    } else {
      const ext = path.extname(file);
      const relPath = path.relative(PROJECT_DIR, fullPath);

      if (fileStats.hasOwnProperty(ext)) {
        fileStats[ext].push(relPath);
      } else if (ext === ".json" || ext === ".md" || ext === ".txt") {
        // Skip these
      } else if (ext) {
        fileStats.other.push(relPath);
      }
    }
  });
}

// Run the scan
console.log("🔍 Scanning project files...\n");
scanDirectory(PROJECT_DIR);

// Report results
console.log("📊 File Extension Report:");
console.log("========================\n");

console.log(`📘 JavaScript Files (.js): ${fileStats[".js"].length}`);
if (fileStats[".js"].length > 0 && fileStats[".js"].length <= 20) {
  fileStats[".js"].forEach((f) => console.log(`   - ${f}`));
}

console.log(`\n📗 JSX Files (.jsx): ${fileStats[".jsx"].length}`);
if (fileStats[".jsx"].length > 0 && fileStats[".jsx"].length <= 20) {
  fileStats[".jsx"].forEach((f) => console.log(`   - ${f}`));
}

console.log(`\n📙 TypeScript Files (.ts): ${fileStats[".ts"].length}`);
if (fileStats[".ts"].length > 0 && fileStats[".ts"].length <= 20) {
  fileStats[".ts"].forEach((f) => console.log(`   - ${f}`));
}

console.log(`\n📕 TSX Files (.tsx): ${fileStats[".tsx"].length}`);
if (fileStats[".tsx"].length > 0 && fileStats[".tsx"].length <= 20) {
  fileStats[".tsx"].forEach((f) => console.log(`   - ${f}`));
}

// Check for potential issues
console.log("\n⚠️  Potential Issues:");
console.log("====================\n");

// Check if .js files have JSX content (should be .jsx or .tsx)
const jsFilesWithReact = fileStats[".js"].filter((file) => {
  try {
    const content = fs.readFileSync(path.join(PROJECT_DIR, file), "utf-8");
    return (
      content.includes("import React") ||
      content.includes('from "react"') ||
      content.includes("from 'react'")
    );
  } catch (e) {
    return false;
  }
});

if (jsFilesWithReact.length > 0) {
  console.log(
    "🔸 These .js files import React (might need to be .jsx or .tsx):"
  );
  jsFilesWithReact.forEach((f) => console.log(`   - ${f}`));
}

// Check for TypeScript files that might not compile
const tsxFilesWithoutReactImport = fileStats[".tsx"].filter((file) => {
  try {
    const content = fs.readFileSync(path.join(PROJECT_DIR, file), "utf-8");
    return (
      !content.includes("import React") &&
      !content.includes('from "react"') &&
      !content.includes("from 'react'")
    );
  } catch (e) {
    return false;
  }
});

if (tsxFilesWithoutReactImport.length > 0) {
  console.log("\n🔸 These .tsx files might be missing React import:");
  tsxFilesWithoutReactImport.forEach((f) => console.log(`   - ${f}`));
}

// Summary
console.log("\n📈 Summary:");
console.log("===========");
const totalFiles = Object.values(fileStats).reduce(
  (sum, files) => sum + files.length,
  0
);
const tsFiles = fileStats[".ts"].length + fileStats[".tsx"].length;
const jsFiles = fileStats[".js"].length + fileStats[".jsx"].length;

console.log(`Total source files: ${totalFiles}`);
console.log(`JavaScript files: ${jsFiles}`);
console.log(`TypeScript files: ${tsFiles}`);
console.log(
  `Migration progress: ${((tsFiles / (tsFiles + jsFiles)) * 100).toFixed(
    1
  )}% TypeScript`
);

// Quick fix suggestions
console.log("\n💡 Quick Fix Commands:");
console.log("=====================\n");

if (fileStats[".tsx"].length > 0 && !fs.existsSync("./tsconfig.json")) {
  console.log(
    "❌ No tsconfig.json found! You need this for .tsx files to work."
  );
  console.log(
    "   Run: npm install --save-dev typescript @types/react @types/node"
  );
  console.log("   Then add the tsconfig.json file from the refactoring.\n");
}

if (jsFilesWithReact.length > 0) {
  console.log("To rename .js files with React to .jsx:");
  jsFilesWithReact.slice(0, 3).forEach((f) => {
    const newName = f.replace(".js", ".jsx");
    console.log(
      `   mv ${path.join(PROJECT_DIR, f)} ${path.join(PROJECT_DIR, newName)}`
    );
  });
}

console.log("\n✅ Script complete!");
