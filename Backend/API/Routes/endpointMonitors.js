const express = require('express');
const router = express.Router();
const { getAllMonitors, updateMonitor, newMonitor, deleteMonitor } = require('../Controller/monitors.js');
const { authenticateToken } = require('../../Utilities/authenticateToken.js');

/**
 * @swagger
 * tags:
 *   name: Monitors
 *   description: API endpoint monitoring and management
 */

/**
 * @swagger
 * /api/v1/monitors/new:
 *   post:
 *     summary: Create a new endpoint monitor
 *     description: Add a new API endpoint to monitor with custom check intervals
 *     tags: [Monitors]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - interval
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: My API Health Check
 *                 description: Display name for the monitor
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://api.example.com/health
 *                 description: Full URL to monitor (must start with http:// or https://)
 *               interval:
 *                 type: number
 *                 enum: [30, 60, 300, 600, 1800, 3600, 7200]
 *                 example: 60
 *                 description: Check interval in seconds (30s, 1m, 5m, 10m, 30m, 1h, 2h)
 *     responses:
 *       201:
 *         description: Monitor created successfully
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
 *                 message:
 *                   type: string
 *                   example: Monitor created successfully
 *                 monitor:
 *                   type: object
 *                   properties:
 *                     monitorId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     name:
 *                       type: string
 *                       example: My API Health Check
 *                     url:
 *                       type: string
 *                       example: https://api.example.com/health
 *                     interval:
 *                       type: number
 *                       example: 60
 *                     status:
 *                       type: string
 *                       example: Unknown
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post('/new', authenticateToken, newMonitor);

/**
 * @swagger
 * /api/v1/monitors/get:
 *   get:
 *     summary: Get all monitors for authenticated user
 *     description: Retrieves all endpoint monitors with their current status, uptime, and history
 *     tags: [Monitors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of monitors retrieved successfully
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
 *                 monitors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Monitor'
 *       401:
 *         description: Unauthorized
 */
router.get('/get', authenticateToken, getAllMonitors);

/**
 * @swagger
 * /api/v1/monitors/{monitorId}:
 *   patch:
 *     summary: Update an existing monitor
 *     description: Update monitor name, URL, or check interval. Only changed fields are returned.
 *     tags: [Monitors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique monitor ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: Updated API Name
 *                 description: New display name
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://api.example.com/v2/health
 *                 description: New URL to monitor (scheduler will restart)
 *               interval:
 *                 type: number
 *                 enum: [30, 60, 300, 600, 1800, 3600, 7200]
 *                 example: 300
 *                 description: New check interval in seconds (scheduler will restart)
 *     responses:
 *       200:
 *         description: Monitor updated successfully
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
 *                   example: Monitor updated successfully
 *                 changes:
 *                   type: object
 *                   description: Only the fields that were changed
 *                   properties:
 *                     monitorId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     name:
 *                       type: string
 *                       example: Updated API Name
 *                     url:
 *                       type: string
 *                       example: https://api.example.com/v2/health
 *                     interval:
 *                       type: number
 *                       example: 300
 *       400:
 *         description: Validation error
 *       404:
 *         description: Monitor not found or unauthorized
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a monitor
 *     description: Permanently delete an endpoint monitor and stop monitoring
 *     tags: [Monitors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID to delete
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Monitor deleted successfully
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
 *                   example: Monitor deleted successfully
 *       404:
 *         description: Monitor not found or unauthorized
 *       401:
 *         description: Unauthorized
 */
router.patch('/:monitorId', authenticateToken, updateMonitor);
router.delete('/:monitorId', authenticateToken, deleteMonitor);

module.exports = router;