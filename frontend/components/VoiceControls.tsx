// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw, Settings } from 'lucide-react';

// interface VoiceControlsProps {
//     onSpeechResult?: (text: string) => void;
//     textToRead?: string;
//     className?: string;
// }

// export default function VoiceControls({ onSpeechResult, textToRead, className = '' }: VoiceControlsProps) {
//     // Speech Recognition (Voice Input)
//     const [isListening, setIsListening] = useState(false);
//     const [transcript, setTranscript] = useState('');
//     const [recognition, setRecognition] = useState<any>(null);

//     // Text-to-Speech
//     const [isSpeaking, setIsSpeaking] = useState(false);
//     const [isPaused, setIsPaused] = useState(false);
//     const [speechRate, setSpeechRate] = useState(1.0);
//     const [showSettings, setShowSettings] = useState(false);
//     const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

//     // Initialize Speech Recognition
//     useEffect(() => {
//         if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
//             const SpeechRecognition = (window as any).webkitSpeechRecognition;
//             const recognitionInstance = new SpeechRecognition();

//             recognitionInstance.continuous = true;
//             recognitionInstance.interimResults = true;
//             recognitionInstance.lang = 'en-US';

//             recognitionInstance.onresult = (event: any) => {
//                 let finalTranscript = '';
//                 let interimTranscript = '';

//                 for (let i = event.resultIndex; i < event.results.length; i++) {
//                     const transcript = event.results[i][0].transcript;
//                     if (event.results[i].isFinal) {
//                         finalTranscript += transcript + ' ';
//                     } else {
//                         interimTranscript += transcript;
//                     }
//                 }

//                 const fullTranscript = finalTranscript || interimTranscript;
//                 setTranscript(fullTranscript);

//                 if (finalTranscript && onSpeechResult) {
//                     onSpeechResult(finalTranscript.trim());
//                 }
//             };

//             recognitionInstance.onerror = (event: any) => {
//                 console.error('Speech recognition error:', event.error);
//                 setIsListening(false);
//             };

//             recognitionInstance.onend = () => {
//                 setIsListening(false);
//             };

//             setRecognition(recognitionInstance);
//         }
//     }, [onSpeechResult]);

//     const toggleListening = () => {
//         if (!recognition) {
//             alert('Speech recognition not supported in this browser. Please use Chrome.');
//             return;
//         }

//         if (isListening) {
//             recognition.stop();
//             setIsListening(false);
//         } else {
//             recognition.start();
//             setIsListening(true);
//             setTranscript('');
//         }
//     };

//     const speakText = (text?: string) => {
//         if (!text && !textToRead) return;

//         const textToSpeak = text || textToRead || '';

//         // Cancel any ongoing speech
//         window.speechSynthesis.cancel();

//         const utterance = new SpeechSynthesisUtterance(textToSpeak);
//         utterance.rate = speechRate;
//         utterance.pitch = 1;
//         utterance.volume = 1;

//         utterance.onstart = () => {
//             setIsSpeaking(true);
//             setIsPaused(false);
//         };

//         utterance.onend = () => {
//             setIsSpeaking(false);
//             setIsPaused(false);
//             utteranceRef.current = null;
//         };

//         utterance.onerror = () => {
//             setIsSpeaking(false);
//             setIsPaused(false);
//         };

//         utteranceRef.current = utterance;
//         window.speechSynthesis.speak(utterance);
//     };

//     const toggleSpeech = () => {
//         if (isSpeaking) {
//             if (isPaused) {
//                 window.speechSynthesis.resume();
//                 setIsPaused(false);
//             } else {
//                 window.speechSynthesis.pause();
//                 setIsPaused(true);
//             }
//         } else {
//             speakText();
//         }
//     };

//     const stopSpeech = () => {
//         window.speechSynthesis.cancel();
//         setIsSpeaking(false);
//         setIsPaused(false);
//         utteranceRef.current = null;
//     };

//     return (
//         <div className={`flex items-center gap-2 ${className}`}>
//             {/* Voice Input Button */}
//             <div className="relative group">
//                 <button
//                     onClick={toggleListening}
//                     className={`p-3 rounded-xl transition-all ${isListening
//                         ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
//                         : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
//                         } shadow-lg`}
//                     title={isListening ? 'Stop listening' : 'Start voice input'}
//                 >
//                     {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
//                 </button>

//                 {/* Listening Indicator */}
//                 {isListening && (
//                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
//                 )}

//                 {/* Tooltip */}
//                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
//                     {isListening ? 'Stop (listening...)' : 'Voice Input'}
//                 </div>
//             </div>

