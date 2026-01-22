import jwt from "jsonwebtoken";
import { type AuthTokenPayload } from "../models/types";

const JWT_SECRET = process.env.JWT_SECRET!;

export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
};
