import { ArrowRight, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";

interface BouquetChatHeaderProps {
  onBack: () => void;
  backLabel?: string;
}

const BouquetChatHeader = ({ onBack, backLabel = "חזרה" }: BouquetChatHeaderProps) => {
  return (
    <div className="flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          {backLabel}
        </button>
        <Logo size="sm" />
      </div>
    </div>
  );
};

export default BouquetChatHeader;
