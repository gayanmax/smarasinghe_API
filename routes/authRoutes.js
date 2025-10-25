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

router.post('/create-customers', authMiddleware, customerController.createCustomer);
router.put('/customers/:id', authMiddleware, customerController.updateCustomer);
router.delete('/customers/:id', authMiddleware, customerController.deleteCustomer);
router.get('/customers', authMiddleware, customerController.getCustomers);

router.post('/create-job', authMiddleware, jobController.createJob);
router.get('/jobs/:job_id', jobController.getJobDetails);
router.put('/jobs/:job_id', authMiddleware, jobController.updateJob);
router.get('/jobs/:job_id/logs', authMiddleware, jobController.getJobLogs);
router.get('/jobs/get-all-jobs/:order_status', jobController.getAllJobsByOrderStatus);
router.get('/jobs/get-jobs/:cus_id', jobController.getJobsByCustomer);

router.post('/create-billing', authMiddleware, billController.createBilling);
router.get('/billing-details/:job_id', authMiddleware, billController.getBillDetails);

router.get('/get-lens-details', authMiddleware, lensController.getLensCategory);
router.post('/update-lens-status', authMiddleware, lensController.updateStatus);
router.post('/insert-lens', authMiddleware, lensController.insertData);


router.get('/get-frame-details', authMiddleware, frameController.getFrameCategory);
router.post('/update-frame-status', authMiddleware, frameController.updateStatus);
router.post('/insert-frame-details', authMiddleware, frameController.insertData);

router.post('/insert-frame',  frameController.insertFrame);


// prescribedBy APIs
router.post("/create-prescribed", prescribedByController.createPrescribedBy);
router.get("/getAll-Prescribed", prescribedByController.getAllPrescribedBy);
router.get("/getPrescribedby-Id/:id", prescribedByController.getPrescribedByById);
router.delete("/delete-PrescribedBy/:id", prescribedByController.deletePrescribedBy);

module.exports = router;