//             {/* Transcript Display */}
//             {transcript && isListening && (
//                 <div className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
//                     <p className="text-sm text-blue-900 dark:text-blue-300 italic">{transcript}</p>
//                 </div>
//             )}

//             {/* Divider */}
//             {textToRead && <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />}

//             {/* Text-to-Speech Controls */}
//             {textToRead && (
//                 <>
//                     <div className="relative group">
//                         <button
//                             onClick={toggleSpeech}
//                             className={`p-3 rounded-xl transition-all ${isSpeaking
//                                 ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
//                                 : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
//                                 } shadow-lg`}
//                             title={isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Read aloud'}
//                         >
//                             {isSpeaking ? (
//                                 isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />
//                             ) : (
//                                 <Volume2 className="w-5 h-5" />
//                             )}
//                         </button>

//                         {/* Speaking Indicator */}
//                         {isSpeaking && !isPaused && (
//                             <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
//                         )}

//                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
//                             {isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Read Aloud'}
//                         </div>
//                     </div>

//                     {isSpeaking && (
//                         <>
//                             <button
//                                 onClick={stopSpeech}
//                                 className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg"
//                                 title="Stop reading"
//                             >
//                                 <VolumeX className="w-5 h-5" />
//                             </button>

//                             <div className="relative">
//                                 <button
//                                     onClick={() => setShowSettings(!showSettings)}
//                                     className="p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all shadow-lg"
//                                     title="Speech settings"
//                                 >
//                                     <Settings className="w-5 h-5" />
//                                 </button>

//                                 {/* Speed Control Dropdown */}
//                                 {showSettings && (
//                                     <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[200px] z-10">
//                                         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
//                                             Speed: {speechRate}x
//                                         </label>
//                                         <input
//                                             type="range"
//                                             min="0.5"
//                                             max="2"
//                                             step="0.1"
//                                             value={speechRate}
//                                             onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
//                                             className="w-full"
//                                         />
//                                         <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
//                                             <span>0.5x</span>
//                                             <span>2x</span>
//                                         </div>
//                                         <button
//                                             onClick={() => {
//                                                 stopSpeech();
//                                                 speakText();
//                                             }}
//                                             className="w-full mt-3 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-all"
//                                         >
//                                             Apply & Restart
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         </>
//                     )}
//                 </>
//             )}
//         </div>
//     );
// }













'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send } from 'lucide-react';

interface VoiceControlsProps {
    onTranscript?: (text: string) => void;
    autoSend?: boolean;
}

