import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BouquetRecommendation, BouquetFlower } from "@/components/bouquet-chat/BouquetCard";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const STEPS = {
  RECIPIENT: "recipient",
  OCCASION: "occasion",
  BUDGET: "budget",
  COLORS: "colors",
  NOTES: "notes",
  RECOMMEND: "recommend",
} as const;

export type StepKey = (typeof STEPS)[keyof typeof STEPS];

export const RECIPIENT_OPTIONS = [
  { emoji: "🌸", label: "זר לעצמי", value: "זר לעצמי" },
  { emoji: "💕", label: "בן/בת זוג", value: "בן/בת זוג" },
  { emoji: "👨‍👩‍👧", label: "בן/בת משפחה", value: "בן/בת משפחה" },
  { emoji: "🤝", label: "חבר/ה", value: "חבר/ה" },
  { emoji: "👔", label: "עמית/ה בעבודה", value: "עמית/ה בעבודה" },
];

export const OCCASION_OPTIONS = [
  { emoji: "🎂", label: "יום הולדת", value: "יום הולדת" },
  { emoji: "💍", label: "יום נישואין", value: "יום נישואין" },
  { emoji: "👰", label: "חתונה", value: "חתונה" },
  { emoji: "🍼", label: "לידה", value: "לידה" },
  { emoji: "🕯️", label: "הלוויה", value: "הלוויה" },
  { emoji: "🏥", label: "החלמה", value: "החלמה" },
  { emoji: "🙏", label: "תודה", value: "תודה" },
  { emoji: "🎓", label: "סיום לימודים", value: "סיום לימודים" },
  { emoji: "🏆", label: "הצלחה/קידום", value: "הצלחה/קידום" },
  { emoji: "❤️", label: "רומנטי", value: "רומנטי" },
  { emoji: "🌟", label: "סתם כך", value: "סתם כך" },
];

export const COLOR_OPTIONS = [
  "אדום, ורוד",
  "אדום, לבן",
  "צהוב, כתום",
  "לבן, ירוק",
  "סגול, ורוד",
  "לבן, ורוד",
  "לבן, סגול",
  "לבן, ורוד, סגול",
  "צבעוני",
];

const INITIAL_MESSAGE = `🌸 ברוכים הבאים לבונה הזרים החכם!

אני כאן כדי לעזור לכם ליצור את הזר המושלם, מותאם בדיוק לצרכים שלכם 💫

בואו נתחיל — **למי אתם רוצים להכין את הזר הזה?**`;

export interface WizardAnswers {
  recipient?: string;
  occasion?: string;
  budget?: string;
  colors?: string;
  notes?: string;
}

interface PendingBouquet {
  recommendation: BouquetRecommendation;
  priceDifference: number;
}

