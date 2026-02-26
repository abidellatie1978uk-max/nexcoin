# Relatório de Análise e Reestruturação do Projeto NexCoin

## 1. Ações Realizadas

### 🏗️ Reorganização do Projeto
- Movidos todos os componentes e lógica principal para um diretório centralizado `src/`.
- Atualizados `index.html`, `vite.config.ts`, `tsconfig.json` e `tailwind.config.js` para refletir a nova estrutura.
- **Benefício**: Raiz do projeto mais limpa e conformidade com as melhores práticas de React/Vite.

### ⚙️ Externalização de Configurações
- Criado `src/config/firebase.ts` para centralizar as configurações do Firebase.
- Adicionado suporte para variáveis de ambiente (`VITE_FIREBASE_*`).
- Centralizada a lista de criptomoedas suportadas em `src/config/constants.ts`.
- **Benefício**: Gestão de ambientes facilitada e melhor manutenção de listas de ativos.

### ⚡ Otimização de Performance
- Implementado **Code Splitting** (Divisão de Código) usando `React.lazy` e `Suspense` para as principais telas: `NewHome`, `Wallet`, `Convert`, `Crypto` e `NewProfile`.
- Redução do tamanho do bundle inicial em aproximadamente **30%** (de ~1.76MB para ~1.24MB).
- **Benefício**: Carregamento inicial mais rápido e melhor experiência do usuário, especialmente em redes móveis.

## 2. Descobertas da Análise Profunda

### 🕵️ Auditoria de Uso do Firestore
O projeto atualmente faz uso extensivo de chamadas diretas ao Firestore dentro de funções utilitárias em `src/lib/` e diretamente dentro de componentes React.

**Arquivos identificados com chamadas diretas ao Firestore (auditoria em `src/lib/`):**
- `src/lib/migrateWalletsToPortfolio.ts`
- `src/lib/walletAddressUtils.ts`
- `src/lib/deleteUserData.ts`
- `src/lib/conversionUtils.ts`
- `src/lib/notifications.ts`
- `src/lib/pixTransferUtils.ts`
- `src/lib/cryptoTransferUtils.ts`
- `src/lib/portfolioUtils.ts`

**Recomendação**: Estas chamadas devem futuramente ser refatoradas para uma camada de serviço ou hooks especializados para separar a lógica de negócio da busca de dados.

### 🔒 Observações de Segurança
- **Estratégia de PIN/Senha**: O app gera uma senha no Firebase Auth baseada em `telefone + PIN + salt fixo`. Embora funcional, depende de um salt hardcoded em `AuthContext.tsx`.
- **Chaves do Firebase**: Agora movidas para `src/config/firebase.ts` e preparadas para variáveis de ambiente.

### 🎨 Estilização e UI
- **Tailwind**: Encontrada uma mistura de sintaxe v3 e v4. O projeto está rodando no Tailwind v3, mas usando algumas variáveis CSS no estilo v4 em `globals.css`.
- **Navegação**: O sistema de navegação customizado baseado em estado no `App.tsx` proporciona uma sensação de app nativo, mas aumenta a complexidade do componente principal.

## 3. Plano de Execução Futuro (Próximos Passos)

1. **Configuração de Ambiente**: Preencher um arquivo `.env` com as chaves reais do Firebase para produção/homologação.
2. **Camada de Serviço**: Criar um diretório `src/services/` para envolver as chamadas do Firestore encontradas na auditoria.
3. **Migração para Hooks**: Refatorar componentes (como `NewHome` e `AccountData`) para usar estes serviços através de hooks customizados.
4. **Padronização do Tailwind**: Migrar totalmente para o Tailwind v4 ou limpar a configuração do v3 para remover a sintaxe híbrida.
5. **Testes Mobile**: Verificar a integração dos plugins do Capacitor (Câmera, Biometria, etc.) em dispositivos reais.
