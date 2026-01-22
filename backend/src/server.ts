import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { AppError } from "./utils/AppError.util";

// Routes
import authRoute from "./routes/auth.route";

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: (15 / 60) * 1000,
  max: 100,
  message: "Too many request from this IP, please try again later.",
});
app.use("/api", limiter);

app.use("/api/auth", authRoute);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req: Request, res: Response) => {
  res.status(404).json("Route not found");
});

// Error handling in middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    error: "Internal server error.",
    ...(process.env.NODE_ENV === "development" && {
      message: err.message,
      stack: err.stack,
    }),
  });
});

export default app;
