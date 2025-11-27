import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, 
  Download, 
  Copy, 
  Upload, 
  FileJson, 
  FileText, 
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from './components/Button';
import { ValidationStatus } from './components/ValidationStatus';
import { jsonToNetscape, netscapeToJson, validateCookies } from './services/cookieService';
import { ConversionMode, ValidationIssue } from './types';

const PLACEHOLDER_JSON = `[
    {
        "domain": ".netflix.com",
        "expirationDate": 1795759518,
        "hostOnly": false,
        "httpOnly": true,
        "name": "SecureNetflixId",
        "path": "/",
        "secure": true,
        "value": "v%3D3%26mac%3D..."
    }
]`;

const PLACEHOLDER_NETSCAPE = `# Netscape HTTP Cookie File
# http://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

.netflix.com	TRUE	/	TRUE	1795759518	SecureNetflixId	v%3D3%26mac%3D...`;

const App: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>('JSON_TO_NETSCAPE');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-convert on input change
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setValidationIssues([]);
      return;
    }

    const timer = setTimeout(() => {
      // 1. Validate Input
      const issues = validateCookies(input, mode);
      setValidationIssues(issues);

      // 2. Attempt Conversion
      try {
        let result = '';
        if (mode === 'JSON_TO_NETSCAPE') {
          result = jsonToNetscape(input);
        } else {
          result = netscapeToJson(input);
        }
        setOutput(result);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred during conversion");
        }
        // If critical conversion error, clear output
        setOutput(''); 
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [input, mode]);

  const handleSwap = () => {
    setMode(prev => prev === 'JSON_TO_NETSCAPE' ? 'NETSCAPE_TO_JSON' : 'JSON_TO_NETSCAPE');
    setInput('');
    setOutput('');
    setError(null);
    setValidationIssues([]);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = mode === 'JSON_TO_NETSCAPE' ? '.txt' : '.json';
    const filename = `cookies-${timestamp}${extension}`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setInput(content);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const getInputPlaceholder = () => {
    return mode === 'JSON_TO_NETSCAPE' ? PLACEHOLDER_JSON : PLACEHOLDER_NETSCAPE;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 flex flex-col items-center">
      
      {/* Header */}
      <header className="max-w-7xl w-full mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            Cookie Converter
          </h1>
          <p className="text-slate-400 text-sm">
            Convert browser cookies between JSON and Netscape HTTP Cookie File formats.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('JSON_TO_NETSCAPE')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'JSON_TO_NETSCAPE' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            JSON <span className="text-indigo-200">→</span> Netscape
          </button>
          <button
             onClick={handleSwap}
             className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
             title="Swap formats"
          >
            <ArrowLeftRight size={18} />
          </button>
          <button
            onClick={() => setMode('NETSCAPE_TO_JSON')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'NETSCAPE_TO_JSON' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Netscape <span className="text-indigo-200">→</span> JSON
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full h-[calc(100vh-12rem)] min-h-[500px] flex flex-col">
        
        {/* Validation Report Area */}
        <ValidationStatus issues={validationIssues} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* INPUT PANE */}
          <section className="flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100 font-medium">
                {mode === 'JSON_TO_NETSCAPE' ? <FileJson size={18} className="text-yellow-500" /> : <FileText size={18} className="text-blue-500" />}
                <span>Input {mode === 'JSON_TO_NETSCAPE' ? '(JSON)' : '(Netscape)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept={mode === 'JSON_TO_NETSCAPE' ? '.json' : '.txt'}
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="!px-3 !py-1.5 text-xs">
                  <Upload size={14} className="mr-1.5" />
                  Upload File
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => { setInput(''); setOutput(''); setValidationIssues([]); setError(null); }}
                  className="!px-2 !py-1.5"
                  title="Clear input"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getInputPlaceholder()}
                className="w-full h-full bg-slate-950/50 p-4 font-mono text-sm text-slate-300 focus:outline-none resize-none placeholder:text-slate-700"
                spellCheck={false}
              />
            </div>
          </section>

          {/* OUTPUT PANE */}
          <section className="flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl relative">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100 font-medium">
                {mode === 'JSON_TO_NETSCAPE' ? <FileText size={18} className="text-blue-500" /> : <FileJson size={18} className="text-yellow-500" />}
                <span>Output {mode === 'JSON_TO_NETSCAPE' ? '(Netscape)' : '(JSON)'}</span>
              </div>
              <div className="flex items-center gap-2">
                 <Button 
                  variant="secondary" 
                  onClick={handleCopy} 
                  disabled={!output}
                  className="!px-3 !py-1.5 text-xs"
                >
                  {copySuccess ? <CheckCircle2 size={14} className="mr-1.5 text-green-400" /> : <Copy size={14} className="mr-1.5" />}
                  {copySuccess ? 'Copied' : 'Copy'}
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleDownload} 
                  disabled={!output}
                  className="!px-3 !py-1.5 text-xs"
                >
                  <Download size={14} className="mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="flex-1 relative bg-slate-950/30">
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-sm">
                    <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
                    <h3 className="text-red-400 font-medium mb-1">Conversion Failed</h3>
                    <p className="text-red-300/70 text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                <textarea
                  readOnly
                  value={output}
                  placeholder="Result will appear here..."
                  className="w-full h-full bg-transparent p-4 font-mono text-sm text-green-300 focus:outline-none resize-none placeholder:text-slate-700"
                  spellCheck={false}
                />
              )}
            </div>
          </section>
        </div>

      </main>
      
      <footer className="mt-8 text-slate-500 text-xs text-center">
        <p>Values are processed locally in your browser. No data is sent to any server.</p>
      </footer>
    </div>
  );
};

export default App;