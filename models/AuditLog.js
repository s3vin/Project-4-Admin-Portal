const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'ROLE_CREATED',
      'ROLE_UPDATED',
      'ROLE_DELETED',
      'PERMISSION_ADDED',
      'PERMISSION_REMOVED',
      'PERMISSION_MODIFIED',
      'USER_ASSIGNED',
      'USER_REMOVED',
      'BULK_ASSIGNMENT',
      'ROLE_COMPARED',
      'NOTIFICATION_CHANGED',
      'AUDIT_CONFIG_CHANGED'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Role', 'User', 'Permission']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetRole: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function(data) {
  try {
    const log = await this.create(data);
    return log;
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - auditing shouldn't break main functionality
    return null;
  }
};

// Static method to get activity for a specific role
auditLogSchema.statics.getRoleActivity = async function(roleId, options = {}) {
  const query = {
    $or: [
      { entityId: roleId, entityType: 'Role' },
      { targetRole: roleId }
    ]
  };
  
  const logs = await this.find(query)
    .populate('performedBy', 'username email')
    .populate('targetUser', 'username email')
    .populate('targetRole', 'name')
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
  
  return logs;
};

// Static method to get user's activity
auditLogSchema.statics.getUserActivity = async function(userId, options = {}) {
  const query = { performedBy: userId };
  
  const logs = await this.find(query)
    .populate('targetUser', 'username email')
    .populate('targetRole', 'name')
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
  
  return logs;
};

// Auto-cleanup old logs based on retention policy
auditLogSchema.statics.cleanupOldLogs = async function() {
  const roles = await mongoose.model('Role').find({ 'auditConfiguration.enabled': true });
  
  for (const role of roles) {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - role.auditConfiguration.retentionDays);
    
    await this.deleteMany({
      targetRole: role._id,
      createdAt: { $lt: retentionDate }
    });
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
