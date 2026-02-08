import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface BudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalBudget: number;
  newPrice: number;
  difference: number;
  onApprove: () => void;
  onReject: () => void;
}

const BudgetModal = ({
  open,
  onOpenChange,
  originalBudget,
  newPrice,
  difference,
  onApprove,
  onReject,
}: BudgetModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <AlertCircle className="w-5 h-5 text-destructive" />
            חריגה מהתקציב
          </DialogTitle>
          <DialogDescription className="text-right pt-4 font-body">
            השינוי שביקשת גורם לחריגה מהתקציב המקורי
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm font-body">
              <span className="text-muted-foreground">תקציב מקורי:</span>
              <span className="font-semibold text-foreground">₪{originalBudget}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-muted-foreground">מחיר חדש:</span>
              <span className="font-semibold text-destructive">₪{newPrice}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-body">
              <span className="text-muted-foreground">הפרש:</span>
              <span className="font-bold text-destructive">+₪{difference}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center font-body">
            האם תרצו להעלות את התקציב כדי לקבל את הזר המעודכן?
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-3">
          <Button variant="outline" onClick={onReject} className="flex-1 rounded-xl font-body">
            לא, תישאר בתקציב
          </Button>
          <Button variant="hero" onClick={onApprove} className="flex-1 rounded-xl font-body">
            אשר העלאת תקציב
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetModal;
