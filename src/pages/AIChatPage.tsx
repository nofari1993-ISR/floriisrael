import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Bot, User, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const AIChatPage = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "שגיאה בחיבור לשרת");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            const currentContent = assistantSoFar;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: currentContent } : m));
              }
              return [...prev, { role: "assistant", content: currentContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            const currentContent = assistantSoFar;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: currentContent } : m));
              }
              return [...prev, { role: "assistant", content: currentContent }];
            });
          }
        } catch { /* ignore partial leftovers */ }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ ${e instanceof Error ? e.message : "שגיאה לא ידועה"}` },
      ]);
    }
    setIsLoading(false);
  };

  const quickPrompts = [
    "מה הפרחים הכי מתאימים ליום הולדת? 🎂",
    "אני מחפש זר לחתונה בסגנון כפרי 💒",
    "מה המחיר הממוצע לזר? 💐",
    "אילו פרחים עונתיים זמינים עכשיו? 🌿",
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">צ׳אט פרחים AI</span>
            <span className="text-2xl">🌸</span>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-3xl flex flex-col">
        {/* Empty State */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-sage flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-display font-bold text-foreground">
                שאלו אותי <span className="text-gradient-sage">הכל על פרחים</span>
              </h2>
              <p className="text-muted-foreground font-body max-w-md">
                אני יועץ הפרחים החכם של Nuphar. אשמח לעזור לכם לבחור את הזר המושלם, להציע שילובי צבעים, ולהתאים פרחים לכל אירוע.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); }}
                  className="text-sm px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground hover:border-primary/30 hover:shadow-soft transition-all font-body text-right"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant" ? "bg-gradient-sage" : "bg-secondary"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <User className="w-5 h-5 text-secondary-foreground" />
                  )}
                </div>
                <div
                  className={`rounded-2xl px-5 py-3 max-w-[80%] text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-card border border-border/50 text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-line">{msg.content}</span>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-sage flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="bg-card border border-border/50 rounded-2xl px-5 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="sticky bottom-0 pt-4 pb-2">
          <div className="bg-card rounded-2xl shadow-elevated border border-border/50 p-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="שאלו אותי על פרחים, זרים, אירועים..."
              className="flex-1 bg-muted rounded-xl px-4 py-3 outline-none font-body text-foreground text-sm placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <Button
              variant="hero"
              size="icon"
              className="rounded-xl w-12 h-12"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
