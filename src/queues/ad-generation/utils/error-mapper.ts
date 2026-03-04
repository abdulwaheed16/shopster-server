export function mapErrorMessage(err: Error | string): string {
  const rawMessage =
    typeof err === "string" ? err : err.message || "Unknown error";

  if (
    rawMessage.includes(".map is not a function") ||
    rawMessage.includes("cannot read property")
  ) {
    return "Some of your product details couldn't be processed. Please check your assets and try again.";
  }

  if (rawMessage.includes("timeout") || rawMessage.includes("ETIMEDOUT")) {
    return "The generation service is taking longer than expected. Please wait a moment or retry.";
  }

  if (rawMessage.includes("401") || rawMessage.includes("403")) {
    return "Authentication error with our AI providers. Our team has been notified.";
  }

  if (
    rawMessage.includes("insufficient credits") ||
    rawMessage.includes("quota")
  ) {
    return "Generation limit reached for this service. Please check your plan.";
  }

  return "We encountered an unexpected issue while generating your ad. Please try again.";
}
