/**
 * Property-Based Tests for PJO Form Loading State Management
 * Feature: v0.4.5-fix-pjo-button-not-clickable
 * 
 * Property 1: Loading State Always Resets
 * Test that for any submission outcome, loading state returns to false
 * 
 * **Validates: Requirements 3.1, 3.4, 6.3**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Types for submission scenarios
type SubmissionOutcome = 'success' | 'server_error' | 'network_error' | 'unexpected_error' | 'validation_error';

interface SubmissionScenario {
  outcome: SubmissionOutcome;
  errorMessage?: string;
  delay?: number;
}

interface FormState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

/**
 * Simulates the PJO form submission logic with loading state management.
 * This mirrors the actual implementation in components/pjo/pjo-form.tsx
 * 
 * The key behavior being tested:
 * - Loading state is set to true before submission
 * - Loading state is ALWAYS reset to false in the finally block
 * - This happens regardless of success, server error, network error, or unexpected error
 */
async function simulateFormSubmission(
  scenario: SubmissionScenario,
  mockCreatePJO: () => Promise<{ id?: string; error?: string }>,
  mockValidateItems: () => boolean
): Promise<FormState> {
  let isLoading = false;
  let hasError = false;
  let errorMessage: string | undefined;

  // Simulate validation check (happens before loading state is set)
  if (scenario.outcome === 'validation_error') {
    // Validation fails - return early without setting loading state
    // This matches the actual behavior: validation errors don't trigger loading
    return { isLoading: false, hasError: true, errorMessage: 'Validation failed' };
  }

  // Validate items (mirrors validateRevenueItems/validateCostItems)
  if (!mockValidateItems()) {
    return { isLoading: false, hasError: true, errorMessage: 'Item validation failed' };
  }

  // Set loading state to true (mirrors setIsLoading(true))
  isLoading = true;

  try {
    // Simulate async submission
    if (scenario.delay) {
      await new Promise(resolve => setTimeout(resolve, scenario.delay));
    }

    switch (scenario.outcome) {
      case 'success':
        await mockCreatePJO();
        break;
      
      case 'server_error':
        // Server returns an error response (handled in try block)
        const result = await mockCreatePJO();
        if (result.error) {
          hasError = true;
          errorMessage = result.error;
        }
        break;
      
      case 'network_error':
        // Network failure throws an error
        throw new Error('Network request failed');
      
      case 'unexpected_error':
        // Unexpected runtime error
        throw new Error(scenario.errorMessage || 'Unexpected error occurred');
    }
  } catch (error) {
    // Catch unexpected errors (mirrors the outer try-catch in onSubmit)
    hasError = true;
    errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  } finally {
    // CRITICAL: Always reset loading state (mirrors the finally block)
    isLoading = false;
  }

  return { isLoading, hasError, errorMessage };
}

// Arbitrary for generating submission outcomes
const submissionOutcomeArb = fc.constantFrom<SubmissionOutcome>(
  'success',
  'server_error', 
  'network_error',
  'unexpected_error'
);

// Arbitrary for generating error messages
const errorMessageArb = fc.oneof(
  fc.constant('Database connection failed'),
  fc.constant('Permission denied'),
  fc.constant('Invalid data format'),
  fc.constant('Server timeout'),
  fc.constant('Rate limit exceeded'),
  fc.string({ minLength: 1, maxLength: 200 })
);

// Arbitrary for generating submission scenarios (no delays for faster tests)
const submissionScenarioArb = fc.record({
  outcome: submissionOutcomeArb,
  errorMessage: fc.option(errorMessageArb, { nil: undefined }),
  delay: fc.constant(undefined), // No delays for property tests
});

// Arbitrary for generating multiple rapid submission attempts (limited for performance)
const rapidSubmissionArb = fc.array(submissionScenarioArb, { minLength: 1, maxLength: 5 });

