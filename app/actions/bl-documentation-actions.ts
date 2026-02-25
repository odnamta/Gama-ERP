'use server';

// =====================================================
// BARREL RE-EXPORT FILE
// This file has been split into domain-specific modules:
//   - bl-actions.ts (Bill of Lading)
//   - shipping-instruction-actions.ts (Shipping Instructions)
//   - arrival-notice-actions.ts (Arrival Notices)
//   - cargo-manifest-actions.ts (Cargo Manifests)
//
// This file re-exports everything for backward compatibility.
// New code should import directly from the domain-specific files.
// =====================================================

// Bill of Lading
export {
  createBillOfLading,
  updateBillOfLading,
  getBillOfLading,
  getBillsOfLading,
  updateBLStatus,
  submitBillOfLading,
  issueBillOfLading,
  releaseBillOfLading,
  surrenderBillOfLading,
  deleteBillOfLading,
  getBLStats,
} from './bl-actions';
export type { BLStats } from './bl-actions';

// Shipping Instructions
export {
  createShippingInstruction,
  updateShippingInstruction,
  getShippingInstruction,
  getShippingInstructions,
  deleteShippingInstruction,
  submitShippingInstruction,
  confirmShippingInstruction,
  amendShippingInstruction,
  updateSIStatus,
  getSIStats,
} from './shipping-instruction-actions';
export type { SIStats } from './shipping-instruction-actions';

// Arrival Notices
export {
  createArrivalNotice,
  updateArrivalNotice,
  getArrivalNotice,
  getArrivalNotices,
  deleteArrivalNotice,
  markConsigneeNotified,
  markCargoCleared,
  markCargoDelivered,
  updateArrivalNoticeStatus,
  getPendingArrivals,
} from './arrival-notice-actions';

// Cargo Manifests
export {
  createCargoManifest,
  updateCargoManifest,
  getCargoManifest,
  getCargoManifests,
  deleteCargoManifest,
  linkBLsToManifest,
  submitManifest,
  approveManifest,
  updateManifestStatus,
  getCargoManifestWithBLs,
} from './cargo-manifest-actions';
