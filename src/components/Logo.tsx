import { useNavigate } from "react-router-dom";
import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  layout?: "horizontal" | "vertical";
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-36 h-36",
};

const textSizeMap = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-3xl",
};

const Logo = ({ size = "md", showText = true, className = "", layout = "horizontal" }: LogoProps) => {
  const isVertical = layout === "vertical";
  const navigate = useNavigate();

  return (
    <div
      className={`flex ${isVertical ? "flex-col items-center gap-2" : "items-center gap-3"} cursor-pointer ${className}`}
      onClick={() => navigate("/")}
    >
      <img src={logoImage} alt="Nuphar Flowers AI" className={`${sizeMap[size]} object-contain mix-blend-multiply`} />
      {showText && (
        <span className={`font-brand ${textSizeMap[size]} text-foreground tracking-wide ${isVertical ? "text-center" : ""}`}>
          Nuphar Flowers AI
        </span>
      )}
    </div>
  );
};

export default Logo;
