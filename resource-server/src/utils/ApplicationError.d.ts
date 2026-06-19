import type { Response } from "express";
/**
 * Custom Error Class with status code and message
 * It contains two parameters -
 * - statusCode
 * - message
 */
export default class ApplicationError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
/**
 * Error handling middleware
 *
 * Inorder Flow:
 * - checks if ApplicationError then respond with status code and error message
 * - checks if Language Error then respond with status code 500 and error message
 * - Fallback case if error is none of the above respond with status code 500 and error message
 */
export declare function errorHandling(err: unknown, res: Response): Response<any, Record<string, any>>;
/**
 * Check if value is truthy and if not found throw Application error with given code and message
 *
 * Inorder Flow:
 * - If value is undefined throw Application error with given code and message
 * - return the non nullable value
 */
export declare function strictCheck<T>(value: T, code: number, message: string): NonNullable<T>;
//# sourceMappingURL=ApplicationError.d.ts.map