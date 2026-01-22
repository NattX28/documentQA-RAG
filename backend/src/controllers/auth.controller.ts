import type { Request, Response } from "express";
import { createUser } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const result = await createUser({ email, password, name });

  res.status(201).json({
    success: true,
    message: "user registered successfully.",
    result,
  });
};
