// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { Send, Loader2 } from 'lucide-react';
// import VoiceControls from './VoiceControls';

// interface Message {
//     role: 'user' | 'assistant';
//     content: string;
//     timestamp: Date;
// }

// interface ChatInterfaceProps {
//     sessionId: number;
// }

// export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [input, setInput] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [speakResponses, setSpeakResponses] = useState(true);
//     const messagesEndRef = useRef<HTMLDivElement>(null);
//     const synthRef = useRef<SpeechSynthesis | null>(null);

//     useEffect(() => {
//         if (typeof window !== 'undefined') {
//             synthRef.current = window.speechSynthesis;
//         }
//     }, []);

//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };

//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]);

//     const speakText = (text: string) => {
//         if (!synthRef.current || !speakResponses) return;

//         // Cancel any ongoing speech
//         synthRef.current.cancel();

//         const utterance = new SpeechSynthesisUtterance(text);
//         utterance.rate = 1.0;
//         utterance.pitch = 1.0;
//         utterance.volume = 1.0;
//         utterance.lang = 'en-US';

//         synthRef.current.speak(utterance);
//     };

//     const sendMessage = async (messageText?: string) => {
//         const textToSend = messageText || input;
//         if (!textToSend.trim() || loading) return;

//         const userMessage: Message = {
//             role: 'user',
//             content: textToSend,
//             timestamp: new Date(),
//         };

//         setMessages(prev => [...prev, userMessage]);
//         setInput('');
//         setLoading(true);

//         try {
//             const response = await fetch('http://localhost:8000/api/chat/message', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 credentials: 'include',
//                 body: JSON.stringify({
//                     message: textToSend,
//                     session_id: sessionId,
//                 }),
//             });

//             if (response.ok) {
//                 const data = await response.json();
//                 const assistantMessage: Message = {
//                     role: 'assistant',
//                     content: data.response || 'I received your message.',
//                     timestamp: new Date(),
//                 };

//                 setMessages(prev => [...prev, assistantMessage]);

//                 // Speak the AI response
//                 if (speakResponses) {
//                     speakText(assistantMessage.content);
//                 }
//             } else {
//                 throw new Error('Failed to send message');
//             }
//         } catch (error) {
//             console.error('Error sending message:', error);
//             const errorMessage: Message = {
//                 role: 'assistant',
//                 content: 'Sorry, I encountered an error. Please try again.',
//                 timestamp: new Date(),
//             };
//             setMessages(prev => [...prev, errorMessage]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleVoiceTranscript = (transcript: string) => {
//         // When voice input is received, send it immediately
//         sendMessage(transcript);
//     };

//     const handleKeyPress = (e: React.KeyboardEvent) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             sendMessage();
//         }
//     };

//     return (
//         <div className="flex flex-col h-full max-h-[700px]">
//             {/* Voice Controls with AI Integration */}
//             <VoiceControls
//                 onTranscript={handleVoiceTranscript}
//                 autoSend={true}
//             />

//             {/* Voice Response Toggle */}
//             <div className="mb-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                     🔊 Speak AI Responses
//                 </span>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                     <input
//                         type="checkbox"
//                         checked={speakResponses}
//                         onChange={(e) => setSpeakResponses(e.target.checked)}
//                         className="sr-only peer"
//                     />
//                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
//                 </label>
//             </div>

//             {/* Messages Area */}
//             <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
//                 {messages.length === 0 ? (
//                     <div className="text-center py-12">
//                         <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                             <Send className="w-8 h-8 text-white" />
//                         </div>
//                         <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
//                             Start a conversation
//                         </p>
//                         <p className="text-gray-500 dark:text-gray-500 text-sm">
//                             Type a message or use voice input to begin learning
//                         </p>
//                     </div>
//                 ) : (
//                     messages.map((message, index) => (
//                         <div
//                             key={index}
//                             className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
//                         >
//                             <div
//                                 className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
//                                     ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
//                                     : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
//                                     }`}
//                             >
//                                 <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
//                                 <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-100' : 'text-gray-400'
//                                     }`}>
//                                     {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                 </p>
//                             </div>
//                         </div>
//                     ))
//                 )}
//                 {loading && (
//                     <div className="flex justify-start">
//                         <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700">
//                             <div className="flex items-center gap-2">
//                                 <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
//                                 <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//                 <div ref={messagesEndRef} />
//             </div>

