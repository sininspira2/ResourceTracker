const { DefaultReporter } = require("@jest/reporters");

// Suppress console output for passing test files; show it only when a file has failures.
class QuietConsoleReporter extends DefaultReporter {
  onTestResult(test, testResult, aggregatedResults) {
    if (testResult.numFailingTests === 0) {
      testResult = { ...testResult, console: undefined };
    }
    super.onTestResult(test, testResult, aggregatedResults);
  }
}

module.exports = QuietConsoleReporter;
