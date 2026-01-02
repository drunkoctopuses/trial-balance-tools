
import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { AppStatus, TBCleanedRow, ProcessingResult } from './types';
import { processTBWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus(AppStatus.PARSING);
      setErrorMsg(null);
      
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          
          // Convert to JSON with raw values to give the AI enough context
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
          // Increase slice limit to handle larger files, though extremely large files might hit token limits.
          // 3000 rows is a reasonable balance for the Flash model's context window.
          const rawDataString = JSON.stringify(rawData.slice(0, 3000)); 

          setStatus(AppStatus.MAPPING);
          const cleanedData = await processTBWithAI(rawDataString);

          setStatus(AppStatus.VALIDATING);
          const totalSum = cleanedData.reduce((acc, row) => acc + (row.amount || 0), 0);
          
          // Validation threshold strictly 0.01 per requirements
          const isBalanced = Math.abs(totalSum) <= 0.01;

          setResult({
            data: cleanedData,
            isBalanced,
            totalSum
          });
          setStatus(AppStatus.COMPLETE);
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to process the file.");
          setStatus(AppStatus.ERROR);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleExport = () => {
    if (!result) return;
    
    // 1. Sort by Account Number (Ascending)
    // Handle empty accounts (like Rounding) by placing them at the end or based on string comparison
    const sortedData = [...result.data].sort((a, b) => {
      // Extract first sequence of digits for numeric sort if possible
      const numA = parseInt(a.accountNumber.replace(/^\D+/g, '')) || 0;
      const numB = parseInt(b.accountNumber.replace(/^\D+/g, '')) || 0;
      
      if (numA === numB) {
         return a.accountNumber.localeCompare(b.accountNumber);
      }
      return numA - numB;
    });

    // 2. Prepare Rows
    // Row 1: Balance Status
    const balanceText = result.isBalanced 
        ? `✅ Balanced: Sum = ${result.totalSum.toFixed(2)}`
        : `⚠️ Not Balanced: Sum = ${result.totalSum.toFixed(2)}`;

    // Row 2: Headers
    const headers = ["Account Number", "Account Description", "Amount"];

    // Row 3+: Data
    const dataRows = sortedData.map(r => [
      r.accountNumber,
      r.accountDescription,
      r.amount
    ]);

    const aoa = [
        [balanceText],
        headers,
        ...dataRows
    ];
    
    // 3. Create Sheet
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TB_Clean");
    
    XLSX.writeFile(wb, "TB_Cleaned_Output.xlsx");
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <i className="fa-solid fa-file-invoice-dollar text-indigo-600"></i>
            TB Mapping Engine
          </h1>
          <p className="text-slate-500 mt-1">Professional Trial Balance Cleaning & Standardizing Service</p>
        </div>
        {status === AppStatus.COMPLETE && (
          <div className="flex gap-2">
             <button 
              onClick={reset}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
            >
              Upload New
            </button>
            <button 
              onClick={handleExport}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-download"></i>
              Export Cleaned Excel
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto">
        {status === AppStatus.IDLE && (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer group relative">
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Drop your Trial Balance here</h3>
              <p className="text-slate-500 mt-2">Supports Excel (.xlsx, .xls) and CSV files</p>
              <div className="mt-6 px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">
                Choose File
              </div>
            </div>
          </div>
        )}

        {(status === AppStatus.PARSING || status === AppStatus.MAPPING || status === AppStatus.VALIDATING) && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-semibold text-slate-800 mb-2">
              {status === AppStatus.PARSING && "Analyzing File Structure..."}
              {status === AppStatus.MAPPING && "Mapping Accounts via AI..."}
              {status === AppStatus.VALIDATING && "Validating Balance..."}
            </h3>
            <p className="text-slate-500">This may take a few moments depending on the TB size.</p>
          </div>
        )}

        {status === AppStatus.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-red-800">Processing Failed</h3>
            <p className="text-red-600 mt-2 mb-6">{errorMsg || "An error occurred while mapping the Trial Balance."}</p>
            <button 
              onClick={reset}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {status === AppStatus.COMPLETE && result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Rows</p>
                <p className="text-2xl font-bold text-slate-900">{result.data.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Net Balance</p>
                <p className={`text-2xl font-bold ${result.isBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {result.totalSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`p-6 rounded-xl border shadow-sm ${result.isBalanced ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-sm font-medium text-slate-700 mb-1">Status</p>
                <p className={`text-2xl font-bold flex items-center gap-2 ${result.isBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {result.isBalanced ? (
                    <><i className="fa-solid fa-circle-check"></i> Balanced</>
                  ) : (
                    <><i className="fa-solid fa-triangle-exclamation"></i> ⚠️ Not Balanced</>
                  )}
                </p>
              </div>
            </div>

            {/* Preview Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-bottom border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Standardized TB Preview</h3>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Sheet: TB_Clean</span>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Account Number</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase bg-slate-50">Account Description</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase bg-slate-50 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-mono text-slate-600">{row.accountNumber || "—"}</td>
                        <td className="px-6 py-3 text-sm text-slate-800">{row.accountDescription}</td>
                        <td className={`px-6 py-3 text-sm text-right font-medium ${row.amount < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                          {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm mb-10">
        &copy; {new Date().getFullYear()} TB Mapping Engine. Strictly follows Accounting Compliance Protocols.
      </footer>
    </div>
  );
};

export default App;
