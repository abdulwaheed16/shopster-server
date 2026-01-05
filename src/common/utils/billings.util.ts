import { BillingInterval } from "@prisma/client";

export const getBillingInterval = (interval: BillingInterval) => {
  switch (interval) {
    case "MONTHLY":
      return "month";
    case "YEARLY":
      return "year";
    default:
      return "month";
  }
};
