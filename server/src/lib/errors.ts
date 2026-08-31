/**
 * AppError is thrown anywhere in the application to signal an expected
 * error (e.g. 404 Not Found, 401 Unauthorized). The error handler in
 * app.ts checks for this type and uses the statusCode to send the right
 * HTTP response instead of always returning 500.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
