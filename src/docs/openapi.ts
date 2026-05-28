export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "GreenBean API",
    version: "0.1.0",
    description: "Backend API for GreenBean auth, problems, market, orders, challenges, uploads.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Problems" },
    { name: "Products" },
    { name: "Cart" },
    { name: "Orders" },
    { name: "Challenges" },
    { name: "UserChallenges" },
    { name: "Uploads" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      cookieAuth: { type: "apiKey", in: "cookie", name: "accessToken" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      RegisterInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Nguyen Van A" },
          email: { type: "string", format: "email", example: "farmer@example.com" },
          phone: { type: "string", example: "0912345678" },
          password: { type: "string", example: "GreenBean@123" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@greenbean.local" },
          password: { type: "string", example: "GreenBean@123" },
        },
      },
      ProductInput: {
        type: "object",
        required: ["name", "description", "category", "unit", "quantity", "suggestedPrice"],
        properties: {
          name: { type: "string", example: "Ca phe nhan xanh" },
          description: { type: "string", example: "Ca phe nhan xanh phoi tu nhien." },
          category: { type: "string", example: "coffee" },
          unit: { type: "string", example: "kg" },
          quantity: { type: "integer", example: 100 },
          suggestedPrice: { type: "number", example: 65000 },
          thumbnailUrl: { type: "string", format: "uri" },
        },
      },
      ChallengeInput: {
        type: "object",
        required: ["title", "detail", "rewardLabel", "rewardAmount", "startDate", "endDate"],
        properties: {
          title: { type: "string", example: "Cham soc vuon sach 7 ngay" },
          detail: { type: "string", example: "Upload before/after photos." },
          thumbnailUrl: { type: "string", format: "uri" },
          rewardLabel: { type: "string", example: "Diem thuong" },
          rewardAmount: { type: "number", example: 100 },
          status: { type: "string", enum: ["DRAFT", "ACTIVE", "ENDED"], example: "ACTIVE" },
          startDate: { type: "string", format: "date", example: "2026-05-01" },
          endDate: { type: "string", format: "date", example: "2026-06-30" },
        },
      },
      StepMediaInput: {
        type: "object",
        required: ["mediaType", "url"],
        properties: {
          mediaType: { type: "string", enum: ["IMAGE", "VIDEO", "AUDIO"], example: "IMAGE" },
          url: { type: "string", format: "uri" },
          title: { type: "string" },
          description: { type: "string" },
          durationSec: { type: "integer" },
          sortOrder: { type: "integer", example: 0 },
        },
      },
      StepInput: {
        type: "object",
        required: ["stepNumber", "title", "description"],
        properties: {
          stepNumber: { type: "integer", minimum: 1, maximum: 5, example: 1 },
          title: { type: "string", example: "Add Mulch" },
          description: { type: "string", example: "Cover soil with dry leaves, straw, or grass." },
          thumbnailUrl: { type: "string", format: "uri" },
          media: { type: "array", items: { $ref: "#/components/schemas/StepMediaInput" } },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/users/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user and set auth cookie",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } } },
        responses: { "201": { description: "Registered" } },
      },
    },
    "/api/users/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and set auth cookie",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } } },
        responses: { "200": { description: "Logged in" }, "401": { description: "Invalid credentials" } },
      },
    },
    "/api/users/logout": {
      post: { tags: ["Auth"], summary: "Logout", responses: { "200": { description: "Logged out" } } },
    },
    "/api/users/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Send reset password OTP",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } } } },
        },
        responses: { "200": { description: "OTP sent if email exists" } },
      },
    },
    "/api/users/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp", "newPassword"],
                properties: {
                  email: { type: "string", format: "email" },
                  otp: { type: "string", example: "123456" },
                  newPassword: { type: "string", example: "NewPass@123" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Password reset" } },
      },
    },
    "/api/users/me": {
      get: { tags: ["Users"], summary: "Current profile", security: [{ bearerAuth: [] }, { cookieAuth: [] }], responses: { "200": { description: "Profile" } } },
      patch: {
        tags: ["Users"],
        summary: "Update current profile",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  avatarUrl: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated profile" } },
      },
    },
    "/api/users/password/change-otp": {
      post: { tags: ["Auth"], summary: "Send password change OTP", security: [{ bearerAuth: [] }, { cookieAuth: [] }], responses: { "200": { description: "OTP sent" } } },
    },
    "/api/users/password": {
      patch: {
        tags: ["Auth"],
        summary: "Change password with old password or OTP",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["newPassword"],
                properties: {
                  oldPassword: { type: "string" },
                  otp: { type: "string" },
                  newPassword: { type: "string", example: "NewPass@123" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Password changed" } },
      },
    },
    "/api/problems": {
      get: { tags: ["Problems"], summary: "List problems without step media; use detail endpoint for media", responses: { "200": { description: "Problems" } } },
      post: {
        tags: ["Problems"],
        summary: "Create problem (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description"],
                properties: {
                  title: { type: "string", example: "Dry Soil" },
                  slug: { type: "string", description: "Optional URL-safe name. If omitted, backend creates it from title.", example: "dry-soil" },
                  description: { type: "string", example: "How to recover dry soil." },
                  thumbnailUrl: { type: "string", format: "uri" },
                  sortOrder: { type: "integer" },
                  steps: { type: "array", maxItems: 5, items: { $ref: "#/components/schemas/StepInput" } },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/problems/{slug}": {
      get: {
        tags: ["Problems"],
        summary: "Problem detail by slug",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Problem detail" } },
      },
    },
    "/api/problems/by-id/{id}": {
      get: {
        tags: ["Problems"],
        summary: "Problem detail by id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Problem detail" } },
      },
    },
    "/api/problems/{id}": {
      patch: {
        tags: ["Problems"],
        summary: "Update problem (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  slug: { type: "string" },
                  description: { type: "string" },
                  thumbnailUrl: { type: "string", format: "uri" },
                  sortOrder: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Problems"],
        summary: "Delete problem (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/problems/{id}/steps": {
      post: {
        tags: ["Problems"],
        summary: "Add step to problem (admin, max 5 steps)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/StepInput" } } } },
        responses: { "201": { description: "Step created" } },
      },
    },
    "/api/problems/{problemId}/steps/{stepId}": {
      patch: {
        tags: ["Problems"],
        summary: "Update step and optionally replace all media (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "problemId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "stepId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/StepInput" } } } },
        responses: { "200": { description: "Step updated" } },
      },
      delete: {
        tags: ["Problems"],
        summary: "Delete step (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "problemId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "stepId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { "204": { description: "Step deleted" } },
      },
    },
    "/api/problems/{problemId}/steps/{stepId}/media": {
      post: {
        tags: ["Problems"],
        summary: "Add step media: IMAGE step-picture, VIDEO watch, AUDIO listen (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "problemId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "stepId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/StepMediaInput" } } } },
        responses: { "201": { description: "Media created" } },
      },
    },
    "/api/problems/{problemId}/steps/{stepId}/media/{mediaId}": {
      patch: {
        tags: ["Problems"],
        summary: "Update step media (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "problemId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "stepId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/StepMediaInput" } } } },
        responses: { "200": { description: "Media updated" } },
      },
      delete: {
        tags: ["Problems"],
        summary: "Delete step media (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "problemId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "stepId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { "204": { description: "Media deleted" } },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List listed products; admins can filter submissions",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Products" } },
      },
      post: {
        tags: ["Products"],
        summary: "Submit product for approval",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } } },
        responses: { "201": { description: "Submitted" } },
      },
    },
    "/api/products/{id}": {
      patch: {
        tags: ["Products"],
        summary: "Update product (owner or admin). Owner update resets approved product to pending.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } } },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete product (owner or admin). Fails if product has been purchased.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "204": { description: "Deleted" }, "400": { description: "Already purchased" } },
      },
    },
    "/api/products/{id}/approval": {
      patch: {
        tags: ["Products"],
        summary: "Approve or reject product (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["approvalStatus"],
                properties: {
                  approvalStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                  adminNote: { type: "string" },
                  adminPrice: { type: "number" },
                  listingPrice: { type: "number" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
    },
    "/api/cart": {
      get: { tags: ["Cart"], summary: "Get cart", security: [{ bearerAuth: [] }, { cookieAuth: [] }], responses: { "200": { description: "Cart items" } } },
      post: {
        tags: ["Cart"],
        summary: "Add to cart",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["productId", "quantity"], properties: { productId: { type: "string", format: "uuid" }, quantity: { type: "integer", example: 1 } } } } },
        },
        responses: { "201": { description: "Added" } },
      },
    },
    "/api/cart/{id}": {
      patch: {
        tags: ["Cart"],
        summary: "Update cart quantity",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["quantity"], properties: { quantity: { type: "integer", example: 2 } } } } } },
        responses: { "200": { description: "Cart item updated" } },
      },
      delete: {
        tags: ["Cart"],
        summary: "Remove item from cart",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "204": { description: "Removed" } },
      },
    },
    "/api/orders": {
      get: { tags: ["Orders"], summary: "Order history summary without item details", security: [{ bearerAuth: [] }, { cookieAuth: [] }], responses: { "200": { description: "Orders" } } },
      post: {
        tags: ["Orders"],
        summary: "Checkout order",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fromCart: { type: "boolean", example: true },
                  note: { type: "string" },
                  items: {
                    type: "array",
                    items: { type: "object", required: ["productId", "quantity"], properties: { productId: { type: "string", format: "uuid" }, quantity: { type: "integer" } } },
                  },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Order created" } },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Order detail with all purchased products",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Order detail" }, "404": { description: "Order not found" } },
      },
    },
    "/api/challenges": {
      get: { tags: ["Challenges"], summary: "List challenges", responses: { "200": { description: "Challenges" } } },
      post: {
        tags: ["Challenges"],
        summary: "Create challenge (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ChallengeInput" } } } },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/challenges/current": {
      get: {
        tags: ["Challenges"],
        summary: "Get current active challenge for this month/date window",
        responses: { "200": { description: "Current challenge or null" } },
      },
    },
    "/api/challenges/{id}": {
      patch: {
        tags: ["Challenges"],
        summary: "Update challenge (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/ChallengeInput" } } } },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Challenges"],
        summary: "Delete challenge (admin)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/challenges/{id}/participants": {
      get: {
        tags: ["Challenges"],
        summary: "Admin: list users joined this challenge, including before/after pictures and AI review",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Participants" } },
      },
    },
    "/api/challenges/{id}/participants/{userChallengeId}/review": {
      patch: {
        tags: ["Challenges"],
        summary: "Admin: approve/reject, choose winner, mark reward paid. Choosing winner sends email.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "userChallengeId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reviewStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                  reviewNote: { type: "string" },
                  isWinner: { type: "boolean" },
                  rewardPaid: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Review updated" } },
      },
    },
    "/api/user-challenges": {
      get: { tags: ["UserChallenges"], summary: "My challenges", security: [{ bearerAuth: [] }, { cookieAuth: [] }], responses: { "200": { description: "User challenges" } } },
      post: {
        tags: ["UserChallenges"],
        summary: "Join challenge",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["challengeId"], properties: { challengeId: { type: "string", format: "uuid" } } } } } },
        responses: { "201": { description: "Joined" } },
      },
    },
    "/api/user-challenges/{id}": {
      patch: {
        tags: ["UserChallenges"],
        summary: "Update challenge progress and upload picture URLs",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  progressStatus: { type: "string", enum: ["JOINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
                  progressPct: { type: "integer", minimum: 0, maximum: 100 },
                  note: { type: "string" },
                  pictures: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["url"],
                      properties: {
                        url: { type: "string", format: "uri" },
                        caption: { type: "string" },
                        kind: { type: "string", enum: ["BEFORE", "AFTER", "PROGRESS"] },
                        takenAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
    },
    "/api/uploads": {
      post: {
        tags: ["Uploads"],
        summary: "Upload file/base64/url to Cloudinary",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["file"], properties: { file: { type: "string" }, folder: { type: "string", example: "greenbean" } } } } },
        },
        responses: { "201": { description: "Uploaded" } },
      },
    },
  },
} as const;
