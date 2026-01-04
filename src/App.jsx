import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from 'react';
import { 
  Home, 
  Calendar as CalendarIcon, 
  Skull, 
  Settings, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Upload, // Novo ícone
  Moon, 
  Sun,
  TrendingUp,
  Award,
  Share2
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

/* ==================================================================================
   1. DATA LAYER (src/data/)
   ================================================================================== */

// Frases Gerais
const QUOTES_DB = [
  { text: "A felicidade da sua vida depende da qualidade dos seus pensamentos.", author: "Marco Aurélio" },
  { text: "Não estrague o que você tem desejando o que não tem.", author: "Epicuro" },
  { text: "Aquele que tem um 'porquê' para viver pode suportar quase qualquer 'como'.", author: "Nietzsche" },
  { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
  { text: "Aja como se o que você faz fizesse diferença. Faz.", author: "William James" },
  { text: "No meio da dificuldade encontra-se a oportunidade.", author: "Albert Einstein" },
  { text: "O homem que remove uma montanha começa carregando pequenas pedras.", author: "Provérbio Chinês" },
  { text: "A vida é 10% o que acontece comigo e 90% de como eu reajo a isso.", author: "Charles Swindoll" },
  { text: "A simplicidade é o último grau de sofisticação.", author: "Leonardo da Vinci" },
  { text: "O que não nos mata nos torna mais fortes.", author: "Nietzsche" }
];

// Frases Estoicas para o Memento Mori
const STOIC_QUOTES = [
  { text: "Você poderia deixar a vida agora mesmo. Deixe que isso determine o que você faz, diz e pensa.", author: "Marco Aurélio" },
  { text: "Não é que tenhamos pouco tempo, mas desperdiçamos muito.", author: "Sêneca" },
  { text: "Sofremos mais na imaginação do que na realidade.", author: "Sêneca" },
  { text: "A morte sorri para todos nós; tudo o que um homem pode fazer é sorrir de volta.", author: "Marco Aurélio" },
  { text: "Nenhum homem é livre se não for mestre de si mesmo.", author: "Epicteto" },
  { text: "Lembre-se de que você vai morrer. Isso não é um convite ao desespero, mas à vida.", author: "Estoicismo" }
];

// Configuração de Humores (Adicionado HEX para o Canvas)
const MOODS_CONFIG = {
  'A': { score: 5, color: 'bg-emerald-500', text: 'bg-emerald-100', label: 'Incrível', icon: '😄', hex: '#10b981' },
  'B': { score: 4, color: 'bg-teal-400', text: 'bg-teal-100', label: 'Bom', icon: '🙂', hex: '#2dd4bf' },
  'C': { score: 3, color: 'bg-blue-400', text: 'bg-blue-100', label: 'Normal', icon: '😐', hex: '#60a5fa' },
  'D': { score: 2, color: 'bg-indigo-400', text: 'bg-indigo-100', label: 'Cansado', icon: '😴', hex: '#818cf8' },
  'E': { score: 1, color: 'bg-rose-400', text: 'bg-rose-100', label: 'Mal', icon: '😫', hex: '#fb7185' },
  'F': { score: 0, color: 'bg-slate-400', text: 'bg-slate-100', label: 'Terrível', icon: '💀', hex: '#94a3b8' },
};

const DEFAULT_TAGS = ["Trabalho", "Família", "Treino", "Estudos", "Lazer", "Sono", "Saúde"];

/* ==================================================================================
   2. SERVICE LAYER (src/services/)
   ================================================================================== */

const getSeedFromDate = () => {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
};

const getQuote = (db = QUOTES_DB) => {
  const seed = getSeedFromDate();
  const index = seed % db.length;
  return db[index];
};

const formatDateKey = (date) => {
  return date.toISOString().split('T')[0];
};

const calculateLifeWeeks = (birthDateString, maxYears = 80) => {
  if (!birthDateString) return { lived: 0, total: maxYears * 52 };
  
  const birth = new Date(birthDateString);
  const now = new Date();
  const diffTime = Math.abs(now - birth);
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)); 
  
  return {
    lived: diffWeeks,
    total: maxYears * 52
  };
};

const calculateStreak = (entries) => {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDateKey(d);
    
    if (entries[key]) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
};

