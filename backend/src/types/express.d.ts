import type { AuthTokenPayload } from "../models/types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
