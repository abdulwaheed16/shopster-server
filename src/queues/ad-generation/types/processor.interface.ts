import { BaseJobData } from "./job-data.types";

// ───────────────────────────────────────────────────────────────────
// Result shape returned by every processor
// ───────────────────────────────────────────────────────────────────
export interface ProcessorResult {
  success: boolean;
  adId: string;
  /** true when n8n accepted the job and will POST the result via callback */
  async?: boolean;
  taskType?: string;
  url?: string;
  scenes?: Array<{ id: string; description: string; imageUrl?: string }>;
}

// ───────────────────────────────────────────────────────────────────
// Strategy interface — every processor implements this
// DIP: workers and the router depend on this abstraction, never on concretions
// ───────────────────────────────────────────────────────────────────
export interface IAdProcessor<T extends BaseJobData = BaseJobData> {
  handle(data: T): Promise<ProcessorResult>;
}
