import { v2 as cloudinary } from "cloudinary";
import { config } from "./env.config";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export { cloudinary };

// Cloudinary upload options
export const cloudinaryOptions = {
  ads: {
    folder: "shopster/ads",
    resource_type: "image" as const,
    allowed_formats: ["jpg", "png", "webp", "jpeg"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
  products: {
    folder: "shopster/products",
    resource_type: "image" as const,
    allowed_formats: ["jpg", "png", "webp", "jpeg"],
  },
  templates: {
    folder: "shopster/templates",
    resource_type: "image" as const,
    allowed_formats: ["jpg", "png", "webp", "jpeg"],
  },
} as const;
