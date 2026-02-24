import { Resend } from "resend";
import { config } from "../../../config/env.config";
import {
  EmailOptions,
  IEmailProvider,
} from "../interfaces/email-provider.interface";

export class ResendProvider implements IEmailProvider {
  private resend: Resend | null;
  private providerName: string = "RESEND";

  constructor() {
    this.resend = config.email.resendApiKey
      ? new Resend(config.email.resendApiKey)
      : null;
  }

  async sendEmail(options: EmailOptions, html: string): Promise<boolean> {
    if (!this.resend) {
      console.warn("[Resend] API key missing. Email skipped.");
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: config.email.from || "Shopster <onboarding@resend.dev>",
        to: options.to,
        subject: options.subject,
        html,
      });

      if (error) {
        throw error;
      }

      console.log(`[Resend] Email sent: ${data?.id}`);
      return true;
    } catch (error: any) {
      console.error(`[Resend] Error sending email:`, error.message);
      return false;
    }
  }

  getProviderName(): string {
    return this.providerName;
  }
}
