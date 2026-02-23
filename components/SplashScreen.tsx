import React from 'react';

export function SplashScreen() {
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
                <div className="relative inline-block">
                    <img
                        src="/assets/logos/logo_white.png"
                        alt="NexCoin Logo"
                        className="w-32 h-32 object-contain animate-pulse"
                    />
                </div>
                <div className="mt-8">
                    <div className="w-8 h-8 border-4 border-t-[#00d4ff] border-r-transparent border-b-[#7b2ff7] border-l-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    );
}
