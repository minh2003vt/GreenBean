import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { api } from "@/lib/api";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/" replace />;

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };
  const registerValid = mode !== "register" || (
    name.trim() &&
    email.trim() &&
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.number &&
    passwordRules.special &&
    passwordRules.match
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "register") {
        await register({ name, email, phone: phone || undefined, password });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === "register" ? "Register failed" : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const sendOtp = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.forgotPassword(email);
      setShowReset(true);
      setNotice("OTP sent if the email exists.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.resetPassword(email, otp, newPassword);
      setNotice("Password reset. You can sign in now.");
      setShowReset(false);
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>GreenBean</h1>
        <p className={styles.subtitle}>{mode === "register" ? "Create your farmer account." : "Sign in to continue."}</p>
        <div className={styles.tabs}>
          <button type="button" className={mode === "login" ? styles.tabActive : styles.tab} onClick={() => setMode("login")}>Sign in</button>
          <button type="button" className={mode === "register" ? styles.tabActive : styles.tab} onClick={() => { setMode("register"); setEmail(""); setPassword(""); setConfirmPassword(""); }}>Register</button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}
          {mode === "register" && (
            <>
              <label className={styles.label}>
                Name
                <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className={styles.label}>
                Phone
                <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </>
          )}
          <label className={styles.label}>
            Email
            <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label className={styles.label}>
            Password
            <span className={styles.passwordField}>
              <input className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} />
              <button className={styles.passwordToggle} type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {mode === "register" && (
            <>
              <label className={styles.label}>
                Re-password
                <span className={styles.passwordField}>
                  <input className={styles.input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showPassword ? "text" : "password"} />
                  <button className={styles.passwordToggle} type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              <div className={styles.passwordRules} aria-live="polite">
                <PasswordRule ok={passwordRules.length} label="At least 8 characters" />
                <PasswordRule ok={passwordRules.uppercase} label="One uppercase letter" />
                <PasswordRule ok={passwordRules.number} label="One number" />
                <PasswordRule ok={passwordRules.special} label="One special character" />
                <PasswordRule ok={passwordRules.match} label="Passwords match" />
              </div>
            </>
          )}
          <button className={styles.button} type="submit" disabled={submitting || !registerValid}>
            {submitting ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
          </button>
          {mode === "login" && (
            <button className={styles.linkButton} type="button" disabled={submitting || !email} onClick={() => void sendOtp()}>
              Forgot password?
            </button>
          )}
          {mode === "login" && showReset && (
            <div className={styles.resetBox}>
              <input className={styles.input} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP code" />
              <span className={styles.passwordField}>
                <input className={styles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type={showPassword ? "text" : "password"} />
                <button className={styles.passwordToggle} type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              <button className={styles.button} type="button" disabled={!otp || !newPassword || submitting} onClick={() => void resetPassword()}>
                Reset password
              </button>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return <p className={ok ? styles.ruleOk : styles.rule}>{ok ? "✓" : "○"} {label}</p>;
}
