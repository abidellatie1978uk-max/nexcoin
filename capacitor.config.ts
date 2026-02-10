import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.nexcoin.app',
    appName: 'NexCoin',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        iosScheme: 'https',
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#000000',
            showSpinner: false,
        },
        Keyboard: {
            resize: 'native',
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#000000',
        },
    },
};

export default config;