// Calcula estatísticas do mês atual (Nota e Contagem)
const calculateMonthStats = (entries) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    
    let totalScore = 0;
    let count = 0;
    
    Object.entries(entries).forEach(([key, value]) => {
      const [entryYear, entryMonth] = key.split('-').map(Number);
      // Ajuste: key month é 1-12, js month é 0-11
      if (entryYear === year && entryMonth === (month + 1)) {
        totalScore += MOODS_CONFIG[value.mood].score;
        count++;
      }
    });
  
    const average = count === 0 ? 0 : totalScore / count;
    
    // Converter média para Nota
    let grade = '-';
    if (count > 0) {
      if (average >= 4.5) grade = 'A+';
      else if (average >= 4.0) grade = 'A';
      else if (average >= 3.0) grade = 'B';
      else if (average >= 2.0) grade = 'C';
      else if (average >= 1.0) grade = 'D';
      else grade = 'F';
    }
  
    return { count, grade, average };
};

// Geração de Imagem com Tema e Legenda
const generateShareImage = async (entries, userName, isDark) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 1000; // Mais alto para caber a legenda
    canvas.width = width;
    canvas.height = height;

    // Cores baseadas no tema
    const bgColor = isDark ? '#0f172a' : '#f8fafc'; // slate-900 vs slate-50
    const textColor = isDark ? '#ffffff' : '#1e293b'; // white vs slate-800
    const subTextColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 vs slate-500
    const emptyCellColor = isDark ? '#1e293b' : '#e2e8f0'; // slate-800 vs slate-200

    // Fundo
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Título
    ctx.fillStyle = textColor;
    ctx.font = 'bold 40px sans-serif';
    const now = new Date();
    const title = `Humor de ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
    ctx.textAlign = 'center';
    ctx.fillText(title.charAt(0).toUpperCase() + title.slice(1), width / 2, 80);
    
    ctx.font = '24px sans-serif';
    ctx.fillStyle = subTextColor;
    ctx.fillText(`@${userName}`, width / 2, 120);

    // Grid do Calendário
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay(); // 0 = Dom

    const startX = 100;
    const startY = 200;
    const cellSize = 80;
    const gap = 10;
    
    // Cabeçalho dias
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = subTextColor;
    weekDays.forEach((day, i) => {
        ctx.fillText(day, startX + (i * (cellSize + gap)) + cellSize/2, startY - 20);
    });

    // Dias
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const key = formatDateKey(d);
        const entry = entries[key];
        
        const col = (firstDay + i - 1) % 7;
        const row = Math.floor((firstDay + i - 1) / 7);
        const x = startX + (col * (cellSize + gap));
        const y = startY + (row * (cellSize + gap));

        // Cor do dia
        ctx.fillStyle = entry ? MOODS_CONFIG[entry.mood].hex : emptyCellColor;
        
        // Desenha quadrado arredondado
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 16);
        ctx.fill();

        // Número do dia
        ctx.fillStyle = entry ? '#ffffff' : subTextColor;
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(i, x + cellSize/2, y + cellSize/2 + 8);
    }

    // LEGENDA (Parte nova)
    const legendStartY = 800; // Posição Y da legenda
    ctx.textAlign = 'left';
    
    // Título da Legenda
    ctx.fillStyle = textColor;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText("Legenda:", startX, legendStartY);

    let legendX = startX;
    let legendY = legendStartY + 40;
    const legendGap = 110;

    // Desenhar itens da legenda
    Object.entries(MOODS_CONFIG).forEach(([key, config]) => {
        // Bolinha da cor
        ctx.fillStyle = config.hex;
        ctx.beginPath();
        ctx.arc(legendX + 15, legendY, 15, 0, 2 * Math.PI);
        ctx.fill();

        // Texto
        ctx.fillStyle = subTextColor;
        ctx.font = '16px sans-serif';
        ctx.fillText(config.label, legendX + 40, legendY + 5);

        legendX += legendGap;
        // Quebra de linha se necessário (opcional para telas pequenas, mas canvas é fixo)
        if (legendX > width - 100) {
            legendX = startX;
            legendY += 50;
        }
    });

    // Rodapé
    ctx.fillStyle = '#10b981'; // emerald-500
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Gerado por Stats Of Mind", width / 2, height - 40);

    return new Promise(resolve => {
        canvas.toBlob(blob => {
            resolve(new File([blob], 'meu-mes.png', { type: 'image/png' }));
        });
    });
};

// src/services/storage.js
const STORAGE_KEY_DATA = 'mood_tracker_data_v2';
const STORAGE_KEY_SETTINGS = 'mood_tracker_settings_v2';

const StorageService = {
  loadData: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DATA);
      return data ? JSON.parse(data) : {};
    } catch (e) { console.error(e); return {}; }
  },
  
  saveData: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
    } catch (e) { console.error(e); }
  },

  loadSettings: () => {
    try {
      const settings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return settings ? JSON.parse(settings) : { 
        theme: 'dark', 
        birthDate: '1990-01-01',
        userName: 'Viajante'
      };
    } catch (e) { return {}; }
  },

  saveSettings: (settings) => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }
};

/* ==================================================================================
   3. CONTEXT LAYER (src/context/)
   ================================================================================== */

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [entries, setEntries] = useState(StorageService.loadData());
  const [settings, setSettings] = useState(StorageService.loadSettings());
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    StorageService.saveData(entries);
  }, [entries]);

  useEffect(() => {
    StorageService.saveSettings(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const addEntry = (dateKey, data) => {
    setEntries(prev => ({ ...prev, [dateKey]: data }));
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ entries, settings }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mood_tracker_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Função para Importar Dados
  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData.entries) setEntries(importedData.entries);
        if (importedData.settings) setSettings(importedData.settings);
        alert('Dados importados com sucesso!');
      } catch (e) {
        alert('Erro ao ler arquivo de backup. Certifique-se que é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AppContext.Provider value={{ entries, addEntry, settings, setSettings, view, setView, exportData, importData }}>
      {children}
    </AppContext.Provider>
  );
};

/* ==================================================================================
   4. SHARED COMPONENTS (src/components/shared/)
   ================================================================================== */

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-3 rounded-2xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600",
    secondary: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title }) => (
  <div className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 ${className}`}>
    {title && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>}
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ==================================================================================
   5. FEATURE COMPONENTS
   ================================================================================== */

