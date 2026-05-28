const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "USER" | "ADMIN";
  isBlocked?: boolean;
  blockReason?: string | null;
  blockedUntil?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  stats?: {
    completedChallenges: number;
    orders: number;
    rewards: number;
  };
};

export type ApiProblem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  sortOrder: number;
  steps: ApiStep[];
};

export type ApiStep = {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  media?: ApiStepMedia[];
};

export type ApiStepMedia = {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "AUDIO";
  url: string;
  title?: string | null;
  description?: string | null;
  durationSec?: number | null;
  sortOrder: number;
};

export type ApiProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  suggestedPrice: string | number;
  listingPrice?: string | number | null;
  adminPrice?: string | number | null;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
  isActive?: boolean;
  approvedAt?: string | null;
  submittedBy?: { id: string; name: string; avatarUrl?: string | null };
};

export type ApiCartItem = {
  id: string;
  quantity: number;
  product: ApiProduct;
};

export type ApiChallenge = {
  id: string;
  title: string;
  detail: string;
  thumbnailUrl?: string | null;
  status: "DRAFT" | "ACTIVE" | "ENDED";
  startDate: string;
  endDate: string;
  _count?: { userChallenges: number };
};

export type ApiUserChallenge = {
  id: string;
  challengeId: string;
  progressStatus: "JOINED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  progressPct: number;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote?: string | null;
  isWinner?: boolean;
  pictures: Array<{
    id: string;
    url: string;
    caption?: string | null;
    kind: "BEFORE" | "AFTER" | "PROGRESS";
    aiReview?: string | null;
  }>;
  challenge: ApiChallenge;
};

export type ApiOrder = {
  id: string;
  status: string;
  totalAmount: string | number;
  note?: string | null;
  createdAt: string;
  _count?: { items: number };
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: string | number;
    subtotal: string | number;
    product: ApiProduct;
  }>;
};

export type ApiVideo = {
  id: string;
  title: string;
  stepTitle: string;
  problemTitle: string;
  problemSlug: string;
  url: string;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
};

