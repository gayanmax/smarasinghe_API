const express = require('express');
const router = express.Router();


const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const jobController = require('../controllers/jobController');
const billController = require('../controllers/billController');
const frameController = require('../controllers/frameController');
const prescribedByController = require('../controllers/prescribedByController');
const lensController = require('../controllers/lensController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware, authController.profile);
router.get('/all-users', authMiddleware, authController.getAllUsers);

router.post('/create-customers', authMiddleware, customerController.createCustomer);
router.put('/customers/:id', authMiddleware, customerController.updateCustomer);
router.delete('/customers/:id', authMiddleware, customerController.deleteCustomer);
router.get('/customers', authMiddleware, customerController.getCustomers);

router.post('/create-job', authMiddleware, jobController.createJob);
router.get('/jobs/:job_id',authMiddleware, jobController.getJobDetails);
router.put('/jobs/:job_id', authMiddleware, jobController.updateJob);
router.get('/jobs/:job_id/logs', authMiddleware, jobController.getJobLogs);
router.get('/jobs/get-all-jobs/:order_status',authMiddleware, jobController.getAllJobsByOrderStatus);
router.get('/jobs/get-jobs/:cus_id',authMiddleware, jobController.getJobsByCustomer);

router.post('/create-billing', authMiddleware, billController.createBilling);
router.get('/billing-details/:job_id', authMiddleware, billController.getBillDetails);

router.get('/get-lens-details', authMiddleware, lensController.getLensCategory);
router.post('/update-lens-status', authMiddleware, lensController.updateStatus);
router.post('/insert-lens', authMiddleware, lensController.insertData);
router.get('/get-all-lens-orders-company',authMiddleware, lensController.getAllLensOrders);
router.post('/create-Lens-Order-company',authMiddleware, lensController.createLensOrder);
router.delete('/delete-lens-order-company/:id',authMiddleware, lensController.deleteLensOrder);

router.get('/get-frame-details', authMiddleware, frameController.getFrameCategory);
router.post('/update-frame-status', authMiddleware, frameController.updateStatus);
router.post('/insert-frame-details', authMiddleware, frameController.insertData);

router.post('/insert-frame',authMiddleware,  frameController.insertFrame);
router.get('/get-active-frames',authMiddleware,  frameController.getActiveFrames);

// prescribedBy APIs
router.post("/create-prescribed",authMiddleware, prescribedByController.createPrescribedBy);
router.get("/getAll-Prescribed",authMiddleware, prescribedByController.getAllPrescribedBy);
router.get("/getPrescribedby-Id/:id",authMiddleware, prescribedByController.getPrescribedByById);
router.delete("/delete-PrescribedBy/:id",authMiddleware, prescribedByController.deletePrescribedBy);

module.exports = router;
