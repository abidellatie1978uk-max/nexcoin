import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.ethertron.app',
    appName: 'Ethertron',
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
            resize: 'native' as any,
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#000000',
        },
    },
};

export default config;
