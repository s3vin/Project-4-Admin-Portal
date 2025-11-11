// Seed script to create initial admin user and sample roles
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const User = require('./models/User');
const Role = require('./models/Role');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/adminPortal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Role.deleteMany({});
    // console.log('Cleared existing data');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@admin.com' });
    
    let adminUser;
    if (!adminExists) {
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@admin.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      console.log('Created admin user: admin@admin.com / admin123');
    } else {
      adminUser = adminExists;
      console.log('Admin user already exists');
    }

    // Create sample roles

    // 1. Basic User Role
    const basicUserRole = await Role.create({
      name: 'Basic User',
      description: 'Standard user with read-only access to most modules',
      permissions: [
        { module: 'content', read: true, write: false, delete: false, admin: false },
        { module: 'reports', read: true, write: false, delete: false, admin: false }
      ],
      inheritPermissions: false,
      conflictResolution: 'merge',
      notificationSettings: {
        onUserAssigned: true,
        onPermissionChanged: false,
        onRoleModified: false,
        onUserRemoved: false
      },
      auditConfiguration: {
        enabled: true,
        logPermissionChanges: true,
        logUserAssignments: true,
        logRoleModifications: false,
        retentionDays: 30
      },
      createdBy: adminUser._id
    });
    console.log('Created role: Basic User');

    // 2. Content Editor Role
    const contentEditorRole = await Role.create({
      name: 'Content Editor',
      description: 'Can create and edit content',
      permissions: [
        { module: 'content', read: true, write: true, delete: false, admin: false },
        { module: 'reports', read: true, write: false, delete: false, admin: false },
        { module: 'analytics', read: true, write: false, delete: false, admin: false }
      ],
      inheritPermissions: false,
      conflictResolution: 'merge',
      notificationSettings: {
        onUserAssigned: true,
        onPermissionChanged: true,
        onRoleModified: false,
        onUserRemoved: false
      },
      auditConfiguration: {
        enabled: true,
        logPermissionChanges: true,
        logUserAssignments: true,
        logRoleModifications: true,
        retentionDays: 60
      },
      createdBy: adminUser._id
    });
    console.log('Created role: Content Editor');

    // 3. Manager Role
    const managerRole = await Role.create({
      name: 'Manager',
      description: 'Department manager with extended permissions',
      permissions: [
        { module: 'users', read: true, write: true, delete: false, admin: false },
        { module: 'content', read: true, write: true, delete: true, admin: false },
        { module: 'reports', read: true, write: true, delete: false, admin: false },
        { module: 'analytics', read: true, write: true, delete: false, admin: false }
      ],
      inheritPermissions: false,
      conflictResolution: 'merge',
      notificationSettings: {
        onUserAssigned: true,
        onPermissionChanged: true,
        onRoleModified: true,
        onUserRemoved: true
      },
      auditConfiguration: {
        enabled: true,
        logPermissionChanges: true,
        logUserAssignments: true,
        logRoleModifications: true,
        retentionDays: 90
      },
      createdBy: adminUser._id
    });
    console.log('Created role: Manager');

    // 4. Senior Manager Role (inherits from Manager)
    const seniorManagerRole = await Role.create({
      name: 'Senior Manager',
      description: 'Senior manager with additional permissions, inherits from Manager',
      parentRole: managerRole._id,
      permissions: [
        { module: 'users', read: true, write: true, delete: true, admin: false },
        { module: 'billing', read: true, write: true, delete: false, admin: false },
        { module: 'settings', read: true, write: true, delete: false, admin: false }
      ],
      inheritPermissions: true,
      conflictResolution: 'merge',
      notificationSettings: {
        onUserAssigned: true,
        onPermissionChanged: true,
        onRoleModified: true,
        onUserRemoved: true
      },
      auditConfiguration: {
        enabled: true,
        logPermissionChanges: true,
        logUserAssignments: true,
        logRoleModifications: true,
        retentionDays: 90
      },
      createdBy: adminUser._id
    });
    console.log('Created role: Senior Manager (inherits from Manager)');

    // 5. Super Admin Role
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Full administrative access to all modules',
      permissions: [
        { module: 'users', read: true, write: true, delete: true, admin: true },
        { module: 'roles', read: true, write: true, delete: true, admin: true },
        { module: 'content', read: true, write: true, delete: true, admin: true },
        { module: 'settings', read: true, write: true, delete: true, admin: true },
        { module: 'reports', read: true, write: true, delete: true, admin: true },
        { module: 'analytics', read: true, write: true, delete: true, admin: true },
        { module: 'billing', read: true, write: true, delete: true, admin: true },
        { module: 'support', read: true, write: true, delete: true, admin: true }
      ],
      inheritPermissions: false,
      conflictResolution: 'override',
      notificationSettings: {
        onUserAssigned: true,
        onPermissionChanged: true,
        onRoleModified: true,
        onUserRemoved: true
      },
      auditConfiguration: {
        enabled: true,
        logPermissionChanges: true,
        logUserAssignments: true,
        logRoleModifications: true,
        retentionDays: 365
      },
      createdBy: adminUser._id
    });
    console.log('Created role: Super Admin');

    // Assign Super Admin role to admin user
    if (!adminUser.assignedRoles.includes(superAdminRole._id)) {
      adminUser.assignedRoles.push(superAdminRole._id);
      await adminUser.save();
      console.log('Assigned Super Admin role to admin user');
    }

    // Create additional test users
    const testUsers = [
      { username: 'john_editor', email: 'john@test.com', password: 'test123', roleId: contentEditorRole._id },
      { username: 'jane_manager', email: 'jane@test.com', password: 'test123', roleId: managerRole._id },
      { username: 'bob_user', email: 'bob@test.com', password: 'test123', roleId: basicUserRole._id }
    ];

    for (const userData of testUsers) {
      const userExists = await User.findOne({ email: userData.email });
      if (!userExists) {
        const user = await User.create({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: 'user',
          assignedRoles: [userData.roleId],
          isActive: true
        });
        console.log(`Created test user: ${userData.email} / test123`);
      } else {
        console.log(`User ${userData.email} already exists`);
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@admin.com / admin123');
    console.log('Editor: john@test.com / test123');
    console.log('Manager: jane@test.com / test123');
    console.log('User: bob@test.com / test123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
