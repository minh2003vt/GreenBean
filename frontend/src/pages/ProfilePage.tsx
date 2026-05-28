import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/app/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { SellProductModal, type SellProductDraft } from "@/features/market/SellProductModal";
import { api, type ApiOrder, type ApiProduct, type ApiUserChallenge } from "@/lib/api";
import { fileToDataUrl } from "@/lib/file";
import styles from "./ProfilePage.module.css";

type ProfileTab = "profile" | "orders" | "challenges" | "submissions";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const { user, logout, refresh } = useAuth();
  const { showSuccess, showError } = useToast();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [challenges, setChallenges] = useState<ApiUserChallenge[]>([]);
  const [submissions, setSubmissions] = useState<ApiProduct[]>([]);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [resubmittingProduct, setResubmittingProduct] = useState<ApiProduct | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.orders(), api.myChallenges(), api.myProducts()])
      .then(([orderPage, challengeItems, submissionPage]) => {
        setOrders(orderPage.items);
        setChallenges(challengeItems);
        setSubmissions(submissionPage.items);
      })
      .catch((err) => setDataError(err instanceof Error ? err.message : "Failed to load profile history"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
  }, [user]);

  if (!user) return null;

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateMe({ name, phone, avatarUrl: avatarUrl || null });
      await refresh();
      setMessage("Profile updated successfully");
      showSuccess("Profile updated successfully");
      setEditingProfile(false);
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = async () => {
    setSaving(true);
    await api.updateMe({ avatarUrl: null });
    setAvatarUrl("");
    await refresh();
    setMessage("Avatar removed");
    showSuccess("Avatar removed successfully");
    setSaving(false);
  };

  const changePassword = async () => {
    setSaving(true);
    await api.changePassword({ oldPassword: oldPassword || undefined, otp: otp || undefined, newPassword });
    setOldPassword("");
    setOtp("");
    setNewPassword("");
    setMessage("Password changed");
    showSuccess("Password changed successfully");
    setSaving(false);
  };

  const requestOtp = async () => {
    setSaving(true);
    await api.requestPasswordChangeOtp();
    setMessage("OTP sent to your email");
    showSuccess("OTP sent successfully");
    setSaving(false);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const uploaded = await api.uploadFile(dataUrl, "greenbean/avatars");
      setAvatarUrl(uploaded.url);
      await api.updateMe({ avatarUrl: uploaded.url });
      await refresh();
      setMessage("Avatar updated successfully");
      showSuccess("Avatar updated successfully");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const confirmLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) await logout();
  };

  const cancelEdit = () => {
    setName(user.name);
    setPhone(user.phone ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
    setEditingProfile(false);
  };

  const handleResubmit = async (product: ApiProduct, draft: SellProductDraft) => {
    try {
      setSaving(true);
      const uploadedUrls = await Promise.all(
        draft.photos.map(async (file) => (await api.uploadFile(await fileToDataUrl(file), "greenbean/products")).url),
      );
      const [thumbnailUrl] = uploadedUrls;
      await api.updateProduct(product.id, {
        name: draft.name,
        description: draft.description,
        category: draft.category,
        unit: draft.unit,
        quantity: draft.quantity,
        suggestedPrice: draft.suggestedPrice,
        thumbnailUrl: thumbnailUrl ?? product.thumbnailUrl ?? undefined,
        imageUrls: uploadedUrls.length > 0 ? uploadedUrls : product.imageUrls ?? (product.thumbnailUrl ? [product.thumbnailUrl] : undefined),
      });
      setSubmissions((await api.myProducts()).items);
      setMessage("Product submitted again for review");
      showSuccess("Product submitted again for review");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to submit product again");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const openOrder = async (orderId: string) => {
    setSaving(true);
    try {
      setSelectedOrder(await api.order(orderId));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load order detail");
    } finally {
      setSaving(false);
    }
  };

  const tabs: Array<{ id: ProfileTab; label: string }> = [
    { id: "profile", label: "Profile" },
    { id: "orders", label: "Orders" },
    { id: "challenges", label: "Challenges" },
    { id: "submissions", label: "My submissions" },
  ];

  return (
    <div className={`page-stack page-stack--fill ${styles.page}`}>
      <div className={styles.avatarRow}>
        <button type="button" className={styles.avatarButton} onClick={() => fileRef.current?.click()} disabled={saving} aria-label="Change avatar">
          {user.avatarUrl ? <img className={styles.avatarImg} src={user.avatarUrl} alt="" /> : <div className={styles.avatar}>{initials(user.name)}</div>}
        </button>
        <div>
          <p className={styles.userName}>{user.name}</p>
          <p className={styles.userSub}>Member since {new Date(user.createdAt).getFullYear()}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.editBtn} onClick={() => setEditingProfile(true)}>Edit</button>
          <button type="button" className={styles.editBtn} onClick={() => void confirmLogout()}>Logout</button>
        </div>
      </div>

      {loading && <p className={styles.notice}>Loading profile data...</p>}
      {dataError && <p className={styles.notice}>{dataError}</p>}
      {saving && <p className={styles.notice}>Saving...</p>}
      {message && <p className={styles.notice}>{message}</p>}

      <input ref={fileRef} className={styles.hiddenFile} type="file" accept="image/*" onChange={uploadAvatar} />

      <div className={styles.tabBar} role="tablist" aria-label="Profile sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <>
          {editingProfile && (
            <section className={styles.section}>
              <p className={styles.sectionTitle}>Edit profile</p>
              <div className={styles.formGrid}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={saving}>Change avatar</button>
                <button type="button" onClick={() => void saveProfile()} disabled={saving}>Save profile</button>
                <button type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
                <button type="button" onClick={() => window.confirm("Remove avatar?") && void removeAvatar()} disabled={saving}>Remove avatar</button>
              </div>
            </section>
          )}

          <section className={styles.section}>
            <p className={styles.sectionTitle}>Change password</p>
            <div className={styles.formGrid}>
              <button type="button" onClick={() => setShowPassword(true)}>Open password form</button>
            </div>
          </section>

          <div className={styles.statsGrid}>
            <div className={styles.stat}><p className={styles.statNum}>{user.stats?.completedChallenges ?? 0}</p><p className={styles.statLabel}>Challenges completed</p></div>
            <div className={styles.stat}><p className={styles.statNum}>{user.stats?.orders ?? orders.length}</p><p className={styles.statLabel}>Orders placed</p></div>
            <div className={styles.stat}><p className={styles.statNum}>{submissions.length}</p><p className={styles.statLabel}>Submissions</p></div>
          </div>

          <section className={styles.section}>
            <p className={styles.sectionTitle}>Basic info</p>
            <div className={styles.row}><User size={16} /><div><p className={styles.rowLabel}>Email</p><p className={styles.rowSub}>{user.email}</p></div></div>
            <div className={styles.row}><User size={16} /><div><p className={styles.rowLabel}>Phone</p><p className={styles.rowSub}>{user.phone ?? "Not set"}</p></div></div>
          </section>
        </>
      )}

      {activeTab === "challenges" && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>Challenges</p>
          {loading && <div className={styles.emptyState}>Loading challenges...</div>}
          {!loading && challenges.length === 0 && <div className={styles.emptyState}>You have not joined any challenges yet.</div>}
          {challenges.map((item) => (
            <div key={item.id} className={styles.row}>
              <div className={styles.rowText}><p className={styles.rowLabel}>{item.challenge.title}</p><p className={styles.rowSub}>{item.progressPct}% complete</p></div>
              <span className={`${styles.badge} ${item.progressStatus === "COMPLETED" ? styles.badgeDone : styles.badgeActive}`}>{item.progressStatus}</span>
            </div>
          ))}
        </section>
      )}

      {activeTab === "orders" && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>Order history</p>
          {loading && <div className={styles.emptyState}>Loading orders...</div>}
          {!loading && orders.length === 0 && <div className={styles.emptyState}>No orders yet.</div>}
          {orders.map((order) => (
            <button key={order.id} type="button" className={`${styles.row} ${styles.orderButton}`} onClick={() => void openOrder(order.id)}>
              <div className={styles.rowText}><p className={styles.rowLabel}>Order {order.id.slice(0, 8)}</p><p className={styles.rowSub}>{new Date(order.createdAt).toLocaleDateString()} · {order._count?.items ?? 0} items</p></div>
              <p className={styles.rowRight}>${Number(order.totalAmount).toFixed(2)}</p>
            </button>
          ))}
        </section>
      )}

      {activeTab === "submissions" && (
        <section className={styles.section}>
          <p className={styles.sectionTitle}>My submissions</p>
          {loading && <div className={styles.emptyState}>Loading submissions...</div>}
          {!loading && submissions.length === 0 && <div className={styles.emptyState}>No submissions yet.</div>}
          {submissions.map((product) => (
            <article key={product.id} className={styles.submissionCard}>
              {(product.imageUrls?.[0] ?? product.thumbnailUrl) ? <img src={product.imageUrls?.[0] ?? product.thumbnailUrl ?? ""} alt="" /> : <div className={styles.submissionThumbEmpty} />}
              <div className={styles.rowText}>
                <p className={styles.rowLabel}>{product.name}</p>
                <p className={styles.rowSub}>{product.quantity} {product.unit} - {product.category}</p>
                <span className={`${styles.submissionBadge} ${styles[`submission${product.approvalStatus ?? "PENDING"}`]}`}>
                  {product.approvalStatus ?? "PENDING"}
                </span>
                {product.approvalStatus === "REJECTED" && (
                  <>
                    <p className={styles.rejectNote}>Rejected: {product.adminNote ?? "Please update the details and submit again."}</p>
                    <button type="button" className={styles.resubmitBtn} onClick={() => setResubmittingProduct(product)}>
                      Edit and submit again
                    </button>
                  </>
                )}
                {product.approvalStatus === "APPROVED" && !product.isActive && (
                  <p className={styles.rejectNote}>Accepted by admin. Waiting for market listing.</p>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {resubmittingProduct && (
        <SellProductModal
          title="Edit rejected submission"
          submitLabel="Submit again"
          initialDraft={{
            name: resubmittingProduct.name,
            quantity: resubmittingProduct.quantity,
            suggestedPrice: Number(resubmittingProduct.suggestedPrice),
            unit: resubmittingProduct.unit,
            category: resubmittingProduct.category as SellProductDraft["category"],
            description: resubmittingProduct.description,
          }}
          onClose={() => setResubmittingProduct(null)}
          onSubmit={(draft) => handleResubmit(resubmittingProduct, draft)}
        />
      )}
      {selectedOrder && (
        <Modal title={`Order ${selectedOrder.id.slice(0, 8)}`} onClose={() => setSelectedOrder(null)} wide>
          <div className={styles.orderDetail}>
            <div className={styles.orderSummary}>
              <span>Status</span>
              <strong>{selectedOrder.status}</strong>
              <span>Date</span>
              <strong>{new Date(selectedOrder.createdAt).toLocaleString()}</strong>
              {selectedOrder.note && (
                <>
                  <span>Payment</span>
                  <strong>{selectedOrder.note}</strong>
                </>
              )}
            </div>
            <div className={styles.orderItems}>
              {(selectedOrder.items ?? []).map((item) => {
                const image = item.product.imageUrls?.[0] ?? item.product.thumbnailUrl;
                return (
                  <div key={item.id} className={styles.orderItem}>
                    {image ? <img src={image} alt="" /> : <div className={styles.submissionThumbEmpty} />}
                    <div className={styles.rowText}>
                      <p className={styles.rowLabel}>{item.product.name}</p>
                      <p className={styles.rowSub}>{item.quantity} {item.product.unit} x ${Number(item.unitPrice).toFixed(2)}</p>
                      <p className={styles.rowSub}>{item.product.category}</p>
                    </div>
                    <p className={styles.rowRight}>${Number(item.subtotal).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
            <div className={styles.orderTotal}>
              <span>Total</span>
              <strong>${Number(selectedOrder.totalAmount).toFixed(2)}</strong>
            </div>
          </div>
        </Modal>
      )}
      {showPassword && (
        <Modal title="Change password" onClose={() => setShowPassword(false)} wide>
          <div className={styles.formGrid}>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Old password" />
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP code" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            <button type="button" onClick={() => void requestOtp()} disabled={saving}>Send OTP to email</button>
            <button type="button" onClick={() => void changePassword().then(() => setShowPassword(false))} disabled={(!oldPassword && !otp) || !newPassword || saving}>Save new password</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
