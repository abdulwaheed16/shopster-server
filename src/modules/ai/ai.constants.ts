export const AI_PROVIDERS = {
  FAL_AI: "fal-ai",
  OPENAI: "openai",
  GEMINI: "gemini",
} as const;

export const AI_BASE_URLS = {
  FAL_AI: "https://fal.run",
  OPENAI: "https://api.openai.com/v1",
  GEMINI: "https://generativelanguage.googleapis.com/v1beta/models",
} as const;

export const IMAGE_MODELS = {
  FAL_AI_FAST_SDXL: "fal-ai/fast-sdxl",
  FAL_AI_FAST_TURBO_DIFFUSION: "fal-ai/fast-turbo-diffusion",
  FAL_AI_NANO_BANANA_PRO_EDIT: "fal-ai/nano-banana-pro/edit",
};

export const TEXT_MODELS = {
  GPT_4_TURBO: "gpt-4-turbo-preview",
  GEMINI_1_5_FLASH: "gemini-1.5-flash",
  GEMINI_1_5_FLASH_LATEST: "gemini-1.5-flash-latest",
  GEMINI_2_5_FLASH: "gemini-2.5-flash",
  GEMINI_FLASH_THINKING: "gemini-3-flash-preview",
} as const;

export const ASPECT_RATIOS = {
  SQUARE: "1:1",
  PORTRAIT: "4:5",
  STORY: "9:16",
  LANDSCAPE: "16:9",
} as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[keyof typeof ASPECT_RATIOS];

export const STYLE_PRESETS = {
  PROFESSIONAL: "professional",
  LUXURY: "luxury",
  BOLD: "bold",
  MINIMAL: "minimal",
} as const;

export type StylePreset = (typeof STYLE_PRESETS)[keyof typeof STYLE_PRESETS];
