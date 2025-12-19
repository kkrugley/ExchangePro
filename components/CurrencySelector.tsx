
import React from 'react';
import { POPULAR_CURRENCIES } from '../constants';

interface Props {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const CurrencySelector: React.FC<Props> = ({ value, onChange, label }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-slate-700 font-medium"
        >
          {POPULAR_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code} - {c.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CurrencySelector;
