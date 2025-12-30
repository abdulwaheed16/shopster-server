import { emailTemplates } from "./common/utils/email.util";

async function testResilience() {
  console.log("Testing Email Service Resilience (Development Mode)...");
  console.log("---------------------------------------------------------");
  console.log(
    'ℹNote: This test is EXPECTED to "fail" delivery due to your network block,'
  );
  console.log(
    "    but it SHOULD show the rendered HTML in the console so you can continue testing."
  );
  console.log("---------------------------------------------------------\n");

  try {
    await emailTemplates.sendVerificationEmail(
      "abwaheed.ahmed@gmail.com",
      "mock-token-12345",
      "Test User"
    );

    console.log("\nResilience test complete!");
    console.log(
      '✨ If you see the "DEVELOPMENT EMAIL PREVIEW" above, the fix is working.'
    );
  } catch (error) {
    console.error("Unexpected error in resilience test:", error);
  }
}

testResilience();
