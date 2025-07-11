
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class NodeJSFormattingChecker {
  constructor() {
    this.issues = [];
    this.checkedFiles = 0;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const issues = [];

      // Check for common formatting issues
      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Check for trailing whitespace
        if (line.match(/\s+$/)) {
          issues.push(`Line ${lineNum}: Trailing whitespace`);
        }

        // Check for mixed tabs and spaces
        if (line.match(/^\t/) && content.includes('  ')) {
          issues.push(`Line ${lineNum}: Mixed tabs and spaces detected`);
        }

        // Check for missing semicolons (basic check)
        if (line.trim().match(/^(let|const|var|return|throw)\s+.*[^;{}\s]$/)) {
          issues.push(`Line ${lineNum}: Possibly missing semicolon`);
        }

        // Check for inconsistent quotes
        const singleQuotes = (line.match(/'/g) || []).length;
        const doubleQuotes = (line.match(/"/g) || []).length;
        if (singleQuotes > 0 && doubleQuotes > 0 && !line.includes('template')) {
          issues.push(`Line ${lineNum}: Mixed quote styles`);
        }

        // Check for long lines (over 120 characters)
        if (line.length > 120) {
          issues.push(`Line ${lineNum}: Line too long (${line.length} chars)`);
        }

        // Check for console.log in non-dev files
        if (line.includes('console.log') && !filePath.includes('test') && !filePath.includes('dev')) {
          issues.push(`Line ${lineNum}: console.log found (consider using logger)`);
        }
      });

      // Check indentation consistency
      const indentPattern = content.match(/^(\s+)/gm);
      if (indentPattern) {
        const indents = indentPattern.map(match => match.length);
        const hasInconsistentIndents = indents.some((indent, i) => {
          if (i === 0) return false;
          const diff = Math.abs(indent - indents[i-1]);
          return diff !== 0 && diff !== 2 && diff !== 4;
        });
        if (hasInconsistentIndents) {
          issues.push('Inconsistent indentation detected');
        }
      }

      return issues;
    } catch (error) {
      return [`Error reading file: ${error.message}`];
    }
  }

  checkDirectory(dir = '.') {
    const files = this.getJSFiles(dir);
    
    this.log(`🔍 Checking ${files.length} Node.js files for formatting issues...`);
    
    files.forEach(file => {
      this.checkedFiles++;
      const issues = this.checkFile(file);
      
      if (issues.length > 0) {
        this.log(`\n📄 ${file}:`, 'warning');
        issues.forEach(issue => {
          this.log(`  ⚠️  ${issue}`, 'warning');
        });
        this.issues.push({ file, issues });
      } else {
        this.log(`✅ ${file}: Clean`, 'success');
      }
    });

    this.generateReport();
  }

  getJSFiles(dir) {
    const files = [];
    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other build directories
          if (!['node_modules', 'dist', 'build', '.git', 'playwright-report'].includes(item)) {
            walk(fullPath);
          }
        } else if (stat.isFile()) {
          // Include JS/TS files
          if (fullPath.match(/\.(js|ts|jsx|tsx|cjs|mjs)$/)) {
            files.push(fullPath);
          }
        }
      });
    };
    
    walk(dir);
    return files;
  }

  generateReport() {
    this.log('\n📊 FORMATTING CHECK SUMMARY', 'info');
    this.log('='.repeat(50), 'info');
    
    if (this.issues.length === 0) {
      this.log('🎉 All files are properly formatted!', 'success');
    } else {
      this.log(`⚠️  Found issues in ${this.issues.length} files:`, 'warning');
      
      const totalIssues = this.issues.reduce((sum, file) => sum + file.issues.length, 0);
      this.log(`📋 Total issues: ${totalIssues}`, 'warning');
      
      // Most common issues
      const allIssues = this.issues.flatMap(file => file.issues);
      const issueTypes = {};
      allIssues.forEach(issue => {
        const type = issue.split(':')[1]?.trim() || issue;
        issueTypes[type] = (issueTypes[type] || 0) + 1;
      });
      
      this.log('\n🔍 Most common issues:', 'info');
      Object.entries(issueTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([type, count]) => {
          this.log(`  • ${type}: ${count}`, 'warning');
        });
    }
    
    this.log(`\n📁 Files checked: ${this.checkedFiles}`, 'info');
    this.log(`⚠️  Files with issues: ${this.issues.length}`, 'warning');
  }
}

// Run the checker
const checker = new NodeJSFormattingChecker();
checker.checkDirectory();
