// =====================================================
// v0.47: HSE - SAFETY PERMIT ACTIONS UNIT TESTS
// Task 6.5: Unit tests for permit actions
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocking
import {
  createSafetyPermit,
  getSafetyPermit,
  getSafetyPermits,
  approveBySupervisor,
  approveByHSE,
  activatePermit,
  closePermit,
  cancelPermit,
  expireOverduePermits,
  getPermitStatistics,
} from '@/lib/safety-permit-actions';

// Helper to create mock query builder with proper chaining
function createMockQueryBuilder(data: unknown = null, error: unknown = null) {
  const finalResult = { data, error };
  
  // Create a self-referencing builder for unlimited chaining
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  
  const chainableMethods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'is', 'not', 'or', 'lte', 'gte', 'lt', 'order'];
  
  // All chainable methods return the builder itself
  chainableMethods.forEach(method => {
    builder[method] = vi.fn().mockImplementation(() => builder);
  });
  
  // Terminal method
  builder.single = vi.fn().mockResolvedValue(finalResult);
  
  // Make the builder itself thenable for await
  builder.then = (resolve: (value: typeof finalResult) => void) => {
    resolve(finalResult);
    return builder;
  };
  
  return builder;
}

describe('Safety Permit Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
  });

  describe('createSafetyPermit', () => {
    it('should validate required fields - empty work description', async () => {
      const result = await createSafetyPermit({
        permitType: 'hot_work',
        workDescription: '',
        workLocation: 'Test Location',
        validFrom: '2025-01-01',
        validTo: '2025-01-02',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Deskripsi pekerjaan');
    });

    it('should validate required fields - empty work location', async () => {
      const result = await createSafetyPermit({
        permitType: 'hot_work',
        workDescription: 'Test work',
        workLocation: '',
        validFrom: '2025-01-01',
        validTo: '2025-01-02',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Lokasi');
    });

    it('should validate date range - validTo before validFrom', async () => {
      const result = await createSafetyPermit({
        permitType: 'hot_work',
        workDescription: 'Test work',
        workLocation: 'Test Location',
        validFrom: '2025-01-10',
        validTo: '2025-01-05',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('setelah');
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await createSafetyPermit({
        permitType: 'hot_work',
        workDescription: 'Test work',
        workLocation: 'Test Location',
        validFrom: '2025-01-01',
        validTo: '2025-01-02',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('terautentikasi');
    });

    it('should handle employee not found', async () => {
      const mockBuilder = createMockQueryBuilder(null);
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await createSafetyPermit({
        permitType: 'hot_work',
        workDescription: 'Test work',
        workLocation: 'Test Location',
        validFrom: '2025-01-01',
        validTo: '2025-01-02',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('karyawan');
    });

    it('should create permit with valid input', async () => {
      const mockPermit = {
        id: 'permit-123',
        permit_number: 'PTW-2025-0001',
        permit_type: 'hot_work',
        work_description: 'Welding work',
        work_location: 'Workshop A',
        valid_from: '2025-01-01',
        valid_to: '2025-01-02',
        status: 'pending',
        required_ppe: ['helmet', 'gloves'],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return createMockQueryBuilder({ id: 'emp-123' });
        }
        if (table === 'safety_permits') {
          return createMockQueryBuilder(mockPermit);
        }
        return createMockQueryBuilder();
      });

      const result = await createSafetyPermit({
        permitType: 'hot_work',
        workDescription: 'Welding work',
        workLocation: 'Workshop A',
        validFrom: '2025-01-01',
        validTo: '2025-01-02',
        requiredPPE: ['helmet', 'gloves'],
      });

      expect(result.success).toBe(true);
      expect(result.data?.permitType).toBe('hot_work');
      expect(result.data?.permitNumber).toBe('PTW-2025-0001');
    });
  });

  describe('getSafetyPermit', () => {
    it('should return permit with related data', async () => {
      const mockPermit = {
        id: 'permit-123',
        permit_number: 'PTW-2025-0001',
        permit_type: 'confined_space',
        work_description: 'Tank inspection',
        work_location: 'Tank Farm',
        valid_from: '2025-01-01',
        valid_to: '2025-01-02',
        status: 'active',
        required_ppe: ['helmet', 'respirator'],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        requester: { full_name: 'John Doe' },
        supervisor: { full_name: 'Jane Smith' },
        hse: { full_name: 'Bob HSE' },
        closer: null,
        job_orders: { jo_number: 'JO-001' },
        safety_documents: { title: 'JSA Document' },
      };

      const mockBuilder = createMockQueryBuilder(mockPermit);
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await getSafetyPermit('permit-123');

      expect(result.success).toBe(true);
      expect(result.data?.permitNumber).toBe('PTW-2025-0001');
      expect(result.data?.requestedByName).toBe('John Doe');
      expect(result.data?.jobOrderNumber).toBe('JO-001');
    });

    it('should handle not found', async () => {
      const mockBuilder = createMockQueryBuilder(null, { message: 'Not found' });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await getSafetyPermit('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });
  });

  describe('getSafetyPermits', () => {
    it('should return permits list', async () => {
      const mockPermits = [
        {
          id: 'permit-1',
          permit_number: 'PTW-2025-0001',
          permit_type: 'hot_work',
          work_description: 'Welding',
          work_location: 'Workshop',
          valid_from: '2025-01-01',
          valid_to: '2025-01-02',
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          requester: { full_name: 'John' },
          job_orders: null,
        },
      ];

      const mockBuilder = createMockQueryBuilder();
      mockBuilder.order = vi.fn().mockResolvedValue({ data: mockPermits, error: null });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await getSafetyPermits({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].permitNumber).toBe('PTW-2025-0001');
    });

    it('should handle database error', async () => {
      const mockBuilder = createMockQueryBuilder();
      mockBuilder.order = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await getSafetyPermits({});

      expect(result.success).toBe(false);
    });
  });

  describe('approveBySupervisor', () => {
    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await approveBySupervisor('permit-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('terautentikasi');
    });

    it('should approve permit when authenticated', async () => {
      const mockBuilder = createMockQueryBuilder({ id: 'emp-123' });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await approveBySupervisor('permit-123');

      expect(result.success).toBe(true);
    });
  });

  describe('approveByHSE', () => {
    it('should require supervisor approval first', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return createMockQueryBuilder({ id: 'emp-123' });
        }
        if (table === 'safety_permits') {
          return createMockQueryBuilder({ supervisor_approved_by: null });
        }
        return createMockQueryBuilder();
      });

      const result = await approveByHSE('permit-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Supervisor');
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await approveByHSE('permit-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('terautentikasi');
    });

    it('should approve when supervisor has approved', async () => {
      let permitCallCount = 0;
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return createMockQueryBuilder({ id: 'emp-123' });
        }
        if (table === 'safety_permits') {
          permitCallCount++;
          if (permitCallCount === 1) {
            return createMockQueryBuilder({ supervisor_approved_by: 'sup-123' });
          }
          return createMockQueryBuilder(null, null);
        }
        return createMockQueryBuilder();
      });

      const result = await approveByHSE('permit-123');

      expect(result.success).toBe(true);
    });
  });

  describe('activatePermit', () => {
    it('should activate approved permit', async () => {
      const mockBuilder = createMockQueryBuilder(null, null);
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await activatePermit('permit-123');

      expect(result.success).toBe(true);
    });
  });

  describe('closePermit', () => {
    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await closePermit('permit-123', 'Notes');

      expect(result.success).toBe(false);
      expect(result.error).toContain('terautentikasi');
    });

    it('should close active permit with notes', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return createMockQueryBuilder({ id: 'emp-123' });
        }
        if (table === 'safety_permits') {
          return createMockQueryBuilder(null, null);
        }
        return createMockQueryBuilder();
      });

      const result = await closePermit('permit-123', 'Work completed safely');

      expect(result.success).toBe(true);
    });
  });

  describe('cancelPermit', () => {
    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await cancelPermit('permit-123', 'Reason');

      expect(result.success).toBe(false);
    });

    it('should cancel permit with reason', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return createMockQueryBuilder({ id: 'emp-123' });
        }
        if (table === 'safety_permits') {
          return createMockQueryBuilder(null, null);
        }
        return createMockQueryBuilder();
      });

      const result = await cancelPermit('permit-123', 'Work cancelled');

      expect(result.success).toBe(true);
    });
  });

  describe('expireOverduePermits', () => {
    it('should expire overdue permits', async () => {
      const mockBuilder = createMockQueryBuilder();
      mockBuilder.select = vi.fn().mockResolvedValue({
        data: [{ id: 'permit-1' }, { id: 'permit-2' }],
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await expireOverduePermits();

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should handle no overdue permits', async () => {
      const mockBuilder = createMockQueryBuilder();
      mockBuilder.select = vi.fn().mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await expireOverduePermits();

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });

    it('should handle database error', async () => {
      const mockBuilder = createMockQueryBuilder();
      mockBuilder.select = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await expireOverduePermits();

      expect(result.success).toBe(false);
    });
  });

  describe('getPermitStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();

      const mockPermits = [
        { id: '1', status: 'pending', permit_type: 'hot_work', closed_at: null },
        { id: '2', status: 'active', permit_type: 'hot_work', closed_at: null },
        { id: '3', status: 'active', permit_type: 'confined_space', closed_at: null },
        { id: '4', status: 'completed', permit_type: 'height_work', closed_at: thisMonth },
        { id: '5', status: 'completed', permit_type: 'excavation', closed_at: '2024-01-01' },
      ];

      const mockBuilder = createMockQueryBuilder();
      mockBuilder.select = vi.fn().mockResolvedValue({ data: mockPermits, error: null });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await getPermitStatistics();

      expect(result.success).toBe(true);
      expect(result.data?.totalPermits).toBe(5);
      expect(result.data?.activePermits).toBe(2);
      expect(result.data?.pendingApproval).toBe(1);
      expect(result.data?.completedThisMonth).toBe(1);
      expect(result.data?.byType?.hot_work).toBe(2);
      expect(result.data?.byStatus?.active).toBe(2);
    });

    it('should handle empty data', async () => {
      const mockBuilder = createMockQueryBuilder();
      mockBuilder.select = vi.fn().mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await getPermitStatistics();

      expect(result.success).toBe(true);
      expect(result.data?.totalPermits).toBe(0);
      expect(result.data?.activePermits).toBe(0);
    });

    it('should handle database error', async () => {
      const mockBuilder = createMockQueryBuilder();
      mockBuilder.select = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await getPermitStatistics();

      expect(result.success).toBe(false);
    });
  });
});
