/**
 * Custom Error Class for OAuth authorization flow failures
 * It contains two parameters - 
 * - error (OAuth 2.0 error identifier)
 * - message (Human-readable description)
 */
export default class AuthorizationError extends Error {
	public error: string;

	constructor(error: string, message: string) {
		super(message);
		this.error = error;
	}
}

/**
 * Check if value is truthy and if not throw Authorization error with given error code and message
 * 
 * Inorder Flow:
 * - If value is falsy throw Authorization error with given error code and message
 * - return the non nullable value
 */
export function authorizeCheck<T>(value: T, error: string, message: string): NonNullable<T> {
	if (!value) {
		throw new AuthorizationError(error, message);
	}

	return value as NonNullable<T>;
}