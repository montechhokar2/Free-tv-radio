import React from 'react';
import { Languages, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_CATEGORIES } from '../../data/initialChannels';

interface LanguageCategoriesBarProps {
  onLanguageSelect?: (language: string) => void;
  showCards?: boolean;
}

export const LanguageCategoriesBar: React.FC<LanguageCategoriesBarProps> = ({ 
  onLanguageSelect, 
  showCards = false 
}) => {
  const { selectedLanguage, setSelectedLanguage, channels } = useApp();

  const handleSelect = (lang: string) => {
    setSelectedLanguage(lang);
    if (onLanguageSelect) onLanguageSelect(lang);
  };

  // Count active channels for each language
  const getLanguageCount = (lang: string) => {
    if (lang === 'All') return channels.length;
    return channels.filter(c => c.language.toLowerCase() === lang.toLowerCase()).length;
  };

  if (showCards) {
    return (
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Languages className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Browse by Language · भाषाएं</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore TV and Radio streams categorized by regional and international languages
            </p>
          </div>
          {selectedLanguage !== 'All' && (
            <button
              onClick={() => handleSelect('All')}
              className="min-h-[40px] px-2.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              Reset to All
            </button>
          )}
        </div>

        {/* Responsive Language Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {LANGUAGE_CATEGORIES.map(cat => {
            const isSelected = selectedLanguage === cat.name;
            const count = getLanguageCount(cat.name);

            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.name)}
                className={`relative rounded-2xl p-3.5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl" role="img" aria-label={cat.name}>
                    {cat.flag}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {count} {count === 1 ? 'stream' : 'streams'}
                  </span>
                </div>

                <div>
                  <div className="text-base font-bold text-white tracking-wide truncate">
                    {cat.nativeName}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {cat.name}
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  // Compact Pill / Filter Strip
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {LANGUAGE_CATEGORIES.map(cat => {
        const isSelected = selectedLanguage === cat.name;
        return (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.name)}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              isSelected
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <span>{cat.flag}</span>
            <span>{cat.name}</span>
            <span className="text-[10px] opacity-75">({cat.nativeName})</span>
          </button>
        );
      })}
    </div>
  );
};
