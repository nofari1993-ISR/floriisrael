import { useState, useCallback, useEffect } from "react";
import type { FlowerData } from "@/components/diy-builder/FlowerCard";
import type { SelectedFlower } from "@/components/diy-builder/BouquetSummary";

const STORAGE_KEY = "diy_bouquet";

function loadFromStorage(): SelectedFlower[] {
  try {
    // If a successful order was just placed, clear the cart
    if (sessionStorage.getItem("clearDIYCart") === "1") {
      sessionStorage.removeItem("clearDIYCart");
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveToStorage(flowers: SelectedFlower[]) {
  try {
    if (flowers.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flowers));
    }
  } catch {}
}

export function useDIYBuilder() {
  const [selectedFlowers, setSelectedFlowers] = useState<SelectedFlower[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(selectedFlowers);
  }, [selectedFlowers]);

  // Handle browser back/forward cache (bfcache) — reload from localStorage
  // so a cleared cart is reflected even when page is restored from cache
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setSelectedFlowers(loadFromStorage());
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleAddFlower = useCallback((flower: FlowerData, addCount: number = 1) => {
    setSelectedFlowers((prev) => {
      // quantity=0 means binary inventory (unlimited stock) — use Infinity as max
      const maxStock = flower.quantity > 0 ? flower.quantity : Infinity;
      const existing = prev.find((f) => f.flower.id === flower.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + addCount, maxStock);
        if (newQty === existing.quantity) return prev;
        return prev.map((f) =>
          f.flower.id === flower.id ? { ...f, quantity: newQty } : f
        );
      }
      return [...prev, { flower, quantity: Math.min(addCount, maxStock) }];
    });
  }, []);

  const handleRemoveFlower = useCallback((flower: FlowerData) => {
    setSelectedFlowers((prev) => {
      const existing = prev.find((f) => f.flower.id === flower.id);
      if (existing && existing.quantity > 1) {
        return prev.map((f) =>
          f.flower.id === flower.id ? { ...f, quantity: f.quantity - 1 } : f
        );
      }
      return prev.filter((f) => f.flower.id !== flower.id);
    });
  }, []);

  const handleRemoveFromSummary = useCallback((flowerId: string) => {
    setSelectedFlowers((prev) => prev.filter((f) => f.flower.id !== flowerId));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFlowers([]);
  }, []);

  const getQuantity = useCallback(
    (flowerId: string) => {
      return selectedFlowers.find((f) => f.flower.id === flowerId)?.quantity || 0;
    },
    [selectedFlowers]
  );

  const totalPrice = selectedFlowers.reduce(
    (sum, item) => sum + item.flower.price * item.quantity,
    0
  );
  const totalItems = selectedFlowers.reduce((sum, item) => sum + item.quantity, 0);

  return {
    selectedFlowers,
    handleAddFlower,
    handleRemoveFlower,
    handleRemoveFromSummary,
    clearAll,
    getQuantity,
    totalPrice,
    totalItems,
  };
}
