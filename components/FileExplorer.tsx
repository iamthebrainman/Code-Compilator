
import React from 'react';
import { UploadedFile } from '../types';
import { CodeIcon } from './icons/CodeIcon';

interface FileExplorerProps {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  onSelectFile: (file: UploadedFile) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onSelectFile }) => {
  return (
    <aside className="w-1/5 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Uploaded Files</h2>
        <p className="text-sm text-gray-400">{files.length} file(s)</p>
      </div>
      <div className="flex-grow overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <p>Upload or drop Python files here to begin analysis.</p>
          </div>
        ) : (
          <ul>
            {files.map((file) => (
              <li key={file.name}>
                <button
                  onClick={() => onSelectFile(file)}
                  className={`w-full text-left flex items-center p-3 text-sm transition duration-200 ${
                    selectedFile?.name === file.name
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <CodeIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default FileExplorer;
