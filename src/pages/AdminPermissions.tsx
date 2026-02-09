import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Store, UserPlus, UserMinus, Loader2, Search, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useShops } from "@/hooks/useShops";

interface ShopWithOwner {
  id: string;
  name: string;
  location: string;
  owner_id: string | null;
  owner_email: string | null;
}

const AdminPermissions = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { removeShop } = useShops();
  const [shops, setShops] = useState<ShopWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningShopId, setAssigningShopId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [authLoading, user, isAdmin, navigate]);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-shop-owners", {
        body: { action: "list" },
      });
      if (error) throw error;
      setShops(data.shops || []);
    } catch (err: any) {
      console.error("Failed to fetch shops:", err);
      toast({ title: "שגיאה", description: "לא ניתן לטעון את רשימת החנויות", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchShops();
    }
  }, [authLoading, isAdmin, fetchShops]);

  const handleAssign = async (shopId: string) => {
    const email = emailInput.trim();
    if (!email) {
      toast({ title: "שגיאה", description: "יש להזין כתובת מייל", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-shop-owners", {
        body: { action: "assign", shopId, email },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({ title: "הושלם ✅", description: `${email} הוגדר/ה כבעל/ת החנות` });
      setAssigningShopId(null);
      setEmailInput("");
      fetchShops();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message || "לא ניתן לשייך", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (shopId: string, shopName: string) => {
    if (!confirm(`להסיר את בעל/ת החנות של "${shopName}"?`)) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-shop-owners", {
        body: { action: "remove", shopId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({ title: "הוסר ✅", description: `בעל/ת החנות של "${shopName}" הוסר/ה` });
      fetchShops();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message || "לא ניתן להסיר", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (!confirm(`למחוק את החנות "${shopName}" וכל הנתונים שלה? פעולה זו בלתי הפיכה!`)) return;
    setSubmitting(true);
    try {
      const success = await removeShop(shopId);
      if (success) fetchShops();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message || "לא ניתן למחוק", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredShops = shops.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      s.location.includes(searchQuery) ||
      (s.owner_email && s.owner_email.includes(searchQuery))
  );

  if (authLoading || (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              <ArrowRight className="w-5 h-5" />
              חזרה
            </button>
            <div className="h-5 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-foreground text-sm">ניהול הרשאות</span>
            </div>
          </div>
          <Logo size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              ניהול הרשאות חנויות
            </h1>
            <p className="text-muted-foreground font-body text-sm">
              שיוך משתמשים כבעלי חנויות כדי לתת להם גישה לממשק הניהול
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם חנות, מיקום או מייל..."
              className="pr-10 rounded-xl"
            />
          </div>

          {/* Shops List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-16">
              <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-body">לא נמצאו חנויות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredShops.map((shop) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/50 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-foreground">{shop.name}</h3>
                      <p className="text-sm text-muted-foreground font-body">{shop.location}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-body font-medium ${
                      shop.owner_id
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {shop.owner_id ? "יש בעלים" : "ללא בעלים"}
                    </div>
                  </div>

                  {/* Current owner */}
                  {shop.owner_email && (
                    <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-4 py-2.5">
                      <Mail className="w-4 h-4 text-primary/60 shrink-0" />
                      <span className="text-sm font-body text-foreground" dir="ltr">
                        {shop.owner_email}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 px-2"
                        onClick={() => handleRemove(shop.id, shop.name)}
                        disabled={submitting}
                      >
                        <UserMinus className="w-3.5 h-3.5 ml-1" />
                        הסר
                      </Button>
                    </div>
                  )}

                  {/* Assign section */}
                  {assigningShopId === shop.id ? (
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="כתובת מייל של המשתמש..."
                        className="rounded-xl text-sm"
                        dir="ltr"
                        autoFocus
                      />
                      <Button
                        variant="hero"
                        size="sm"
                        className="rounded-xl shrink-0"
                        onClick={() => handleAssign(shop.id)}
                        disabled={submitting || !emailInput.trim()}
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "שייך"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl shrink-0"
                        onClick={() => {
                          setAssigningShopId(null);
                          setEmailInput("");
                        }}
                      >
                        ביטול
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 w-full"
                      onClick={() => {
                        setAssigningShopId(shop.id);
                        setEmailInput("");
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {shop.owner_id ? "שנה בעל/ת חנות" : "שייך בעל/ת חנות"}
                    </Button>
                  )}

                  {/* Delete shop */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl gap-1.5 w-full text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20"
                    onClick={() => handleDeleteShop(shop.id, shop.name)}
                    disabled={submitting}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    מחק חנות
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPermissions;
