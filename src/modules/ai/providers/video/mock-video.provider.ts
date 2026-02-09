import {
  IVideoGenerator,
  VideoGenerationResult,
  VideoPromptOptions,
} from "../../interfaces/video-generator.interface";

export class MockVideoProvider implements IVideoGenerator {
  async generate(options: VideoPromptOptions): Promise<VideoGenerationResult> {
    console.log(
      "[MockVideoProvider] Generating mock video for:",
      options.prompt,
    );

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      videoUrl:
        "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
      metadata: {
        provider: "mock",
        prompt: options.prompt,
        videoType: options.videoType,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  getProviderName(): string {
    return "mock";
  }
}
