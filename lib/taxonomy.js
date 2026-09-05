/**
 * Enums and label maps, split out of lib/data.js on purpose.
 *
 * Client components (ProjectRail's filter, the inquiry form) need the labels
 * but must NOT drag the whole content layer — every project body, every blog
 * post — into the browser bundle. Importing from here instead of from
 * lib/data.js is what keeps that boundary honest, because a single named
 * import from a module still ships the module.
 *
 * lib/data.js re-exports these, so server components can keep one import.
 */

/** Mirrors the (migrated) Project.serviceTypes enum, in display order. */
export const SERVICE_TYPES = [
  "web-development",
  "custom-software",
  "mobile-applications",
  "product-design",
  "graphics-design",
  "architectural-visualization",
  "digital-marketing",
];

/** slug → short label, for tags, filter rails and case-study meta rows. */
export const SERVICE_LABELS = {
  "web-development": "Web Development",
  "custom-software": "Custom Software",
  "mobile-applications": "Mobile Apps",
  "product-design": "Product Design",
  "graphics-design": "Graphics",
  "architectural-visualization": "3D Visualization",
  "digital-marketing": "Digital Marketing",
};

/**
 * Representative artwork per service. Presentation-only, so it is NOT part of
 * the Service model — Service.icon holds a lucide key, not a file path.
 */
export const SERVICE_MEDIA = {
  "web-development": "/websites/paarel-website.png",
  "custom-software": "/websites/innoel-website.png",
  "mobile-applications": "/websites/torgeson-website.png",
  "product-design": "/websites/the-foxes-website.png",
  "graphics-design": "/graphics/all-graphics-work.jpg",
  "architectural-visualization": "/2d-3d/all-2d-3d-work.jpg",
  "digital-marketing": "/digital/all-digital-marketing.jpg",
};
