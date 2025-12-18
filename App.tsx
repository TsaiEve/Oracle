
import React, { useState, useCallback, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { AppStep } from './types';
import type { FortuneMethod, UserInfo, RequiredField } from './types';
import { getFortuneTellingMethod, generateFortuneStream } from './services/geminiService';
import Spinner from './components/Spinner';

const DynamicFormField: React.FC<{ field: RequiredField; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; }> = ({ field, value, onChange }) => {
    const baseClasses = "w-full bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-500 outline-none backdrop-blur-sm";
    switch (field.type) {
        case 'select':
            return (
                <select name={field.name} value={value} onChange={onChange} className={baseClasses}>
                    <option value="">選擇 {field.label} 參數</option>
                    {field.options?.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                </select>
            );
        case 'datetime-local':
            return <input type="datetime-local" name={field.name} value={value} onChange={onChange} className={baseClasses} required />;
        default:
            return <input type="text" name={field.name} value={value} onChange={onChange} placeholder={field.placeholder || `輸入您的 ${field.label}`} className={baseClasses} required />;
    }
};

const App: React.FC = () => {
    const [step, setStep] = useState<AppStep>(AppStep.WISH);
    const [wish, setWish] = useState<string>('');
    const [method, setMethod] = useState<FortuneMethod | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo>({});
    const [resultStream, setResultStream] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const resultEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (step === AppStep.RESULT) {
            resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [resultStream, step]);

    const renderMarkdown = (text: string) => {
        // @ts-ignore
        return { __html: window.marked.parse(text) };
    };

    const handleWishSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!wish.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const fortuneMethod = await getFortuneTellingMethod(wish);
            setMethod(fortuneMethod);
            const initialUserInfo = fortuneMethod.required_fields.reduce((acc, field) => {
                acc[field.name] = '';
                return acc;
            }, {} as UserInfo);
            setUserInfo(initialUserInfo);
            setStep(AppStep.INFO_GATHERING);
        } catch (err: any) {
            setError(err.message || '連線超時，量子場不穩定。');
        } finally {
            setIsLoading(false);
        }
    }, [wish]);
    
    const handleInfoSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!method) return;
        setIsLoading(true);
        setError('');
        setResultStream('');
        setStep(AppStep.RESULT);

        try {
            const stream = await generateFortuneStream(wish, method, userInfo);
            for await (const text of stream) {
                setResultStream(prev => prev + text);
            }
        } catch (err: any) {
            setError(err.message || '解碼失敗，命運鏈發生衝突。');
        } finally {
            setIsLoading(false);
        }
    }, [wish, method, userInfo]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-2xl glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden neon-border">
                {/* Header Section */}
                <header className="text-center mb-12">
                    <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 mb-6 border border-white/10">
                        <svg className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 font-display uppercase italic">AI Oracle <span className="text-cyan-400">Nexus</span></h1>
                    <p className="text-slate-400 font-tech text-xs tracking-[0.3em] uppercase">Multi-dimensional Destiny Decoder</p>
                </header>

                {error && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl mb-8 text-sm text-center font-tech">{error}</div>}

                <main>
                    {step === AppStep.WISH && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-white mb-2">同步您的意識</h2>
                                <p className="text-slate-500 text-sm">輸入您想解析的未來願景或困惑</p>
                            </div>
                            <form onSubmit={handleWishSubmit} className="space-y-6">
                                <textarea
                                    value={wish}
                                    onChange={(e) => setWish(e.target.value)}
                                    placeholder="例：解析我的事業潛能、搜尋下一個情感波峰..."
                                    className="w-full h-44 bg-slate-900/40 border border-slate-700/50 rounded-2xl p-5 text-lg text-slate-100 placeholder-slate-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all resize-none backdrop-blur-md"
                                    disabled={isLoading}
                                />
                                <button type="submit" disabled={isLoading || !wish.trim()} className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-lg tracking-widest transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-30 group">
                                    {isLoading ? <Spinner /> : <span className="flex items-center justify-center gap-2">啟動未來模擬 <span className="group-hover:translate-x-1 transition-transform">→</span></span>}
                                </button>
                            </form>
                        </div>
                    )}

                    {step === AppStep.INFO_GATHERING && method && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                                    解析模式：{method.name}
                                </h3>
                                <p className="text-slate-400 text-sm italic">{method.description}</p>
                            </div>
                            <form onSubmit={handleInfoSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-5">
                                    {method.required_fields.map(field => (
                                        <div key={field.name}>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{field.label}</label>
                                            <DynamicFormField field={field} value={userInfo[field.name] || ''} onChange={(e) => setUserInfo(p => ({...p, [e.target.name]: e.target.value}))} />
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-5 rounded-2xl bg-white text-slate-950 font-black text-lg tracking-widest hover:bg-cyan-400 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                    {isLoading ? <Spinner /> : '同步數據並解碼'}
                                </button>
                            </form>
                        </div>
                    )}

                    {step === AppStep.RESULT && (
                        <div className="animate-in fade-in zoom-in-95 duration-1000">
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                <h2 className="text-2xl font-black italic tracking-wider text-white">未來系統報告</h2>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                </div>
                            </div>
                            <div className="bg-slate-950/40 rounded-3xl p-6 md:p-10 border border-white/5 shadow-inner max-h-[65vh] overflow-y-auto scrollbar-hide">
                                <div className="markdown-content" dangerouslySetInnerHTML={renderMarkdown(resultStream)} />
                                {isLoading && (
                                    <div className="flex flex-col items-center gap-4 mt-10">
                                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 animate-progress"></div>
                                        </div>
                                        <p className="text-[10px] text-cyan-500 font-tech animate-pulse uppercase tracking-[0.5em]">Quantum Calculating...</p>
                                    </div>
                                )}
                                <div ref={resultEndRef} />
                            </div>
                            {!isLoading && (
                                <button onClick={() => setStep(AppStep.WISH)} className="mt-10 w-full py-4 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all font-tech text-xs tracking-widest uppercase">
                                    重置連線 / 解析新維度
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
            
            <footer className="fixed bottom-6 text-[10px] text-slate-600 font-tech tracking-[0.4em] uppercase">
                Oracle Nexus v2.0 // System Stable
            </footer>

            <style>{`
                .animate-progress {
                    width: 0%;
                    animation: prog 2s ease-in-out infinite;
                }
                @keyframes prog {
                    0% { width: 0%; transform: translateX(-100%); }
                    50% { width: 70%; transform: translateX(0%); }
                    100% { width: 0%; transform: translateX(100%); }
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default App;
