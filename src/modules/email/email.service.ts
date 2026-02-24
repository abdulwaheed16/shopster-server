import fs from "fs";
import handlebars from "handlebars";
import path from "path";
import { EmailFactory } from "./email.factory";
import { EmailOptions } from "./interfaces/email-provider.interface";

export class EmailService {
  /**
   * Compile handlebars template with layout
   */
  private compileTemplate(templateName: string, context: any): string {
    const templatesDir = path.join(__dirname, "../../common/templates");

    // Load layout
    const layoutSource = fs.readFileSync(
      path.join(templatesDir, "layout.hbs"),
      "utf8",
    );

    // Load specific template
    const templateSource = fs.readFileSync(
      path.join(templatesDir, `${templateName}.hbs`),
      "utf8",
    );

    const layout = handlebars.compile(layoutSource);
    const template = handlebars.compile(templateSource);

    // Render template and then inject into layout
    const body = template(context);
    return layout({
      ...context,
      body,
      subject: context.subject || "Shopster Notification",
    });
  }

  /**
   * Log email details for auditing and development
   */
  private logEmail(
    options: EmailOptions,
    html: string,
    providerName: string,
    success: boolean,
  ) {
    const timestamp = new Date().toISOString();
    const logPrefix = `[EmailLog][${timestamp}][${providerName}]`;
    const status = success ? "SUCCESS" : "FAILED";

    console.log(
      `${logPrefix} Status: ${status} | To: ${options.to} | Subject: ${options.subject}`,
    );

    // Log full HTML in development or if failed
    if (process.env.NODE_ENV === "development" || !success) {
      console.log(`${logPrefix} --- Rendered Content Start ---`);
      console.log(html);
      console.log(`${logPrefix} --- Rendered Content End ---`);
    }
  }

  /**
   * Send email using the configured provider
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const html = this.compileTemplate(options.template, options.context);
      const provider = EmailFactory.getProvider();
      const providerName = provider.getProviderName();

      const success = await provider.sendEmail(options, html);

      this.logEmail(options, html, providerName, success);

      return success;
    } catch (error: any) {
      console.error("[EmailService] Critical failure:", error.message);
      return false;
    }
  }

  /**
   * Pre-defined email helper functions
   */
  async sendVerificationEmail(to: string, token: string, name: string) {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return this.sendEmail({
      to,
      subject: "Verify Your Email - Shopster",
      template: "verify-email",
      context: {
        name,
        url: `${baseUrl}/auth/verify-email?token=${token}`,
        subject: "Verify Your Email - Shopster",
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string, name: string) {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return this.sendEmail({
      to,
      subject: "Reset Your Password - Shopster",
      template: "reset-password",
      context: {
        name,
        url: `${baseUrl}/auth/reset-password?token=${token}`,
        subject: "Reset Your Password - Shopster",
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    return this.sendEmail({
      to,
      subject: "Welcome to Shopster!",
      template: "welcome",
      context: {
        name,
        url: `${process.env.FRONTEND_URL}/dashboard`,
        subject: "Welcome to Shopster!",
      },
    });
  }

  async sendInvitationEmail(to: string, name: string, password: string) {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return this.sendEmail({
      to,
      subject: "You've been invited to Shopster!",
      template: "invitation",
      context: {
        name,
        email: to,
        password,
        url: `${baseUrl}/auth/login`,
        subject: "You've been invited to Shopster!",
      },
    });
  }
}

export const emailService = new EmailService();
