import fs from "fs";
import ejs from "ejs";

class ForgotPasswordTemplate {
  public passwordResetTemplate(username: string, resetLink: string): string {
    return ejs.render(
      fs.readFileSync(__dirname + "/forgot-password-template.ejs", "utf-8"),
      {
        username,
        resetLink,
        image_url:
          "https://images.unsplash.com/photo-1584985429926-08867327d3a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1976&q=80",
      }
    );
  }
}

export const forgotPasswordTemaplte: ForgotPasswordTemplate =
  new ForgotPasswordTemplate();
