// =====================================================
// v0.46: HSE - INCIDENT REPORTING SERVER ACTIONS
// Barrel re-export file — split into:
//   - incident-core-actions.ts (CRUD + workflows)
//   - incident-analytics-actions.ts (statistics + dashboard)
// =====================================================

export {
  getIncidentCategories,
  reportIncident,
  getIncident,
  getIncidents,
  startInvestigation,
  updateRootCause,
  completeInvestigation,
  addCorrectiveAction,
  addPreventiveAction,
  completeAction,
  closeIncident,
  rejectIncident,
  addPersonToIncident,
  removePersonFromIncident,
  getIncidentHistory,
} from './incident-core-actions';

export {
  getIncidentStatistics,
  getIncidentDashboardSummary,
} from './incident-analytics-actions';
