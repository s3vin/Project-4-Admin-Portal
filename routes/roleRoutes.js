const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/roleController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication and admin privileges
router.use(protect, admin);

// Role CRUD
router.route('/')
  .get(getAllRoles)
  .post(createRole);

router.route('/:id')
  .get(getRole)
  .put(updateRole)
  .delete(deleteRole);

// Role comparison
router.get('/compare/:id1/:id2', compareRoles);

// User assignment
router.post('/:id/assign', assignRoleToUser);
router.post('/:id/remove', removeRoleFromUser);
router.post('/:id/bulk-assign', bulkAssignRole);
router.get('/:id/users', getRoleUsers);

module.exports = router;
