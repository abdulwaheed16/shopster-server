import { vercelBlobService } from "../../../modules/upload/services/storage/vercel-blob.service";
import { IAdProcessor } from "../types/processor.interface";
import { AdTemplateProcessor } from "./ad-template.processor";
import { BaseImageProcessor } from "./base-image.processor";
import { FinalVideoProcessor } from "./final-video.processor";
import { ModelImageProcessor } from "./model-image.processor";
import { SingleSceneProcessor } from "./single-scene.processor";
import { StoryboardProcessor } from "./storyboard.processor";

/**
 * ProcessorRegistry — Registry pattern (OCP-friendly)
 *
 * Maps each taskType string → its concrete IAdProcessor strategy.
 */
export const processorRegistry = new Map<string, IAdProcessor>([
  ["BASE_IMAGE", new BaseImageProcessor(vercelBlobService)],
  ["MODEL_IMAGE", new ModelImageProcessor(vercelBlobService)],
  ["STORYBOARD", new StoryboardProcessor(vercelBlobService)],
  ["ALL_SCENES", new StoryboardProcessor(vercelBlobService)], 
  ["SINGLE_SCENE", new SingleSceneProcessor(vercelBlobService)],
  ["FINAL_VIDEO", new FinalVideoProcessor(vercelBlobService)],
  ["AD_TEMPLATE", new AdTemplateProcessor(vercelBlobService)],
]);

export {
  AdTemplateProcessor,
  BaseImageProcessor,
  FinalVideoProcessor,
  ModelImageProcessor,
  SingleSceneProcessor,
  StoryboardProcessor,
};
