import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
}

const ReviewModal = ({ open, onClose, shopId, shopName }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !customerName.trim()) {
      toast({ title: "שגיאה", description: "יש למלא שם ולבחור דירוג", variant: "destructive" });
      return;
    }

    if (customerName.trim().length > 100) {
      toast({ title: "שגיאה", description: "השם ארוך מדי", variant: "destructive" });
      return;
    }

    if (comment.length > 500) {
      toast({ title: "שגיאה", description: "התגובה ארוכה מדי (עד 500 תווים)", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        shop_id: shopId,
        customer_name: customerName.trim(),
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({ title: "תודה! ⭐", description: "הביקורת שלך נשלחה בהצלחה" });
      setRating(0);
      setCustomerName("");
      setComment("");
      onClose();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message || "לא ניתן לשלוח ביקורת", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            דרגו את {shopName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= displayRating
                        ? "fill-primary text-primary"
                        : "text-border"
                    }`}
                  />
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {displayRating > 0 && (
                <motion.span
                  key={displayRating}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground font-body"
                >
                  {["", "גרוע", "לא טוב", "סביר", "טוב", "מעולה!"][displayRating]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Name */}
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="השם שלך *"
            className="rounded-xl"
            maxLength={100}
          />

          {/* Comment */}
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ספרו על החוויה שלכם (אופציונלי)"
            className="rounded-xl resize-none min-h-[80px]"
            maxLength={500}
          />

          <Button
            variant="hero"
            className="w-full rounded-xl gap-2"
            onClick={handleSubmit}
            disabled={submitting || !rating || !customerName.trim()}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                שלח ביקורת
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
