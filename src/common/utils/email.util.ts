import { emailService } from "../../modules/email/email.service";

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
}

/**
 * Send email using the new EmailService (Bridge for backward compatibility)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  return emailService.sendEmail(options);
};

/**
 * Pre-defined email helper functions
 */
export const emailTemplates = {
  sendVerificationEmail: (to: string, token: string, name: string) =>
    emailService.sendVerificationEmail(to, token, name),

  sendPasswordResetEmail: (to: string, token: string, name: string) =>
    emailService.sendPasswordResetEmail(to, token, name),

  sendWelcomeEmail: (to: string, name: string) =>
    emailService.sendWelcomeEmail(to, name),
};
