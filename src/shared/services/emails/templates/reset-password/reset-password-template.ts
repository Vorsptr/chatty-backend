import fs from "fs";
import ejs from "ejs";
import { IResetPasswordParams } from "@user/interfaces/user.interface";

class ResetPasswordTemplate {
  public passwordResetConfirmationTemplate(
    templateParams: IResetPasswordParams
  ): string {
    const { username, email, ipaddress, date } = templateParams;

    return ejs.render(
      fs.readFileSync(__dirname + "/reset-password-template.ejs", "utf-8"),
      {
        username,
        email,
        ipaddress,
        date,
        image_url:
          "https://images.unsplash.com/photo-1584985429926-08867327d3a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1976&q=80",
      }
    );
  }
}

export const resetPasswordTemplate: ResetPasswordTemplate =
  new ResetPasswordTemplate();
