import React from "react";

const PROVIDER_IMAGE_MAP = {
  openai: "gpt.png",
  anthropic: "cluade.jpeg",
  google: "google.webp",
  "google-open": "google.webp",
  meta: "meta.png",
  deepseek: "deepseek.png",
  qwen: "qwen1.png",
  falcon: "falcon.jpeg",
};

/**
 * Resolves the image path for a model or company object.
 * Returns provider-specific image if available, else all_models.png.
 */
export function getModelIconSrc(modelOrCompany) {
  const fallback = `${process.env.PUBLIC_URL}/images/all_models.png`;
  if (!modelOrCompany) return fallback;

  const key = (
    modelOrCompany.companyKey ||
    modelOrCompany.key ||
    ""
  ).toLowerCase();

  const companyName = (
    modelOrCompany.companyName ||
    modelOrCompany.name ||
    ""
  ).toLowerCase();

  const modelId = (modelOrCompany.id || "").toLowerCase();
  const modelName = (modelOrCompany.name || "").toLowerCase();

  let filename = PROVIDER_IMAGE_MAP[key];

  if (!filename) {
    if (
      key.includes("openai") ||
      companyName.includes("openai") ||
      modelId.includes("gpt") ||
      modelName.includes("gpt") ||
      modelId.includes("openai")
    ) {
      filename = "gpt.png";
    } else if (
      key.includes("anthropic") ||
      companyName.includes("anthropic") ||
      modelId.includes("claude") ||
      modelName.includes("claude")
    ) {
      filename = "cluade.jpeg";
    } else if (
      key.includes("google") ||
      companyName.includes("google") ||
      modelId.includes("gemini") ||
      modelName.includes("gemini") ||
      modelId.includes("gemma") ||
      modelName.includes("gemma")
    ) {
      filename = "google.webp";
    } else if (
      key.includes("meta") ||
      companyName.includes("meta") ||
      modelId.includes("llama") ||
      modelName.includes("llama")
    ) {
      filename = "meta.png";
    } else if (
      key.includes("deepseek") ||
      companyName.includes("deepseek") ||
      modelId.includes("deepseek") ||
      modelName.includes("deepseek")
    ) {
      filename = "deepseek.png";
    } else if (
      key.includes("qwen") ||
      companyName.includes("qwen") ||
      companyName.includes("alibaba") ||
      modelId.includes("qwen") ||
      modelName.includes("qwen")
    ) {
      filename = "qwen1.png";
    } else if (
      key.includes("falcon") ||
      companyName.includes("falcon") ||
      companyName.includes("tii") ||
      modelId.includes("falcon") ||
      modelName.includes("falcon")
    ) {
      filename = "falcon.jpeg";
    }
  }

  // Check companyImage property if present
  if (!filename && modelOrCompany.companyImage) {
    const raw = modelOrCompany.companyImage
      .replace(/^\.\/images\//, "")
      .replace(/^\/images\//, "");
    if (
      [
        "gpt.png",
        "cluade.jpeg",
        "google.webp",
        "meta.png",
        "deepseek.png",
        "qwen1.png",
        "falcon.jpeg",
      ].includes(raw)
    ) {
      filename = raw;
    }
  }

  if (!filename) {
    filename = "all_models.png";
  }

  return `${process.env.PUBLIC_URL}/images/${filename}`;
}

export default function ModelIcon({
  model,
  size = 48,
  className = "",
  style = {},
}) {
  const src = getModelIconSrc(model);
  const alt = model?.name || model?.companyName || "Model Icon";

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`model-icon ${className}`}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = `${process.env.PUBLIC_URL}/images/all_models.png`;
      }}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: "8px",
        flexShrink: 0,
        ...style,
      }}
      draggable="false"
    />
  );
}
