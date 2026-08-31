// Extend Express's built-in Request type so TypeScript knows that
// req.user is available on any route that goes through the authenticate middleware.
// Without this, TypeScript would complain that 'user' doesn't exist on Request.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

export {};
