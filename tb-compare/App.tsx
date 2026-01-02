import React, { useState } from 'react';
import { DropZone } from './components/DropZone';
import { ResultTable } from './components/ResultTable';
import { parseExcelFile } from './services/excelParser';
import { compareTBs } from './services/comparator';
import { generateAndDownloadExcel } from './services/excelWriter';
import { generateVarianceAnalysis } from './services/geminiService';
import { TBRow, CompareMode, ProcessedData } from './types';
import { ArrowRightLeft, FileOutput, Loader2, Sparkles, AlertCircle, Scale, Check, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [mode, setMode] = useState<CompareMode>(CompareMode.VERSION);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCompare = async () => {
    if (!fileA || !fileB) {
      setError("Please upload both Trial Balance files.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setAiAnalysis(null);

    try {
      // 1. Parse
      const [dataA, dataB] = await Promise.all([
        parseExcelFile(fileA),
        parseExcelFile(fileB)
      ]);

      // 2. Compare
      const comparisonResult = compareTBs(dataA, dataB, mode);
      
      // Artificial delay for UX smoothing
      await new Promise(r => setTimeout(r, 600));

      setResult(comparisonResult);
    } catch (err: any) {
      setError(err.message || "An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      generateAndDownloadExcel(result, mode);
    }
  };

  const handleAiAnalysis = async () => {
    if (!result) return;
    setIsAnalyzing(true);
    // Get top 5 variances
    const topVariances = [...result.rows]
        .sort((a, b) => Math.abs(b.delta || 0) - Math.abs(a.delta || 0))
        .slice(0, 10);
        
    const text = await generateVarianceAnalysis(result.summary, topVariances, mode);
    setAiAnalysis(text);
    setIsAnalyzing(false);
  };

  const reset = () => {
    setResult(null);
    setFileA(null);
    setFileB(null);
    setAiAnalysis(null);
    setError(null);
  };

  const formatCurrency = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
              TB Compare Pro
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             {result && (
               <button 
                 onClick={reset}
                 className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
               >
                 Start Over
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
            <div className="flex-1 text-sm text-rose-800">{error}</div>
            <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 font-medium text-sm">Dismiss</button>
          </div>
        )}

        {/* Input Section */}
        {!result && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Upload Data</h2>
              <p className="text-slate-500 text-lg">Select your baseline and comparison files to detect variances.</p>
            </div>

            <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-200 flex">
              <button
                onClick={() => setMode(CompareMode.VERSION)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  mode === CompareMode.VERSION
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Version Compare (Same Year)
              </button>
              <button
                onClick={() => setMode(CompareMode.YEAR)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  mode === CompareMode.YEAR
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Year Compare (YoY)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropZone 
                label={mode === CompareMode.VERSION ? "Baseline Version (TB A)" : "Prior Year (TB A)"} 
                file={fileA} 
                onFileSelect={setFileA} 
                color="blue" 
              />
              <DropZone 
                label={mode === CompareMode.VERSION ? "New Version (TB B)" : "Current Year (TB B)"} 
                file={fileB} 
                onFileSelect={setFileB} 
                color="indigo" 
              />
            </div>

            <button
              onClick={handleCompare}
              disabled={!fileA || !fileB || isProcessing}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] ${
                !fileA || !fileB 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Logic...</span>
                </>
              ) : (
                <span>Run Comparison</span>
              )}
            </button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Balance Check Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${result.summary.isBalancedA ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                 <div className="flex items-center space-x-3">
                    <Scale className={`w-5 h-5 ${result.summary.isBalancedA ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div>
                       <p className="text-sm font-medium text-slate-700">TB A Balance Check</p>
                       <p className={`text-sm ${result.summary.isBalancedA ? 'text-emerald-600' : 'text-amber-700 font-bold'}`}>
                         Sum: {formatCurrency(result.summary.sumA)}
                       </p>
                    </div>
                 </div>
                 {result.summary.isBalancedA ? <Check className="w-5 h-5 text-emerald-500"/> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
              </div>
              <div className={`p-4 rounded-xl border flex items-center justify-between ${result.summary.isBalancedB ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                 <div className="flex items-center space-x-3">
                    <Scale className={`w-5 h-5 ${result.summary.isBalancedB ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div>
                       <p className="text-sm font-medium text-slate-700">TB B Balance Check</p>
                       <p className={`text-sm ${result.summary.isBalancedB ? 'text-emerald-600' : 'text-amber-700 font-bold'}`}>
                         Sum: {formatCurrency(result.summary.sumB)}
                       </p>
                    </div>
                 </div>
                 {result.summary.isBalancedB ? <Check className="w-5 h-5 text-emerald-500"/> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Net Delta</p>
                <p className={`text-xl font-bold mt-1 ${result.summary.netDelta < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatCurrency(result.summary.netDelta)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Changed</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{result.summary.changed + result.summary.renamed}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">New</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{result.summary.new}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Removed</p>
                <p className="text-xl font-bold text-rose-600 mt-1">{result.summary.removed}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Unchanged</p>
                <p className="text-xl font-bold text-slate-400 mt-1">{result.summary.unchanged}</p>
              </div>
            </div>

            {/* AI Analysis (Bonus Feature) */}
            {aiAnalysis ? (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-24 h-24 text-indigo-900" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-indigo-900">AI Variance Insight</h3>
                    </div>
                    <p className="text-indigo-900/80 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                        {aiAnalysis}
                    </p>
                </div>
            ) : (
                <div className="flex justify-end">
                    <button 
                        onClick={handleAiAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                        <span>Generate AI Insight</span>
                    </button>
                </div>
            )}

            {/* Table */}
            <ResultTable data={result} mode={mode} />

            {/* Action Footer */}
            <div className="sticky bottom-6 flex justify-center">
              <button
                onClick={handleDownload}
                className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-300 py-3 px-8 rounded-full font-semibold flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
              >
                <FileOutput className="w-5 h-5" />
                <span>Download Excel Report</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;