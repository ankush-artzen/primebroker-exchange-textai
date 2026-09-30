export const fieldErrorBorder =
  "border-red-500 focus:border-red-500 focus:ring-red-100";

export const fieldErrorText = "mt-1 text-[12px] text-red-600";

export const formErrorBanner =
  "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700";

export function scrollToFirstFieldError() {
  requestAnimationFrame(() => {
    document
      .querySelector('[data-field-error="true"]')
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function formatMissingFieldsSummary(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return `Please fill in: ${labels[0]}`;
  return `Please fill in: ${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}
