# 🚀 Guia de Compilação Mobile - NexCoin

Este guia explica como compilar o aplicativo NexCoin para Android e iOS usando Capacitor.

## 📋 Pré-requisitos

### Para Android:
- Node.js 18+ instalado
- Android Studio instalado
- Java JDK 17+ instalado
- SDK do Android (API 33+)

### Para iOS (somente macOS):
- macOS com Xcode 14+ instalado
- CocoaPods instalado (`sudo gem install cocoapods`)
- Conta Apple Developer (para distribuição)

---

## 🔧 Passo 1: Instalar Capacitor

No terminal, na raiz do projeto:

```bash
# Instalar dependências do Capacitor
npm install @capacitor/core @capacitor/cli

# Instalar plataformas
npm install @capacitor/android @capacitor/ios

# Instalar plugins necessários
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen @capacitor/camera @capacitor/filesystem @capacitor/share @capacitor/device @capacitor/network
```

---

## 🔧 Passo 2: Inicializar Capacitor

```bash
# Inicializar Capacitor
npx cap init

# Quando perguntado:
# - App name: NexCoin
# - App ID (bundle ID): com.NexCoin.app
# - Web asset directory: dist
```

---

## 🔧 Passo 3: Configurar capacitor.config.ts

Criar arquivo `capacitor.config.ts` na raiz do projeto:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.NexCoin.app',
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
```

---

## 🔧 Passo 4: Build da Aplicação Web

```bash
# Fazer build de produção
npm run build
```

---

## 📱 Passo 5: Adicionar Plataformas

```bash
# Adicionar Android
npx cap add android

# Adicionar iOS (somente macOS)
npx cap add ios

# Sincronizar assets
npx cap sync
```

---

## 🤖 Compilar para Android

### 5.1: Abrir no Android Studio

```bash
npx cap open android
```

### 5.2: Configurar no Android Studio

1. Aguarde o Android Studio indexar o projeto
2. Vá em `File > Project Structure`
3. Em `Project`, defina:
   - Gradle Version: 8.0+
   - Android Gradle Plugin Version: 8.0+
4. Em `Modules > app`, defina:
   - Compile SDK Version: 34
   - Min SDK Version: 24
   - Target SDK Version: 34

### 5.3: Configurar Permissões

Editar `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissões -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    
    <!-- Feature para câmera (opcional se não for obrigatória) -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <!-- Activity principal -->
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/title_activity_main"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 5.4: Build do APK (Debug)

No Android Studio:
1. `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. O APK será gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5.5: Build do APK/AAB (Release)

#### Gerar Keystore (primeira vez):

```bash
keytool -genkey -v -keystore NexCoin-release.keystore -alias NexCoin -keyalg RSA -keysize 2048 -validity 10000
```

#### Configurar gradle:

Editar `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("../../NexCoin-release.keystore")
            storePassword "SUA_SENHA"
            keyAlias "NexCoin"
            keyPassword "SUA_SENHA"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Gerar APK Release:

```bash
cd android
./gradlew assembleRelease
```

APK em: `android/app/build/outputs/apk/release/app-release.apk`

#### Gerar AAB para Google Play:

```bash
cd android
./gradlew bundleRelease
```

AAB em: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🍎 Compilar para iOS

### 6.1: Abrir no Xcode

```bash
npx cap open ios
```

### 6.2: Configurar no Xcode

1. Selecione o projeto `App` no navegador
2. Em `General`:
   - Display Name: NexCoin
   - Bundle Identifier: com.NexCoin.app
   - Version: 1.0.0
   - Minimum Deployments: iOS 13.0
3. Em `Signing & Capabilities`:
   - Selecione seu Team (Apple Developer Account)
   - Automatic Signing habilitado

### 6.3: Configurar Permissões

Editar `ios/App/App/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Permissões de Câmera -->
    <key>NSCameraUsageDescription</key>
    <string>NexCoin precisa acessar sua câmera para escanear QR codes e tirar fotos de perfil.</string>
    
    <!-- Permissões de Galeria -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>NexCoin precisa acessar suas fotos para você adicionar imagens de perfil.</string>
    
    <!-- Permissões de Biometria -->
    <key>NSFaceIDUsageDescription</key>
    <string>NexCoin usa Face ID para autenticar transações de forma segura.</string>
    
    <!-- Outras configurações -->
    <key>CFBundleDisplayName</key>
    <string>NexCoin</string>
    
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleLightContent</string>
    
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <true/>
</dict>
</plist>
```

### 6.4: Build do App (Debug)

