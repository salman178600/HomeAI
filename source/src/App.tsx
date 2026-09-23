import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, BookOpen, Users, Clock, IndianRupee, Calendar, ShieldCheck, PhoneCall, Settings } from 'lucide-react';
import { defaultBusinessProfile } from './data/businessData.js';
import { BusinessProfile, CustomerLead, ChatMessage, ChatResponsePayload } from './types.js';
import { mergePhoneNumber } from './utils/phoneUtils.js';
import { ChatInterface } from './components/ChatInterface.js';
import { LiveLeadStatus } from './components/LiveLeadStatus.js';
import { BusinessKnowledgeModal } from './components/BusinessKnowledgeModal.js';
import { BusinessCustomizationModal } from './components/BusinessCustomizationModal.js';
import { LeadsDrawer } from './components/LeadsDrawer.js';
import { HOME_SERVICES_LOGO } from './assets/logo.js';

export default function App() {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(defaultBusinessProfile);
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [currentLead, setCurrentLead] = useState<Partial<CustomerLead>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState<boolean>(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState<boolean>(false);
  const [isLeadsDrawerOpen, setIsLeadsDrawerOpen] = useState<boolean>(false);

  const initialGreeting: ChatMessage = {
    id: 'welcome-msg',
    sender: 'agent',
    text: `Hello 👋! Welcome to ${businessProfile.name || 'our business'}. I am your AI Business Assistant. You can ask in English or Hinglish. Please feel free to share your requirement, name, and phone number so our team can assist you!`,
    timestamp: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  // Load business info and existing leads
  useEffect(() => {
    fetch('/api/business-info')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) setBusinessProfile(data);
      })
      .catch((err) => console.log('Using default business info:', err));

    fetchLeads();
  }, []);

  const handleSaveBusinessProfile = async (updatedData: Partial<BusinessProfile>) => {
    const res = await fetch('/api/business-info', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    if (res.ok) {
      const saved = await res.json();
      setBusinessProfile(saved);
      // Inform the user in the chat thread subtly that the AI business configuration was updated
      const updateNotice: ChatMessage = {
        id: `config-update-${Date.now()}`,
        sender: 'agent',
        text: `[Business profile updated: ${saved.name}. The AI agent now strictly uses these new details and never invents unprovided information.]`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, updateNotice]);
    }
  };

  const handleResetBusinessProfile = async () => {
    const res = await fetch('/api/business-info/reset', {
      method: 'POST',
    });
    if (res.ok) {
      const resetData = await res.json();
      setBusinessProfile(resetData);
      const resetNotice: ChatMessage = {
        id: `config-reset-${Date.now()}`,
        sender: 'agent',
        text: `[Business profile reset to clean placeholders. The AI will strictly state that details depend on requirement and ask for customer contact info.]`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, resetNotice]);
    }
  };

  const fetchLeads = () => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeads(data);
      })
      .catch((err) => console.log('Error fetching leads:', err));
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          messages: updatedMessages.map((m) => ({ sender: m.sender, text: m.text })),
          currentLead,
        }),
      });

      const data: ChatResponsePayload = await res.json();

      // Check if lead info was updated - ensure strictly single phone number
      const effectivePhone = mergePhoneNumber(currentLead.phone, data.extractedLead?.phone);
      const newLeadState: Partial<CustomerLead> = {
        ...currentLead,
        name: data.extractedLead?.name || currentLead.name,
        phone: effectivePhone || currentLead.phone,
        requirement: data.extractedLead?.requirement || currentLead.requirement,
        serviceCategory: data.extractedLead?.serviceCategory || currentLead.serviceCategory,
        preferredTime: data.extractedLead?.preferredTime || currentLead.preferredTime,
      };

      setCurrentLead(newLeadState);

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.reply || "I'm here to help. Could you tell me your name, phone number, and service requirement?",
        timestamp: new Date().toISOString(),
        leadUpdate: data.extractedLead,
      };

      setMessages((prev) => [...prev, agentMsg]);
      fetchLeads();
    } catch (err) {
      console.error('Failed to communicate with agent:', err);
      const fallbackMsg: ChatMessage = {
        id: `agent-fallback-${Date.now()}`,
        sender: 'agent',
        text: 'Welcome to My AI Business! We tailor solutions to your specific requirements. Please share your name, phone number, and requirement so our team can connect with you!',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([initialGreeting]);
    setCurrentLead({});
  };

  const handleUpdateLeadStatus = async (id: string, newStatus: CustomerLead['status']) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
        );
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200/90 shadow-xs shrink-0 bg-slate-900 ring-2 ring-emerald-500/20">
              <img
                src={HOME_SERVICES_LOGO}
                alt="My AI Business Home Services Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  {businessProfile.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active AI Agent
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                English & Hinglish Replies • Lead Capture • Pending Confirmation Appointments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="hidden"
              id="open-customization-header-btn"
              onClick={() => setIsCustomizationOpen(true)}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-xl border border-blue-200/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Customize Business</span>
              <span className="sm:hidden">Customize</span>
            </button>

            <button
              className="hidden"
              id="open-knowledge-header-btn"
              onClick={() => setIsKnowledgeOpen(true)}
              className="text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl border border-slate-200/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Agent Profile</span>
              <span className="md:hidden">Profile</span>
            </button>

            <button
              id="open-leads-header-btn"
              onClick={() => setIsLeadsDrawerOpen(true)}
              className="text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Captured Leads</span>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {leads.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* AI Agent Features Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">Bilingual Agent</div>
              <div className="text-xs font-semibold text-slate-900 truncate">English & Hinglish Replies</div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">Lead Collection</div>
              <div className="text-xs font-semibold text-slate-900 truncate">Name, Phone & Requirement</div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">Appointment Requests</div>
              <div className="text-xs font-semibold text-slate-900 truncate">Pending Confirmation</div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">Zero Invention</div>
              <div className="text-xs font-semibold text-slate-900 truncate">Custom Business Fields</div>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 gap-y-4 flex-1 min-h-0 overflow-hidden">
          {/* Left / Main Column: Live Customer Chat Interface */}
          <div className="lg:col-span-7 xl:col-span-8">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onResetChat={handleResetChat}
              businessProfile={businessProfile}
            />
          </div>

          {/* Right Column: Real-time Lead Extraction & Placeholders Status */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <LiveLeadStatus
              currentLead={currentLead}
              totalLeadsCount={leads.length}
              businessProfile={businessProfile}
              onOpenLeadsDrawer={() => setIsLeadsDrawerOpen(true)}
              onOpenKnowledgeModal={() => setIsKnowledgeOpen(true)}
              onOpenCustomizationModal={() => setIsCustomizationOpen(true)}
              onQuickPrompt={handleSendMessage}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{businessProfile.name} • AI Business Assistant</span>
          <span>English & Hinglish AI replies • Zero invention • Customizable for any business</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <BusinessKnowledgeModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
        profile={businessProfile}
        onOpenCustomization={() => setIsCustomizationOpen(true)}
      />

      <BusinessCustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        profile={businessProfile}
        onSave={handleSaveBusinessProfile}
        onReset={handleResetBusinessProfile}
      />

      <LeadsDrawer
        isOpen={isLeadsDrawerOpen}
        onClose={() => setIsLeadsDrawerOpen(false)}
        leads={leads}
        onUpdateStatus={handleUpdateLeadStatus}
      />
    </div>
  );
}
