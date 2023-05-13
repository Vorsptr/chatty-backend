import HTTP_STATUS from "http-status-codes";
import { Request, Response } from "express";
import { config } from "@root/config";
import JWT from "jsonwebtoken";
import { joiValidation } from "@global/decorators/joi-validation.decorators";
import { BadRequestError } from "@global/helpers/error-handler";
import { loginSchema } from "@auth/schemes/signin";
import { IAuthDocument } from "@auth/interfaces/auth.interface";
import { authService } from "@service/db/auth.service";
import {
  IResetPasswordParams,
  IUserDocument,
} from "@user/interfaces/user.interface";
import { userService } from "@service/db/user.service";

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const checkIfUserExists: IAuthDocument =
      await authService.getAuthUserByUsername(username);
    if (!checkIfUserExists) {
      throw new BadRequestError("Invalid credentials");
    }
    const passwordsMatch: boolean = await checkIfUserExists.comparePassword(
      password
    );
    if (!passwordsMatch) {
      throw new BadRequestError("Invalid password credentials");
    }
    const user: IUserDocument = await userService.getUserById(
      `${checkIfUserExists._id}`
    );

    const userJwt: string = JWT.sign(
      {
        userId: checkIfUserExists._id,
        uId: checkIfUserExists.uId,
        email: checkIfUserExists.email,
        username: checkIfUserExists.username,
        avatarColor: checkIfUserExists.avatarColor,
      },
      config.JWT_TOKEN!
    );
    const userDocument: IUserDocument = {
      ...user,
      authId: checkIfUserExists!._id,
      username: checkIfUserExists!.username,
      email: checkIfUserExists!.email,
      avatarColor: checkIfUserExists!.avatarColor,
      uId: checkIfUserExists!.uId,
      createdAt: checkIfUserExists!.createdAt,
    } as IUserDocument;
    req.session = { jwt: userJwt };
    res.status(HTTP_STATUS.OK).json({
      message: "Logged in successfully",
      user: userDocument,
      token: userJwt,
    });
  }
}
