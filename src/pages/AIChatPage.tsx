import { useNavigate, useSearchParams } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { Loader2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import nupharAvatar from "@/assets/nuphar-avatar.png";

import BouquetChatHeader from "@/components/bouquet-chat/BouquetChatHeader";
import BouquetChatMessage from "@/components/bouquet-chat/BouquetChatMessage";
import BouquetCard from "@/components/bouquet-chat/BouquetCard";
import BudgetModal from "@/components/bouquet-chat/BudgetModal";
import StepOptionButtons from "@/components/bouquet-chat/StepOptionButtons";
import {
  useBouquetWizard,
  STEPS,
  RECIPIENT_OPTIONS,
  OCCASION_OPTIONS,
  COLOR_OPTIONS,
  STYLE_OPTIONS,
} from "@/hooks/useBouquetWizard";
import { useShopOwner } from "@/hooks/useShopOwner";

const AIChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramShopId = searchParams.get("shopId");
  const mode = searchParams.get("mode");

  // Fallback to the user's own shop if no shopId in URL
  const { shops } = useShopOwner();
  const shopId = paramShopId || (shops.length > 0 ? shops[0].id : null);

  const {
    messages,
    currentStep,
    answers,
    isLoading,
    recommendation,
    pendingBouquet,
    handleStepAnswer,
    handleModify,
    handleModifyRequest,
    handleApproveBudgetIncrease,
    handleRejectBudgetIncrease,
    reset,
  } = useBouquetWizard(shopId, mode);

  const [input, setInput] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    if (recommendation) {
      handleModify(input.trim());
    } else {
      handleStepAnswer(input.trim());
    }
    setInput("");
  };

  const handleAcceptBouquet = () => {
    if (!recommendation || !shopId) return;

    const items = recommendation.flowers.map((f) => ({
      flower_name: f.name,
      flower_id: "",
      quantity: f.quantity,
      unit_price: f.unit_price,
      color: f.color || "",
    }));

    navigate(`/checkout?shopId=${shopId}`, {
      state: {
        diyItems: items,
        totalPrice: recommendation.total_price,
        isDIY: true,
      },
    });
  };


  // Determine which step options to show
  const showRecipientOptions = currentStep === STEPS.RECIPIENT && !recommendation;
  const showOccasionOptions = currentStep === STEPS.OCCASION && !recommendation;
  const showColorOptions = currentStep === STEPS.COLORS && !recommendation;
  const showStyleOptions = currentStep === STEPS.STYLE && !recommendation;
  const showNotesSkip = currentStep === STEPS.NOTES && !recommendation;

  return (
    <div className="h-screen flex flex-col bg-gradient-hero">
      <BouquetChatHeader onBack={() => navigate("/?shops=open")} backLabel="חזרה לחנויות" />

      <div className="flex-1 min-h-0 flex flex-col max-w-3xl mx-auto w-full">
        {/* Bouquet recommendation card (sticky top) */}
        {recommendation && (
          <div className="px-4 pt-3 flex-shrink-0">
            <BouquetCard
              recommendation={recommendation}
              onAccept={handleAcceptBouquet}
              onModify={handleModifyRequest}
              onReset={reset}
            />
          </div>
        )}

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${recommendation ? "min-h-[30vh]" : ""}`}>
          {messages.map((msg, i) => (
            <BouquetChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center overflow-hidden">
                <img src={nupharAvatar} alt="Flori" className="w-8 h-8 object-cover" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom controls */}
        <div className="flex-shrink-0 p-3 border-t border-border/50 bg-card/80 backdrop-blur-sm space-y-2">
          {/* Step option buttons */}
          {showRecipientOptions && (
            <StepOptionButtons options={RECIPIENT_OPTIONS} onSelect={handleStepAnswer} disabled={isLoading} />
          )}
          {showOccasionOptions && (
            <StepOptionButtons options={OCCASION_OPTIONS} onSelect={handleStepAnswer} disabled={isLoading} />
          )}
          {showColorOptions && (
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleStepAnswer(color)}
                  disabled={isLoading}
                  className="bg-card border border-border hover:border-primary/40 rounded-lg py-2 text-xs font-body font-medium text-foreground transition-all disabled:opacity-50 hover:shadow-soft"
                >
                  {color}
                </button>
              ))}
              <button
                onClick={() => inputRef.current?.focus()}
                disabled={isLoading}
                className="bg-card border border-dashed border-primary/40 hover:border-primary rounded-lg py-2 text-xs font-body font-medium text-primary transition-all disabled:opacity-50 hover:shadow-soft"
              >
                ✏️ צבע אחר
              </button>
            </div>
          )}
          {showStyleOptions && (
            <StepOptionButtons options={STYLE_OPTIONS} onSelect={handleStepAnswer} disabled={isLoading} />
          )}
          {showNotesSkip && (
            <Button
              onClick={() => handleStepAnswer("המשך")}
              disabled={isLoading}
              variant="hero"
              className="w-full rounded-xl mb-2"
            >
              המשך ליצירת הזר ✨
            </Button>
          )}

          {/* Text input */}
          <div className="flex gap-2">
            {!recommendation && (
              <Button variant="ghost" size="icon" onClick={reset} className="shrink-0 rounded-xl">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={recommendation ? "תארו את השינוי..." : "או כתבו תשובה..."}
              disabled={isLoading}
              className="flex-1 bg-muted rounded-xl px-4 py-3 outline-none font-body text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-shadow disabled:opacity-50"
            />
            <Button
              variant="hero"
              size="icon"
              className="rounded-xl w-11 h-11 shrink-0"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Budget increase modal */}
      <BudgetModal
        open={!!pendingBouquet}
        onOpenChange={() => {}}
        originalBudget={parseFloat(answers.budget || "0")}
        newPrice={pendingBouquet?.recommendation.total_price || 0}
        difference={pendingBouquet?.priceDifference || 0}
        onApprove={handleApproveBudgetIncrease}
        onReject={handleRejectBudgetIncrease}
      />
    </div>
  );
};

export default AIChatPage;
