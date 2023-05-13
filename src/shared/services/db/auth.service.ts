import { AuthModel } from "@auth/models/auth.schema";
import { Helpers } from "./../../globals/helpers/helpers";
import { IAuthDocument } from "@auth/interfaces/auth.interface";

class AuthService {
  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }

  public async getUserByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<IAuthDocument> {
    const query = {
      $or: [
        { username: Helpers.firstLetterUppercase(username) },
        { email: Helpers.stringToLowerCase(email) },
      ],
    };
    const user: IAuthDocument = (await AuthModel.findOne(
      query
    ).exec()) as IAuthDocument;
    return user;
  }

  public async getAuthUserByUsername(username: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      username: Helpers.firstLetterUppercase(username),
    }).exec()) as IAuthDocument;
    return user;
  }

  public async getAuthUserByEmail(email: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      email: Helpers.stringToLowerCase(email),
    })) as IAuthDocument;
    return user;
  }
  public async updatePasswordToken(
    authId: string,
    token: string,
    tokenExpiration: number
  ): Promise<void> {
    await AuthModel.updateOne(
      { _id: authId },
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration,
      }
    );
  }

  public async getUserByPasswordToken(token: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    })) as IAuthDocument;
    return user;
  }
}

export const authService: AuthService = new AuthService();
