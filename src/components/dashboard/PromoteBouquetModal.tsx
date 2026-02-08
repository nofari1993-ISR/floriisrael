import { Loader2, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

export interface BouquetFlowerResult {
  name: string;
  quantity: number;
  unit_price: number;
  color: string;
  line_total: number;
}

export interface PromoteBouquetResult {
  message: string;
  flowers: BouquetFlowerResult[];
  flowers_cost: number;
  digital_design_fee: number;
  total_price: number;
}

interface PromoteBouquetModalProps {
  open: boolean;
  onClose: () => void;
  flowerName: string;
  flowerColor?: string;
  isLoading: boolean;
  result: PromoteBouquetResult | null;
  error: string | null;
}

const PromoteBouquetModal = ({
  open,
  onClose,
  flowerName,
  flowerColor,
  isLoading,
  result,
  error,
}: PromoteBouquetModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-right flex items-center gap-2">
            <Flower2 className="w-5 h-5 text-primary" />
            זר עם דגש על {flowerName}{flowerColor ? ` (${flowerColor})` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-body">
              ה-AI בונה זר מותאם...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-destructive font-body">{error}</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={onClose}>
              סגור
            </Button>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-4">
            {/* AI Message */}
            <div className="bg-muted/50 rounded-xl p-3 text-sm font-body text-foreground prose prose-sm max-w-none">
              <ReactMarkdown>{result.message}</ReactMarkdown>
            </div>

            {/* Flowers list */}
            <div className="space-y-2">
              <h4 className="text-sm font-display font-semibold text-foreground">הרכב הזר:</h4>
              {result.flowers.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-card border border-border/50 rounded-xl px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-body font-semibold text-foreground">
                      {f.name}
                    </span>
                    {f.color && (
                      <span className="text-xs text-muted-foreground font-body">
                        ({f.color})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-body">
                    <span className="text-muted-foreground">×{f.quantity}</span>
                    <span className="font-semibold text-foreground">₪{f.line_total}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <span className="text-sm font-body text-muted-foreground">עלות פרחים</span>
              <span className="font-semibold text-foreground">₪{result.flowers_cost}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-body text-muted-foreground">דמי עיצוב (5%)</span>
              <span className="font-semibold text-foreground">₪{result.digital_design_fee}</span>
            </div>
            <div className="flex items-center justify-between bg-primary/5 rounded-xl px-3 py-2">
              <span className="font-display font-bold text-foreground">סה״כ</span>
              <span className="font-display font-bold text-primary text-lg">₪{result.total_price}</span>
            </div>

            <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
              סגור
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PromoteBouquetModal;
