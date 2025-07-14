// ======================
// Core Constants
// ======================

/**
 * API metadata constants
 * @type {Object}
 */
export const API = {
    VERSION: '1.0.0',
    BASE_PATH: '/api/v1',
    DOCS_PATH: '/api-docs'
};

/**
 * Task status states (matches Prisma schema and frontend)
 * @type {Object<string, string>}
 */
export const STATUS = {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
    _ALL: ['TODO', 'IN_PROGRESS', 'DONE']
};
/**
 * Priority levels (matches Prisma schema and frontend)
 * @type {Object<string, string>}
 */
export const PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    _ALL: ['low', 'medium', 'high'] // For validation
};

/**
 * Date filter options (used in CalendarView.jsx)
 * @type {Object<string, string>}
 */
export const DATE_FILTERS = {
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    OVERDUE: 'overdue',
    _ALL: ['today', 'week', 'month', 'overdue'] // For validation
};

// ======================
// Frontend Utilities
// ======================

/**
 * Gets human-readable status label
 * (Used in TaskCard.jsx and Board.jsx)
 * @param {TaskStatus} status
 * @returns {string}
 */
export const getStatusLabel = (status) => {
    const labels = {
        [STATUS.TODO]: 'To Do',
        [STATUS.IN_PROGRESS]: 'In Progress',
        [STATUS.DONE]: 'Done'
    };
    return labels[status] || status;
};

/**
 * Gets priority color (for UI)
 * @param {TaskPriority} priority 
 * @returns {string} Tailwind color class
 */
export const getPriorityColor = (priority) => {
    const colors = {
        [PRIORITY.LOW]: 'bg-green-100 text-green-800',
        [PRIORITY.MEDIUM]: 'bg-yellow-100 text-yellow-800',
        [PRIORITY.HIGH]: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
};

// ======================
// Validation Utilities
// ======================

/**
 * Validates status values
 * @param {string} value
 * @returns {value is TaskStatus}
 */
export const isValidStatus = (value) => {
    return STATUS._ALL.includes(value);
};

/**
 * Validates priority values
 * @param {string} value
 * @returns {value is TaskPriority}
 */
export const isValidPriority = (value) => {
    return PRIORITY._ALL.includes(value);
};

/**
 * Validates date filter values
 * @param {string} value
 * @returns {value is DateFilter}
 */
export const isValidDateFilter = (value) => {
    return DATE_FILTERS._ALL.includes(value);
};

// ======================
// Date Utilities
// ======================

/**
 * Date filter presets for CalendarView.jsx
 * @type {Object<string, {label: string, getRange: () => {start?: Date, end?: Date}}>}
 */
export const DATE_FILTER_PRESETS = {
    [DATE_FILTERS.TODAY]: {
        label: 'Today',
        getRange: () => {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }
    },
    [DATE_FILTERS.WEEK]: {
        label: 'This Week',
        getRange: () => {
            const start = new Date();
            start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }
    },
    [DATE_FILTERS.OVERDUE]: {
        label: 'Overdue',
        getRange: () => ({ end: new Date() })
    }
};

// ======================
// Type Definitions
// ======================

/**
 * @typedef {'todo'|'in_progress'|'done'} TaskStatus
 * @typedef {'low'|'medium'|'high'} TaskPriority
 * @typedef {'today'|'week'|'month'|'overdue'} DateFilter
 * @typedef {Object} TaskResponse
 * @property {string} id
 * @property {string} title
 * @property {TaskStatus} status
 * @property {TaskPriority} priority
 * @property {string|null} dueDate
 * @property {string} createdAt
 * @property {string} updatedAt
 */