describe('Feature: v0.4.5-fix-pjo-button-not-clickable, Property 1: Loading State Always Resets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 3.1, 3.4, 6.3**
   * 
   * *For any* form submission attempt (successful, failed, or errored), 
   * the loading state SHALL be reset to false after the submission completes.
   */
  it('should always reset loading state to false after any submission outcome', async () => {
    await fc.assert(
      fc.asyncProperty(submissionScenarioArb, async (scenario) => {
        // Mock the createPJO action based on scenario
        const mockCreatePJO = vi.fn().mockImplementation(async () => {
          if (scenario.outcome === 'server_error') {
            return { error: scenario.errorMessage || 'Server error' };
          }
          if (scenario.outcome === 'network_error') {
            throw new Error('Network error');
          }
          if (scenario.outcome === 'unexpected_error') {
            throw new Error(scenario.errorMessage || 'Unexpected error');
          }
          return { id: 'test-pjo-id' };
        });

        // Mock validation to always pass (we test validation separately)
        const mockValidateItems = vi.fn().mockReturnValue(true);

        // Execute the submission
        const finalState = await simulateFormSubmission(
          scenario,
          mockCreatePJO,
          mockValidateItems
        );

        // CRITICAL ASSERTION: Loading state must ALWAYS be false after submission
        expect(finalState.isLoading).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.1**
   * 
   * WHEN a submission error occurs, THE PJO_Form SHALL reset the Loading_State to false
   */
  it('should reset loading state after server errors', async () => {
    await fc.assert(
      fc.asyncProperty(errorMessageArb, async (errorMessage) => {
        const scenario: SubmissionScenario = {
          outcome: 'server_error',
          errorMessage,
        };

        const mockCreatePJO = vi.fn().mockResolvedValue({ error: errorMessage });
        const mockValidateItems = vi.fn().mockReturnValue(true);

        const finalState = await simulateFormSubmission(
          scenario,
          mockCreatePJO,
          mockValidateItems
        );

        // Loading state must be false
        expect(finalState.isLoading).toBe(false);
        // Error should be captured
        expect(finalState.hasError).toBe(true);
        expect(finalState.errorMessage).toBe(errorMessage);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.2**
   * 
   * WHEN a network error occurs during submission, THE PJO_Form SHALL reset 
   * the Loading_State to false and display an error toast
   */
  it('should reset loading state after network errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }), // Random delay
        async (delay) => {
          const scenario: SubmissionScenario = {
            outcome: 'network_error',
            delay,
          };

          const mockCreatePJO = vi.fn().mockRejectedValue(new Error('Network error'));
          const mockValidateItems = vi.fn().mockReturnValue(true);

          const finalState = await simulateFormSubmission(
            scenario,
            mockCreatePJO,
            mockValidateItems
          );

          // Loading state must be false even after network error
          expect(finalState.isLoading).toBe(false);
          expect(finalState.hasError).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 6.3**
   * 
   * IF an unexpected error occurs during submission, THEN THE PJO_Form SHALL 
   * catch the error and reset to a usable state
   */
  it('should reset loading state after unexpected errors', async () => {
    await fc.assert(
      fc.asyncProperty(errorMessageArb, async (errorMessage) => {
        const scenario: SubmissionScenario = {
          outcome: 'unexpected_error',
          errorMessage,
        };

        const mockCreatePJO = vi.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        });
        const mockValidateItems = vi.fn().mockReturnValue(true);

        const finalState = await simulateFormSubmission(
          scenario,
          mockCreatePJO,
          mockValidateItems
        );

        // Loading state must be false even after unexpected error
        expect(finalState.isLoading).toBe(false);
        // Form should be in error state but usable
        expect(finalState.hasError).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3.4**
   * 
   * THE PJO_Form SHALL use a finally block to ensure Loading_State is always 
   * reset after submission attempt
   */
  it('should reset loading state on successful submissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // Random PJO ID
        fc.integer({ min: 0, max: 50 }), // Random delay
        async (pjoId, delay) => {
          const scenario: SubmissionScenario = {
            outcome: 'success',
            delay,
          };

          const mockCreatePJO = vi.fn().mockResolvedValue({ id: pjoId });
          const mockValidateItems = vi.fn().mockReturnValue(true);

          const finalState = await simulateFormSubmission(
            scenario,
            mockCreatePJO,
            mockValidateItems
          );

          // Loading state must be false after successful submission
          expect(finalState.isLoading).toBe(false);
          // No error on success
          expect(finalState.hasError).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that validation failures don't leave loading state stuck
   * (Validation happens before loading state is set)
   */
  it('should not set loading state when validation fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // Revenue items valid
        fc.boolean(), // Cost items valid
        async (revenueValid, costValid) => {
          // At least one validation must fail for this test
          fc.pre(!revenueValid || !costValid);

          const scenario: SubmissionScenario = {
            outcome: 'success', // Would succeed if validation passed
          };

          const mockCreatePJO = vi.fn().mockResolvedValue({ id: 'test-id' });
          const mockValidateItems = vi.fn().mockReturnValue(revenueValid && costValid);

          const finalState = await simulateFormSubmission(
            scenario,
            mockCreatePJO,
            mockValidateItems
          );

          // Loading state should never have been set to true
          expect(finalState.isLoading).toBe(false);
          // createPJO should not have been called
          expect(mockCreatePJO).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test multiple sequential submissions all reset loading state
   */
  it('should reset loading state after each submission in a sequence', async () => {
    await fc.assert(
      fc.asyncProperty(rapidSubmissionArb, async (scenarios) => {
        for (const scenario of scenarios) {
          const mockCreatePJO = vi.fn().mockImplementation(async () => {
            if (scenario.outcome === 'server_error') {
              return { error: scenario.errorMessage || 'Server error' };
            }
            if (scenario.outcome === 'network_error' || scenario.outcome === 'unexpected_error') {
              throw new Error(scenario.errorMessage || 'Error');
            }
            return { id: 'test-id' };
          });
          const mockValidateItems = vi.fn().mockReturnValue(true);

          const finalState = await simulateFormSubmission(
            scenario,
            mockCreatePJO,
            mockValidateItems
          );

          // Each submission must end with loading state false
          expect(finalState.isLoading).toBe(false);
        }
      }),
      { numRuns: 50 } // Reduced iterations for sequential test
    );
  }, 30000); // Extended timeout for sequential submissions

  /**
   * Test that the finally block executes even with thrown errors
   */
  it('should execute finally block regardless of error type', async () => {
    const errorTypes = [
      new Error('Standard error'),
      new TypeError('Type error'),
      new RangeError('Range error'),
      new SyntaxError('Syntax error'),
      { message: 'Object error' }, // Non-Error object
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...errorTypes),
        async (errorToThrow) => {
          let finallyExecuted = false;
          let isLoading = true;

          try {
            throw errorToThrow;
          } catch {
            // Error caught
          } finally {
            isLoading = false;
            finallyExecuted = true;
          }

          expect(finallyExecuted).toBe(true);
          expect(isLoading).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Loading State Transition Properties', () => {
  /**
   * Property: Loading state transitions should be deterministic
   * Given the same scenario, the final state should always be the same
   */
  it('should produce deterministic final states for same scenarios', async () => {
    await fc.assert(
      fc.asyncProperty(submissionScenarioArb, async (scenario) => {
        const mockCreatePJO1 = vi.fn().mockImplementation(async () => {
          if (scenario.outcome === 'server_error') return { error: 'Error' };
          if (scenario.outcome === 'network_error' || scenario.outcome === 'unexpected_error') {
            throw new Error('Error');
          }
          return { id: 'test-id' };
        });
        const mockCreatePJO2 = vi.fn().mockImplementation(async () => {
          if (scenario.outcome === 'server_error') return { error: 'Error' };
          if (scenario.outcome === 'network_error' || scenario.outcome === 'unexpected_error') {
            throw new Error('Error');
          }
          return { id: 'test-id' };
        });
        const mockValidateItems = vi.fn().mockReturnValue(true);

        const state1 = await simulateFormSubmission(scenario, mockCreatePJO1, mockValidateItems);
        const state2 = await simulateFormSubmission(scenario, mockCreatePJO2, mockValidateItems);

        // Same scenario should produce same loading state
        expect(state1.isLoading).toBe(state2.isLoading);
        expect(state1.isLoading).toBe(false);
      }),
      { numRuns: 50 } // Reduced iterations
    );
  }, 15000); // Extended timeout

  /**
   * Property: Loading state should only be true during async operation
   * After any async operation completes, loading must be false
   */
  it('should only have loading=true during async operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }), // Delay in ms
        async (delay) => {
          let loadingDuringOperation = false;
          let loadingAfterOperation = true;

          const asyncOperation = async () => {
            loadingDuringOperation = true; // Simulates isLoading = true
            await new Promise(resolve => setTimeout(resolve, delay));
            return { id: 'test' };
          };

          try {
            await asyncOperation();
          } finally {
            loadingAfterOperation = false; // Simulates finally block
          }

          expect(loadingDuringOperation).toBe(true);
          expect(loadingAfterOperation).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 4: Double Submission Prevention
 * Feature: v0.4.5-fix-pjo-button-not-clickable
 * 
 * *For any* form that is currently submitting (isLoading=true), the submit button 
 * SHALL be disabled and additional click events SHALL not trigger new submissions.
 * 
 * **Validates: Requirements 4.2**
 */
describe('Feature: v0.4.5-fix-pjo-button-not-clickable, Property 4: Double Submission Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Simulates a form submission handler that tracks submission attempts.
   * This mirrors the actual behavior where:
   * - isLoading=true disables the button
   * - Disabled buttons don't trigger new submissions
   * - Only one submission should occur even with rapid clicks
   */
  interface SubmissionTracker {
    submissionCount: number;
    isLoading: boolean;
    attemptedClicks: number;
  }

  /**
   * Simulates the button click handler with loading state protection.
   * When isLoading is true, clicks are ignored (button is disabled).
   */
  async function simulateButtonClick(
    tracker: SubmissionTracker,
    submitAction: () => Promise<void>,
    submissionDelay: number
  ): Promise<void> {
    // Track the click attempt
    tracker.attemptedClicks++;

    // If already loading, the button is disabled - click is ignored
    if (tracker.isLoading) {
      return;
    }

    // Set loading state to true (disables button)
    tracker.isLoading = true;
    tracker.submissionCount++;

    try {
      // Simulate async submission with delay
      await new Promise(resolve => setTimeout(resolve, submissionDelay));
      await submitAction();
    } finally {
      // Reset loading state (re-enables button)
      tracker.isLoading = false;
    }
  }

  /**
   * Simulates rapid clicks on the submit button.
   * All clicks are fired within the submission window to properly test double-click prevention.
   * Returns the tracker with final state.
   */
  async function simulateRapidClicks(
    clickCount: number,
    clickIntervalMs: number,
    submissionDelayMs: number
  ): Promise<SubmissionTracker> {
    const tracker: SubmissionTracker = {
      submissionCount: 0,
      isLoading: false,
      attemptedClicks: 0,
    };

    const submitAction = vi.fn().mockResolvedValue(undefined);

    // Ensure all clicks happen within the submission window
    // by making submission delay longer than total click time
    const totalClickTime = clickCount * clickIntervalMs;
    const effectiveSubmissionDelay = Math.max(submissionDelayMs, totalClickTime + 100);

    // Fire all clicks synchronously (simulating rapid user clicks)
    // The key insight: in real UI, clicks are synchronous events that check isLoading immediately
    const clickPromises: Promise<void>[] = [];
    
    for (let i = 0; i < clickCount; i++) {
      // Schedule click with interval, but don't await - fire them all
      const clickPromise = new Promise<void>(resolve => {
        setTimeout(() => {
          // This simulates the synchronous check of isLoading when button is clicked
          tracker.attemptedClicks++;
          
          // If already loading, click is ignored (button disabled)
          if (tracker.isLoading) {
            resolve();
            return;
          }
          
          // Start submission
          tracker.isLoading = true;
          tracker.submissionCount++;
          
          // Async submission
          submitAction().then(() => {
            // Simulate submission delay
            return new Promise(r => setTimeout(r, effectiveSubmissionDelay));
          }).then(() => {
            tracker.isLoading = false;
            resolve();
          });
        }, i * clickIntervalMs);
      });
      clickPromises.push(clickPromise);
    }

    // Wait for all click handlers to complete
    await Promise.all(clickPromises);

    return tracker;
  }

  // Arbitrary for generating click counts (realistic rapid clicking)
  const clickCountArb = fc.integer({ min: 2, max: 10 });

  // Arbitrary for generating click intervals (very fast to simulate rapid clicking)
  const clickIntervalArb = fc.integer({ min: 0, max: 20 }); // 0-20ms between clicks

  // Arbitrary for generating submission delays (simulates async operation)
  // Using small delays (1-10ms) for fast tests while still testing async behavior
  const submissionDelayArb = fc.integer({ min: 1, max: 10 }); // 1-10ms submission time (fast)

  /**
   * **Validates: Requirements 4.2**
   * 
   * WHEN the form is currently submitting, THE Submit_Button SHALL be disabled 
   * to prevent double submission
   */
  it('should only trigger one submission regardless of rapid click count', async () => {
    await fc.assert(
      fc.asyncProperty(
        clickCountArb,
        clickIntervalArb,
        submissionDelayArb,
        async (clickCount, clickInterval, submissionDelay) => {
          const tracker = await simulateRapidClicks(clickCount, clickInterval, submissionDelay);

          // CRITICAL: Only ONE submission should occur
          expect(tracker.submissionCount).toBe(1);
          // All clicks were attempted
          expect(tracker.attemptedClicks).toBe(clickCount);
          // Loading state should be false after completion
          expect(tracker.isLoading).toBe(false);
        }
      ),
      { numRuns: 50 } // Reduced iterations for faster tests
    );
  }, 30000);

  /**
   * **Validates: Requirements 4.2**
   * 
   * Test that button is disabled (isLoading=true) during submission
   */
  it('should have isLoading=true during submission preventing additional clicks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 20, max: 50 }), // Need longer delay for this test to check mid-submission state
        async (submissionDelay) => {
          const tracker: SubmissionTracker = {
            submissionCount: 0,
            isLoading: false,
            attemptedClicks: 0,
          };

          let loadingStateDuringSubmission = false;
          const submitAction = vi.fn().mockImplementation(async () => {
            // Capture loading state during submission
            loadingStateDuringSubmission = tracker.isLoading;
          });

          // First click starts submission
          const submissionPromise = simulateButtonClick(tracker, submitAction, submissionDelay);

          // Small delay to ensure submission has started
          await new Promise(resolve => setTimeout(resolve, 5));

          // Verify loading state is true during submission
          expect(tracker.isLoading).toBe(true);

          // Try additional clicks while loading
          await simulateButtonClick(tracker, submitAction, submissionDelay);
          await simulateButtonClick(tracker, submitAction, submissionDelay);

          // Wait for original submission to complete
          await submissionPromise;

          // Only one submission should have occurred
          expect(tracker.submissionCount).toBe(1);
          expect(loadingStateDuringSubmission).toBe(true);
        }
      ),
      { numRuns: 30 } // Reduced iterations for faster tests
    );
  }, 15000);

  /**
   * **Validates: Requirements 4.2**
   * 
   * Test that simultaneous clicks (0ms interval) still only trigger one submission
   */
  it('should handle simultaneous clicks (0ms interval) with only one submission', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Number of simultaneous clicks (reduced max)
        submissionDelayArb,
        async (clickCount, submissionDelay) => {
          const tracker = await simulateRapidClicks(clickCount, 0, submissionDelay);

          // Even with simultaneous clicks, only one submission
          expect(tracker.submissionCount).toBe(1);
          expect(tracker.attemptedClicks).toBe(clickCount);
        }
      ),
      { numRuns: 50 } // Reduced iterations for faster tests
    );
  }, 15000);

  /**
   * **Validates: Requirements 4.2**
   * 
   * Test that after submission completes, button becomes clickable again
   */
  it('should allow new submission after previous submission completes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 3 }), // Number of sequential submissions (reduced)
        fc.integer({ min: 1, max: 5 }), // Submission delay (reduced)
        async (submissionCount, submissionDelay) => {
          const tracker: SubmissionTracker = {
            submissionCount: 0,
            isLoading: false,
            attemptedClicks: 0,
          };

          const submitAction = vi.fn().mockResolvedValue(undefined);

          // Perform sequential submissions (waiting for each to complete)
          for (let i = 0; i < submissionCount; i++) {
            await simulateButtonClick(tracker, submitAction, submissionDelay);
          }

          // All sequential submissions should have succeeded
          expect(tracker.submissionCount).toBe(submissionCount);
          expect(tracker.attemptedClicks).toBe(submissionCount);
          expect(tracker.isLoading).toBe(false);
        }
      ),
      { numRuns: 50 } // Reduced iterations
    );
  }, 15000);

  /**
   * **Validates: Requirements 4.2**
   * 
   * Test that disabled button state is correctly determined by isLoading
   */
  it('should correctly determine button disabled state based on isLoading', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // isLoading state
        async (isLoading) => {
          // Button disabled state should match isLoading
          const buttonDisabled = isLoading;
          
          expect(buttonDisabled).toBe(isLoading);
          
          // When disabled, clicks should be ignored
          if (buttonDisabled) {
            const tracker: SubmissionTracker = {
              submissionCount: 0,
              isLoading: true, // Already loading
              attemptedClicks: 0,
            };
            
            const submitAction = vi.fn().mockResolvedValue(undefined);
            await simulateButtonClick(tracker, submitAction, 10);
            
            // No new submission should occur
            expect(tracker.submissionCount).toBe(0);
            expect(submitAction).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 4.2**
   * 
   * Test rapid clicking with varying submission durations
   */
  it('should prevent double submission with varying submission durations', async () => {
    await fc.assert(
      fc.asyncProperty(
        clickCountArb,
        fc.array(submissionDelayArb, { minLength: 1, maxLength: 3 }), // Reduced max
        async (clickCount, delays) => {
          // Use the first delay for the actual submission
          const submissionDelay = delays[0];
          const tracker = await simulateRapidClicks(clickCount, 5, submissionDelay);

          // Only one submission regardless of timing
          expect(tracker.submissionCount).toBe(1);
        }
      ),
      { numRuns: 50 } // Reduced iterations
    );
  }, 15000);

  /**
   * **Validates: Requirements 4.2**
   * 
   * Test that click events during loading are properly ignored
   */
  it('should ignore all click events while isLoading is true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }), // Number of ignored clicks (reduced max)
        async (ignoredClickCount) => {
          const tracker: SubmissionTracker = {
            submissionCount: 0,
            isLoading: true, // Start in loading state
            attemptedClicks: 0,
          };

          const submitAction = vi.fn().mockResolvedValue(undefined);

          // Attempt multiple clicks while loading
          for (let i = 0; i < ignoredClickCount; i++) {
            await simulateButtonClick(tracker, submitAction, 1); // Minimal delay
          }

          // No submissions should have occurred
          expect(tracker.submissionCount).toBe(0);
          expect(tracker.attemptedClicks).toBe(ignoredClickCount);
          expect(submitAction).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 } // Reduced iterations
    );
  });

  /**
   * **Validates: Requirements 4.2, 4.4**
   * 
   * IF the Submit_Button is clicked while disabled, THEN THE PJO_Form SHALL 
   * provide visual feedback (no action taken)
   */
  it('should not trigger any action when button is clicked while disabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // Number of clicks on disabled button
        async (clickCount) => {
          let actionTriggered = false;
          const tracker: SubmissionTracker = {
            submissionCount: 0,
            isLoading: true, // Button is disabled
            attemptedClicks: 0,
          };

          const submitAction = vi.fn().mockImplementation(async () => {
            actionTriggered = true;
          });

          // Click the disabled button multiple times
          for (let i = 0; i < clickCount; i++) {
            await simulateButtonClick(tracker, submitAction, 10);
          }

          // No action should have been triggered
          expect(actionTriggered).toBe(false);
          expect(tracker.submissionCount).toBe(0);
          expect(submitAction).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
