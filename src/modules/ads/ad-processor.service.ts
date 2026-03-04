import { AdStatus } from "@prisma/client";
import Logger from "../../common/logging/logger";
import { prisma } from "../../config/database.config";
import { processorRegistry } from "../../queues/ad-generation/processors";
import { AdGenerationJobData } from "../../queues/ad-generation/types/job-data.types";
import { adsService } from "./ads.service";

/**
 * AdProcessorService
 *
 * Slim Facade / Router that delegates generation requests to the
 * appropriate task-specific processor strategy.
 */
export class AdProcessorService {
  async processGeneration(data: AdGenerationJobData) {
    const { adId, isDraft, taskType } = data;

    Logger.info(
      `[AdProcessorService] Routing task — adId=${adId} taskType=${taskType}`,
    );

    // 1. Status -> PROCESSING
    await this.updateResourceStatus(adId, AdStatus.PROCESSING, isDraft, {
      taskType,
    });

    // 2. Delegate to strategy
    const processor = processorRegistry.get(taskType);
    if (!processor) {
      const error = `No processor registered for taskType: ${taskType}`;
      Logger.error(`[AdProcessorService] ${error}`);
      await this.updateResourceStatus(adId, AdStatus.FAILED, isDraft, {
        error,
      });
      throw new Error(error);
    }

    try {
      const result = await processor.handle(data as any);
      return result;
    } catch (error: any) {
      Logger.error(
        `[AdProcessorService] Processor failed — adId=${adId} error=${error.message}`,
      );
      await this.updateResourceStatus(adId, AdStatus.FAILED, isDraft, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Helper to update status on either Ad or AdDraft
   */
  private async updateResourceStatus(
    id: string,
    status: AdStatus,
    isDraft: boolean,
    metadata: any = {},
  ) {
    const table = isDraft ? "adDraft" : "ad";

    // @ts-ignore
    await prisma[table].update({
      where: { id },
      data: {
        status: status as any,
        ...(status === AdStatus.FAILED
          ? {
              metadata: {
                error: metadata.error,
                failedAt: new Date().toISOString(),
              },
            }
          : {}),
      },
    });

    adsService.emitAdUpdate(id, status, metadata);
  }
}

// Singleton for workers to consume
export const adProcessorService = new AdProcessorService();
