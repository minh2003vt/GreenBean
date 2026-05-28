import type { RewardsPageData } from "@/types";

/**
 * Edit this object to change the Rewards page — no new page file needed.
 * Swap challenge image, dates, progress, and copy when you add an admin UI.
 */
export const REWARDS_DATA: RewardsPageData = {
  challenge: {
    id: "soil-erosion-may",
    posterLabel: "This Month's Challenge",
    title: "Keep Soil from Washing Away",
    imageUrl:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    daysRemaining: 18,
    endDateLabel: "Ends on 25 May 2026",
    flowSteps: [
      { id: "try", label: "Try it" },
      { id: "show", label: "Show progress" },
      { id: "earn", label: "Earn cash reward" },
    ],
    ideasDetail:
      "Heavy rain can wash away topsoil and nutrients. This month, try simple practices that hold soil in place and keep moisture for your crops.",
    ideasBullets: [
      "Plant cover crops or grass strips along slopes.",
      "Build small barriers or terraces to slow water flow.",
      "Add mulch after planting to protect bare soil.",
      "Take photos of your field before and after you try a fix.",
    ],
  },
  reward: {
    id: "cash-reward",
    title: "Cash Reward",
    description:
      "Top farmers who complete the challenge will receive a cash reward.",
  },
  progress: {
    percent: 60,
    completedSteps: 3,
    totalSteps: 5,
    steps: [
      { id: "learn", label: "Learn", status: "done" },
      { id: "try", label: "Try", status: "done" },
      { id: "picture", label: "Take Picture", status: "done" },
      { id: "review", label: "Review", status: "current" },
      { id: "reward", label: "Reward", status: "pending" },
    ],
  },
};
