import HTTP_STATUS from "http-status-codes";
import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { joiValidation } from "@global/decorators/joi-validation.decorators";
import { signupSchema } from "@auth/schemes/signup";
import { IAuthDocument, ISignUpData } from "@auth/interfaces/auth.interface";
import { authService } from "@service/db/auth.service";
import { BadRequestError } from "@global/helpers/error-handler";
import { Helpers } from "@global/helpers/helpers";
import { UploadApiResponse } from "cloudinary";
import { upload } from "@global/helpers/cloudinary-upload";
import { IUserDocument } from "@user/interfaces/user.interface";
import { UserCache } from "@service/redis/user.cache";
import { config } from "@root/config";
import { omit } from "lodash";
import { authQueue } from "@service/queues/auth.queue";
import { userQueue } from "@service/queues/user.queue";
import JWT from "jsonwebtoken";

const userCache: UserCache = new UserCache();

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, password, email, avatarColor, avatarImage } = req.body;
    const checkIfUserExists: IAuthDocument =
      await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExists) {
      throw new BadRequestError("Invalid credentials");
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = `${Helpers.generateRandomIntegers(12)}`;
    const authData: IAuthDocument = SignUp.prototype.signUpData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor,
    });

    const result: UploadApiResponse = (await upload(avatarImage, {
      public_id: `${userObjectId}`,
      overwrite: true,
      invalidate: true,
    })) as UploadApiResponse;

    if (!result.public_id) {
      throw new BadRequestError("File upload: Error occured. Try again.");
    }

    // Add to redis cache
    const userDataForCache: IUserDocument = SignUp.prototype.userData(
      authData,
      userObjectId
    );
    userDataForCache.profilePicture = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

    // Add to database
    omit(userDataForCache, [
      "uId",
      "username",
      "email",
      "avatarColor",
      "password",
    ]);
    console.log(userDataForCache);
    authQueue.addAuthUserJob("addAuthUserToDB", { value: userDataForCache });
    userQueue.addUserJob("addUserToDB", { value: userDataForCache });

    const userJwt: string = SignUp.prototype.signupToken(
      authData,
      userObjectId
    );
    req.session = { jwt: userJwt };
    res.status(HTTP_STATUS.CREATED).json({
      message: "User created successfully",
      user: userDataForCache,
      token: userJwt,
    });
  }

  private signupToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor,
      },
      config.JWT_TOKEN!
    );
  }

  private signUpData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.stringToLowerCase(email),
      password,
      avatarColor,
      createdAt: new Date(),
    } as IAuthDocument;
  }
  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: "",
      blocked: [],
      blockedBy: [],
      work: "",
      location: "",
      school: "",
      quote: "",
      bgImageVersion: "",
      bgImageId: "",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true,
      },
      social: {
        facebook: "",
        instagram: "",
        twitter: "",
        youtube: "",
      },
    } as unknown as IUserDocument;
  }
}