import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Menu, Plus, MessageSquare, Trash2, Send, Sun, Moon, 
  Bot, User, X, Paperclip, Loader2, GraduationCap, 
  Sparkles, Calendar, Mail, HardDrive 
} from 'lucide-react';

import GoogleIntegrationPanel from './components/GoogleIntegrationPanel';
import AcademicDashboard from './components/AcademicDashboard';
import QuickActionCard from './components/QuickActionCard';

function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const fileInputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Google integration states
  const [googleIntegrations, setGoogleIntegrations] = useState({
    calendar: false,
    gmail: false,
    drive: false
  });

  // Load chats and theme from local storage on init
  useEffect(() => {
    const savedChats = localStorage.getItem('hota_chats');
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    } else {
      createNewChat();
    }

    const savedTheme = localStorage.getItem('hota_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  // Save chats to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('hota_chats', JSON.stringify(chats));
  }, [chats]);

  // Save theme
  useEffect(() => {
    localStorage.setItem('hota_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Check Google Integration Status from Backend
  useEffect(() => {
    const checkIntegrationStatus = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/api/google/status`);
        if (response.ok) {
          const data = await response.json();
          setGoogleIntegrations({
            calendar: !!data.calendar,
            gmail: !!data.gmail,
            drive: !!data.drive
          });
        }
      } catch (error) {
        console.warn("Could not load Google integration status. Using default offline status.", error);
      }
    };
    checkIntegrationStatus();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId]);

  const currentChat = chats.find(c => c.id === currentChatId) || null;

  const createNewChat = () => {
    const newChat = {
      id: uuidv4(),
      title: 'Nova Conversa',
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setSidebarOpen(false); // Close sidebar on mobile after creating
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    const updatedChats = chats.filter(c => c.id !== id);
    setChats(updatedChats);
    if (currentChatId === id) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
    if (updatedChats.length === 0) {
      createNewChat();
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Generalized message sender for normal typing & quick academic cards
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !currentChatId) return;

    setIsLoading(true);

    // Create a new message object for the user
    const newUserMessage = { role: 'user', content: messageText };

    // Update current chat with user message
    let updatedChat = { ...currentChat };
    const currentMessages = updatedChat.messages;
    updatedChat.messages = [...currentMessages, newUserMessage];
    
    // Auto-generate title if it's the first message
    if (updatedChat.messages.length === 1) {
      updatedChat.title = messageText.length > 30 ? messageText.substring(0, 30) + '...' : messageText;
    }

    setChats(prev => prev.map(c => c.id === currentChatId ? updatedChat : c));

    try {
      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/chat` 
        : 'http://localhost:3001/api/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: currentMessages // Send previous context
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na comunicação com a API');
      }

      const newAiMessage = { role: 'model', content: data.reply };
      
      setChats(prev => prev.map(c => {
        if (c.id === currentChatId) {
          return { ...c, messages: [...c.messages, newAiMessage] };
        }
        return c;
      }));

    } catch (error) {
      console.error(error);
      const errorMessage = { 
        role: 'model', 
        content: `❌ Ocorreu um erro: ${error.message}. Verifique se o servidor backend está rodando e a chave da API está configurada.`,
        isError: true
      };
      setChats(prev => prev.map(c => {
        if (c.id === currentChatId) {
          return { ...c, messages: [...c.messages, errorMessage] };
        }
        return c;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/upload` 
        : 'http://localhost:3001/api/upload';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      alert(`✅ Sucesso: ${data.message}`);
    } catch (error) {
      alert(`❌ Erro no upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Define 4 quick academic cards
  const quickActions = [
    {
      title: "Atividades da semana",
      description: "Veja minhas atividades da semana e organize minha agenda de estudos.",
      prompt: "Veja minhas atividades da semana e organize minha agenda de estudos.",
      icon: Calendar
    },
    {
      title: "Avisos da faculdade",
      description: "Resuma os avisos recentes da faculdade no meu Gmail.",
      prompt: "Resuma os avisos recentes da faculdade no meu Gmail.",
      icon: Mail
    },
    {
      title: "Buscar no Drive",
      description: "Busque materiais recentes no meu Google Drive relacionados às minhas matérias.",
      prompt: "Busque materiais recentes no meu Google Drive relacionados às minhas matérias.",
      icon: HardDrive
    },
    {
      title: "Plano de estudos",
      description: "Monte um plano de estudos com base nas minhas próximas atividades.",
      prompt: "Monte um plano de estudos com base nas minhas próximas atividades.",
      icon: Sparkles
    }
  ];

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-chat-dark text-white' : 'bg-chat-light text-gray-800'}`}>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col ${theme === 'dark' ? 'bg-sidebar-dark' : 'bg-sidebar-light border-r border-gray-200'}`}>
        <div className="p-4 flex items-center justify-between md:justify-center">
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
            <span className="text-primary">Hota</span>.chat
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono uppercase tracking-normal">Edu</span>
          </h1>
          <button className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-3">
          <button 
            onClick={createNewChat}
            className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            <Plus size={18} />
            <span className="font-medium">Novo chat</span>
          </button>
        </div>

        {/* Recents List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide space-y-1">
          <h2 className="text-xs font-semibold text-gray-500 mb-3 px-2 uppercase tracking-wider">Conversas Recentes</h2>
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => { setCurrentChatId(chat.id); setSidebarOpen(false); }}
              className={`flex items-center justify-between group cursor-pointer p-3 rounded-lg transition-colors ${currentChatId === chat.id ? (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200') : (theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100')}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={18} className={currentChatId === chat.id ? 'text-primary' : 'text-gray-500'} />
                <span className="truncate text-sm font-medium">{chat.title}</span>
              </div>
              <button 
                onClick={(e) => deleteChat(e, chat.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity p-1"
                title="Apagar conversa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Integrações Section (Sidebar) */}
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700/60">
          <h2 className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Integrações</h2>
          <GoogleIntegrationPanel integrations={googleIntegrations} theme={theme} />
        </div>

        {/* Sidebar Footer with Conectar Google */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
          <a 
            href={import.meta.env.VITE_API_URL 
              ? `${import.meta.env.VITE_API_URL}/api/google/auth` 
              : 'http://localhost:3001/api/google/auth'}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm"
          >
            <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.823-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.706 0 3.24.699 4.35 1.83l3.223-3.223C19.51 2.52 16.137 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.24-4.557 11.24-11.24 0-.799-.078-1.547-.24-2.285H12.24z"/>
            </svg>
            Conectar Google
          </a>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                U
              </div>
              <span className="text-sm font-medium">Usuário</span>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <div className={`md:hidden flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-chat-dark' : 'border-gray-200 bg-chat-light'}`}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
            <Menu size={24} />
          </button>
          <span className="font-semibold">{currentChat?.title || 'Hota.chat'}</span>
          <button onClick={createNewChat} className="p-2 -mr-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
            <Plus size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
          {currentChat?.messages.length === 0 ? (
            <div className="py-8 px-4 w-full max-w-5xl mx-auto flex flex-col">
              
              {/* Academic Dashboard Header */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                  <GraduationCap size={28} />
                </div>
                <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Como posso te ajudar nos estudos hoje?
                </h2>
                <p className={`text-sm mt-2 max-w-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Seu assistente acadêmico pessoal integrado com Google Calendar, Gmail e Google Drive.
                </p>
              </div>

              {/* Quick Academic Action Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {quickActions.map((action, idx) => (
                  <QuickActionCard 
                    key={idx}
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    onClick={() => sendMessage(action.prompt)}
                    theme={theme}
                  />
                ))}
              </div>

              {/* Visão Geral Acadêmica / Google Dashboard */}
              <div className="mt-10 border-t border-gray-200 dark:border-gray-700/60 pt-8">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="text-primary" size={20} />
                  <h3 className={`text-base font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Visão Geral Acadêmica
                  </h3>
                </div>
                <AcademicDashboard theme={theme} />
              </div>
            </div>
          ) : (
            currentChat?.messages.map((msg, index) => (
              <div key={index} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary text-white' : (theme === 'dark' ? 'bg-gray-700 text-primary' : 'bg-gray-200 text-primary')}`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : (msg.isError ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800' : (theme === 'dark' ? 'bg-gray-800 rounded-tl-none' : 'bg-gray-100 rounded-tl-none'))}`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4 max-w-4xl mx-auto">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700 text-primary' : 'bg-gray-200 text-primary'}`}>
                <Bot size={18} />
              </div>
              <div className={`rounded-2xl p-4 rounded-tl-none flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 pb-6 md:pb-8 max-w-4xl w-full mx-auto">
          <div className={`relative flex items-end rounded-2xl border shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".txt,.pdf"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Anexar documento (RAG)"
              className={`p-3 m-1.5 rounded-xl transition-all flex-shrink-0 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
            </button>

            <textarea
              className="flex-1 max-h-48 min-h-[56px] p-4 pl-1 bg-transparent resize-none outline-none scrollbar-hide text-sm md:text-base text-inherit"
              placeholder="Digite sua mensagem para o Hota.chat..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !currentChatId}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || !currentChatId}
              className={`p-3 m-1.5 rounded-xl transition-all flex-shrink-0 flex items-center justify-center
                ${!inputMessage.trim() || isLoading 
                  ? 'bg-transparent text-gray-405 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary/90 shadow-md'}`}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            Hota.chat usa tecnologia da OpenAI e integração Google Workspace. Ele pode cometer erros.
          </p>
        </div>
      </div>

    </div>
  );
}

export default App;
