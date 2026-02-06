import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Bot, User } from "lucide-react";

const sampleMessages = [
  {
    role: "bot" as const,
    text: "שלום! 🌸 אני העוזר החכם של בלום. אשמח לעזור לכם לבנות את הזר המושלם. ספרו לי, מה האירוע?",
  },
  {
    role: "user" as const,
    text: "אני מחפש זר ליום הולדת לאישתי, היא אוהבת צבעים חמים",
  },
  {
    role: "bot" as const,
    text: "מקסים! 💐 לפי ההעדפות שלך, הנה ההמלצה שלי:\n\n🌹 5 ורדים כתומים\n🌻 3 חמניות\n🌿 ענפי אקליפטוס\n🌺 2 דליות בגוון אפרסק\n\nמחיר משוער: ₪120\nזמין בחנויות באזור שלך!",
  },
];

const AIChat = () => {
  const [messages, setMessages] = useState(sampleMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "תודה! 🌷 אני מחפש את האפשרויות הכי טובות עבורכם. כדי להתאים זר מדויק יותר, האם תרצו להוסיף מילוי ירוק לזר?",
        },
      ]);
    }, 1000);
  };

  return (
    <section id="ai-chat" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-sage-light text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4 inline ml-1" />
              מופעל בינה מלאכותית
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              תנו ל-AI{" "}
              <span className="text-gradient-sage">לבנות את הזר</span>
            </h2>
            <p className="text-lg text-muted-foreground font-body leading-relaxed max-w-lg">
              ספרו לנו על האירוע, התקציב, צבעים מועדפים והעדפות - והצ׳אט החכם שלנו ייצור
              עבורכם את הזר המושלם ויתאים אותו לחנות הקרובה אליכם.
            </p>
            <div className="flex flex-wrap gap-3">
              {["יום הולדת 🎂", "חתונה 💒", "תודה 🙏", "סתם ככה 💝"].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full bg-card border border-border/50 text-sm font-medium text-foreground hover:border-primary/30 hover:shadow-soft transition-all cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-3xl shadow-elevated border border-border/50 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-gradient-sage p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-primary-foreground">העוזר החכם של בלום</h4>
                <span className="text-xs text-primary-foreground/70">מקוון עכשיו</span>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "bot" ? "bg-sage-light" : "bg-secondary"
                  }`}>
                    {msg.role === "bot" ? (
                      <Bot className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-secondary-foreground" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "bot"
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="ספרו לי מה אתם מחפשים..."
                  className="flex-1 bg-muted rounded-xl px-4 py-3 outline-none font-body text-foreground text-sm placeholder:text-muted-foreground"
                />
                <Button
                  variant="hero"
                  size="icon"
                  className="rounded-xl w-12 h-12"
                  onClick={handleSend}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AIChat;
