const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const jobController = require('../controllers/jobController');
const billController = require('../controllers/billController');
const frameController = require('../controllers/frameController');
const prescribedByController = require('../controllers/prescribedByController');
const lensController = require('../controllers/lensController');
const searchController = require('../controllers/searchController');
const dashboardController = require('../controllers/dashboardController');
const expensesController = require('../controllers/expensesController');
const extraBillingController = require('../controllers/extraBillingController')
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware, authController.profile);
router.get('/all-users', authMiddleware, authController.getAllUsers);
router.delete('/user-remove/:id', authMiddleware, authController.removeUser);

router.post('/create-customers', authMiddleware, customerController.createCustomer);
router.put('/customers/:id', authMiddleware, customerController.updateCustomer);
router.delete('/customers/:id', authMiddleware, customerController.deleteCustomer);
router.get('/customers', authMiddleware, customerController.getCustomers);
router.get('/get-customer-by-Id/:id', authMiddleware, customerController.getCustomerById);

router.post('/create-job', authMiddleware, jobController.createJob);
router.get('/jobs/:job_id',authMiddleware, jobController.getJobDetails);
router.get('/full-job/:job_id',authMiddleware, jobController.getFullJobDetails);
router.put('/jobs/:job_id', authMiddleware, jobController.updateJob);
router.get('/jobs/:job_id/logs', authMiddleware, jobController.getJobLogs);
router.get('/jobs/get-all-jobs/:order_status', authMiddleware, jobController.getAllJobsByOrderStatus);
router.get('/jobs/get-jobs/:cus_id', authMiddleware, jobController.getJobsByCustomer);
router.post('/jobs/add-claimer', authMiddleware, jobController.addClaimerToJob);
router.post('/jobs/add-self-claimer/:jobId', authMiddleware, jobController.addSelfClaimJob);
router.get('/getAllOpticalMasters', authMiddleware, jobController.getAllOpticalMasters);
router.get('/get-all-claim-jobs', authMiddleware, jobController.getAllClaimJobs);
router.post('/verify-claim-job-id', authMiddleware, jobController.verifyClimJobId)

router.post('/create-billing', authMiddleware, billController.createBilling);
router.get('/billing-details/:job_id', authMiddleware, billController.getBillDetails);
router.get('/billing', authMiddleware,billController.getAllBillData);
router.post('/print-bill-by-id', authMiddleware,billController.getPrintBilling);
router.get("/get-diduction-billing", authMiddleware, billController.getDeductionBilling);

router.get('/get-lens-details', authMiddleware, lensController.getLensCategory);
router.post('/update-lens-status', authMiddleware, lensController.updateStatus);
router.post('/insert-lens', authMiddleware, lensController.insertData);
router.get('/get-all-lens-orders-company',authMiddleware, lensController.getAllLensOrders);
router.get('/get-lens-orders-company-byId/:id', authMiddleware, lensController.getOrderById);
router.post('/get-each-lens-item', authMiddleware, lensController.getLensNames);
router.post('/create-Lens-Order-company', authMiddleware, lensController.createLensOrder);
router.delete('/delete-lens-order-company/:id', authMiddleware, lensController.deleteLensOrder);

// router.get('/get-frame-details', authMiddleware, frameController.getFrameCategory);
router.get('/get-frame-byId/:id', authMiddleware, frameController.getFrameById);
router.post('/update-frame-status', authMiddleware, frameController.updateStatus);
router.post('/insert-frame-details', authMiddleware, frameController.insertData);
router.get('/get-all-frame-parts', authMiddleware, frameController.getAllFrameDetails);
router.get('/get-all-frame-keys', authMiddleware, frameController.getAllFrameKeys);
router.post('/create-frame', authMiddleware,  frameController.createFrame);
// router.get('/get-active-frames', authMiddleware,  frameController.getActiveFrames);
router.put('/update-frame-status/:id', authMiddleware, frameController.updateFrameStatus);
router.post('/by-brand', authMiddleware, frameController.getFrameByBrand);
router.post('/verify-frame-key', authMiddleware, frameController.verifyFrameKey);
router.patch('/frames/status/:id', authMiddleware, frameController.updateFrameStatus);
router.delete("/remove-frame/:id", authMiddleware, frameController.deleteFrameById);
router.put("/edit-frame-update", authMiddleware, frameController.updateFrameDetails);
router.post('/create-frame-model', authMiddleware, frameController.createFrameModel);

// prescribedBy APIs
router.post("/create-prescribed", authMiddleware, prescribedByController.createPrescribedBy);
router.get("/getAll-Prescribed", authMiddleware, prescribedByController.getAllPrescribedBy);
router.get("/getPrescribedby-Id/:id", authMiddleware, prescribedByController.getPrescribedByById);
router.delete("/delete-PrescribedBy/:id", authMiddleware, prescribedByController.deletePrescribedBy);

router.get("/customer-search/suggest", authMiddleware, customerController.customerSearch);
router.post("/search-by-id", authMiddleware, searchController.idSearch);

router.get('/dashboard', authMiddleware, dashboardController.getDashboardData);

router.post('/create-expense', authMiddleware, expensesController.createExpense);
router.get('/get-all-expenses',authMiddleware, expensesController.getAllExpenses);
router.put('/remove-expenses/:id',authMiddleware, expensesController.removeExpense);

router.post('/create-extra-billing', authMiddleware, extraBillingController.addExtraBilling);
router.get('/get-all-extra-billing', authMiddleware, extraBillingController.getAllExtraBilling);
router.get('/get-extra-by-id/:id', authMiddleware, extraBillingController.getExtraBillingById);
router.put('/remove-extra-billing/:id',authMiddleware, extraBillingController.removeExtraBilling);

router.post('/get-report-data', authMiddleware, reportController.getReportData);

module.exports = router;