import type { SolutionPhoto } from "@/types";

/** Placeholder videos — swap with your own URLs when you add an admin UI */
export const SAMPLE_VIDEOS = {
  shortTip:
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  fieldWalk:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
} as const;

export function solutionMedia(
  videoKey: keyof typeof SAMPLE_VIDEOS,
  photos: SolutionPhoto[],
) {
  const videoUrl = SAMPLE_VIDEOS[videoKey];
  return {
    videoUrl,
    photos,
  };
}

/** Build step-by-step photo slides with optional captions */
export function stepPhotos(
  items: { url: string; caption: string }[],
): SolutionPhoto[] {
  return items.map((item, i) => ({
    url: item.url,
    caption: item.caption || `Step ${i + 1}`,
  }));
}
