import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ClipboardList, Store, ArrowRight, LogOut, ChevronDown, Truck, Shield, Settings, Globe, Save, Phone } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useShopOwner, type OwnedShop } from "@/hooks/useShopOwner";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import InventoryTab from "@/components/dashboard/InventoryTab";
import OrdersTab from "@/components/dashboard/OrdersTab";
import RestockTab from "@/components/dashboard/RestockTab";

type Tab = "inventory" | "orders" | "restock" | "settings";

const Dashboard = () => {
  const navigate = useNavigate();
  const { shops, isShopOwner, isAdmin, loading, user } = useShopOwner();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [selectedShop, setSelectedShop] = useState<OwnedShop | null>(null);
  const [showShopPicker, setShowShopPicker] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [shopWebsite, setShopWebsite] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [savingWebsite, setSavingWebsite] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (shops.length > 0 && !selectedShop) {
      setSelectedShop(shops[0]);
    }
  }, [shops, selectedShop]);

  useEffect(() => {
    if (!selectedShop) return;
    const loadSettings = async () => {
      const { data } = await supabase.from("shops").select("website, phone").eq("id", selectedShop.id).single();
      setShopWebsite(data?.website || "");
      setShopPhone(data?.phone || "");
    };
    loadSettings();
  }, [selectedShop]);

  const handleSaveSettings = async () => {
    if (!selectedShop) return;
    setSavingWebsite(true);
    const { error } = await supabase.from("shops").update({ website: shopWebsite || null, phone: shopPhone || null }).eq("id", selectedShop.id);
    setSavingWebsite(false);
    if (error) {
      toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "הגדרות החנות עודכנו בהצלחה ✅" });
    }
  };

  useEffect(() => {
    if (!selectedShop) return;

    const channel = supabase
      .channel("dashboard-new-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${selectedShop.id}`,
        },
        (payload) => {
          const newOrder = payload.new as any;
          console.log("New order received:", newOrder.id);
          toast({
            title: "🌸 הזמנה חדשה!",
            description: `${newOrder.customer_name} הזמין/ה זר ל${newOrder.recipient_name}`,
          });
          if (activeTab !== "orders") {
            setNewOrderCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedShop, activeTab, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-body">טוען ממשק ניהול...</p>
        </div>
      </div>
    );
  }

  if (!isShopOwner && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <Store className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <h1 className="text-2xl font-display font-bold text-foreground">אין גישה</h1>
          <p className="text-muted-foreground font-body">
            אין לך הרשאות לגשת לממשק הניהול. פני למנהלת הפלטפורמה כדי להירשם כבעלת חנות.
          </p>
          <Button variant="hero-outline" className="rounded-xl gap-2" onClick={() => navigate("/")}>
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הראשי
          </Button>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "orders", label: "הזמנות", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "inventory", label: "מלאי", icon: <Package className="w-4 h-4" /> },
    { key: "restock", label: "הזמנה מספק", icon: <Truck className="w-4 h-4" /> },
    { key: "settings", label: "הגדרות", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="hidden sm:inline">חזרה</span>
            </button>
            <div className="h-5 w-px bg-border/50" />

            <div className="relative">
              <button
                onClick={() => shops.length > 1 && setShowShopPicker(!showShopPicker)}
                className={`flex items-center gap-2 ${shops.length > 1 ? "cursor-pointer hover:text-primary" : ""}`}
              >
                <Store className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-foreground text-sm">
                  {selectedShop?.name || "בחר חנות"}
                </span>
                {shops.length > 1 && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>

              {showShopPicker && shops.length > 1 && (
                <div className="absolute top-full mt-2 right-0 bg-card border border-border/50 rounded-xl shadow-elevated z-20 min-w-[200px] overflow-hidden">
                  {shops.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => {
                        setSelectedShop(shop);
                        setShowShopPicker(false);
                      }}
                      className={`w-full text-right px-4 py-3 text-sm font-body hover:bg-muted transition-colors ${selectedShop?.id === shop.id ? "bg-muted text-primary font-semibold" : "text-foreground"}`}
                    >
                      {shop.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/permissions")}
                className="text-muted-foreground hover:text-primary"
                title="ניהול הרשאות"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}
            <Logo size="sm" />
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => { await signOut(); navigate("/"); }}
              className="text-muted-foreground hover:text-destructive"
              title="התנתק"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6">
        <div className="flex gap-2 border-b border-border/50 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "orders") setNewOrderCount(0);
              }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold font-body rounded-t-xl transition-colors relative ${
                activeTab === tab.key
                  ? "text-primary bg-card border border-border/50 border-b-transparent -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === "orders" && newOrderCount > 0 && (
                <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
                  {newOrderCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          key={`${activeTab}-${selectedShop?.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "inventory" && selectedShop && <InventoryTab shopId={selectedShop.id} />}
          {activeTab === "orders" && selectedShop && <OrdersTab shopId={selectedShop.id} />}
          {activeTab === "restock" && selectedShop && <RestockTab shopId={selectedShop.id} />}
          {activeTab === "settings" && selectedShop && (
            <div className="max-w-xl space-y-6" dir="rtl">
              <h2 className="font-display text-2xl font-bold text-foreground">הגדרות חנות</h2>
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold font-body text-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    קישור לאתר החנות
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.example.com"
                    value={shopWebsite}
                    onChange={(e) => setShopWebsite(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground font-body">הקישור יופיע בכרטיסיית החנות ללקוחות</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold font-body text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    טלפון לקבלת הודעות WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="050-0000000"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground font-body">תקבל/י הודעת WhatsApp על כל הזמנה חדשה</p>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="hero"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={handleSaveSettings}
                    disabled={savingWebsite}
                  >
                    <Save className="w-4 h-4" />
                    {savingWebsite ? "שומר..." : "שמור"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
