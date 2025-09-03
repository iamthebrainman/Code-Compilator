
import React from 'react';
import { UploadedFile } from '../types';

interface CodeViewerProps {
  file: UploadedFile | null;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ file }) => {
  return (
    <div className="flex-grow bg-gray-900 overflow-auto">
      <div className="sticky top-0 bg-gray-800 p-3 border-b border-gray-700">
        <h3 className="font-mono text-lg text-white">{file ? file.name : 'No file selected'}</h3>
      </div>
      {file ? (
        <pre className="p-4 text-sm">
          <code className="language-python">{file.content}</code>
        </pre>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Select a file from the left panel to view its content.</p>
        </div>
      )}
    </div>
  );
};

export default CodeViewer;
