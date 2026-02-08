import { motion } from "framer-motion";

interface QuickSuggestionsProps {
  onSelect: (text: string) => void;
}

const suggestions = [
  { text: "זר ליום הולדת 🎂", prompt: "אני מחפש/ת זר ליום הולדת, מה תציע/י?" },
  { text: "זר רומנטי 💕", prompt: "אני רוצה זר רומנטי ויפה, מה האפשרויות?" },
  { text: "זר לאירוע 🎉", prompt: "אני צריך/ה זר לאירוע מיוחד, תעזור/י לי לבחור?" },
  { text: "מתנת תודה 🙏", prompt: "אני מחפש/ת זר כמתנת תודה, מה מתאים?" },
];

const QuickSuggestions = ({ onSelect }: QuickSuggestionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-wrap gap-2 justify-center px-4 py-3"
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s.prompt)}
          className="px-3 py-1.5 rounded-full bg-sage-light text-primary text-xs font-body font-medium hover:bg-primary hover:text-primary-foreground transition-colors border border-primary/10"
        >
          {s.text}
        </button>
      ))}
    </motion.div>
  );
};

export default QuickSuggestions;
