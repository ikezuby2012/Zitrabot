import { Request, Response, NextFunction } from "express";
// import httpStatus from "http-status";
import { promisify } from "util";
import jwt from "jsonwebtoken";

import { User } from "../user";
import ApiError from "../errors/ApiError";
import catchAsync from "../utils/catchAsync";
// import config from '../../config';

export const protect = catchAsync(
  async (req: Request | any, res: Response, next: NextFunction) => {
    let token: any;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new ApiError(401, "You are not logged in! Please log in to get access.")
      );
    }

    // 2) Verification token
    const decoded: any = await promisify(jwt.verify)(token);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new ApiError(
          401,
          "The user belonging to this token does no longer exist."
        )
      );
    }

    // 4) Check if user changed password after the token was issued
    if (await currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new ApiError(
          401,
          "User recently changed password! Please log in again."
        )
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  }
);
