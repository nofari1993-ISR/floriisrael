import { motion } from "framer-motion";
import { User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import nupharAvatar from "@/assets/nuphar-avatar.png";

interface BouquetChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const BouquetChatMessage = ({ role, content, isStreaming }: BouquetChatMessageProps) => {
  const isBot = role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isBot ? "" : "flex-row-reverse"}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden ${
          isBot ? "bg-sage-light" : "bg-secondary"
        }`}
      >
        {isBot ? (
          <img src={nupharAvatar} alt="Flori" className="w-7 h-7 object-cover" />
        ) : (
          <User className="w-4 h-4 text-secondary-foreground" />
        )}
      </div>
      <div
        className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed font-body ${
          isBot
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isBot ? (
          <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0.5">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <span className="whitespace-pre-line">{content}</span>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-full animate-pulse mr-1" />
        )}
      </div>
    </motion.div>
  );
};

export default BouquetChatMessage;
