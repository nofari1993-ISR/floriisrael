import { useState } from "react";
import { Truck, Package, Check, AlertTriangle, Flower2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventory, type Flower } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";

interface RestockTabProps {
  shopId: string;
}

const LOW_STOCK_THRESHOLD = 15;
const DEFAULT_RESTOCK_AMOUNT = 50;

const RestockTab = ({ shopId }: RestockTabProps) => {
  const { flowers, loading, updateFlower, refetch } = useInventory(shopId);
  const { toast } = useToast();
  const [restockAmounts, setRestockAmounts] = useState<Record<string, number>>({});
  const [restockingIds, setRestockingIds] = useState<Set<string>>(new Set());
  const [restockedIds, setRestockedIds] = useState<Set<string>>(new Set());

  const getRestockAmount = (flowerId: string) => {
    return restockAmounts[flowerId] ?? DEFAULT_RESTOCK_AMOUNT;
  };

  const setAmount = (flowerId: string, amount: number) => {
    setRestockAmounts((prev) => ({ ...prev, [flowerId]: Math.max(1, amount) }));
  };

  const handleRestock = async (flower: Flower) => {
    const amount = getRestockAmount(flower.id);
    setRestockingIds((prev) => new Set(prev).add(flower.id));

    const success = await updateFlower(flower.id, {
      quantity: flower.quantity + amount,
    });

    setRestockingIds((prev) => {
      const next = new Set(prev);
      next.delete(flower.id);
      return next;
    });

    if (success) {
      setRestockedIds((prev) => new Set(prev).add(flower.id));
      toast({
        title: `${flower.name} עודכן בהצלחה! 📦`,
        description: `נוספו ${amount} יחידות. מלאי חדש: ${flower.quantity + amount}`,
      });

      // Clear the "restocked" indicator after 3 seconds
      setTimeout(() => {
        setRestockedIds((prev) => {
          const next = new Set(prev);
          next.delete(flower.id);
          return next;
        });
      }, 3000);
    }
  };

  const handleRestockAll = async () => {
    const lowStockFlowers = flowers.filter(
      (f) => f.quantity <= LOW_STOCK_THRESHOLD
    );

    if (lowStockFlowers.length === 0) {
      toast({ title: "כל הפרחים במלאי מלא! 🌸" });
      return;
    }

    for (const flower of lowStockFlowers) {
      await handleRestock(flower);
    }

    await refetch();
  };

  const lowStockCount = flowers.filter(
    (f) => f.quantity <= LOW_STOCK_THRESHOLD
  ).length;

  const outOfStockCount = flowers.filter(
    (f) => f.quantity === 0 || !f.in_stock
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            הזמנה מספק
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            עדכון מלאי כשמגיעה סחורה חדשה
          </p>
        </div>
        {lowStockCount > 0 && (
          <Button
            variant="hero"
            className="rounded-xl gap-2"
            onClick={handleRestockAll}
          >
            <Truck className="w-4 h-4" />
            מלא הכל ({lowStockCount})
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-foreground">
              {flowers.length}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              סוגי פרחים
            </p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-amber-200 dark:border-amber-800/50 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400">
              {lowStockCount}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              מלאי נמוך
            </p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-destructive/30 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-destructive">
              {outOfStockCount}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              אזל מהמלאי
            </p>
          </div>
        </div>
      </div>

      {/* Flowers Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground font-body">
          טוען מלאי...
        </div>
      ) : flowers.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
          <p className="font-display text-xl font-semibold text-muted-foreground">
            אין פרחים במלאי
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right font-display font-semibold">
                  פרח
                </TableHead>
                <TableHead className="text-right font-display font-semibold">
                  צבע
                </TableHead>
                <TableHead className="text-right font-display font-semibold">
                  מלאי נוכחי
                </TableHead>
                <TableHead className="text-right font-display font-semibold">
                  סטטוס
                </TableHead>
                <TableHead className="text-right font-display font-semibold">
                  כמות להוספה
                </TableHead>
                <TableHead className="text-right font-display font-semibold w-[120px]">
                  פעולה
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flowers
                .sort((a, b) => a.quantity - b.quantity) // Low stock first
                .map((flower) => {
                  const isLowStock =
                    flower.quantity > 0 &&
                    flower.quantity <= LOW_STOCK_THRESHOLD;
                  const isOutOfStock =
                    flower.quantity === 0 || !flower.in_stock;
                  const isRestocking = restockingIds.has(flower.id);
                  const isRestocked = restockedIds.has(flower.id);

                  return (
                    <TableRow
                      key={flower.id}
                      className={`${
                        isRestocked
                          ? "bg-green-50/50 dark:bg-green-950/20"
                          : isOutOfStock
                          ? "bg-destructive/5"
                          : isLowStock
                          ? "bg-amber-50/50 dark:bg-amber-950/20"
                          : ""
                      }`}
                    >
                      <TableCell className="font-display font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <Flower2 className="w-4 h-4 text-primary/60 shrink-0" />
                          {flower.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-body">
                        {flower.color || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {(isLowStock || isOutOfStock) && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span
                            className={`font-body font-semibold ${
                              isOutOfStock
                                ? "text-destructive"
                                : isLowStock
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {flower.quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isRestocked ? (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" />
                            עודכן
                          </span>
                        ) : isOutOfStock ? (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-destructive/10 text-destructive">
                            אזל
                          </span>
                        ) : isLowStock ? (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            מלאי נמוך
                          </span>
                        ) : (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-sage-light text-sage">
                            במלאי
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() =>
                              setAmount(
                                flower.id,
                                getRestockAmount(flower.id) - 10
                              )
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            value={getRestockAmount(flower.id)}
                            onChange={(e) =>
                              setAmount(flower.id, Number(e.target.value) || 1)
                            }
                            className="w-16 h-8 rounded-lg text-center text-sm"
                            min="1"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() =>
                              setAmount(
                                flower.id,
                                getRestockAmount(flower.id) + 10
                              )
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={isOutOfStock || isLowStock ? "hero" : "hero-outline"}
                          size="sm"
                          className="rounded-xl gap-1.5 text-xs"
                          onClick={() => handleRestock(flower)}
                          disabled={isRestocking}
                        >
                          {isRestocking ? (
                            <>
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              מעדכן...
                            </>
                          ) : (
                            <>
                              <Truck className="w-3.5 h-3.5" />
                              הגיעה סחורה
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default RestockTab;
