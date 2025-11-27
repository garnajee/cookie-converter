import React, { useRef, useState } from 'react';
import { Upload, Download, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface EditorPaneProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  fileExtension: string;
  baseFileName: string;
  headerColorClass: string; // e.g., "text-blue-500"
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  title,
  icon,
  value,
  onChange,
  placeholder,
  fileExtension,
  baseFileName,
  headerColorClass,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    if (!value) return;
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `${baseFileName}-${timestamp}${fileExtension}`;
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
        onChange(content);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset
  };

  return (
    <section className="flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl h-full min-h-[400px]">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className={`flex items-center gap-2 font-medium ${headerColorClass}`}>
          {icon}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept={fileExtension}
          />
          
          <Button 
            variant="secondary" 
            onClick={() => fileInputRef.current?.click()} 
            className="!px-3 !py-1.5 text-xs hidden sm:inline-flex"
            title="Upload File"
          >
            <Upload size={14} className="mr-1.5" />
            Upload
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => fileInputRef.current?.click()} 
            className="!px-2 !py-1.5 sm:hidden"
            title="Upload File"
          >
            <Upload size={16} />
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleCopy} 
            disabled={!value}
            className="!px-3 !py-1.5 text-xs hidden sm:inline-flex"
            title="Copy to Clipboard"
          >
            {copySuccess ? <CheckCircle2 size={14} className="mr-1.5 text-green-400" /> : <Copy size={14} className="mr-1.5" />}
            {copySuccess ? 'Copied' : 'Copy'}
          </Button>

           <Button 
            variant="ghost" 
            onClick={handleCopy} 
            disabled={!value}
            className="!px-2 !py-1.5 sm:hidden"
            title="Copy"
          >
             {copySuccess ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
          </Button>

          <Button 
            variant="primary" 
            onClick={handleDownload} 
            disabled={!value}
            className="!px-3 !py-1.5 text-xs hidden sm:inline-flex"
            title="Download File"
          >
            <Download size={14} className="mr-1.5" />
            Download
          </Button>

           <Button 
            variant="ghost" 
            onClick={handleDownload} 
            disabled={!value}
            className="!px-2 !py-1.5 sm:hidden"
            title="Download"
          >
            <Download size={16} />
          </Button>

          <div className="w-px h-6 bg-slate-800 mx-1"></div>

          <Button 
            variant="ghost" 
            onClick={() => onChange('')}
            className="!px-2 !py-1.5 hover:text-red-400"
            title="Clear"
            disabled={!value}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 relative group bg-slate-950/50">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full bg-transparent p-4 font-mono text-sm text-slate-300 focus:outline-none resize-none placeholder:text-slate-700 leading-relaxed"
          spellCheck={false}
        />
      </div>
    </section>
  );
};

