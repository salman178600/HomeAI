import React from 'react';
import { X, Calendar, AlertCircle, MessageSquare, ShieldCheck, Languages, UserCheck, Settings, Building2, Briefcase, IndianRupee, Clock, MapPin, Phone, HeartHandshake } from 'lucide-react';
import { BusinessProfile } from '../types.js';
import { HOME_SERVICES_LOGO } from '../assets/logo.js';

interface BusinessKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  onOpenCustomization?: () => void;
}

export const BusinessKnowledgeModal: React.FC<BusinessKnowledgeModalProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenCustomization,
}) => {
  if (!isOpen) return null;

  const fields = [
    { label: 'Business Name', val: profile.name, icon: Building2, placeholder: 'My AI Business (Default placeholder)' },
    { label: 'Services', val: profile.services, icon: Briefcase, placeholder: 'Empty placeholder (AI states depends on requirement)' },
    { label: 'Prices', val: profile.prices, icon: IndianRupee, placeholder: 'Empty placeholder (AI states depends on requirement)' },
    { label: 'Timings', val: profile.timings, icon: Clock, placeholder: 'Empty placeholder (Consultation arranged on request)' },
    { label: 'Location', val: profile.location, icon: MapPin, placeholder: 'Empty placeholder (Follows up directly with customer)' },
    { label: 'Contact Details', val: profile.contactDetails, icon: Phone, placeholder: 'Empty placeholder (Direct lead capture in chat)' },
  ];

  return (
    <div
      id="business-knowledge-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="business-knowledge-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                AI Agent & Business Profile
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Operating rules, bilingual capabilities, and zero-invention configuration
            </p>
          </div>
          <button
            id="close-knowledge-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Company Brief */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200/90 shadow-2xs shrink-0 bg-slate-900 ring-2 ring-emerald-500/20">
              <img
                src={HOME_SERVICES_LOGO}
                alt="Business Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900 text-base truncate">{profile.name}</h3>
                {onOpenCustomization && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCustomization();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Customize Fields</span>
                  </button>
                )}
              </div>
              <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                {profile.description || "Configurable business assistant with zero fake details."}
              </p>
            </div>
          </div>

          {/* Business Placeholder Fields Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                Business Fields (Strictly Used by AI)
              </h4>
              <span className="text-[11px] text-slate-500">Zero-Invention Enforced</span>
            </div>

            <div className="space-y-2">
              {fields.map((f, i) => {
                const Icon = f.icon;
                const isConfigured = Boolean(f.val && f.val.trim());
                return (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/60 flex items-start gap-2.5">
                    <div className={`p-1 rounded-md ${isConfigured ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">{f.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-sm font-medium ${isConfigured ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600 italic'}`}>
                          {isConfigured ? 'Customized' : 'Placeholder (Empty)'}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${isConfigured ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                        {isConfigured ? f.val : f.placeholder}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Agent Core Features */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Active AI Agent Features
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <Languages className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 text-xs">English & Hinglish Replies</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Seamlessly answers in professional English or natural Roman Hindi/Urdu.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 text-xs">Lead Information Capture</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Politely collects Customer Name, Phone Number, and Requirement.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 text-xs">Preferred Slot Collection</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Collects customer preferred times as 'Pending Confirmation'.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 text-xs">Zero Invention Policy</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Never fabricates prices, timings, phone, email, or physical locations.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3 sm:col-span-2">
                <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900 text-xs">Neutral Greeting & Fair Service for All</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Uses a neutral, welcoming greeting ('Hello 👋') for all customers. Never assumes or inquires about religion, offering identical, unbiased service and lead capture to everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Policy */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                Appointment & Booking Policy
              </h4>
            </div>
            <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200 space-y-2 text-xs text-amber-950">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Booking System Status: Not Connected (Zero-Guarantee Policy)</div>
                  <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                    No automated booking system is connected. The AI agent never promises or guarantees service completion or definite technician visits. It states: <em>"Your service requirement has been noted. Our team will check technician availability and contact you to confirm the visit."</em> All requests remain recorded as <strong>Pending Confirmation</strong> until the team confirms them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          {onOpenCustomization && (
            <button
              onClick={() => {
                onClose();
                onOpenCustomization();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Open Customization Settings
            </button>
          )}
          <button
            id="modal-close-action-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer ml-auto"
          >
            Got it, return to chat
          </button>
        </div>
      </div>
    </div>
  );
};


