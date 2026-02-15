import React from 'react';

export function SplashScreen() {
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
                <div className="relative inline-block animate-pulse">
                    <h1 className="text-4xl font-bold italic relative nexcoin-logo-text">
                        NexCoin
                    </h1>
                    <div
                        className="h-[2px] w-full mx-auto mt-2 rounded-full"
                        style={{
                            background: 'linear-gradient(90deg, transparent, #00d4ff, #7b2ff7, transparent)',
                            boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
                        }}
                    />
                </div>
                <div className="mt-8">
                    <div className="w-8 h-8 border-4 border-t-[#00d4ff] border-r-transparent border-b-[#7b2ff7] border-l-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    );
}
