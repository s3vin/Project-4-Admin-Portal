# Admin Portal with Advanced Role Management

A comprehensive full-stack admin portal with granular role management, permission inheritance, audit trails, and bulk user operations.

## Features Implemented

### 🎯 Role Management Wizard (5-Step Process)

1. **Group Basics**
   - Role name and description
   - Parent role selection for inheritance
   - Inheritance toggle
   - Conflict resolution strategy (Merge/Override/Inherit)

2. **Permissions Matrix**
   - Granular module-level permissions (Read/Write/Delete/Admin)
   - 8 modules: Users, Roles, Content, Settings, Reports, Analytics, Billing, Support
   - Visual permission grid with checkboxes

3. **Member Assignment**
   - User search functionality
   - Drag-and-drop style user selection
   - Bulk user assignment
   - Real-time user count

4. **Notification Settings**
   - Configurable notifications per action type:
     - User assigned to role
     - Permission changes
     - Role modifications
     - User removed from role

5. **Audit Configuration**
   - Enable/disable audit logging
   - Granular logging controls:
     - Permission changes
     - User assignments
     - Role modifications
   - Configurable retention period (1-365 days)
   - Review summary before saving

### 🔐 Permission System

- **Granular Control**: 4 permission levels per module
  - Read: View access
  - Write: Create/Edit access
  - Delete: Removal access
  - Admin: Full administrative control

- **Inheritance**: Roles can inherit from parent roles
  
- **Conflict Resolution Strategies**:
  - **Merge**: OR operation - grant if either parent or child allows
  - **Override**: Child permissions completely override parent
  - **Inherit**: Keep only parent permissions

### 👥 User Management

- **Search & Filter**: Real-time user search by username/email
- **Bulk Operations**: Assign roles to multiple users at once
- **Role Assignment**: Add/remove users from roles
- **User Listing**: View all users with their assigned roles

### 📊 Audit Trail

- **Comprehensive Logging**:
  - Role creation/updates/deletion
  - Permission additions/removals/modifications
  - User assignments/removals
  - Bulk assignments
  - Role comparisons

- **Filtering**:
  - By action type
  - By date range
  - By user
  - By role

- **Export**: CSV export for compliance and reporting

### 🔍 Role Comparison Tool

- Side-by-side comparison of two roles
- Highlights permission differences
- Shows effective permissions (including inheritance)
- Visual permission matrix

## API Endpoints

### Role Management
```
POST   /api/roles                    - Create new role
GET    /api/roles                    - Get all roles
GET    /api/roles/:id                - Get role with effective permissions
PUT    /api/roles/:id                - Update role
DELETE /api/roles/:id                - Delete role
GET    /api/roles/compare/:id1/:id2  - Compare two roles
POST   /api/roles/:id/assign         - Assign role to user
POST   /api/roles/:id/remove         - Remove role from user
POST   /api/roles/:id/bulk-assign    - Bulk assign to users
GET    /api/roles/:id/users          - Get users with role
```

### Audit Logs
```
GET    /api/audit                    - Get all audit logs (with filters)
GET    /api/audit/stats              - Get audit statistics
GET    /api/audit/export             - Export logs to CSV
GET    /api/audit/role/:roleId       - Get logs for specific role
GET    /api/audit/user/:userId       - Get logs for specific user
```

### Users
```
POST   /api/users/register           - Register new user
POST   /api/users/login              - Login user
GET    /api/users/profile            - Get user profile
GET    /api/users                    - Get all users (admin)
```

## Database Models

### Role Schema
```javascript
{
  name: String,
  description: String,
  parentRole: ObjectId (ref: Role),
  permissions: [{
    module: String (enum),
    read: Boolean,
    write: Boolean,
    delete: Boolean,
    admin: Boolean
  }],
  inheritPermissions: Boolean,
  conflictResolution: String (merge/override/inherit),
  notificationSettings: {
    onUserAssigned: Boolean,
    onPermissionChanged: Boolean,
    onRoleModified: Boolean,
    onUserRemoved: Boolean
  },
  auditConfiguration: {
    enabled: Boolean,
    logPermissionChanges: Boolean,
    logUserAssignments: Boolean,
    logRoleModifications: Boolean,
    retentionDays: Number
  }
}
```

