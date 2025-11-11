import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Box,
  Grid,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { rolesAPI } from '../services/api';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentRole: '',
    permissions: [],
    inheritPermissions: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const modules = ['users', 'roles', 'audit', 'settings'];
  const permissionTypes = ['read', 'write', 'delete', 'admin'];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.getAll();
      setRoles(response.data);
    } catch (err) {
      setError('Failed to fetch roles');
    }
  };

  const handleOpenDialog = (role = null) => {
    if (role) {
      setIsEditing(true);
      setFormData({
        name: role.name,
        description: role.description,
        parentRole: role.parentRole?._id || '',
        permissions: role.permissions || [],
        inheritPermissions: role.inheritPermissions !== false,
      });
    } else {
      setIsEditing(false);
      setFormData({
        name: '',
        description: '',
        parentRole: '',
        permissions: [],
        inheritPermissions: true,
      });
    }
    setOpenDialog(true);
  };

  const handlePermissionChange = (module, permType, checked) => {
    setFormData((prev) => {
      let newPermissions = [...prev.permissions];
      const moduleIndex = newPermissions.findIndex(p => p.module === module);

      if (moduleIndex >= 0) {
        newPermissions[moduleIndex] = {
          ...newPermissions[moduleIndex],
          [permType]: checked,
        };
      } else {
        newPermissions.push({
          module,
          read: permType === 'read' ? checked : false,
          write: permType === 'write' ? checked : false,
          delete: permType === 'delete' ? checked : false,
          admin: permType === 'admin' ? checked : false,
        });
      }

      return { ...prev, permissions: newPermissions };
    });
  };

  const getPermissionValue = (module, permType) => {
    const perm = formData.permissions.find(p => p.module === module);
    return perm ? perm[permType] : false;
  };

  const handleSave = async () => {
    try {
      if (isEditing) {
        const roleToEdit = roles.find(r => r.name === formData.name);
        await rolesAPI.update(roleToEdit._id, formData);
        setSuccess('Role updated successfully');
      } else {
        await rolesAPI.create(formData);
        setSuccess('Role created successfully');
      }
      setOpenDialog(false);
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDelete = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await rolesAPI.delete(roleId);
        setSuccess('Role deleted successfully');
        fetchRoles();
      } catch (err) {
        setError('Failed to delete role');
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Role Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Role
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Parent Role</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role._id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  {role.parentRole ? (
                    <Chip label={role.parentRole.name} size="small" />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {role.permissions?.slice(0, 2).map((perm, idx) => (
                    <Chip
                      key={idx}
                      label={perm.module}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                  {role.permissions?.length > 2 && (
                    <Chip label={`+${role.permissions.length - 2}`} size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(role)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(role._id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            disabled={isEditing}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Parent Role</InputLabel>
            <Select
              value={formData.parentRole}
              onChange={(e) => setFormData({ ...formData, parentRole: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role._id} value={role._id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.inheritPermissions}
                onChange={(e) => setFormData({ ...formData, inheritPermissions: e.target.checked })}
              />
            }
            label="Inherit Permissions from Parent"
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Permissions
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Module</TableCell>
                  {permissionTypes.map((type) => (
                    <TableCell key={type} align="center">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module}>
                    <TableCell>{module.charAt(0).toUpperCase() + module.slice(1)}</TableCell>
                    {permissionTypes.map((type) => (
                      <TableCell key={type} align="center">
                        <Checkbox
                          checked={getPermissionValue(module, type)}
                          onChange={(e) => handlePermissionChange(module, type, e.target.checked)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoleManagement;
