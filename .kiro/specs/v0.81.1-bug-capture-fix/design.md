# Design Document

## Overview

This design addresses the screenshot capture bug in the feedback modal where the modal overlay is captured instead of the underlying page content. The solution implements a close-capture-reopen flow that temporarily closes the modal, captures the page, and reopens the modal with the screenshot attached while preserving all form state.

## Architecture

The fix involves modifications to two existing components:

1. **FeedbackModal** (`components/feedback/feedback-modal.tsx`) - Will expose modal control and form state to the screenshot capture component
2. **ScreenshotCapture** (`components/feedback/screenshot-capture.tsx`) - Will implement the close-capture-reopen flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FeedbackModal                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Form State                            │    │
│  │  (title, description, severity, screenshots, etc.)       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ScreenshotCapture Component                 │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │           handleCaptureWithModalClose            │    │    │
│  │  │  1. Store form state reference                   │    │    │
│  │  │  2. Close modal (onOpenChange(false))            │    │    │
│  │  │  3. Wait 150ms                                   │    │    │
│  │  │  4. Capture with html2canvas                     │    │    │
│  │  │  5. Add screenshot to array                      │    │    │
│  │  │  6. Reopen modal (onOpenChange(true))            │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Updated ScreenshotCapture Props

```typescript
interface ScreenshotCaptureProps {
  screenshots: ScreenshotData[];
  onScreenshotsChange: (screenshots: ScreenshotData[]) => void;
  maxScreenshots?: number;
  // New props for modal control
  onModalClose?: () => void;
  onModalOpen?: () => void;
}
```

### Capturing Overlay Component

A new overlay component will be rendered at the root level to show capture progress:

```typescript
interface CaptureOverlayProps {
  isCapturing: boolean;
}
```

### Updated FeedbackModal Interface

The modal will pass callbacks to control its open state:

```typescript
// In FeedbackModal, pass to ScreenshotCapture:
<ScreenshotCapture
  screenshots={screenshots}
  onScreenshotsChange={setScreenshots}
  maxScreenshots={5}
  onModalClose={() => onOpenChange(false)}
  onModalOpen={() => onOpenChange(true)}
/>
```

## Data Models

### Form State Structure

The form state that must be preserved during capture:

```typescript
interface FeedbackFormState {
  activeTab: FeedbackType;
  title: string;
  description: string;
  severity?: Severity;
  priority?: Priority;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  currentBehavior: string;
  desiredBehavior: string;
  businessJustification: string;
  affectedModule?: string;
  screenshots: ScreenshotData[];
}
```

### Screenshot Data (Existing)

```typescript
interface ScreenshotData {
  dataUrl: string;
  filename: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Form State Round Trip Preservation

*For any* valid form state before capture, after the capture flow completes (regardless of success or failure), the form state should be identical to the original state (excluding the screenshots array which may have a new entry on success).

**Validates: Requirements 2.1, 2.2**

### Property 2: Screenshot Addition on Success

*For any* successful screenshot capture, the screenshots array length should increase by exactly 1, and the new screenshot should have a dataUrl starting with "data:image/png".

**Validates: Requirements 1.5, 4.4**

### Property 3: Modal State Cycle

*For any* capture operation, the modal should transition from open → closed → open, ensuring the modal is always reopened after capture regardless of success or failure.

**Validates: Requirements 1.1, 1.5, 1.6**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| html2canvas import fails | Show error toast, reopen modal, preserve form state |
| html2canvas capture fails | Show error toast, reopen modal, preserve form state |
| Screenshot exceeds size limit | Show warning toast, still add screenshot |
| Maximum screenshots reached | Disable capture button, show info message |

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Capture button disabled when max screenshots reached**
2. **Error toast shown on capture failure**
3. **Success toast shown on capture success**
4. **Overlay displays during capture**
5. **html2canvas configuration includes correct options**

### Property-Based Tests

Property-based tests will use `fast-check` to verify universal properties:

1. **Form state preservation** - Generate random form states, simulate capture, verify state unchanged
2. **Screenshot array growth** - For successful captures, verify array grows by exactly 1
3. **PNG format validation** - All captured screenshots have valid PNG data URLs

### Test Configuration

- Property tests: minimum 100 iterations
- Testing framework: Vitest with fast-check
- Tag format: **Feature: bug-capture-fix, Property N: [property description]**

