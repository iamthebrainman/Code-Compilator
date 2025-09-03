
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { UploadedFile, ChatMessage, QuestionnaireAnswers } from './types';
import { getAnalysisPrompt } from './services/geminiService';
import FileExplorer from './components/FileExplorer';
import CodeViewer from './components/CodeViewer';
import ReviewPanel from './components/ReviewPanel';
import QuestionnaireModal from './components/QuestionnaireModal';
import { UploadIcon } from './components/icons/UploadIcon';

// This would be in a more secure place in a real app
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_code_synthesizer_files');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse files from localStorage", error);
      return [];
    }
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_code_synthesizer_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse chat history from localStorage", error);
      return [];
    }
  });

  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelAnalysisRef = useRef<boolean>(false);
  
  // --- State Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('gemini_code_synthesizer_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('gemini_code_synthesizer_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (selectedFile) {
      localStorage.setItem('gemini_code_synthesizer_selected_file_name', selectedFile.name);
    } else if (files.length === 0) {
      localStorage.removeItem('gemini_code_synthesizer_selected_file_name');
    }
  }, [selectedFile, files.length]);

  // --- Initial Selected File Effect ---
  useEffect(() => {
    // This effect runs only once on mount to set the initial selected file
    if (files.length > 0 && !selectedFile) {
      const savedSelectedFileName = localStorage.getItem('gemini_code_synthesizer_selected_file_name');
      const fileToSelect = savedSelectedFileName
        ? files.find(f => f.name === savedSelectedFileName)
        : undefined;

      setSelectedFile(fileToSelect || files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const processFiles = useCallback((fileList: FileList | null) => {
    const chosenFiles = Array.from(fileList || []);
    const newUploadedFiles: Promise<UploadedFile>[] = chosenFiles
      .filter(file => file.name.endsWith('.py'))
      .map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              content: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      });
      
    Promise.all(newUploadedFiles).then(uploaded => {
        setFiles(prev => {
            const existingFileNames = new Set(prev.map(f => f.name));
            const uniqueNewFiles = uploaded.filter(u => !existingFileNames.has(u.name));
            const allFiles = [...prev, ...uniqueNewFiles];
            if (allFiles.length > 0 && !selectedFile) {
                setSelectedFile(allFiles[0]);
            }
            return allFiles;
        });
    });
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    processFiles(event.dataTransfer.files);
  }, [processFiles]);
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleInitialAnalysis = useCallback(async (answers: QuestionnaireAnswers) => {
    if (files.length === 0) {
      setError('Please upload at least one Python file to review.');
      return;
    }
    setIsLoading(true);
    setError('');
    setChatHistory([]);
    cancelAnalysisRef.current = false;
    try {
      const chat = ai.chats.create({ model: 'gemini-2.5-flash' });
      setChatSession(chat);
      const prompt = getAnalysisPrompt(files, answers);
      const stream = await chat.sendMessageStream({ message: prompt });
      
      setIsLoading(false);
      setChatHistory([{ role: 'model', content: '' }]);

      let currentResponse = '';
      for await (const chunk of stream) {
        if (cancelAnalysisRef.current) {
          break;
        }
        currentResponse += chunk.text;
        setChatHistory([{ role: 'model', content: currentResponse }]);
      }
    } catch (e) {
      if (!cancelAnalysisRef.current) {
        setError(e instanceof Error ? `Error: ${e.message}` : 'An unknown error occurred.');
      }
      setIsLoading(false);
    }
  }, [files]);
  
  const handleStartAnalysisClick = () => {
    if (files.length > 0) {
      setIsQuestionnaireOpen(true);
    }
  };

  const handleQuestionnaireSubmit = (answers: QuestionnaireAnswers) => {
    setIsQuestionnaireOpen(false);
    handleInitialAnalysis(answers);
  };

  const handleCancelAnalysis = () => {
    cancelAnalysisRef.current = true;
    setIsLoading(false);
    setError('');
  };

  const handleSendMessage = useCallback(async (message: string) => {
    let session = chatSession;
    if (!session) {
      if (chatHistory.length > 0) {
        const history = chatHistory
          .filter(msg => msg.content) // Don't include empty placeholder messages from previous states
          .map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          }));
        
        session = ai.chats.create({
          model: 'gemini-2.5-flash',
          history: history
        });
        setChatSession(session);
      } else {
        console.error("Cannot send message: no chat history and no active session.");
        return;
      }
    }

    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage, { role: 'model', content: '' }]);
    setIsReplying(true);

    try {
        const stream = await session.sendMessageStream({ message });
        
        let currentResponse = '';
        for await (const chunk of stream) {
            currentResponse += chunk.text;
            setChatHistory(prev => [
                ...prev.slice(0, -1),
                { role: 'model', content: currentResponse }
            ]);
        }

    } catch (e) {
        const errorMessage = e instanceof Error ? `Error: ${e.message}` : 'An unknown error occurred.';
        setError(errorMessage);
        // On error, remove the user message and the placeholder
        setChatHistory(prev => prev.slice(0, -2));
    } finally {
        setIsReplying(false);
    }
  }, [chatSession, chatHistory]);
  
  const handleSelectFile = (file: UploadedFile) => {
    setSelectedFile(file);
  };
  
  const handleClearAll = () => {
    setFiles([]);
    setSelectedFile(null);
    setChatHistory([]);
    setChatSession(null);
    setError('');
    setIsLoading(false);
    setIsReplying(false);
    localStorage.removeItem('gemini_code_synthesizer_files');
    localStorage.removeItem('gemini_code_synthesizer_chat_history');
    localStorage.removeItem('gemini_code_synthesizer_selected_file_name');
  }

  return (
    <div 
      className="relative flex flex-col h-screen bg-gray-900 text-gray-300 font-sans"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 shadow-md flex-shrink-0 z-10">
        <h1 className="text-2xl font-bold text-white tracking-wider">Gemini Code Synthesizer</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleUploadClick}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <UploadIcon className="w-5 h-5 mr-2" />
            Upload Python Files
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".py"
            className="hidden"
          />
          {files.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
            >
              Clear All
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow flex overflow-hidden">
        <FileExplorer
          files={files}
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
        />
        <div className="flex flex-col w-2/5 border-r border-gray-700">
          <CodeViewer file={selectedFile} />
          <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
             <button
                onClick={handleStartAnalysisClick}
                disabled={isLoading || files.length === 0}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
                {isLoading ? 'Analyzing...' : `Analyze & Synthesize ${files.length} File(s)`}
            </button>
          </div>
        </div>
        <ReviewPanel 
          chatHistory={chatHistory} 
          isLoading={isLoading}
          isReplying={isReplying} 
          error={error} 
          hasFiles={files.length > 0}
          onSendMessage={handleSendMessage}
          onCancel={handleCancelAnalysis}
        />
      </main>

      <QuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        onSubmit={handleQuestionnaireSubmit}
      />

      {isDragging && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 pointer-events-none" aria-hidden="true">
          <div className="text-center p-10 border-4 border-dashed border-blue-500 rounded-lg">
            <UploadIcon className="w-16 h-16 mx-auto text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold text-white">Drop Python files here</h2>
            <p className="text-gray-400">to start the analysis</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