const MoodEntryModal = ({ isOpen, onClose, dateKey }) => {
  const { entries, addEntry } = useContext(AppContext);
  const existingEntry = entries[dateKey];
  
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const data = existingEntry || {};
      setMood(data.mood || null);
      setNote(data.note || '');
      setSelectedTags(data.tags || []);
    }
  }, [isOpen, dateKey, existingEntry]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (!mood) return;
    addEntry(dateKey, { mood, note, tags: selectedTags, timestamp: new Date().toISOString() });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Registro: ${dateKey}`}>
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-500 mb-2 block">Como você está?</label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(MOODS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setMood(key)}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1
                  ${mood === key 
                    ? `${config.color} border-transparent text-white scale-105 shadow-md` 
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
              >
                <span className="text-2xl">{config.icon}</span>
                <span className={`text-xs font-bold ${mood === key ? 'text-white' : 'text-slate-500'}`}>{config.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 mb-2 block">O que rolou?</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {DEFAULT_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors
                  ${selectedTags.includes(tag)
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <textarea
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none"
            placeholder="Escreva sobre seu dia..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={!mood} className="w-full">
          Salvar Registro
        </Button>
      </div>
    </Modal>
  );
};

/* ==================================================================================
   6. PAGE COMPONENTS
   ================================================================================== */

const Dashboard = () => {
  const { entries, settings, setView } = useContext(AppContext); // Adicionado setView
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayKey = formatDateKey(new Date());
  
  const quote = useMemo(() => getQuote(), []);
  const streak = useMemo(() => calculateStreak(entries), [entries]);
  const monthStats = useMemo(() => calculateMonthStats(entries), [entries]);
  const lifeProgress = useMemo(() => calculateLifeWeeks(settings.birthDate), [settings.birthDate]);

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for(let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = formatDateKey(d);
      const score = entries[k] ? MOODS_CONFIG[entries[k].mood].score : 0;
      data.push({ name: d.getDate(), score });
    }
    return data;
  }, [entries]);

  const hasLoggedToday = !!entries[todayKey];
  const lifePercentage = Math.round((lifeProgress.lived / lifeProgress.total) * 100);

  const handleShare = async () => {
    try {
        const isDark = settings.theme === 'dark';
        const file = await generateShareImage(entries, settings.userName, isDark);
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Meu Mês no Stats Of Mind',
                text: `Meu resumo do mês! Nota: ${monthStats.grade}`,
            });
        } else {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stats-of-mind-${formatDateKey(new Date())}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("Erro ao compartilhar", error);
        alert("Erro ao gerar imagem.");
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
            Olá, {settings.userName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1 text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
             <TrendingUp size={16} />
             <span>{streak} dias</span>
           </div>
           <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Sequência</span>
        </div>
      </div>

      {/* Quote Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <Award className="w-8 h-8 text-emerald-200 mb-4 opacity-80" />
        <p className="text-lg font-medium leading-relaxed mb-4">"{quote.text}"</p>
        <p className="text-sm text-emerald-100 font-semibold opacity-80">— {quote.author}</p>
      </div>

      {/* Stats Mini */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Tendência (7d)">
           <div className="h-20 w-full -ml-2 mb-2">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
           
           {/* Nova Seção: Nota do Mês e Contagem */}
           <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-3">
              <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Nota Mês</p>
                  <p className={`text-2xl font-bold ${monthStats.average >= 3 ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {monthStats.grade}
                  </p>
              </div>
              <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Registros</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {monthStats.count}
                  </p>
              </div>
           </div>
        </Card>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all group"
          >
            <div className="bg-white dark:bg-slate-600 p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
              {hasLoggedToday ? <span className="text-xl">{MOODS_CONFIG[entries[todayKey].mood].icon}</span> : <Plus className="w-5 h-5 text-emerald-500" />}
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {hasLoggedToday ? 'Editar' : 'Registrar'}
            </span>
          </button>

          <Button variant="secondary" onClick={handleShare} className="!py-2 !rounded-2xl !text-xs">
            <Share2 size={14} /> Compartilhar Imagem
          </Button>
        </div>
      </div>

      {/* Widget Memento Mori (Clicável) */}
      <div onClick={() => setView('memento')} className="cursor-pointer">
        <Card title="Vida Vivida (Toque para ver)" className="relative overflow-hidden hover:border-emerald-500 transition-colors group">
            <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-slate-800 dark:bg-slate-200 transition-all duration-1000 ease-out group-hover:bg-emerald-500"
                        style={{ width: `${lifePercentage}%` }}
                    ></div>
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-sm">{lifePercentage}%</span>
            </div>
        </Card>
      </div>

      <MoodEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dateKey={todayKey} />
    </div>
  );
};

