import { IAuthDocument } from "@auth/interfaces/auth.interface";
import HTTP_STATUS from "http-status-codes";
import { Request, Response } from "express";
import { config } from "@root/config";
import { authService } from "@service/db/auth.service";
import { BadRequestError } from "@global/helpers/error-handler";
import { joiValidation } from "@global/decorators/joi-validation.decorators";
import { emailSchema, passwordSchema } from "@auth/schemes/password";
import crypto from "crypto";
import { forgotPasswordTemaplte } from "@service/emails/templates/forgot-password/forgot-password-template";
import { emailQueue } from "@service/queues/email.queue";
import { IResetPasswordParams } from "@user/interfaces/user.interface";
import moment from "moment";
import publicID from "ip";
import { resetPasswordTemplate } from "@service/emails/templates/reset-password/reset-password-template";

export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByEmail(
      email
    );
    if (!existingUser) {
      throw new BadRequestError("Invalid credentials");
    }
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString("hex");
    await authService.updatePasswordToken(
      `${existingUser._id}`,
      randomCharacters,
      Date.now() * 60 * 60 * 1000
    );
    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
    const template: string = forgotPasswordTemaplte.passwordResetTemplate(
      existingUser.username,
      resetLink
    );
    emailQueue.addEmailJob("forgotPasswordEmail", {
      template,
      receiverEmail: email,
      subject: "Reset your password",
    });
    res.status(HTTP_STATUS.OK).json({ message: "Password reset email sent." });
  }

  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    const existingUser: IAuthDocument =
      await authService.getUserByPasswordToken(token);
    if (password !== confirmPassword) {
      throw new BadRequestError("Password do not match");
    }
    if (!existingUser) {
      throw new BadRequestError("Reset token has expired");
    }
    existingUser.password = password;
    existingUser.passwordResetExpires = undefined;
    existingUser.passwordResetToken = undefined;
    await existingUser.save();
    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicID.address(),
      date: moment().format("DD/MM/YYYY HH:mm"),
    };
    const template: string =
      resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEmailJob("forgotPasswordEmail", {
      template,
      receiverEmail: existingUser.email!,
      subject: "Password Reset Confirmation",
    });
    res
      .status(HTTP_STATUS.OK)
      .json({ message: "Password successfully updated" });
  }
}
