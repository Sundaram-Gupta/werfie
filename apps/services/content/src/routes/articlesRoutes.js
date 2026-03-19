const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');
const authenticateToken = require('../middleware/auth');

/**
 * @route POST /api/articles
 * @desc Create a new article
 * @access Private
 */
router.post('/', authenticateToken, articlesController.createArticle);

/**
 * @route GET /api/articles/user/:userId
 * @desc Get all articles for a user
 * @access Public
 */
router.get('/user/:userId', articlesController.getArticles);

/**
 * @route GET /api/articles/:id
 * @desc Get a single article by ID
 * @access Public
 */
router.get('/:id', articlesController.getArticle);

/**
 * @route PUT /api/articles/:id
 * @desc Update an existing article
 * @access Private
 */
router.put('/:id', authenticateToken, articlesController.updateArticle);

/**
 * @route DELETE /api/articles/:id
 * @desc Delete an article
 * @access Private
 */
router.delete('/:id', authenticateToken, articlesController.deleteArticle);

module.exports = router;
