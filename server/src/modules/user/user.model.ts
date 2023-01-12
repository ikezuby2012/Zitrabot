import * as crypto from "crypto";
import mongoose from "mongoose";
// import bcrypt from 'bcryptjs';
import validator from "validator";
import toJSON from "../toJSON/toJSON";
// import paginate from "../paginate/paginate";
import { IUserDoc, IUserModel } from "./user.interfaces";

const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema<IUserDoc, IUserModel>(
  {
    name: {
      type: String,
      required: [true, "please tell us your name?"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "please provide your valid email address"],
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number"
          );
        }
      },
      private: true, // used by the toJSON plugin
    },
    passwordConfirm: {
      type: String,
      required: [true, "please provide a confirm password"],
      minLength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number"
          );
        }
        // if (value === this.password) throw new Error("passwords does not match!")
      },
      private: true, // used by toJSON plugin
    },
    role: {
      type: String,
      enum: ["user", "super-admin", "admin"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
// userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.static(
  "isEmailTaken",
  async function (
    email: string,
    excludeUserId: mongoose.ObjectId
  ): Promise<boolean> {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
  }
);

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.method(
  "isPasswordMatch",
  async function (password: string): Promise<boolean> {
    const user = this;
    return bcrypt.compare(password, user.password);
  }
);

/**
 * Check if password matches the passwordConfrim field
 * @param {string} password
 * @returns {any}
 */

userSchema.path("passwordConfirm").validate(function (value) {
  if (this.get("password") !== value) {
    throw new Error("Password and password confirm does not match!");
  }
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 12);
    user.passwordConfirm = undefined;
  }
  next();
});

userSchema.method(
  "changedPasswordAfter",
  async function (JWTTimestamp: number) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        (this.passwordChangedAt.getTime() / 1000).toString(),
        10
      );
      return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
  }
);

userSchema.method(
  "createPasswordResetToken",
  async function (): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
  }
);

const User = mongoose.model<IUserDoc, IUserModel>("User", userSchema);
export default User;
