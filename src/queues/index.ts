import { adGenerationWorker } from "./ad-generation.worker";
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
  console.log("Ad Generation Worker: Ready");
  console.log("Template Preview Worker: Ready");
  console.log("Shopify Sync Worker: Ready");
};

/**
 * Gracefully shutdown all workers
 */
export const shutdownWorkers = async () => {
  console.log("Shutting down queue workers...");  

  await Promise.all([
    adGenerationWorker.close(),
    templatePreviewWorker.close(),
    shopifySyncWorker.close(),
  ]);

  console.log("Queue workers shut down successfully");
};

// Export workers for testing/monitoring
export { adGenerationWorker, shopifySyncWorker, templatePreviewWorker };
