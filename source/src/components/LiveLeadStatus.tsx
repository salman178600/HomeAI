import React, { useState } from 'react';
import { User, Phone, ClipboardList, Calendar, CheckCircle2, CircleDashed, ArrowRight, ShieldCheck, Sparkles, Building2, Briefcase, IndianRupee, Clock, MapPin, PhoneCall, Settings, AlertCircle } from 'lucide-react';
import { CustomerLead, BusinessProfile } from '../types.js';

interface LiveLeadStatusProps {
  currentLead: Partial<CustomerLead>;
  totalLeadsCount: number;
  businessProfile: BusinessProfile;
  onOpenLeadsDrawer: () => void;
  onOpenKnowledgeModal: () => void;
  onOpenCustomizationModal: () => void;
  onQuickPrompt: (prompt: string) => void;
}

export const LiveLeadStatus: React.FC<LiveLeadStatusProps> = ({
  currentLead,
  totalLeadsCount,
  businessProfile,
  onOpenLeadsDrawer,
  onOpenKnowledgeModal,
  onOpenCustomizationModal,
  onQuickPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'placeholders' | 'leads'>('placeholders');

  const leadFields = [
    {
      label: 'Customer Name',
      value: currentLead.name,
      isSet: !!currentLead.name,
      icon: User,
      placeholder: 'Waiting for customer name...',
    },
    {
      label: 'Phone Number',
      value: currentLead.phone,
      isSet: !!currentLead.phone,
      icon: Phone,
      placeholder: 'Waiting for contact number...',
    },
    {
      label: 'Requirement',
      value: currentLead.requirement,
      isSet: !!currentLead.requirement,
      icon: ClipboardList,
      placeholder: 'Waiting for service need...',
    },
  ];

  const placeholderFields = [
    {
      key: 'name',
      label: 'Business Name',
      value: businessProfile.name,
      placeholder: 'e.g. My AI Business / Dental Clinic / ConsultCo',
      icon: Building2,
      isFilled: Boolean(businessProfile.name && businessProfile.name !== 'My AI Business'),
    },
    {
      key: 'services',
      label: 'Services',
      value: businessProfile.services,
      placeholder: 'e.g. Web design, SEO, Cloud migration...',
      icon: Briefcase,
      isFilled: Boolean(businessProfile.services && businessProfile.services.trim()),
    },
    {
      key: 'prices',
      label: 'Prices',
      value: businessProfile.prices,
      placeholder: 'e.g. Consultation ₹500, Packages from ₹15,000...',
      icon: IndianRupee,
      isFilled: Boolean(businessProfile.prices && businessProfile.prices.trim()),
    },
    {
      key: 'timings',
      label: 'Timings',
      value: businessProfile.timings,
      placeholder: 'e.g. Mon-Sat 9:00 AM - 6:00 PM IST...',
      icon: Clock,
      isFilled: Boolean(businessProfile.timings && businessProfile.timings.trim()),
    },
    {
      key: 'location',
      label: 'Location',
      value: businessProfile.location,
      placeholder: 'e.g. Bengaluru, Karnataka / Remote...',
      icon: MapPin,
      isFilled: Boolean(businessProfile.location && businessProfile.location.trim()),
    },
    {
      key: 'contactDetails',
      label: 'Contact Details',
      value: businessProfile.contactDetails,
      placeholder: 'e.g. +91 98765 43210, team@business.com...',
      icon: PhoneCall,
      isFilled: Boolean(businessProfile.contactDetails && businessProfile.contactDetails.trim()),
    },
  ];

  const completedCount = leadFields.filter((f) => f.isSet).length;
  const configuredPlaceholdersCount = placeholderFields.filter((f) => f.isFilled).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Switcher: Placeholders (Customization) & Lead Collector */}
      <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
        <button
          id="tab-placeholders-btn"
          onClick={() => setActiveTab('placeholders')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'placeholders'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Business Placeholders</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
            {configuredPlaceholdersCount}/6
          </span>
        </button>

        <button
          id="tab-leads-btn"
          onClick={() => setActiveTab('leads')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'leads'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live Lead Collector</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
            {completedCount}/3
          </span>
        </button>
      </div>

      {/* VIEW 1: Business Customization & Placeholders Section */}
      {activeTab === 'placeholders' && (
        <div id="business-placeholders-card" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Business Fields & Placeholders
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI uses strictly these fields and never invents unprovided details
              </p>
            </div>

            <button
              id="customize-business-btn"
              onClick={onOpenCustomizationModal}
              className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>
          </div>

          {/* Zero-Invention Rule Callout */}
          <div className="mt-3 p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Zero-Invention Rule:</strong> Blank fields are never fabricated. The AI will clarify that details depend on individual requirements and ask for customer contact details.
            </div>
          </div>

          {/* Placeholders List */}
          <div className="mt-3.5 space-y-2">
            {placeholderFields.map((field) => {
              const Icon = field.icon;
              return (
                <div
                  key={field.key}
                  id={`placeholder-field-${field.key}`}
                  className={`p-2.5 rounded-xl border transition-all ${
                    field.isFilled
                      ? 'bg-blue-50/40 border-blue-200/80'
                      : 'bg-slate-50/70 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          field.isFilled ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{field.label}</span>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        field.isFilled
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200/80 text-slate-600 italic'
                      }`}
                    >
                      {field.isFilled ? 'Customized' : 'Placeholder (Empty)'}
                    </span>
                  </div>

                  <div className="mt-1 pl-8">
                    {field.isFilled ? (
                      <p className="text-xs text-slate-900 font-medium whitespace-pre-line leading-relaxed">
                        {field.value}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {field.placeholder}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Ready for any business profile</span>
            <button
              onClick={onOpenCustomizationModal}
              className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
            >
              Edit all fields
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: Live Lead Collector Card */}
      {activeTab === 'leads' && (
        <div id="lead-collection-card" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Live Lead Collector
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    completedCount === 3
                      ? 'bg-emerald-100 text-emerald-800'
                      : completedCount > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {completedCount}/3 Details Captured
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                The AI politely extracts customer info while answering queries
              </p>
            </div>

            <button
              id="view-all-leads-btn"
              onClick={onOpenLeadsDrawer}
              className="text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Saved ({totalLeadsCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Real-time Checklist */}
          <div className="mt-4 space-y-2.5">
            {leadFields.map((field, idx) => {
              const Icon = field.icon;
              return (
                <div
                  key={idx}
                  id={`lead-field-${idx}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    field.isSet
                      ? 'bg-emerald-50/60 border-emerald-200/80 text-slate-900'
                      : 'bg-slate-50/70 border-slate-200/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        field.isSet ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-slate-500">{field.label}</div>
                      <div
                        className={`text-xs font-semibold truncate ${
                          field.isSet ? 'text-slate-900' : 'text-slate-400 italic'
                        }`}
                      >
                        {field.isSet ? field.value : field.placeholder}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {field.isSet ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <CircleDashed className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                </div>
              );
            })}

            {currentLead.preferredTime && (
              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-amber-50/70 border-amber-200/90 text-slate-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-amber-800">Preferred Slot (Not Confirmed)</div>
                    <div className="text-xs font-semibold text-slate-900">{currentLead.preferredTime}</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded-md">Pending Confirmation</span>
              </div>
            )}
          </div>

          {completedCount === 3 && (
            <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Complete lead profile recorded! The team will reach out promptly.</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Test Prompt Shortcuts */}
      <div id="quick-test-panel" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Test Customer Inquiries</span>
          </div>
          <button
            id="view-knowledge-btn"
            onClick={onOpenKnowledgeModal}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-700 underline cursor-pointer"
          >
            Agent Rules
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          Click any prompt to test zero-invention, English/Hinglish replies, or lead collection:
        </p>

        <div className="space-y-1.5">
          <button
            id="prompt-btn-services-prices"
            onClick={() => onQuickPrompt("What services do you offer and what are your prices?")}
            className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100/90 text-slate-700 p-2 rounded-lg border border-slate-200/70 transition-colors flex items-center justify-between group cursor-pointer"
          >
            <span>"What services do you offer and what are your prices?" (Zero invention)</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            id="prompt-btn-appointment-unconfirmed"
            onClick={() => onQuickPrompt("Can you book my appointment for tomorrow at 3:00 PM?")}
            className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100/90 text-slate-700 p-2 rounded-lg border border-slate-200/70 transition-colors flex items-center justify-between group cursor-pointer"
          >
            <span>"Can you book my appointment for tomorrow at 3:00 PM?" (Pending Confirmation)</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            id="prompt-btn-timings-hinglish"
            onClick={() => onQuickPrompt("Service visit timing kya rahegi aur technician kab aa sakta hai?")}
            className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100/90 text-slate-700 p-2 rounded-lg border border-slate-200/70 transition-colors flex items-center justify-between group cursor-pointer"
          >
            <span>"Service visit timing kya rahegi aur technician kab aa sakta hai?"</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            id="prompt-btn-lead-full-india"
            onClick={() => onQuickPrompt("Mera naam Rohan Sharma hai, phone +91 98765 12340. Mujhe business consultation chahiye.")}
            className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100/90 text-slate-700 p-2 rounded-lg border border-slate-200/70 transition-colors flex items-center justify-between group cursor-pointer"
          >
            <span>"Mera naam Rohan Sharma hai, phone +91 98765 12340. Requirement: consultation"</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
