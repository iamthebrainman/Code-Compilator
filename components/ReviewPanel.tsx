
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { AnalysisIcon } from './icons/AnalysisIcon';
import { SendIcon } from './icons/SendIcon';
import { GeminiIcon } from './icons/GeminiIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SearchIcon } from './icons/SearchIcon';

interface ReviewPanelProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  isReplying: boolean;
  error: string;
  hasFiles: boolean;
  onSendMessage: (message: string) => void;
  onCancel: () => void;
}

const LOADING_MESSAGES = [
    'Establishing connection with Gemini...',
    'Uploading file context...',
    'Analyzing overall code structure...',
    'Identifying strengths and weaknesses...',
    'Cross-referencing Python best practices...',
    'Synthesizing the super script...',
    'Formatting the final response...',
];

const LoadingIndicator: React.FC<{ onCancel: () => void; }> = ({ onCancel }) => {
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
    useEffect(() => {
      const interval = setInterval(() => {
          setLoadingMessageIndex(prevIndex => (prevIndex + 1) % LOADING_MESSAGES.length);
      }, 2500);
  
      return () => clearInterval(interval);
    }, []);
  
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg">Gemini is analyzing your code...</p>
        <p className="mt-2 text-sm text-gray-400 h-5 px-4">
          {LOADING_MESSAGES[loadingMessageIndex]}
        </p>
        <button
          onClick={onCancel}
          className="mt-6 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
        >
          Cancel Analysis
        </button>
      </div>
    );
};

// A dedicated component for rendering a code block with a copy button
const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="relative bg-gray-900 p-4 rounded-md my-4 text-sm">
      <div className="absolute top-2 right-2 flex space-x-2">
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-gray-700 text-xs text-white rounded hover:bg-gray-600 transition-colors"
          aria-label="Copy code"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto pt-8">
        <code className="font-mono text-green-300">{code}</code>
      </pre>
    </div>
  );
};

const Highlight: React.FC<{ text: string, highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <>{text}</>;
    }
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-400 text-black rounded px-1">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

// A component to render markdown content
const MarkdownRenderer: React.FC<{ text: string, searchQuery: string }> = ({ text, searchQuery }) => {
  const elements = text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      const content = line.substring(2, line.length - 2);
      return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-blue-400"><Highlight text={content} highlight={searchQuery} /></h3>;
    }
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const content = line.substring(2);
      return <li key={i} className="ml-6 list-disc"><Highlight text={content} highlight={searchQuery} /></li>;
    }
    if (line.trim() !== '') {
      return <p key={i} className="my-2 text-gray-300 leading-relaxed"><Highlight text={line} highlight={searchQuery} /></p>;
    }
    return null;
  }).filter(Boolean);

  return <>{elements}</>;
};

const FormattedReview: React.FC<{ text: string, searchQuery: string }> = ({ text, searchQuery }) => {
  if (!text) {
    return <p className="text-gray-400 animate-pulse">Receiving response...</p>;
  }

  const codeBlockRegex = /(```(?:python)?[\s\S]*?```)/g;
  
  const renderContent = (content: string) => {
    if (!content || content.trim() === '') return null;
    const parts = content.split(codeBlockRegex);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```(?:python)?\n?|\n?```/g, '');
        return <CodeBlock key={index} code={code} />;
      }
      return <MarkdownRenderer key={index} text={part} searchQuery={searchQuery} />;
    });
  };

  const scriptHeaderRegex = /\*\*Part 2: The Advanced Super Script\*\*|\*\*Part 2: The Super Script\*\*|\*\*The Super Script\*\*/;
  const sections = text.split(scriptHeaderRegex);

  const analysisContent = sections[0]?.replace(/\*\*Part 1: Best Practices & Novelty Analysis\*\*|\*\*Part 1: Best Practices Analysis\*\*/, '') || '';
  const scriptContent = sections[1] || '';
  
  const scriptCodeBlocks = (scriptContent.match(codeBlockRegex) || [])
    .map(block => block.replace(/```(?:python)?\n?|\n?```/g, ''));

  const handleDownloadScript = () => {
    const combinedCode = scriptCodeBlocks.join('\n\n# --- Synthesizer: Appended from next code block ---\n\n');
    const blob = new Blob([combinedCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synthesized_script.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {analysisContent.trim() && (
        <div>
          <h2 className="text-xl font-bold text-blue-300">Best Practices Analysis</h2>
          <div className="mt-2 border-t border-gray-600 pt-2">{renderContent(analysisContent)}</div>
        </div>
      )}
      {scriptContent.trim() && (
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-300">Synthesized Super Script</h2>
            {scriptCodeBlocks.length > 0 && (
                <button
                onClick={handleDownloadScript}
                className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-colors"
                aria-label="Download synthesized script"
                >
                <DownloadIcon className="w-4 h-4" />
                <span>Download Script</span>
                </button>
            )}
          </div>
           <div className="mt-2 border-t border-gray-600 pt-2">{renderContent(scriptContent)}</div>
        </div>
      )}
      {/* Fallback for general markdown if structured headers aren't found */}
      {!scriptHeaderRegex.test(text) && renderContent(text)}
    </div>
  );
};

const ChatInput: React.FC<{ onSendMessage: (message: string) => void; isReplying: boolean }> = ({ onSendMessage, isReplying }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isReplying) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isReplying ? "Waiting for response..." : "Ask a follow-up question..."}
          className="flex-grow w-full bg-gray-700 text-white rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          disabled={isReplying}
          aria-label="Chat input"
        />
        <button 
          type="submit" 
          disabled={isReplying || !input.trim()} 
          className="flex-shrink-0 bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Send message"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};


