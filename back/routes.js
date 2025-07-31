const express = require('express');
const router = express.Router();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const ticketRoutes = require('./routes/tickets');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const dashboardRoutes = require('./routes/dashboard');

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router; 