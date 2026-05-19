import { Mail, Clock } from 'lucide-react';

export default function GmailNoticeCard({ subject, sender, date, snippet, theme }) {
  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
      theme === 'dark' 
        ? 'bg-gray-800/60 border-gray-700/80 hover:bg-gray-800 hover:border-primary/45' 
        : 'bg-white border-gray-200/80 hover:bg-gray-50 hover:border-primary/45'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <Mail size={14} className="text-primary flex-shrink-0" />
          <span className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{sender}</span>
        </div>
        <span className={`text-[10px] whitespace-nowrap flex items-center gap-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          <Clock size={10} />
          {date}
        </span>
      </div>
      <h4 className={`text-sm font-semibold truncate mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        {subject}
      </h4>
      <p className={`text-xs line-clamp-2 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        {snippet}
      </p>
    </div>
  );
}
