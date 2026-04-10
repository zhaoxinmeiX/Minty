export const BASE_FONT_SIZE = 14;

export const Typography = {
  base: BASE_FONT_SIZE,
  size: {
    micro: BASE_FONT_SIZE - 5,
    tiny: BASE_FONT_SIZE - 4,
    footnote: BASE_FONT_SIZE - 3,
    caption: BASE_FONT_SIZE - 2,
    label: BASE_FONT_SIZE - 1,
    body: BASE_FONT_SIZE,
    bodyLg: BASE_FONT_SIZE + 1,
    title: BASE_FONT_SIZE + 4,
    titleLg: BASE_FONT_SIZE + 4,
    headline: BASE_FONT_SIZE + 6,
    display: BASE_FONT_SIZE + 10,
  },
  lineHeight: {
    micro: 14,
    tiny: 14,
    footnote: 16,
    caption: 18,
    label: 18,
    body: 20,
    bodyLg: 22,
    title: 22,
    titleLg: 24,
    headline: 28,
    display: 32,
  },
} as const;
