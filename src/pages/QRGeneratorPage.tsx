// ==========================================
// QR Generator Page - Generate QR codes for customer ordering
// ==========================================

import { useState, useEffect } from 'react';
import { Header } from '../components/Layout';

// Session duration in milliseconds (5 minutes)
const SESSION_DURATION = 5 * 60 * 1000;

export function QRGeneratorPage() {
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [orderUrl, setOrderUrl] = useState<string>('');

    // Generate a new session token
    const generateSession = () => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const token = `${timestamp}-${randomId}`;

        setSessionToken(token);
        setExpiresAt(timestamp + SESSION_DURATION);

        // Build the full URL for the QR code
        // Use window.location.href to get full current URL including base path (e.g., /Kath/)
        // We strip the current page path ('/Kath/' or '/') and append the order path
        let baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, ''); // Remove trailing slash

        // Fix: If running on localhost, replace with local IP for external access
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            baseUrl = baseUrl
                .replace('localhost', '192.168.100.181')
                .replace('127.0.0.1', '192.168.100.181');
        }

        // Remove 'qr' or other page paths if present in the base (shouldn't be for this structure, but safe check)
        // If we are at root /Kath/, appending /order/token makes /Kath/order/token
        const url = `${baseUrl}/order/${token}`;
        setOrderUrl(url);
    };

    // Countdown timer
    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const remaining = expiresAt - Date.now();
            if (remaining <= 0) {
                setTimeLeft(0);
                setSessionToken(null);
                setExpiresAt(null);
                setOrderUrl('');
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    // Format time remaining
    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Generate QR Code as SVG (simple implementation using a third-party service)
    const qrCodeUrl = orderUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderUrl)}`
        : '';

    return (
        <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
            <Header title="باركود الطلب" subtitle="ولّد باركود للعميل" />

            <div className="p-4 flex flex-col items-center gap-6">
                {!sessionToken ? (
                    // No active session - show generate button
                    <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#556c33] to-[#3e4f24] rounded-3xl flex items-center justify-center">
                            <span className="text-4xl">📱</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            إنشاء باركود جديد
                        </h2>
                        <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                            اضغط الزر لإنشاء باركود للعميل. الباركود صالح لمدة 5 دقائق فقط.
                        </p>
                        <button
                            onClick={generateSession}
                            className="px-8 py-4 bg-gradient-to-r from-[#556c33] to-[#3e4f24] text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            🔄 إنشاء باركود
                        </button>
                    </div>
                ) : (
                    // Active session - show QR code
                    <div className="text-center">
                        {/* Timer */}
                        <div className={`mb-4 px-6 py-3 rounded-full font-bold text-lg ${timeLeft < 60000
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                            }`}>
                            ⏱️ {formatTime(timeLeft)}
                        </div>

                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-3xl shadow-lg inline-block mb-4">
                            <img
                                src={qrCodeUrl}
                                alt="QR Code"
                                className="w-64 h-64"
                            />
                        </div>

                        {/* Instructions */}
                        <p className="text-gray-600 mb-4 max-w-xs mx-auto">
                            اطلب من العميل مسح الباركود بالجوال لبدء الطلب
                        </p>

                        {/* URL for testing */}
                        <div className="bg-gray-100 rounded-xl p-3 mb-6 max-w-sm break-all">
                            <a
                                href={orderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm underline"
                            >
                                {orderUrl}
                            </a>
                        </div>

                        {/* Generate new button */}
                        <button
                            onClick={generateSession}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                            🔄 إنشاء باركود جديد
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default QRGeneratorPage;
