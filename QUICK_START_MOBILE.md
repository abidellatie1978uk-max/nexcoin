# 🚀 Início Rápido - Mobile Build

## ⚠️ Importante

Este guia é para compilar o aplicativo NexCoin para **dispositivos móveis Android e iOS**. 
O desenvolvimento atual roda no **navegador web** e não requer o Capacitor.

**Quando usar este guia:**
- ✅ Quando quiser testar em dispositivos reais (Android/iOS)
- ✅ Quando quiser gerar APK/IPA para distribuição
- ✅ Quando precisar de recursos nativos (câmera, GPS, etc.)

**Não precisa se o objetivo é:**
- ❌ Apenas desenvolver no navegador
- ❌ Testar funcionalidades web

---

## Opção 1: Script Automático (Recomendado)

```bash
# Dar permissão de execução ao script
chmod +x setup-mobile.sh

# Executar script de configuração
./setup-mobile.sh
```

O script irá:
- ✅ Instalar todas as dependências do Capacitor
- ✅ Criar o arquivo de configuração
- ✅ Fazer build da aplicação web
- ✅ Adicionar plataformas Android e iOS
- ✅ Sincronizar assets

---

## Opção 2: Configuração Manual

### Passo 1: Instalar Dependências

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios \
  @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar \
  @capacitor/splash-screen @capacitor/camera @capacitor/filesystem \
  @capacitor/share @capacitor/device @capacitor/network
```

### Passo 2: Build da Aplicação

```bash
npm run build
```

### Passo 3: Adicionar Plataformas

```bash
# Android
npx cap add android

# iOS (somente macOS)
npx cap add ios

# Sincronizar
npx cap sync
```

---

## Executar no Android

```bash
# Abrir no Android Studio
npx cap open android

# No Android Studio, clique no botão Play ▶
```

**Ou via linha de comando:**

```bash
cd android
./gradlew installDebug
```

---

## Executar no iOS

```bash
# Abrir no Xcode (somente macOS)
npx cap open ios

# No Xcode, clique no botão Play ▶
```

---

## Workflow de Desenvolvimento

### Após cada mudança no código:

```bash
# Build + Sync (comando completo)
npm run build && npx cap sync
```

### Para ver logs em tempo real:

**Android:**
```bash
adb logcat | grep -i nexcoin
```

**iOS:**
```bash
xcrun simctl spawn booted log stream --predicate 'process == "NexCoin"'
```

---

## Gerar APK para Testes

```bash
cd android
./gradlew assembleDebug
```

APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Gerar APK/AAB para Produção

### 1. Criar Keystore (primeira vez):

```bash
keytool -genkey -v -keystore nexcoin-release.keystore \
  -alias nexcoin -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configurar Signing (editar android/app/build.gradle):

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../nexcoin-release.keystore")
            storePassword "SUA_SENHA"
            keyAlias "nexcoin"
            keyPassword "SUA_SENHA"
        }
    }
}
```

### 3. Gerar Release:

```bash
cd android

# APK Release
./gradlew assembleRelease

# AAB para Google Play (recomendado)
./gradlew bundleRelease
```

---

## Troubleshooting Rápido

### Erro: "JAVA_HOME not set"

```bash
# macOS/Linux
export JAVA_HOME=$(/usr/libexec/java_home)

# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-17
```

### Erro: "SDK location not found"

Criar `android/local.properties`:

```properties
sdk.dir=/Users/SEU_USUARIO/Library/Android/sdk
```

### Limpar cache e recompilar:

```bash
# Limpar tudo
rm -rf android ios node_modules dist

# Reinstalar
npm install
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

### App não abre ou crasha:

```bash
# Ver logs Android
adb logcat

# Ver logs iOS
xcrun simctl spawn booted log stream
```

---

## Atalhos Úteis

```bash
# Verificar status
npx cap doctor

# Atualizar Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest
npx cap sync

# Abrir configuração do Android
npx cap open android

# Abrir configuração do iOS
npx cap open ios

# Copiar apenas web assets (sem rebuild nativo)
npx cap copy

# Sincronizar tudo
npx cap sync
```

---

## Estrutura de Arquivos

```
nexcoin/
├── android/              # Projeto Android nativo
├── ios/                  # Projeto iOS nativo
├── src/                  # Código React
├── dist/                 # Build web (gerado)
├── capacitor.config.ts   # Configuração Capacitor
└── package.json          # Dependências
```

---

## Próximos Passos

1. ✅ Configure ícones e splash screen
2. ✅ Configure Firebase para produção
3. ✅ Teste em dispositivos físicos
4. ✅ Configure signing para release
5. ✅ Publique nas stores

📖 **Consulte MOBILE_BUILD_GUIDE.md para detalhes completos**

---

## Contatos e Suporte

- Documentação Capacitor: https://capacitorjs.com/docs
- Firebase: https://firebase.google.com/docs
- Android Developer: https://developer.android.com
- Apple Developer: https://developer.apple.com