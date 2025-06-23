
import fs from 'fs/promises';
import path from 'path';

interface TestResult {
  suite: string;
  test: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

export class TestMonitor {
  private results: TestSuite[] = [];
  private startTime: Date = new Date();

  addSuite(suite: TestSuite) {
    this.results.push(suite);
  }

  async generateReport(): Promise<string> {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0);
    const passedTests = this.results.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.status === 'passed').length, 0);
    const failedTests = this.results.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.status === 'failed').length, 0);
    const skippedTests = this.results.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.status === 'skipped').length, 0);

    const totalDuration = this.results.reduce((sum, suite) => 
      sum + suite.tests.reduce((suiteSum, test) => suiteSum + test.duration, 0), 0);

    const report = `
# Burnt Beats Test Report
Generated: ${new Date().toISOString()}
Test Run Duration: ${Date.now() - this.startTime.getTime()}ms

## Summary
- **Total Tests**: ${totalTests}
- **Passed**: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)
- **Failed**: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)
- **Skipped**: ${skippedTests} (${((skippedTests/totalTests)*100).toFixed(1)}%)
- **Total Duration**: ${totalDuration}ms

## Test Suites

${this.results.map(suite => `
### ${suite.name}
- Tests: ${suite.tests.length}
- Passed: ${suite.tests.filter(t => t.status === 'passed').length}
- Failed: ${suite.tests.filter(t => t.status === 'failed').length}
- Duration: ${suite.tests.reduce((sum, t) => sum + t.duration, 0)}ms

${suite.coverage ? `
#### Coverage
- Lines: ${suite.coverage.lines}%
- Functions: ${suite.coverage.functions}%
- Branches: ${suite.coverage.branches}%
- Statements: ${suite.coverage.statements}%
` : ''}

${suite.tests.filter(t => t.status === 'failed').length > 0 ? `
#### Failed Tests
${suite.tests.filter(t => t.status === 'failed').map(test => `
- **${test.test}**: ${test.error}
`).join('')}
` : ''}
`).join('')}

## Performance Metrics
- Average test duration: ${(totalDuration / totalTests).toFixed(2)}ms
- Slowest tests:
${this.results.flatMap(suite => suite.tests)
  .sort((a, b) => b.duration - a.duration)
  .slice(0, 5)
  .map(test => `  - ${test.suite}:${test.test} (${test.duration}ms)`)
  .join('\n')}

## Quality Gates
${this.checkQualityGates(passedTests, totalTests, failedTests)}
`;

    return report;
  }

  private checkQualityGates(passed: number, total: number, failed: number): string {
    const passRate = passed / total;
    const gates = [
      { name: 'Pass Rate > 95%', status: passRate > 0.95 ? '✅' : '❌', value: `${(passRate * 100).toFixed(1)}%` },
      { name: 'No Failed Tests', status: failed === 0 ? '✅' : '❌', value: `${failed} failed` },
      { name: 'Total Tests > 50', status: total > 50 ? '✅' : '❌', value: `${total} tests` },
    ];

    return gates.map(gate => `${gate.status} ${gate.name}: ${gate.value}`).join('\n');
  }

  async saveReport(filename: string = 'test-report.md') {
    const report = await this.generateReport();
    const reportPath = path.join(process.cwd(), 'test-results', filename);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    await fs.writeFile(reportPath, report);
    console.log(`Test report saved to: ${reportPath}`);
  }

  async generateHtmlReport(): Promise<string> {
    const report = await this.generateReport();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Burnt Beats Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .progress { width: 100%; height: 20px; background: #ddd; border-radius: 10px; }
        .progress-bar { height: 100%; background: linear-gradient(to right, green, orange, red); border-radius: 10px; }
    </style>
</head>
<body>
    <h1>🎵 Burnt Beats Test Report</h1>
    <div class="summary">
        ${report.split('\n').slice(0, 20).join('<br>')}
    </div>
    <div class="results">
        ${report.split('## Test Suites')[1]?.replace(/\n/g, '<br>').replace(/###/g, '<h3>').replace(/####/g, '<h4>') || ''}
    </div>
</body>
</html>`;
  }
}

// Usage in test files
export const testMonitor = new TestMonitor();
