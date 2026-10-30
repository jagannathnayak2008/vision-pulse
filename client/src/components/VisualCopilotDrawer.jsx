import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { inspectionApi } from "../services/api";

export default function VisualCopilotDrawer({ inspectionId, initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || loading) return;

    setInputPrompt("");
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: "USER",
      message_text: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await inspectionApi.sendChat(inspectionId, text);
      const aiReply = res.data.reply;
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error("Copilot chat error:", err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: "AI",
        message_text: "Encountered a connectivity issue while querying the multimodal vision model. Please verify backend connection and try again.",
        suggested_followups: ["Retry previous question", "Summarize detected anomalies"],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const latestAiMessage = [...messages].reverse().find((m) => m.sender === "AI");
  const suggestedChips = latestAiMessage?.suggested_followups || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              AI Visual Copilot
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                MULTIMODAL
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Ask deep technical questions about this inspected asset
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-slate-200">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col h-[480px]">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.sender === "AI";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs ${isAi ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                      isAi
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                      isAi
                        ? "bg-slate-950 border border-slate-800 text-slate-200 shadow-sm"
                        : "bg-blue-600 text-white font-medium"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message_text}</p>
                    <span className="block text-[9px] text-slate-400 mt-1 font-mono">
                      {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-pulse">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 font-mono text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  Analyzing visual telemetry with Gemini Vision...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Follow-up Chips */}
          {suggestedChips.length > 0 && !loading && (
            <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Suggested:
              </span>
              {suggestedChips.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-800 bg-[#0d1322] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Copilot about crack depth, thermal stress, or compliance..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

