import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useEffect } from "react";

interface BouquetChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

const BouquetChatInput = ({ value, onChange, onSend, disabled }: BouquetChatInputProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-3 border-t border-border/50 bg-card">
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ספרו לי מה אתם מחפשים... 🌸"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-muted rounded-xl px-4 py-3 outline-none font-body text-foreground text-sm placeholder:text-muted-foreground resize-none min-h-[44px] max-h-[120px] focus:ring-2 focus:ring-primary/20 transition-shadow disabled:opacity-50"
        />
        <Button
          variant="hero"
          size="icon"
          className="rounded-xl w-11 h-11 shrink-0"
          onClick={onSend}
          disabled={disabled || !value.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default BouquetChatInput;
