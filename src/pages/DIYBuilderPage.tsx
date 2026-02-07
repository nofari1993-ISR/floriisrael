import { ArrowRight, Palette } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "@/components/Logo";

const DIYBuilderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shopId");

  const iframeSrc = shopId
    ? `https://nupharflowersai.com/BouquetStudioEmbed?shopId=${shopId}`
    : "https://nupharflowersai.com/BouquetStudioEmbed";

  return (
    <div className="h-screen flex flex-col bg-gradient-hero">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </button>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <Logo size="sm" />
          </div>
        </div>
      </div>

      {/* Iframe content */}
      <div className="flex-1 min-h-0">
        <iframe
          src={iframeSrc}
          title="Bouquet Studio - DIY Builder"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            minHeight: "600px",
          }}
          scrolling="yes"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
};

export default DIYBuilderPage;
