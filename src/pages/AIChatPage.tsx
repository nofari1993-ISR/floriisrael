import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Logo from "@/components/Logo";

const AIChatPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === "CHECKOUT" && event.data?.url) {
        window.location.href = event.data.url;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
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

      {/* Page scrolls naturally, iframe has large height */}
      <div style={{ paddingTop: "56px" }}>
        <iframe
          src="https://nupharflowersai.base44.app/AIBouquetBuilderEmbed"
          title="AI Bouquet Builder Chat"
          style={{
            width: "100%",
            height: "1800px",
            border: "none",
            display: "block",
          }}
          allow="clipboard-write"
          loading="lazy"
        />
      </div>
    </>
  );
};

export default AIChatPage;
