import { env } from "../config/env.js";
import { ApiError } from "../middleware/error-handler.js";

type PayPalOrderResponse = {
  id: string;
  status: string;
};

const paypalMessage = (body: unknown, fallback: string) => {
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }
  return fallback;
};

const getPayPalConfig = () => {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new ApiError(500, "PayPal sandbox credentials are not configured");
  }
  return {
    baseUrl: env.PAYPAL_BASE_URL.replace(/\/$/, ""),
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
  };
};

const getAccessToken = async () => {
  const { baseUrl, clientId, clientSecret } = getPayPalConfig();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const body = await response.json().catch(() => null) as { access_token?: string; message?: string } | null;
  if (!response.ok || !body?.access_token) {
    throw new ApiError(502, body?.message ?? "Failed to authenticate with PayPal");
  }
  return body.access_token;
};

export const createPayPalOrder = async (amount: string) => {
  const { baseUrl } = getPayPalConfig();
  const accessToken = await getAccessToken();
  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
        },
      ],
    }),
  });

  const body = await response.json().catch(() => null) as PayPalOrderResponse | { message?: string } | null;
  if (!response.ok || !body || !("id" in body)) {
    throw new ApiError(502, paypalMessage(body, "Failed to create PayPal order"));
  }
  return body;
};

export const capturePayPalOrder = async (paypalOrderId: string) => {
  const { baseUrl } = getPayPalConfig();
  const accessToken = await getAccessToken();
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
  });

  const body = await response.json().catch(() => null) as PayPalOrderResponse | { message?: string } | null;
  if (!response.ok || !body || !("status" in body)) {
    throw new ApiError(502, paypalMessage(body, "Failed to capture PayPal order"));
  }
  if (body.status !== "COMPLETED") {
    throw new ApiError(400, `PayPal payment is ${body.status}`);
  }
  return body;
};
