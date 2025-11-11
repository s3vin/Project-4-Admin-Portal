const mongoose = require('mongoose');

// Permission schema for granular control
const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: ['users', 'roles', 'content', 'settings', 'reports', 'analytics', 'billing', 'support']
  },
  read: { type: Boolean, default: false },
  write: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  admin: { type: Boolean, default: false }
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a role name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a role description'],
    maxlength: 500
  },
  parentRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    default: null
  },
  permissions: {
    type: [permissionSchema],
    default: []
  },
  inheritPermissions: {
    type: Boolean,
    default: true
  },
  conflictResolution: {
    type: String,
    enum: ['inherit', 'override', 'merge'],
    default: 'merge'
  },
  notificationSettings: {
    onUserAssigned: { type: Boolean, default: true },
    onPermissionChanged: { type: Boolean, default: true },
    onRoleModified: { type: Boolean, default: true },
    onUserRemoved: { type: Boolean, default: false }
  },
  auditConfiguration: {
    enabled: { type: Boolean, default: true },
    logPermissionChanges: { type: Boolean, default: true },
    logUserAssignments: { type: Boolean, default: true },
    logRoleModifications: { type: Boolean, default: true },
    retentionDays: { type: Number, default: 90 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Method to get effective permissions (with inheritance)
roleSchema.methods.getEffectivePermissions = async function() {
  let effectivePermissions = [...this.permissions];
  
  if (this.inheritPermissions && this.parentRole) {
    const parent = await mongoose.model('Role').findById(this.parentRole);
    if (parent) {
      const parentPermissions = await parent.getEffectivePermissions();
      
      // Merge permissions based on conflict resolution strategy
      effectivePermissions = this.mergePermissions(parentPermissions, effectivePermissions);
    }
  }
  
  return effectivePermissions;
};

// Merge permissions based on conflict resolution strategy
roleSchema.methods.mergePermissions = function(parentPerms, childPerms) {
  const permMap = new Map();
  
  // Add parent permissions first
  parentPerms.forEach(perm => {
    permMap.set(perm.module, { ...perm });
  });
  
  // Apply child permissions based on strategy
  childPerms.forEach(perm => {
    const existing = permMap.get(perm.module);
    
    if (!existing) {
      permMap.set(perm.module, { ...perm });
    } else {
      switch (this.conflictResolution) {
        case 'override':
          // Child completely overrides parent
          permMap.set(perm.module, { ...perm });
          break;
        case 'merge':
          // OR operation - grant if either allows
          permMap.set(perm.module, {
            module: perm.module,
            read: existing.read || perm.read,
            write: existing.write || perm.write,
            delete: existing.delete || perm.delete,
            admin: existing.admin || perm.admin
          });
          break;
        case 'inherit':
          // Keep parent permissions
          break;
      }
    }
  });
  
  return Array.from(permMap.values());
};

// Static method to compare two roles
roleSchema.statics.compareRoles = async function(roleId1, roleId2) {
  const role1 = await this.findById(roleId1);
  const role2 = await this.findById(roleId2);
  
  if (!role1 || !role2) {
    throw new Error('One or both roles not found');
  }
  
  const perms1 = await role1.getEffectivePermissions();
  const perms2 = await role2.getEffectivePermissions();
  
  const comparison = {
    role1: { name: role1.name, permissions: perms1 },
    role2: { name: role2.name, permissions: perms2 },
    differences: []
  };
  
  // Compare permissions
  const allModules = new Set([...perms1.map(p => p.module), ...perms2.map(p => p.module)]);
  
  allModules.forEach(module => {
    const perm1 = perms1.find(p => p.module === module) || { read: false, write: false, delete: false, admin: false };
    const perm2 = perms2.find(p => p.module === module) || { read: false, write: false, delete: false, admin: false };
    
    if (JSON.stringify(perm1) !== JSON.stringify(perm2)) {
      comparison.differences.push({
        module,
        role1: perm1,
        role2: perm2
      });
    }
  });
  
  return comparison;
};

module.exports = mongoose.model('Role', roleSchema);
