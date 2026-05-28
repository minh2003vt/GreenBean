import type { ProductItem } from "@/types";

/** Static seed data for the Market page — replace with API later */
export const PRODUCTS: ProductItem[] = [
  {
    id: "organic-mulch-bale",
    name: "Organic Mulch Bale (25 kg)",
    seller: "GreenBean Co-op",
    priceLabel: "$8.50 / bale",
    unitPrice: 8.5,
    quantity: 40,
    category: "Fertilizer",
    description: "Organic mulch from dried leaves and plant fibers to keep soil moisture.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=900&h=500&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=900&h=500&fit=crop",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&h=500&fit=crop",
    ],
  },
  {
    id: "drip-kit-small",
    name: "Small Drip Irrigation Kit",
    seller: "AgriTech Store",
    priceLabel: "$35 / set",
    unitPrice: 35,
    quantity: 14,
    category: "Irrigation",
    description: "Starter drip kit for small plots, saves water and keeps roots evenly moist.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=900&h=500&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=900&h=500&fit=crop",
    ],
  },
  {
    id: "pest-trap-yellow",
    name: "Yellow Sticky Pest Traps (50 pcs)",
    seller: "Farm Guard",
    priceLabel: "$6 / pack",
    unitPrice: 6,
    quantity: 90,
    category: "Pest control",
    description: "Non-toxic sticky traps for monitoring and reducing flying pest insects.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1515462277126-2dd0c162007a?w=900&h=500&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1515462277126-2dd0c162007a?w=900&h=500&fit=crop",
    ],
  },
  {
    id: "soil-test-kit-basic",
    name: "Basic Soil Test Kit",
    seller: "Local Extension Shop",
    priceLabel: "$12 / kit",
    unitPrice: 12,
    quantity: 25,
    category: "Tools",
    description: "Simple color-based kit for checking pH and key nutrients in field soil.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1530936541512-131d1a9b9b1f?w=900&h=500&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1530936541512-131d1a9b9b1f?w=900&h=500&fit=crop",
    ],
  },
];
