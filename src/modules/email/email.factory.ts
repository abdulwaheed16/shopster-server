import { config } from "../../config/env.config";
import { IEmailProvider } from "./interfaces/email-provider.interface";
import { NodemailerProvider } from "./providers/nodemailer.provider";
import { ResendProvider } from "./providers/resend.provider";

export class EmailFactory {
  private static provider: IEmailProvider;

  static getProvider(): IEmailProvider {
    if (!this.provider) {
      // Logic: Use Resend if API key is present and explicitly production-like,
      // or if we want to default to Nodemailer for local testing.
      // Based on user request: "as i am on local i want to send the email via nodemailer
      // and when i get the prodcuion secure url than i will use the resend service"

      const useResend =
        config.server.isProduction && !!config.email.resendApiKey;

      if (useResend) {
        console.log("[EmailFactory] Initializing ResendProvider");
        this.provider = new ResendProvider();
      } else {
        console.log("[EmailFactory] Initializing NodemailerProvider");
        this.provider = new NodemailerProvider();
      }
    }
    return this.provider;
  }
}
