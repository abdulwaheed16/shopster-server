import { AI_PROVIDERS } from "../../ai.constants";
import {
  ITextGenerator,
  TextPromptOptions,
} from "../../interfaces/text-generator.interface";

export class MockTextProvider implements ITextGenerator {
  async generate(options: TextPromptOptions): Promise<string> {
    console.log("[MockTextProvider] Generating mock text response");
    console.log("[MockTextProvider] Prompt:", options.prompt);

    // Return a simple mock response
    return `Mock text response for: ${options.prompt.substring(0, 50)}...`;
  }

  getProviderName(): string {
    return AI_PROVIDERS.MOCK;
  }
}
