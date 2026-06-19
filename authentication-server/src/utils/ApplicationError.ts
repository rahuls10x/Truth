import type { Response } from "express";

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
export function errorHandling(err: unknown, res: Response) {
    // console.log(err);
    if (err instanceof ApplicationError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }

    if (err instanceof Error) {
        console.log(err);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }

    console.log(err);
    return res.status(500).json({
        success: false,
        error: "Internal Server Error"
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