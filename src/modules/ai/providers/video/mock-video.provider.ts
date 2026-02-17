import {
  IVideoGenerator,
  VideoGenerationResult,
  VideoPromptOptions,
} from "../../interfaces/video-generator.interface";

export class MockVideoProvider implements IVideoGenerator {
  async generate(options: VideoPromptOptions): Promise<VideoGenerationResult> {
    const scenes = options.scenes || [];
    console.log(
      `[MockVideoProvider] Generating mock video for: ${options.adId || "unknown"}`,
      `Scenes count: ${scenes.length}`,
    );

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      videoUrl:
        "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
      metadata: {
        provider: "mock",
        scenesCount: scenes.length,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  getProviderName(): string {
    return "mock";
  }
}
