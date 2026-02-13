import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "שלום! 🌸 אני פלורי, המעצבת החכמה שלכם לבניית זרים. ספרו לי מה אתם מחפשים — אירוע מיוחד, צבעים מועדפים, תקציב — ואני אבנה לכם את הזר המושלם מהמלאי הזמין! 💐",
};

export function useBouquetChat(shopId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return;

      const userMessage: ChatMessage = { role: "user", content: userText.trim() };
      setMessages((prev) => [...prev, userMessage]);

      // Build history for API (skip the welcome message for cleaner context)
      const apiMessages = [
        ...messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userText.trim() },
      ];

      setIsStreaming(true);

      // Add empty assistant message for streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        abortRef.current = new AbortController();

        const { data, error } = await supabase.functions.invoke("chat", {
          body: { messages: apiMessages, shopId },
        });

        if (error) throw error;

        // The response is a streaming body
        if (data instanceof ReadableStream) {
          const reader = data.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullContent += delta;
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        role: "assistant",
                        content: fullContent,
                      };
                      return updated;
                    });
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }

          // If nothing was streamed, show a fallback
          if (!fullContent) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: "סליחה, לא הצלחתי לעבד את הבקשה. נסו שוב 🌷",
              };
              return updated;
            });
          }
        } else if (typeof data === "object" && data?.error) {
          throw new Error(data.error);
        } else if (typeof data === "string") {
          // Non-streaming response
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: data,
            };
            return updated;
          });
        }
      } catch (err: any) {
        console.error("Chat error:", err);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `אופס, משהו השתבש 😔 ${err.message || "נסו שוב בעוד רגע."}`,
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, shopId]
  );

  return { messages, isStreaming, sendMessage };
}
