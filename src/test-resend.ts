import { emailTemplates } from "./common/utils/email.util";

async function verifyResend() {
  console.log("Verifying Resend API Integration...");
  console.log("--------------------------------------");

  try {
    const success = await emailTemplates.sendWelcomeEmail(
      "abwaheed.ahmed@gmail.com",
      "Abdul"
    );

    if (success) {
      console.log("Resend verify succeeded! Check your inbox.");
    } else {
      console.log('Resend verify "skipped" or "failed" (Check console above).');
      console.log("Ensure RESEND_API_KEY is correct in your .env");
    }
  } catch (error: any) {
    console.error(
      "Unexpected error in Resend verification:",
      error.message || error
    );
  }
}

verifyResend();
