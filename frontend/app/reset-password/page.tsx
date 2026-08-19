// 'use client';

// import React, { useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { BookOpen, Lock, AlertCircle, CheckCircle } from 'lucide-react';
// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// export default function ResetPasswordPage() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const token = searchParams.get('token') || '';

//     const [newPassword, setNewPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState(false);
//     const [loading, setLoading] = useState(false);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');

//         if (!token) {
//             setError('Missing or invalid reset link. Please request a new one.');
//             return;
//         }
//         if (newPassword.length < 8) {
//             setError('Password must be at least 8 characters');
//             return;
//         }
//         if (newPassword !== confirmPassword) {
//             setError('Passwords do not match');
//             return;
//         }

//         setLoading(true);
//         try {
//             await axios.post(`${API_BASE_URL}/api/reset-password`, {
//                 token,
//                 new_password: newPassword,
//             });
//             setSuccess(true);
//         } catch (err: any) {
//             setError(err?.response?.data?.detail || 'Could not reset password. The link may have expired.');
//         }
//         setLoading(false);
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
//             <div className="max-w-md w-full">
//                 <div className="text-center mb-8">
//                     <div className="inline-flex items-center gap-3 mb-4">
//                         <BookOpen className="w-12 h-12 text-primary-600" />
//                         <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
//                             Lumina AI Tutor
//                         </h1>
//                     </div>
//                 </div>

//                 <div className="bg-white rounded-2xl shadow-xl p-8">
//                     {success ? (
//                         <div className="text-center">
//                             <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
//                             <h2 className="text-xl font-bold text-gray-800 mb-2">Password reset!</h2>
//                             <p className="text-gray-600 text-sm mb-6">
//                                 Your password has been updated. You can now sign in with your new password.
//                             </p>
//                             <button
//                                 onClick={() => router.push('/login')}
//                                 className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
//                             >
//                                 Go to login
//                             </button>
//                         </div>
//                     ) : (
//                         <>
//                             <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset your password</h2>

//                             {error && (
//                                 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
//                                     <AlertCircle className="w-4 h-4 flex-shrink-0" />
//                                     {error}
//                                 </div>
//                             )}

//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                                         New Password
//                                     </label>
//                                     <div className="relative">
//                                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                                         <input
//                                             type="password"
//                                             value={newPassword}
//                                             onChange={(e) => setNewPassword(e.target.value)}
//                                             placeholder="At least 8 characters"
//                                             className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                                         />
//                                     </div>
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                                         Confirm New Password
//                                     </label>
//                                     <div className="relative">
//                                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                                         <input
//                                             type="password"
//                                             value={confirmPassword}
//                                             onChange={(e) => setConfirmPassword(e.target.value)}
//                                             placeholder="Re-enter new password"
//                                             className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                                         />
//                                     </div>
//                                 </div>

//                                 <button
//                                     type="submit"
//                                     disabled={loading}
//                                     className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
//                                 >
//                                     {loading ? 'Resetting...' : 'Reset password'}
//                                 </button>
//                             </form>
//                         </>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }









'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordForm />
        </Suspense>
    );
}

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Missing or invalid reset link. Please request a new one.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/reset-password`, {
                token,
                new_password: newPassword,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Could not reset password. The link may have expired.');
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
                    {success ? (
                        <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Password reset!</h2>
                            <p className="text-gray-600 text-sm mb-6">
                                Your password has been updated. You can now sign in with your new password.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                            >
                                Go to login
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset your password</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 8 characters"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter new password"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Resetting...' : 'Reset password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}