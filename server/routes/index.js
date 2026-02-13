const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/youtube', require('./youtubeRoutes'));
router.use('/channels', require('./channelRoutes'));
router.use('/offers', require('./trafficOfferRoutes'));
router.use('/matches', require('./trafficMatchRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/user', require('./userRoutes'));
router.use('/swaps', require('./swapRoutes'));
router.use('/chat', require('./chatRoutes'));
router.use('/exchanges', require('./exchangeRoutes'));
router.use('/profile', require('./profileRoutes'));
router.use('/gdpr', require('./gdprRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/support', require('./supportRoutes'));

module.exports = router;