const ReviewPanel: React.FC<ReviewPanelProps> = ({ chatHistory, isLoading, isReplying, error, hasFiles, onSendMessage, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, searchQuery]);

  const filteredHistory = searchQuery
    ? chatHistory.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatHistory;

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator onCancel={onCancel} />;
    }
    if (error) {
      return (
        <div className="p-6 text-center">
          <h3 className="text-xl text-red-500 font-semibold">An Error Occurred</h3>
          <p className="mt-2 text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>
        </div>
      );
    }
    if (searchQuery && filteredHistory.length === 0 && chatHistory.length > 0) {
        return (
            <div className="p-6 text-center text-gray-400">
                <h3 className="text-lg font-semibold">No results found</h3>
                <p>Your search for "<span className="font-bold text-white">{searchQuery}</span>" did not match any messages.</p>
            </div>
        );
    }
    if (filteredHistory.length > 0) {
      return (
        <div className="space-y-6">
            {filteredHistory.map((msg, index) => (
                <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'model' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <GeminiIcon className="w-5 h-5 text-blue-400"/>
                        </div>
                    )}
                    <div className={`max-w-4xl w-auto p-4 rounded-xl ${
                        msg.role === 'model'
                        ? 'bg-gray-900/50 text-gray-300'
                        : 'bg-blue-600 text-white'
                    }`}>
                        {msg.role === 'model' ? <FormattedReview text={msg.content} searchQuery={searchQuery} /> : <p><Highlight text={msg.content} highlight={searchQuery} /></p>}
                    </div>
                </div>
            ))}
        </div>
      );
    }
    if (hasFiles) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AnalysisIcon className="w-16 h-16 text-gray-500 mb-4"/>
              <h3 className="text-xl font-semibold">Ready for Analysis</h3>
              <p className="mt-2 text-gray-400 max-w-sm">
                Click the "Analyze & Synthesize" button to start the process.
              </p>
            </div>
          );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AnalysisIcon className="w-16 h-16 text-gray-500 mb-4"/>
        <h3 className="text-xl font-semibold">Awaiting Files</h3>
        <p className="mt-2 text-gray-400 max-w-sm">
          Upload your Python files, and the analysis and synthesized script will appear here.
        </p>
      </div>
    );
  };

  return (
    <aside className="w-3/5 bg-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white whitespace-nowrap">Analysis & Script</h2>
         <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
                <SearchIcon className="w-5 h-5 text-gray-400" />
            </span>
            <input
                type="search"
                placeholder="Search history..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search chat history"
            />
        </div>
      </div>
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6">
        {renderContent()}
      </div>
      {chatHistory.length > 0 && !isLoading && <ChatInput onSendMessage={onSendMessage} isReplying={isReplying} />}
    </aside>
  );
};

export default ReviewPanel;
