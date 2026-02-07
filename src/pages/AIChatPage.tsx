import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Logo from "@/components/Logo";

const AIChatPage = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "resize" && iframeRef.current) {
        iframeRef.current.style.height = `${event.data.height}px`;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
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
      <div 
        className="flex-1"
        style={{ 
          overflowY: "auto", 
          WebkitOverflowScrolling: "touch",
        }}
      >
        <iframe
          ref={iframeRef}
          src="https://nupharflowersai.base44.app/AIBouquetBuilderEmbed"
          title="AI Bouquet Builder Chat"
          className="w-full"
          style={{ 
            height: "2000px",
            border: "none",
          }}
          allow="clipboard-write"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default AIChatPage;