export function useBouquetWizard(shopId: string | null, mode?: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_MESSAGE },
  ]);
  const [currentStep, setCurrentStep] = useState<StepKey>(STEPS.RECIPIENT);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<BouquetRecommendation | null>(null);
  const [pendingBouquet, setPendingBouquet] = useState<PendingBouquet | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Auto-trigger special modes (high-stock or promote-flower)
  const triggerAutoMode = useCallback(async (params: URLSearchParams) => {
    if (autoTriggered || isLoading) return;
    setAutoTriggered(true);

    const currentMode = params.get("mode");
    const flowerName = params.get("flowerName");
    const flowerColor = params.get("flowerColor");

    const loadingMsg = currentMode === "promote-flower" && flowerName
      ? `✨ מייצר זר עם דגש על ${flowerName}${flowerColor ? ` (${flowerColor})` : ""}...`
      : "🌿 מייצר המלצה לזר מהמלאי הגבוה ביותר...";

    setMessages([{ role: "assistant", content: loadingMsg }]);
    setCurrentStep(STEPS.RECOMMEND);
    setIsLoading(true);

    try {
      const body: Record<string, any> = { action: currentMode, shopId };
      if (currentMode === "promote-flower") {
        body.flowerName = flowerName;
        body.flowerColor = flowerColor || undefined;
      }

      const { data, error } = await supabase.functions.invoke("bouquet-ai", { body });
      if (error) throw error;

      const rec: BouquetRecommendation = {
        flowers: data.flowers,
        total_price: data.total_price,
        flowers_cost: data.flowers_cost,
        digital_design_fee: data.digital_design_fee,
        message: data.message,
      };

      setRecommendation(rec);
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (err: any) {
      console.error("Auto-mode generate error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "מצטער/ת, נתקלתי בבעיה טכנית. נסו שוב 😔" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [autoTriggered, isLoading, shopId]);

  // Auto-trigger when mode is set
  useEffect(() => {
    if (mode === "high-stock" || mode === "promote-flower") {
      const params = new URLSearchParams(window.location.search);
      triggerAutoMode(params);
    }
  }, [mode, triggerAutoMode]);

  const handleStepAnswer = useCallback(
    async (answer: string) => {
      if (isLoading) return;

      setMessages((prev) => [...prev, { role: "user", content: answer }]);

      const newAnswers = { ...answers };
      let nextMessage = "";
      let nextStep = currentStep;

      if (currentStep === STEPS.RECIPIENT) {
        newAnswers.recipient = answer;
        nextMessage = `מעולה! 🌿 **עכשיו, לאיזה אירוע או הזדמנות הזר הזה?**`;
        nextStep = STEPS.OCCASION;
      } else if (currentStep === STEPS.OCCASION) {
        newAnswers.occasion = answer;
        const isSensitive = answer.includes("הלוויה") || answer.includes("אבל");
        nextMessage = isSensitive
          ? `אני מבינ/ה ומעריכ/ה. אצור זר יפה שמבטא כבוד וקרבה. **מה התקציב שלכם? (בשקלים)**`
          : `יפה! 💚 **עכשיו בואו נדבר על התקציב — כמה אתם רוצים להשקיע? (בשקלים)**`;
        nextStep = STEPS.BUDGET;
      } else if (currentStep === STEPS.BUDGET) {
        const budgetAmount = parseFloat(answer.replace(/[^\d.]/g, ""));
        if (isNaN(budgetAmount) || budgetAmount <= 0) {
          nextMessage = `מצטער/ת, לא הבנתי את הסכום. אפשר לכתוב מספר בשקלים? לדוגמה: 300 או ₪250`;
          nextStep = STEPS.BUDGET;
        } else {
          newAnswers.budget = String(budgetAmount);
          nextMessage = `מצוין! אצור משהו יפה מאוד. 🎨 **איזה צבעים אתם אוהבים?**`;
          nextStep = STEPS.COLORS;
        }
      } else if (currentStep === STEPS.COLORS) {
        newAnswers.colors = answer;
        nextMessage = `יופי! הצבעים האלה יהיו מושלמים. ✨ **יש משהו נוסף שתרצו שאדע?** (או לחצו "המשך")`;
        nextStep = STEPS.NOTES;
      } else if (currentStep === STEPS.NOTES) {
        newAnswers.notes = answer;
        setAnswers(newAnswers);
        setCurrentStep(STEPS.RECOMMEND);

        // Generate bouquet
        setIsLoading(true);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "🪄 מעצב/ת את הזר המושלם עבורכם..." },
        ]);

        try {
          const { data, error } = await supabase.functions.invoke("bouquet-ai", {
            body: { action: "generate", shopId, answers: newAnswers },
          });

          if (error) throw error;

          const rec: BouquetRecommendation = {
            flowers: data.flowers,
            total_price: data.total_price,
            flowers_cost: data.flowers_cost,
            digital_design_fee: data.digital_design_fee,
            message: data.message,
          };

          setRecommendation(rec);
          setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        } catch (err: any) {
          console.error("Generate error:", err);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "מצטער/ת, נתקלתי בבעיה טכנית. נסו שוב 😔" },
          ]);
          setCurrentStep(STEPS.NOTES);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setAnswers(newAnswers);

      // Simulate brief delay for natural feel
      setIsLoading(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: nextMessage }]);
        setCurrentStep(nextStep);
        setIsLoading(false);
      }, 400);
    },
    [isLoading, answers, currentStep, shopId]
  );

  const handleModify = useCallback(
    async (userMessage: string) => {
      if (!recommendation || isLoading) return;

      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke("bouquet-ai", {
          body: {
            action: "modify",
            shopId,
            answers,
            currentBouquet: recommendation,
            userMessage,
          },
        });

        if (error) throw error;

        const newRec: BouquetRecommendation = {
          flowers: data.flowers,
          total_price: data.total_price,
          flowers_cost: data.flowers_cost,
          digital_design_fee: data.digital_design_fee,
          message: data.message,
        };

        const budget = parseFloat(answers.budget || "0");

        // Check budget
        if (newRec.total_price > budget && budget > 0) {
          setPendingBouquet({
            recommendation: newRec,
            priceDifference: newRec.total_price - budget,
          });
          setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        } else {
          setRecommendation(newRec);
          setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        }
      } catch (err: any) {
        console.error("Modify error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "מצטער/ת, נתקלתי בבעיה. נסו שוב 😔" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [recommendation, isLoading, shopId, answers]
  );

  const handleApproveBudgetIncrease = useCallback(() => {
    if (!pendingBouquet) return;
    setAnswers((prev) => ({
      ...prev,
      budget: String(pendingBouquet.recommendation.total_price),
    }));
    setRecommendation(pendingBouquet.recommendation);
    setPendingBouquet(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `מעולה! 🎉 עדכנתי את התקציב ל-₪${pendingBouquet.recommendation.total_price}. הזר שלכם מוכן!`,
      },
    ]);
  }, [pendingBouquet]);

  const handleRejectBudgetIncrease = useCallback(() => {
    setPendingBouquet(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "בסדר גמור! הזר הקודם נשמר. תוכלו לבקש שינוי אחר שמתאים לתקציב 🌿",
      },
    ]);
  }, []);

  const handleModifyRequest = useCallback(() => {
    if (!recommendation) return;
    const currentFlowersList = recommendation.flowers
      .map((f) => `• ${f.quantity} ${f.color || ""} ${f.name}`)
      .join("\n");

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `בשמחה! 🌸\n\n**הזר הנוכחי שלכם:**\n${currentFlowersList}\n**סה״כ:** ₪${recommendation.total_price}\n\n**מה תרצו לשנות?**\nכתבו בדיוק מה אתם רוצים, למשל:\n- "תחליפו את הורדים האדומים בלבנים"\n- "תוסיפו 2 חמניות צהובות"\n- "תורידו את הגרברות"`,
      },
    ]);
  }, [recommendation]);

  const reset = useCallback(() => {
    setMessages([{ role: "assistant", content: INITIAL_MESSAGE }]);
    setCurrentStep(STEPS.RECIPIENT);
    setAnswers({});
    setRecommendation(null);
    setPendingBouquet(null);
    setIsLoading(false);
  }, []);

  return {
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
  };
}
