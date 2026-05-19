import { ArrowRight } from 'lucide-react';

export default function QuickActionCard({ title, description, icon: Icon, onClick, theme }) {
  return (
    <button 
      onClick={onClick}
      className={`group text-left p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-full w-full ${
        theme === 'dark' 
          ? 'bg-gray-800/40 border-gray-700/80 hover:bg-gray-800 hover:border-primary/50' 
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-primary/50'
      }`}
    >
      <div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 text-primary group-hover:bg-primary/20 group-hover:text-primary' 
            : 'bg-gray-150 text-primary group-hover:bg-primary/10 group-hover:text-primary'
        }`}>
          <Icon size={20} />
        </div>
        <h4 className={`text-base font-bold mb-1.5 transition-colors group-hover:text-primary ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          {title}
        </h4>
        <p className={`text-xs leading-relaxed ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {description}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Iniciar <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
