const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  assignedRoles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    roleAssignments: { type: Boolean, default: true },
    permissionChanges: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get effective permissions from all assigned roles
userSchema.methods.getEffectivePermissions = async function() {
  if (!this.assignedRoles || this.assignedRoles.length === 0) {
    return [];
  }
  
  const Role = mongoose.model('Role');
  const roles = await Role.find({ _id: { $in: this.assignedRoles } });
  
  const allPermissions = new Map();
  
  for (const role of roles) {
    const rolePerms = await role.getEffectivePermissions();
    rolePerms.forEach(perm => {
      const existing = allPermissions.get(perm.module);
      if (!existing) {
        allPermissions.set(perm.module, { ...perm });
      } else {
        // Merge permissions - grant if any role allows
        allPermissions.set(perm.module, {
          module: perm.module,
          read: existing.read || perm.read,
          write: existing.write || perm.write,
          delete: existing.delete || perm.delete,
          admin: existing.admin || perm.admin
        });
      }
    });
  }
  
  return Array.from(allPermissions.values());
};

// Check if user has specific permission
userSchema.methods.hasPermission = async function(module, action) {
  const permissions = await this.getEffectivePermissions();
  const modulePerm = permissions.find(p => p.module === module);
  return modulePerm ? modulePerm[action] : false;
};

module.exports = mongoose.model('User', userSchema);
