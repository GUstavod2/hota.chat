import { Calendar, Mail, HardDrive } from 'lucide-react';

export default function GoogleIntegrationPanel({ integrations = {}, theme }) {
  const items = [
    {
      key: 'calendar',
      name: 'Google Calendar',
      icon: <Calendar size={14} />,
      connected: !!integrations.calendar,
    },
    {
      key: 'gmail',
      name: 'Gmail',
      icon: <Mail size={14} />,
      connected: !!integrations.gmail,
    },
    {
      key: 'drive',
      name: 'Google Drive',
      icon: <HardDrive size={14} />,
      connected: !!integrations.drive,
    },
  ];

  return (
    <div className="space-y-1.5 px-2">
      {items.map((item) => (
        <div 
          key={item.key}
          className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
            theme === 'dark' ? 'text-gray-350 hover:bg-gray-800/40' : 'text-gray-600 hover:bg-gray-100/60'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className={item.connected ? 'text-primary' : 'text-gray-400'}>
              {item.icon}
            </span>
            <span className="text-xs font-medium truncate">{item.name}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${item.connected ? 'bg-primary' : 'bg-gray-400'}`} />
            <span className={`text-[9px] font-bold tracking-wide uppercase ${
              item.connected ? 'text-primary' : 'text-gray-450'
            }`}>
              {item.connected ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
