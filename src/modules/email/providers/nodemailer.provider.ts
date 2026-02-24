import nodemailer from "nodemailer";
import { config } from "../../../config/env.config";
import {
  EmailOptions,
  IEmailProvider,
} from "../interfaces/email-provider.interface";

export class NodemailerProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter;
  private providerName: string = "NODEMAILER";

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host || "smtp.gmail.com",
      port: config.email.port || 587,
      secure: config.email.port === 465,
      auth:
        config.email.user && config.email.password
          ? {
              user: config.email.user,
              pass: config.email.password,
            }
          : undefined,
      debug: config.server.isDevelopment,
      logger: config.server.isDevelopment,
    });

    // Verify connection on startup in development
    if (config.server.isDevelopment) {
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("[Nodemailer] SMTP Connection Error:", error.message);
          console.error("[Nodemailer] Config:", {
            host: config.email.host,
            port: config.email.port,
            user: config.email.user,
            secure: config.email.port === 465,
          });
        } else {
          console.log("[Nodemailer] SMTP Server is ready to take our messages");
        }
      });
    }
  }

  async sendEmail(options: EmailOptions, html: string): Promise<boolean> {
    try {
      console.log(`[Nodemailer] Attempting to send email to ${options.to}...`);

      const info = await this.transporter.sendMail({
        from: config.email.from || '"Shopster" <noreply@shopster.com>',
        to: options.to,
        subject: options.subject,
        html,
      });

      console.log(
        `[Nodemailer] Email sent successfully! MessageID: ${info.messageId}`,
      );
      if (info.pending) console.log(`[Nodemailer] Info: Message is pending.`);

      return true;
    } catch (error: any) {
      console.error(
        `[Nodemailer] Critical failure sending email:`,
        error.message,
      );
      if (error.code) console.error(`[Nodemailer] Error Code: ${error.code}`);
      if (error.command)
        console.error(`[Nodemailer] SMTP Command: ${error.command}`);
      return false;
    }
  }

  getProviderName(): string {
    return this.providerName;
  }
}