export default function VoiceControls({ onTranscript, autoSend = false }: VoiceControlsProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState('');
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<any>(null);
    const finalTranscriptRef = useRef('');

    useEffect(() => {
        // Check if browser supports speech recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const SpeechSynthesis = window.speechSynthesis;

            if (SpeechRecognition && SpeechSynthesis) {
                setIsSupported(true);

                // Initialize speech recognition
                const recognition = new SpeechRecognition();
                recognition.continuous = true;  // Keep listening
                recognition.interimResults = true; // Show interim results
                recognition.lang = 'en-US';
                recognition.maxAlternatives = 1;

                recognition.onstart = () => {
                    console.log('Speech recognition started');
                    setError('');
                    setIsListening(true);
                };

                recognition.onresult = (event: any) => {
                    let interim = '';
                    let final = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;

                        if (event.results[i].isFinal) {
                            final += transcript + ' ';
                        } else {
                            interim += transcript;
                        }
                    }

                    if (final) {
                        finalTranscriptRef.current += final;
                        setTranscript(finalTranscriptRef.current);
                        setInterimTranscript('');

                        // Send to parent component
                        if (onTranscript) {
                            onTranscript(finalTranscriptRef.current.trim());
                        }
                    } else {
                        setInterimTranscript(interim);
                    }
                };

                recognition.onend = () => {
                    console.log('Speech recognition ended');
                    setIsListening(false);
                    setInterimTranscript('');
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);

                    let errorMessage = '';
                    switch (event.error) {
                        case 'no-speech':
                            errorMessage = 'No speech detected. Please try again.';
                            break;
                        case 'audio-capture':
                            errorMessage = 'No microphone found. Please check your microphone.';
                            break;
                        case 'not-allowed':
                            errorMessage = 'Microphone permission denied. Please allow microphone access.';
                            break;
                        case 'network':
                            errorMessage = 'Network error occurred.';
                            break;
                        default:
                            errorMessage = `Error: ${event.error}`;
                    }

                    setError(errorMessage);
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
                synthRef.current = SpeechSynthesis;
            }
        }

        // Cleanup
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // Ignore
                }
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [onTranscript]);

    const startListening = async () => {
        if (!recognitionRef.current) return;

        // If already listening, don't start again
        if (isListening) {
            console.log('Already listening, skipping start');
            return;
        }

        try {
            // Request microphone permission first
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Reset transcript
            finalTranscriptRef.current = '';
            setTranscript('');
            setInterimTranscript('');
            setError('');

            // Double check not already started
            try {
                recognitionRef.current.abort();
            } catch (e) {
                // Ignore - wasn't running
            }

            // Small delay to ensure clean state
            setTimeout(() => {
                try {
                    recognitionRef.current.start();
                } catch (err: any) {
                    if (err.message.includes('already started')) {
                        console.log('Recognition already started, stopping first...');
                        recognitionRef.current.stop();
                        setTimeout(() => {
                            recognitionRef.current.start();
                        }, 100);
                    }
                }
            }, 100);

        } catch (error: any) {
            console.error('Error accessing microphone:', error);
            if (error.name === 'NotAllowedError') {
                setError('Microphone permission denied. Please allow microphone access in your browser settings.');
            } else if (error.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone.');
            } else {
                setError('Failed to access microphone. Please check your settings.');
            }
        }
    };

    const stopListening = () => {
        if (!recognitionRef.current) return;

        try {
            recognitionRef.current.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
        setIsListening(false);
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const sendTranscript = () => {
        if (transcript.trim() && onTranscript) {
            onTranscript(transcript.trim());
            // Clear after sending
            finalTranscriptRef.current = '';
            setTranscript('');
        }
    };

    const clearTranscript = () => {
        finalTranscriptRef.current = '';
        setTranscript('');
        setInterimTranscript('');
    };

    const speak = (text: string) => {
        if (!synthRef.current || !text) return;

        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    if (!isSupported) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Voice controls not supported. Use Chrome, Edge, or Safari.
                </p>
            </div>
        );
    }

    const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-800 shadow-lg">
            {/* Error Message */}
            {error && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleListening}
                    disabled={isSpeaking}
                    className={`p-4 rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isListening
                        ? 'bg-red-500 hover:bg-red-600 scale-110'
                        : 'bg-purple-500 hover:bg-purple-600 hover:scale-105'
                        } text-white`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    {isListening ? (
                        <MicOff className="w-6 h-6" />
                    ) : (
                        <Mic className="w-6 h-6" />
                    )}
                </button>

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {isListening ? '🎤 Listening...' : '🎤 Voice Input'}
                        </p>
                        {transcript && (
                            <button
                                onClick={clearTranscript}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {displayText ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200">
                            <p className="break-words">
                                {transcript}
                                {interimTranscript && (
                                    <span className="text-gray-400 dark:text-gray-500 italic">
                                        {interimTranscript}
                                    </span>
                                )}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isListening ? 'Speak now... I\'m listening!' : 'Click the microphone to start speaking'}
                        </p>
                    )}
                </div>

                {/* Send Button */}
                {transcript && !autoSend && onTranscript && (
                    <button
                        onClick={sendTranscript}
                        className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:scale-105 transition-all"
                        title="Send transcript"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Visual Waveform Feedback */}
            {isListening && (
                <div className="mt-4 flex flex-col items-center justify-center p-3 bg-purple-500/10 dark:bg-purple-900/20 rounded-xl border border-purple-300/30">
                    <div className="flex items-center gap-1.5 h-10">
                        <div className="w-1.5 h-4 bg-purple-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.0s' }}></div>
                        <div className="w-1.5 h-8 bg-purple-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-1.5 h-10 bg-pink-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.3s' }}></div>
                        <div className="w-1.5 h-6 bg-purple-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-9 bg-indigo-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.25s' }}></div>
                        <div className="w-1.5 h-5 bg-purple-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.4s' }}></div>
                        <div className="w-1.5 h-8 bg-pink-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.05s' }}></div>
                        <div className="w-1.5 h-4 bg-purple-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">
                        Active Listening • Speak clearly into your mic
                    </span>
                </div>
            )}

            <style jsx>{`
        @keyframes sound-wave {
          0%, 100% {
            transform: scaleY(0.4);
            opacity: 0.4;
          }
          50% {
            transform: scaleY(1.2);
            opacity: 1;
          }
        }
        .animate-sound-wave {
          animation: sound-wave 0.7s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}