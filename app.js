import express from "express";
import morgan from "morgan";
import mongosanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import helmet from "helmet";
import * as path from "path";
import cookieparser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import tourRouter from "./routes/tourRoutes.js";
import userRouter from "./routes/userRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import viewRouter from "./routes/viewRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import AppError from "./appError.js";
import globalErrorHandler from "./controllers/errorController.js";

const __dirname = process.cwd();
const app = express();
app.enable("trust proxy");
app.use(cors());
// set the template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
// serving static files
// pug can have access to the static files in this folder
app.use(express.static(path.join(__dirname, "public")));
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://*.cloudflare.com",
  "https://js.stripe.com/v3",
  "https://checkout.stripe.com",
];
const styleSrcUrls = [
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://www.myfonts.com/fonts/radomir-tinkov/gilroy/*",
  " checkout.stripe.com",
];
const connectSrcUrls = [
  "https://*.mapbox.com/",
  "https://*.cloudflare.com",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:52191",
  "*.stripe.com",
];

const fontSrcUrls = ["fonts.googleapis.com", "fonts.gstatic.com"];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:"],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ["*.stripe.com", "*.stripe.network"],
    },
  }),
);

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
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieparser());

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

app.use(compression());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);
export default app;
