export type GalleryCover = { src: string; width: number; height: number; alt: string };

/** Serializable view of a featured project, built on the server for the Selected Work gallery. */
export type GalleryItem = {
  slug: string;
  href: string;
  title: string;
  category: string;
  year: string;
  role: string;
  cover: GalleryCover;
};
