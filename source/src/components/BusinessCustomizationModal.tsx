import React, { useState, useEffect } from 'react';
import { X, Building2, Briefcase, IndianRupee, Clock, MapPin, Phone, ShieldCheck, AlertCircle, Save, RotateCcw, Check } from 'lucide-react';
import { BusinessProfile } from '../types.js';

interface BusinessCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  onSave: (updatedProfile: Partial<BusinessProfile>) => Promise<void>;
  onReset: () => Promise<void>;
}

export const BusinessCustomizationModal: React.FC<BusinessCustomizationModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    services: profile.services || '',
    prices: profile.prices || '',
    timings: profile.timings || '',
    location: profile.location || '',
    contactDetails: profile.contactDetails || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData({
      name: profile.name || '',
      services: profile.services || '',
      prices: profile.prices || '',
      timings: profile.timings || '',
      location: profile.location || '',
      contactDetails: profile.contactDetails || '',
    });
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all business fields back to empty placeholders? The AI will return to zero-invention requirement mode.')) {
      setIsSaving(true);
      try {
        await onReset();
        setFormData({
          name: 'My AI Business',
          services: '',
          prices: '',
          timings: '',
          location: '',
          contactDetails: '',
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div
      id="business-customization-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="business-customization-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Customize Business Information
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize the AI Agent for your business. The AI strictly uses ONLY these fields.
            </p>
          </div>
          <button
            id="close-customization-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Zero-invention policy callout */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Zero Invention Guarantee</div>
              <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                The AI will <strong>only</strong> reference the information provided in the fields below. Any field left blank is treated as unprovided—the AI will state that details depend on the customer's specific requirement and will never invent fake prices, hours, or addresses.
              </p>
            </div>
          </div>

          {/* 1. Business Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Business Name</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {formData.name.trim() ? 'Configured' : 'Empty placeholder'}
              </span>
            </label>
            <input
              id="input-biz-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My AI Business / Horizon Legal / Apex Dental / CloudCraft"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-400">
              The AI introduces itself representing this business.
            </p>
          </div>

          {/* 2. Services */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>Services</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {formData.services.trim() ? 'Configured' : 'Empty (AI will state depends on requirement)'}
              </span>
            </label>
            <textarea
              id="input-biz-services"
              rows={2}
              value={formData.services}
              onChange={(e) => setFormData({ ...formData, services: e.target.value })}
              placeholder="e.g., Web development, UI/UX design, Mobile app development, Cloud consulting..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Leave blank if services are custom or depend on customer requirements.
            </p>
          </div>

          {/* 3. Prices */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                <span>Prices</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {formData.prices.trim() ? 'Configured' : 'Empty (AI will state depends on requirement)'}
              </span>
            </label>
            <textarea
              id="input-biz-prices"
              rows={2}
              value={formData.prices}
              onChange={(e) => setFormData({ ...formData, prices: e.target.value })}
              placeholder="e.g., Initial consultation: ₹500, Standard package: ₹15,000, Enterprise quotes upon request..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Leave blank if pricing is not public. The AI will never fabricate prices.
            </p>
          </div>

          {/* 4. Timings */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Timings & Visit Policy</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {formData.timings.trim() ? 'Configured' : 'Empty (Team confirms visit timing)'}
              </span>
            </label>
            <input
              id="input-biz-timings"
              type="text"
              value={formData.timings}
              onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
              placeholder="e.g., Service visit timings depend on technician availability and customer requirements. Team will confirm the visit timing with the customer."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Service visit timings policy: visit timings depend on technician availability and customer requirements; team confirms with the customer.
            </p>
          </div>

          {/* 5. Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Location</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {formData.location.trim() ? 'Configured' : 'Empty (Team follows up directly)'}
              </span>
            </label>
            <input
              id="input-biz-location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Sector 18, Noida, Uttar Pradesh / Online Consultations"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Office address, city, or note if services are provided online.
            </p>
          </div>

          {/* 6. Contact Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Contact Details</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {formData.contactDetails.trim() ? 'Configured' : 'Empty (Direct lead collection)'}
              </span>
            </label>
            <input
              id="input-biz-contact"
              type="text"
              value={formData.contactDetails}
              onChange={(e) => setFormData({ ...formData, contactDetails: e.target.value })}
              placeholder="e.g., Phone: +91 98765 43210, Email: hello@example.com"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-400">
              Public contact number, WhatsApp, or business email.
            </p>
          </div>

          {/* Unchanged Rules Reminder */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Appointment Booking Remains "Pending Confirmation":</span>
              <span className="text-amber-800 ml-1">
                No automated booking system is connected. Any appointment slot requested will still be recorded as Pending Confirmation.
              </span>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="w-full sm:w-auto text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Clean Placeholders</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-biz-customization-btn"
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved & Applied!</span>
                </>
              ) : isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply to AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
