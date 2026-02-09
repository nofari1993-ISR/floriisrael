import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Mail, Lock, Sparkles, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";
import { z } from "zod";

const emailSchema = z.string().email("כתובת מייל לא תקינה");
const passwordSchema = z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים");

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("נשלח מייל לאיפוס סיסמה! בדקו את תיבת הדואר שלכם.");
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      setError(passResult.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message === "Invalid login credentials" ? "פרטי התחברות שגויים" : error.message);
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.includes("already registered")) {
          setError("המשתמש כבר רשום, נסו להתחבר");
        } else {
          setError(error.message);
        }
      } else {
        setSuccess("נשלח מייל אימות! בדקו את תיבת הדואר שלכם.");
      }
    }
    setSubmitting(false);
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "התחברות";
      case "signup": return "הרשמה";
      case "forgot": return "שכחתי סיסמה";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login": return "היכנסו לניהול החנויות";
      case "signup": return "צרו חשבון חדש";
      case "forgot": return "הזינו את המייל שלכם ונשלח לכם קישור לאיפוס";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </a>
          <div className="flex items-center justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground font-body mt-2">
            {getSubtitle()}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated border border-border/50 p-8">
          <form onSubmit={mode === "forgot" ? handleForgotPassword : handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                dir="ltr"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  סיסמה
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 6 תווים"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
                  >
                    שכחתי סיסמה
                  </button>
                )}
              </div>
            )}

            {error && (
              <p className="text-destructive text-sm font-body bg-destructive/10 rounded-lg p-3">{error}</p>
            )}
            {success && (
              <p className="text-primary text-sm font-body bg-primary/10 rounded-lg p-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {success}
              </p>
            )}

            <Button
              type="submit"
              variant="hero"
              className="w-full rounded-xl"
              size="lg"
              disabled={submitting}
            >
              {submitting
                ? "מעבד..."
                : mode === "login"
                  ? "התחברות"
                  : mode === "signup"
                    ? "הרשמה"
                    : "שליחת קישור איפוס"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === "forgot" ? (
              <button
                onClick={() => switchMode("login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                חזרה להתחברות
              </button>
            ) : (
              <button
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                {mode === "login" ? "אין לכם חשבון? הירשמו" : "כבר יש לכם חשבון? התחברו"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