type ApiPage<T> = { items: T[]; meta: { page: number; limit: number; total: number } };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  register: (body: { name: string; email: string; phone?: string; password: string }) =>
    request<{ user: ApiUser; token: string }>("/api/users/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (email: string, password: string) =>
    request<{ user: ApiUser; token: string }>("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ message: string }>("/api/users/logout", { method: "POST" }),
  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/users/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    request<{ message: string }>("/api/users/reset-password", { method: "POST", body: JSON.stringify({ email, otp, newPassword }) }),
  me: () => request<ApiUser>("/api/users/me"),
  updateMe: (body: { name?: string; phone?: string; avatarUrl?: string | null }) =>
    request<ApiUser>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  changePassword: (body: { oldPassword?: string; otp?: string; newPassword: string }) =>
    request<{ message: string }>("/api/users/password", { method: "PATCH", body: JSON.stringify(body) }),
  requestPasswordChangeOtp: () => request<{ message: string }>("/api/users/password/change-otp", { method: "POST" }),
  uploadFile: (file: string, folder = "greenbean") =>
    request<{ url: string; publicId: string; resourceType: string }>("/api/uploads", { method: "POST", body: JSON.stringify({ file, folder }) }),
  uploadChallengePicture: (file: string, folder = "greenbean/challenges") =>
    request<{ url: string; publicId: string; resourceType: string; aiPassed: true }>("/api/uploads/challenge-picture", {
      method: "POST",
      body: JSON.stringify({ file, folder }),
    }),
  problems: () => request<ApiProblem[]>("/api/problems"),
  problem: (slug: string) => request<ApiProblem>(`/api/problems/${slug}`),
  products: (search = "") => request<ApiPage<ApiProduct>>(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  myProducts: () => request<ApiPage<ApiProduct>>("/api/products?mine=true"),
  cart: () => request<ApiCartItem[]>("/api/cart"),
  addCart: (productId: string, quantity: number) =>
    request<ApiCartItem>("/api/cart", { method: "POST", body: JSON.stringify({ productId, quantity }) }),
  updateCart: (id: string, quantity: number) =>
    request<ApiCartItem>(`/api/cart/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),
  deleteCart: (id: string) => request<void>(`/api/cart/${id}`, { method: "DELETE" }),
  checkout: () => request<ApiOrder>("/api/orders", { method: "POST", body: JSON.stringify({ fromCart: true }) }),
  createPayPalOrder: () => request<{ id: string }>("/api/orders/paypal/create", { method: "POST" }),
  capturePayPalOrder: (paypalOrderId: string) =>
    request<{ order: ApiOrder; paypal: { id: string; status: string } }>("/api/orders/paypal/capture", {
      method: "POST",
      body: JSON.stringify({ paypalOrderId }),
    }),
  orders: () => request<ApiPage<ApiOrder>>("/api/orders"),
  order: (id: string) => request<ApiOrder>(`/api/orders/${id}`),
  submitProduct: (product: {
    name: string;
    description: string;
    category: string;
    unit: string;
    quantity: number;
    suggestedPrice: number;
    thumbnailUrl?: string;
    imageUrls?: string[];
  }) => request<ApiProduct>("/api/products", { method: "POST", body: JSON.stringify(product) }),
  updateProduct: (id: string, product: Partial<{
    name: string;
    description: string;
    category: string;
    unit: string;
    quantity: number;
    suggestedPrice: number;
    thumbnailUrl: string;
    imageUrls: string[];
  }>) => request<ApiProduct>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(product) }),
  currentChallenge: () => request<ApiChallenge | null>("/api/challenges/current"),
  myChallenges: () => request<ApiUserChallenge[]>("/api/user-challenges"),
  joinChallenge: (challengeId: string) =>
    request<ApiUserChallenge>("/api/user-challenges", { method: "POST", body: JSON.stringify({ challengeId }) }),
  updateUserChallenge: (
    id: string,
    body: {
      progressStatus?: "JOINED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
      progressPct?: number;
      note?: string;
      pictures?: Array<{ url: string; caption?: string; kind: "BEFORE" | "AFTER" | "PROGRESS"; takenAt?: string }>;
    },
  ) => request<ApiUserChallenge>(`/api/user-challenges/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  challenges: () => request<ApiPage<ApiChallenge>>("/api/challenges"),
  submissions: (status?: "PENDING" | "APPROVED" | "REJECTED") =>
    request<ApiPage<ApiProduct>>(`/api/products/submissions${status ? `?status=${status}` : ""}`),
  users: () => request<ApiUser[]>("/api/users"),
  adminProblems: () => request<ApiProblem[]>("/api/problems"),
  approveProduct: (id: string, body: { approvalStatus: "PENDING" | "APPROVED" | "REJECTED"; adminNote?: string; isActive?: boolean }) =>
    request<ApiProduct>(`/api/products/${id}/approval`, { method: "PATCH", body: JSON.stringify(body) }),
  listProduct: (id: string, body: { listingPrice: number; isActive?: boolean }) =>
    request<ApiProduct>(`/api/products/${id}/listing`, { method: "PATCH", body: JSON.stringify(body) }),
  createProblem: (body: { title: string; description: string; thumbnailUrl?: string; sortOrder?: number }) =>
    request<ApiProblem>("/api/problems", { method: "POST", body: JSON.stringify(body) }),
  createChallenge: (body: { title: string; detail: string; status: "DRAFT" | "ACTIVE" | "ENDED"; startDate: string; endDate: string; thumbnailUrl?: string }) =>
    request<ApiChallenge>("/api/challenges", { method: "POST", body: JSON.stringify(body) }),
  updateChallenge: (id: string, body: Partial<{ title: string; detail: string; status: "DRAFT" | "ACTIVE" | "ENDED"; startDate: string; endDate: string; thumbnailUrl: string | null }>) =>
    request<ApiChallenge>(`/api/challenges/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteChallenge: (id: string) => request<void>(`/api/challenges/${id}`, { method: "DELETE" }),
  participants: (challengeId: string) => request<unknown[]>(`/api/challenges/${challengeId}/participants`),
  reviewParticipant: (challengeId: string, userChallengeId: string, body: { reviewStatus?: "PENDING" | "APPROVED" | "REJECTED"; reviewNote?: string; isWinner?: boolean; rewardPaid?: boolean }) =>
    request<unknown>(`/api/challenges/${challengeId}/participants/${userChallengeId}/review`, { method: "PATCH", body: JSON.stringify(body) }),
  blockUser: (id: string, body: { isBlocked: boolean; blockReason?: string; blockedUntil?: string | null }) =>
    request<ApiUser>(`/api/users/${id}/block`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProblem: (id: string) => request<void>(`/api/problems/${id}`, { method: "DELETE" }),
  addStep: (problemId: string, body: { stepNumber: number; title: string; description: string; thumbnailUrl?: string }) =>
    request<unknown>(`/api/problems/${problemId}/steps`, { method: "POST", body: JSON.stringify(body) }),
  updateStep: (problemId: string, stepId: string, body: { stepNumber?: number; title?: string; description?: string; thumbnailUrl?: string }) =>
    request<unknown>(`/api/problems/${problemId}/steps/${stepId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteStep: (problemId: string, stepId: string) =>
    request<void>(`/api/problems/${problemId}/steps/${stepId}`, { method: "DELETE" }),
  addStepMedia: (problemId: string, stepId: string, body: { mediaType: "IMAGE" | "VIDEO" | "AUDIO"; url: string; title?: string; description?: string; sortOrder?: number }) =>
    request<unknown>(`/api/problems/${problemId}/steps/${stepId}/media`, { method: "POST", body: JSON.stringify(body) }),
  updateStepMedia: (problemId: string, stepId: string, mediaId: string, body: { mediaType?: "IMAGE" | "VIDEO" | "AUDIO"; url?: string; title?: string; description?: string; sortOrder?: number }) =>
    request<unknown>(`/api/problems/${problemId}/steps/${stepId}/media/${mediaId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteStepMedia: (problemId: string, stepId: string, mediaId: string) =>
    request<void>(`/api/problems/${problemId}/steps/${stepId}/media/${mediaId}`, { method: "DELETE" }),
  videos: async () => {
    const problems = await request<ApiProblem[]>("/api/problems");
    const details = await Promise.all(problems.map((problem) => request<ApiProblem>(`/api/problems/${problem.slug}`)));
    return details.flatMap((problem) =>
      problem.steps.flatMap((step) =>
        (step.media ?? [])
          .filter((media) => media.mediaType === "VIDEO")
          .map((media) => ({
            id: media.id,
            title: media.title ?? step.title,
            stepTitle: step.title,
            problemTitle: problem.title,
            problemSlug: problem.slug,
            url: media.url,
            thumbnailUrl: step.thumbnailUrl ?? problem.thumbnailUrl,
            durationSec: media.durationSec,
          })),
      ),
    ) satisfies ApiVideo[];
  },
};
