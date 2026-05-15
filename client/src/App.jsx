import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Menu, Plus, MessageSquare, Trash2, Send, Sun, Moon, Bot, User, X } from 'lucide-react';

function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentChatId) return;

    const messageText = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Create a new message object for the user
    const newUserMessage = { role: 'user', content: messageText };

    // Update current chat with user message
    let updatedChat = { ...currentChat };
    updatedChat.messages = [...updatedChat.messages, newUserMessage];
    
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
          history: currentChat.messages // Send previous context
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              U
            </div>
            <span className="text-sm font-medium">Usuário</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
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
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Bot size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Como posso ajudar hoje?</h2>
              <p className="max-w-md">Envie uma mensagem abaixo para começar a conversar com a inteligência artificial do Hota.chat.</p>
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
            <textarea
              className="flex-1 max-h-48 min-h-[56px] p-4 bg-transparent resize-none outline-none scrollbar-hide text-sm md:text-base"
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
                  ? 'bg-transparent text-gray-400' 
                  : 'bg-primary text-white hover:bg-primary-hover shadow-md'}`}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            Hota.chat usa tecnologia da OpenAI. Ele pode cometer erros. Considere verificar informações importantes.
          </p>
        </div>
      </div>

    </div>
  );
}

export default App;
