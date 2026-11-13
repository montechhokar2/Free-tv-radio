import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Scale, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LegalModal: React.FC = () => {
  const { isLegalModalOpen, setIsLegalModalOpen } = useApp();

  if (!isLegalModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsLegalModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              Free-to-Air &amp; Legal Compliance
            </h3>
            <p className="text-xs text-slate-400">Strict adherence to public broadcast rights &amp; DMCA</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <h4 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Authorized &amp; Free-to-Air Feeds</span>
            </h4>
            <p className="text-slate-400 leading-relaxed">
              <strong>Free TV &amp; Radio Live</strong> indexes and plays exclusively publicly available, Free-to-Air (FTA) digital television feeds and public Icecast/Shoutcast online radio stations authorized by their respective national or independent broadcasters (including Prasar Bharati Doordarshan, All India Radio, Deutsche Welle, France Médias Monde, NASA Public Domain, and KEXP Public Radio).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <h4 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anti-Piracy &amp; No Content Scraping Policy</span>
            </h4>
            <p className="text-slate-400 leading-relaxed">
              We strictly prohibit unauthorized IPTV re-streams, scraping of pay-TV networks, or redistribution of copyrighted subscription feeds. All streams link directly to official broadcast manifests provided for open public consumption.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <h4 className="font-semibold text-white flex items-center gap-2 mb-1.5">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Broadcaster Notice &amp; Stream Takedown Inquiries</span>
            </h4>
            <p className="text-slate-400 leading-relaxed">
              If you represent an authorized broadcast entity and would like to update your stream endpoint, add high-definition feeds, or request stream removal from our directory, administrators can immediately disable or modify any link via the integrated Admin Console or by reaching out to:
              <br />
              <code className="mt-1 inline-block text-amber-400 font-mono">broadcast-compliance@freetvradio.live</code>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <h4 className="font-semibold text-amber-400 flex items-center gap-2 mb-1">
              <span>Creator &amp; Lead Architect</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              <strong>Free TV &amp; Radio Live</strong> was created and developed by <strong className="text-white">Monte Chhokar</strong> as a high-performance, accessible entertainment platform for public service digital television feeds and online radio worldwide.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setIsLegalModalOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};
