import { MediaType } from "@prisma/client";

export const AD_COSTS: Record<MediaType, number> = {
  [MediaType.IMAGE]: 1,
  [MediaType.VIDEO]: 5,
};
