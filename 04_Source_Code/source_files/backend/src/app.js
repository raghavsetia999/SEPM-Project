import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { codeforcesRouter } from "./modules/codeforces/codeforces.routes.js";
import { jobsRouter } from "./modules/jobs/jobs.routes.js";
import { progressRouter } from "./modules/progress/progress.routes.js";
import { reportRouter } from "./modules/report/report.routes.js";
import { userRouter } from "./modules/user/user.routes.js";
import { successResponse } from "./utils/ApiResponse.js";

export const app = express();

if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "250kb" }));
app.use(express.urlencoded({ extended: false, limit: "250kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: env.NODE_ENV === "test" ? 1000 : 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again later." } },
});

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === "test" ? 1000 : 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_request, response) => {
  response.json(
    successResponse({
      status: "ok",
      service: "cp-performance-analyzer-api",
      environment: env.NODE_ENV,
    }),
  );
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/codeforces", codeforcesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/reports", reportRouter);
app.use("/api/progress", progressRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
