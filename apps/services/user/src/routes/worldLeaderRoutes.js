const express = require('express');
const router = express.Router();
const worldLeaderController = require('../controllers/worldLeader.controller');

// Need admin auth middleware here if applicable, for now using simple routes.
// Assuming authentication middleware is applied at app.js level or similar.

router.post('/create', worldLeaderController.createLeader);
router.post('/', worldLeaderController.createLeader);
router.put('/update/:id', worldLeaderController.updateLeader);
router.put('/:id', worldLeaderController.updateLeader);
router.get('/', worldLeaderController.listLeaders);
router.get('/:id', worldLeaderController.getLeader);
router.delete('/:id', worldLeaderController.deleteLeader);

module.exports = router;
