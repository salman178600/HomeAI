import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { ChatMessage, BusinessProfile } from '../types.js';
import { HOME_SERVICES_LOGO } from '../assets/logo.js';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onResetChat: () => void;
  businessProfile: BusinessProfile;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onResetChat,
  businessProfile,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleChipClick = (promptText: string) => {
    if (isLoading) return;
    onSendMessage(promptText);
  };

  return (
    <div
      id="business-chat-container"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full min-h-0 overflow-hidden"
    >
      {/* Chat Top Bar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200/90 shadow-xs shrink-0 bg-slate-900 ring-2 ring-emerald-500/20">
              <img
                src={HOME_SERVICES_LOGO}
                alt="Home Services Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">{businessProfile.name} Assistant</h2>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded">
                AI Agent
              </span>
            </div>
            <p className="text-xs text-slate-500">
              English & Hinglish replies • Lead collection • Appointment requests
            </p>
          </div>
        </div>

        <button
          id="reset-chat-btn"
          onClick={onResetChat}
          title="Reset conversation"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div id="chat-messages-feed" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              id={`chat-message-${msg.id}`}
              className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              {isAgent && (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200/90 shrink-0 mt-0.5 bg-slate-900 shadow-2xs">
                  <img
                    src={HOME_SERVICES_LOGO}
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                  isAgent
                    ? 'bg-slate-100/80 text-slate-900 rounded-tl-xs'
                    : 'bg-slate-900 text-white rounded-tr-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.leadUpdate && (msg.leadUpdate.name || msg.leadUpdate.phone || msg.leadUpdate.requirement || msg.leadUpdate.serviceCategory) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-emerald-700 flex items-center gap-1.5 flex-wrap">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>
                      Details noted: {[
                        msg.leadUpdate.name && `Name: ${msg.leadUpdate.name}`,
                        msg.leadUpdate.phone && `Phone: ${msg.leadUpdate.phone}`,
                        msg.leadUpdate.serviceCategory && `Service: ${msg.leadUpdate.serviceCategory}`,
                        msg.leadUpdate.requirement && `Work: ${msg.leadUpdate.requirement}`,
                      ].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1 text-right ${
                    isAgent ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {!isAgent && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-xs px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Quick requests:
        </span>
        <button
          id="chip-plumber"
          onClick={() => handleChipClick('Water tap leak ho raha hai, plumber chahiye')}
          className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer shrink-0"
        >
          Plumber (Water tap leak)
        </button>
        <button
          id="chip-electrician"
          onClick={() => handleChipClick('Need an electrician for fan and chandelier fitting')}
          className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer shrink-0"
        >
          Electrician (Fan & Chandelier)
        </button>
        <button
          id="chip-ac"
          onClick={() => handleChipClick('AC servicing aur cooling repair karwani hai')}
          className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer shrink-0"
        >
          AC Servicing & Repair
        </button>
        <button
          id="chip-carpenter"
          onClick={() => handleChipClick('Door lock repair aur furniture fixing needed')}
          className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200/80 whitespace-nowrap transition-colors cursor-pointer shrink-0"
        >
          Carpenter (Door/Lock & Furniture)
        </button>
      </div>

      {/* Message Input Box */}
      <form
        id="chat-input-form"
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2"
      >
        <input
          ref={inputRef}
          id="chat-user-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask in English or natural Hinglish (e.g. 'tap leak ho raha hai bhaiya' or 'need AC repair')..."
          disabled={isLoading}
          className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm px-4 py-3 rounded-xl border border-slate-200/90 focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition-all"
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white p-3 rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
