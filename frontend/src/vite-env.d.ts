/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYPAL_CLIENT_ID?: string;
}

interface Window {
  paypal?: {
    Buttons: (options: {
      style?: Record<string, unknown>;
      createOrder: () => Promise<string>;
      onApprove: (data: { orderID: string }) => Promise<void>;
      onError?: (err: unknown) => void;
    }) => {
      render: (selector: string | HTMLElement) => Promise<void>;
      close?: () => void;
    };
  };
}
