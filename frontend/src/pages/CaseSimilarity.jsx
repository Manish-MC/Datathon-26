import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Search, ArrowRight } from 'lucide-react';

export default function CaseSimilarity() {
  const [caseId, setCaseId] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (caseId.trim()) {
      navigate(`/case/${caseId}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#070b13] min-h-full">
      <div className="max-w-4xl mx-auto mt-20">
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-12 text-center shadow-xl relative overflow-hidden">
          
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full flex justify-center items-center opacity-5 pointer-events-none">
            <Layers className="w-96 h-96 text-blue-500" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-blue-600/10 p-4 rounded-full border border-blue-500/30 mb-6">
              <Layers className="w-10 h-10 text-blue-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">Case Similarity Match</h2>
            
            <p className="text-slate-400 mb-8 max-w-lg leading-relaxed">
              Discover patterns and linkages between cases. To view similarity clusters, please navigate to a specific case from the Executive Dashboard or enter a Case ID below.
            </p>

            <form onSubmit={handleSearch} className="w-full max-w-md relative flex items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Case ID (e.g. 101)"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full bg-[#111726] border border-slate-700 rounded-l-lg py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={!caseId.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-r-lg font-medium text-sm transition-colors border border-blue-600 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <span>Analyze</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
