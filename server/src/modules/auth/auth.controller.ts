import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import * as authService from "./auth.service";
import { User } from "../user";
import { createSendToken } from "../token/token.service";

export const register = catchAsync(async (req: Request, res: Response) => {
  console.log("it hits here");
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, req, res);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);

  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(httpStatus.NO_CONTENT).json({ status: "success" });
});

// export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
//   // const userWithTokens = await authService.refreshAuth(req.body.refreshToken);
//   // res.send({ ...userWithTokens });
// });

// export const forgotPassword = catchAsync(
//   async (req: Request, res: Response) => {
//     // const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
//     // await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
//     // res.status(httpStatus.NO_CONTENT).send();
//   }
// );

// export const resetPassword = catchAsync(async (req: Request, res: Response) => {
//   // await authService.resetPassword(req.query['token'], req.body.password);
//   // res.status(httpStatus.NO_CONTENT).send();
// });

// export const sendVerificationEmail = catchAsync(
//   async (req: Request, res: Response) => {
//     // const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
//     // await emailService.sendVerificationEmail(req.user.email, verifyEmailToken, req.user.name);
//     // res.status(httpStatus.NO_CONTENT).send();
//   }
// );

// export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
//   // await authService.verifyEmail(req.query['token']);
//   // res.status(httpStatus.NO_CONTENT).send();
// });
