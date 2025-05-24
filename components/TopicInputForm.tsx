
import React, { useState, useRef } from 'react';
import { SparklesIcon, LightBulbIcon, XMarkIcon } from './icons';
import { UploadedFile } from '../types';

interface TopicInputFormProps {
  onSubmit: (topics: string, file?: UploadedFile) => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const TopicInputForm: React.FC<TopicInputFormProps> = ({ onSubmit, isLoading }) => {
  const [topics, setTopics] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`File is too large. Max size: ${MAX_FILE_SIZE_MB}MB.`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the input
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileError(`Invalid file type. Allowed: PDF, TXT, DOC, DOCX.`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the input
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Resets the file input
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopics = topics.trim();
    
    if (!trimmedTopics && !selectedFile) {
      // Optionally, show an error or simply don't submit if both are empty
      return;
    }

    let uploadedFileData: UploadedFile | undefined = undefined;

    if (selectedFile) {
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]); // Get base64 part
          reader.onerror = error => reject(error);
          reader.readAsDataURL(selectedFile);
        });
        uploadedFileData = {
          name: selectedFile.name,
          mimeType: selectedFile.type,
          base64Data: base64Data,
        };
      } catch (error) {
        console.error("Error reading file:", error);
        setFileError("Could not read the file. Please try again.");
        return;
      }
    }
    onSubmit(trimmedTopics, uploadedFileData);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 md:p-8 bg-white shadow-2xl rounded-xl transform transition-all duration-300 hover:shadow-primary/20">
      <div className="flex flex-col items-center justify-center mb-6 text-center">
        <LightBulbIcon className="w-16 h-16 text-secondary mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Focus Your Arabic Lesson
        </h1>
      </div>
      <p className="text-gray-600 mb-8 text-center text-md md:text-lg px-2">
        What topics should this Arabic lesson cover? Type them below, or upload a file (e.g., PDF, DOCX, TXT) with sample material.
        <br />
        Example topics: "Greetings, family, numbers 1-20, classroom objects."
      </p>
      <form onSubmit={handleSubmit} aria-labelledby="form-title">
        <div className="mb-6">
          <label htmlFor="topic-textarea" className="block text-lg font-medium text-gray-700 mb-1">Lesson Topics (Optional)</label>
          <textarea
            id="topic-textarea"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="e.g., colors, animals, food items..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow shadow-sm text-lg h-28 resize-y"
            disabled={isLoading}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="file-upload" className="block text-lg font-medium text-gray-700 mb-1">Upload Material (Optional)</label>
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary/10 file:text-primary
              hover:file:bg-primary/20
              disabled:opacity-60 disabled:cursor-not-allowed"
            accept=".pdf,.txt,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/pdf"
            disabled={isLoading}
            aria-describedby="file-constraints"
          />
          <p id="file-constraints" className="mt-1 text-xs text-gray-500">
            PDF, TXT, DOC, DOCX. Max {MAX_FILE_SIZE_MB}MB.
          </p>
          {fileError && <p className="mt-1 text-sm text-danger" role="alert">{fileError}</p>}
        </div>

        {selectedFile && !fileError && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg flex justify-between items-center text-sm">
            <span className="text-blue-700 truncate" title={selectedFile.name}>File: {selectedFile.name}</span>
            <button
              type="button"
              onClick={clearFile}
              className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 disabled:opacity-50"
              aria-label="Clear selected file"
              disabled={isLoading}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (!topics.trim() && !selectedFile) || !!fileError}
          className="w-full flex items-center justify-center bg-primary hover:bg-primary-darker text-white font-bold py-3.5 px-6 rounded-lg text-xl transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-70 active:transform active:scale-95"
        >
          {isLoading ? (
            <>
              <div role="status" className="flex items-center">
                <svg aria-hidden="true" className="w-5 h-5 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="ml-2">Generating Your Lesson...</span>
              </div>
            </>
          ) : (
            <>
              <SparklesIcon className="w-6 h-6 mr-2" />
              Create My Lesson!
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TopicInputForm;
