
import { UploadedFile, QuestionnaireAnswers } from '../types';

export const getAnalysisPrompt = (files: UploadedFile[], answers: QuestionnaireAnswers): string => {
  const combinedCode = files.map(file => 
    `--- FILE: ${file.name} ---\n\n${file.content}`
  ).join('\n\n');
  
  const userPreferences = `
    **User Preferences for Synthesis**
    *   **Primary Objective**: ${answers.objective}
    *   **Essential Libraries**: ${answers.libraries || 'User did not specify any.'}
    *   **Documentation Level**: ${answers.documentation}
    *   **Architectural Style**: ${answers.architecture === 'auto' ? 'Determine the best style based on the code' : answers.architecture}
  `;

  const prompt = `
    As an expert Python developer and senior code architect, your task is to perform an in-depth analysis of the following Python files, taking into account the user's specific preferences for the final synthesized script. Your goal is to synthesize them into a single, cohesive, and advanced "super script" that represents the most robust and production-ready version possible.

    ${userPreferences}

    Your response must be in two parts, clearly separated with Markdown.

    **Part 1: Best Practices & Novelty Analysis**

    Review all the provided code and identify:
    *   **Strengths**: Point out 2-3 examples of excellent coding practices (e.g., clean architecture, efficient algorithms, good documentation).
    *   **Areas for Improvement**: Identify weaknesses such as non-compliance with PEP 8, potential bugs, security vulnerabilities, or inefficient code. Provide specific examples and suggest how to fix them.
    *   **Novel & Useful Portions**: Explicitly identify any unique, clever, or particularly advanced algorithms, data structures, or techniques present in the code that should be preserved or enhanced in the final script.

    **Part 2: The Advanced Super Script**

    Combine the functionalities from all provided files into a single, well-structured, production-grade Python script. This script must:
    *   Be cohesive and logically organized, potentially using classes or a more advanced structure than the originals, guided by the user's preferred **Architectural Style**.
    *   Incorporate the user's specified **Essential Libraries** and meet their **Primary Objective**.
    *   Be DRY (Don't Repeat Yourself) by eliminating redundant code.
    *   Incorporate and potentially enhance the **novel and useful portions** identified in Part 1.
    *   Consolidate all necessary imports at the top, adding type hinting for clarity and robustness.
    *   Include a clear \`if __name__ == "__main__":\` entry point. If multiple execution paths exist, create a robust command-line interface (using \`argparse\`) to handle different modes of operation, especially if the objective is a command-line tool.
    *   Be exceptionally well-documented according to the user's specified **Documentation Level**, with professional docstrings (e.g., Google or reST style) and insightful comments.
    *   **CRITICAL REQUIREMENT**: The entire synthesized script must be presented within a single, runnable Python code block. Do not split the script into multiple files or multiple code blocks.

    Here is the code to analyze:
    ${combinedCode}
  `;
  
  return prompt;
};
