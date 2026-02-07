import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-16 h-16",
};

const textSizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={logoImage} alt="Nuphar Flowers AI" className={`${sizeMap[size]} object-contain mix-blend-multiply`} />
      {showText && (
        <span className={`font-brand ${textSizeMap[size]} font-semibold text-foreground tracking-wide`}>
          Nuphar Flowers AI
        </span>
      )}
    </div>
  );
};

export default Logo;