1. No Xcode, selecione um simulador ou dispositivo conectado
2. Clique no botão Play (▶) ou `Product > Run`
3. O app será instalado e executado

### 6.5: Build do App (Release)

1. Selecione `Product > Archive`
2. Aguarde o build completar
3. Na janela Organizer:
   - Para teste: `Distribute App > Ad Hoc` ou `Development`
   - Para App Store: `Distribute App > App Store Connect`

---

## 🔄 Workflow de Desenvolvimento

### Após cada mudança no código:

```bash
# 1. Build da web
npm run build

# 2. Sincronizar com plataformas nativas
npx cap sync

# 3. (Opcional) Copiar apenas assets sem rebuild
npx cap copy
```

### Para atualizar plugins nativos:

```bash
# Atualizar todos os plugins
npm update @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# Sincronizar mudanças
npx cap sync
```

---

## 🎨 Personalizar Ícones e Splash Screen

### Ícones:

1. Crie um ícone de 1024x1024px
2. Use ferramentas como:
   - Android: https://romannurik.github.io/AndroidAssetStudio/
   - iOS: https://appicon.co/

3. Substitua:
   - Android: `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Splash Screen:

1. Crie uma imagem de splash (2732x2732px recomendado)
2. Substitua:
   - Android: `android/app/src/main/res/drawable/splash.png`
   - iOS: `ios/App/App/Assets.xcassets/Splash.imageset/`

---

## 🐛 Troubleshooting

### Android:

**Erro de build no Gradle:**
```bash
cd android
./gradlew clean
./gradlew build
```

**App não abre no dispositivo:**
- Verifique se o dispositivo está em modo desenvolvedor
- Verifique USB debugging habilitado
- Execute: `adb devices` para ver dispositivos conectados

### iOS:

**Erro de certificado:**
- Verifique se tem conta Apple Developer ativa
- Revise as configurações em `Signing & Capabilities`
- Tente limpar: `Product > Clean Build Folder`

**App não instala no dispositivo:**
- Verifique se o dispositivo está registrado na conta developer
- Tente remover o app existente antes de reinstalar

---

## 📦 Distribuição

### Android - Google Play Store:

1. Crie uma conta Google Play Developer ($25 taxa única)
2. Gere o AAB release: `./gradlew bundleRelease`
3. Acesse Google Play Console
4. Crie um novo app e faça upload do AAB
5. Preencha as informações e capturas de tela
6. Submeta para revisão

### iOS - Apple App Store:

1. Crie uma conta Apple Developer ($99/ano)
2. No Xcode: `Product > Archive`
3. Em Window > Organizer, selecione o archive
4. Clique em `Distribute App`
5. Escolha `App Store Connect`
6. Siga as etapas e faça upload
7. Em App Store Connect, configure e submeta para revisão

---

## 🔐 Segurança para Produção

### Variáveis de Ambiente:

1. Nunca commite `.env` com chaves reais
2. Use diferentes arquivos para dev e produção:
   - `.env.development`
   - `.env.production`

### Firebase:

1. Configure regras de segurança no Firestore
2. Ative App Check para validar requests legítimos
3. Use diferentes projetos Firebase para dev/prod

### API Keys:

1. Restrinja API keys no Firebase Console
2. Configure restrições por Bundle ID (iOS) e Package Name (Android)
3. Habilite apenas os serviços necessários

---

## ✅ Checklist Final

Antes de publicar:

- [ ] Testado em dispositivos Android físicos
- [ ] Testado em dispositivos iOS físicos
- [ ] Ícones e splash screen configurados
- [ ] Permissões necessárias solicitadas
- [ ] Firebase configurado para produção
- [ ] Regras de segurança do Firestore aplicadas
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Versionamento correto (semver)
- [ ] Changelog documentado
- [ ] Política de privacidade e termos de uso incluídos
- [ ] Capturas de tela preparadas para stores
- [ ] Descrições traduzidas (PT-BR, EN, ES)

---

## 📱 Comandos Úteis

```bash
# Ver logs do dispositivo Android
adb logcat

# Ver logs do dispositivo iOS
xcrun simctl spawn booted log stream --predicate 'process == "NexCoin"'

# Limpar cache do Capacitor
npx cap sync --clean

# Verificar status das plataformas
npx cap doctor

# Atualizar Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest
npx cap sync
```

---

## 🆘 Suporte

- Documentação Capacitor: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio/intro
- Xcode: https://developer.apple.com/xcode/

---

**Autor:** Equipe NexCoin  
**Última Atualização:** Fevereiro 2026
