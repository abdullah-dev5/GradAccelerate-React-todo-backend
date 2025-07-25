import { STATUS, PRIORITY } from '../utils/constants.js';

/**
 * Validates task data middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateTask = (req, res, next) => {
    try {
        const { title, status, priority, dueDate } = req.body;

        console.log('Validating task with data:', { title, status, priority, dueDate });
        console.log('Valid status options:', Object.values(STATUS));
        console.log('Valid priority options:', Object.values(PRIORITY));

        // Validate title exists and is a string
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Title is required and must be a non-empty string',
                field: 'title'
            });
        }

        // Validate status against Prisma's expected values
        if (status) {
            if (typeof status !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Status must be a string',
                    field: 'status'
                });
            }

            // Case-sensitive check for status
            if (!Object.values(STATUS).includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status. Valid options are case-sensitive: ${Object.values(STATUS).join(', ')}`,
                    field: 'status',
                    validOptions: Object.values(STATUS),
                    receivedValue: status
                });
            }
        }

        // Validate priority against Prisma's expected values
        if (priority) {
            if (typeof priority !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Priority must be a string',
                    field: 'priority'
                });
            }

            // Case-sensitive check for priority
            if (!Object.values(PRIORITY).includes(priority)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid priority. Valid options are case-sensitive: ${Object.values(PRIORITY).join(', ')}`,
                    field: 'priority',
                    validOptions: Object.values(PRIORITY),
                    receivedValue: priority
                });
            }
        }

        // Validate dueDate format (if provided)
        if (dueDate !== undefined && dueDate !== null) {
            if (typeof dueDate !== 'string' || isNaN(new Date(dueDate).getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid due date format. Use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)',
                    field: 'dueDate'
                });
            }
        }

        // Prepare validated data for Prisma
        req.validatedTaskData = {
            title: title.trim(),
            ...(status && { status: status }),
            ...(priority && { priority: priority }),
            ...(dueDate !== undefined && {
                dueDate: dueDate ? new Date(dueDate) : null
            })
        };

        console.log('Validated data:', req.validatedTaskData);

        next();
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Validation failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};