import { useState, useEffect } from 'react';
import { Calendar, Mail, HardDrive, Loader2, AlertCircle } from 'lucide-react';
import ActivityCard from './ActivityCard';
import GmailNoticeCard from './GmailNoticeCard';
import DriveFileCard from './DriveFileCard';

export default function AcademicDashboard({ theme, integrations = {} }) {
  const [calendar, setCalendar] = useState({ data: [], loading: true, error: null });
  const [gmail, setGmail] = useState({ data: [], loading: true, error: null });
  const [drive, setDrive] = useState({ data: [], loading: true, error: null });

  const getApiUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}${path}`;
  };

  useEffect(() => {
    const fetchCalendar = async () => {
      setCalendar(prev => ({ ...prev, loading: true }));
      try {
        const response = await fetch(getApiUrl('/api/google/calendar/events'));
        if (!response.ok) throw new Error('Não foi possível obter os eventos.');
        const data = await response.json();
        setCalendar({ data: data.events || [], loading: false, error: null });
      } catch (err) {
        setCalendar({ data: [], loading: false, error: err.message });
      }
    };

    const fetchGmail = async () => {
      setGmail(prev => ({ ...prev, loading: true }));
      try {
        const response = await fetch(getApiUrl('/api/google/gmail/messages'));
        if (!response.ok) throw new Error('Não foi possível obter as mensagens.');
        const data = await response.json();
        setGmail({ data: data.messages || [], loading: false, error: null });
      } catch (err) {
        setGmail({ data: [], loading: false, error: err.message });
      }
    };

    const fetchDrive = async () => {
      setDrive(prev => ({ ...prev, loading: true }));
      try {
        const response = await fetch(getApiUrl('/api/google/drive/files'));
        if (!response.ok) throw new Error('Não foi possível obter os arquivos.');
        const data = await response.json();
        setDrive({ data: data.files || [], loading: false, error: null });
      } catch (err) {
        setDrive({ data: [], loading: false, error: err.message });
      }
    };

    fetchCalendar();
    fetchGmail();
    fetchDrive();
  }, [integrations]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-6">
      {/* Bloco A: Próximas Atividades */}
      <div className={`p-5 rounded-2xl border flex flex-col h-[340px] transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800/20 border-gray-700/80 hover:bg-gray-800/30' 
          : 'bg-gray-50/50 border-gray-250 hover:bg-gray-50'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'}`}>
            <Calendar size={16} />
          </div>
          <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Próximas Atividades
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pr-1">
          {calendar.loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : calendar.error || calendar.data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-4 py-8">
              <AlertCircle size={18} className="text-gray-400 mb-2" />
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Nenhuma atividade encontrada
              </p>
              <span className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                Conecte sua conta para carregar sua agenda escolar.
              </span>
            </div>
          ) : (
            calendar.data.map((event, idx) => (
              <ActivityCard 
                key={event.id || idx}
                title={event.title}
                date={event.date}
                time={event.time}
                link={event.link}
                theme={theme}
              />
            ))
          )}
        </div>
      </div>

      {/* Bloco B: Avisos Recentes */}
      <div className={`p-5 rounded-2xl border flex flex-col h-[340px] transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800/20 border-gray-700/80 hover:bg-gray-800/30' 
          : 'bg-gray-50/50 border-gray-250 hover:bg-gray-50'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'}`}>
            <Mail size={16} />
          </div>
          <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Avisos Recentes
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pr-1">
          {gmail.loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : gmail.error || gmail.data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-4 py-8">
              <AlertCircle size={18} className="text-gray-400 mb-2" />
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Nenhum aviso recente
              </p>
              <span className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                Conecte sua conta para verificar e-mails acadêmicos.
              </span>
            </div>
          ) : (
            gmail.data.map((msg, idx) => (
              <GmailNoticeCard 
                key={msg.id || idx}
                subject={msg.subject}
                sender={msg.sender}
                date={msg.date}
                snippet={msg.snippet}
                theme={theme}
              />
            ))
          )}
        </div>
      </div>

      {/* Bloco C: Arquivos Recentes */}
      <div className={`p-5 rounded-2xl border flex flex-col h-[340px] transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800/20 border-gray-700/80 hover:bg-gray-800/30' 
          : 'bg-gray-50/50 border-gray-250 hover:bg-gray-50'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'}`}>
            <HardDrive size={16} />
          </div>
          <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Arquivos Recentes
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pr-1">
          {drive.loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : drive.error || drive.data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-4 py-8">
              <AlertCircle size={18} className="text-gray-400 mb-2" />
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Nenhum arquivo encontrado
              </p>
              <span className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                Conecte sua conta para acessar seus arquivos de estudo.
              </span>
            </div>
          ) : (
            drive.data.map((file, idx) => (
              <DriveFileCard 
                key={file.id || idx}
                name={file.name}
                type={file.mimeType}
                lastModified={file.lastModified}
                link={file.link}
                theme={theme}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