const CalendarPage = () => {
  const { entries } = useContext(AppContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const renderDays = () => {
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    for (let i = 1; i <= days; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const key = formatDateKey(d);
      const entry = entries[key];
      const isToday = key === formatDateKey(new Date());

      daysArray.push(
        <button
          key={key}
          onClick={() => setSelectedDate(key)}
          className={`aspect-square rounded-xl flex items-center justify-center relative transition-all active:scale-90
            ${isToday ? 'border-2 border-slate-800 dark:border-white' : ''}
            ${entry ? MOODS_CONFIG[entry.mood].color : 'bg-slate-100 dark:bg-slate-800'}`}
        >
          <span className={`text-xs font-medium z-10 ${entry ? 'text-white' : 'text-slate-400'}`}>{i}</span>
          {entry && <span className="absolute text-lg opacity-20">{MOODS_CONFIG[entry.mood].icon}</span>}
        </button>
      );
    }
    return daysArray;
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">{monthLabel}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" className="!p-2 !rounded-xl" onClick={prevMonth}><ChevronLeft size={20}/></Button>
          <Button variant="secondary" className="!p-2 !rounded-xl" onClick={nextMonth}><ChevronRight size={20}/></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <span key={`${d}-${i}`} className="text-xs font-bold text-slate-400">{d}</span>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {renderDays()}
      </div>

      {selectedDate && (
        <MoodEntryModal 
          isOpen={!!selectedDate} 
          onClose={() => setSelectedDate(null)} 
          dateKey={selectedDate} 
        />
      )}
    </div>
  );
};

const MementoPage = () => {
  const { settings } = useContext(AppContext);
  const { lived, total } = useMemo(() => calculateLifeWeeks(settings.birthDate), [settings.birthDate]);
  
  // Frase Estoica Aleatória
  const stoicQuote = useMemo(() => getQuote(STOIC_QUOTES), []);

  const totalWeeks = 80 * 52;
  const percentage = Math.round((lived / totalWeeks) * 100);

  return (
    <div className="pb-24 space-y-4 h-full flex flex-col">
      {/* Frase Estoica Adicionada */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shrink-0">
        <h2 className="text-2xl font-bold mb-2">Memento Mori</h2>
        <p className="text-slate-400 text-sm mb-4">
          <span className="text-emerald-400 font-bold">{percentage}%</span> da vida estimada vivida.
        </p>
        <div className="pt-4 border-t border-slate-700">
            <p className="text-xs italic text-slate-300">"{stoicQuote.text}"</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">— {stoicQuote.author}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-3xl p-3 border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col items-center justify-center">
        <div 
          className="grid grid-cols-[repeat(52,1fr)] gap-[1px] w-full max-w-[400px] aspect-[52/80]"
          style={{ width: '100%', height: 'auto' }}
        >
          {Array.from({ length: totalWeeks }).map((_, i) => {
             const isLived = i < lived;
             const isCurrent = i === lived;
             return (
               <div 
                 key={i}
                 className={`rounded-[0.5px] w-full h-full
                   ${isCurrent ? 'bg-emerald-500 animate-pulse scale-150 z-10' : 
                     isLived ? 'bg-slate-800 dark:bg-slate-500' : 'bg-slate-200 dark:bg-slate-700'
                   }
                 `}
               />
             );
          })}
        </div>
      </div>
      <p className="text-center text-[10px] text-slate-400 italic shrink-0">1 ponto = 1 semana de vida (80 anos)</p>
    </div>
  );
};

const SettingsPage = () => {
  const { settings, setSettings, exportData, importData } = useContext(AppContext);
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      importData(file);
    }
  };

  return (
    <div className="pb-24 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h2>
      
      <Card title="Preferências">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <span className="text-slate-700 dark:text-slate-300 font-medium">Modo Escuro</span>
             <button 
               onClick={() => handleChange('theme', settings.theme === 'dark' ? 'light' : 'dark')}
               className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-200 flex justify-center items-center"
             >
               {settings.theme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}
             </button>
          </div>
          <hr className="border-slate-100 dark:border-slate-700"/>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Seu Nome</label>
            <input 
              type="text" 
              value={settings.userName}
              onChange={(e) => handleChange('userName', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </Card>

      <Card title="Vida (Memento Mori)">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Data de Nascimento</label>
          <input 
            type="date" 
            value={settings.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </Card>

      <Card title="Dados">
        <div className="space-y-3">
            <Button variant="secondary" onClick={exportData} className="w-full">
              <Download size={18} /> Exportar Backup JSON
            </Button>
            
            {/* Input Invisível para Importação */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                style={{ display: 'none' }} 
            />
            
            <Button variant="secondary" onClick={handleImportClick} className="w-full">
              <Upload size={18} /> Importar Backup JSON
            </Button>
        </div>
      </Card>
      
      <div className="text-center text-xs text-slate-400 mt-8">
        Stat Of Mind v2.3 • Atualizado
      </div>
    </div>
  );
};

/* ==================================================================================
   7. MAIN LAYOUT & NAV
   ================================================================================== */

const BottomNav = () => {
  const { view, setView } = useContext(AppContext);
  
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Hoje' },
    { id: 'calendar', icon: CalendarIcon, label: 'Diário' },
    { id: 'memento', icon: Skull, label: 'Vida' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-16 px-6">
        {navItems.map(item => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center w-14 transition-all duration-300
                ${isActive ? 'text-emerald-500 -translate-y-1' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
            >
              <item.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`mb-1 transition-all ${isActive ? 'scale-110' : 'scale-100'}`}
              />
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  );
};

/* ==================================================================================
   8. APP ENTRY POINT
   ================================================================================== */

const AppContent = () => {
  const { view } = useContext(AppContext);

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <CalendarPage />;
      case 'memento': return <MementoPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900">
      <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col">
        <main className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          {renderView()}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