//             {/* Input Area */}
//             <div className="flex gap-2">
//                 <input
//                     type="text"
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     placeholder="Type your message or use voice..."
//                     disabled={loading}
//                     className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
//                 />
//                 <button
//                     onClick={() => sendMessage()}
//                     disabled={!input.trim() || loading}
//                     className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center gap-2"
//                 >
//                     {loading ? (
//                         <Loader2 className="w-5 h-5 animate-spin" />
//                     ) : (
//                         <Send className="w-5 h-5" />
//                     )}
//                 </button>
//             </div>

//             {/* Instructions */}
//             <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//                 <p className="text-xs text-gray-600 dark:text-gray-400">
//                     💡 <strong>Tip:</strong> Click the microphone, speak your question, and the AI will respond both in text and voice!
//                 </p>
//             </div>
//         </div>
//     );
// }













'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import VoiceControls from './VoiceControls';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatInterfaceProps {
    sessionId: number;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [speakResponses, setSpeakResponses] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    // Load existing chat history whenever the session changes (e.g. when
    // switching back to the Chat tab, or opening a different document).
    // Without this, messages appeared to "vanish" on tab switch even
    // though they were safely saved in the database all along.
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const token = localStorage.getItem('lumina_token');
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!response.ok) return;
                const data = await response.json();
                const loaded: Message[] = (data.messages || []).map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.content,
                    timestamp: new Date(m.timestamp),
                }));
                setMessages(loaded);
            } catch (err) {
                console.error('Error loading chat history:', err);
            }
        };

        if (sessionId) {
            loadHistory();
        }
    }, [sessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const speakText = (text: string) => {
        if (!synthRef.current || !speakResponses) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        synthRef.current.speak(utterance);
    };

    const sendMessage = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: textToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('lumina_token');
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message: textToSend,
                    session_id: sessionId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.response || 'I received your message.',
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, assistantMessage]);

                // Speak the AI response
                if (speakResponses) {
                    speakText(assistantMessage.content);
                }
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceTranscript = (transcript: string) => {
        // When voice input is received, send it immediately
        sendMessage(transcript);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Top Header Banner matching ConceptMap */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-5 text-white shadow-xl flex-shrink-0">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-purple-200 text-xs font-medium mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            <span>Adaptive Socratic AI Tutor Active</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold">
                            Interactive Voice & Text Tutor
                        </h2>
                        <p className="text-purple-100/80 text-xs mt-0.5">
                            Ask questions, clarify concepts, or request step-by-step problem scaffolding.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20">
                        <span className="text-xs font-semibold text-purple-100">🔊 Voice AI Response</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={speakResponses}
                                onChange={(e) => setSpeakResponses(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-400"></div>
                        </label>
                    </div>
                </div>

                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Voice Controls with Equalizer */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm flex-shrink-0">
                <VoiceControls
                    onTranscript={handleVoiceTranscript}
                    autoSend={true}
                />
            </div>

            {/* Prompt Recommendation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0 scrollbar-none">
                {[
                    'Explain core concepts in ELI5 mode 💡',
                    'Give me a real-world example 🌐',
                    'Quiz me on key principles 🎯',
                    'Summarize main formula & definitions 📝'
                ].map((promptText, idx) => (
                    <button
                        key={idx}
                        onClick={() => sendMessage(promptText)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200/60 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold whitespace-nowrap transition-all hover:scale-105 shadow-sm"
                    >
                        {promptText}
                    </button>
                ))}
            </div>

            {/* Messages Area Container */}
            <div className="flex-1 overflow-y-auto space-y-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-inner min-h-[300px]">
                {messages.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white font-bold text-2xl">
                            💬
                        </div>
                        <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1">
                            How can I help you study today?
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs max-w-md mx-auto">
                            Ask anything about your document or click a quick prompt above to begin learning!
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                    message.role === 'user'
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 rounded-bl-none'
                                }`}
                            >
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                                <p
                                    className={`text-[10px] mt-1.5 text-right ${
                                        message.role === 'user' ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'
                                    }`}
                                >
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl px-4 py-3 border border-purple-200 dark:border-purple-900/50 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">Synthesizing Socratic response...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="flex gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your question..."
                    disabled={loading}
                    className="flex-1 px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm shadow-sm disabled:opacity-50"
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="px-6 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/25 transition-all disabled:cursor-not-allowed flex items-center gap-2 text-xs sm:text-sm"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            <span>Ask</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}