'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import { Send, Upload, FileText, Trash2, BookOpen, Sparkles, Menu, X } from 'lucide-react';
import type { Message, Document, ChatResponse, UploadResponse, DocumentsResponse } from './types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data: DocumentsResponse = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to get response');
      }

      const data: ChatResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (const file of acceptedFiles) {
      try {
        setUploadStatus(`Uploading ${file.name}...`);

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Upload failed');
        }

        const data: UploadResponse = await res.json();
        setUploadStatus(`✓ ${file.name} - ${data.chunks} chunks indexed`);
        await fetchDocuments();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setUploadStatus(`✗ Failed: ${errorMessage}`);
        setError(errorMessage);
      }
    }

    setIsUploading(false);
    setTimeout(() => setUploadStatus(null), 3000);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
    },
    disabled: isUploading,
  });

  const deleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDocuments();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const suggestedQuestions = [
    'What are the key concepts in my uploaded materials?',
    'Summarize the main points from my documents',
    'Help me understand the frameworks discussed',
    'What are the practical applications mentioned?',
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Error Banner */}
      {error && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 text-center text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0`}
      >
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-columbia-600" />
              <h2 className="font-semibold text-slate-800">Your Documents</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-slate-100 rounded lg:hidden"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-columbia-500 bg-columbia-50' : 'border-slate-300 hover:border-columbia-400 hover:bg-slate-50'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-600">
              {isDragActive ? 'Drop files here' : 'Drag & drop or click'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT, MD, CSV</p>
          </div>

          {uploadStatus && (
            <p
              className={`mt-2 text-sm ${
                uploadStatus.startsWith('✓')
                  ? 'text-green-600'
                  : uploadStatus.startsWith('✗')
                  ? 'text-red-600'
                  : 'text-slate-600'
              }`}
            >
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No documents yet. Upload some to get started!
            </p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 group"
                >
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate" title={doc.filename}>
                      {doc.filename}
                    </p>
                    <p className="text-xs text-slate-400">{doc.chunks} chunks</p>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">MBA Copilot</h1>
            <p className="text-sm text-slate-500 hidden sm:block">
              Your personal AI assistant for coursework
            </p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-8 sm:py-12">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-columbia-500" />
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                Welcome to MBA Copilot
              </h2>
              <p className="text-slate-600 mb-8">
                Upload your course materials and ask questions. I&apos;ll help you understand
                concepts, summarize readings, and prepare for discussions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="p-3 text-left text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-columbia-400 hover:bg-columbia-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-columbia-600 text-white'
                        : 'bg-white border border-slate-200'
                    } rounded-2xl px-4 py-3 shadow-sm`}
                  >
                    <div
                      className={`markdown-content ${
                        msg.role === 'user' ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2 font-medium">Sources:</p>
                        <div className="space-y-1">
                          {msg.sources.map((source, j) => (
                            <div
                              key={j}
                              className="text-xs bg-slate-50 rounded px-2 py-1.5 flex items-center justify-between"
                            >
                              <span className="font-medium text-slate-600 truncate">
                                {source.filename}
                              </span>
                              <span className="text-slate-400 ml-2 flex-shrink-0">
                                {Math.round(source.score * 100)}% match
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-slate-400 rounded-full loading-dot" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full loading-dot" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full loading-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your documents..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-columbia-500 focus:border-transparent transition-shadow"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-columbia-600 text-white rounded-xl hover:bg-columbia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
