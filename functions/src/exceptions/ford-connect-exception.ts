/**
 * Represents a custom exception for handling specific errors related to the FordConnect API.
 * This class extends the native JavaScript Error class, adding a status code to provide
 * additional context about the type of error (e.g., HTTP status codes).
 * @extends Error
 */
export class FordConnectException extends Error {
    public status: number;

    /**
     * Initializes a new instance of the FordConnectException class with a specific status code and error message.
     * If the status provided is not a number, it defaults to 400 (Bad Request).
     *
     * @param {number} status - The HTTP status code associated with this error, providing a hint about the type of error.
     * @param {string} message - The detailed message describing the error.
     */
    constructor(status: number, message: string) {
        if (typeof status !== "number") {
            status = 400; // Default to 400 to ensure there's always a valid error code.
        }

        super(message); // Pass the message to the base Error class constructor.
        this.name = this.constructor.name; // Sets the error name to the constructor name (FordConnectException).
        this.status = status; // Store the status code passed in or defaulted to 400.

        Error.captureStackTrace(this, this.constructor);
    }
}
