import React from 'react';
import { X, User, Phone, CheckCircle, Clock, Calendar, MessageSquare, AlertCircle, Copy } from 'lucide-react';
import { CustomerLead } from '../types.js';

interface LeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  leads: CustomerLead[];
  onUpdateStatus: (id: string, newStatus: CustomerLead['status']) => void;
}

export const LeadsDrawer: React.FC<LeadsDrawerProps> = ({
  isOpen,
  onClose,
  leads,
  onUpdateStatus,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (lead: CustomerLead) => {
    const text = `Name: ${lead.name || 'N/A'}\nPhone: ${lead.phone || 'N/A'}\nRequirement: ${lead.requirement || 'N/A'}\nPreferred Time: ${lead.preferredTime || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusBadge = (status: CustomerLead['status']) => {
    switch (status) {
      case 'new':
        return <span className="text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full">New Lead</span>;
      case 'contacted':
        return <span className="text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full">Contacted</span>;
      case 'booked':
        return <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">Appointment Booked</span>;
      case 'completed':
        return <span className="text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">Completed</span>;
    }
  };

  return (
    <div
      id="leads-drawer-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="leads-drawer-panel"
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Captured Customer Inquiries</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact details collected automatically by the AI Agent
            </p>
          </div>
          <button
            id="close-leads-drawer-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {leads.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
              <User className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No leads captured yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                When customers state their name, phone number, or requirement in chat, the AI agent will capture them here automatically.
              </p>
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                id={`lead-item-${lead.id}`}
                className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                      <span>{lead.name || 'Unnamed Customer'}</span>
                      {lead.serviceCategory && (
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full">
                          {lead.serviceCategory}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(lead.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {statusBadge(lead.status)}
                </div>

                <div className="space-y-1.5 text-xs">
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium">{lead.phone}</span>
                    </div>
                  )}
                  {lead.requirement && (
                    <div className="flex items-start gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{lead.requirement}</span>
                    </div>
                  )}
                  {lead.preferredTime && (
                    <div className="flex items-center justify-between text-xs bg-amber-50/70 p-2 rounded-lg border border-amber-200/80">
                      <div className="flex items-center gap-1.5 text-amber-900 min-w-0">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Prefers: {lead.preferredTime}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded shrink-0">
                        Pending Confirmation
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Switcher & Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-[11px] text-slate-500">Status:</label>
                    <select
                      id={`lead-status-select-${lead.id}`}
                      value={lead.status}
                      onChange={(e) => onUpdateStatus(lead.id, e.target.value as CustomerLead['status'])}
                      className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-400 cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="booked">Booked</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <button
                    id={`copy-lead-${lead.id}`}
                    onClick={() => handleCopy(lead)}
                    className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === lead.id ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
