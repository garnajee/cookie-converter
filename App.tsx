import React, { useState } from 'react';
import { 
  FileJson, 
  FileText, 
} from 'lucide-react';
import { ValidationStatus } from './components/ValidationStatus';
import { EditorPane } from './components/EditorPane';
import { jsonToNetscape, netscapeToJson, validateCookies } from './services/cookieService';
import { ValidationIssue } from './types';

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
  const [jsonVal, setJsonVal] = useState('');
  const [netscapeVal, setNetscapeVal] = useState('');
  
  // Track where the last edit came from to show relevant validation
  const [lastEditedSource, setLastEditedSource] = useState<'JSON' | 'NETSCAPE' | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  const handleJsonChange = (text: string) => {
    setJsonVal(text);
    setLastEditedSource('JSON');

    // 1. Validate JSON source
    const issues = validateCookies(text, 'JSON_TO_NETSCAPE');
    setValidationIssues(issues);

    // 2. Try Convert to Netscape
    if (!text.trim()) {
        // If empty, clear the other side
        setNetscapeVal('');
        return;
    }

    // Only attempt conversion if syntax looks roughly like JSON to avoid annoying errors while typing
    if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        try {
            const converted = jsonToNetscape(text);
            setNetscapeVal(converted);
        } catch (e) {
            // If conversion fails (e.g. invalid JSON while typing), we simply don't update the output yet
            // This preserves the last valid state or prevents flashing empty
        }
    }
  };

  const handleNetscapeChange = (text: string) => {
    setNetscapeVal(text);
    setLastEditedSource('NETSCAPE');

    // 1. Validate Netscape source
    const issues = validateCookies(text, 'NETSCAPE_TO_JSON');
    setValidationIssues(issues);

    // 2. Try Convert to JSON
    if (!text.trim()) {
        setJsonVal('');
        return;
    }

    try {
        const converted = netscapeToJson(text);
        setJsonVal(converted);
    } catch (e) {
        // Ignore conversion errors while typing
    }
  };

  const handleClearAll = () => {
      setJsonVal('');
      setNetscapeVal('');
      setValidationIssues([]);
      setLastEditedSource(null);
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
            Bidirectional converter. Type in either box to convert instantly.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Global Actions could go here, e.g. Clear All */}
           <button 
             onClick={handleClearAll}
             className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
           >
             Reset Fields
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full flex flex-col gap-6 flex-1">
        
        {/* Validation Report Area */}
        <ValidationStatus issues={validationIssues} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 h-full min-h-[500px]">
          
          {/* JSON Editor Pane */}
          <EditorPane
            title="JSON Format"
            icon={<FileJson size={18} />}
            headerColorClass="text-yellow-500"
            value={jsonVal}
            onChange={handleJsonChange}
            placeholder={PLACEHOLDER_JSON}
            fileExtension=".json"
            baseFileName="cookies"
          />

          {/* Netscape Editor Pane */}
          <EditorPane
            title="Netscape HTTP Cookie File"
            icon={<FileText size={18} />}
            headerColorClass="text-blue-500"
            value={netscapeVal}
            onChange={handleNetscapeChange}
            placeholder={PLACEHOLDER_NETSCAPE}
            fileExtension=".txt"
            baseFileName="cookies-netscape"
          />

        </div>

      </main>
      
      <footer className="mt-8 text-slate-500 text-xs text-center pb-4">
        <p>Values are processed locally in your browser. No data is sent to any server.</p>
      </footer>
    </div>
  );
};

export default App;

