
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowRight, RefreshCw, Info, TrendingUp, AlertCircle, PieChart, Layers, Wallet, Percent, Edit2, X, Check, HelpCircle, Calculator, RotateCcw, Settings2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import CurrencySelector from './components/CurrencySelector';
import { fetchExchangeRates } from './services/exchangeRateService';
import { getFinancialInsight } from './services/geminiService';
import { ExchangeRates, ConversionStep } from './types';

const REFRESH_INTERVAL_SEC = 300;

const App: React.FC = () => {
  const [amount, setAmount] = useState<number>(1000);
  const [currencyA, setCurrencyA] = useState<string>('EUR');
  const [currencyB, setCurrencyB] = useState<string>('PLN');
  const [currencyC, setCurrencyC] = useState<string>('BYN');
  
  // Per-step margin/spread settings
  const [marginStep1, setMarginStep1] = useState<number>(1.5);
  const [marginStep2, setMarginStep2] = useState<number>(3.5); // Usually higher for exotic pairs like PLN
  const [marginDirect, setMarginDirect] = useState<number>(1.5);

  // Manual overrides
  const [manualRate1, setManualRate1] = useState<number | null>(null);
  const [manualRate2, setManualRate2] = useState<number | null>(null);
  const [manualRateDirect, setManualRateDirect] = useState<number | null>(null);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // 0, 1, 2
  const [showHelperFor, setShowHelperFor] = useState<number | null>(null);
  const [helperSell, setHelperSell] = useState<string>('');
  const [helperBuy, setHelperBuy] = useState<string>('');

  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_INTERVAL_SEC);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadRates = useCallback(async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    try {
      const data = await fetchExchangeRates(currencyA);
      setRates(data);
      setLastUpdated(new Date());
      setSecondsUntilRefresh(REFRESH_INTERVAL_SEC);
    } catch (err) {
      setError('Ошибка загрузки курсов.');
    } finally {
      if (!isAuto) setLoading(false);
    }
  }, [currencyA]);

  useEffect(() => { loadRates(); }, [loadRates]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) { loadRates(true); return REFRESH_INTERVAL_SEC; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadRates]);

  const applyHelperMargin = () => {
    const s = parseFloat(helperSell);
    const b = parseFloat(helperBuy);
    if (s && b && s > 0 && b > 0) {
      const mid = (s + b) / 2;
      const margin = Math.abs(((mid - s) / mid) * 100);
      if (showHelperFor === 0) setMarginStep1(parseFloat(margin.toFixed(2)));
      if (showHelperFor === 1) setMarginStep2(parseFloat(margin.toFixed(2)));
      if (showHelperFor === 2) setMarginDirect(parseFloat(margin.toFixed(2)));
      setShowHelperFor(null);
      setHelperSell('');
      setHelperBuy('');
    }
  };

  const results = useMemo(() => {
    if (!rates) return null;

    // Step 1
    const mid1 = rates[currencyB] || 0;
    const appRate1 = manualRate1 ?? (mid1 * (100 - marginStep1) / 100);
    const amtB = amount * appRate1;

    // Step 2
    const midAC = rates[currencyC] || 0;
    const midBC = mid1 > 0 ? (midAC / mid1) : 0;
    const appRate2 = manualRate2 ?? (midBC * (100 - marginStep2) / 100);
    const amtC = amtB * appRate2;

    // Direct
    const appRateDirect = manualRateDirect ?? (midAC * (100 - marginDirect) / 100);
    const amtDirect = amount * appRateDirect;

    const steps = [
      { from: currencyA, to: currencyB, midRate: mid1, appliedRate: appRate1, marginPercent: marginStep1, inputAmount: amount, outputAmount: amtB, isManual: !!manualRate1 },
      { from: currencyB, to: currencyC, midRate: midBC, appliedRate: appRate2, marginPercent: marginStep2, inputAmount: amtB, outputAmount: amtC, isManual: !!manualRate2 }
    ];

    return {
      steps,
      totalAmount: amtC,
      directAmount: amtDirect,
      monetaryLoss: amtDirect - amtC,
      efficiency: amtDirect > 0 ? (amtC / amtDirect) * 100 : 0,
      totalLossPercent: 100 - (amtDirect > 0 ? (amtC / amtDirect) * 100 : 0)
    };
  }, [rates, amount, currencyA, currencyB, currencyC, marginStep1, marginStep2, marginDirect, manualRate1, manualRate2, manualRateDirect]);

  const formatCurrency = (val: number, code: string) => 
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 selection:bg-indigo-100">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Layers className="text-white w-6 h-6" />
            </div>
            <h1 className="font-black text-xl tracking-tight">Exchange<span className="text-indigo-600">Pro</span></h1>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase">Live Rates</span>
                <span className="text-[10px] font-bold text-indigo-600 tabular-nums">Update: {Math.floor(secondsUntilRefresh / 60)}:{(secondsUntilRefresh % 60).toString().padStart(2, '0')}</span>
             </div>
             <button onClick={() => loadRates()} className="p-1.5 hover:bg-white rounded-lg transition-all active:scale-95 shadow-sm">
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-500" /> Основные данные</h2>
              <button onClick={() => { setManualRate1(null); setManualRate2(null); setManualRateDirect(null); }} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors">Сброс котировок</button>
            </div>
            
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Сумма продажи ({currencyA})</label>
              <div className="relative group">
                <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-indigo-500 transition-all text-3xl font-black group-hover:border-slate-200" />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg uppercase">{currencyA}</div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-50">
              <CurrencySelector label="Продаю (Старт)" value={currencyA} onChange={setCurrencyA} />
              <div className="flex items-center gap-4">
                <div className="h-px bg-slate-100 flex-grow" />
                <div className="p-2 bg-indigo-50 rounded-full border border-indigo-100">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="h-px bg-slate-100 flex-grow" />
              </div>
              <CurrencySelector label="Промежуточная валюта" value={currencyB} onChange={setCurrencyB} />
              <div className="flex items-center gap-4">
                <div className="h-px bg-slate-100 flex-grow" />
                <div className="p-2 bg-indigo-50 rounded-full border border-indigo-100">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="h-px bg-slate-100 flex-grow" />
              </div>
              <CurrencySelector label="Получаю (Итог)" value={currencyC} onChange={setCurrencyC} />
            </div>
          </section>

          <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <h3 className="font-black flex items-center gap-2"><Percent className="w-5 h-5 text-indigo-400" /> Интеллектуальный отчет</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Gemini проанализирует текущие кросс-курсы и маржинальность вашего банка для поиска лучшего маршрута.</p>
                <button onClick={async () => { setIsAiLoading(true); setAiInsight(await getFinancialInsight(currencyA, currencyB, currencyC, results?.totalLossPercent || 0, results?.efficiency || 0)); setIsAiLoading(false); }} className="w-full py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                  {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Сформировать анализ'}
                </button>
             </div>
             <TrendingUp className="absolute -right-8 -bottom-8 w-32 h-32 text-white/5 rotate-12" />
          </div>

          {aiInsight && <div className="p-6 bg-white border border-slate-100 rounded-2xl text-xs text-slate-600 leading-relaxed italic animate-in slide-in-from-bottom-2">"{aiInsight}"</div>}
        </div>

        {/* Right Side: Results & Detailed Steps */}
        <div className="lg:col-span-7 space-y-8">
          {loading ? (
             <div className="bg-white rounded-[2.5rem] h-[400px] flex items-center justify-center border border-slate-100 text-slate-400 font-bold uppercase text-xs tracking-widest animate-pulse">
               Сбор котировок...
             </div>
          ) : results ? (
            <div className="space-y-8 animate-in fade-in duration-700">
              
              {/* Summary Card */}
              <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-start gap-6">
                  <div>
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">Вы получите на руки</p>
                    <h2 className="text-5xl md:text-6xl font-black mb-8 group-hover:scale-105 transition-transform origin-left duration-500">{formatCurrency(results.totalAmount, currencyC)}</h2>
                    <div className="flex gap-4">
                      <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                         <span className="text-[9px] font-black text-indigo-200 uppercase block mb-1">КПД маршрута</span>
                         <span className="text-xl font-black">{results.efficiency.toFixed(1)}%</span>
                      </div>
                      <div className={`px-5 py-3 rounded-2xl border backdrop-blur-sm ${results.totalLossPercent > 3 ? 'bg-orange-500/20 border-orange-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                         <span className="text-[9px] font-black text-white/50 uppercase block mb-1">Потери на спреде</span>
                         <span className="text-xl font-black">{results.totalLossPercent.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-3xl border border-white/5 hidden md:block">
                     <PieChart className="w-12 h-12 text-indigo-200/50" />
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
              </div>

              {/* Transactions Detail */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Info className="w-4 h-4" /> Детализация по шагам
                </h3>

                {results.steps.map((step, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">0{i+1}</div>
                          <span className="font-black text-slate-800 uppercase text-sm">{step.from} <ArrowRight className="inline w-3 h-3 mx-1 text-slate-300" /> {step.to}</span>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          {/* Individual Step Margin Control */}
                          <div className="flex flex-col items-end mr-2">
                             <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Маржа банка:</span>
                                <span className="text-[10px] font-black text-indigo-600">{step.marginPercent}%</span>
                             </div>
                             <button onClick={() => setShowHelperFor(i)} className="text-[8px] font-black text-indigo-400 uppercase hover:underline flex items-center gap-0.5">
                                <Calculator className="w-2.5 h-2.5" /> Калькулятор для этой пары
                             </button>
                          </div>

                          <div className="relative">
                            {editingIndex === i ? (
                              <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                                <input type="number" autoFocus className="w-24 bg-white border-2 border-indigo-400 rounded-xl px-3 py-1.5 text-xs font-black text-indigo-600 outline-none" value={i === 0 ? manualRate1 ?? '' : manualRate2 ?? ''} onChange={(e) => (i === 0 ? setManualRate1(Number(e.target.value)) : setManualRate2(Number(e.target.value)))} onBlur={() => setEditingIndex(null)} />
                                <button onClick={() => { i === 0 ? setManualRate1(null) : setManualRate2(null); setEditingIndex(null); }} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setEditingIndex(i)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${step.isManual ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}>
                                <span className="text-[11px] font-black tabular-nums">Курс: {step.appliedRate.toFixed(4)}</span>
                                <Edit2 className={`w-3 h-3 ${step.isManual ? 'text-white' : 'text-slate-400'}`} />
                              </button>
                            )}
                          </div>
                       </div>
                    </div>

                    {/* Per-step Helper Modal-ish */}
                    {showHelperFor === i && (
                      <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
                         <div className="flex items-start gap-2 text-indigo-900/60">
                           <Info className="w-4 h-4 shrink-0 mt-0.5" />
                           <p className="text-[10px] font-medium">Введите данные <b>именно для этой пары</b> ({step.from}/{step.to}) из таблицы банка, чтобы вычислить специфичный спред.</p>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase">Сдать ({step.from})</label>
                               <input type="number" value={helperSell} onChange={(e) => setHelperSell(e.target.value)} className="w-full p-2 text-xs border border-indigo-200 rounded-lg outline-none focus:border-indigo-400" placeholder="0.0000" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase">Купить ({step.from})</label>
                               <input type="number" value={helperBuy} onChange={(e) => setHelperBuy(e.target.value)} className="w-full p-2 text-xs border border-indigo-200 rounded-lg outline-none focus:border-indigo-400" placeholder="0.0000" />
                            </div>
                         </div>
                         <div className="flex justify-end gap-2">
                            <button onClick={() => setShowHelperFor(null)} className="px-4 py-1.5 text-[10px] font-bold text-slate-400 hover:bg-white rounded-lg transition-colors">Отмена</button>
                            <button onClick={applyHelperMargin} className="px-4 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Применить маржу</button>
                         </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-3xl group/item hover:bg-slate-50 transition-colors">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Продаете</span>
                          <span className="text-xl font-black text-slate-900">{formatCurrency(step.inputAmount, step.from)}</span>
                       </div>
                       <div className="p-5 bg-indigo-50/20 border border-indigo-50 rounded-3xl group/item hover:bg-indigo-50/30 transition-colors">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Получаете</span>
                          <span className="text-xl font-black text-indigo-600">{formatCurrency(step.outputAmount, step.to)}</span>
                       </div>
                    </div>
                  </div>
                ))}

                {/* Direct Comparison Section */}
                <div className="pt-10 border-t border-slate-100 space-y-6">
                   <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                         <h3 className="text-xs font-black text-slate-800 uppercase">Прямой обмен ({currencyA} → {currencyC})</h3>
                         <div className="group relative">
                            <HelpCircle className="w-3 h-3 text-slate-300" />
                            <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-slate-800 text-white text-[9px] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl leading-relaxed">
                               Курс, если бы вы меняли {currencyA} сразу на {currencyC} в этом же банке.
                            </div>
                         </div>
                      </div>
                      <button onClick={() => setEditingIndex(2)} className={`text-[10px] font-bold px-3 py-1 rounded-lg border flex items-center gap-2 transition-all ${manualRateDirect ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                         Курс: {(results.directAmount / amount).toFixed(4)}
                         <Edit2 className="w-2.5 h-2.5" />
                      </button>
                   </div>

                   {editingIndex === 2 && (
                     <div className="animate-in slide-in-from-top-2 duration-200">
                        <input type="number" autoFocus placeholder="Введите курс прямой продажи..." className="w-full bg-slate-50 border-2 border-indigo-100 rounded-2xl px-5 py-4 text-sm font-black text-indigo-600 outline-none" value={manualRateDirect ?? ''} onChange={(e) => setManualRateDirect(Number(e.target.value))} onBlur={() => setEditingIndex(null)} />
                     </div>
                   )}

                   <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
                      <div className="space-y-1 text-center md:text-left">
                         <p className="text-2xl font-black text-slate-800">{formatCurrency(results.directAmount, currencyC)}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Рыночный {currencyA}/{currencyC} минус {marginDirect}% маржи</p>
                      </div>
                      
                      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm border ${results.monetaryLoss > 0 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                         {results.monetaryLoss > 0 ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                         <div className="flex flex-col">
                            <span className="text-[9px] uppercase opacity-60">{results.monetaryLoss > 0 ? 'Лишние потери' : 'Экономия'}</span>
                            <span>{results.monetaryLoss > 0 ? '-' : '+'} {formatCurrency(Math.abs(results.monetaryLoss), currencyC)}</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Educational Hint */}
              <div className="p-6 bg-white rounded-3xl border border-slate-100 flex gap-4 items-start shadow-sm">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <Settings2 className="w-5 h-5 text-indigo-500" />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-800 uppercase">Почему курсы разные?</p>
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      Для популярных пар (USD/BYN) маржа банка минимальна (около 0.2-0.5%). Для редких пар (PLN, TRY) или кросс-курсов (EUR/USD) банк закладывает гораздо больший риск, и спред может достигать 5-7%. <b>Используйте индивидуальные настройки маржи для каждого шага.</b>
                    </p>
                 </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 mt-20 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] text-center pb-10">
        Professional Currency Efficiency Tool • 2024
      </footer>
    </div>
  );
};

export default App;
