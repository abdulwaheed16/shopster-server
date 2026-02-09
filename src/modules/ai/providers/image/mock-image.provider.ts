import {
  IImageGenerator,
  ImageGenerationResult,
  ImagePromptOptions,
} from "../../interfaces/image-generator.interface";

export class MockImageProvider implements IImageGenerator {
  async generate(
    options: ImagePromptOptions,
  ): Promise<ImageGenerationResult[]> {
    console.log(
      "[MockImageProvider] Generating mock images for:",
      options.prompt,
    );

    // Simulate slight delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
    ];

    const numImages = options.numImages || 1;
    return mockImages.slice(0, numImages).map((url) => ({
      imageUrl: url,
      metadata: {
        provider: "mock",
        prompt: options.prompt,
        aspectRatio: options.aspectRatio,
        generatedAt: new Date().toISOString(),
      },
    }));
  }

  getProviderName(): string {
    return "mock";
  }
}
