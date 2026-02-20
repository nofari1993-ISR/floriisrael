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
  md: "w-12 h-12",
  lg: "w-24 h-24 md:w-32 md:h-32",
};

const textSizeMap = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-3xl md:text-4xl",
};

const Logo = ({ size = "md", showText = true, className = "", layout = "horizontal" }: LogoProps) => {
  const isVertical = layout === "vertical";
  const navigate = useNavigate();

  return (
    <div
      className={`flex ${isVertical ? "flex-col items-center gap-2" : "items-center gap-3"} cursor-pointer ${className}`}
      onClick={() => navigate("/")}
    >
      <img src={logoImage} alt="Flori" className={`${sizeMap[size]} object-contain`} />
      {showText && (
        <span className={`${textSizeMap[size]} text-foreground tracking-wide ${isVertical ? "text-center" : ""}`} style={{ fontFamily: "'Pacifico', cursive" }}>
          Flori
        </span>
      )}
    </div>
  );
};

export default Logo;
