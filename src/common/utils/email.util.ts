import fs from "fs";
import handlebars from "handlebars";
import path from "path";
import { Resend } from "resend";
import { config } from "../../config/env.config";

// Initialize Resend
const resend = config.email.resendApiKey
  ? new Resend(config.email.resendApiKey)
  : null;

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
}

/**
 * Compile handlebars template with layout
 */
const compileTemplate = (templateName: string, context: any): string => {
  const templatesDir = path.join(__dirname, "../templates");

  // Load layout
  const layoutSource = fs.readFileSync(
    path.join(templatesDir, "layout.hbs"),
    "utf8"
  );

  // Load specific template
  const templateSource = fs.readFileSync(
    path.join(templatesDir, `${templateName}.hbs`),
    "utf8"
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
};

/**
 * Send email using Resend and Handlebars
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  let html = "";
  try {
    html = compileTemplate(options.template, options.context);

    if (!resend) {
      console.warn("⚠️ Resend API key is missing. Email skipped.");
      if (config.server.isDevelopment) {
        logEmailPreview(options.to, options.subject, html);
      }
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: config.email.from || "Shopster <onboarding@resend.dev>",
      // from: "Shopster <onboarding@resend.dev>",
      to: options.to,
      subject: options.subject,
      html,
    });

    if (error) {
      throw error;
    }

    console.log("Email sent successfully via Resend:", data?.id);
    return true;
  } catch (error: any) {
    console.error("Email sending failed:", error.message || error);

    // In development, we log the rendered HTML so the user can still use the verification/reset links
    if (config.server.isDevelopment) {
      logEmailPreview(options.to, options.subject, html);
    }

    return false;
  }
};

/**
 * Log email preview for development
 */
const logEmailPreview = (to: string, subject: string, html: string) => {
  console.log(
    "\n------------------ DEVELOPMENT EMAIL PREVIEW ------------------"
  );
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(
    "---------------------------------------------------------------"
  );
  console.log("Rendered HTML Content:");
  console.log(html);
  console.log(
    "---------------------------------------------------------------\n"
  );
  console.log(
    "👉 You can copy any links above to proceed with testing your flow."
  );
};

/**
 * Pre-defined email helper functions
 */
export const emailTemplates = {
  sendVerificationEmail: async (to: string, token: string, name: string) => {
    return sendEmail({
      to,
      subject: "Verify Your Email - Shopster",
      template: "verify-email",
      context: {
        name,
        url: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
        subject: "Verify Your Email - Shopster",
      },
    });
  },

  sendPasswordResetEmail: async (to: string, token: string, name: string) => {
    return sendEmail({
      to,
      subject: "Reset Your Password - Shopster",
      template: "reset-password",
      context: {
        name,
        url: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
        subject: "Reset Your Password - Shopster",
      },
    });
  },

  sendWelcomeEmail: async (to: string, name: string) => {
    return sendEmail({
      to,
      subject: "Welcome to Shopster!",
      template: "welcome",
      context: {
        name,
        url: `${process.env.FRONTEND_URL}/dashboard`,
        subject: "Welcome to Shopster!",
      },
    });
  },
};
