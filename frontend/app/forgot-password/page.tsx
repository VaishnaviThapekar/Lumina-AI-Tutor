'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/forgot-password`, { email });
            setSubmitted(true);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <BookOpen className="w-12 h-12 text-primary-600" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                            Lumina AI Tutor
                        </h1>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {submitted ? (
                        <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Check your email</h2>
                            <p className="text-gray-600 text-sm mb-6">
                                If an account exists for <strong>{email}</strong>, we've sent a password
                                reset link. It expires in 1 hour.
                            </p>
                            <p className="text-xs text-gray-400 mb-4">
                                (Local dev note: since this project doesn't have real email sending wired
                                up yet, the reset link is printed to your backend terminal instead of
                                actually emailed.)
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                                Back to login
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot password?</h2>
                            <p className="text-gray-600 text-sm mb-6">
                                Enter your email and we'll send you a link to reset it.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send reset link'}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-gray-600">
                                <button
                                    onClick={() => router.push('/login')}
                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Back to login
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
