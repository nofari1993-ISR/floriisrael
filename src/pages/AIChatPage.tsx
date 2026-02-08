import { useNavigate, useSearchParams } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import BouquetChatHeader from "@/components/bouquet-chat/BouquetChatHeader";
import BouquetChatMessage from "@/components/bouquet-chat/BouquetChatMessage";
import BouquetChatInput from "@/components/bouquet-chat/BouquetChatInput";
import QuickSuggestions from "@/components/bouquet-chat/QuickSuggestions";
import OrderSuccessScreen, { type OrderSuccessData } from "@/components/bouquet-chat/OrderSuccessScreen";
import { useBouquetChat } from "@/hooks/useBouquetChat";

const AIChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shopId");

  const { messages, isStreaming, sendMessage } = useBouquetChat(shopId);
  const [input, setInput] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showSuggestions = messages.length <= 1 && !isStreaming;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleSuggestionSelect = (prompt: string) => {
    sendMessage(prompt);
  };

  if (orderSuccess) {
    return (
      <OrderSuccessScreen
        order={orderSuccess}
        onGoHome={() => navigate("/")}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-hero">
      <BouquetChatHeader onBack={() => navigate(-1)} />

      {/* Chat area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <BouquetChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {showSuggestions && <QuickSuggestions onSelect={handleSuggestionSelect} />}

        {/* Input */}
        <BouquetChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isStreaming}
        />
      </div>
    </div>
  );
};

export default AIChatPage;
