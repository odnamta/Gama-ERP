# Implementation Plan: Bug Capture Screenshot Fix

## Overview

This implementation fixes the screenshot capture functionality in the feedback modal by implementing a close-capture-reopen flow. The fix ensures the page content behind the modal is captured instead of the modal overlay itself.

## Tasks

- [x] 1. Update ScreenshotCapture component with modal control
  - [x] 1.1 Add modal control props to ScreenshotCapture interface
    - Add `onModalClose?: () => void` prop
    - Add `onModalOpen?: () => void` prop
    - _Requirements: 1.1, 1.5_

  - [x] 1.2 Implement close-capture-reopen flow in handleCapture
    - Close modal instantly before capture
    - Wait 150ms for modal to fully close
    - Capture page content with html2canvas
    - Reopen modal after capture completes
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 1.3 Add ignoreElements configuration to exclude overlays
    - Configure html2canvas to ignore modal overlays
    - Ignore elements with role="dialog"
    - Ignore elements with modal-related classes
    - _Requirements: 1.4, 4.3_

  - [x] 1.4 Add success toast notification on capture
    - Show "Screenshot captured!" toast on success
    - _Requirements: 3.3_

  - [x] 1.5 Write property test for screenshot addition
    - **Property 2: Screenshot Addition on Success**
    - **Validates: Requirements 1.5, 4.4**

- [x] 2. Update FeedbackModal to pass modal control callbacks
  - [x] 2.1 Pass onModalClose and onModalOpen to ScreenshotCapture
    - Wire onOpenChange(false) to onModalClose
    - Wire onOpenChange(true) to onModalOpen
    - _Requirements: 1.1, 1.5_

  - [x] 2.2 Write property test for form state preservation
    - **Property 1: Form State Round Trip Preservation**
    - **Validates: Requirements 2.1, 2.2**

- [x] 3. Add capturing overlay indicator
  - [x] 3.1 Create CaptureOverlay component
    - Full-screen overlay with loading spinner
    - "Capturing screenshot..." text
    - Render using portal to document body
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.2 Integrate CaptureOverlay with ScreenshotCapture
    - Show overlay when isCapturing is true
    - Hide overlay when capture completes
    - _Requirements: 3.1, 3.4_

- [x] 4. Checkpoint - Verify screenshot capture works correctly
  - Ensure all tests pass, ask the user if questions arise.
  - Manual test: Open feedback modal, click capture, verify page is captured not modal

- [x] 5. Write property test for modal state cycle
  - **Property 3: Modal State Cycle**
  - **Validates: Requirements 1.1, 1.5, 1.6**

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- The fix preserves backward compatibility - if modal control props are not provided, capture works as before (capturing modal)
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

