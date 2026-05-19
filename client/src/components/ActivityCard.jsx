import { Calendar, ExternalLink } from 'lucide-react';

export default function ActivityCard({ title, date, time, link, theme }) {
  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-full ${
      theme === 'dark' 
        ? 'bg-gray-800/60 border-gray-700/80 hover:bg-gray-800 hover:border-primary/45' 
        : 'bg-white border-gray-200/80 hover:bg-gray-50 hover:border-primary/45'
    }`}>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} className="text-primary" />
          <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{date}</span>
          {time && (
            <>
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{time}</span>
            </>
          )}
        </div>
        <h4 className={`text-sm font-semibold line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          {title}
        </h4>
      </div>
      {link && (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          Ver detalhes <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
