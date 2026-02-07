import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AIChatPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">צ׳אט פרחים AI</span>
            <span className="text-2xl">🌸</span>
          </div>
        </div>
      </div>

      {/* Iframe Content */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden shadow-elevated border border-border/50 h-full"
        >
          <iframe
            src="https://nupharflowersai.base44.app/AIBouquetBuilderEmbed"
            title="AI Bouquet Builder Chat"
            className="w-full border-0"
            style={{ height: "min(800px, 80vh)" }}
            allow="clipboard-write"
            loading="lazy"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AIChatPage;
