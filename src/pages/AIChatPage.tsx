import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const AIChatPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <Logo size="sm" />
          </div>
        </div>
      </div>

      {/* Iframe Content */}
      <div className="flex-1 overflow-y-auto">
        <iframe
          src="https://nupharflowersai.base44.app/AIBouquetBuilderEmbed"
          title="AI Bouquet Builder Chat"
          width="100%"
          height="100%"
          style={{ minHeight: "900px", border: "none" }}
          scrolling="yes"
          allow="clipboard-write"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default AIChatPage;
