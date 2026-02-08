import { motion } from "framer-motion";

interface StepOption {
  emoji: string;
  label: string;
  value: string;
}

interface StepOptionButtonsProps {
  options: StepOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

const StepOptionButtons = ({ options, onSelect, disabled }: StepOptionButtonsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-1.5 mb-2"
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          disabled={disabled}
          className="bg-card border border-border hover:border-primary/40 rounded-lg p-2 text-center transition-all disabled:opacity-50 hover:shadow-soft"
        >
          <div className="text-lg mb-0.5">{option.emoji}</div>
          <div className="text-[11px] font-body font-medium text-foreground">{option.label}</div>
        </button>
      ))}
    </motion.div>
  );
};

export default StepOptionButtons;
