import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Calendar,
  Check,
  Flame,
  Lightbulb,
  Lock,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { AiAnalysisResult, Complaint, ComplaintPriority } from '../types/resolveloop';
import { createComplaint, updateDraftAndSubmit } from '../services/firestoreService';

interface SubmitComplaintViewProps {
  uid: string;
  customerName: string;
  draftComplaint: Complaint | null;
  onClearDraft: () => void;
  onSubmitted: (complaintId: string, isDraft: boolean) => void;
}

const CATEGORIES = [
  'Billing & Refunds',
  'Damaged Item',
  'Delivery Issue',
  'Wrong Item',
  'Account & Security',
  'Service Quality',
];

const URGENCIES: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export function SubmitComplaintView({
  uid,
  customerName,
  draftComplaint,
  onClearDraft,
  onSubmitted,
}: SubmitComplaintViewProps) {
  const [category, setCategory] = useState(draftComplaint?.category || 'Billing & Refunds');
  const [orderId, setOrderId] = useState(draftComplaint?.orderId || 'ORD-48213');
  const [title, setTitle] = useState(
    draftComplaint?.title || 'Refund not received for cancelled order'
  );
  const [description, setDescription] = useState(
    draftComplaint?.description ||
      'I have requested a refund of $249.00 for order ORD-48213 cancelled on Nov 10th. The merchant confirmed the cancellation, but the refund has not been credited to my bank account after 12 business days.'
  );
  const [priority, setPriority] = useState<ComplaintPriority>(draftComplaint?.priority || 'High');
  const [attachments, setAttachments] = useState<string[]>(
    draftComplaint?.attachments || ['invoice.pdf', 'bank_stmt.png']
  );

  const [analysis, setAnalysis] = useState<AiAnalysisResult>({
    classification: draftComplaint?.aiClassification || 'Billing > Refund Delay',
    detectedPriority: `${priority} - Ready for review`,
    clarityScore: draftComplaint?.aiClarityScore || 86,
    clarityLabel: 'Clear & Actionable',
    claritySummary: 'Sufficient context for immediate escalation.',
    suggestion:
      draftComplaint?.aiSuggestion ||
      'Recommends adding bank details to your saved payment methods for expedited refund deposit.',
    estimatedResolution: draftComplaint?.estimatedResolution || '3-4 working days',
    assignedTeam: draftComplaint?.assignedTeam || 'Billing Support Team',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (draftComplaint) {
      setCategory(draftComplaint.category);
      setOrderId(draftComplaint.orderId);
      setTitle(draftComplaint.title);
      setDescription(draftComplaint.description);
      setPriority(draftComplaint.priority);
      setAttachments(draftComplaint.attachments || []);
    }
  }, [draftComplaint]);

  const runAiAnalysis = async () => {
    if (!title.trim() && !description.trim()) {
      setAiError('Enter a complaint title or description first.');
      return;
    }
    setAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/analyze-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          orderId,
          title,
          description,
          urgency: priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI analysis failed');
      }
      setAnalysis(data as AiAnalysisResult);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach AI triage service.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAttachments((prev) => {
      const combined = [...prev, ...files.map((f) => f.name)];
      return Array.from(new Set(combined)).slice(0, 10);
    });
    e.target.value = '';
  };

  const handleSaveOrSubmit = async (isDraft: boolean) => {
    if (!title.trim() || !description.trim()) {
      setFormError('Please provide both a complaint title and issue description.');
      return;
    }
    setFormError(null);
    setSubmitting(isDraft ? 'draft' : 'submit');

    try {
      if (draftComplaint) {
        await updateDraftAndSubmit(
          draftComplaint,
          {
            title: title.trim(),
            category,
            orderId: orderId.trim(),
            description: description.trim(),
            priority,
            attachments,
            aiClassification: analysis.classification,
            aiClarityScore: analysis.clarityScore,
            aiSuggestion: analysis.suggestion,
            estimatedResolution: analysis.estimatedResolution,
            assignedTeam: analysis.assignedTeam,
            submitNow: !isDraft,
          },
          customerName
        );
        onClearDraft();
        onSubmitted(draftComplaint.id, isDraft);
      } else {
        const newId = await createComplaint({
          uid,
          customerName,
          category,
          orderId: orderId.trim(),
          title: title.trim(),
          description: description.trim(),
          priority,
          attachments,
          isDraft,
          aiClassification: analysis.classification,
          aiClarityScore: analysis.clarityScore,
          aiSuggestion: analysis.suggestion,
          estimatedResolution: analysis.estimatedResolution,
          assignedTeam: analysis.assignedTeam,
        });
        onSubmitted(newId, isDraft);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save complaint.');
    } finally {
      setSubmitting(null);
    }
  };

  const clarityCircumference = 2 * Math.PI * 24;
  const clarityOffset =
    clarityCircumference - (Math.min(100, Math.max(0, analysis.clarityScore)) / 100) * clarityCircumference;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Main Form Column */}
      <div className="xl:col-span-8 space-y-5">
        {/* 4-Step Indicator */}
        <div className="bg-white/80 rounded-full p-2 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <span className="px-3.5 py-1.5 rounded-full bg-[#24c393] text-white inline-flex items-center gap-1.5 whitespace-nowrap">
            <Check className="w-3.5 h-3.5" /> Details
          </span>
          <span className="px-3.5 py-1.5 rounded-full rl-coral-btn text-white inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="tabular-nums">2</span> Describe Issue
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-slate-600 inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="tabular-nums">3</span> AI Review
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-slate-600 inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="tabular-nums">4</span> Submit
          </span>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {draftComplaint ? 'Resume Draft Complaint' : 'Submit a Complaint'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Provide specific details so our AI routing engine can assign the right specialist.
              </p>
            </div>

            {draftComplaint && (
              <button
                type="button"
                onClick={onClearDraft}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Start Fresh
              </button>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800"
            >
              {formError}
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-bold text-slate-700 mb-1.5">
                  Complaint category
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-bold text-slate-700 mb-1.5">
                  Order / Reference ID
                </span>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  maxLength={64}
                  placeholder="ORD-48213"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-xs font-bold text-slate-700 mb-1.5">Complaint title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                placeholder="Brief summary of the issue"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Describe your issue</span>
                <span className="text-xs text-slate-400 tabular-nums">
                  {description.length} / 1000 characters
                </span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                placeholder="Include dates, amounts, and what happened..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </label>

            <div>
              <span className="block text-xs font-bold text-slate-700 mb-2">How urgent is it?</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {URGENCIES.map((level) => {
                  const active = priority === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? 'rl-coral-btn text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {(level === 'High' || level === 'Critical') && (
                        <Flame className="w-3.5 h-3.5" />
                      )}
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attachment dropzone */}
            <div className="rounded-2xl border-2 border-dashed border-emerald-400/70 bg-[#eefcf6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-emerald-600 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Upload screenshots or invoices
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Supports PDF, PNG, JPG up to 15MB
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFilesAdded}
                  className="sr-only"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {attachments.map((file) => (
                  <span
                    key={file}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-medium text-slate-800"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="max-w-[130px] truncate">{file}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((item) => item !== file))
                      }
                      aria-label={`Remove ${file}`}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSaveOrSubmit(true)}
                disabled={submitting !== null}
                className="px-6 py-3 rounded-2xl rl-teal-btn text-white text-sm font-bold cursor-pointer disabled:opacity-60"
              >
                {submitting === 'draft' ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveOrSubmit(false)}
                disabled={submitting !== null}
                className="px-8 py-3 rounded-2xl rl-coral-btn text-white text-sm font-bold cursor-pointer disabled:opacity-60"
              >
                {submitting === 'submit' ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          Your data is encrypted and never shared with third parties
        </p>
      </div>

      {/* Right Column: AI Complaint Analysis */}
      <div className="xl:col-span-4 rl-sidebar-gradient rounded-[28px] p-5 text-slate-900 shadow-lg space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-white/85 flex items-center justify-center text-[#f04f2d] shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-extrabold text-sm tracking-tight">
                AI Complaint Analysis
              </h3>
              <p className="text-[11px] font-medium text-emerald-950/75">
                Smart triage & routing check
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runAiAnalysis}
            disabled={analyzing}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f04f2d]" />
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {aiError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            {aiError}
          </div>
        )}

        <div className="bg-white/90 rounded-2xl p-4">
          <div className="text-[11px] font-bold tracking-wide text-slate-500 uppercase mb-1.5">
            Classification
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-slate-900">
            {analysis.classification}
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold tracking-wide text-slate-500 uppercase mb-1">
              Detected Priority
            </div>
            <div className="text-sm font-extrabold text-[#d93d1f]">
              {analysis.detectedPriority}
            </div>
          </div>
          <Flame className="w-5 h-5 text-[#f04f2d] shrink-0" />
        </div>

        <div className="bg-white/90 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
              <circle cx="30" cy="30" r="24" stroke="#d1fae5" strokeWidth="6" fill="none" />
              <circle
                cx="30"
                cy="30"
                r="24"
                stroke="#10a97f"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={clarityCircumference}
                strokeDashoffset={clarityOffset}
              />
            </svg>
            <span className="absolute text-xs font-extrabold text-slate-900 tabular-nums">
              {analysis.clarityScore}%
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
              Clarity Check
            </div>
            <div className="text-sm font-bold text-slate-900">{analysis.clarityLabel}</div>
            <p className="text-xs text-slate-600 leading-snug mt-0.5">{analysis.claritySummary}</p>
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500 uppercase mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            AI Suggestion
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{analysis.suggestion}</p>
        </div>

        <div className="bg-white/90 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold tracking-wide text-slate-500 uppercase mb-1">
              Estimated Resolution
            </div>
            <div className="text-sm font-extrabold text-slate-900 tabular-nums">
              {analysis.estimatedResolution}
            </div>
          </div>
          <Calendar className="w-5 h-5 text-[#f04f2d] shrink-0" />
        </div>

        <div className="bg-white/90 rounded-2xl p-4">
          <div className="text-[11px] font-bold tracking-wide text-slate-500 uppercase mb-1">
            Will Be Assigned To
          </div>
          <div className="text-sm font-extrabold text-slate-900">{analysis.assignedTeam}</div>
        </div>
      </div>
    </div>
  );
}
