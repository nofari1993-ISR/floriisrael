import { useState, useCallback } from "react";
import type { FlowerData } from "@/components/diy-builder/FlowerCard";
import type { SelectedFlower } from "@/components/diy-builder/BouquetSummary";

export function useDIYBuilder() {
  const [selectedFlowers, setSelectedFlowers] = useState<SelectedFlower[]>([]);

  const handleAddFlower = useCallback((flower: FlowerData, addCount: number = 1) => {
    setSelectedFlowers((prev) => {
      const existing = prev.find((f) => f.flower.id === flower.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + addCount, flower.quantity);
        if (newQty === existing.quantity) return prev;
        return prev.map((f) =>
          f.flower.id === flower.id ? { ...f, quantity: newQty } : f
        );
      }
      return [...prev, { flower, quantity: Math.min(addCount, flower.quantity) }];
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
