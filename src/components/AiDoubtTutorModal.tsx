import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, User, Loader2, Lightbulb, BookOpen } from 'lucide-react';
import { Question } from '../types';
import { askAiDoubtTutor } from '../services/geminiService';
import { MathRenderer } from './MathRenderer';

interface AiDoubtTutorModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenApiKeyModal?: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export const AiDoubtTutorModal: React.FC<AiDoubtTutorModalProps> = ({
  question,
  isOpen,
  onClose,
  onOpenApiKeyModal,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Set initial greeting whenever question changes
  React.useEffect(() => {
    if (question && isOpen) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Namaste! I am your **JEE Guru AI** (IIT Mentor). I see you're looking at **${question.topic}** (${question.subject.toUpperCase()}).\n\nWhat would you like me to explain about this question? You can ask for a simpler breakdown, an alternative shortcut method, or clarify where you got stuck!`,
        },
      ]);
    }
  }, [question, isOpen]);

  if (!isOpen || !question) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAiDoubtTutor(question, textToSend);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I encountered an issue generating a response. Please check your internet connection or Gemini API key.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Explain the fundamental concept behind this problem.',
    'Is there an alternative shortcut or elimination trick?',
    'What are the common calculation pitfalls in this question?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl h-[650px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Bot size={22} className="text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">JEE Guru AI Tutor</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-semibold">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-blue-100">
                {question.subject.toUpperCase()} • {question.topic}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Question Snapshot Strip */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <div className="truncate max-w-md font-medium">
            <span className="text-blue-600 dark:text-blue-400 font-semibold mr-1.5">Question:</span>
            {question.text.slice(0, 90)}...
          </div>
          <span className="shrink-0 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold">
            Ans: {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 dark:bg-slate-950/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                <MathRenderer content={m.text} />
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-xs italic">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center shrink-0 animate-spin">
                <Loader2 size={16} />
              </div>
              <span>Guru AI is thinking and formulating the mathematical derivation...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              disabled={loading}
              className="shrink-0 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full transition flex items-center gap-1"
            >
              <Lightbulb size={12} className="text-amber-500" />
              {qp}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Guru AI anything about this question..."
            disabled={loading}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
