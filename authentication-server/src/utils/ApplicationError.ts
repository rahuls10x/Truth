import type { Response } from "express";
import AuthorizationError from "./AuthorizationError.js";

/**
 * Custom Error Class with status code and message
 * It contains two parameters - 
 * - statusCode
 * - message
 */
export default class ApplicationError extends Error {
    public statusCode: number;

    constructor(statusCode:number, message: string) {
        super(message);
        this.name = "ApplicationError";
        this.statusCode = statusCode;
    }
}

/**
 * Error handling middleware
 * 
 * Inorder Flow:
 * - checks if AuthorizationError then redirect to consent URL with error query parameters
 * - checks if ApplicationError then respond with status code and error message
 * - checks if Language Error then respond with status code 500 and error message
 * - Fallback case if error is none of the above respond with status code 500 and error message
 */
export function errorHandling(err: unknown, res: Response) {
    if (err instanceof AuthorizationError) {
        const errorParams = new URLSearchParams({
            error: err.error,
            error_description: err.message,
        });
        return res.status(302).redirect(`${process.env.ORIGIN_URL}/consent?${errorParams.toString()}`);
    }

    if (err instanceof ApplicationError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }

    const genericMessage = err instanceof Error ? err.message : "Internal Server Error";
	console.error("[ServerError]:", err);

    if (err instanceof Error) {
        console.log(err);
        return res.status(500).json({
            success: false,
            error:genericMessage
        });
    }

    return res.status(500).json({
        success: false,
        error: genericMessage
    });
}
/**
 * Check if value is truthy and if not found throw Application error with given code and message
 * 
 * Inorder Flow:
 * - If value is undefined throw Application error with given code and message
 * - return the non nullable value
 */
export function strictCheck<T>(value:T, code: number, message:string):NonNullable<T>{
    if(!value){
        throw new ApplicationError(code, message);
    }

    return value as NonNullable<T>;
}

/**
 * Standardized socket error handling helper.
 *
 * Inorder Flow:
 * - Check if error is an instance of ApplicationError
 * - Execute callback with error response object if provided
 * - Fallback to 500 Internal Server Error structure for unhandled exceptions
 */
export function socketErrorHandling(error: unknown, callback?: Function): void {
	if (typeof callback !== "function") {
		console.error("[SocketError]:", error);
		return;
	}

	if (error instanceof ApplicationError) {
		callback({
			success: false,
			error: error.message,
		});
		return;
	}

	const genericMessage = error instanceof Error ? error.message : "Internal Server Error";
	console.error("[SocketServerError]:", error);

	callback({
		success: false,
		error: genericMessage,
	});
}