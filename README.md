# Hota.chat

Hota.chat é uma interface moderna de chat com Inteligência Artificial inspirada no ChatGPT, mas com uma identidade visual própria. É alimentado pela API da OpenAI.

## Tecnologias Utilizadas

- **Frontend:** React, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express, CORS, dotenv
- **IA:** OpenAI API (`openai`)

## Estrutura do Projeto

- `/client` - Contém todo o código frontend (React + Tailwind)
- `/server` - Contém a API backend (Express + Integração com OpenAI)

## Como Rodar o Projeto Localmente

### 1. Configurar o Backend

1. Entre na pasta do servidor:
   ```bash
   cd server
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na pasta `server` (você pode copiar o `.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Edite o arquivo `.env` e insira a sua chave de API da OpenAI:
   ```
   OPENAI_API_KEY=sua_chave_aqui
   PORT=3001
   ```
5. Inicie o servidor:
   ```bash
   node index.js
   ```
   *O servidor rodará em http://localhost:3001*

### 2. Configurar o Frontend

1. Em um novo terminal, entre na pasta do cliente:
   ```bash
   cd client
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra o navegador na URL indicada (geralmente http://localhost:5173).

## Funcionalidades

- **Design Responsivo e Moderno:** Interface que se adapta a celulares e computadores, com animações suaves e um visual premium.
- **Tema Escuro/Claro:** Alternância de temas salvos automaticamente nas preferências do usuário.
- **Histórico de Conversas:** Salva seus chats localmente (usando `localStorage`), permitindo retomar conversas passadas.
- **Contexto de Conversa:** O backend envia o histórico da conversa para a OpenAI, garantindo que a IA lembre do que foi dito anteriormente no mesmo chat.
- **Segurança:** A chave da API fica protegida no backend Node.js e nunca é exposta no navegador.
