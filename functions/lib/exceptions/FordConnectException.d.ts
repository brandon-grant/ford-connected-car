/**
 * Represents a custom exception for handling specific errors related to the FordConnect API.
 * This class extends the native JavaScript Error class, adding a status code to provide
 * additional context about the type of error (e.g., HTTP status codes).
 * @extends Error
 */
export declare class FordConnectException extends Error {
    status: number;
    /**
     * Initializes a new instance of the FordConnectException class with a specific status code and error message.
     * If the status provided is not a number, it defaults to 400 (Bad Request).
     *
     * @param {number} status - The HTTP status code associated with this error, providing a hint about the type of error.
     * @param {string} message - The detailed message describing the error.
     */
    constructor(status: number, message: string);
}
