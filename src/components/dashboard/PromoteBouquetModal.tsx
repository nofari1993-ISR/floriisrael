import { useState } from "react";
import { Loader2, Flower2, ImageIcon, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FullscreenImageModal from "@/components/diy-builder/FullscreenImageModal";
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
  image_url?: string | null;
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
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
              ה-AI בונה זר ומייצר תמונה...
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
            {/* Bouquet Image */}
            {result.image_url && (
              <div
                className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted/30 max-h-64 cursor-pointer group"
                onClick={() => setFullscreenOpen(true)}
              >
                {!imageLoaded && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                )}
                <img
                  src={result.image_url}
                  alt={`זר עם ${flowerName}`}
                  className={`w-full object-cover transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0 h-0"}`}
                  onLoad={() => setImageLoaded(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
            )}

            <FullscreenImageModal
              imageUrl={result.image_url || null}
              isOpen={fullscreenOpen}
              onClose={() => setFullscreenOpen(false)}
            />

            {!result.image_url && (
              <div className="flex items-center justify-center py-8 bg-muted/30 rounded-2xl border border-border/50">
                <div className="text-center space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground font-body">לא נוצרה תמונה</p>
                </div>
              </div>
            )}

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
