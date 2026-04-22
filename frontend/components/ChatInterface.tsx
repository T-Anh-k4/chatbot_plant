'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, ImagePlus, X, Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import { chatService, ChatMessage, PredictResponse } from '@/lib/api';

interface ExtendedMessage extends ChatMessage {
  imageUrl?: string;
  prediction?: PredictResponse;
  isImageQuery?: boolean;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    e.target.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelect(file);
  }, []);

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    // --- Case 1: Image uploaded → predict disease ---
    if (selectedImage) {
      const imgUrl = imagePreview!;
      const file = selectedImage;
      clearImage();

      const userMsg: ExtendedMessage = {
        role: 'user',
        content: input.trim() || '🌿 Hãy chẩn đoán bệnh cây trong ảnh này.',
        imageUrl: imgUrl,
        isImageQuery: true,
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const result = await chatService.predictDisease(file);
        const confidence = Math.round(result.confidence * 100);
        const isHealthy = result.disease.toLowerCase().includes('healthy');

        const botMsg: ExtendedMessage = {
          role: 'assistant',
          content: isHealthy
            ? `✅ Cây của bạn trông **khỏe mạnh**! Không phát hiện dấu hiệu bệnh.`
            : `🔍 Đã phát hiện bệnh trên cây. Xem chi tiết bên dưới.`,
          prediction: result,
          isImageQuery: true,
        };
        setMessages(prev => [...prev, botMsg]);
      } catch {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '❌ Không thể phân tích ảnh. Vui lòng thử lại với ảnh khác.',
        }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // --- Case 2: Text question → RAG chat ---
    const userMsg: ExtendedMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({ query: input, session_id: sessionId || undefined });
      if (response.session_id) setSessionId(response.session_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return '#22c55e';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-200 ${isDragging ? 'bg-green-50' : 'bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 60%, #16a34a 100%)' }} className="shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Plant Doctor AI</h1>
            <p className="text-green-200 text-xs">Hỏi đáp nông nghiệp · Nhận diện bệnh cây</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
            <span className="text-green-200 text-xs">Online</span>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-500/20 border-4 border-dashed border-green-500 m-4 rounded-2xl pointer-events-none">
          <div className="text-center">
            <ImagePlus className="w-16 h-16 text-green-600 mx-auto mb-3" />
            <p className="text-green-700 font-bold text-xl">Thả ảnh vào đây</p>
            <p className="text-green-600 text-sm">để nhận diện bệnh cây</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Xin chào! Tôi là Plant Doctor 🌿</h2>
              <p className="text-gray-500 text-sm mb-6">Hỏi tôi về nông nghiệp hoặc gửi ảnh lá cây để chẩn đoán bệnh</p>
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                {['Bệnh đốm lá là gì?', 'Cách phòng trừ rệp sáp?'].map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-sm px-3 py-2 rounded-xl bg-white border border-green-200 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all text-left shadow-sm">
                    {q}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <ImagePlus className="w-4 h-4" />
                <span>Hoặc kéo thả ảnh vào đây để nhận diện bệnh cây</span>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* User image preview */}
                {msg.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border-2 border-green-200 shadow-md">
                    <img src={msg.imageUrl} alt="uploaded" className="max-w-xs max-h-56 object-cover" />
                  </div>
                )}

                {/* Bubble */}
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>

                {/* Disease prediction card */}
                {msg.prediction && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-4 w-full max-w-xs">
                    <div className="flex items-center gap-2 mb-3">
                      {msg.prediction.disease.toLowerCase().includes('healthy')
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <AlertCircle className="w-5 h-5 text-amber-500" />
                      }
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kết quả chẩn đoán</span>
                    </div>
                    <p className="font-bold text-gray-800 text-sm mb-3">{msg.prediction.disease}</p>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Độ tin cậy</span>
                        <span style={{ color: getConfidenceColor(msg.prediction.confidence) }} className="font-bold">
                          {Math.round(msg.prediction.confidence * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round(msg.prediction.confidence * 100)}%`,
                            backgroundColor: getConfidenceColor(msg.prediction.confidence),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* RAG sources images */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="space-y-1.5 w-full">
                    {msg.sources
                      .filter(s => {
                        const m = s.metadata || {};
                        return m.interior_style_image_url || m.project_image_url || m.news_image_url || m.slide_image_url;
                      })
                      .slice(0, 2)
                      .map((s, idx) => {
                        const m = s.metadata || {};
                        const imgUrl = m.interior_style_image_url || m.project_image_url || m.news_image_url || m.slide_image_url;
                        const title = m.interior_style_name || m.project_name || m.news_title || m.slide_title || 'Nguồn';
                        return (
                          <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                            <img src={imgUrl} alt={title} className="w-full h-36 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50">{title}</p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">

          {/* Image preview */}
          {imagePreview && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-green-50 rounded-xl border border-green-200">
              <img src={imagePreview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-green-300" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-700 truncate">{selectedImage?.name}</p>
                <p className="text-xs text-green-500">Nhấn Gửi để chẩn đoán bệnh</p>
              </div>
              <button onClick={clearImage} className="p-1 rounded-full hover:bg-green-200 transition-colors">
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
              title="Tải ảnh lên để chẩn đoán bệnh"
            >
              <ImagePlus className="w-5 h-5 text-green-600" />
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={selectedImage ? 'Thêm câu hỏi (tuỳ chọn)...' : 'Hỏi về nông nghiệp hoặc gửi ảnh để chẩn đoán...'}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800 text-sm bg-gray-50"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-md"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
