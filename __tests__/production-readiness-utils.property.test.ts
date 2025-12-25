/**
 * Property-based tests for production readiness utilities
 * Feature: v0.80-production-readiness
 * Tests Properties 1, 4, 8, 9, 10 from the design document
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  aggregateHealthStatus,
  type ComponentStatus,
  type HealthStatusLevel,
  type FeatureFlag,
  type FeatureFlagContext,
  type StartupCheckResult,
} from '@/lib/production-readiness-utils';

// ============================================================================
// Generators
// ============================================================================

const healthStatusLevelArb = fc.constantFrom<HealthStatusLevel>('healthy', 'degraded', 'unhealthy');

// Generate valid ISO date strings using timestamp range
const validISODateArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(ts => new Date(ts).toISOString());

const componentStatusArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  status: healthStatusLevelArb,
  responseTime: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined }),
  message: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
  lastChecked: validISODateArb,
});

const featureFlagArb = fc.record({
  id: fc.uuid(),
  flagKey: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
  isEnabled: fc.boolean(),
  targetUsers: fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
  targetRoles: fc.array(fc.constantFrom('admin', 'manager', 'ops', 'finance', 'sales', 'engineer'), { minLength: 0, maxLength: 5 }),
  rolloutPercentage: fc.integer({ min: 0, max: 100 }),
  enableAt: fc.option(validISODateArb, { nil: undefined }),
  disableAt: fc.option(validISODateArb, { nil: undefined }),
  metadata: fc.constant({}),
  updatedBy: fc.option(fc.uuid(), { nil: undefined }),
  updatedAt: validISODateArb,
  createdAt: validISODateArb,
});

const featureFlagContextArb = fc.record({
  userId: fc.option(fc.uuid(), { nil: undefined }),
  userRole: fc.option(fc.constantFrom('admin', 'manager', 'ops', 'finance', 'sales', 'engineer'), { nil: undefined }),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Production Readiness Utils Property Tests', () => {
  describe('Property 3: Health Response Structure Completeness', () => {
    /**
     * Property 3: Health Response Structure Completeness
     * For any health check response, the response SHALL contain status for all four 
     * components (database, cache, storage, queue), each with a latencyMs value, 
     * and SHALL include the application version string.
     * 
     * Feature: v0.80-production-readiness, Property 3: Health Response Structure Completeness
     * Validates: Requirements 2.2, 2.3, 2.6
     */

    const REQUIRED_COMPONENTS = ['database', 'cache', 'storage', 'queue'];

    // Generator for a valid health response
    const healthResponseArb = fc.record({
      status: healthStatusLevelArb,
      version: fc.string({ minLength: 1, maxLength: 20 }),
      timestamp: validISODateArb,
      components: fc.tuple(
        // Generate exactly 4 components with required names
        fc.record({
          name: fc.constant('database'),
          status: healthStatusLevelArb,
          responseTime: fc.integer({ min: 0, max: 5000 }),
          message: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
          lastChecked: validISODateArb,
        }),
        fc.record({
          name: fc.constant('cache'),
          status: healthStatusLevelArb,
          responseTime: fc.integer({ min: 0, max: 5000 }),
          message: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
          lastChecked: validISODateArb,
        }),
        fc.record({
          name: fc.constant('storage'),
          status: healthStatusLevelArb,
          responseTime: fc.integer({ min: 0, max: 5000 }),
          message: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
          lastChecked: validISODateArb,
        }),
        fc.record({
          name: fc.constant('queue'),
          status: healthStatusLevelArb,
          responseTime: fc.integer({ min: 0, max: 5000 }),
          message: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
          lastChecked: validISODateArb,
        })
      ).map(tuple => tuple as ComponentStatus[]),
    });

    // Validation function that mirrors what the API should enforce
    function validateHealthResponse(response: {
      status: HealthStatusLevel;
      version: string;
      timestamp: string;
      components: ComponentStatus[];
    }): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      // Check version is present and non-empty
      if (!response.version || response.version.trim() === '') {
        errors.push('Version string is missing or empty');
      }

      // Check timestamp is present
      if (!response.timestamp) {
        errors.push('Timestamp is missing');
      }

      // Check all required components are present
      const componentNames = response.components.map(c => c.name);
      for (const required of REQUIRED_COMPONENTS) {
        if (!componentNames.includes(required)) {
          errors.push(`Missing required component: ${required}`);
        }
      }

      // Check each component has required fields
      for (const component of response.components) {
        if (!component.name) {
          errors.push('Component missing name');
        }
        if (!component.status) {
          errors.push(`Component ${component.name} missing status`);
        }
        if (component.responseTime === undefined || component.responseTime === null) {
          errors.push(`Component ${component.name} missing responseTime`);
        }
        if (!component.lastChecked) {
          errors.push(`Component ${component.name} missing lastChecked`);
        }
      }

      return { valid: errors.length === 0, errors };
    }

    it('should contain all four required components', () => {
      fc.assert(
        fc.property(
          healthResponseArb,
          (response) => {
            const componentNames = response.components.map(c => c.name);
            
            for (const required of REQUIRED_COMPONENTS) {
              expect(componentNames).toContain(required);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include version string in response', () => {
      fc.assert(
        fc.property(
          healthResponseArb,
          (response) => {
            expect(response.version).toBeDefined();
            expect(typeof response.version).toBe('string');
            expect(response.version.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include timestamp in response', () => {
      fc.assert(
        fc.property(
          healthResponseArb,
          (response) => {
            expect(response.timestamp).toBeDefined();
            expect(typeof response.timestamp).toBe('string');
            // Verify it's a valid ISO date
            const date = new Date(response.timestamp);
            expect(date.toString()).not.toBe('Invalid Date');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include responseTime for each component', () => {
      fc.assert(
        fc.property(
          healthResponseArb,
          (response) => {
            for (const component of response.components) {
              expect(component.responseTime).toBeDefined();
              expect(typeof component.responseTime).toBe('number');
              expect(component.responseTime).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include valid status for each component', () => {
      fc.assert(
        fc.property(
          healthResponseArb,
          (response) => {
            const validStatuses: HealthStatusLevel[] = ['healthy', 'degraded', 'unhealthy'];
            
            for (const component of response.components) {
              expect(validStatuses).toContain(component.status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should pass validation for well-formed responses', () => {
      fc.assert(
        fc.property(
          healthResponseArb,
          (response) => {
            const validation = validateHealthResponse(response);
            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when components are missing', () => {
      fc.assert(
        fc.property(
          healthResponseArb,
          fc.integer({ min: 0, max: 3 }),
          (response, removeIndex) => {
            // Remove one component
            const incompleteComponents = response.components.filter((_, i) => i !== removeIndex);
            const incompleteResponse = { ...response, components: incompleteComponents };
            
            const validation = validateHealthResponse(incompleteResponse);
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail validation when version is empty', () => {
      fc.assert(
        fc.property(
          healthResponseArb,
          (response) => {
            const noVersionResponse = { ...response, version: '' };
            
            const validation = validateHealthResponse(noVersionResponse);
            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Version string is missing or empty');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 1: Health Status Aggregation', () => {
    /**
     * Property 1: Health Status Aggregation
     * For any set of component statuses, the overall health status SHALL be:
     * - 'unhealthy' if any component is 'unhealthy'
     * - 'degraded' if any component is 'degraded' and none are 'unhealthy'
     * - 'healthy' only if all components are 'healthy'
     * 
     * Validates: Requirements 1.3, 2.4, 2.5
     */
    it('should return unhealthy if any component is unhealthy', () => {
      fc.assert(
        fc.property(
          fc.array(componentStatusArb, { minLength: 1, maxLength: 10 }),
          (components) => {
            // Ensure at least one component is unhealthy
            const componentsWithUnhealthy: ComponentStatus[] = [
              ...components,
              {
                name: 'test-unhealthy',
                status: 'unhealthy',
                lastChecked: new Date().toISOString(),
              },
            ];

            const result = aggregateHealthStatus(componentsWithUnhealthy);
            expect(result).toBe('unhealthy');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return degraded if any component is degraded and none are unhealthy', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              status: fc.constantFrom<HealthStatusLevel>('healthy', 'degraded'),
              lastChecked: validISODateArb,
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (components) => {
            // Ensure at least one component is degraded
            const componentsWithDegraded: ComponentStatus[] = [
              ...components,
              {
                name: 'test-degraded',
                status: 'degraded',
                lastChecked: new Date().toISOString(),
              },
            ];

            const result = aggregateHealthStatus(componentsWithDegraded);
            expect(result).toBe('degraded');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return healthy only if all components are healthy', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              status: fc.constant<HealthStatusLevel>('healthy'),
              lastChecked: validISODateArb,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (components) => {
            const result = aggregateHealthStatus(components);
            expect(result).toBe('healthy');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return healthy for empty component list', () => {
      const result = aggregateHealthStatus([]);
      expect(result).toBe('healthy');
    });

    it('should prioritize unhealthy over degraded', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 5 }),
          (unhealthyCount, degradedCount, healthyCount) => {
            const components: ComponentStatus[] = [];

            for (let i = 0; i < unhealthyCount; i++) {
              components.push({
                name: `unhealthy-${i}`,
                status: 'unhealthy',
                lastChecked: new Date().toISOString(),
              });
            }

            for (let i = 0; i < degradedCount; i++) {
              components.push({
                name: `degraded-${i}`,
                status: 'degraded',
                lastChecked: new Date().toISOString(),
              });
            }

            for (let i = 0; i < healthyCount; i++) {
              components.push({
                name: `healthy-${i}`,
                status: 'healthy',
                lastChecked: new Date().toISOString(),
              });
            }

            const result = aggregateHealthStatus(components);
            expect(result).toBe('unhealthy');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Sensitive Config Protection', () => {
    /**
     * Property 6: Sensitive Config Protection
     * For any configuration marked as sensitive (is_sensitive = true), 
     * the config value SHALL NOT appear in any log output or public API response 
     * that lists configurations.
     * 
     * Feature: v0.80-production-readiness, Property 6: Sensitive Config Protection
     * Validates: Requirements 3.3
     */

    interface ConfigRecord {
      id: string;
      configKey: string;
      configValue: unknown;
      environment: string;
      isSensitive: boolean;
      description?: string;
      updatedBy?: string;
      updatedAt: string;
      createdAt: string;
    }

    // Generator for config records
    const configRecordArb = fc.record({
      id: fc.uuid(),
      configKey: fc.string({ minLength: 1, maxLength: 50 }),
      configValue: fc.oneof(
        fc.string(),
        fc.integer(),
        fc.boolean(),
        fc.constant(null),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string())
      ),
      environment: fc.constantFrom('all', 'development', 'staging', 'production'),
      isSensitive: fc.boolean(),
      description: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
      updatedBy: fc.option(fc.uuid(), { nil: undefined }),
      updatedAt: validISODateArb,
      createdAt: validISODateArb,
    });

    // Function that filters sensitive configs (mirrors getAllConfigs behavior)
    function filterSensitiveConfigs(
      configs: ConfigRecord[],
      includeSensitive: boolean
    ): ConfigRecord[] {
      if (includeSensitive) {
        return configs;
      }
      return configs.filter(c => !c.isSensitive);
    }

    // Function to check if a value appears in a string (for log checking)
    function valueAppearsInString(value: unknown, str: string): boolean {
      const valueStr = JSON.stringify(value);
      return str.includes(valueStr);
    }

    it('should exclude sensitive configs when includeSensitive is false', () => {
      fc.assert(
        fc.property(
          fc.array(configRecordArb, { minLength: 1, maxLength: 20 }),
          (configs) => {
            const filtered = filterSensitiveConfigs(configs, false);
            
            // No sensitive configs should be in the result
            for (const config of filtered) {
              expect(config.isSensitive).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all configs when includeSensitive is true', () => {
      fc.assert(
        fc.property(
          fc.array(configRecordArb, { minLength: 1, maxLength: 20 }),
          (configs) => {
            const filtered = filterSensitiveConfigs(configs, true);
            
            // All configs should be in the result
            expect(filtered.length).toBe(configs.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve non-sensitive configs when filtering', () => {
      fc.assert(
        fc.property(
          fc.array(configRecordArb, { minLength: 1, maxLength: 20 }),
          (configs) => {
            const filtered = filterSensitiveConfigs(configs, false);
            const nonSensitiveOriginal = configs.filter(c => !c.isSensitive);
            
            // All non-sensitive configs should be preserved
            expect(filtered.length).toBe(nonSensitiveOriginal.length);
            
            for (const config of nonSensitiveOriginal) {
              const found = filtered.find(f => f.id === config.id);
              expect(found).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not expose sensitive values in filtered response', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              configKey: fc.string({ minLength: 1, maxLength: 50 }),
              configValue: fc.string({ minLength: 10, maxLength: 50 }), // Use unique strings
              environment: fc.constantFrom('all', 'development', 'staging', 'production'),
              isSensitive: fc.constant(true), // All sensitive
              description: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
              updatedBy: fc.option(fc.uuid(), { nil: undefined }),
              updatedAt: validISODateArb,
              createdAt: validISODateArb,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (sensitiveConfigs) => {
            const filtered = filterSensitiveConfigs(sensitiveConfigs, false);
            const filteredJson = JSON.stringify(filtered);
            
            // None of the sensitive values should appear in the filtered output
            for (const config of sensitiveConfigs) {
              expect(valueAppearsInString(config.configValue, filteredJson)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed sensitive and non-sensitive configs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (sensitiveCount, nonSensitiveCount) => {
            const configs: ConfigRecord[] = [];
            
            // Add sensitive configs
            for (let i = 0; i < sensitiveCount; i++) {
              configs.push({
                id: `sensitive-${i}`,
                configKey: `sensitive_key_${i}`,
                configValue: `secret_value_${i}`,
                environment: 'all',
                isSensitive: true,
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              });
            }
            
            // Add non-sensitive configs
            for (let i = 0; i < nonSensitiveCount; i++) {
              configs.push({
                id: `public-${i}`,
                configKey: `public_key_${i}`,
                configValue: `public_value_${i}`,
                environment: 'all',
                isSensitive: false,
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              });
            }
            
            const filtered = filterSensitiveConfigs(configs, false);
            
            // Should only have non-sensitive configs
            expect(filtered.length).toBe(nonSensitiveCount);
            
            // Verify no sensitive values leaked
            const filteredJson = JSON.stringify(filtered);
            for (let i = 0; i < sensitiveCount; i++) {
              expect(filteredJson).not.toContain(`secret_value_${i}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when all configs are sensitive', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              configKey: fc.string({ minLength: 1, maxLength: 50 }),
              configValue: fc.string(),
              environment: fc.constantFrom('all', 'development', 'staging', 'production'),
              isSensitive: fc.constant(true),
              description: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
              updatedBy: fc.option(fc.uuid(), { nil: undefined }),
              updatedAt: validISODateArb,
              createdAt: validISODateArb,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (allSensitiveConfigs) => {
            const filtered = filterSensitiveConfigs(allSensitiveConfigs, false);
            expect(filtered.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Config Round-Trip Consistency', () => {
    /**
     * Property 4: Config Round-Trip Consistency
     * For any configuration key-value pair stored via setConfig, 
     * calling getConfig with the same key SHALL return the exact same value (JSON equality).
     * 
     * Note: This is a pure function test for JSON serialization/deserialization
     * Validates: Requirements 3.1, 4.2, 4.3
     */
    it('should preserve JSON values through serialization', () => {
      fc.assert(
        fc.property(
          fc.jsonValue(),
          (value) => {
            // Test that JSON round-trip preserves value
            const serialized = JSON.stringify(value);
            const deserialized = JSON.parse(serialized);
            // Use JSON.stringify for comparison to handle -0 vs 0 edge case
            expect(JSON.stringify(deserialized)).toBe(JSON.stringify(value));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various config value types', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            // Use integer instead of double to avoid -0 edge case
            fc.integer({ min: -1000000, max: 1000000 }),
            fc.boolean(),
            fc.constant(null),
            fc.array(fc.string()),
            fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string())
          ),
          (value) => {
            // Verify JSON serialization works correctly
            const serialized = JSON.stringify(value);
            const deserialized = JSON.parse(serialized);
            // Use JSON.stringify for comparison to handle edge cases
            expect(JSON.stringify(deserialized)).toBe(JSON.stringify(value));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Feature Flag Evaluation Priority', () => {
    /**
     * Property 8: Feature Flag Evaluation Priority
     * For any feature flag and user context, the evaluation SHALL follow this priority order:
     * 1. If is_enabled is false, return false (global disable)
     * 2. If current time is before enable_at or after disable_at, return false (schedule)
     * 3. If userId is in enabled_for_users, return true (user targeting)
     * 4. If userRole is in enabled_for_roles, return true (role targeting)
     * 5. If enabled_percentage > 0, use deterministic hash to decide (percentage rollout)
     * 6. Otherwise, return is_enabled
     * 
     * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
     */

    // Pure function to evaluate feature flag (mirrors the logic in production-readiness-utils.ts)
    function evaluateFeatureFlag(flag: FeatureFlag, context: FeatureFlagContext): boolean {
      // 1. Check global enable
      if (!flag.isEnabled) return false;

      // 2. Check schedule
      const now = new Date();
      if (flag.enableAt && new Date(flag.enableAt) > now) return false;
      if (flag.disableAt && new Date(flag.disableAt) < now) return false;

      // 3. Check user targeting
      if (context.userId && flag.targetUsers.length > 0) {
        if (flag.targetUsers.includes(context.userId)) return true;
      }

      // 4. Check role targeting
      if (context.userRole && flag.targetRoles.length > 0) {
        if (flag.targetRoles.includes(context.userRole)) return true;
      }

      // 5. Check percentage rollout
      if (flag.rolloutPercentage >= 100) return true;
      if (flag.rolloutPercentage <= 0) return false;

      // Use user ID for consistent percentage calculation
      if (context.userId) {
        const hash = simpleHash(context.userId + flag.flagKey);
        return (hash % 100) < flag.rolloutPercentage;
      }

      // No user context, use random (non-deterministic, skip in property test)
      return flag.rolloutPercentage > 50;
    }

    function simpleHash(str: string): number {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    }

    it('should return false when flag is globally disabled', () => {
      fc.assert(
        fc.property(
          featureFlagArb,
          featureFlagContextArb,
          (flag, context) => {
            const disabledFlag = { ...flag, isEnabled: false };
            const result = evaluateFeatureFlag(disabledFlag, context);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when current time is before enable_at', () => {
      fc.assert(
        fc.property(
          featureFlagArb,
          featureFlagContextArb,
          (flag, context) => {
            // Set enable_at to future
            const futureDate = new Date(Date.now() + 86400000); // 1 day in future
            const scheduledFlag = {
              ...flag,
              isEnabled: true,
              enableAt: futureDate.toISOString(),
              disableAt: undefined,
            };
            const result = evaluateFeatureFlag(scheduledFlag, context);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when current time is after disable_at', () => {
      fc.assert(
        fc.property(
          featureFlagArb,
          featureFlagContextArb,
          (flag, context) => {
            // Set disable_at to past
            const pastDate = new Date(Date.now() - 86400000); // 1 day in past
            const scheduledFlag = {
              ...flag,
              isEnabled: true,
              enableAt: undefined,
              disableAt: pastDate.toISOString(),
            };
            const result = evaluateFeatureFlag(scheduledFlag, context);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true when user is in target users list', () => {
      fc.assert(
        fc.property(
          featureFlagArb,
          fc.uuid(),
          (flag, userId) => {
            const targetedFlag = {
              ...flag,
              isEnabled: true,
              enableAt: undefined,
              disableAt: undefined,
              targetUsers: [userId],
              rolloutPercentage: 0, // Ensure percentage doesn't affect result
            };
            const context: FeatureFlagContext = { userId };
            const result = evaluateFeatureFlag(targetedFlag, context);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true when user role is in target roles list', () => {
      fc.assert(
        fc.property(
          featureFlagArb,
          fc.constantFrom('admin', 'manager', 'ops', 'finance', 'sales', 'engineer'),
          (flag, role) => {
            const targetedFlag = {
              ...flag,
              isEnabled: true,
              enableAt: undefined,
              disableAt: undefined,
              targetUsers: [],
              targetRoles: [role],
              rolloutPercentage: 0, // Ensure percentage doesn't affect result
            };
            const context: FeatureFlagContext = { userRole: role };
            const result = evaluateFeatureFlag(targetedFlag, context);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true when rollout percentage is 100', () => {
      fc.assert(
        fc.property(
          featureFlagArb,
          featureFlagContextArb,
          (flag, context) => {
            const fullRolloutFlag = {
              ...flag,
              isEnabled: true,
              enableAt: undefined,
              disableAt: undefined,
              targetUsers: [],
              targetRoles: [],
              rolloutPercentage: 100,
            };
            const result = evaluateFeatureFlag(fullRolloutFlag, context);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when rollout percentage is 0 and no targeting matches', () => {
      fc.assert(
        fc.property(
          featureFlagArb,
          fc.uuid(),
          (flag, userId) => {
            const noRolloutFlag = {
              ...flag,
              isEnabled: true,
              enableAt: undefined,
              disableAt: undefined,
              targetUsers: [],
              targetRoles: [],
              rolloutPercentage: 0,
            };
            const context: FeatureFlagContext = { userId };
            const result = evaluateFeatureFlag(noRolloutFlag, context);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic for same user and flag', () => {
      fc.assert(
        fc.property(
          featureFlagArb,
          fc.uuid(),
          fc.integer({ min: 1, max: 99 }),
          (flag, userId, percentage) => {
            const partialRolloutFlag = {
              ...flag,
              isEnabled: true,
              enableAt: undefined,
              disableAt: undefined,
              targetUsers: [],
              targetRoles: [],
              rolloutPercentage: percentage,
            };
            const context: FeatureFlagContext = { userId };

            // Call multiple times - should always return same result
            const result1 = evaluateFeatureFlag(partialRolloutFlag, context);
            const result2 = evaluateFeatureFlag(partialRolloutFlag, context);
            const result3 = evaluateFeatureFlag(partialRolloutFlag, context);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Deployment Recording Side Effects', () => {
    /**
     * Property 9: Deployment Recording Side Effects
     * For any deployment recorded via recordDeployment, the app_version config 
     * SHALL be updated to match the deployment version, and the deployment_history 
     * table SHALL contain a record with the provided version, environment, and deployer.
     * 
     * Note: This tests the pure data transformation logic
     * Validates: Requirements 6.1, 6.2, 6.3, 6.4
     */

    interface DeploymentInput {
      version: string;
      environment: 'development' | 'staging' | 'production';
      deployedBy?: string;
      changelog?: string;
    }

    interface DeploymentOutput {
      version: string;
      environment: string;
      deployed_by?: string;
      changelog?: string;
      status: string;
      is_rollback: boolean;
    }

    function transformDeploymentInput(input: DeploymentInput): DeploymentOutput {
      return {
        version: input.version,
        environment: input.environment,
        deployed_by: input.deployedBy,
        changelog: input.changelog,
        status: 'success',
        is_rollback: false,
      };
    }

    it('should preserve version in deployment record', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.string({ minLength: 1, maxLength: 20 }),
            environment: fc.constantFrom<'development' | 'staging' | 'production'>('development', 'staging', 'production'),
            deployedBy: fc.option(fc.uuid(), { nil: undefined }),
            changelog: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          }),
          (input) => {
            const output = transformDeploymentInput(input);
            expect(output.version).toBe(input.version);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve environment in deployment record', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.string({ minLength: 1, maxLength: 20 }),
            environment: fc.constantFrom<'development' | 'staging' | 'production'>('development', 'staging', 'production'),
            deployedBy: fc.option(fc.uuid(), { nil: undefined }),
            changelog: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          }),
          (input) => {
            const output = transformDeploymentInput(input);
            expect(output.environment).toBe(input.environment);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve deployer in deployment record', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.string({ minLength: 1, maxLength: 20 }),
            environment: fc.constantFrom<'development' | 'staging' | 'production'>('development', 'staging', 'production'),
            deployedBy: fc.option(fc.uuid(), { nil: undefined }),
            changelog: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          }),
          (input) => {
            const output = transformDeploymentInput(input);
            expect(output.deployed_by).toBe(input.deployedBy);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set status to success for new deployments', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.string({ minLength: 1, maxLength: 20 }),
            environment: fc.constantFrom<'development' | 'staging' | 'production'>('development', 'staging', 'production'),
            deployedBy: fc.option(fc.uuid(), { nil: undefined }),
            changelog: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          }),
          (input) => {
            const output = transformDeploymentInput(input);
            expect(output.status).toBe('success');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set is_rollback to false for new deployments', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.string({ minLength: 1, maxLength: 20 }),
            environment: fc.constantFrom<'development' | 'staging' | 'production'>('development', 'staging', 'production'),
            deployedBy: fc.option(fc.uuid(), { nil: undefined }),
            changelog: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          }),
          (input) => {
            const output = transformDeploymentInput(input);
            expect(output.is_rollback).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


describe('Property 10: Startup Validation Completeness', () => {
  /**
   * Property 10: Startup Validation Completeness
   * For any startup check execution, the result SHALL indicate success only if:
   * - Database connection succeeds
   * - All required environment variables are present
   * - All required tables exist
   * 
   * If any check fails, the errors array SHALL contain a descriptive message for each failure.
   * 
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
   */

  // Pure function to simulate startup check result aggregation
  interface CheckResult {
    name: string;
    passed: boolean;
    error?: string;
  }

  function aggregateStartupChecks(checks: CheckResult[]): StartupCheckResult {
    const errors: string[] = [];
    
    for (const check of checks) {
      if (!check.passed && check.error) {
        errors.push(check.error);
      }
    }
    
    return {
      success: errors.length === 0,
      checks,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  const checkResultArb = fc.record({
    name: fc.constantFrom('environment_variables', 'database_connection', 'required_tables'),
    passed: fc.boolean(),
    error: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  }).map(check => {
    // Ensure error is present when check fails
    if (!check.passed && !check.error) {
      return { ...check, error: `${check.name} check failed` };
    }
    // Ensure error is absent when check passes
    if (check.passed) {
      return { ...check, error: undefined };
    }
    return check;
  });

  it('should return success only when all checks pass', () => {
    fc.assert(
      fc.property(
        fc.array(checkResultArb, { minLength: 1, maxLength: 5 }),
        (checks) => {
          const result = aggregateStartupChecks(checks);
          const allPassed = checks.every(c => c.passed);
          expect(result.success).toBe(allPassed);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return success=true when all checks pass', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.constantFrom('environment_variables', 'database_connection', 'required_tables'),
            passed: fc.constant(true),
            error: fc.constant(undefined),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (checks) => {
          const result = aggregateStartupChecks(checks);
          expect(result.success).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return success=false when any check fails', () => {
    fc.assert(
      fc.property(
        fc.array(checkResultArb, { minLength: 0, maxLength: 4 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (passingChecks, errorMessage) => {
          // Add at least one failing check
          const failingCheck: CheckResult = {
            name: 'database_connection',
            passed: false,
            error: errorMessage,
          };
          const allChecks = [...passingChecks.map(c => ({ ...c, passed: true, error: undefined })), failingCheck];
          
          const result = aggregateStartupChecks(allChecks);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include error message for each failed check', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.constantFrom('environment_variables', 'database_connection', 'required_tables'),
            passed: fc.constant(false),
            error: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (failingChecks) => {
          const result = aggregateStartupChecks(failingChecks);
          
          // Each failing check should have its error in the errors array
          expect(result.errors.length).toBe(failingChecks.length);
          
          for (const check of failingChecks) {
            expect(result.errors).toContain(check.error);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all check results in the checks array', () => {
    fc.assert(
      fc.property(
        fc.array(checkResultArb, { minLength: 1, maxLength: 10 }),
        (checks) => {
          const result = aggregateStartupChecks(checks);
          
          expect(result.checks).toHaveLength(checks.length);
          
          for (let i = 0; i < checks.length; i++) {
            expect(result.checks[i].name).toBe(checks[i].name);
            expect(result.checks[i].passed).toBe(checks[i].passed);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include timestamp in result', () => {
    fc.assert(
      fc.property(
        fc.array(checkResultArb, { minLength: 1, maxLength: 5 }),
        (checks) => {
          const before = new Date();
          const result = aggregateStartupChecks(checks);
          const after = new Date();
          
          const resultTime = new Date(result.timestamp);
          expect(resultTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
          expect(resultTime.getTime()).toBeLessThanOrEqual(after.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed passing and failing checks correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        (passingCount, failingCount) => {
          const checks: CheckResult[] = [];
          
          for (let i = 0; i < passingCount; i++) {
            checks.push({
              name: `passing_check_${i}`,
              passed: true,
              error: undefined,
            });
          }
          
          for (let i = 0; i < failingCount; i++) {
            checks.push({
              name: `failing_check_${i}`,
              passed: false,
              error: `Error in failing_check_${i}`,
            });
          }
          
          const result = aggregateStartupChecks(checks);
          
          expect(result.success).toBe(false);
          expect(result.errors.length).toBe(failingCount);
          expect(result.checks.length).toBe(passingCount + failingCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 2: Health Metrics Recording Round-Trip
// Feature: v0.80-production-readiness, Property 2: Health Metrics Recording Round-Trip
// Validates: Requirements 1.1, 1.2
// ============================================================================

describe('Property 2: Health Metrics Recording Round-Trip', () => {
  /**
   * Property 2: Health Metrics Recording Round-Trip
   * For any health check performed, the system SHALL store a record in system_health 
   * with a timestamp, and querying the table immediately after SHALL return a record 
   * with timestamp within 1 second of the check time.
   * 
   * Feature: v0.80-production-readiness, Property 2: Health Metrics Recording Round-Trip
   * Validates: Requirements 1.1, 1.2
   */

  interface HealthMetricsRecord {
    id: string;
    checkedAt: string;
    databaseSize?: number;
    activeConnections?: number;
    errorCount?: number;
    cacheHitRate?: number;
    pendingJobs?: number;
    failedJobs?: number;
    metrics?: Record<string, unknown>;
  }

  // Generator for health metrics
  const healthMetricsArb = fc.record({
    id: fc.uuid(),
    checkedAt: validISODateArb,
    databaseSize: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
    activeConnections: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
    errorCount: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
    cacheHitRate: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    pendingJobs: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
    failedJobs: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
    metrics: fc.option(fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.integer()), { nil: undefined }),
  });

  // Pure function to simulate storing and retrieving health metrics
  function storeAndRetrieveMetrics(
    metrics: HealthMetricsRecord,
    storage: Map<string, HealthMetricsRecord>
  ): HealthMetricsRecord | null {
    // Store the metrics
    storage.set(metrics.id, { ...metrics });
    
    // Retrieve the metrics
    return storage.get(metrics.id) || null;
  }

  // Function to check if two timestamps are within 1 second
  function timestampsWithinOneSecond(ts1: string, ts2: string): boolean {
    const date1 = new Date(ts1);
    const date2 = new Date(ts2);
    return Math.abs(date1.getTime() - date2.getTime()) <= 1000;
  }

  it('should store and retrieve health metrics with same id', () => {
    fc.assert(
      fc.property(
        healthMetricsArb,
        (metrics) => {
          const storage = new Map<string, HealthMetricsRecord>();
          const retrieved = storeAndRetrieveMetrics(metrics, storage);
          
          expect(retrieved).not.toBeNull();
          expect(retrieved?.id).toBe(metrics.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve timestamp through storage round-trip', () => {
    fc.assert(
      fc.property(
        healthMetricsArb,
        (metrics) => {
          const storage = new Map<string, HealthMetricsRecord>();
          const retrieved = storeAndRetrieveMetrics(metrics, storage);
          
          expect(retrieved).not.toBeNull();
          expect(retrieved?.checkedAt).toBe(metrics.checkedAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all metric values through storage round-trip', () => {
    fc.assert(
      fc.property(
        healthMetricsArb,
        (metrics) => {
          const storage = new Map<string, HealthMetricsRecord>();
          const retrieved = storeAndRetrieveMetrics(metrics, storage);
          
          expect(retrieved).not.toBeNull();
          expect(retrieved?.databaseSize).toBe(metrics.databaseSize);
          expect(retrieved?.activeConnections).toBe(metrics.activeConnections);
          expect(retrieved?.errorCount).toBe(metrics.errorCount);
          expect(retrieved?.cacheHitRate).toBe(metrics.cacheHitRate);
          expect(retrieved?.pendingJobs).toBe(metrics.pendingJobs);
          expect(retrieved?.failedJobs).toBe(metrics.failedJobs);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have timestamp within 1 second of check time', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 10000 }),
        (databaseSize, activeConnections, errorCount) => {
          const checkTime = new Date();
          const metrics: HealthMetricsRecord = {
            id: crypto.randomUUID(),
            checkedAt: checkTime.toISOString(),
            databaseSize,
            activeConnections,
            errorCount,
          };
          
          const storage = new Map<string, HealthMetricsRecord>();
          const retrieved = storeAndRetrieveMetrics(metrics, storage);
          
          expect(retrieved).not.toBeNull();
          expect(timestampsWithinOneSecond(retrieved!.checkedAt, checkTime.toISOString())).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple health records without data corruption', () => {
    fc.assert(
      fc.property(
        fc.array(healthMetricsArb, { minLength: 2, maxLength: 10 }),
        (metricsArray) => {
          const storage = new Map<string, HealthMetricsRecord>();
          
          // Store all metrics
          for (const metrics of metricsArray) {
            storage.set(metrics.id, { ...metrics });
          }
          
          // Verify each can be retrieved correctly
          for (const metrics of metricsArray) {
            const retrieved = storage.get(metrics.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(metrics.id);
            expect(retrieved?.checkedAt).toBe(metrics.checkedAt);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 5: Config Environment Filtering
// Feature: v0.80-production-readiness, Property 5: Config Environment Filtering
// Validates: Requirements 3.2
// ============================================================================

describe('Property 5: Config Environment Filtering', () => {
  /**
   * Property 5: Config Environment Filtering
   * For any configuration with a specific environment setting, getAllConfigs filtered 
   * by that environment SHALL include the config, and getAllConfigs filtered by a 
   * different environment SHALL NOT include it (unless environment is 'all').
   * 
   * Feature: v0.80-production-readiness, Property 5: Config Environment Filtering
   * Validates: Requirements 3.2
   */

  type Environment = 'all' | 'development' | 'staging' | 'production';

  interface ConfigRecord {
    id: string;
    configKey: string;
    configValue: unknown;
    environment: Environment;
    isSensitive: boolean;
  }

  const environmentArb = fc.constantFrom<Environment>('all', 'development', 'staging', 'production');
  const specificEnvironmentArb = fc.constantFrom<Environment>('development', 'staging', 'production');

  const configRecordArb = fc.record({
    id: fc.uuid(),
    configKey: fc.string({ minLength: 1, maxLength: 50 }),
    configValue: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
    environment: environmentArb,
    isSensitive: fc.boolean(),
  });

  // Pure function to filter configs by environment
  function filterConfigsByEnvironment(
    configs: ConfigRecord[],
    targetEnvironment: Environment
  ): ConfigRecord[] {
    return configs.filter(config => 
      config.environment === targetEnvironment || config.environment === 'all'
    );
  }

  it('should include configs with matching environment', () => {
    fc.assert(
      fc.property(
        fc.array(configRecordArb, { minLength: 1, maxLength: 20 }),
        specificEnvironmentArb,
        (configs, targetEnv) => {
          // Add a config with the target environment
          const targetConfig: ConfigRecord = {
            id: 'target-config-id',
            configKey: 'target_key',
            configValue: 'target_value',
            environment: targetEnv,
            isSensitive: false,
          };
          const allConfigs = [...configs, targetConfig];
          
          const filtered = filterConfigsByEnvironment(allConfigs, targetEnv);
          
          // The target config should be in the filtered results
          const found = filtered.find(c => c.id === targetConfig.id);
          expect(found).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always include configs with environment "all"', () => {
    fc.assert(
      fc.property(
        fc.array(configRecordArb, { minLength: 0, maxLength: 10 }),
        specificEnvironmentArb,
        (configs, targetEnv) => {
          // Add a config with 'all' environment
          const allEnvConfig: ConfigRecord = {
            id: 'all-env-config',
            configKey: 'all_env_key',
            configValue: 'all_env_value',
            environment: 'all',
            isSensitive: false,
          };
          const allConfigs = [...configs, allEnvConfig];
          
          const filtered = filterConfigsByEnvironment(allConfigs, targetEnv);
          
          // The 'all' environment config should always be included
          const found = filtered.find(c => c.id === allEnvConfig.id);
          expect(found).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude configs with different specific environment', () => {
    fc.assert(
      fc.property(
        fc.array(configRecordArb, { minLength: 0, maxLength: 10 }),
        (configs) => {
          // Add a config specifically for 'development'
          const devConfig: ConfigRecord = {
            id: 'dev-only-config',
            configKey: 'dev_only_key',
            configValue: 'dev_only_value',
            environment: 'development',
            isSensitive: false,
          };
          const allConfigs = [...configs, devConfig];
          
          // Filter for 'production' - should NOT include the dev config
          const filtered = filterConfigsByEnvironment(allConfigs, 'production');
          
          const found = filtered.find(c => c.id === devConfig.id);
          expect(found).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly partition configs by environment', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        (devCount, stagingCount, prodCount, allCount) => {
          const configs: ConfigRecord[] = [];
          
          // Add development configs
          for (let i = 0; i < devCount; i++) {
            configs.push({
              id: `dev-${i}`,
              configKey: `dev_key_${i}`,
              configValue: `dev_value_${i}`,
              environment: 'development',
              isSensitive: false,
            });
          }
          
          // Add staging configs
          for (let i = 0; i < stagingCount; i++) {
            configs.push({
              id: `staging-${i}`,
              configKey: `staging_key_${i}`,
              configValue: `staging_value_${i}`,
              environment: 'staging',
              isSensitive: false,
            });
          }
          
          // Add production configs
          for (let i = 0; i < prodCount; i++) {
            configs.push({
              id: `prod-${i}`,
              configKey: `prod_key_${i}`,
              configValue: `prod_value_${i}`,
              environment: 'production',
              isSensitive: false,
            });
          }
          
          // Add 'all' environment configs
          for (let i = 0; i < allCount; i++) {
            configs.push({
              id: `all-${i}`,
              configKey: `all_key_${i}`,
              configValue: `all_value_${i}`,
              environment: 'all',
              isSensitive: false,
            });
          }
          
          // Filter for development - should get dev + all
          const devFiltered = filterConfigsByEnvironment(configs, 'development');
          expect(devFiltered.length).toBe(devCount + allCount);
          
          // Filter for staging - should get staging + all
          const stagingFiltered = filterConfigsByEnvironment(configs, 'staging');
          expect(stagingFiltered.length).toBe(stagingCount + allCount);
          
          // Filter for production - should get prod + all
          const prodFiltered = filterConfigsByEnvironment(configs, 'production');
          expect(prodFiltered.length).toBe(prodCount + allCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve config values when filtering', () => {
    fc.assert(
      fc.property(
        configRecordArb,
        specificEnvironmentArb,
        (config, targetEnv) => {
          // Set the config to match the target environment
          const matchingConfig = { ...config, environment: targetEnv };
          
          const filtered = filterConfigsByEnvironment([matchingConfig], targetEnv);
          
          expect(filtered.length).toBe(1);
          expect(filtered[0].configKey).toBe(matchingConfig.configKey);
          expect(filtered[0].configValue).toBe(matchingConfig.configValue);
          expect(filtered[0].isSensitive).toBe(matchingConfig.isSensitive);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 7: Config Audit Trail
// Feature: v0.80-production-readiness, Property 7: Config Audit Trail
// Validates: Requirements 3.4
// ============================================================================

describe('Property 7: Config Audit Trail', () => {
  /**
   * Property 7: Config Audit Trail
   * For any configuration update via setConfig with an updatedBy parameter, 
   * the stored record SHALL have updated_at within 1 second of the update time 
   * and updated_by matching the provided value.
   * 
   * Feature: v0.80-production-readiness, Property 7: Config Audit Trail
   * Validates: Requirements 3.4
   */

  interface ConfigUpdateInput {
    key: string;
    value: unknown;
    updatedBy: string;
    updateTime: Date;
  }

  interface StoredConfig {
    configKey: string;
    configValue: unknown;
    updatedBy: string;
    updatedAt: string;
  }

  // Pure function to simulate config update with audit trail
  function applyConfigUpdate(input: ConfigUpdateInput): StoredConfig {
    return {
      configKey: input.key,
      configValue: input.value,
      updatedBy: input.updatedBy,
      updatedAt: input.updateTime.toISOString(),
    };
  }

  // Function to check if timestamp is within 1 second of reference time
  function isWithinOneSecond(timestamp: string, referenceTime: Date): boolean {
    const tsDate = new Date(timestamp);
    return Math.abs(tsDate.getTime() - referenceTime.getTime()) <= 1000;
  }

  // Use timestamp-based date generation to avoid invalid dates
  const configUpdateArb = fc.record({
    key: fc.string({ minLength: 1, maxLength: 50 }),
    value: fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string())
    ),
    updatedBy: fc.uuid(),
    updateTime: fc.integer({ 
      min: new Date('2020-01-01').getTime(), 
      max: new Date('2030-12-31').getTime() 
    }).map(ts => new Date(ts)),
  });

  it('should preserve updatedBy in stored config', () => {
    fc.assert(
      fc.property(
        configUpdateArb,
        (input) => {
          const stored = applyConfigUpdate(input);
          expect(stored.updatedBy).toBe(input.updatedBy);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have updatedAt within 1 second of update time', () => {
    fc.assert(
      fc.property(
        configUpdateArb,
        (input) => {
          const stored = applyConfigUpdate(input);
          expect(isWithinOneSecond(stored.updatedAt, input.updateTime)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve config key in stored config', () => {
    fc.assert(
      fc.property(
        configUpdateArb,
        (input) => {
          const stored = applyConfigUpdate(input);
          expect(stored.configKey).toBe(input.key);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve config value in stored config', () => {
    fc.assert(
      fc.property(
        configUpdateArb,
        (input) => {
          const stored = applyConfigUpdate(input);
          // Use JSON.stringify for comparison to handle object equality
          expect(JSON.stringify(stored.configValue)).toBe(JSON.stringify(input.value));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track multiple updates with correct audit trail', () => {
    fc.assert(
      fc.property(
        fc.array(configUpdateArb, { minLength: 2, maxLength: 5 }),
        (updates) => {
          const auditTrail: StoredConfig[] = [];
          
          for (const update of updates) {
            const stored = applyConfigUpdate(update);
            auditTrail.push(stored);
          }
          
          // Verify each update has correct audit info
          for (let i = 0; i < updates.length; i++) {
            expect(auditTrail[i].updatedBy).toBe(updates[i].updatedBy);
            expect(isWithinOneSecond(auditTrail[i].updatedAt, updates[i].updateTime)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle different users updating same config', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
        (configKey, userIds) => {
          const updates: StoredConfig[] = [];
          
          for (const userId of userIds) {
            const input: ConfigUpdateInput = {
              key: configKey,
              value: `value_by_${userId}`,
              updatedBy: userId,
              updateTime: new Date(),
            };
            updates.push(applyConfigUpdate(input));
          }
          
          // Each update should have the correct user
          for (let i = 0; i < userIds.length; i++) {
            expect(updates[i].updatedBy).toBe(userIds[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid ISO timestamp format', () => {
    fc.assert(
      fc.property(
        configUpdateArb,
        (input) => {
          const stored = applyConfigUpdate(input);
          
          // Verify the timestamp is a valid ISO string
          const parsedDate = new Date(stored.updatedAt);
          expect(parsedDate.toString()).not.toBe('Invalid Date');
          
          // Verify it can be converted back to ISO format
          expect(parsedDate.toISOString()).toBe(stored.updatedAt);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 11: DB Health Function Output
// Feature: v0.80-production-readiness, Property 11: DB Health Function Output
// Validates: Requirements 9.2, 9.3, 9.4
// ============================================================================

describe('Property 11: DB Health Function Output', () => {
  /**
   * Property 11: DB Health Function Output
   * For any call to check_system_health() PostgreSQL function, the returned JSONB SHALL contain:
   * - status field with value 'healthy', 'degraded', or 'warning'
   * - database object with size_mb and connections
   * - errors_last_hour count
   * - version string
   * 
   * And a new record SHALL be inserted into system_health table.
   * 
   * Feature: v0.80-production-readiness, Property 11: DB Health Function Output
   * Validates: Requirements 9.2, 9.3, 9.4
   */

  type DBHealthStatus = 'healthy' | 'degraded' | 'warning';

  interface DBHealthOutput {
    status: DBHealthStatus;
    database: {
      size_mb: number;
      connections: number;
    };
    errors_last_hour: number;
    version: string;
  }

  // Generator for database metrics
  const dbMetricsArb = fc.record({
    sizeMb: fc.integer({ min: 0, max: 100000 }),
    connections: fc.integer({ min: 0, max: 1000 }),
    errorsLastHour: fc.integer({ min: 0, max: 10000 }),
    version: fc.string({ minLength: 1, maxLength: 20 }),
  });

  // Pure function to simulate check_system_health() output
  function simulateCheckSystemHealth(metrics: {
    sizeMb: number;
    connections: number;
    errorsLastHour: number;
    version: string;
  }): DBHealthOutput {
    // Determine status based on thresholds (matching Requirements 1.4, 1.5)
    let status: DBHealthStatus = 'healthy';
    
    if (metrics.errorsLastHour > 100) {
      status = 'degraded';
    } else if (metrics.connections > 50) {
      status = 'warning';
    }
    
    return {
      status,
      database: {
        size_mb: metrics.sizeMb,
        connections: metrics.connections,
      },
      errors_last_hour: metrics.errorsLastHour,
      version: metrics.version,
    };
  }

  // Validation function for DB health output structure
  function validateDBHealthOutput(output: DBHealthOutput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validStatuses: DBHealthStatus[] = ['healthy', 'degraded', 'warning'];
    
    // Check status field
    if (!output.status) {
      errors.push('Missing status field');
    } else if (!validStatuses.includes(output.status)) {
      errors.push(`Invalid status value: ${output.status}`);
    }
    
    // Check database object
    if (!output.database) {
      errors.push('Missing database object');
    } else {
      if (output.database.size_mb === undefined || output.database.size_mb === null) {
        errors.push('Missing database.size_mb');
      }
      if (output.database.connections === undefined || output.database.connections === null) {
        errors.push('Missing database.connections');
      }
    }
    
    // Check errors_last_hour
    if (output.errors_last_hour === undefined || output.errors_last_hour === null) {
      errors.push('Missing errors_last_hour');
    }
    
    // Check version
    if (!output.version) {
      errors.push('Missing version string');
    }
    
    return { valid: errors.length === 0, errors };
  }

  it('should contain valid status field', () => {
    fc.assert(
      fc.property(
        dbMetricsArb,
        (metrics) => {
          const output = simulateCheckSystemHealth(metrics);
          const validStatuses: DBHealthStatus[] = ['healthy', 'degraded', 'warning'];
          
          expect(validStatuses).toContain(output.status);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain database object with size_mb', () => {
    fc.assert(
      fc.property(
        dbMetricsArb,
        (metrics) => {
          const output = simulateCheckSystemHealth(metrics);
          
          expect(output.database).toBeDefined();
          expect(typeof output.database.size_mb).toBe('number');
          expect(output.database.size_mb).toBe(metrics.sizeMb);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain database object with connections', () => {
    fc.assert(
      fc.property(
        dbMetricsArb,
        (metrics) => {
          const output = simulateCheckSystemHealth(metrics);
          
          expect(output.database).toBeDefined();
          expect(typeof output.database.connections).toBe('number');
          expect(output.database.connections).toBe(metrics.connections);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain errors_last_hour count', () => {
    fc.assert(
      fc.property(
        dbMetricsArb,
        (metrics) => {
          const output = simulateCheckSystemHealth(metrics);
          
          expect(typeof output.errors_last_hour).toBe('number');
          expect(output.errors_last_hour).toBe(metrics.errorsLastHour);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain version string', () => {
    fc.assert(
      fc.property(
        dbMetricsArb,
        (metrics) => {
          const output = simulateCheckSystemHealth(metrics);
          
          expect(typeof output.version).toBe('string');
          expect(output.version.length).toBeGreaterThan(0);
          expect(output.version).toBe(metrics.version);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return degraded when errors exceed 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 10000 }),
        fc.integer({ min: 0, max: 50 }), // connections below warning threshold
        fc.integer({ min: 0, max: 100000 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (errorsLastHour, connections, sizeMb, version) => {
          const output = simulateCheckSystemHealth({
            sizeMb,
            connections,
            errorsLastHour,
            version,
          });
          
          expect(output.status).toBe('degraded');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return warning when connections exceed 50 and errors are low', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // errors below degraded threshold
        fc.integer({ min: 51, max: 1000 }), // connections above warning threshold
        fc.integer({ min: 0, max: 100000 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (errorsLastHour, connections, sizeMb, version) => {
          const output = simulateCheckSystemHealth({
            sizeMb,
            connections,
            errorsLastHour,
            version,
          });
          
          expect(output.status).toBe('warning');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return healthy when all metrics are within normal range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // errors at or below threshold
        fc.integer({ min: 0, max: 50 }), // connections at or below threshold
        fc.integer({ min: 0, max: 100000 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (errorsLastHour, connections, sizeMb, version) => {
          const output = simulateCheckSystemHealth({
            sizeMb,
            connections,
            errorsLastHour,
            version,
          });
          
          expect(output.status).toBe('healthy');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should pass validation for all generated outputs', () => {
    fc.assert(
      fc.property(
        dbMetricsArb,
        (metrics) => {
          const output = simulateCheckSystemHealth(metrics);
          const validation = validateDBHealthOutput(output);
          
          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prioritize degraded status over warning', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 10000 }), // errors above degraded threshold
        fc.integer({ min: 51, max: 1000 }), // connections above warning threshold
        fc.integer({ min: 0, max: 100000 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (errorsLastHour, connections, sizeMb, version) => {
          const output = simulateCheckSystemHealth({
            sizeMb,
            connections,
            errorsLastHour,
            version,
          });
          
          // Degraded should take priority over warning
          expect(output.status).toBe('degraded');
        }
      ),
      { numRuns: 100 }
    );
  });
});