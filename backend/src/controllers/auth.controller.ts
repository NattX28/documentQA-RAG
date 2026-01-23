import type { Request, Response } from "express";
import {
  createUser,
  getCurrentUser,
  validateUserCredentials,
} from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const result = await createUser({ email, password, name });

  res.status(201).json({
    success: true,
    message: "user registered successfully.",
    result,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await validateUserCredentials({ email, password });

  res.status(200).json({
    success: true,
    message: "user logged in successfully",
    result,
  });
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = await getCurrentUser(userId);

  res.status(200).json({ user });
};
