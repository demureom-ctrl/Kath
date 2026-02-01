// ==========================================
// Login Page - User Authentication
// ==========================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (!result.success) {
            setError(result.error || 'حدث خطأ في تسجيل الدخول');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#556c33] to-[#3e4f24] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-4xl">☕</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Coffee POS</h1>
                    <p className="text-gray-500 text-sm mt-1">نظام نقاط البيع</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">تسجيل الدخول</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">اسم المستخدم</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                placeholder="admin أو staff"
                                required
                                autoComplete="username"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">كلمة المرور</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556c33]"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-[#556c33] to-[#3e4f24] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    جاري الدخول...
                                </>
                            ) : (
                                'دخول'
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 text-center mb-2">بيانات الدخول للتجربة:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-gray-200">
                                <p className="font-semibold text-gray-700">المدير (كل الصفحات)</p>
                                <p className="text-gray-500">admin / admin123</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-gray-200">
                                <p className="font-semibold text-gray-700">الموظف (البيع فقط)</p>
                                <p className="text-gray-500">staff / staff123</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
