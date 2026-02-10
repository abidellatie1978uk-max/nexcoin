# 🪙 NexCoin - Aplicativo de Transações de Criptomoedas

Aplicativo moderno de transações de criptomoedas com design clean e minimalista em tema dark/preto, com suporte completo para mobile (Android e iOS).

## 🎯 Características Principais

- ✨ **Design Glassmorphism**: Interface moderna com efeito de vidro (`bg-white/5 backdrop-blur-md border-white/10`)
- 🌍 **Multilíngue**: Suporte para PT-BR, EN e ES
- 🔐 **Autenticação Completa**: Login por celular e redes sociais
- 💰 **Gestão de Carteiras**: Suporte para múltiplas criptomoedas e contas fiat
- 📊 **Gráficos em Tempo Real**: Visualização de portfólio e histórico de preços
- 🔄 **Conversão**: Troca entre criptomoedas e moedas fiat
- 📱 **Mobile-Ready**: Preparado para compilação Android e iOS via Capacitor
- 🔒 **Máxima Segurança**: Integração com Firebase e validações robustas

## 🚀 Início Rápido

### Desenvolvimento Web (Recomendado)

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

O aplicativo estará disponível em `http://localhost:5173`

### Compilação Mobile

Para compilar o aplicativo para Android e iOS, consulte os guias:

- 📖 **[QUICK_START_MOBILE.md](./QUICK_START_MOBILE.md)** - Guia rápido com comandos essenciais
- 📚 **[MOBILE_BUILD_GUIDE.md](./MOBILE_BUILD_GUIDE.md)** - Guia completo e detalhado

**Resumo:**

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# Build e sincronizar
npm run build
npx cap add android
npx cap add ios
npx cap sync

# Abrir no Android Studio
npx cap open android

# Abrir no Xcode (macOS)
npx cap open ios
```

## 📁 Estrutura do Projeto

```
nexcoin/
├── src/
│   ├── components/        # Componentes React
│   ├── contexts/          # Context API (Auth, Preços, Portfolio, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilitários e helpers
│   ├── translations/      # Arquivos de tradução (PT-BR, EN, ES)
│   ├── capacitor-setup.ts # Configuração Capacitor (mobile)
│   └── App.tsx            # Componente principal
├── public/                # Assets estáticos
├── android/               # Projeto Android (gerado)
├── ios/                   # Projeto iOS (gerado)
├── MOBILE_BUILD_GUIDE.md  # Guia completo de build mobile
├── QUICK_START_MOBILE.md  # Guia rápido de build mobile
└── setup-mobile.sh        # Script automático de configuração mobile
```

## 🎨 Design System

### Tema de Cores

- **Background**: `#000000` (preto absoluto)
- **Glassmorphism**: `bg-white/5 backdrop-blur-md border-white/10`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#9ca3af` (gray-400)
- **Accent**: Sem cores vibrantes (azul removido para consistência)

### Tipografia

- **Fonte**: System font stack (sans-serif)
- **Peso**: Normal (sem bold, exceto onde necessário)
- **Valores Monetários**: Centavos em tamanho menor

### Formatação

- **Números**: Padrão brasileiro (1.234,56)
- **Moeda**: USDT como padrão
- **Decimais**: 2 casas decimais

## 🔧 Tecnologias

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Build**: Vite
- **Backend**: Firebase (Firestore + Auth)
- **Mobile**: Capacitor 6
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: Sonner

## 🌐 Recursos Multilíngue

O app suporta 3 idiomas com traduções completas:

- 🇧🇷 **Português Brasileiro** (PT-BR)
- 🇺🇸 **Inglês** (EN)
- 🇪🇸 **Espanhol** (ES)

Arquivos de tradução em: `/src/translations/`

## 🔐 Segurança

- ✅ Autenticação via Firebase Auth
- ✅ Verificação de PIN de 6 dígitos
- ✅ Validação de dados em tempo real
- ✅ Regras de segurança no Firestore
- ✅ Aprovação manual de usuários (campo `aprovado`)
- ✅ Criptografia de senhas
- ✅ Proteção contra ataques comuns

## 📱 Abas Principais

1. **🏠 Home**: Visão geral do portfólio e saldo total
2. **💼 Carteira**: Gestão de criptomoedas e contas fiat
3. **🔄 Converter**: Troca entre ativos
4. **📈 Cripto**: Listagem e análise de criptomoedas
5. **👤 Perfil**: Configurações e informações pessoais

## 🚢 Deploy

### Web

```bash
# Build de produção
npm run build

# Preview local
npm run preview
```

A pasta `dist/` conterá os arquivos otimizados para deploy.

### Mobile

Siga os guias em:
- [MOBILE_BUILD_GUIDE.md](./MOBILE_BUILD_GUIDE.md)
- [QUICK_START_MOBILE.md](./QUICK_START_MOBILE.md)

## 📄 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Lint do código
chmod +x setup-mobile.sh && ./setup-mobile.sh  # Setup mobile automático
```

## 🤝 Contribuindo

Este é um projeto proprietário. Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Copyright © 2026 NexCoin. Todos os direitos reservados.

## 🆘 Suporte

Para dúvidas sobre:

- **Build Mobile**: Consulte [MOBILE_BUILD_GUIDE.md](./MOBILE_BUILD_GUIDE.md)
- **Comandos Rápidos**: Consulte [QUICK_START_MOBILE.md](./QUICK_START_MOBILE.md)
- **Firebase**: https://firebase.google.com/docs
- **Capacitor**: https://capacitorjs.com/docs
- **React**: https://react.dev

---

**Desenvolvido com ❤️ pela equipe NexCoin**
