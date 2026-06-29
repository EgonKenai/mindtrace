export const CONSENT_VERSIONS = {
  privacy: "2026-06-22-v1",
  productBoundary: "2026-06-22-v1",
  aiProcessing: "2026-06-25-v2",
} as const;

export const CURRENT_PRODUCT_CONSENT_ID = "2026-06-22-v1";
export const CURRENT_AI_PROCESSING_CONSENT_ID = `ai-processing-${CONSENT_VERSIONS.aiProcessing}`;
