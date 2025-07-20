/**
 * Simple Test Framework for Workout Generator
 * 
 * Provides assertion methods, test suite organization, and result reporting
 * without external dependencies.
 */

const TestFramework = (() => {
    'use strict';

    // Test state
    let testSuites = new Map();
    let currentSuite = null;
    let isRunning = false;
    let results = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        suites: new Map()
    };

    /**
     * Assertion methods
     */
    const assert = {
        /**
         * Assert that value is truthy
         */
        isTrue(value, message = 'Expected value to be truthy') {
            if (!value) {
                throw new AssertionError(`${message}. Got: ${value}`);
            }
        },

        /**
         * Assert that value is falsy
         */
        isFalse(value, message = 'Expected value to be falsy') {
            if (value) {
                throw new AssertionError(`${message}. Got: ${value}`);
            }
        },

        /**
         * Assert deep equality
         */
        deepEqual(actual, expected, message = 'Values are not deeply equal') {
            if (!deepEquals(actual, expected)) {
                throw new AssertionError(`${message}.\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
            }
        },

        /**
         * Assert strict equality
         */
        strictEqual(actual, expected, message = 'Values are not strictly equal') {
            if (actual !== expected) {
                throw new AssertionError(`${message}.\nExpected: ${expected}\nActual: ${actual}`);
            }
        },

        /**
         * Assert that function throws
         */
        throws(fn, expectedError, message = 'Function did not throw') {
            let threw = false;
            let actualError = null;

            try {
                fn();
            } catch (error) {
                threw = true;
                actualError = error;

                if (expectedError) {
                    if (typeof expectedError === 'string') {
                        if (!error.message.includes(expectedError)) {
                            throw new AssertionError(`${message}. Expected error message to contain "${expectedError}", got "${error.message}"`);
                        }
                    } else if (expectedError instanceof RegExp) {
                        if (!expectedError.test(error.message)) {
                            throw new AssertionError(`${message}. Expected error message to match ${expectedError}, got "${error.message}"`);
                        }
                    } else if (typeof expectedError === 'function') {
                        if (!(error instanceof expectedError)) {
                            throw new AssertionError(`${message}. Expected error to be instance of ${expectedError.name}, got ${error.constructor.name}`);
                        }
                    }
                }
            }

            if (!threw) {
                throw new AssertionError(message);
            }
        },

        /**
         * Assert that function does not throw
         */
        doesNotThrow(fn, message = 'Function threw unexpectedly') {
            try {
                fn();
            } catch (error) {
                throw new AssertionError(`${message}. Error: ${error.message}`);
            }
        },

        /**
         * Assert that value is null
         */
        isNull(value, message = 'Expected value to be null') {
            if (value !== null) {
                throw new AssertionError(`${message}. Got: ${value}`);
            }
        },

        /**
         * Assert that value is not null
         */
        isNotNull(value, message = 'Expected value to not be null') {
            if (value === null) {
                throw new AssertionError(message);
            }
        },

        /**
         * Assert that value is undefined
         */
        isUndefined(value, message = 'Expected value to be undefined') {
            if (value !== undefined) {
                throw new AssertionError(`${message}. Got: ${value}`);
            }
        },

        /**
         * Assert that value is not undefined
         */
        isNotUndefined(value, message = 'Expected value to not be undefined') {
            if (value === undefined) {
                throw new AssertionError(message);
            }
        },

        /**
         * Assert that value is an array
         */
        isArray(value, message = 'Expected value to be an array') {
            if (!Array.isArray(value)) {
                throw new AssertionError(`${message}. Got: ${typeof value}`);
            }
        },

        /**
         * Assert that value is a function
         */
        isFunction(value, message = 'Expected value to be a function') {
            if (typeof value !== 'function') {
                throw new AssertionError(`${message}. Got: ${typeof value}`);
            }
        },

        /**
         * Assert that value is a string
         */
        isString(value, message = 'Expected value to be a string') {
            if (typeof value !== 'string') {
                throw new AssertionError(`${message}. Got: ${typeof value}`);
            }
        },

        /**
         * Assert that value is a number
         */
        isNumber(value, message = 'Expected value to be a number') {
            if (typeof value !== 'number') {
                throw new AssertionError(`${message}. Got: ${typeof value}`);
            }
        },

        /**
         * Assert that array contains value
         */
        contains(array, value, message = 'Array does not contain expected value') {
            if (!Array.isArray(array)) {
                throw new AssertionError(`${message}. First argument must be an array`);
            }
            if (!array.includes(value)) {
                throw new AssertionError(`${message}. Array: ${JSON.stringify(array)}, Value: ${value}`);
            }
        },

        /**
         * Assert that array has specific length
         */
        hasLength(array, expectedLength, message = 'Array does not have expected length') {
            if (!Array.isArray(array)) {
                throw new AssertionError(`${message}. Value is not an array`);
            }
            if (array.length !== expectedLength) {
                throw new AssertionError(`${message}. Expected: ${expectedLength}, Actual: ${array.length}`);
            }
        }
    };

    /**
     * Custom assertion error class
     */
    class AssertionError extends Error {
        constructor(message) {
            super(message);
            this.name = 'AssertionError';
        }
    }

    /**
     * Deep equality check
     */
    function deepEquals(a, b) {
        if (a === b) return true;
        
        if (a == null || b == null) return false;
        
        if (typeof a !== typeof b) return false;
        
        if (typeof a !== 'object') return a === b;
        
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        
        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!deepEquals(a[i], b[i])) return false;
            }
            return true;
        }
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (let key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!deepEquals(a[key], b[key])) return false;
        }
        
        return true;
    }

    /**
     * Mock utilities
     */
    const mock = {
        /**
         * Create a mock function that tracks calls
         */
        fn(implementation) {
            const mockFn = function(...args) {
                mockFn.calls.push(args);
                mockFn.callCount++;
                if (implementation) {
                    return implementation.apply(this, args);
                }
            };

            mockFn.calls = [];
            mockFn.callCount = 0;
            mockFn.reset = () => {
                mockFn.calls = [];
                mockFn.callCount = 0;
            };

            return mockFn;
        },

        /**
         * Create a mock object with specified methods
         */
        object(methods = {}) {
            const mockObj = {};
            
            Object.keys(methods).forEach(methodName => {
                mockObj[methodName] = this.fn(methods[methodName]);
            });

            return mockObj;
        },

        /**
         * Mock DOM elements for UI testing
         */
        domElement(tagName = 'div', attributes = {}) {
            const element = {
                tagName: tagName.toUpperCase(),
                attributes: { ...attributes },
                children: [],
                parent: null,
                style: {},
                classList: {
                    add: mock.fn(),
                    remove: mock.fn(),
                    contains: mock.fn(() => false),
                    toggle: mock.fn()
                },
                addEventListener: mock.fn(),
                removeEventListener: mock.fn(),
                appendChild: mock.fn((child) => {
                    element.children.push(child);
                    child.parent = element;
                }),
                removeChild: mock.fn((child) => {
                    const index = element.children.indexOf(child);
                    if (index > -1) {
                        element.children.splice(index, 1);
                        child.parent = null;
                    }
                }),
                setAttribute: mock.fn((name, value) => {
                    element.attributes[name] = value;
                }),
                getAttribute: mock.fn((name) => element.attributes[name]),
                querySelector: mock.fn(),
                querySelectorAll: mock.fn(() => [])
            };

            return element;
        }
    };

    /**
     * Test suite definition
     */
    function describe(suiteName, callback) {
        if (isRunning) {
            throw new Error('Cannot define tests while tests are running');
        }

        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null,
            setup: null,
            teardown: null
        };

        const previousSuite = currentSuite;
        currentSuite = suite;

        // Execute the suite definition
        try {
            callback();
        } finally {
            currentSuite = previousSuite;
        }

        testSuites.set(suiteName, suite);
    }

    /**
     * Individual test definition
     */
    function it(testName, callback) {
        if (!currentSuite) {
            throw new Error('Tests must be defined within a describe block');
        }

        currentSuite.tests.push({
            name: testName,
            callback: callback,
            skip: false
        });
    }

    /**
     * Skip a test
     */
    function xit(testName, callback) {
        if (!currentSuite) {
            throw new Error('Tests must be defined within a describe block');
        }

        currentSuite.tests.push({
            name: testName,
            callback: callback,
            skip: true
        });
    }

    /**
     * Before each test hook
     */
    function beforeEach(callback) {
        if (!currentSuite) {
            throw new Error('beforeEach must be defined within a describe block');
        }
        currentSuite.beforeEach = callback;
    }

    /**
     * After each test hook
     */
    function afterEach(callback) {
        if (!currentSuite) {
            throw new Error('afterEach must be defined within a describe block');
        }
        currentSuite.afterEach = callback;
    }

    /**
     * Suite setup hook
     */
    function before(callback) {
        if (!currentSuite) {
            throw new Error('before must be defined within a describe block');
        }
        currentSuite.setup = callback;
    }

    /**
     * Suite teardown hook
     */
    function after(callback) {
        if (!currentSuite) {
            throw new Error('after must be defined within a describe block');
        }
        currentSuite.teardown = callback;
    }

    /**
     * Run a single test with improved error handling
     */
    async function runTest(test, suite) {
        const startTime = performance.now();
        let result = {
            name: test.name,
            status: 'passed',
            error: null,
            duration: 0
        };

        try {
            // Skip test if marked
            if (test.skip) {
                result.status = 'skipped';
                return result;
            }

            // Run beforeEach hook with error handling
            if (suite.beforeEach) {
                try {
                    await suite.beforeEach();
                } catch (beforeError) {
                    console.error(`BeforeEach error in "${test.name}":`, beforeError);
                    throw new Error(`BeforeEach failed: ${beforeError.message}`);
                }
            }

            // Run the actual test with timeout protection
            try {
                await Promise.race([
                    test.callback(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Test timeout after 10 seconds')), 10000)
                    )
                ]);
                result.status = 'passed';
            } catch (testError) {
                console.error(`Test "${test.name}" failed:`, testError);
                result.status = 'failed';
                result.error = testError;
            }

        } catch (error) {
            result.status = 'failed';
            result.error = error;
        } finally {
            // Run afterEach hook with error handling
            try {
                if (suite.afterEach) {
                    await suite.afterEach();
                }
            } catch (cleanupError) {
                console.warn(`Cleanup error in "${test.name}":`, cleanupError);
            }

            result.duration = performance.now() - startTime;
        }

        return result;
    }

    /**
     * Run a test suite with improved setup handling
     */
    async function runSuite(suite, options = {}) {
        const suiteResult = {
            name: suite.name,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };

        const startTime = performance.now();

        try {
            // Run suite setup with proper error handling
            if (suite.setup) {
                console.log(`Running setup for suite: ${suite.name}`);
                try {
                    await suite.setup();
                    console.log(`Setup completed for suite: ${suite.name}`);
                } catch (setupError) {
                    console.error(`Setup failed for suite "${suite.name}":`, setupError);
                    throw new Error(`Suite setup failed: ${setupError.message}`);
                }
            }

            // Add a small delay to ensure setup is fully complete
            await new Promise(resolve => setTimeout(resolve, 10));

            // Run all tests in the suite
            for (const test of suite.tests) {
                const testResult = await runTest(test, suite);
                suiteResult.tests.push(testResult);

                // Update counters
                if (testResult.status === 'passed') {
                    suiteResult.passed++;
                    results.passed++;
                } else if (testResult.status === 'failed') {
                    suiteResult.failed++;
                    results.failed++;
                    
                    // Stop on first failure if requested
                    if (options.stopOnFirstFailure) {
                        console.log(`Stopping on first failure: ${testResult.name}`);
                        break;
                    }
                } else if (testResult.status === 'skipped') {
                    suiteResult.skipped++;
                    results.skipped++;
                }

                results.total++;

                // Report progress
                if (options.onProgress) {
                    options.onProgress(testResult, suiteResult);
                }
            }

        } catch (suiteError) {
            console.error(`Suite "${suite.name}" failed:`, suiteError);
            // Mark all remaining tests as failed if setup failed
            for (let i = suiteResult.tests.length; i < suite.tests.length; i++) {
                const failedTest = {
                    name: suite.tests[i].name,
                    status: 'failed',
                    error: new Error(`Suite setup failed: ${suiteError.message}`),
                    duration: 0
                };
                suiteResult.tests.push(failedTest);
                suiteResult.failed++;
                results.failed++;
                results.total++;
            }
        } finally {
            // Run suite teardown
            try {
                if (suite.teardown) {
                    console.log(`Running teardown for suite: ${suite.name}`);
                    await suite.teardown();
                }
            } catch (teardownError) {
                console.warn(`Suite teardown error in "${suite.name}":`, teardownError);
            }

            suiteResult.duration = performance.now() - startTime;
        }

        return suiteResult;
    }

    /**
     * Run all test suites
     */
    async function runAllTests(options = {}) {
        if (isRunning) {
            throw new Error('Tests are already running');
        }

        isRunning = true;

        // Reset results
        results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            suites: new Map()
        };

        console.log('TestFramework: Starting test execution...');

        try {
            // Run each suite
            for (const [suiteName, suite] of testSuites) {
                if (options.onSuiteStart) {
                    options.onSuiteStart(suite);
                }

                console.log(`TestFramework: Running suite "${suiteName}" with ${suite.tests.length} tests`);
                const suiteResult = await runSuite(suite, options);
                results.suites.set(suiteName, suiteResult);

                if (options.onSuiteComplete) {
                    options.onSuiteComplete(suiteResult);
                }

                // Stop if requested and there are failures
                if (options.stopOnFirstFailure && suiteResult.failed > 0) {
                    console.log('Stopping test execution due to failures');
                    break;
                }
            }

            console.log(`TestFramework: Test execution complete. ${results.passed}/${results.total} passed`);

        } finally {
            isRunning = false;
        }

        return results;
    }

    /**
     * Get test results
     */
    function getResults() {
        return { ...results };
    }

    /**
     * Clear all test results
     */
    function clearResults() {
        results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            suites: new Map()
        };
    }

    // Public API
    return {
        // Test definition
        describe,
        it,
        xit,
        beforeEach,
        afterEach,
        before,
        after,

        // Assertions
        assert,
        AssertionError,

        // Mocking
        mock,

        // Test execution
        runAllTests,
        getResults,
        clearResults,

        // State
        get isRunning() { return isRunning; },
        get testSuites() { return testSuites; }
    };
})();

// Export to global scope
window.TestFramework = TestFramework;

// Convenience aliases
window.describe = TestFramework.describe;
window.it = TestFramework.it;
window.xit = TestFramework.xit;
window.beforeEach = TestFramework.beforeEach;
window.afterEach = TestFramework.afterEach;
window.before = TestFramework.before;
window.after = TestFramework.after;
window.assert = TestFramework.assert;
window.mock = TestFramework.mock;
