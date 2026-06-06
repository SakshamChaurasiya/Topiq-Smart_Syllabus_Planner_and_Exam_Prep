/**
 * responseHelper.js
 * Standardized API response format for all endpoints.
 * Using this keeps all API responses consistent.
 */

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data (optional)
 */
const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
    const response = {
        success: true,
        message,
    };

    // Only include data field if it's provided
    if (data !== null && data !== undefined) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} errors - Validation errors or extra details (optional)
 */
const sendError = (res, statusCode = 500, message = "Something went wrong", errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors !== null && errors !== undefined) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
