import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
// import { promisify } from 'util';
import { IUserDoc } from "../user/user.interfaces";
import config from "../../config";

const { secret, cookieExpiresIn, jwtExpiresIn } = config.jwt;

// const verify = promisify(jwt.verify);

const signToken = (id: string) => {
  return jwt.sign({ id, iat: new Date().getTime() / 1000 }, secret, {
    expiresIn: jwtExpiresIn,
  });
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  // eslint-disable-next-line @typescript-eslint/no-redeclare
  let returnValue: JwtPayload;
  try {
    returnValue = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
  } catch (err) {
    console.error(err);
    returnValue = {};
  }
  return returnValue;
};

export const createSendToken = (
  user: IUserDoc,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token = signToken(user._id);
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + cookieExpiresIn * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  // Remove password from output
  // eslint-disable-next-line no-param-reassign
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};
