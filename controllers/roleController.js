const Role = require('../models/Role');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Create new role (wizard step 1-5)
// @route   POST /api/roles
// @access  Private/Admin
const createRole = async (req, res) => {
  try {
    const { name, description, parentRole, permissions, inheritPermissions, conflictResolution, notificationSettings, auditConfiguration } = req.body;

    const role = await Role.create({
      name,
      description,
      parentRole: parentRole || null,
      permissions: permissions || [],
      inheritPermissions: inheritPermissions !== false,
      conflictResolution: conflictResolution || 'merge',
      notificationSettings: notificationSettings || {},
      auditConfiguration: auditConfiguration || {},
      createdBy: req.user._id
    });

    // Log the action
    await AuditLog.logAction({
      action: 'ROLE_CREATED',
      entityType: 'Role',
      entityId: role._id,
      performedBy: req.user._id,
      targetRole: role._id,
      description: `Role "${role.name}" created`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('parentRole', 'name')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single role with effective permissions
// @route   GET /api/roles/:id
// @access  Private/Admin
const getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('parentRole', 'name permissions')
      .populate('createdBy', 'username email');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const effectivePermissions = await role.getEffectivePermissions();

    res.json({
      ...role.toObject(),
      effectivePermissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const oldRole = { ...role.toObject() };

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy') {
        role[key] = req.body[key];
      }
    });

    role.updatedBy = req.user._id;
    await role.save();

    // Log the action
    await AuditLog.logAction({
      action: 'ROLE_UPDATED',
      entityType: 'Role',
      entityId: role._id,
      performedBy: req.user._id,
      targetRole: role._id,
      changes: {
        before: oldRole,
        after: role.toObject()
      },
      description: `Role "${role.name}" updated`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Remove role from all users
    await User.updateMany(
      { assignedRoles: role._id },
      { $pull: { assignedRoles: role._id } }
    );

    await role.deleteOne();

    // Log the action
    await AuditLog.logAction({
      action: 'ROLE_DELETED',
      entityType: 'Role',
      entityId: role._id,
      performedBy: req.user._id,
      targetRole: role._id,
      description: `Role "${role.name}" deleted`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Compare two roles
// @route   GET /api/roles/compare/:id1/:id2
// @access  Private/Admin
const compareRoles = async (req, res) => {
  try {
    const comparison = await Role.compareRoles(req.params.id1, req.params.id2);

    // Log the action
    await AuditLog.logAction({
      action: 'ROLE_COMPARED',
      entityType: 'Role',
      entityId: req.params.id1,
      performedBy: req.user._id,
      description: `Compared roles "${comparison.role1.name}" and "${comparison.role2.name}"`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign role to user
// @route   POST /api/roles/:id/assign
// @access  Private/Admin
const assignRoleToUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.assignedRoles.includes(role._id)) {
      user.assignedRoles.push(role._id);
      await user.save();

      // Log the action
      await AuditLog.logAction({
        action: 'USER_ASSIGNED',
        entityType: 'User',
        entityId: user._id,
        performedBy: req.user._id,
        targetUser: user._id,
        targetRole: role._id,
        description: `User "${user.username}" assigned to role "${role.name}"`,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.json({ message: 'Role assigned successfully', user });
    } else {
      res.status(400).json({ message: 'User already has this role' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove role from user
// @route   POST /api/roles/:id/remove
// @access  Private/Admin
const removeRoleFromUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.assignedRoles = user.assignedRoles.filter(r => r.toString() !== role._id.toString());
    await user.save();

    // Log the action
    await AuditLog.logAction({
      action: 'USER_REMOVED',
      entityType: 'User',
      entityId: user._id,
      performedBy: req.user._id,
      targetUser: user._id,
      targetRole: role._id,
      description: `User "${user.username}" removed from role "${role.name}"`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({ message: 'Role removed successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk assign role to multiple users
// @route   POST /api/roles/:id/bulk-assign
// @access  Private/Admin
const bulkAssignRole = async (req, res) => {
  try {
    const { userIds } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, assignedRoles: { $ne: role._id } },
      { $addToSet: { assignedRoles: role._id } }
    );

    // Log the action
    await AuditLog.logAction({
      action: 'BULK_ASSIGNMENT',
      entityType: 'Role',
      entityId: role._id,
      performedBy: req.user._id,
      targetRole: role._id,
      changes: {
        userIds,
        count: result.modifiedCount
      },
      description: `Bulk assigned role "${role.name}" to ${result.modifiedCount} users`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({ message: `Role assigned to ${result.modifiedCount} users`, result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users with specific role
// @route   GET /api/roles/:id/users
// @access  Private/Admin
const getRoleUsers = async (req, res) => {
  try {
    const users = await User.find({ assignedRoles: req.params.id })
      .select('-password')
      .sort({ username: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRole,
  updateRole,
  deleteRole,
  compareRoles,
  assignRoleToUser,
  removeRoleFromUser,
  bulkAssignRole,
  getRoleUsers
};
