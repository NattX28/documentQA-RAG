import pool from "../config/database";
import { type User } from "../models/types";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnauthorizedError,
} from "../utils/AppError.util";
import { generateToken } from "../utils/jwt";

export const createUser = async (userData: RegisterRequest) => {
  const { email, password, name } = userData;
  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  const existsUser = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);

  if (existsUser.rows.length > 0) {
    throw new ConflictError("User already exists");
  }

  const passwordHashed = await Bun.password.hash(password);

  const result = await pool.query<User>(
    `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at`,
    [email, passwordHashed, name],
  );

  const user = result.rows[0];

  if (!user) {
    throw new InternalServerError("Failed to create user record in database.");
  }

  const token = generateToken({ userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  };
};