### AuditLog Schema
```javascript
{
  action: String (enum),
  entityType: String (Role/User/Permission),
  entityId: ObjectId,
  performedBy: ObjectId (ref: User),
  targetUser: ObjectId (ref: User),
  targetRole: ObjectId (ref: Role),
  changes: Mixed,
  metadata: {
    ipAddress: String,
    userAgent: String
  },
  description: String
}
```

### User Schema (Enhanced)
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: String (legacy),
  assignedRoles: [ObjectId] (ref: Role),
  notificationPreferences: {
    emailNotifications: Boolean,
    roleAssignments: Boolean,
    permissionChanges: Boolean,
    systemAlerts: Boolean
  },
  isActive: Boolean,
  lastLogin: Date
}
```

## Installation & Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
Create `.env` file:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/adminPortal
JWT_SECRET=your-secret-key-here
```

3. **Start MongoDB**
```bash
sudo service mongod start
```

4. **Run the Application**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

5. **Access the Portal**
```
http://localhost:5000
```

## Usage Guide

### Creating a Role

1. Navigate to "Role Management" tab
2. Click "Create New Role"
3. Follow the 5-step wizard:
   - Enter role name and description
   - Select parent role (optional)
   - Configure permissions in the matrix
   - Assign users
   - Set notification preferences
   - Configure audit settings
4. Click "Save Role"

### Assigning Bulk Users

1. Edit an existing role
2. Navigate to "Member Assignment" step
3. Search for users
4. Click "Add" to select multiple users
5. Selected users appear in right panel
6. Save the role to apply assignments

### Comparing Roles

1. Go to Role Management
2. Note the role IDs you want to compare
3. Click "Compare Roles" (or use API)
4. View side-by-side permission comparison
5. Differences are highlighted

### Viewing Audit Trail

1. Navigate to "Audit Trail" tab
2. Use filters to narrow down logs:
   - Select action type
   - Choose date range
3. Click "Filter" to apply
4. Click "Export CSV" to download logs

### Permission Inheritance Example

```
Parent Role: "Manager"
- Users: Read, Write
- Content: Read, Write

Child Role: "Senior Manager" (inherits from Manager)
- Users: Admin (overrides)
- Reports: Read, Write (new)

Effective Permissions (Merge strategy):
- Users: Read, Write, Admin
- Content: Read, Write
- Reports: Read, Write
```

## Security Features

- JWT-based authentication
- Bcrypt password hashing
- Admin-only role management endpoints
- Audit logging for compliance
- Role-based access control (RBAC)
- Permission inheritance with conflict resolution

## Technologies Used

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing

**Frontend:**
- Vanilla JavaScript
- HTML5 & CSS3
- Responsive design
- No framework dependencies

## Project Structure

```
Project-4-Admin-Portal/
├── config/
│   └── db.js                    # MongoDB connection
├── models/
│   ├── User.js                  # Enhanced user model
│   ├── Role.js                  # Role with permissions & inheritance
│   └── AuditLog.js              # Audit trail model
├── controllers/
│   ├── userController.js        # User operations
│   ├── roleController.js        # Role management & comparison
│   └── auditController.js       # Audit log operations
├── routes/
│   ├── userRoutes.js           # User endpoints
│   ├── roleRoutes.js           # Role endpoints
│   └── auditRoutes.js          # Audit endpoints
├── middleware/
│   └── auth.js                 # JWT authentication & admin check
├── public/
│   ├── index.html              # Main UI with tabs
│   ├── app.js                  # Authentication & user management
│   ├── role-management.js      # Role wizard & management
│   └── role-styles.css         # Styling
├── .env                        # Environment variables
├── .gitignore
├── package.json
└── index.js                    # Express server entry point
```

## Future Enhancements

- [ ] Role templates for quick creation
- [ ] Permission presets (read-only, editor, admin)
- [ ] Real-time notifications via WebSockets
- [ ] Advanced audit analytics dashboard
- [ ] LDAP/Active Directory integration
- [ ] Two-factor authentication (2FA)
- [ ] API rate limiting
- [ ] Role expiration dates
- [ ] Temporary permission grants

## License

ISC

## Author

Admin Portal Development Team
