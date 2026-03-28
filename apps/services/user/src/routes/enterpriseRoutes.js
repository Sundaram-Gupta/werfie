const express = require('express');
const router = express.Router();
const controller = require('../controllers/enterpriseController');
const authenticateToken = require('../middleware/auth');

// Optional auth, assuming auth middleware is attached. 
// For alert rules, we strictly require authentication.

// Signals
router.get('/signals', controller.getSignals);
router.get('/signals/history', controller.getSignalsHistory);
router.get('/signals/:id', controller.getSignalById);

// Alerts
router.post('/alerts/create', authenticateToken, controller.createAlertRule);
router.put('/alerts/update/:id', authenticateToken, controller.updateAlertRule);
router.get('/alerts/list', authenticateToken, controller.listAlertRules);
router.delete('/alerts/delete/:id', authenticateToken, controller.deleteAlertRule);

// Metrics
router.get('/metrics/overview', controller.getMetricsOverview);

// Export
router.get('/export/csv', controller.exportCsv);
router.get('/export/json', controller.exportJson);

// Webhook mock
router.post('/webhook/register', (req, res) => res.json({ success: true }));

// For testing real-time events locally
router.post('/trigger-mock', controller.triggerMockAnnouncement);

module.exports = router;
