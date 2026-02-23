#!/bin/bash

# 🚀 Script de Configuração Mobile - NexCoin
# Este script automatiza a configuração do Capacitor para Android e iOS

echo "🚀 Configurando NexCoin para Mobile..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Por favor, instale Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js encontrado: $(node --version)${NC}"
echo ""

# Passo 1: Instalar dependências do Capacitor
echo -e "${BLUE}📦 Instalando Capacitor e plugins...${NC}"
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios \
    @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar \
    @capacitor/splash-screen @capacitor/camera @capacitor/filesystem \
    @capacitor/share @capacitor/device @capacitor/network

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# Passo 2: Criar capacitor.config.ts
echo -e "${BLUE}⚙️  Criando capacitor.config.ts...${NC}"

cat > capacitor.config.ts << 'EOF'
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
EOF

echo -e "${GREEN}✅ capacitor.config.ts criado${NC}"
echo ""

# Passo 3: Build da aplicação web
echo -e "${BLUE}🔨 Fazendo build da aplicação web...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build da aplicação${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído${NC}"
echo ""

# Passo 4: Adicionar plataformas
echo -e "${BLUE}📱 Adicionando plataformas...${NC}"

# Android
echo -e "${YELLOW}Adicionando Android...${NC}"
npx cap add android

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Android adicionado${NC}"
else
    echo -e "${RED}⚠️  Erro ao adicionar Android${NC}"
fi

# iOS (apenas em macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}Adicionando iOS...${NC}"
    npx cap add ios
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ iOS adicionado${NC}"
    else
        echo -e "${RED}⚠️  Erro ao adicionar iOS${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  iOS não adicionado (requer macOS)${NC}"
fi

echo ""

# Passo 5: Sincronizar
echo -e "${BLUE}🔄 Sincronizando assets...${NC}"
npx cap sync

echo -e "${GREEN}✅ Sincronização concluída${NC}"
echo ""

# Criar arquivo .gitignore para plataformas nativas
echo -e "${BLUE}📝 Atualizando .gitignore...${NC}"

if [ -f .gitignore ]; then
    # Adicionar ao .gitignore existente se não estiver lá
    if ! grep -q "# Capacitor" .gitignore; then
        cat >> .gitignore << 'EOF'

# Capacitor
android/
ios/
.capacitor/
EOF
        echo -e "${GREEN}✅ .gitignore atualizado${NC}"
    else
        echo -e "${YELLOW}⚠️  Entradas do Capacitor já existem no .gitignore${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Configuração concluída!${NC}"
echo ""
echo -e "${BLUE}📱 Próximos passos:${NC}"
echo ""
echo -e "  ${YELLOW}Para Android:${NC}"
echo -e "    npx cap open android"
echo -e "    (Abrirá no Android Studio - pressione o botão Play para executar)"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "  ${YELLOW}Para iOS:${NC}"
    echo -e "    npx cap open ios"
    echo -e "    (Abrirá no Xcode - pressione o botão Play para executar)"
    echo ""
fi

echo -e "  ${YELLOW}Para sincronizar após mudanças:${NC}"
echo -e "    npm run build && npx cap sync"
echo ""
echo -e "${BLUE}📖 Consulte MOBILE_BUILD_GUIDE.md para mais detalhes${NC}"
echo ""
