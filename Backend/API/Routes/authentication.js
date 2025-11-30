const express = require('express');
const router = express.Router();
const { signup, login, logout, verify, refresh } = require('../Controller/accounts.js');
const { authenticateToken } = require('../../Utilities/authenticateToken.js');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: 
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 16
 *                 example: mohammed
 *                 description: Username must be 5-16 characters, letters, numbers, and underscores only
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mohammed@example.com
 *                 description: Valid email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: SecurePass123
 *                 description: Password must be at least 6 characters
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 201
 *                 status:
 *                   type: string
 *                   example: Created
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', signup);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with username and password
 *     description: Authenticates user and sets HTTP-only cookie with JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: mohammed
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: Success
 *                 message:
 *                   type: string
 *                   example: User logged in successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout current user
 *     description: Clears the authentication cookie
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: Success
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.post('/logout', authenticateToken, logout);

/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     summary: Verify current user authentication
 *     description: Returns current user information if token is valid
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: Success
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 */
router.get('/verify', authenticateToken, verify);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh JWT authentication token
 *     description: Issues a new JWT token while maintaining the current session
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 status:
 *                   type: string
 *                   example: Success
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post('/refresh', authenticateToken, refresh);

module.exports = router;