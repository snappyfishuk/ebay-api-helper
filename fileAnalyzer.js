// fileAnalyzer.js - Run this in your project root
const fs = require("fs");
const path = require("path");

class FileAnalyzer {
  constructor() {
    this.allFiles = new Set();
    this.importedFiles = new Set();
    this.requiredFiles = new Set();
    this.referencedFiles = new Set();
    this.entryPoints = new Set();
    this.suspiciousFiles = [];

    // Define your entry points (main files that start the app)
    this.entryPoints.add("server.js");
    this.entryPoints.add("app.js");
    this.entryPoints.add("index.js");
    this.entryPoints.add("package.json");
  }

  scanDirectory(
    dir,
    ignore = ["node_modules", ".git", "build", "dist", ".next", "coverage"]
  ) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!ignore.includes(file)) {
          this.scanDirectory(fullPath, ignore);
        }
      } else if (file.match(/\.(js|jsx|ts|tsx|json|md)$/)) {
        const relativePath = path.relative(".", fullPath);
        this.allFiles.add(relativePath);

        if (file.match(/\.(js|jsx|ts|tsx)$/)) {
          this.analyzeFileContent(relativePath);
        }
      }
    });
  }

  analyzeFileContent(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");

      // Look for imports/requires
      const importRegex =
        /(?:import.*from\s+['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]\))/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1] || match[2];

        // Skip node_modules and external packages
        if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
          continue;
        }

        const resolvedPath = this.resolveImportPath(filePath, importPath);
        if (resolvedPath) {
          this.importedFiles.add(resolvedPath);
          this.referencedFiles.add(resolvedPath);
        }
      }

      // Look for dynamic requires
      const dynamicRequireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      while ((match = dynamicRequireRegex.exec(content)) !== null) {
        const requirePath = match[1];
        if (requirePath.startsWith(".") || requirePath.startsWith("/")) {
          const resolvedPath = this.resolveImportPath(filePath, requirePath);
          if (resolvedPath) {
            this.requiredFiles.add(resolvedPath);
            this.referencedFiles.add(resolvedPath);
          }
        }
      }

      // Look for file references in strings (config files, etc.)
      const fileRefRegex = /['"`]([^'"`]*\.(js|jsx|ts|tsx|json))['"`]/g;
      while ((match = fileRefRegex.exec(content)) !== null) {
        const refPath = match[1];
        if (refPath.includes("/") || refPath.includes(".")) {
          const resolvedPath = this.resolveImportPath(filePath, refPath);
          if (resolvedPath && this.allFiles.has(resolvedPath)) {
            this.referencedFiles.add(resolvedPath);
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not read ${filePath}: ${error.message}`);
    }
  }

  resolveImportPath(fromFile, importPath) {
    const fromDir = path.dirname(fromFile);
    let resolved = path.resolve(fromDir, importPath);

    // Normalize to relative path
    resolved = path.relative(".", resolved);

    // Try different extensions if file doesn't exist
    const extensions = ["", ".js", ".jsx", ".ts", ".tsx", ".json"];
    for (const ext of extensions) {
      const testPath = resolved + ext;
      if (this.allFiles.has(testPath)) {
        return testPath;
      }

      // Check for index files
      const indexPath = path.join(resolved, "index" + ext);
      if (this.allFiles.has(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  findUnusedFiles() {
    // Start from entry points and build dependency tree
    const usedFiles = new Set();
    const toProcess = Array.from(this.entryPoints).filter((f) =>
      this.allFiles.has(f)
    );

    while (toProcess.length > 0) {
      const current = toProcess.pop();
      if (usedFiles.has(current)) continue;

      usedFiles.add(current);

      // Add all files this one references
      this.referencedFiles.forEach((ref) => {
        if (!usedFiles.has(ref)) {
          toProcess.push(ref);
        }
      });
    }

    // Also include referenced files
    this.referencedFiles.forEach((ref) => usedFiles.add(ref));

    // Find potentially unused files
    const potentiallyUnused = [];
    this.allFiles.forEach((file) => {
      if (!usedFiles.has(file) && !this.isKnownSafeFile(file)) {
        potentiallyUnused.push(file);
      }
    });

    return potentiallyUnused;
  }

  isKnownSafeFile(filePath) {
    const safePatternsToKeep = [
      /package\.json$/,
      /package-lock\.json$/,
      /\.env/,
      /\.gitignore$/,
      /README\.md$/,
      /\.md$/,
      /tsconfig\.json$/,
      /\.config\./,
      /\.eslintrc/,
      /\.prettierrc/,
      /Dockerfile/,
      /\.dockerignore$/,
      /vercel\.json$/,
      /netlify\.toml$/,
    ];

    return safePatternsToKeep.some((pattern) => pattern.test(filePath));
  }

  findSuspiciousPatterns() {
    this.allFiles.forEach((filePath) => {
      try {
        const content = fs.readFileSync(filePath, "utf-8");

        // Check for common issues
        const issues = [];

        // Large files that might be unused
        if (content.length > 50000 && !this.referencedFiles.has(filePath)) {
          issues.push("Large file (>50KB) that may be unused");
        }

        // Files with TODO/FIXME comments
        if (content.includes("TODO:") || content.includes("FIXME:")) {
          issues.push("Contains TODO/FIXME comments");
        }

        // Old test files
        if (
          filePath.includes("test") &&
          !content.includes("describe") &&
          !content.includes("it(")
        ) {
          issues.push("Possible old test file");
        }

        // Files with only comments
        const codeLines = content
          .split("\n")
          .filter(
            (line) =>
              line.trim() &&
              !line.trim().startsWith("//") &&
              !line.trim().startsWith("/*")
          );
        if (codeLines.length < 5) {
          issues.push("Mostly comments/empty lines");
        }

        if (issues.length > 0) {
          this.suspiciousFiles.push({ file: filePath, issues });
        }
      } catch (error) {
        // Skip files we can't read
      }
    });
  }

  generateReport() {
    console.log("🔍 eBay-FreeAgent File Analysis Report");
    console.log("=====================================\n");

    console.log(`📊 **Project Statistics:**`);
    console.log(`   Total files scanned: ${this.allFiles.size}`);
    console.log(`   Referenced files: ${this.referencedFiles.size}`);
    console.log(
      `   Entry points found: ${
        Array.from(this.entryPoints).filter((f) => this.allFiles.has(f)).length
      }\n`
    );

    // Potentially unused files
    const unused = this.findUnusedFiles();
    console.log(`🗑️  **Potentially Unused Files (${unused.length}):**`);
    if (unused.length === 0) {
      console.log("   ✅ No obviously unused files detected!\n");
    } else {
      unused.forEach((file) => {
        const size = fs.statSync(file).size;
        console.log(`   📄 ${file} (${Math.round(size / 1024)}KB)`);
      });
      console.log();
    }

    // Suspicious files
    this.findSuspiciousPatterns();
    console.log(
      `⚠️  **Files Needing Review (${this.suspiciousFiles.length}):**`
    );
    if (this.suspiciousFiles.length === 0) {
      console.log("   ✅ No suspicious patterns detected!\n");
    } else {
      this.suspiciousFiles.forEach(({ file, issues }) => {
        console.log(`   📄 ${file}`);
        issues.forEach((issue) => console.log(`      - ${issue}`));
      });
      console.log();
    }

    // Safe cleanup commands
    if (unused.length > 0) {
      console.log(`🧹 **Safe Cleanup Commands:**`);
      console.log(
        `   # Review these files first, then remove if truly unused:`
      );
      unused.slice(0, 5).forEach((file) => {
        console.log(`   # rm "${file}"`);
      });
      console.log(
        `\n   ⚠️  IMPORTANT: Test your app after removing each file!\n`
      );
    }

    // Recommendations
    console.log(`💡 **Recommendations:**`);
    console.log(
      `   1. Create a backup: git add . && git commit -m "Pre-cleanup backup"`
    );
    console.log(`   2. Remove files one at a time and test`);
    console.log(`   3. Check if removed files break your build/tests`);
    console.log(`   4. For production: test in staging environment first`);
    console.log(`   5. Keep this analyzer script for future cleanups\n`);
  }
}

// Run the analysis
const analyzer = new FileAnalyzer();
console.log("🚀 Starting file analysis...\n");

analyzer.scanDirectory(".");
analyzer.generateReport();

console.log("✅ Analysis complete! Review the results above.");
console.log("\n📋 Next steps:");
console.log('1. Backup your code: git add . && git commit -m "Before cleanup"');
console.log("2. Review flagged files manually");
console.log("3. Test your app after removing each file");
console.log("4. Run: npm test (if you have tests)");
console.log("5. Test both frontend and backend connectivity");
