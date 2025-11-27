import React from 'react';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { ValidationIssue } from '../types';

interface Props {
  issues: ValidationIssue[];
}

export const ValidationStatus: React.FC<Props> = ({ issues }) => {
  if (issues.length === 0) return null;

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');

  // If there are issues, determine the main color theme
  const hasErrors = errors.length > 0;
  
  return (
    <div className={`rounded-xl overflow-hidden mb-6 border ${hasErrors ? 'border-red-500/20' : 'border-yellow-500/20'}`}>
      <div className={`px-4 py-2 border-b flex items-center justify-between ${hasErrors ? 'bg-red-900/20 border-red-500/20' : 'bg-yellow-900/20 border-yellow-500/20'}`}>
         <h3 className={`text-sm font-semibold flex items-center gap-2 ${hasErrors ? 'text-red-200' : 'text-yellow-200'}`}>
            {hasErrors ? <XCircle size={16} /> : <AlertTriangle size={16} />}
            Validation Report
         </h3>
         <span className="text-xs font-mono text-slate-400">
           {errors.length} Errors, {warnings.length} Warnings
         </span>
      </div>
      <div className="max-h-40 overflow-y-auto p-2 bg-slate-900/50">
         {issues.map((issue, idx) => (
           <div key={idx} className={`text-xs p-2 rounded flex items-start gap-2 mb-1 last:mb-0 transition-colors ${
               issue.type === 'error' 
                 ? 'bg-red-500/10 text-red-200 hover:bg-red-500/15' 
                 : 'bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/15'
             }`}>
              {issue.type === 'error' ? 
                <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" /> : 
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-400" />
              }
              <span className="break-all">
                {issue.line && <span className="font-mono opacity-60 mr-1.5">[Line {issue.line}]</span>}
                {issue.message}
              </span>
           </div>
         ))}
      </div>
    </div>
  );
};