import { FileText, FileSpreadsheet, Film, Image, FileCode, File, ExternalLink, Presentation } from 'lucide-react';

export default function DriveFileCard({ name, type, lastModified, link, theme }) {
  const getFileIcon = (mimeType) => {
    const mt = mimeType?.toLowerCase() || '';
    if (mt.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    if (mt.includes('document') || mt.includes('word') || mt.includes('text')) return <FileText size={18} className="text-blue-500" />;
    if (mt.includes('sheet') || mt.includes('excel')) return <FileSpreadsheet size={18} className="text-emerald-500" />;
    if (mt.includes('presentation') || mt.includes('powerpoint')) return <Presentation size={18} className="text-amber-550" />;
    if (mt.includes('image') || mt.includes('photo')) return <Image size={18} className="text-purple-500" />;
    if (mt.includes('video')) return <Film size={18} className="text-pink-500" />;
    if (mt.includes('code') || mt.includes('javascript') || mt.includes('json')) return <FileCode size={18} className="text-cyan-500" />;
    return <File size={18} className="text-gray-500" />;
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] flex items-center justify-between gap-3 ${
      theme === 'dark' 
        ? 'bg-gray-800/60 border-gray-700/80 hover:bg-gray-800 hover:border-primary/45' 
        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-primary/45'
    }`}>
      <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
        <div className={`p-2 rounded-lg flex-shrink-0 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
          {getFileIcon(type)}
        </div>
        <div className="overflow-hidden min-w-0">
          <h4 className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {name}
          </h4>
          <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Modificado: {lastModified}
          </p>
        </div>
      </div>
      {link && (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary transition-colors flex-shrink-0"
          title="Abrir no Google Drive"
        >
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
}
