import express from 'express';
import {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} from '../controllers/tasks.js';
import { validateTask } from '../middlewares/validateTask.js';
import rateLimit from 'express-rate-limit';
import { API } from '../utils/constants.js';

const router = express.Router();

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    }
});

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get filtered tasks with pagination
 *     description: Used by Board.jsx and CalendarView.jsx
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: 
 *           type: string
 *           enum: ["todo", "inProgress", "done"]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema: 
 *           type: string
 *           enum: ["low", "medium", "high"]
 *         description: Filter by task priority
 *       - in: query
 *         name: dateFilter
 *         schema: 
 *           type: string
 *           enum: ["today", "overdue"]
 *         description: Filter by date range
 *       - in: query
 *         name: page
 *         schema: 
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema: 
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get('/', apiLimiter, getTasks);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Used by AddTaskForm.jsx
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 */
router.post('/', apiLimiter, validateTask, createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   patch:
 *     summary: Update an existing task
 *     description: Used by TaskCard.jsx for edits and drag-and-drop
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Task ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdateInput'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id', apiLimiter, validateTask, updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Used by TaskCard.jsx
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Task ID
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', apiLimiter, deleteTask);

// Add API versioning middleware
router.use((req, res, next) => {
    res.setHeader('X-API-Version', API.VERSION);
    next();
});

export default router;