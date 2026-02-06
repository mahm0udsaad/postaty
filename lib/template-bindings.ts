/**
 * Template binding resolution — maps layer binding names to form values.
 * The renderer is category-agnostic; each category form writes to these
 * normalized keys.
 */

export interface TemplateFormValues {
  headline: string;
  productName: string;
  price: string;
  cta: string;
  logo: string | null; // base64
  productImage: string | null; // base64
}

export const EMPTY_FORM_VALUES: TemplateFormValues = {
  headline: "",
  productName: "",
  price: "",
  cta: "",
  logo: null,
  productImage: null,
};

/** Resolve a text binding to a form value, or undefined to fall back to layer default. */
export function resolveTextBinding(
  binding: string | undefined,
  values: TemplateFormValues
): string | undefined {
  if (!binding) return undefined;
  switch (binding) {
    case "headline":
      return values.headline || undefined;
    case "productName":
      return values.productName || undefined;
    case "price":
      return values.price || undefined;
    case "cta":
      return values.cta || undefined;
    default:
      return undefined;
  }
}

/** Resolve an image binding to a base64 string, or null for placeholder. */
export function resolveImageBinding(
  binding: string | undefined,
  values: TemplateFormValues
): string | null {
  if (!binding) return null;
  switch (binding) {
    case "productImage":
      return values.productImage;
    case "logo":
      return values.logo;
    default:
      return null;
  }
}
