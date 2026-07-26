import { useState, useEffect, useRef } from 'react';
import { Download, Link as LinkIcon, Settings, X, FolderOpen, History, Home, Info, Play, Share2, Trash2, ListPlus, ChevronUp, Pause, Play as PlayIcon, GitBranch, Coffee, Copy, Check } from 'lucide-react';

declare global {
  interface Window {
    electronAPI: {
      getVideoInfo: (url: string) => Promise<any>;
      startDownload: (id: string, url: string, outputDir: string, customOptions: any) => Promise<any>;
      onDownloadProgress: (callback: (data: any) => void) => void;
      getDefaultDownloadPath: () => Promise<string>;
      selectFolder: () => Promise<string | null>;
      showInFolder: (fullPath: string) => Promise<void>;
      openPath: (fullPath: string) => Promise<{success: boolean, error: string}>;
    };
  }
}

type Tab = 'home' | 'history' | 'settings' | 'about';
type AppTheme = 'system' | 'light' | 'dark';

interface QueueItem {
  id: string;
  url: string;
  status: 'idle' | 'fetching' | 'ready' | 'downloading' | 'completed' | 'error';
  info?: any;
  progress: number;
  error?: string;
  isAudioOnly?: boolean;
  settings?: {
    resolution: string;
    fps: string;
    vcodec: string;
    acodec: string;
    container: string;
  } | null;
}

const dictionaries = {
  en: {
    navDownload: 'Download',
    navHistory: 'History',
    navSettings: 'Settings',
    navAbout: 'About',
    pastePlaceholder: 'Paste video link(s) here...',
    addQueue: 'Add to Queue',
    fetching: 'Fetching...',
    downloadAll: 'Start Queue',
    downloadSingle: 'Download',
    pauseQueue: 'Pause Queue',
    resumeQueue: 'Resume Queue',
    clearCompleted: 'Clear Completed',
    globalSettings: 'Global Settings',
    downloadSettings: 'Download Settings',
    customSettings: 'Custom Settings',
    resolution: 'Resolution',
    framerate: 'Frame Rate',
    vcodec: 'Video Codec',
    acodec: 'Audio Codec',
    container: 'Container',
    bestAvailable: 'Best Available',
    highestAvailable: 'Highest Available',
    bestFormat: 'Best Format',
    audioOnly: 'Audio Only',
    videoAudio: 'Video + Audio',
    downloading: 'Downloading...',
    completed: 'Completed',
    error: 'Error',
    historyEmpty: 'Your download history is empty.',
    play: 'Play',
    openFolder: 'Open Folder',
    share: 'Share',
    info: 'Info',
    version: 'Version',
    aboutDesc: 'A powerful, minimalist video downloader.',
    lang: 'Language',
    theme: 'Theme',
    defaultFolder: 'Default Folder',
    select: 'Select',
    sysTheme: 'System',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    dragDropTitle: 'Drop Links Here',
    dragDropDesc: 'Drag and drop video links directly into this window or paste them in the field above.',
    github: 'GitHub',
    coffee: 'Buy me a Coffee'
  },
  ru: {
    navDownload: 'Загрузка',
    navHistory: 'История',
    navSettings: 'Настройки',
    navAbout: 'О приложении',
    pastePlaceholder: 'Вставьте ссылку(и) на видео...',
    addQueue: 'В очередь',
    fetching: 'Получение данных...',
    downloadAll: 'Запустить очередь',
    downloadSingle: 'Скачать',
    pauseQueue: 'Пауза',
    resumeQueue: 'Продолжить',
    clearCompleted: 'Очистить завершенные',
    globalSettings: 'Общие настройки',
    downloadSettings: 'Настройки загрузки',
    customSettings: 'Индивидуальные настройки',
    resolution: 'Разрешение',
    framerate: 'Частота кадров',
    vcodec: 'Видео кодек',
    acodec: 'Аудио кодек',
    container: 'Контейнер',
    bestAvailable: 'Лучшее',
    highestAvailable: 'Максимальная',
    bestFormat: 'Лучший',
    audioOnly: 'Только аудио',
    videoAudio: 'Видео + Аудио',
    downloading: 'Загрузка...',
    completed: 'Завершено',
    error: 'Ошибка',
    historyEmpty: 'История загрузок пуста.',
    play: 'Воспроизвести',
    openFolder: 'Открыть папку',
    share: 'Поделиться',
    info: 'Информация',
    version: 'Версия',
    aboutDesc: 'Мощный, минималистичный загрузчик видео.',
    lang: 'Язык',
    theme: 'Тема',
    defaultFolder: 'Папка по умолчанию',
    select: 'Выбрать',
    sysTheme: 'Системная',
    lightTheme: 'Светлая',
    darkTheme: 'Тёмная',
    dragDropTitle: 'Перетащите ссылки сюда',
    dragDropDesc: 'Перетащите ссылки на видео прямо в это окно или вставьте их в поле выше.',
    github: 'GitHub',
    coffee: 'Угостить кофе'
  }
};

