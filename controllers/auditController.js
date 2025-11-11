const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private/Admin
const getAllAuditLogs = async (req, res) => {
  try {
    const { action, entityType, startDate, endDate, limit = 100, skip = 0 } = req.query;

    const query = {};

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'username email')
      .populate('targetUser', 'username email')
      .populate('targetRole', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get audit logs for specific role
// @route   GET /api/audit/role/:roleId
// @access  Private/Admin
const getRoleAuditLogs = async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;

    const logs = await AuditLog.getRoleActivity(req.params.roleId, {
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get audit logs for specific user
// @route   GET /api/audit/user/:userId
// @access  Private/Admin
const getUserAuditLogs = async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;

    const logs = await AuditLog.getUserActivity(req.params.userId, {
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get audit statistics
// @route   GET /api/audit/stats
// @access  Private/Admin
const getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalLogs = await AuditLog.countDocuments(dateFilter);

    res.json({
      totalLogs,
      actionBreakdown: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export audit logs to CSV
// @route   GET /api/audit/export
// @access  Private/Admin
const exportAuditLogs = async (req, res) => {
  try {
    const { action, entityType, startDate, endDate } = req.query;

    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'username email')
      .populate('targetUser', 'username email')
      .populate('targetRole', 'name')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeader = 'Date,Action,Entity Type,Performed By,Target User,Target Role,Description\n';
    const csvRows = logs.map(log => {
      const date = new Date(log.createdAt).toISOString();
      const performedBy = log.performedBy ? log.performedBy.username : 'N/A';
      const targetUser = log.targetUser ? log.targetUser.username : 'N/A';
      const targetRole = log.targetRole ? log.targetRole.name : 'N/A';
      const description = log.description.replace(/,/g, ';'); // Escape commas

      return `${date},${log.action},${log.entityType},${performedBy},${targetUser},${targetRole},"${description}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllAuditLogs,
  getRoleAuditLogs,
  getUserAuditLogs,
  getAuditStats,
  exportAuditLogs
};
