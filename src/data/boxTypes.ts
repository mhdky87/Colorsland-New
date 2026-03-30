export const BOX_TYPES = [
  "Jumbo Box",
  "Big Box",
  "Zim Box",
  "Standard Box",
] as const;

export type BoxType = (typeof BOX_TYPES)[number];