import express, { Express } from "express";
import helmet from "helmet";
import xss from "xss-clean";
import ExpressMongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import cors from "cors";
import httpStatus from "http-status";
// import config from "./config";
import { morgan } from "./modules/logger";
import { authLimiter } from "./modules/utils";
import { ApiError, errorConverter, errorHandler } from "./modules/errors";
import routes from "./routes/v1";

const app: Express = express();

if ((process.env.NODE_ENV as string) !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// enable cors
app.use(cors());
app.options("*", cors());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(ExpressMongoSanitize());

// gzip compression
app.use(compression());

// limit repeated failed requests to auth endpoints
if ((process.env.NODE_ENV as string) !== "development") {
  app.use("/api/v1/auth", authLimiter);
}

// v1 api routes
app.use("/api/v1", routes);

app.get("/api/v1", (req, res) => {
  res.status(200).json({ message: `ping me, server is running on port 5000` });
});

// send back a 404 error for any unknown api request
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
