
export interface UploadedFile {
  name: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface QuestionnaireAnswers {
  objective: string;
  libraries: string;
  documentation: 'minimal' | 'standard' | 'extensive';
  architecture: 'oop' | 'functional' | 'procedural' | 'auto';
}
