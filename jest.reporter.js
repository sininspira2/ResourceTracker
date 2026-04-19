const { DefaultReporter } = require("@jest/reporters");

// Suppress console output for passing test files; show it only when a file has failures,
// had a suite-level exec error, or produced no passing tests (e.g. all skipped).
// To see console output for every run, swap reporters back to the default in jest.config.js.
class QuietConsoleReporter extends DefaultReporter {
  onTestResult(test, testResult, aggregatedResults) {
    if (
      testResult.numFailingTests === 0 &&
      !testResult.testExecError &&
      testResult.numPassingTests > 0
    ) {
      testResult = { ...testResult, console: undefined };
    }
    super.onTestResult(test, testResult, aggregatedResults);
  }
}

module.exports = QuietConsoleReporter;
