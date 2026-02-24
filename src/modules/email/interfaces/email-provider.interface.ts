export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
}

export interface IEmailProvider {
  sendEmail(options: EmailOptions, html: string): Promise<boolean>;
  getProviderName(): string;
}
