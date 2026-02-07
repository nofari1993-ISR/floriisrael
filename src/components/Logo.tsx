import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const textSizeMap = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={logoImage} alt="Nuphar Flowers AI" className={`${sizeMap[size]} object-contain mix-blend-multiply`} />
      {showText && (
        <span className={`font-brand ${textSizeMap[size]} text-foreground tracking-wide`}>
          Nuphar Flowers AI
        </span>
      )}
    </div>
  );
};

export default Logo;
