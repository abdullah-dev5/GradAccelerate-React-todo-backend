import prisma from '../utils/prisma.js';
import { STATUS, PRIORITY, DATE_FILTERS } from '../utils/constants.js';

/**
 * Create a new task
 * @param {Object} req - Express request object
 * @param {string} req.body.title - Task title (required)
 * @param {string} [req.body.status=STATUS.TODO] - Task status
 * @param {string} [req.body.priority=PRIORITY.MEDIUM] - Task priority
 * @param {string} [req.body.dueDate] - Due date in ISO format
 * @param {Object} res - Express response object
 */
export const createTask = async (req, res) => {
    const { title, status = STATUS.TODO, priority = PRIORITY.MEDIUM, dueDate } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Valid title is required',
            validOptions: {
                status: Object.values(STATUS),
                priority: Object.values(PRIORITY)
            }
        });
    }

    if (status && !Object.values(STATUS).includes(status)) {
        return res.status(400).json({
            success: false,
            error: `Invalid status. Valid options: ${Object.values(STATUS).join(', ')}`,
            validOptions: Object.values(STATUS)
        });
    }

    if (priority && !Object.values(PRIORITY).includes(priority)) {
        return res.status(400).json({
            success: false,
            error: `Invalid priority. Valid options: ${Object.values(PRIORITY).join(', ')}`,
            validOptions: Object.values(PRIORITY)
        });
    }

    try {
        const task = await prisma.task.create({
            data: {
                title: title.trim(),
                status: status || STATUS.TODO,  // Ensure default is applied
                priority: priority || PRIORITY.MEDIUM,  // Ensure default is applied
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });
        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to create task',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get filtered tasks with pagination
 * @param {Object} req - Express request object
 * @param {string} [req.query.status] - Filter by status
 * @param {string} [req.query.priority] - Filter by priority
 * @param {string} [req.query.dateFilter] - 'today' or 'overdue'
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=10] - Items per page
 * @param {Object} res - Express response object
 */
export const getTasks = async (req, res) => {
    const { status, priority, dateFilter, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Validate pagination
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json({
            success: false,
            error: 'Invalid pagination parameters'
        });
    }

    const now = new Date();
    let where = {};

    // Status filter
    if (status) {
        if (!Object.values(STATUS).includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Valid options: ${Object.values(STATUS).join(', ')}`,
                validOptions: Object.values(STATUS)
            });
        }
        where.status = status;
    }

    // Priority filter
    if (priority) {
        if (!Object.values(PRIORITY).includes(priority)) {
            return res.status(400).json({
                success: false,
                error: `Invalid priority. Valid options: ${Object.values(PRIORITY).join(', ')}`,
                validOptions: Object.values(PRIORITY)
            });
        }
        where.priority = priority;
    }

    // Date filters
    if (dateFilter) {
        if (!Object.values(DATE_FILTERS).includes(dateFilter)) {
            return res.status(400).json({
                success: false,
                error: `Invalid date filter. Valid options: ${Object.values(DATE_FILTERS).join(', ')}`,
                validOptions: Object.values(DATE_FILTERS)
            });
        }

        switch (dateFilter) {
            case DATE_FILTERS.TODAY:
                const startOfDay = new Date(now);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(now);
                endOfDay.setHours(23, 59, 59, 999);
                where.dueDate = { gte: startOfDay, lte: endOfDay };
                break;
            case DATE_FILTERS.OVERDUE:
                where.dueDate = { lt: new Date() };
                break;
            case DATE_FILTERS.WEEK:
                const startOfWeek = new Date(now);
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                where.dueDate = { gte: startOfWeek, lte: endOfWeek };
                break;
        }
    }

    try {
        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
                skip: (pageNum - 1) * limitNum,
                take: limitNum
            }),
            prisma.task.count({ where })
        ]);

        res.json({
            success: true,
            data: tasks,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tasks',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update an existing task
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Task ID
 * @param {Object} req.body - Update fields
 * @param {Object} res - Express response object
 */
export const updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, status, priority, dueDate } = req.body;

    // Validate ID format
    if (!id || typeof id !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Invalid task ID'
        });
    }

    // Validate update fields
    if (status && !Object.values(STATUS).includes(status)) {
        return res.status(400).json({
            success: false,
            error: `Invalid status. Valid options: ${Object.values(STATUS).join(', ')}`,
            validOptions: Object.values(STATUS)
        });
    }

    if (priority && !Object.values(PRIORITY).includes(priority)) {
        return res.status(400).json({
            success: false,
            error: `Invalid priority. Valid options: ${Object.values(PRIORITY).join(', ')}`,
            validOptions: Object.values(PRIORITY)
        });
    }

    try {
        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                ...(title && { title: title.trim() }),
                ...(status && { status }),
                ...(priority && { priority }),
                ...(dueDate !== undefined && {
                    dueDate: dueDate ? new Date(dueDate) : null
                })
            }
        });
        res.json({
            success: true,
            data: updatedTask
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        console.error('Error updating task:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to update task',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete a task
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Task ID
 * @param {Object} res - Express response object
 */
export const deleteTask = async (req, res) => {
    const { id } = req.params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Invalid task ID'
        });
    }

    try {
        await prisma.task.delete({ where: { id } });
        res.status(204).end();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete task',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};