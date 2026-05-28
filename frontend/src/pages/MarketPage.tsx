import { useEffect, useId, useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import type { ProductItem } from "@/types";
import { api, type ApiCartItem, type ApiProduct } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { useAuth } from "@/app/AuthContext";
import { ProductImageGallery } from "@/features/market/ProductImageGallery";
import { SellProductModal, type SellProductDraft } from "@/features/market/SellProductModal";
import { fileToDataUrl } from "@/lib/file";
import { useToast } from "@/components/ui/Toast";
import styles from "./MarketPage.module.css";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? "ATzO8ZUTf-FBNkixmJIBGm6FIOJxrpKxqZoktJKHE3dKHjmTx8AvJKuualL9tuFtQSxR3cW0rmAExVjL";
let paypalSdkPromise: Promise<void> | null = null;

function loadPayPalSdk() {
  if (window.paypal) return Promise.resolve();
  if (paypalSdkPromise) return paypalSdkPromise;
  paypalSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal checkout"));
    document.body.appendChild(script);
  });
  return paypalSdkPromise;
}

function PayPalCheckout({ disabled, onPaid }: { disabled: boolean; onPaid: () => Promise<void> | void }) {
  const { showError, showSuccess } = useToast();
  const containerId = useId().replace(/:/g, "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let closed = false;
    let buttons: { render: (selector: string | HTMLElement) => Promise<void>; close?: () => void } | null = null;
    const render = async () => {
      if (disabled) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        await loadPayPalSdk();
        if (closed || !window.paypal) return;
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        buttons = window.paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
          createOrder: async () => {
            const order = await api.createPayPalOrder();
            return order.id;
          },
          onApprove: async (data) => {
            await api.capturePayPalOrder(data.orderID);
            showSuccess("Payment completed successfully");
            await onPaid();
          },
          onError: (err) => {
            showError(err instanceof Error ? err.message : "PayPal payment failed");
          },
        });
        await buttons.render(container);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load PayPal checkout");
      } finally {
        if (!closed) setLoading(false);
      }
    };
    void render();
    return () => {
      closed = true;
      buttons?.close?.();
    };
  }, [containerId, disabled, onPaid, showError, showSuccess]);

  return (
    <div className={styles.paypalWrap}>
      {loading && <p className={styles.paymentNote}>Loading PayPal sandbox...</p>}
      {disabled ? <button type="button" className={styles.paypalBtn} disabled>Payment</button> : <div id={containerId} />}
    </div>
  );
}

function getProductImages(product: ProductItem): string[] {
  if (product.imageUrls?.length) return product.imageUrls;
  return product.thumbnailUrl ? [product.thumbnailUrl] : [];
}

function productPrice(product: ApiProduct) {
  return Number(product.listingPrice ?? product.suggestedPrice ?? 0);
}

