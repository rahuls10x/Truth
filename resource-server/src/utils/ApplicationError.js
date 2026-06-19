/**
 * Custom Error Class with status code and message
 * It contains two parameters -
 * - statusCode
 * - message
 */
export default class ApplicationError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
/**
 * Error handling middleware
 *
 * Inorder Flow:
 * - checks if ApplicationError then respond with status code and error message
 * - checks if Language Error then respond with status code 500 and error message
 * - Fallback case if error is none of the above respond with status code 500 and error message
 */
export function errorHandling(err, res) {
    if (err instanceof ApplicationError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }
    if (err instanceof Error) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
    return res.status(500).json({
        success: false,
        error: "Unknown error"
    });
}
/**
 * Check if value is truthy and if not found throw Application error with given code and message
 *
 * Inorder Flow:
 * - If value is undefined throw Application error with given code and message
 * - return the non nullable value
 */
export function strictCheck(value, code, message) {
    if (!value) {
        throw new ApplicationError(message, code);
    }
    return value;
}
//# sourceMappingURL=ApplicationError.js.map