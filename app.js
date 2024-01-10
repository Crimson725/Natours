import express from "express";
import morgan from "morgan";
import mongosanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import helmet from "helmet";
import tourRouter from "./routes/tourRoutes.js";
import userRouter from "./routes/userRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import AppError from "./appError.js";
import globalErrorHandler from "./controllers/errorController.js";

const __dirname = process.cwd();
const app = express();

// global middlewares
// set security HTTP headers
app.use(helmet());
// development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);
// body parser, reading data from body into req.body
app.use(
  express.json({
    limit: "10kb",
  }),
);

// data sanitization against NoSQL query injection
app.use(mongosanitize());
// data sanitization against XSS
app.use(xss());
// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQuantity",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);
// serving static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
// routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);
export default app;
