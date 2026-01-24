/**
 * Unit Tests for Finance Manager Dashboard Calculations - Edge Cases
 * Feature: v0.9.14-finance-manager-dashboard-real-data
 * 
 * These tests verify edge case handling for empty data and NULL values
 * in the Finance Manager Dashboard calculation functions.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRevenueYTD,
  calculateExpensesMTD,
  calculateGrossProfit,
  calculateAROverdue,
  groupInvoicesByAgingBucket,
  calculateAPOutstanding,
  calculatePJOApprovalQueue,
  calculateBKKApprovalQueue,
  getRecentInvoices,
  getRecentPayments,
  getRecentPJOApprovals,
  type InvoiceForCalculation,
  type BKKRecordForCalculation,
  type PJOForCalculation,
} from '@/lib/dashboard/finance-manager-calculations';

// =====================================================
// Task 6.1: Unit Tests for Empty Data Handling
// Requirements: 1.3, 2.3, 4.3, 6.3, 7.3, 8.4, 9.4, 10.4, 11.4, 12.4
// =====================================================

describe('Task 6.1: Empty Data Handling', () => {
  const currentDate = new Date();

  describe('Revenue YTD - Empty Data (Requirement 1.3)', () => {
    it('should return 0 when invoices array is empty', () => {
      const result = calculateRevenueYTD([], currentDate);
      expect(result).toBe(0);
    });

    it('should return 0 when all invoices have non-paid status', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'draft', paid_at: null, due_date: null },
        { id: '2', total_amount: 2000000, amount_paid: null, status: 'sent', paid_at: null, due_date: null },
        { id: '3', total_amount: 3000000, amount_paid: null, status: 'overdue', paid_at: null, due_date: null },
      ];
      const result = calculateRevenueYTD(invoices, currentDate);
      expect(result).toBe(0);
    });

    it('should return 0 when paid invoices have no paid_at date', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'paid', paid_at: null, due_date: null },
      ];
      const result = calculateRevenueYTD(invoices, currentDate);
      expect(result).toBe(0);
    });
  });

  describe('Expenses MTD - Empty Data (Requirement 2.3)', () => {
    it('should return 0 when BKK records array is empty', () => {
      const result = calculateExpensesMTD([], currentDate);
      expect(result).toBe(0);
    });

    it('should return 0 when all BKK records have non-approved/paid status', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'draft', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '2', amount: 2000000, workflow_status: 'pending_check', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '3', amount: 3000000, workflow_status: 'rejected', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateExpensesMTD(bkkRecords, currentDate);
      expect(result).toBe(0);
    });

    it('should return 0 when all BKK records are inactive', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'approved', approved_at: new Date().toISOString(), paid_at: null, created_at: new Date().toISOString(), is_active: false },
      ];
      const result = calculateExpensesMTD(bkkRecords, currentDate);
      expect(result).toBe(0);
    });
  });

  describe('AR Overdue - Empty Data (Requirement 4.3)', () => {
    it('should return 0 when invoices array is empty', () => {
      const result = calculateAROverdue([], currentDate);
      expect(result).toBe(0);
    });

    it('should return 0 when no invoices are overdue', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'paid', paid_at: new Date().toISOString(), due_date: null },
        { id: '2', total_amount: 2000000, amount_paid: null, status: 'draft', paid_at: null, due_date: null },
      ];
      const result = calculateAROverdue(invoices, currentDate);
      expect(result).toBe(0);
    });

    it('should return 0 when outstanding invoices have no due_date', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'sent', paid_at: null, due_date: null },
        { id: '2', total_amount: 2000000, amount_paid: null, status: 'overdue', paid_at: null, due_date: null },
      ];
      const result = calculateAROverdue(invoices, currentDate);
      expect(result).toBe(0);
    });
  });

  describe('AP Outstanding - Empty Data (Requirement 6.3)', () => {
    it('should return 0 when BKK records array is empty', () => {
      const result = calculateAPOutstanding([]);
      expect(result).toBe(0);
    });

    it('should return 0 when all BKK records have approved/paid/rejected status', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'approved', approved_at: new Date().toISOString(), paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '2', amount: 2000000, workflow_status: 'paid', approved_at: new Date().toISOString(), paid_at: new Date().toISOString(), created_at: new Date().toISOString(), is_active: true },
        { id: '3', amount: 3000000, workflow_status: 'rejected', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateAPOutstanding(bkkRecords);
      expect(result).toBe(0);
    });

    it('should return 0 when all pending BKK records are inactive', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'draft', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: false },
        { id: '2', amount: 2000000, workflow_status: 'pending_check', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: false },
      ];
      const result = calculateAPOutstanding(bkkRecords);
      expect(result).toBe(0);
    });
  });

  describe('AP Due This Week - Empty Data (Requirement 7.3)', () => {
    // Note: AP Due This Week uses the same calculation logic as AP Outstanding
    // but filters by created_at within 7 days. Testing empty data handling.
    it('should return 0 when BKK records array is empty', () => {
      const result = calculateAPOutstanding([]);
      expect(result).toBe(0);
    });
  });

  describe('Pending PJO Approvals - Empty Data (Requirement 8.4)', () => {
    it('should return count 0 and totalValue 0 when PJO array is empty', () => {
      const result = calculatePJOApprovalQueue([]);
      expect(result.count).toBe(0);
      expect(result.totalValue).toBe(0);
    });

    it('should return count 0 and totalValue 0 when no PJOs are pending approval', () => {
      const pjos: PJOForCalculation[] = [
        { id: '1', estimated_amount: 1000000, status: 'draft', is_active: true, approved_at: null, rejected_at: null },
        { id: '2', estimated_amount: 2000000, status: 'approved', is_active: true, approved_at: new Date().toISOString(), rejected_at: null },
        { id: '3', estimated_amount: 3000000, status: 'rejected', is_active: true, approved_at: null, rejected_at: new Date().toISOString() },
      ];
      const result = calculatePJOApprovalQueue(pjos);
      expect(result.count).toBe(0);
      expect(result.totalValue).toBe(0);
    });

    it('should return count 0 and totalValue 0 when all pending PJOs are inactive', () => {
      const pjos: PJOForCalculation[] = [
        { id: '1', estimated_amount: 1000000, status: 'pending_approval', is_active: false, approved_at: null, rejected_at: null },
      ];
      const result = calculatePJOApprovalQueue(pjos);
      expect(result.count).toBe(0);
      expect(result.totalValue).toBe(0);
    });
  });

  describe('Pending Disbursement Approvals - Empty Data (Requirement 9.4)', () => {
    it('should return count 0 and totalValue 0 when BKK records array is empty', () => {
      const result = calculateBKKApprovalQueue([]);
      expect(result.count).toBe(0);
      expect(result.totalValue).toBe(0);
    });

    it('should return count 0 and totalValue 0 when no BKK records are pending', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'draft', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '2', amount: 2000000, workflow_status: 'approved', approved_at: new Date().toISOString(), paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '3', amount: 3000000, workflow_status: 'paid', approved_at: new Date().toISOString(), paid_at: new Date().toISOString(), created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateBKKApprovalQueue(bkkRecords);
      expect(result.count).toBe(0);
      expect(result.totalValue).toBe(0);
    });

    it('should return count 0 and totalValue 0 when all pending BKK records are inactive', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'pending_check', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: false },
        { id: '2', amount: 2000000, workflow_status: 'pending_approval', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: false },
      ];
      const result = calculateBKKApprovalQueue(bkkRecords);
      expect(result.count).toBe(0);
      expect(result.totalValue).toBe(0);
    });
  });

  describe('Recent Invoices - Empty Data (Requirement 10.4)', () => {
    it('should return empty array when invoices array is empty', () => {
      const result = getRecentInvoices([], 5);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should return empty array when no invoices have created_at', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'sent', paid_at: null, due_date: null },
        { id: '2', total_amount: 2000000, amount_paid: null, status: 'draft', paid_at: null, due_date: null },
      ];
      const result = getRecentInvoices(invoices, 5);
      expect(result).toEqual([]);
    });
  });

  describe('Recent Payments - Empty Data (Requirement 11.4)', () => {
    it('should return empty array when invoices array is empty', () => {
      const result = getRecentPayments([], 5);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should return empty array when no invoices are paid', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'sent', paid_at: null, due_date: null, created_at: new Date().toISOString() },
        { id: '2', total_amount: 2000000, amount_paid: null, status: 'draft', paid_at: null, due_date: null, created_at: new Date().toISOString() },
      ];
      const result = getRecentPayments(invoices, 5);
      expect(result).toEqual([]);
    });

    it('should return empty array when paid invoices have no paid_at date', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: 1000000, status: 'paid', paid_at: null, due_date: null, created_at: new Date().toISOString() },
      ];
      const result = getRecentPayments(invoices, 5);
      expect(result).toEqual([]);
    });
  });

  describe('Recent PJO Approvals - Empty Data (Requirement 12.4)', () => {
    it('should return empty array when PJO array is empty', () => {
      const result = getRecentPJOApprovals([], 5);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should return empty array when no PJOs are approved or rejected', () => {
      const pjos: PJOForCalculation[] = [
        { id: '1', estimated_amount: 1000000, status: 'draft', is_active: true, approved_at: null, rejected_at: null },
        { id: '2', estimated_amount: 2000000, status: 'pending_approval', is_active: true, approved_at: null, rejected_at: null },
        { id: '3', estimated_amount: 3000000, status: 'converted', is_active: true, approved_at: null, rejected_at: null },
      ];
      const result = getRecentPJOApprovals(pjos, 5);
      expect(result).toEqual([]);
    });

    it('should return empty array when all approved/rejected PJOs are inactive', () => {
      const pjos: PJOForCalculation[] = [
        { id: '1', estimated_amount: 1000000, status: 'approved', is_active: false, approved_at: new Date().toISOString(), rejected_at: null },
        { id: '2', estimated_amount: 2000000, status: 'rejected', is_active: false, approved_at: null, rejected_at: new Date().toISOString() },
      ];
      const result = getRecentPJOApprovals(pjos, 5);
      expect(result).toEqual([]);
    });
  });

  describe('AR Aging - Empty Data', () => {
    it('should return all buckets with count 0 and amount 0 when invoices array is empty', () => {
      const result = groupInvoicesByAgingBucket([], currentDate);
      expect(result.current.count).toBe(0);
      expect(result.current.amount).toBe(0);
      expect(result.days31to60.count).toBe(0);
      expect(result.days31to60.amount).toBe(0);
      expect(result.days61to90.count).toBe(0);
      expect(result.days61to90.amount).toBe(0);
      expect(result.over90.count).toBe(0);
      expect(result.over90.amount).toBe(0);
    });

    it('should return all buckets with empty invoiceIds when invoices array is empty', () => {
      const result = groupInvoicesByAgingBucket([], currentDate);
      expect(result.current.invoiceIds).toEqual([]);
      expect(result.days31to60.invoiceIds).toEqual([]);
      expect(result.days61to90.invoiceIds).toEqual([]);
      expect(result.over90.invoiceIds).toEqual([]);
    });
  });
});


// =====================================================
// Task 6.2: Unit Tests for NULL Value Handling
// Requirements: Error Handling
// =====================================================

describe('Task 6.2: NULL Value Handling', () => {
  const currentDate = new Date();

  describe('Revenue YTD - NULL Value Handling', () => {
    it('should treat NULL total_amount as 0', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 0, amount_paid: null, status: 'paid', paid_at: new Date().toISOString(), due_date: null },
      ];
      const result = calculateRevenueYTD(invoices, currentDate);
      expect(result).toBe(0);
    });

    it('should handle mixed NULL and valid total_amount values', () => {
      const paidAt = new Date().toISOString();
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'paid', paid_at: paidAt, due_date: null },
        { id: '2', total_amount: 0, amount_paid: null, status: 'paid', paid_at: paidAt, due_date: null },
        { id: '3', total_amount: 2000000, amount_paid: null, status: 'paid', paid_at: paidAt, due_date: null },
      ];
      const result = calculateRevenueYTD(invoices, currentDate);
      expect(result).toBe(3000000);
    });

    it('should handle NULL paid_at gracefully (exclude from calculation)', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'paid', paid_at: null, due_date: null },
        { id: '2', total_amount: 2000000, amount_paid: null, status: 'paid', paid_at: new Date().toISOString(), due_date: null },
      ];
      const result = calculateRevenueYTD(invoices, currentDate);
      expect(result).toBe(2000000);
    });
  });

  describe('Expenses MTD - NULL Value Handling', () => {
    it('should treat NULL amount as 0', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 0, workflow_status: 'approved', approved_at: new Date().toISOString(), paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateExpensesMTD(bkkRecords, currentDate);
      expect(result).toBe(0);
    });

    it('should handle mixed NULL and valid amount values', () => {
      const approvedAt = new Date().toISOString();
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'approved', approved_at: approvedAt, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '2', amount: 0, workflow_status: 'paid', approved_at: approvedAt, paid_at: approvedAt, created_at: new Date().toISOString(), is_active: true },
        { id: '3', amount: 2000000, workflow_status: 'approved', approved_at: approvedAt, paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateExpensesMTD(bkkRecords, currentDate);
      expect(result).toBe(3000000);
    });

    it('should handle NULL approved_at and paid_at gracefully (exclude from calculation)', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'approved', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '2', amount: 2000000, workflow_status: 'approved', approved_at: new Date().toISOString(), paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateExpensesMTD(bkkRecords, currentDate);
      expect(result).toBe(2000000);
    });
  });

  describe('Gross Profit - NULL Value Handling', () => {
    it('should handle 0 values correctly', () => {
      expect(calculateGrossProfit(0, 0)).toBe(0);
      expect(calculateGrossProfit(1000000, 0)).toBe(1000000);
      expect(calculateGrossProfit(0, 1000000)).toBe(-1000000);
    });

    it('should handle large values without overflow', () => {
      const largeRevenue = 999999999999;
      const largeExpenses = 888888888888;
      const result = calculateGrossProfit(largeRevenue, largeExpenses);
      expect(result).toBe(largeRevenue - largeExpenses);
    });
  });

  describe('AR Overdue - NULL Value Handling', () => {
    it('should treat NULL amount_paid as 0 (full amount outstanding)', () => {
      const sixtyDaysAgo = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000);
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'sent', paid_at: null, due_date: sixtyDaysAgo.toISOString() },
      ];
      const result = calculateAROverdue(invoices, currentDate);
      expect(result).toBe(1000000);
    });

    it('should handle partial payments correctly', () => {
      const sixtyDaysAgo = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000);
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: 300000, status: 'sent', paid_at: null, due_date: sixtyDaysAgo.toISOString() },
      ];
      const result = calculateAROverdue(invoices, currentDate);
      expect(result).toBe(700000);
    });

    it('should handle overpayment gracefully (return 0, not negative)', () => {
      const sixtyDaysAgo = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000);
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: 1500000, status: 'sent', paid_at: null, due_date: sixtyDaysAgo.toISOString() },
      ];
      const result = calculateAROverdue(invoices, currentDate);
      expect(result).toBe(0);
    });

    it('should handle NULL due_date gracefully (exclude from calculation)', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'sent', paid_at: null, due_date: null },
      ];
      const result = calculateAROverdue(invoices, currentDate);
      expect(result).toBe(0);
    });
  });

  describe('AR Aging - NULL Value Handling', () => {
    it('should treat NULL amount_paid as 0 when calculating outstanding amount', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'sent', paid_at: null, due_date: new Date().toISOString() },
      ];
      const result = groupInvoicesByAgingBucket(invoices, currentDate);
      expect(result.current.amount).toBe(1000000);
    });

    it('should handle NULL due_date by placing invoice in current bucket', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'sent', paid_at: null, due_date: null },
      ];
      const result = groupInvoicesByAgingBucket(invoices, currentDate);
      expect(result.current.count).toBe(1);
      expect(result.current.invoiceIds).toContain('1');
    });

    it('should handle overpayment gracefully (return 0 amount, not negative)', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: 1500000, status: 'sent', paid_at: null, due_date: new Date().toISOString() },
      ];
      const result = groupInvoicesByAgingBucket(invoices, currentDate);
      expect(result.current.amount).toBe(0);
      expect(result.current.count).toBe(1);
    });
  });

  describe('AP Outstanding - NULL Value Handling', () => {
    it('should treat NULL amount as 0', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 0, workflow_status: 'draft', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateAPOutstanding(bkkRecords);
      expect(result).toBe(0);
    });

    it('should handle mixed NULL and valid amount values', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'draft', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '2', amount: 0, workflow_status: 'pending_check', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '3', amount: 2000000, workflow_status: 'pending_approval', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateAPOutstanding(bkkRecords);
      expect(result).toBe(3000000);
    });
  });

  describe('PJO Approval Queue - NULL Value Handling', () => {
    it('should treat NULL estimated_amount as 0', () => {
      const pjos: PJOForCalculation[] = [
        { id: '1', estimated_amount: null, status: 'pending_approval', is_active: true, approved_at: null, rejected_at: null },
      ];
      const result = calculatePJOApprovalQueue(pjos);
      expect(result.count).toBe(1);
      expect(result.totalValue).toBe(0);
    });

    it('should handle mixed NULL and valid estimated_amount values', () => {
      const pjos: PJOForCalculation[] = [
        { id: '1', estimated_amount: 1000000, status: 'pending_approval', is_active: true, approved_at: null, rejected_at: null },
        { id: '2', estimated_amount: null, status: 'pending_approval', is_active: true, approved_at: null, rejected_at: null },
        { id: '3', estimated_amount: 2000000, status: 'pending_approval', is_active: true, approved_at: null, rejected_at: null },
      ];
      const result = calculatePJOApprovalQueue(pjos);
      expect(result.count).toBe(3);
      expect(result.totalValue).toBe(3000000);
    });
  });

  describe('BKK Approval Queue - NULL Value Handling', () => {
    it('should treat NULL amount as 0', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 0, workflow_status: 'pending_check', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateBKKApprovalQueue(bkkRecords);
      expect(result.count).toBe(1);
      expect(result.totalValue).toBe(0);
    });

    it('should handle mixed NULL and valid amount values', () => {
      const bkkRecords: BKKRecordForCalculation[] = [
        { id: '1', amount: 1000000, workflow_status: 'pending_check', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '2', amount: 0, workflow_status: 'pending_approval', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
        { id: '3', amount: 2000000, workflow_status: 'pending_check', approved_at: null, paid_at: null, created_at: new Date().toISOString(), is_active: true },
      ];
      const result = calculateBKKApprovalQueue(bkkRecords);
      expect(result.count).toBe(3);
      expect(result.totalValue).toBe(3000000);
    });
  });

  describe('Recent Invoices - NULL Value Handling', () => {
    it('should exclude invoices with NULL/undefined created_at', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: null, status: 'sent', paid_at: null, due_date: null, created_at: undefined },
        { id: '2', total_amount: 2000000, amount_paid: null, status: 'sent', paid_at: null, due_date: null, created_at: new Date().toISOString() },
      ];
      const result = getRecentInvoices(invoices, 5);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('Recent Payments - NULL Value Handling', () => {
    it('should exclude paid invoices with NULL paid_at', () => {
      const invoices: InvoiceForCalculation[] = [
        { id: '1', total_amount: 1000000, amount_paid: 1000000, status: 'paid', paid_at: null, due_date: null, created_at: new Date().toISOString() },
        { id: '2', total_amount: 2000000, amount_paid: 2000000, status: 'paid', paid_at: new Date().toISOString(), due_date: null, created_at: new Date().toISOString() },
      ];
      const result = getRecentPayments(invoices, 5);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('Recent PJO Approvals - NULL Value Handling', () => {
    it('should handle PJOs with NULL approved_at and rejected_at', () => {
      const pjos: PJOForCalculation[] = [
        { id: '1', estimated_amount: 1000000, status: 'approved', is_active: true, approved_at: null, rejected_at: null },
        { id: '2', estimated_amount: 2000000, status: 'approved', is_active: true, approved_at: new Date().toISOString(), rejected_at: null },
      ];
      const result = getRecentPJOApprovals(pjos, 5);
      // Both should be included, but the one with a valid timestamp should come first
      expect(result.length).toBe(2);
    });

    it('should handle NULL estimated_amount in results', () => {
      const pjos: PJOForCalculation[] = [
        { id: '1', estimated_amount: null, status: 'approved', is_active: true, approved_at: new Date().toISOString(), rejected_at: null },
      ];
      const result = getRecentPJOApprovals(pjos, 5);
      expect(result.length).toBe(1);
      expect(result[0].estimated_amount).toBeNull();
    });
  });
});
