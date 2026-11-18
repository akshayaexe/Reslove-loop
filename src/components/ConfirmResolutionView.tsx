import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Lightbulb,
  Lock,
  Star,
  Trophy,
  UserCheck,
  X,
} from 'lucide-react';
import { Complaint } from '../types/resolveloop';
import { confirmOrReopenComplaint } from '../services/firestoreService';

interface ConfirmResolutionViewProps {
  complaints: Complaint[];
  selectedComplaintId: string | null;
  onSelectComplaintId: (id: string) => void;
  onCompleted: () => void;
}

export function ConfirmResolutionView({
  complaints,
  selectedComplaintId,
  onSelectComplaintId,
  onCompleted,
}: ConfirmResolutionViewProps) {
  const candidates = complaints.filter((c) => c.status !== 'Draft');
  const defaultComplaint =
    candidates.find((c) => c.id === selectedComplaintId) ||
    candidates.find((c) => c.status === 'Awaiting Confirmation') ||
    candidates[0] ||
    null;

  const [decision, setDecision] = useState<'resolved' | 'reopen'>('resolved');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  if (!defaultComplaint) {
    return (
      <div className="bg-white rounded-[28px] p-12 text-center shadow-sm border border-slate-100">
        <p className="text-base font-bold text-slate-900">No complaints ready for confirmation</p>
        <p className="text-sm text-slate-500 mt-1">
          Active complaints will appear here once a specialist provides a solution.
        </p>
      </div>
    );
  }

  const isAlreadyClosed = defaultComplaint.status === 'Resolved';
  const checklist =
    defaultComplaint.resolutionSummary?.length > 0
      ? defaultComplaint.resolutionSummary
      : [
          'Issue root cause verified',
          'Corrective action completed',
          'Quality assurance passed',
          'Customer confirmation requested',
        ];

  const handleSubmitConfirmation = async () => {
    if (isAlreadyClosed) return;
    setSubmitting(true);
    setDoneMessage(null);
    try {
      await confirmOrReopenComplaint({
        complaint: defaultComplaint,
        resolved: decision === 'resolved',
        rating,
        feedbackText: feedback.trim() || (decision === 'resolved' ? 'Resolved smoothly.' : 'Still needs attention.'),
      });
      setDoneMessage(
        decision === 'resolved'
          ? `${defaultComplaint.ticketCode} has been confirmed and closed.`
          : `${defaultComplaint.ticketCode} has been reopened and escalated.`
      );
      setTimeout(() => {
        onCompleted();
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="inline-flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-xs border border-slate-200/80">
          <span className="text-xs font-bold text-slate-500">Select Case:</span>
          <select
            value={defaultComplaint.id}
            onChange={(e) => onSelectComplaintId(e.target.value)}
            className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ticketCode} — {c.title} ({c.status})
              </option>
            ))}
          </select>
        </label>
      </div>

      {doneMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3.5 text-sm font-bold text-emerald-900">
          {doneMessage}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Peach Summary Card */}
        <div className="xl:col-span-5 bg-[#ffd6c9] rounded-[28px] p-6 shadow-sm border border-orange-200/60 space-y-5">
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-700 font-medium">Complaint ID</span>
              <span className="font-mono-nums font-bold text-slate-900 bg-white px-3 py-1 rounded-full text-xs">
                {defaultComplaint.ticketCode}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-700 font-medium">Subject</span>
              <span className="font-bold text-slate-900 text-right">{defaultComplaint.title}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-700 font-medium">Handled By</span>
              <span className="font-bold text-slate-900 text-right">
                {defaultComplaint.assignedAgentName},{' '}
                <span className="text-emerald-800">{defaultComplaint.assignedAgentRole}</span>
              </span>
            </div>
          </div>

          <div className="border-t border-orange-300/60 pt-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 mb-3">
              <ClipboardCheck className="w-4 h-4 text-[#d93d1f]" />
              Resolution Summary
            </div>
            <ul className="space-y-2.5">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-xs font-semibold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-[#10a97f] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Decision & Metrics Column */}
        <div className="xl:col-span-7 space-y-5">
          {/* Metrics Strip */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs shrink-0">
              <Trophy className="w-6 h-6" />
            </span>

            <div className="flex-1 min-w-[140px] bg-white rounded-2xl px-4 py-2.5 shadow-xs border border-slate-100 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Resolved In</div>
                <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                  {defaultComplaint.resolvedInDays || 3} days
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[140px] bg-white rounded-2xl px-4 py-2.5 shadow-xs border border-slate-100 flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Handled By</div>
                <div className="text-xs font-extrabold text-slate-900">
                  {defaultComplaint.assignedAgentName}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[140px] bg-white rounded-2xl px-4 py-2.5 shadow-xs border border-slate-100 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#f04f2d] shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Quality Lead</div>
                <div className="text-xs font-extrabold text-slate-900">A. Sengupta</div>
              </div>
            </div>
          </div>

          {/* Two Decision Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDecision('resolved')}
              className={`text-center rounded-[26px] p-6 transition-all cursor-pointer border-2 ${
                decision === 'resolved'
                  ? 'bg-[#dcf9ef] border-[#10a97f] shadow-md'
                  : 'bg-[#ebf9f4] border-transparent hover:border-emerald-200'
              }`}
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">Yes, it is resolved!</h3>
              <span className="w-11 h-11 rounded-2xl bg-[#10a97f] text-white inline-flex items-center justify-center mb-3">
                <Check className="w-6 h-6 stroke-[2.8]" />
              </span>
              <p className="text-xs text-slate-700 font-medium mb-4">
                My issue is fixed. Close complaint.
              </p>
              <span className="inline-block w-full py-2.5 px-4 rounded-full rl-teal-btn text-white text-xs font-bold">
                Yes, it is resolved!
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('reopen')}
              className={`text-center rounded-[26px] p-6 transition-all cursor-pointer border-2 ${
                decision === 'reopen'
                  ? 'bg-[#ffe4dd] border-[#9f1239] shadow-md'
                  : 'bg-[#fff0ec] border-transparent hover:border-rose-200'
              }`}
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">No, still not fixed</h3>
              <span className="w-11 h-11 rounded-2xl bg-[#9f1239] text-white inline-flex items-center justify-center mb-3">
                <X className="w-6 h-6 stroke-[2.8]" />
              </span>
              <p className="text-xs text-slate-700 font-medium mb-4">
                Reopen and Escalate complaint.
              </p>
              <span className="inline-block w-full py-2.5 px-4 rounded-full bg-[#881337] text-white text-xs font-bold">
                Reopen & Escalate
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Rating & Confirm Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
        <div className="lg:col-span-7 bg-white rounded-[26px] p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-extrabold text-slate-900">Rate your experience</span>
            <span className="text-sm font-extrabold text-amber-500 font-mono-nums">
              {rating.toFixed(1)} / 5.0
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} out of 5`}
                className="p-1 cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={1000}
            placeholder="Share your thoughts..."
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div className="lg:col-span-5 flex flex-col items-end gap-3">
          <div className="bg-white rounded-full px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs border border-slate-100 inline-flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Tip from AI: Confirm only after verifying full replacement or refund.
          </div>

          <button
            type="button"
            disabled={submitting || isAlreadyClosed}
            onClick={handleSubmitConfirmation}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl rl-coral-btn text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isAlreadyClosed
              ? 'Already Closed'
              : submitting
                ? 'Saving...'
                : decision === 'resolved'
                  ? 'Confirm & Close Complaint ✓'
                  : 'Reopen & Escalate Complaint'}
          </button>

          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-500" />
            Your data is encrypted and never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
