/**
 * Fixed Test Runner - Proper Module Initialization Waiting
 * 
 * Addresses the race condition in module initialization
 */

const TestRunner = (() => {
    'use strict';

    // DOM elements
    let elements = {};

    // Test execution state
    let isRunning = false;
    let runOptions = {
        stopOnFirstFailure: false,
        verboseOutput: true
    };

    /**
 * Quick Fix - Just replace the waitForModulesReady function in your existing testRunner.js
 */

async function waitForModulesReady() {
    console.log('TestRunner: Waiting for modules to be ready...');
    
    const requiredModules = [
        'ExerciseDatabase',
        'Validators', 
        'ExerciseGenerator'
    ];

    const maxWaitTime = 5000; // 5 seconds max wait
    const checkInterval = 100; // Check every 100ms
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
        const checkReadiness = async () => {
            const elapsed = performance.now() - startTime;
            
            // Check if all required modules are ready
            const moduleStatuses = requiredModules.map(moduleName => {
                const module = window[moduleName];
                const isReady = module && 
                               typeof module.isReady === 'function' && 
                               module.isReady();
                
                console.log(`TestRunner: ${moduleName} ready: ${isReady}`);
                return { name: moduleName, ready: isReady };
            });

            const allReady = moduleStatuses.every(status => status.ready);
            
            if (allReady) {
                console.log(`TestRunner: All modules ready after ${elapsed.toFixed(2)}ms, waiting for stability...`);
                
                // ADD THIS: Wait an additional 300ms for async initialization to complete
                await new Promise(resolve => setTimeout(resolve, 300));
                
                console.log(`TestRunner: Stability period complete after ${(performance.now() - startTime).toFixed(2)}ms total`);
                resolve();
                return;
            }

            // Check timeout
            if (elapsed > maxWaitTime) {
                const notReady = moduleStatuses
                    .filter(status => !status.ready)
                    .map(status => status.name);
                
                console.error(`TestRunner: Timeout waiting for modules: ${notReady.join(', ')}`);
                reject(new Error(`Module timeout: ${notReady.join(', ')}`));
                return;
            }

            // Continue checking
            setTimeout(checkReadiness, checkInterval);
        };

        // Start checking
        checkReadiness();
    });
}

    /**
     * Initialize the test runner
     */
    async function init() {
        console.log('TestRunner: Starting initialization...');
        
        try {
            // Wait for all modules to be ready first
            await waitForModulesReady();
            
            // Additional small delay to ensure everything is settled
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Cache DOM elements
            elements = {
                runAllTests: document.getElementById('runAllTests'),
                runFailedTests: document.getElementById('runFailedTests'),
                clearResults: document.getElementById('clearResults'),
                stopOnFirstFailure: document.getElementById('stopOnFirstFailure'),
                verboseOutput: document.getElementById('verboseOutput'),
                progressFill: document.getElementById('progressFill'),
                testSummary: document.getElementById('testSummary'),
                totalTests: document.getElementById('totalTests'),
                passedTests: document.getElementById('passedTests'),
                failedTests: document.getElementById('failedTests'),
                skippedTests: document.getElementById('skippedTests'),
                testResults: document.getElementById('testResults')
            };

            // Set up event listeners
            setupEventListeners();

            // Initialize UI
            updateRunOptions();
            showInitialState();

            console.log('TestRunner: Initialization complete');
            
        } catch (error) {
            console.error('TestRunner: Initialization failed:', error);
            showError('Test runner initialization failed: ' + error.message);
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        elements.runAllTests.addEventListener('click', handleRunAllTests);
        elements.runFailedTests.addEventListener('click', handleRunFailedTests);
        elements.clearResults.addEventListener('click', handleClearResults);
        
        elements.stopOnFirstFailure.addEventListener('change', updateRunOptions);
        elements.verboseOutput.addEventListener('change', updateRunOptions);

        // Suite header click handlers for expand/collapse
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('test-suite-header') || 
                e.target.closest('.test-suite-header')) {
                const header = e.target.closest('.test-suite-header') || e.target;
                const suite = header.closest('.test-suite');
                if (suite) {
                    suite.classList.toggle('expanded');
                }
            }
        });
    }

    /**
     * Update run options from UI
     */
    function updateRunOptions() {
        runOptions.stopOnFirstFailure = elements.stopOnFirstFailure.checked;
        runOptions.verboseOutput = elements.verboseOutput.checked;
    }

    /**
     * Show initial state
     */
    function showInitialState() {
        elements.testResults.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Ready to run tests...
            </div>
        `;
        elements.testSummary.style.display = 'none';
        elements.progressFill.style.width = '0%';
    }

    /**
     * Handle run all tests
     */
    async function handleRunAllTests() {
        if (isRunning) return;

        try {
            isRunning = true;
            updateButtonStates();
            
            console.log('TestRunner: Starting test execution...');
            
            // Ensure modules are still ready before running tests
            await waitForModulesReady();
            
            await runTests();
            
        } catch (error) {
            console.error('Test run failed:', error);
            showError('Test execution failed: ' + error.message);
        } finally {
            isRunning = false;
            updateButtonStates();
        }
    }

    /**
     * Handle run failed tests
     */
    async function handleRunFailedTests() {
        if (isRunning) return;
        await handleRunAllTests();
    }

    /**
     * Handle clear results
     */
    function handleClearResults() {
        if (isRunning) return;
        TestFramework.clearResults();
        showInitialState();
    }

    /**
     * Update button states based on running status
     */
    function updateButtonStates() {
        elements.runAllTests.disabled = isRunning;
        elements.runFailedTests.disabled = isRunning;
        elements.clearResults.disabled = isRunning;

        if (isRunning) {
            elements.runAllTests.textContent = 'Running...';
        } else {
            elements.runAllTests.textContent = 'Run All Tests';
        }
    }

    /**
     * Run tests with UI feedback
     */
    async function runTests() {
        let totalSuites = 0;
        let totalTests = 0;

        // Count total suites and tests for progress
        if (TestFramework && TestFramework.testSuites) {
            for (const [suiteName, suite] of TestFramework.testSuites) {
                totalSuites++;
                totalTests += suite.tests.length;
            }
        }

        console.log(`TestRunner: Found ${totalSuites} suites with ${totalTests} total tests`);

        // Show running state
        elements.testResults.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Running ${totalTests} tests across ${totalSuites} suites...
            </div>
        `;

        let completedTests = 0;

        // Run tests with progress callbacks
        const results = await TestFramework.runAllTests({
            stopOnFirstFailure: runOptions.stopOnFirstFailure,

            onSuiteStart: (suite) => {
                if (runOptions.verboseOutput) {
                    console.log(`Starting suite: ${suite.name}`);
                }
            },

            onProgress: (testResult, suiteResult) => {
                completedTests++;
                const progress = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;
                elements.progressFill.style.width = `${progress}%`;

                if (runOptions.verboseOutput) {
                    const status = testResult.status === 'passed' ? '✓' : 
                                  testResult.status === 'failed' ? '✗' : '○';
                    console.log(`  ${status} ${testResult.name} (${testResult.duration.toFixed(2)}ms)`);
                }
            },

            onSuiteComplete: (suiteResult) => {
                if (runOptions.verboseOutput) {
                    console.log(`Completed suite: ${suiteResult.name} (${suiteResult.passed}/${suiteResult.tests.length} passed)`);
                }
            }
        });

        console.log(`TestRunner: Final results: ${results.passed}/${results.total} passed, ${results.failed} failed`);

        // Display results
        displayResults(results);
    }

    /**
     * Display test results in UI
     */
    function displayResults(results) {
        // Update summary
        elements.totalTests.textContent = results.total;
        elements.passedTests.textContent = results.passed;
        elements.failedTests.textContent = results.failed;
        elements.skippedTests.textContent = results.skipped;
        elements.testSummary.style.display = 'grid';

        // Build results HTML
        let resultsHTML = '';

        for (const [suiteName, suiteResult] of results.suites) {
            resultsHTML += createSuiteHTML(suiteResult);
        }

        if (resultsHTML === '') {
            resultsHTML = `
                <div class="loading">
                    No tests found. Make sure test modules are loaded correctly.
                </div>
            `;
        }

        elements.testResults.innerHTML = resultsHTML;
        elements.progressFill.style.width = '100%';

        // Log summary
        console.log('\n=== Test Results ===');
        console.log(`Total: ${results.total}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log(`Skipped: ${results.skipped}`);
        console.log(`Success Rate: ${results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0}%`);
    }

    /**
     * Create HTML for a test suite
     */
    function createSuiteHTML(suiteResult) {
        const passRate = suiteResult.tests.length > 0 ? 
            Math.round((suiteResult.passed / suiteResult.tests.length) * 100) : 0;

        let suiteHTML = `
            <div class="test-suite ${suiteResult.failed > 0 ? '' : 'expanded'}">
                <div class="test-suite-header">
                    <div class="test-suite-title">
                        ${escapeHtml(suiteResult.name)}
                        <span style="font-weight: normal; color: #64748b;">
                            (${suiteResult.duration.toFixed(2)}ms, ${passRate}% pass rate)
                        </span>
                    </div>
                    <div class="test-suite-stats">
                        <span class="stat passed">${suiteResult.passed} passed</span>
                        ${suiteResult.failed > 0 ? `<span class="stat failed">${suiteResult.failed} failed</span>` : ''}
                        ${suiteResult.skipped > 0 ? `<span class="stat skipped">${suiteResult.skipped} skipped</span>` : ''}
                    </div>
                </div>
                <div class="test-suite-body">
        `;

        // Add test cases
        for (const testResult of suiteResult.tests) {
            suiteHTML += createTestHTML(testResult);
        }

        suiteHTML += `
                </div>
            </div>
        `;

        return suiteHTML;
    }

    /**
     * Create HTML for a test case
     */
    function createTestHTML(testResult) {
        let testHTML = `
            <div class="test-case ${testResult.status}">
                <div class="test-name">${escapeHtml(testResult.name)}</div>
                <div>
                    <span class="test-status ${testResult.status}">${testResult.status.toUpperCase()}</span>
                    <span class="test-duration">${testResult.duration.toFixed(2)}ms</span>
                </div>
            </div>
        `;

        // Add error details for failed tests
        if (testResult.status === 'failed' && testResult.error) {
            testHTML += `
                <div class="error-details">
                    <strong>${testResult.error.name || 'Error'}:</strong> ${escapeHtml(testResult.error.message || 'Unknown error')}
                    ${testResult.error.stack ? '\n\nStack trace:\n' + testResult.error.stack : ''}
                </div>
            `;
        }

        return testHTML;
    }

    /**
     * Show error state
     */
    function showError(message) {
        elements.testResults.innerHTML = `
            <div class="loading" style="color: var(--color-error);">
                ⚠️ ${escapeHtml(message)}
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API
    return {
        init,
        runTests: handleRunAllTests
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM ready, initializing TestRunner...');
    try {
        await TestRunner.init();
        console.log('TestRunner initialized successfully');
    } catch (error) {
        console.error('TestRunner initialization failed:', error);
    }
});

// Export for debugging
window.TestRunner = TestRunner;
