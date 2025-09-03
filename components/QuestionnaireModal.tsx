
import React, { useState, useEffect } from 'react';
import { QuestionnaireAnswers } from '../types';

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: QuestionnaireAnswers) => void;
}

const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    objective: '',
    libraries: '',
    documentation: 'standard',
    architecture: 'auto',
  });

  useEffect(() => {
    // Reset form when modal is opened
    if (isOpen) {
      setAnswers({
        objective: '',
        libraries: '',
        documentation: 'standard',
        architecture: 'auto',
      });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answers.objective.trim()) {
      onSubmit(answers);
    }
  };

  const RadioGroup = ({ name, options, selected, onChange }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(name, option.value)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            selected === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="questionnaire-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="questionnaire-title" className="text-2xl font-bold text-white mb-6">Synthesis Preferences</h2>
        <p className="text-gray-400 mb-6">
          Help Gemini tailor the output by providing some context about your goals.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="objective" className="block text-sm font-medium text-gray-300 mb-2">
              Primary Objective <span className="text-red-500">*</span>
            </label>
            <input
              id="objective"
              type="text"
              value={answers.objective}
              onChange={e => setAnswers({ ...answers, objective: e.target.value })}
              placeholder="e.g., A command-line tool to process CSV files"
              className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
             <p className="text-xs text-gray-500 mt-1">What should the final script do?</p>
          </div>

          <div>
            <label htmlFor="libraries" className="block text-sm font-medium text-gray-300 mb-2">
              Essential Libraries
            </label>
            <input
              id="libraries"
              type="text"
              value={answers.libraries}
              onChange={e => setAnswers({ ...answers, libraries: e.target.value })}
              placeholder="e.g., pandas, requests, FastAPI"
              className="w-full bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
             <p className="text-xs text-gray-500 mt-1">Any specific libraries that must be used?</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Documentation Level</label>
            <RadioGroup
                name="documentation"
                selected={answers.documentation}
                onChange={(name, value) => setAnswers(prev => ({ ...prev, [name]: value }))}
                options={[
                    { value: 'minimal', label: 'Minimal' },
                    { value: 'standard', label: 'Standard Docstrings' },
                    { value: 'extensive', label: 'Extensive Explanations' },
                ]}
            />
          </div>

           <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Architectural Style</label>
             <RadioGroup
                name="architecture"
                selected={answers.architecture}
                onChange={(name, value) => setAnswers(prev => ({ ...prev, [name]: value }))}
                options={[
                    { value: 'auto', label: 'Automatic' },
                    { value: 'oop', label: 'Object-Oriented' },
                    { value: 'functional', label: 'Functional' },
                    { value: 'procedural', label: 'Procedural' },
                ]}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!answers.objective.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition duration-200"
            >
              Start Analysis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionnaireModal;
