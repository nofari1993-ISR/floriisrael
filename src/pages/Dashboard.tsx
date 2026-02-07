import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ClipboardList, Store, ArrowRight, LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useShopOwner } from "@/hooks/useShopOwner";
import { useAuth } from "@/hooks/useAuth";
import InventoryTab from "@/components/dashboard/InventoryTab";
import OrdersTab from "@/components/dashboard/OrdersTab";

type Tab = "inventory" | "orders";

const Dashboard = () => {
  const navigate = useNavigate();
  const { shop, isShopOwner, isAdmin, loading, user } = useShopOwner();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

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
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
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
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-foreground text-sm">
                {shop?.name || "ממשק ניהול"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex gap-2 border-b border-border/50 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold font-body rounded-t-xl transition-colors relative ${
                activeTab === tab.key
                  ? "text-primary bg-card border border-border/50 border-b-transparent -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "inventory" && shop && <InventoryTab shopId={shop.id} />}
          {activeTab === "orders" && shop && <OrdersTab shopId={shop.id} />}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
