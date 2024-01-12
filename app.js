import express from "express";
import morgan from "morgan";
import mongosanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import helmet from "helmet";
import * as path from "path";
import tourRouter from "./routes/tourRoutes.js";
import userRouter from "./routes/userRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import viewRouter from "./routes/viewRoutes.js";
import AppError from "./appError.js";
import globalErrorHandler from "./controllers/errorController.js";

const __dirname = process.cwd();
const app = express();
// set the template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
// serving static files
// pug can have access to the static files in this folder
app.use(express.static(path.join(__dirname, "public")));
// global middlewares
// set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "worker-src": ["blob:"],
        "child-src": ["blob:", "https://js.stripe.com/"],
        "img-src": ["'self'", "data: image/webp"],
        "script-src": [
          "'self'",
          "https://api.mapbox.com",
          "https://cdnjs.cloudflare.com",
          "https://js.stripe.com/v3/",
          "'unsafe-inline'",
        ],
        "connect-src": [
          "'self'",
          "ws://localhost:*",
          "ws://127.0.0.1:*",
          "http://127.0.0.1:*",
          "http://localhost:*",
          "https://*.tiles.mapbox.com",
          "https://api.mapbox.com",
          "https://events.mapbox.com",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
); // development logging
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

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);
export default app;
