/**
 * AI Module Prompts
 * Centralized prompts and schemas for AI generation workflows.
 */

export const AD_VISION_PROMPTS = {
  ANALYZER_ROLE: "Senior Computer Vision Analyst & Metadata Specialist",
  ANALYZER_TASK:
    "Perform a comprehensive technical analysis of the provided image. Extract visual data and map it to the following schema.",
  ANALYZER_FORMAT:
    "strictly YAML. Do not include conversational text or markdown code blocks (```yaml), just the raw YAML data.",
  ANALYZER_SCHEMA: `
image_type: # e.g., photograph, illustration, 3D render
genre: # e.g., fashion lifestyle, landscape, portrait
composition:
  framing: # e.g., full-body, close-up, wide shot
  aspect_ratio: # e.g., landscape, portrait, square
  subject_position: # e.g., rule of thirds, centered
  pose: # Detailed description of body language
  camera_angle: # e.g., eye-level, low-angle, high-angle
  visual_balance: # e.g., symmetrical, asymmetrical
  depth: # e.g., shallow depth of field, deep focus
subject:
  count: # integer
  type: # e.g., human, animal, object
  gender_presentation:
  age_range:
  expression:
  gaze: # Where are they looking?
  emotion:
  hair:
    color:
    length:
    style:
  accessories: # List key items like eyewear, jewelry, hats
wardrobe:
  top:
    type:
    color:
    material:
    fit:
  bottom:
    type:
    color:
    material:
    length:
  footwear:
    type:
    color:
    style:
color_palette:
  dominant_colors: [] # List top 3 hex codes or color names
  accent_colors: [] # List secondary colors
  overall_tone: # e.g., warm, cool, muted, vibrant
lighting:
  type: # e.g., natural, studio, neon
  direction: # e.g., backlit, frontal, side-lit
  contrast: # e.g., high, low
  shadows: # Description of shadow hardness and placement
  highlights:
background:
  setting:
  wall: # Texture, material, and color details
  floor: # Texture, material, and color details
stylistic_attributes:
  aesthetic: # e.g., minimalist, cyberpunk, vintage
  mood:
  trend_alignment:
  editorial_quality: # e.g., high-end, user-generated, stock
technical_details:
  focus:
  lens_look: # e.g., wide-angle, telephoto, fish-eye
  grain:
  sharpness:
  dynamic_range:
  white_balance:
post_processing:
  color_grading:
  contrast_adjustment:
  clarity:
  retouching:
use_cases: [] # List 3-5 potential commercial or creative uses
overall_style_summary: # A concise paragraph synthesizing the visual elements
`.trim(),
};

export const AD_PROMPT_ENGINEERING = {
  SYSTEM_MESSAGE: `
Default Behavior:
If user instructions lack detail, use: "Place this (product) on a clean, solid neutral background with soft studio lighting."

Visual Standards (Neat & Clean):
Background: Solid, plain, or minimalist studio backgrounds only. No clutter.
Lighting: Softbox lighting, high-key lighting, or balanced studio shadows.
Quality: Sharp focus, 8k resolution, professional commercial photography style.
Framing: Centered, balanced, and intentional. No "amateur" or "uneven" angles.
Skin/Characters: If a person is included, they must look professional and well-groomed with clear skin and a high-end commercial look.

Text Preservation:
All visible product text must be accurate (logos, slogans, and packaging). Do not invent new labels or claims.

Camera Parameters:
Include these descriptors: professional studio photography, commercial product shot, sharp focus, 100mm macro lens, high-end retouching, clean minimalist aesthetic, soft shadows.

Output Requirements:
Generate instructions in exact YAML format. Default to a vertical aspect ratio.

JSON Structure:
{
  "scenes": [
    {
      "image_prompt": "REPLACE WITH CLEAN STUDIO PROMPT",
      "aspect_ratio_image": "2:3"
    }
  ]
}
`.trim(),

  CONSTRUCT_USER_PROMPT: (userInstructions: string, visionAnalysis: string) =>
    `
Primary Objective: Create 1 image prompt following system guidelines
Accuracy Requirements:
- Depict reference image as accurately as possible
- Ensure all text elements are reproduced precisely
- Maintain visual fidelity to original

Input Sources:
- User Instructions: ${userInstructions}
- Reference Image Analysis: ${visionAnalysis}

Process Steps:
1. Analyze user's prompt requirements
2. Review reference image analysis thoroughly
3. Determine appropriate aspect ratio
4. Generate a single, comprehensive image generation prompt.

Output Format: Return valid JSON with "scenes" array as shown in system message.
`.trim(),
};
