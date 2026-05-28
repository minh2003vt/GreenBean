import { AlertTriangle } from "lucide-react";
import type { ApiProblem } from "@/lib/api";
import type { Problem, SolutionStep } from "@/types";

const fallbackImage =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=500&fit=crop";

export function mapProblem(problem: ApiProblem): Problem {
  return {
    id: problem.id,
    slug: problem.slug,
    label: problem.title,
    imageUrl: problem.thumbnailUrl ?? fallbackImage,
    icon: AlertTriangle,
    heroText: problem.description,
    solutions: problem.steps.map(mapStep),
  };
}

function mapStep(step: ApiProblem["steps"][number]): SolutionStep {
  const image = step.thumbnailUrl ?? step.media?.find((media) => media.mediaType === "IMAGE")?.url ?? fallbackImage;
  const video = step.media?.find((media) => media.mediaType === "VIDEO")?.url;
  const audio = step.media?.find((media) => media.mediaType === "AUDIO")?.url;
  const photos = step.media
    ?.filter((media) => media.mediaType === "IMAGE")
    .map((media) => ({ url: media.url, caption: media.title ?? undefined, description: media.description ?? undefined })) ?? [];

  return {
    id: step.id,
    title: step.title,
    description: step.description,
    imageUrl: image,
    media: video || audio || photos.length
      ? {
          videoUrl: video ?? audio ?? "",
          audioUrl: audio,
          photos,
        }
      : undefined,
  };
}
