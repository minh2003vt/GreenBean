import {
  Bug,
  Droplets,
  Leaf,
  Rows3,
  Sprout,
  Sun,
} from "lucide-react";
import { solutionMedia, stepPhotos } from "@/constants/media";
import type { Problem, SolutionStep } from "@/types";

/**
 * Add a new problem here — no new page file needed.
 * Each entry gets `/problems/:slug` automatically via ProblemDetailPage.
 * Media (video + step photos) lives in each solution's `media` field.
 */
export const PROBLEMS: Problem[] = [
  {
    id: "dry-soil",
    slug: "dry-soil",
    label: "Dry Soil",
    imageUrl:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop",
    icon: Sun,
    heroText: "Your soil may be losing water too quickly.",
    solutions: [
      {
        id: "add-mulch",
        title: "Add Mulch",
        description: "Cover soil with dry leaves, straw, or grass.",
        imageUrl:
          "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=200&h=140&fit=crop",
        media: solutionMedia("shortTip", [
          {
            url: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&h=600&fit=crop",
            caption: "Step 1: Collect dry leaves, straw, or grass clippings.",
          },
          {
            url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
            caption: "Step 2: Spread a thin layer around plants, not touching stems.",
          },
          {
            url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop",
            caption: "Step 3: Add more mulch after rain if the layer gets thin.",
          },
        ]),
      },
      {
        id: "shade-trees",
        title: "Plant Shade Trees",
        description: "Trees protect soil from sun and wind.",
        imageUrl:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=140&fit=crop",
        media: solutionMedia("fieldWalk", [
          {
            url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
            caption: "Step 1: Pick a spot on the north or west side of the field.",
          },
          {
            url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3858?w=800&h=600&fit=crop",
            caption: "Step 2: Plant young trees with enough space to grow.",
          },
          {
            url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
            caption: "Step 3: Water young trees until roots are strong.",
          },
        ]),
      },
      {
        id: "rainwater",
        title: "Collect Rainwater",
        description: "Store rainwater to use during dry days.",
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=140&fit=crop",
        media: solutionMedia("shortTip", [
          {
            url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
            caption: "Step 1: Place a barrel under a roof gutter or slope.",
          },
          {
            url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
            caption: "Step 2: Cover the barrel to keep mosquitoes out.",
          },
          {
            url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop",
            caption: "Step 3: Use stored water on dry days, early morning or evening.",
          },
        ]),
      },
    ],
  },
  {
    id: "pest-damage",
    slug: "pest-damage",
    label: "Pest Damage",
    imageUrl:
      "https://images.unsplash.com/photo-1592419044706-39796d4f6518?w=800&h=500&fit=crop",
    icon: Bug,
    heroText: "Pests can hurt your crops before you notice.",
    solutions: defaultSolutions("pest"),
  },
  {
    id: "flooded-field",
    slug: "flooded-field",
    label: "Flooded Field",
    imageUrl:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=500&fit=crop",
    icon: Droplets,
    heroText: "Too much water can drown roots and wash away nutrients.",
    solutions: defaultSolutions("flood"),
  },
  {
    id: "yellow-leaves",
    slug: "yellow-leaves",
    label: "Yellow Leaves",
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=500&fit=crop",
    icon: Leaf,
    heroText: "Yellow leaves often mean stress from water, food, or sun.",
    solutions: defaultSolutions("leaves"),
  },
  {
    id: "root-diseases",
    slug: "root-diseases",
    label: "Root diseases",
    imageUrl:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=500&fit=crop",
    icon: Sprout,
    heroText: "Sick roots spread through wet soil and crowded plants.",
    solutions: defaultSolutions("roots"),
  },
  {
    id: "monocropping",
    slug: "monocropping",
    label: "Monocropping",
    imageUrl:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3858?w=800&h=500&fit=crop",
    icon: Rows3,
    heroText: "Growing one crop year after year tires the soil.",
    solutions: defaultSolutions("crop"),
  },
];

/** @deprecated Use PROBLEMS */
export const PROBLEM_CATEGORIES = PROBLEMS;

export function getProblemBySlug(slug: string | undefined): Problem | undefined {
  if (!slug) return undefined;
  return PROBLEMS.find((p) => p.slug === slug);
}

function defaultSolutions(prefix: string): SolutionStep[] {
  const thumb =
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3858?w=200&h=140&fit=crop";
  const sharedPhotos = stepPhotos([
    {
      url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3858?w=800&h=600&fit=crop",
      caption: "Step 1: Walk the field and look for signs of trouble.",
    },
    {
      url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop",
      caption: "Step 2: Try one small change and watch for a few days.",
    },
    {
      url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
      caption: "Step 3: Ask a neighbor or worker if it does not improve.",
    },
  ]);

  return [
    {
      id: `${prefix}-step-1`,
      title: "Check the field",
      description: "Walk your plot and note where the problem is worst.",
      imageUrl: thumb,
      media: solutionMedia("shortTip", sharedPhotos),
    },
    {
      id: `${prefix}-step-2`,
      title: "Try a simple fix",
      description: "Start with one small change and watch for improvement.",
      imageUrl:
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=200&h=140&fit=crop",
      media: solutionMedia("fieldWalk", sharedPhotos),
    },
    {
      id: `${prefix}-step-3`,
      title: "Ask for help",
      description: "Talk to a neighbor or extension worker if it does not improve.",
      imageUrl:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=140&fit=crop",
      media: solutionMedia("shortTip", sharedPhotos),
    },
  ];
}
