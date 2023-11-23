
const express = require('express');
const { register, login, adminAuth, adminLogout } = require('../controllers/adminController');
const verifyAdminToken = require('../middleware/adminMiddleware');
const router = express.Router();


// Admin registration route
router.post('/admin/register', register);

// Admin login route
router.post('/admin/login', login);

router.get('/admin/protected', verifyAdminToken, (req, res) => {
    res.json({ message: 'This is a protected route' });
  });

router.get('/adminAuth', verifyAdminToken, adminAuth);
router.get("/admin/logout",adminLogout)
module.exports = router;
