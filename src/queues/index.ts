import { adTemplateWorker } from "./ad-generation/workers/ad-template.worker";
import { baseImageWorker } from "./ad-generation/workers/base-image.worker";
import { finalVideoWorker } from "./ad-generation/workers/final-video.worker";
import { modelImageWorker } from "./ad-generation/workers/model-image.worker";
import { singleSceneWorker } from "./ad-generation/workers/single-scene.worker";
import { storyboardWorker } from "./ad-generation/workers/storyboard.worker";
import { shopifySyncWorker } from "./shopify-sync.worker";
import { templatePreviewWorker } from "./template-preview.worker";

/**
 * Initialize all queue workers
 * This should be called when the server starts
 */
export const initializeWorkers = () => {
  console.log("Initializing queue workers...");

  // Workers are already initialized when imported
  // This function just provides a central place to manage them

  console.log("Queue workers initialized successfully");
  console.log(
    "Ad Generation Workers: [Base, Model, Storyboard, Scene, Final, Template] Ready",
  );
  console.log("Legacy Workers: [Shopify, Preview] Ready");
};

/**
 * Gracefully shutdown all workers
 */
export const shutdownWorkers = async () => {
  console.log("Shutting down queue workers...");

  await Promise.all([
    baseImageWorker.close(),
    modelImageWorker.close(),
    storyboardWorker.close(),
    singleSceneWorker.close(),
    finalVideoWorker.close(),
    adTemplateWorker.close(),
    templatePreviewWorker.close(),
    shopifySyncWorker.close(),
  ]);

  console.log("Queue workers shut down successfully");
};

// Export workers for testing/monitoring
export {
  adTemplateWorker,
  baseImageWorker,
  finalVideoWorker,
  modelImageWorker,
  shopifySyncWorker,
  singleSceneWorker,
  storyboardWorker,
  templatePreviewWorker,
};
