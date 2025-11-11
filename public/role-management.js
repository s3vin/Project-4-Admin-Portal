// Role Management Application
const RoleManagementApp = {
    currentStep: 1,
    roleData: {},
    selectedUsers: [],
    allUsers: [],
    allRoles: [],
    currentRole: null,

    modules: ['users', 'roles', 'content', 'settings', 'reports', 'analytics', 'billing', 'support'],

    init() {
        this.loadUsers();
        this.loadRoles();
        this.attachEventListeners();
    },

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                this.allUsers = await response.json();
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    },

    async loadRoles() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                this.allRoles = await response.json();
                this.renderRolesList();
            }
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    },

    attachEventListeners() {
        // Wizard navigation
        document.getElementById('nextStep')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prevStep')?.addEventListener('click', () => this.prevStep());
        document.getElementById('saveRole')?.addEventListener('click', () => this.saveRole());

        // Role list actions
        document.getElementById('createNewRole')?.addEventListener('click', () => this.openWizard());
        document.getElementById('closeWizard')?.addEventListener('click', () => this.closeWizard());

        // User search
        document.getElementById('userSearch')?.addEventListener('input', (e) => this.searchUsers(e.target.value));

        // Compare roles
        document.getElementById('compareRoles')?.addEventListener('click', () => this.compareRoles());
    },

    async openWizard(roleId = null) {
        this.currentStep = 1;
        this.roleData = {};
        this.selectedUsers = [];
        
        if (roleId) {
            await this.loadRoleData(roleId);
        }

        document.getElementById('roleWizard').classList.remove('hidden');
        document.getElementById('rolesListView').classList.add('hidden');
        this.renderStep();
    },

    closeWizard() {
        document.getElementById('roleWizard').classList.add('hidden');
        document.getElementById('rolesListView').classList.remove('hidden');
        this.loadRoles();
    },

    async loadRoleData(roleId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/roles/${roleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const role = await response.json();
                this.roleData = role;
                this.currentRole = roleId;
                
                // Load assigned users for this role
                if (role.assignedUsers && role.assignedUsers.length > 0) {
                    this.selectedUsers = role.assignedUsers.map(u => u._id || u);
                }
            }
        } catch (error) {
            console.error('Error loading role:', error);
        }
    },

    nextStep() {
        if (this.validateStep()) {
            this.currentStep++;
            if(this.roleData.inheritPermissions) {
                this.currentStep++;
                this.roleData.inheritPermissions = false;
            }
            this.renderStep();
        }
    },

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.renderStep();
        }
    },

    validateStep() {
        switch (this.currentStep) {
            case 1:
                const name = document.getElementById('roleName')?.value;
                const desc = document.getElementById('roleDescription')?.value;
                if (!name || !desc) {
                    alert('Please fill in all required fields');
                    return false;
                }
                this.roleData.name = name;
                this.roleData.description = desc;
                this.roleData.parentRole = document.getElementById('parentRole')?.value || null;
                this.roleData.inheritPermissions = document.getElementById('inheritPermissions')?.checked;
                this.roleData.conflictResolution = document.getElementById('conflictResolution')?.value;
                return true;
            case 2:
                // Collect permissions from matrix
                this.roleData.permissions = this.collectPermissions();
                return true;
            case 3:
                // Users are already in selectedUsers array
                return true;
            case 4:
                // Collect notification settings
                this.roleData.notificationSettings = {
                    onUserAssigned: document.getElementById('notifyUserAssigned')?.checked,
                    onPermissionChanged: document.getElementById('notifyPermChanged')?.checked,
                    onRoleModified: document.getElementById('notifyRoleModified')?.checked,
                    onUserRemoved: document.getElementById('notifyUserRemoved')?.checked
                };
                return true;
            case 5:
                // Collect audit configuration
                this.roleData.auditConfiguration = {
                    enabled: document.getElementById('auditEnabled')?.checked,
                    logPermissionChanges: document.getElementById('logPermChanges')?.checked,
                    logUserAssignments: document.getElementById('logUserAssign')?.checked,
                    logRoleModifications: document.getElementById('logRoleMods')?.checked,
                    retentionDays: parseInt(document.getElementById('retentionDays')?.value) || 90
                };
                return true;
        }
        return true;
    },

    collectPermissions() {
        const permissions = [];
        this.modules.forEach(module => {
            const perm = {
                module,
                read: document.getElementById(`${module}-read`)?.checked || false,
                write: document.getElementById(`${module}-write`)?.checked || false,
                delete: document.getElementById(`${module}-delete`)?.checked || false,
                admin: document.getElementById(`${module}-admin`)?.checked || false
            };
            if (perm.read || perm.write || perm.delete || perm.admin) {
                permissions.push(perm);
            }
        });
        return permissions;
    },

    renderStep() {
        const wizardContent = document.getElementById('wizardContent');
        const stepIndicator = document.getElementById('stepIndicator');
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        const saveBtn = document.getElementById('saveRole');

        // Update step indicator
        stepIndicator.innerHTML = `Step ${this.currentStep} of 5`;

        // Show/hide buttons
        prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-block';
        nextBtn.style.display = this.currentStep === 5 ? 'none' : 'inline-block';
        saveBtn.style.display = this.currentStep === 5 ? 'inline-block' : 'none';

        // Render step content
        switch (this.currentStep) {
            case 1:
                wizardContent.innerHTML = this.renderBasicsStep();
                break;
            case 2:
                wizardContent.innerHTML = this.renderPermissionsStep();
                break;
            case 3:
                wizardContent.innerHTML = this.renderMembersStep();
                this.renderUsersList();
                break;
            case 4:
                wizardContent.innerHTML = this.renderNotificationsStep();
                break;
            case 5:
                wizardContent.innerHTML = this.renderAuditStep();
                break;
        }
    },

    renderBasicsStep() {
        return `
            <h3>Role Basics</h3>
            <div class="form-group">
                <label for="roleName">Role Name *</label>
                <input type="text" id="roleName" value="${this.roleData.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="roleDescription">Description *</label>
                <textarea id="roleDescription" rows="3" required>${this.roleData.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="parentRole">Parent Role (Optional)</label>
                <select id="parentRole">
                    <option value="">None</option>
                    ${this.allRoles.map(role => 
                        `<option value="${role._id}" ${this.roleData.parentRole === role._id ? 'selected' : ''}>${role.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="inheritPermissions" ${this.roleData.inheritPermissions !== false ? 'checked' : ''}>
                    Inherit permissions from parent role
                </label>
            </div>
            <div class="form-group">
                <label for="conflictResolution">Conflict Resolution Strategy</label>
                <select id="conflictResolution">
                    <option value="merge" ${this.roleData.conflictResolution === 'merge' ? 'selected' : ''}>Merge (Grant if either allows)</option>
                    <option value="override" ${this.roleData.conflictResolution === 'override' ? 'selected' : ''}>Override (Child overrides parent)</option>
                    <option value="inherit" ${this.roleData.conflictResolution === 'inherit' ? 'selected' : ''}>Inherit (Keep parent only)</option>
                </select>
            </div>
        `;
    },

    renderPermissionsStep() {
        const currentPerms = this.roleData.permissions || [];
        
        return `
            <h3>Permissions Matrix</h3>
            <p class="info-text">Define granular permissions for each module</p>
            <div class="permissions-matrix">
                <table>
                    <thead>
                        <tr>
                            <th>Module</th>
                            <th>Read</th>
                            <th>Write</th>
                            <th>Delete</th>
                            <th>Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.modules.map(module => {
                            const perm = currentPerms.find(p => p.module === module) || {};
                            return `
                                <tr>
                                    <td><strong>${module.charAt(0).toUpperCase() + module.slice(1)}</strong></td>
                                    <td><input type="checkbox" id="${module}-read" ${perm.read ? 'checked' : ''}></td>
                                    <td><input type="checkbox" id="${module}-write" ${perm.write ? 'checked' : ''}></td>
                                    <td><input type="checkbox" id="${module}-delete" ${perm.delete ? 'checked' : ''}></td>
                                    <td><input type="checkbox" id="${module}-admin" ${perm.admin ? 'checked' : ''}></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderMembersStep() {
        return `
            <h3>Assign Members</h3>
            <div class="form-group">
                <input type="text" id="userSearch" placeholder="Search users...">
            </div>
            <div class="users-selection">
                <div class="available-users">
                    <h4>Available Users</h4>
                    <div id="availableUsersList"></div>
                </div>
                <div class="selected-users">
                    <h4>Selected Users (${this.selectedUsers.length})</h4>
                    <div id="selectedUsersList"></div>
                </div>
            </div>
        `;
    },

    renderNotificationsStep() {
        const settings = this.roleData.notificationSettings || {};
        
        return `
            <h3>Notification Settings</h3>
            <p class="info-text">Configure when notifications should be sent</p>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="notifyUserAssigned" ${settings.onUserAssigned !== false ? 'checked' : ''}>
                    Notify when user is assigned to this role
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="notifyPermChanged" ${settings.onPermissionChanged !== false ? 'checked' : ''}>
                    Notify when permissions are changed
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="notifyRoleModified" ${settings.onRoleModified !== false ? 'checked' : ''}>
                    Notify when role is modified
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="notifyUserRemoved" ${settings.onUserRemoved || false ? 'checked' : ''}>
                    Notify when user is removed from role
                </label>
            </div>
        `;
    },

    renderAuditStep() {
        const config = this.roleData.auditConfiguration || {};
        
        return `
            <h3>Audit Configuration</h3>
            <p class="info-text">Configure activity logging and retention</p>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="auditEnabled" ${config.enabled !== false ? 'checked' : ''}>
                    Enable audit logging
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="logPermChanges" ${config.logPermissionChanges !== false ? 'checked' : ''}>
                    Log permission changes
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="logUserAssign" ${config.logUserAssignments !== false ? 'checked' : ''}>
                    Log user assignments
                </label>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="logRoleMods" ${config.logRoleModifications !== false ? 'checked' : ''}>
                    Log role modifications
                </label>
            </div>
            <div class="form-group">
                <label for="retentionDays">Log Retention (days)</label>
                <input type="number" id="retentionDays" value="${config.retentionDays || 90}" min="1" max="365">
            </div>
            <div class="review-summary">
                <h4>Review Summary</h4>
                <p><strong>Name:</strong> ${this.roleData.name}</p>
                <p><strong>Description:</strong> ${this.roleData.description}</p>
                <p><strong>Permissions:</strong> ${(this.roleData.permissions || []).length} modules configured</p>
                <p><strong>Members:</strong> ${this.selectedUsers.length} users selected</p>
            </div>
        `;
    },

    renderUsersList() {
        const availableList = document.getElementById('availableUsersList');
        const selectedList = document.getElementById('selectedUsersList');

        if (!availableList || !selectedList) return;

        const available = this.allUsers.filter(u => !this.selectedUsers.includes(u._id));
        
        availableList.innerHTML = available.map(user => `
            <div class="user-item" onclick="RoleManagementApp.selectUser('${user._id}')">
                <span>${user.username}</span>
                <span class="user-email">${user.email}</span>
                <button class="btn-small">Add</button>
            </div>
        `).join('') || '<p>No available users</p>';

        const selected = this.allUsers.filter(u => this.selectedUsers.includes(u._id));
        
        selectedList.innerHTML = selected.map(user => `
            <div class="user-item">
                <span>${user.username}</span>
                <span class="user-email">${user.email}</span>
                <button class="btn-small btn-danger" onclick="RoleManagementApp.removeUser('${user._id}')">Remove</button>
            </div>
        `).join('') || '<p>No users selected</p>';
    },

    selectUser(userId) {
        if (!this.selectedUsers.includes(userId)) {
            this.selectedUsers.push(userId);
            this.renderUsersList();
        }
    },

    removeUser(userId) {
        this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
        this.renderUsersList();
    },

    searchUsers(query) {
        // Filter displayed users based on search query
        const filtered = this.allUsers.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        );
        // Update available users display
        const availableList = document.getElementById('availableUsersList');
        const available = filtered.filter(u => !this.selectedUsers.includes(u._id));
        
        availableList.innerHTML = available.map(user => `
            <div class="user-item" onclick="RoleManagementApp.selectUser('${user._id}')">
                <span>${user.username}</span>
                <span class="user-email">${user.email}</span>
                <button class="btn-small">Add</button>
            </div>
        `).join('') || '<p>No matching users</p>';
    },

    async saveRole() {
        if (!this.validateStep()) return;

        try {
            const token = localStorage.getItem('token');
            const url = this.currentRole ? `${API_URL}/roles/${this.currentRole}` : `${API_URL}/roles`;
            const method = this.currentRole ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(this.roleData)
            });

            if (response.ok) {
                const role = await response.json();
                
                // Bulk assign users if any selected
                if (this.selectedUsers.length > 0) {
                    await fetch(`${API_URL}/roles/${role._id}/bulk-assign`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ userIds: this.selectedUsers })
                    });
                }

                alert('Role saved successfully!');
                this.closeWizard();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            alert('Error saving role');
            console.error(error);
        }
    },

    renderRolesList() {
        const container = document.getElementById('rolesContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="roles-header">
                <h2>Role Management</h2>
                <button id="createNewRole" class="btn-primary">Create New Role</button>
            </div>
            <div class="roles-grid">
                ${this.allRoles.map(role => `
                    <div class="role-card">
                        <h3>${role.name}</h3>
                        <p>${role.description}</p>
                        <div class="role-meta">
                            <span>${role.permissions?.length || 0} permissions</span>
                            ${role.parentRole ? `<span>Inherits from: ${role.parentRole.name}</span>` : ''}
                        </div>
                        <div class="role-actions">
                            <button onclick="RoleManagementApp.openWizard('${role._id}')">Edit</button>
                            <button onclick="RoleManagementApp.viewAudit('${role._id}')">Audit</button>
                            <button onclick="RoleManagementApp.deleteRole('${role._id}')" class="btn-danger">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Re-attach event listener for create button
        document.getElementById('createNewRole')?.addEventListener('click', () => this.openWizard());
    },

    async deleteRole(roleId) {
        if (!confirm('Are you sure you want to delete this role?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/roles/${roleId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Role deleted successfully');
                this.loadRoles();
            } else {
                alert('Error deleting role');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },

    async viewAudit(roleId) {
        // Load and display audit logs for this role
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/audit/role/${roleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const logs = await response.json();
                if (logs && logs.length > 0) {
                    this.displayAuditLogs(logs);
                } else {
                    alert('No audit logs found for this role.');
                }
            } else {
                const error = await response.json();
                alert(`Error loading audit logs: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
            alert('Failed to load audit logs. Check console for details.');
        }
    },

    displayAuditLogs(logs) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content audit-modal">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>Audit Trail</h2>
                <div class="audit-logs">
                    ${logs.map(log => `
                        <div class="audit-log-item">
                            <div class="log-header">
                                <strong>${log.action}</strong>
                                <span>${new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            <p>${log.description}</p>
                            <small>By: ${log.performedBy?.username || 'System'}</small>
                        </div>
                    `).join('')}
                </div>
                <button onclick="RoleManagementApp.exportAudit()">Export to CSV</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

        async exportAudit() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/audit/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'audit-logs.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Error exporting audit logs');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting audit logs');
        }
    },

    async compareRoles() {
        // Show role comparison UI
        const role1 = prompt('Enter first role ID:');
        const role2 = prompt('Enter second role ID:');

        if (!role1 || !role2) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/roles/compare/${role1}/${role2}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const comparison = await response.json();
                this.displayComparison(comparison);
            }
        } catch (error) {
            console.error('Error comparing roles:', error);
        }
    },

    displayComparison(comparison) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content comparison-modal">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>Role Comparison</h2>
                <div class="comparison-view">
                    <div class="role-column">
                        <h3>${comparison.role1.name}</h3>
                        ${this.renderComparisonPermissions(comparison.role1.permissions)}
                    </div>
                    <div class="role-column">
                        <h3>${comparison.role2.name}</h3>
                        ${this.renderComparisonPermissions(comparison.role2.permissions)}
                    </div>
                </div>
                <div class="differences">
                    <h3>Differences (${comparison.differences.length})</h3>
                    ${comparison.differences.map(diff => `
                        <div class="diff-item">
                            <strong>${diff.module}</strong>:
                            Role 1: ${this.formatPermissions(diff.role1)}
                            Role 2: ${this.formatPermissions(diff.role2)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    renderComparisonPermissions(permissions) {
        return `
            <table class="comparison-table">
                <tr><th>Module</th><th>R</th><th>W</th><th>D</th><th>A</th></tr>
                ${permissions.map(p => `
                    <tr>
                        <td>${p.module}</td>
                        <td>${p.read ? '✓' : '-'}</td>
                        <td>${p.write ? '✓' : '-'}</td>
                        <td>${p.delete ? '✓' : '-'}</td>
                        <td>${p.admin ? '✓' : '-'}</td>
                    </tr>
                `).join('')}
            </table>
        `;
    },

    formatPermissions(perm) {
        const perms = [];
        if (perm.read) perms.push('Read');
        if (perm.write) perms.push('Write');
        if (perm.delete) perms.push('Delete');
        if (perm.admin) perms.push('Admin');
        return perms.join(', ') || 'None';
    }
};

// Initialize when dashboard is shown
function initRoleManagement() {
    if (document.getElementById('rolesContainer')) {
        RoleManagementApp.init();
    }
}
