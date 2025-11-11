const express = require('express');
const router = express.Router();
const {
  getAllAuditLogs,
  getRoleAuditLogs,
  getUserAuditLogs,
  getAuditStats,
  exportAuditLogs
} = require('../controllers/auditController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication and admin privileges
router.use(protect, admin);

router.get('/', getAllAuditLogs);
router.get('/stats', getAuditStats);
router.get('/export', exportAuditLogs);
router.get('/role/:roleId', getRoleAuditLogs);
router.get('/user/:userId', getUserAuditLogs);

module.exports = router;