function mapProduct(product: ApiProduct): ProductItem {
  const unitPrice = productPrice(product);
  return {
    id: product.id,
    name: product.name,
    seller: product.submittedBy?.name ?? "GreenBean farmer",
    priceLabel: `${formatUsd(unitPrice)} / ${product.unit}`,
    unitPrice,
    quantity: product.quantity,
    category: product.category,
    description: product.description,
    thumbnailUrl: product.thumbnailUrl ?? undefined,
    imageUrls: product.imageUrls?.length ? product.imageUrls : product.thumbnailUrl ? [product.thumbnailUrl] : [],
  };
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function MarketPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [query, setQuery] = useState("");
  const [openSell, setOpenSell] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cartItems, setCartItems] = useState<ApiCartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMarket = async (search = query) => {
    setLoading(true);
    const [productPage, cart] = await Promise.all([api.products(search), api.cart()]);
    setProducts(productPage.items.filter((product) => product.submittedBy?.id !== user?.id).map(mapProduct));
    setCartItems(cart);
    setLoading(false);
  };

  useEffect(() => {
    refreshMarket().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load market");
      setLoading(false);
    });
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return products;
    return products.filter(
      (p) => normalize(p.name).includes(q) || normalize(p.seller).includes(q),
    );
  }, [query, products]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, line) => sum + line.quantity, 0),
    [cartItems],
  );

  const cartLines = useMemo(() => {
    return cartItems.map((line) => ({ id: line.id, productId: line.product.id, qty: line.quantity, product: mapProduct(line.product) }));
  }, [cartItems]);

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty * line.product.unitPrice, 0),
    [cartLines],
  );

  const getInCartQty = (productId: string) => {
    const line = cartItems.find((x) => x.product.id === productId);
    return line ? line.quantity : 0;
  };

  const handleAddToCart = async (product: ProductItem) => {
    if (product.quantity <= 0) return;
    await api.addCart(product.id, 1);
    setCartItems(await api.cart());
    showSuccess("Added to cart successfully");
  };

  const changeCartQty = async (cartItemId: string, nextQty: number) => {
    if (nextQty <= 0) {
      await api.deleteCart(cartItemId);
      showSuccess("Removed from cart successfully");
    } else {
      await api.updateCart(cartItemId, nextQty);
      showSuccess("Cart updated successfully");
    }
    setCartItems(await api.cart());
  };

  const handleSellSubmit = async (draft: SellProductDraft) => {
    try {
      const uploadedUrls = await Promise.all(
        draft.photos.map(async (file) => (await api.uploadFile(await fileToDataUrl(file), "greenbean/products")).url),
      );
      const [thumbnailUrl] = uploadedUrls;
      await api.submitProduct({
        name: draft.name,
        description: draft.description,
        category: draft.category,
        unit: draft.unit,
        quantity: draft.quantity,
        suggestedPrice: draft.suggestedPrice,
        thumbnailUrl,
        imageUrls: uploadedUrls,
      });
      await refreshMarket();
      showSuccess("Product submitted successfully");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to submit product");
      throw err;
    }
  };

  const handlePaid = async () => {
    await refreshMarket();
    setCartItems(await api.cart());
    setOpenCart(false);
  };

  return (
    <div className={`page-stack page-stack--fill ${styles.page}`}>
      <div className={styles.topBar}>
        <SpeakableText text="Market" rowClassName={styles.titleRow} align="center" block>
          <h1 className={styles.title}>Market</h1>
        </SpeakableText>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.cartBtn}
            aria-label="Cart"
            onClick={() => setOpenCart(true)}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
          <button type="button" className={styles.sellBtn} onClick={() => setOpenSell(true)}>
            <Plus size={16} />
            Sell your product
          </button>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <Search size={18} />
        <input
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
      </div>
      {error && <p className={styles.empty}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Loading products...</p>
      ) : filtered.length === 0 ? (
        <SpeakableText text="No products found." align="center" block>
          <p className={styles.empty}>No products found.</p>
        </SpeakableText>
      ) : (
        <div className={styles.grid}>
          {filtered.map((product) => {
          const cardInner = (
            <>
              {product.thumbnailUrl ? (
                <img className={styles.thumb} src={product.thumbnailUrl} alt="" loading="lazy" />
              ) : (
                <div className={styles.thumbPlaceholder}>No image</div>
              )}
              <div className={styles.body}>
                <SpeakableText text={product.name} size="sm">
                  <p className={styles.name}>{product.name}</p>
                </SpeakableText>
                <SpeakableText text={product.seller} size="sm">
                  <p className={styles.seller}>{product.seller}</p>
                </SpeakableText>
                <SpeakableText text={product.priceLabel} size="sm">
                  <p className={styles.price}>{product.priceLabel}</p>
                </SpeakableText>
              </div>
            </>
          );

          const inCartQty = getInCartQty(product.id);
          const available = Math.max(0, product.quantity - inCartQty);

          return (
            <div key={product.id} className={styles.card}>
              <button
                type="button"
                className={styles.cardMain}
                onClick={() => setSelectedProduct(product)}
              >
                {cardInner}
              </button>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => handleAddToCart(product)}
                disabled={available <= 0}
              >
                {available <= 0 ? "Out of stock" : "Add to cart"}
              </button>
            </div>
          );
          })}
        </div>
      )}

      {openSell && (
        <SellProductModal
          onClose={() => setOpenSell(false)}
          onSubmit={handleSellSubmit}
        />
      )}

      {selectedProduct && (
        <Modal title={selectedProduct.name} onClose={() => setSelectedProduct(null)} wide>
          <div className={styles.detail}>
            <ProductImageGallery
              images={getProductImages(selectedProduct)}
              alt={selectedProduct.name}
            />
            <SpeakableText text={selectedProduct.seller} block size="sm">
              <p className={styles.detailMeta}>Seller: {selectedProduct.seller}</p>
            </SpeakableText>
            <SpeakableText text={selectedProduct.category} block size="sm">
              <p className={styles.detailMeta}>Category: {selectedProduct.category}</p>
            </SpeakableText>
            <SpeakableText text={selectedProduct.priceLabel} block size="sm">
              <p className={styles.detailPrice}>{selectedProduct.priceLabel}</p>
            </SpeakableText>
            <SpeakableText text={`${selectedProduct.quantity} available`} block size="sm">
              <p className={styles.detailMeta}>In stock: {selectedProduct.quantity}</p>
            </SpeakableText>
            <SpeakableText text={selectedProduct.description} block size="sm">
              <p className={styles.detailDesc}>{selectedProduct.description}</p>
            </SpeakableText>

            <div className={styles.detailActions}>
              <button
                type="button"
                className={styles.addBtnDetail}
                onClick={() => handleAddToCart(selectedProduct)}
                disabled={getInCartQty(selectedProduct.id) >= selectedProduct.quantity}
              >
                Add to cart
              </button>
            </div>
          </div>
        </Modal>
      )}

      {openCart && (
        <Modal title="Your cart" onClose={() => setOpenCart(false)} wide>
          {cartLines.length === 0 ? (
            <p className={styles.empty}>Your cart is empty.</p>
          ) : (
            <>
              <div className={styles.cartList}>
                {cartLines.map((line) => {
                  const maxQty = line.product.quantity;
                  const canAdd = line.qty < maxQty;
                  const lineTotal = line.qty * line.product.unitPrice;
                  return (
                    <div key={line.productId} className={styles.cartItem}>
                      {line.product.thumbnailUrl ? (
                        <img src={line.product.thumbnailUrl} alt="" className={styles.cartThumb} />
                      ) : (
                        <div className={styles.cartThumbPlaceholder} />
                      )}
                      <div className={styles.cartMeta}>
                        <p className={styles.cartName}>{line.product.name}</p>
                        <p className={styles.cartSub}>
                          {line.product.priceLabel} · Stock {line.product.quantity}
                        </p>
                        {line.product.unitPrice > 0 && (
                          <p className={styles.cartLineTotal}>{formatUsd(lineTotal)}</p>
                        )}
                      </div>
                      <div className={styles.cartControls}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => changeCartQty(line.id, line.qty - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qty}>{line.qty}</span>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => changeCartQty(line.id, line.qty + 1)}
                          disabled={!canAdd}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.removeBtn}`}
                          onClick={() => changeCartQty(line.id, 0)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.paymentSection}>
                <SpeakableText text="Payment" block size="sm">
                  <h3 className={styles.paymentTitle}>Payment</h3>
                </SpeakableText>
                <div className={styles.orderSummary}>
                  <span>Order total</span>
                  <strong>{formatUsd(cartTotal)}</strong>
                </div>
                <PayPalCheckout disabled={cartTotal <= 0} onPaid={handlePaid} />
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