const CryptoItem = ({ name, address }: { name: string, address: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-4 mb-3 last:mb-0 bg-secondary-container/30 p-3 rounded-xl">
       <span className="font-bold w-12 text-left">{name}</span>
       <span className="font-mono text-xs text-outline truncate flex-1 text-left">{address}</span>
       <button onClick={handleCopy} className="p-2 bg-surface-container hover:bg-primary hover:text-on-primary rounded-lg transition-colors" title="Copy">
          {copied ? <Check size={16} /> : <Copy size={16} />}
       </button>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [inputUrls, setInputUrls] = useState('');
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const [globalSettings, setGlobalSettings] = useState({
    resolution: 'best',
    fps: 'best',
    vcodec: 'best',
    acodec: 'best',
    container: 'mp4',
    isAudioOnly: false
  });

  const [settings, setSettings] = useState({
    outputDir: '',
    language: 'ru' as 'en' | 'ru',
    theme: 'system' as AppTheme,
    accent: '#65558f'
  });

  const [history, setHistory] = useState<any[]>([]);
  const [infoModal, setInfoModal] = useState<any>(null);
  const [showCrypto, setShowCrypto] = useState(false);

  const t = dictionaries[settings.language];

  const queueRef = useRef(queue);
  const isQueueRunningRef = useRef(isQueueRunning);
  const globalSettingsRef = useRef(globalSettings);
  const outputDirRef = useRef(settings.outputDir);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { isQueueRunningRef.current = isQueueRunning; }, [isQueueRunning]);
  useEffect(() => { globalSettingsRef.current = globalSettings; }, [globalSettings]);
  useEffect(() => { outputDirRef.current = settings.outputDir; }, [settings.outputDir]);

  const loadHistory = () => {
    const h = localStorage.getItem('md_history');
    if (h) setHistory(JSON.parse(h));
  };

  useEffect(() => {
    const s = localStorage.getItem('md_settings');
    if (s) {
      setSettings(prev => ({ ...prev, ...JSON.parse(s) }));
    } else {
      window.electronAPI?.getDefaultDownloadPath().then(p => {
        const newSettings = { ...settings, outputDir: p };
        setSettings(newSettings);
        localStorage.setItem('md_settings', JSON.stringify(newSettings));
      });
    }
    loadHistory();
    window.addEventListener('history-updated', loadHistory);
    return () => window.removeEventListener('history-updated', loadHistory);
  }, []);

  useEffect(() => {
    localStorage.setItem('md_settings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--primary', settings.accent);
    
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else if (settings.theme === 'light') document.documentElement.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.onDownloadProgress((data) => {
      setQueue(q => q.map(item => item.id === data.id ? { ...item, progress: data.progress } : item));
    });
  }, []);

  // Fetch Worker (runs independently, fetches video info one by one)
  useEffect(() => {
    let active = true;
    const fetchWorker = async () => {
      while (active) {
        const q = queueRef.current;
        const nextFetch = q.find(i => i.status === 'idle');
        
        if (nextFetch) {
          setQueue(prev => prev.map(i => i.id === nextFetch.id ? { ...i, status: 'fetching' } : i));
          try {
            const res = await window.electronAPI?.getVideoInfo(nextFetch.url);
            setQueue(prev => prev.map(i => i.id === nextFetch.id ? { 
              ...i, 
              status: res?.success ? 'ready' : 'error', 
              info: res?.success ? res.data : undefined, 
              error: res?.error 
            } : i));
          } catch (e) {
            setQueue(prev => prev.map(i => i.id === nextFetch.id ? { ...i, status: 'error', error: 'Failed' } : i));
          }
        } else {
          await new Promise(r => setTimeout(r, 300));
        }
      }
    };
    fetchWorker();
    return () => { active = false; };
  }, []);

  const triggerDownload = async (item: QueueItem) => {
    setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'downloading', progress: 0 } : i));
    
    const isAudio = item.settings ? item.isAudioOnly : globalSettingsRef.current.isAudioOnly;
    const s = item.settings || globalSettingsRef.current;
    
    const customOptions: any = {};
    if (isAudio) {
      customOptions.extractAudio = true;
      customOptions.audioFormat = s.acodec === 'best' ? 'mp3' : s.acodec;
      customOptions.format = 'bestaudio/best';
    } else {
      const formatSortArgs = [];
      if (s.resolution !== 'best') formatSortArgs.push(`res:${s.resolution}`);
      if (s.fps !== 'best') formatSortArgs.push(`fps:${s.fps}`);
      if (s.vcodec !== 'best') formatSortArgs.push(`vcodec:${s.vcodec}`);
      if (s.acodec !== 'best') formatSortArgs.push(`acodec:${s.acodec}`);
      if (formatSortArgs.length > 0) customOptions.formatSort = formatSortArgs.join(',');
      customOptions.mergeOutputFormat = s.container;
    }
    
    const res = await window.electronAPI?.startDownload(item.id, item.url, outputDirRef.current, customOptions);
    
    if (res && res.success && res.fullPath) {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i));
      const h = JSON.parse(localStorage.getItem('md_history') || '[]');
      h.unshift({ title: item.info?.title || 'Video', url: item.url, date: new Date().toISOString(), fullPath: res.fullPath });
      localStorage.setItem('md_history', JSON.stringify(h.slice(0, 50)));
      window.dispatchEvent(new Event('history-updated'));
    } else {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: res?.error || 'Failed' } : i));
    }
  };

  // Download Worker (runs when queue is active)
  useEffect(() => {
    let active = true;
    const downloadWorker = async () => {
      while (active) {
        const q = queueRef.current;
        const isDownloading = q.some(i => i.status === 'downloading');
        
        if (isQueueRunningRef.current && !isDownloading) {
          const nextDownload = q.find(i => i.status === 'ready');
          if (nextDownload) {
            await triggerDownload(nextDownload);
            continue; // Go to next item immediately
          } else {
            // Auto-pause if nothing is ready and nothing is pending
            if (!q.some(i => i.status === 'idle' || i.status === 'fetching')) {
              setIsQueueRunning(false);
            }
          }
        }
        await new Promise(r => setTimeout(r, 500));
      }
    };
    downloadWorker();
    return () => { active = false; };
  }, []);

  const handleAddLinks = () => {
    // Split by any whitespace, allowing nice multi-line/space separated lists
    const urls = inputUrls.split(/\s+/).map(u => u.trim()).filter(u => /^https?:\/\//i.test(u));
    if (urls.length === 0) return;
    
    const newItems = urls.map((url, idx) => ({
      id: Date.now() + '_' + idx,
      url,
      status: 'idle' as const,
      progress: 0,
      settings: null,
      isAudioOnly: globalSettings.isAudioOnly
    }));
    
    setQueue(q => [...q, ...newItems]);
    setInputUrls('');
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data && /^https?:\/\//i.test(data)) {
      setInputUrls(prev => prev ? prev + '\n' + data : data);
      if (activeTab !== 'home') setActiveTab('home');
    }
  };

  const handleShare = async (itemUrl: string) => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Video', url: itemUrl }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(itemUrl);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };

  const clearCompleted = () => setQueue(q => q.filter(i => i.status !== 'completed'));

  const navItems = [
    { id: 'home', icon: Home, label: t.navDownload },
    { id: 'history', icon: History, label: t.navHistory },
    { id: 'settings', icon: Settings, label: t.navSettings },
    { id: 'about', icon: Info, label: t.navAbout }
  ];
  const activeIndex = navItems.findIndex(i => i.id === activeTab);
  
  const isSingle = queue.length === 1;
  const hasCompleted = queue.some(i => i.status === 'completed');

  const renderSettingsParams = (s: any, onChange: (key: string, val: any) => void, isAudioOnly: boolean, onAudioChange: (val: boolean) => void) => (
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="col-span-2 mb-2">
        <label className="text-xs font-semibold text-outline uppercase mb-2 block">Format Type</label>
        <div className="flex bg-secondary-container/30 p-1 rounded-xl">
          <button onClick={() => onAudioChange(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!isAudioOnly ? 'bg-surface shadow-sm' : 'hover:bg-surface/50 text-outline'}`}>{t.videoAudio}</button>
          <button onClick={() => onAudioChange(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isAudioOnly ? 'bg-surface shadow-sm' : 'hover:bg-surface/50 text-outline'}`}>{t.audioOnly}</button>
        </div>
      </div>
      
      {!isAudioOnly && (
        <>
          <div>
            <label className="text-xs font-semibold text-outline uppercase mb-1 block">{t.resolution}</label>
            <select value={s.resolution} onChange={e => onChange('resolution', e.target.value)} className="w-full bg-secondary-container/50 border border-outline/20 rounded-lg p-2 outline-none">
              <option value="best">{t.bestAvailable}</option>
              <option value="2160">4K (2160p)</option>
              <option value="1440">1440p</option>
              <option value="1080">1080p</option>
              <option value="720">720p</option>
              <option value="480">480p</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-outline uppercase mb-1 block">{t.framerate}</label>
            <select value={s.fps} onChange={e => onChange('fps', e.target.value)} className="w-full bg-secondary-container/50 border border-outline/20 rounded-lg p-2 outline-none">
              <option value="best">{t.highestAvailable}</option>
              <option value="60">Max 60 FPS</option>
              <option value="30">Max 30 FPS</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-outline uppercase mb-1 block">{t.vcodec}</label>
            <select value={s.vcodec} onChange={e => onChange('vcodec', e.target.value)} className="w-full bg-secondary-container/50 border border-outline/20 rounded-lg p-2 outline-none">
              <option value="best">{t.bestFormat}</option>
              <option value="h264">H.264</option>
              <option value="vp9">VP9</option>
              <option value="av1">AV1</option>
            </select>
          </div>
        </>
      )}
      
      <div>
        <label className="text-xs font-semibold text-outline uppercase mb-1 block">{t.acodec}</label>
        <select value={s.acodec} onChange={e => onChange('acodec', e.target.value)} className="w-full bg-secondary-container/50 border border-outline/20 rounded-lg p-2 outline-none">
          <option value="best">{t.bestFormat}</option>
          <option value="m4a">M4A (AAC)</option>
          <option value="opus">Opus</option>
          <option value="mp3">MP3</option>
        </select>
      </div>
      
      {!isAudioOnly && (
        <div>
          <label className="text-xs font-semibold text-outline uppercase mb-1 block">{t.container}</label>
          <select value={s.container} onChange={e => onChange('container', e.target.value)} className="w-full bg-secondary-container/50 border border-outline/20 rounded-lg p-2 outline-none">
            <option value="mp4">MP4</option>
            <option value="mkv">MKV</option>
            <option value="webm">WebM</option>
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-surface dark:bg-surface text-on-secondary-container transition-colors duration-300">
      <nav className="w-64 flex flex-col p-4 bg-surface-dim/30 border-r border-outline/10 app-region-drag pt-8">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2 app-region-no-drag">
          <div className="bg-primary text-on-primary p-2 rounded-xl"><Download size={22} /></div>
          <h1 className="text-lg font-bold tracking-tight">Master Downloader</h1>
        </div>
        <div className="flex flex-col flex-1 app-region-no-drag relative">
          <div className="absolute left-0 right-0 h-12 bg-primary-container rounded-2xl transition-transform duration-[400ms] ease-out z-0" style={{ transform: `translateY(${activeIndex * 56}px)`, opacity: activeIndex === -1 ? 0 : 1 }} />
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 h-12 mb-2 rounded-2xl transition-colors font-medium relative z-10 ${activeTab === item.id ? 'text-on-primary-container' : 'hover:bg-surface-dim/50 text-outline'}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto app-region-no-drag p-8 pt-12" onDrop={handleDrop} onDragOver={handleDragOver}>
        <div className="max-w-4xl mx-auto w-full">
          {activeTab === 'home' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2">
              
              <div className="bg-secondary-container/30 border border-outline/10 rounded-[28px] p-2 flex flex-col shadow-sm">
                <div className="flex items-start">
                  <LinkIcon size={20} className="ml-4 mt-4 text-primary" />
                  <textarea 
                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-lg placeholder:text-outline resize-none min-h-[56px] max-h-48 overflow-y-auto" 
                    placeholder={t.pastePlaceholder} 
                    value={inputUrls} 
                    onChange={(e) => setInputUrls(e.target.value)}
                    rows={inputUrls.split('\n').length > 1 ? Math.min(5, inputUrls.split('\n').length) : 1}
                  />
                  {inputUrls && <button onClick={() => setInputUrls('')} className="p-4 text-outline"><X size={20} /></button>}
                </div>
                <div className="flex justify-end p-2 border-t border-outline/10">
                  <button onClick={handleAddLinks} disabled={!inputUrls.trim()} className="bg-primary text-on-primary px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"><ListPlus size={18} /> {t.addQueue}</button>
                </div>
              </div>

              {queue.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-outline border-2 border-dashed border-outline/20 rounded-3xl mt-4">
                  <div className="bg-surface-dim p-6 rounded-full mb-6">
                    <Download size={48} className="opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">{t.dragDropTitle}</h3>
                  <p className="text-center max-w-sm">{t.dragDropDesc}</p>
                </div>
              )}

              {queue.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col bg-surface-dim p-6 rounded-3xl border border-outline/10 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="font-bold text-xl">{isSingle ? t.downloadSettings : t.globalSettings}</h3>
                      </div>
                      <div className="flex gap-2">
                        {isQueueRunning ? (
                          <button onClick={() => setIsQueueRunning(false)} className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl font-medium flex items-center gap-2"><Pause size={18} /> {t.pauseQueue}</button>
                        ) : (
                          <button onClick={() => setIsQueueRunning(true)} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-medium flex items-center gap-2"><PlayIcon size={18} /> {queue.some(i => i.status === 'ready' || i.status === 'idle') ? (queue.some(i => i.status === 'downloading') ? t.resumeQueue : (isSingle ? t.downloadSingle : t.downloadAll)) : (isSingle ? t.downloadSingle : t.downloadAll)}</button>
                        )}
                        {hasCompleted && <button onClick={clearCompleted} className="bg-surface-container border border-outline/20 px-4 py-2 rounded-xl font-medium">{t.clearCompleted}</button>}
                      </div>
                    </div>
                    
                    {renderSettingsParams(globalSettings, (k, v) => setGlobalSettings(s => ({...s, [k]: v})), globalSettings.isAudioOnly, (val) => setGlobalSettings(s => ({...s, isAudioOnly: val})))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {queue.map(item => (
                      <div key={item.id} className={`bg-surface-container rounded-3xl p-4 border border-outline/10 flex flex-col gap-3 shadow-sm transition-all ${item.status === 'fetching' ? 'animate-pulse bg-surface-dim/50' : 'hover:shadow-md'}`}>
                        <div className="flex items-center gap-4">
                          {item.info?.thumbnail ? (
                            <img src={item.info.thumbnail} className="w-24 h-16 object-cover rounded-xl bg-black/10" />
                          ) : (
                            <div className="w-24 h-16 rounded-xl bg-surface-dim flex items-center justify-center text-outline overflow-hidden relative">
                              {item.status === 'fetching' ? (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] animate-pulse" />
                                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin relative z-10" />
                                </>
                              ) : <Download size={24} />}
                            </div>
                          )}
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-semibold truncate text-lg">{item.info?.title || item.url}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${item.status === 'completed' ? 'bg-green-500/10 text-green-600' : item.status === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-secondary-container text-on-secondary-container'}`}>
                                {item.status === 'fetching' ? t.fetching : item.status}
                              </span>
                              {item.status === 'downloading' && <span className="text-sm font-bold text-primary">{item.progress.toFixed(1)}%</span>}
                              {item.error && <span className="text-xs text-red-500 truncate">{item.error}</span>}
                            </div>
                            {item.status === 'downloading' && (
                              <div className="w-full h-2 bg-secondary-container rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${item.progress}%` }} />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mr-2">
                            {item.status === 'ready' && !isSingle && (
                              <button onClick={() => triggerDownload(item)} className="p-3 hover:bg-primary/10 text-primary rounded-full transition-colors" title={t.navDownload}>
                                <Download size={22} />
                              </button>
                            )}
                            {item.status !== 'downloading' && item.status !== 'completed' && item.status !== 'fetching' && !isSingle && (
                              <button onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)} className="p-3 hover:bg-surface-dim rounded-full transition-colors text-outline hover:text-on-surface" title={t.customSettings}>
                                {expandedItemId === item.id ? <ChevronUp size={22} /> : <Settings size={22} />}
                              </button>
                            )}
                            <button onClick={() => setQueue(q => q.filter(i => i.id !== item.id))} className="p-3 hover:bg-red-500/10 text-outline hover:text-red-500 rounded-full transition-colors"><Trash2 size={22} /></button>
                          </div>
                        </div>
                        
                        {expandedItemId === item.id && (
                          <div className="border-t border-outline/10 pt-4 mt-2 px-2 pb-2 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-bold text-lg">{t.customSettings}</span>
                              <div className="flex items-center gap-2 bg-surface-dim px-4 py-2 rounded-full">
                                <input type="checkbox" id={`custom-${item.id}`} className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" checked={!!item.settings} onChange={(e) => {
                                  if (e.target.checked) setQueue(q => q.map(i => i.id === item.id ? { ...i, settings: { ...globalSettings }, isAudioOnly: globalSettings.isAudioOnly } : i));
                                  else setQueue(q => q.map(i => i.id === item.id ? { ...i, settings: null } : i));
                                }} />
                                <label htmlFor={`custom-${item.id}`} className="text-sm font-medium cursor-pointer">Enable Custom Settings</label>
                              </div>
                            </div>
                            {item.settings && (
                              <>
                                {renderSettingsParams(item.settings, (k, v) => setQueue(q => q.map(i => i.id === item.id ? { ...i, settings: { ...i.settings!, [k]: v } } : i)), item.isAudioOnly || false, (val) => setQueue(q => q.map(i => i.id === item.id ? { ...i, isAudioOnly: val } : i)))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-3xl font-semibold tracking-tight mb-8">{t.navHistory}</h2>
              {history.length === 0 ? (
                <div className="text-center py-12 text-outline flex flex-col items-center"><History size={48} className="mb-4 opacity-50" /><p>{t.historyEmpty}</p></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((item, i) => (
                    <div key={i} className="bg-surface-container rounded-2xl p-4 border border-outline/10 flex items-center gap-4 hover:shadow-sm transition-shadow group">
                      <div className="flex-1 overflow-hidden cursor-pointer" onClick={() => setInfoModal(item)}>
                        <h4 className="font-medium truncate">{item.title}</h4>
                        <p className="text-xs text-outline truncate mt-0.5">{new Date(item.date).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.fullPath && (
                          <>
                            <button title={t.play} onClick={async (e) => { e.stopPropagation(); const res = await window.electronAPI?.openPath(item.fullPath); if (res && !res.success) alert('Failed: ' + res.error); }} className="p-2 hover:bg-surface-dim rounded-full transition-colors z-10 relative app-region-no-drag cursor-pointer"><Play size={18} /></button>
                            <button title={t.openFolder} onClick={async (e) => { e.stopPropagation(); try { await window.electronAPI?.showInFolder(item.fullPath); } catch (err) {} }} className="p-2 hover:bg-surface-dim rounded-full transition-colors z-10 relative app-region-no-drag cursor-pointer"><FolderOpen size={18} /></button>
                          </>
                        )}
                        <button title={t.share} onClick={async (e) => { e.stopPropagation(); await handleShare(item.url); }} className="p-2 hover:bg-surface-dim rounded-full transition-colors z-10 relative app-region-no-drag cursor-pointer"><Share2 size={18} /></button>
                        <button title={t.info} onClick={(e) => { e.stopPropagation(); setInfoModal(item); }} className="p-2 hover:bg-surface-dim rounded-full transition-colors z-10 relative app-region-no-drag cursor-pointer"><Info size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-3xl font-semibold tracking-tight mb-8">{t.navSettings}</h2>
              <div className="flex flex-col gap-6">
                <div className="bg-surface-container rounded-3xl p-6 border border-outline/10">
                  <h3 className="font-semibold text-lg mb-4">{t.lang}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setSettings({...settings, language: 'en'})} className={`px-6 py-2 rounded-full font-medium transition-colors ${settings.language === 'en' ? 'bg-primary text-on-primary' : 'hover:bg-surface-dim'}`}>English</button>
                    <button onClick={() => setSettings({...settings, language: 'ru'})} className={`px-6 py-2 rounded-full font-medium transition-colors ${settings.language === 'ru' ? 'bg-primary text-on-primary' : 'hover:bg-surface-dim'}`}>Русский</button>
                  </div>
                </div>
                
                <div className="bg-surface-container rounded-3xl p-6 border border-outline/10">
                  <h3 className="font-semibold text-lg mb-4">{t.defaultFolder}</h3>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={settings.outputDir} className="flex-1 bg-secondary-container/50 border border-outline/20 rounded-xl px-4 py-2 outline-none" />
                    <button onClick={async () => { const p = await window.electronAPI?.selectFolder(); if(p) setSettings({...settings, outputDir: p}); }} className="bg-primary text-on-primary px-6 py-2 rounded-xl font-medium">{t.select}</button>
                  </div>
                </div>
                
                <div className="bg-surface-container rounded-3xl p-6 border border-outline/10">
                  <h3 className="font-semibold text-lg mb-4">{t.theme}</h3>
                  <div className="flex flex-col gap-6">
                    <div className="flex gap-2 bg-secondary-container/30 p-1 rounded-full w-fit">
                      <button onClick={() => setSettings({...settings, theme: 'system'})} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${settings.theme === 'system' ? 'bg-surface-container shadow-sm' : 'hover:bg-surface/50'}`}>{t.sysTheme}</button>
                      <button onClick={() => setSettings({...settings, theme: 'light'})} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${settings.theme === 'light' ? 'bg-surface-container shadow-sm' : 'hover:bg-surface/50'}`}>{t.lightTheme}</button>
                      <button onClick={() => setSettings({...settings, theme: 'dark'})} className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${settings.theme === 'dark' ? 'bg-surface-container shadow-sm' : 'hover:bg-surface/50'}`}>{t.darkTheme}</button>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-3">Accent Color</label>
                      <div className="flex gap-3">
                        {['#65558f', '#8f556d', '#558f6b', '#828f55', '#557c8f'].map(c => (
                          <button key={c} onClick={() => setSettings({...settings, accent: c})} className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: settings.accent === c ? 'var(--on-surface)' : 'transparent' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
              <h2 className="text-3xl font-semibold tracking-tight mb-8">{t.navAbout}</h2>
              <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
                <div className="bg-primary text-on-primary p-4 rounded-3xl mb-4"><Download size={48} /></div>
                <h3 className="text-2xl font-bold">Master Downloader</h3>
                <p className="text-outline mt-2 max-w-sm">{t.aboutDesc}</p>
                <p className="text-sm font-medium mt-6 bg-surface-container px-4 py-2 rounded-full border border-outline/10 mb-8">{t.version} 1.1 (Queue Edition)</p>
                
                <div className="flex gap-4">
                   <button onClick={() => window.open('https://github.com/Forkee4ik', '_blank')} className="flex items-center gap-2 bg-surface-container border border-outline/20 px-6 py-3 rounded-xl font-medium hover:bg-surface-dim transition-colors">
                     <GitBranch size={20} /> {t.github}
                   </button>
                   <button onClick={() => setShowCrypto(!showCrypto)} className="flex items-center gap-2 bg-[#FFDD00] text-black px-6 py-3 rounded-xl font-medium hover:brightness-95 transition-all">
                     <Coffee size={20} /> {t.coffee}
                   </button>
                </div>

                {showCrypto && (
                  <div className="mt-8 bg-surface-container border border-outline/10 p-6 rounded-3xl w-full max-w-md animate-in slide-in-from-top-4">
                     <CryptoItem name="BTC" address="bc1q04xzpn2fuele942h8qqud0gfxfxmhk4553sygy" />
                     <CryptoItem name="ETH" address="0xb927aaEb5Ca83306507E100D45f1950919D07C60" />
                     <CryptoItem name="SOL" address="578kKGEahG9xbSXjKPwYtMQubSFXLmjE6aSnye7cZv7T" />
                     <CryptoItem name="BSC" address="0xb927aaEb5Ca83306507E100D45f1950919D07C60" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {infoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 app-region-no-drag" onClick={() => setInfoModal(null)}>
          <div className="bg-surface-container w-full max-w-md rounded-[28px] p-6 shadow-xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl">{t.info}</h3>
              <button onClick={() => setInfoModal(null)} className="p-2 bg-surface-dim hover:bg-outline/20 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <div><span className="font-semibold text-outline">Title:</span> <p className="font-medium break-words">{infoModal.title}</p></div>
              <div><span className="font-semibold text-outline">URL:</span> <a href={infoModal.url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-words">{infoModal.url}</a></div>
              <div><span className="font-semibold text-outline">Date:</span> <p>{new Date(infoModal.date).toLocaleString()}</p></div>
              {infoModal.fullPath && <div><span className="font-semibold text-outline">Location:</span> <p className="font-mono text-xs mt-1 bg-surface-dim p-2 rounded-lg break-all select-text">{infoModal.fullPath}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
