import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const textSizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={logoImage} alt="Nuphar Flowers AI" className={`${sizeMap[size]} object-contain`} />
      {showText && (
        <span className={`font-brand ${textSizeMap[size]} font-semibold text-foreground tracking-wide`}>
          Nuphar Flowers AI
        </span>
      )}
    </div>
  );
};

export default Logo;
