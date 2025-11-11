# Quick Start Guide

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Ensure MongoDB is Running
```bash
# Check MongoDB status
sudo service mongod status

# If not running, start it
sudo service mongod start
```

### 3. Seed the Database (Optional but Recommended)
```bash
npm run seed
```

This creates:
- Admin user: `admin@admin.com` / `admin123`
- 5 Sample roles with different permission levels
- 3 Test users with various role assignments

### 4. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

### 5. Access the Application
Open your browser and navigate to:
```
http://localhost:5000
```

## First Time Login

1. Use admin credentials: `admin@admin.com` / `admin123`
2. You'll see the dashboard with 4 tabs
3. Navigate to "Role Management" to start creating roles

## Creating Your First Role

1. Click "Create New Role" button
2. **Step 1 - Basics**:
   - Enter role name (e.g., "Customer Support")
   - Add description
   - Optionally select a parent role to inherit from
   - Choose conflict resolution strategy

3. **Step 2 - Permissions**:
   - Check permissions for each module
   - Choose from Read, Write, Delete, Admin levels

4. **Step 3 - Members**:
   - Search for users
   - Click "Add" to assign them to this role
   - Selected users appear in the right panel

5. **Step 4 - Notifications**:
   - Configure notification preferences
   - Choose which actions trigger notifications

6. **Step 5 - Audit**:
   - Enable audit logging
   - Set retention period
   - Review summary and click "Save Role"

## Testing Role Features

### Permission Inheritance
1. Create a parent role (e.g., "Editor")
2. Create a child role that inherits from it
3. View the child role to see effective permissions

### Bulk User Assignment
1. Edit an existing role
2. Go to Members step
3. Select multiple users
4. Save to assign all at once

### Role Comparison
1. In Role Management tab
2. Note IDs of two roles
3. Use comparison feature (via prompt or API)
4. View side-by-side permission differences

### Audit Trail
1. Perform some actions (create/edit roles, assign users)
2. Navigate to "Audit Trail" tab
3. Filter by action type or date range
4. Export to CSV for reporting

## API Testing with cURL

### Create a Role
```bash
curl -X POST http://localhost:5000/api/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Role",
    "description": "A test role",
    "permissions": [
      {"module": "users", "read": true, "write": false, "delete": false, "admin": false}
    ]
  }'
```

### Get All Roles
```bash
curl http://localhost:5000/api/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Compare Roles
```bash
curl http://localhost:5000/api/roles/compare/ROLE1_ID/ROLE2_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Audit Logs
```bash
curl http://localhost:5000/api/audit?limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo service mongod status

# Start MongoDB if needed
sudo service mongod start

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change PORT in .env file
```

### Can't Login
1. Make sure you've run `npm run seed`
2. Use correct credentials: `admin@admin.com` / `admin123`
3. Check browser console for errors
4. Verify MongoDB is running and connected

### Permissions Not Updating
1. Clear browser localStorage
2. Log out and log back in
3. Check audit logs for permission changes
4. Verify role inheritance settings

## Available Test Accounts

After seeding:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@admin.com | admin123 | Super Admin |
| john_editor | john@test.com | test123 | Content Editor |
| jane_manager | jane@test.com | test123 | Manager |
| bob_user | bob@test.com | test123 | Basic User |

## Next Steps

1. Explore the role management wizard
2. Create custom roles for your organization
3. Assign users to roles
4. Test permission inheritance
5. Review audit trails
6. Export audit logs for compliance

## Getting Your JWT Token

1. Login via the UI
2. Open browser DevTools (F12)
3. Go to Console tab
4. Type: `localStorage.getItem('token')`
5. Copy the token for API testing

## Environment Variables

Create/modify `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/adminPortal
JWT_SECRET=your-secret-key-change-in-production
```

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review API endpoints in the documentation
3. Check MongoDB and server logs
4. Verify all dependencies are installed

Happy role managing! 🚀
