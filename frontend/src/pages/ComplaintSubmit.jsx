import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsApi, aiApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Send, 
  Sparkles, 
  Upload, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  Info,
  Camera,
  Layers
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';

export default function ComplaintSubmit() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [issueType, setIssueType] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // AI & Similarity Pre-Check State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Quick preset templates for rapid judge demo
  const presets = [
    {
      label: '⚡ Demo Scenario A: Duplicate Road Complaint',
      desc: 'Road has a huge pothole outside ABC College main gate creating traffic risk.',
      loc: 'ABC College Main Gate, University Road',
      type: 'Roads & Infrastructure',
    },
    {
      label: '⚡ Demo Scenario B: Recurrence Test (Resolved Issue #1042)',
      desc: 'Pothole has appeared again near ABC College after recent rains.',
      loc: 'ABC College Main Gate, University Road',
      type: 'Roads & Infrastructure',
    },
    {
      label: '⚡ Demo Scenario C: Water Leakage Duplicate',
      desc: 'Massive water leakage from broken pipe flooding Sector 9 Market.',
      loc: 'Sector 9 Central Market, Gate 2',
      type: 'Water Supply & Sanitation',
    },
    {
      label: '⚡ Demo Scenario D: Brand New Streetlight Issue',
      desc: 'Streetlight pole #42 sparking and dark at MG Road cross.',
      loc: 'MG Road Junction',
      type: 'Electricity & Lighting',
    },
  ];

  const applyPreset = (p) => {
    setDescription(p.desc);
    setLocationName(p.loc);
    setIssueType(p.type);
    runAiPreCheck(p.desc, p.loc);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const runAiPreCheck = async (descText, locText) => {
    const text = descText || description;
    const loc = locText || locationName;
    if (!text.trim() || text.length < 5) return;

    setAnalyzing(true);
    try {
      const res = await aiApi.analyze({
        description: text,
        location_name: loc,
      });
      setAiResult(res.data);
      if (res.data.aiAnalysis?.issue_type && !issueType) {
        setIssueType(res.data.aiAnalysis.issue_type);
      }
    } catch (err) {
      console.warn('AI pre-check failed, will evaluate on submission', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !locationName.trim()) {
      setError('Please provide both a complaint description and location.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('location_name', locationName.trim());
      if (issueType) formData.append('issue_type', issueType);
      if (file) {
        formData.append('image', file);
      } else if (previewUrl.startsWith('http')) {
        formData.append('image_url', previewUrl);
      }

      const res = await complaintsApi.submit(formData);
      const data = res.data;

      // Redirect directly to the linked or created issue passport
      if (data.issue?.id) {
        navigate(`/issues/${data.issue.id}`, {
          state: {
            justSubmitted: true,
            clusterStatus: data.clusterStatus,
            recurrenceDetected: data.recurrenceDetected,
            actionMessage: data.actionMessage,
          }
        });
      } else {
        navigate('/complaints');
      }
    } catch (err) {
      console.error('Submission failed', err);
      setError(err.response?.data?.error || 'Failed to submit complaint. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>AI-Powered Citizen Grievance Intake</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lodge Municipal Complaint
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time AI classification, duplicate semantic clustering, SLA assignment, and recurrence detection.
        </p>
      </div>

      {/* Preset Buttons for Quick SIH Presentation */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 mb-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
          <span>⚡ 1-Click Demonstration Scenarios for Judges</span>
          <span className="text-[10px] text-slate-500 font-normal">Click to pre-fill test data</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-left p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all text-xs group"
            >
              <div className="font-bold text-slate-800 group-hover:text-blue-700">{p.label}</div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">"{p.desc}"</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Complaint Submission Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Complaint Description *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => runAiPreCheck()}
                placeholder="Describe the civic issue in detail (e.g. Road has a huge pothole outside ABC College main gate creating traffic risk...)"
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-400">Be specific about landmarks and hazard level</span>
                <button
                  type="button"
                  onClick={() => runAiPreCheck()}
                  disabled={analyzing || !description.trim()}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{analyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Location / Landmark *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onBlur={() => runAiPreCheck()}
                  placeholder="e.g. ABC College Main Gate, University Road"
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Issue Category
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full text-xs sm:text-sm py-2.5 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Auto-Detect via AI Engine</option>
                <option value="Roads & Infrastructure">Roads & Infrastructure (PWD)</option>
                <option value="Water Supply & Sanitation">Water Supply & Sanitation (WSS)</option>
                <option value="Electricity & Lighting">Electricity & Lighting (EB)</option>
                <option value="Solid Waste Management">Solid Waste Management (SWM)</option>
                <option value="Traffic & Transport">Traffic & Transport (TT)</option>
              </select>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Upload Photo Evidence (Optional)
              </label>
              {previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-300">
                  <img src={previewUrl} alt="Complaint preview" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl('');
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-md text-xs shadow-md"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
                  <Camera className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Attach field photograph</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-[#0B2545] hover:bg-blue-900 text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting & Clustering...' : 'Submit Grievance to Municipal Platform'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Real-time AI Intelligence & Duplicate Detection Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Live AI Intelligence Pipeline</h3>
              </div>
              <span className="text-[10px] uppercase font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                Active Audit
              </span>
            </div>

            {analyzing ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-medium">Running NLP categorization & database similarity search...</p>
              </div>
            ) : aiResult ? (
              <div className="space-y-4">
                {/* Categorization & Severity */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Category</span>
                    <span className="text-xs font-bold text-slate-800">{aiResult.aiAnalysis?.issue_type}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Assessed Severity</span>
                    <SeverityBadge severity={aiResult.aiAnalysis?.severity} size="sm" />
                  </div>
                </div>

                {/* Routing & SLA */}
                <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                    Department Routing & SLA
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {aiResult.aiAnalysis?.recommended_department_name} ({aiResult.aiAnalysis?.recommended_department_code})
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Mandated SLA: <strong>{aiResult.aiAnalysis?.recommended_sla_hours} Hours</strong>
                  </div>
                </div>

                {/* Root Cause Prediction */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    AI Root Cause Hypothesis
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {aiResult.aiAnalysis?.root_cause_suggestion}
                  </p>
                </div>

                {/* DUPLICATE / RECURRENCE MATCH BANNER */}
                {aiResult.bestMatch && aiResult.similarityScore >= 0.45 && (
                  <div className={`p-3.5 rounded-xl border-2 space-y-2 ${
                    aiResult.isRecurrence 
                      ? 'bg-rose-50 border-rose-400 text-rose-950' 
                      : 'bg-purple-50 border-purple-300 text-purple-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-extrabold text-xs">
                        {aiResult.isRecurrence ? (
                          <>
                            <RefreshCw className="w-4 h-4 text-rose-600 animate-spin-slow" />
                            <span className="text-rose-900">RECURRENCE DETECTED</span>
                          </>
                        ) : (
                          <>
                            <Layers className="w-4 h-4 text-purple-600" />
                            <span className="text-purple-900">DUPLICATE CLUSTER MATCH</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs font-mono font-black bg-white px-2 py-0.5 rounded shadow-xs">
                        {Math.round(aiResult.similarityScore * 100)}% Similarity
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="font-semibold">Matched Issue:</span>{' '}
                      <strong>#{aiResult.bestMatch.id} - {aiResult.bestMatch.title}</strong>
                    </div>

                    <p className="text-[11px] leading-relaxed opacity-90">
                      {aiResult.isRecurrence
                        ? `Issue #${aiResult.bestMatch.id} was previously marked Resolved. Submitting this complaint will automatically flag RECURRENCE, increment the failure counter, and reopen the case for audit.`
                        : `This complaint matches active Issue #${aiResult.bestMatch.id}. It will be merged into the existing municipal work order to avoid duplicate dispatch.`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                <Info className="w-6 h-6 mx-auto text-slate-300" />
                <p>Type a description above or click one of the preset scenarios to see live AI classification, similarity score, and duplicate detection.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
