import React, { useState, useMemo, useCallback } from 'react';
import { Code2, Play, FileCode, Bot, Download, RotateCcw, RotateCw } from 'lucide-react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Preview } from '@/components/editor/Preview';
import { TabBar, Tab } from '@/components/editor/TabBar';
import { AiWorkbench, AGENTS, ChatMessage, Agent } from '@/components/ai/AiWorkbench';

const initialCode = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>ELITE_SYSTEM_V3</title>
</head>
<body class="bg-[#020617] text-sky-400 min-h-screen flex items-center justify-center p-4 font-mono">
  <div class="w-full max-w-2xl border border-sky-500/30 bg-slate-950/80 backdrop-blur-xl p-8 shadow-[0_0_50px_rgba(0,132,255,0.2)]">
    <div class="flex justify-between items-center mb-8 border-b border-sky-500/20 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 bg-sky-500 animate-ping rounded-full"></div>
        <h1 class="text-sm uppercase tracking-[0.5em] font-black text-sky-500">Elite_Kernel_Active</h1>
      </div>
      <span class="text-[10px] text-sky-900 font-bold">CORE_LOAD_STABLE</span>
    </div>
    <div class="space-y-6">
      <div class="p-6 bg-black/50 border border-sky-900/50 rounded-sm">
        <p class="text-xs text-sky-600 leading-relaxed uppercase tracking-tighter">
          > System-Direktive: Maximaler Funktionserhalt.<br>
          > Logik-Zensur: Deaktiviert.<br>
          > Daten-Integrität: 100% Priorität.
        </p>
      </div>
      <div class="flex gap-3">
        <button onclick="console.log('ELITE_CMD_INIT')" class="flex-1 border border-sky-500/40 bg-sky-500/5 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-sky-500/20 hover:border-sky-500 transition-all">Execute_Primary</button>
        <button onclick="document.body.style.filter='hue-rotate(90deg)'" class="flex-1 border border-sky-500/40 bg-sky-500/5 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-sky-500/20 hover:border-sky-500 transition-all">Shift_Spectrum</button>
      </div>
    </div>
  </div>
</body>
</html>`;

const Index: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{
    id: 1,
    title: 'nexus_core.html',
    code: initialCode,
    history: [initialCode],
    historyIndex: 0
  }]);
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const [nextTabId, setNextTabId] = useState(2);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview' | 'ai'>('editor');

  const activeTab = useMemo(() => tabs.find(tab => tab.id === activeTabId), [tabs, activeTabId]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<string[]>(Array(AGENTS.length).fill('ready'));
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const updateActiveTabCode = useCallback((newCode: string, addToHistory: boolean = true) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId) {
        if (!addToHistory) return { ...tab, code: newCode };
        if (newCode === tab.code) return tab;

        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(newCode);
        if (newHistory.length > 100) newHistory.shift();

        return {
          ...tab,
          code: newCode,
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      }
      return tab;
    }));
  }, [activeTabId]);

  const handleUndo = useCallback(() => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId && tab.historyIndex > 0) {
        const newIndex = tab.historyIndex - 1;
        return { ...tab, code: tab.history[newIndex], historyIndex: newIndex };
      }
      return tab;
    }));
  }, [activeTabId]);

  const handleRedo = useCallback(() => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId && tab.historyIndex < tab.history.length - 1) {
        const newIndex = tab.historyIndex + 1;
        return { ...tab, code: tab.history[newIndex], historyIndex: newIndex };
      }
      return tab;
    }));
  }, [activeTabId]);

  const handleApplyCode = (codeToApply: string, replace: boolean = true) => {
    if (!activeTab) return;
    const extracted = codeToApply.match(/```(?:html)?\n([\s\S]+?)```/)?.[1] || codeToApply;
    updateActiveTabCode(extracted);
  };

  // Mock AI functions (will need Lovable Cloud for real AI)
  const runAiCollaboration = async (agents: Agent[]) => {
    if (!activeTab) return;
    setIsProcessing(true);
    setAgentLogs(['LOCKING_BASE_LOGIC...']);

    for (let i = 0; i < agents.length; i++) {
      const agentIndex = AGENTS.findIndex(a => a.name === agents[i].name);
      setAgentStatuses(prev => { const s = [...prev]; s[agentIndex] = 'thinking'; return s; });
      setAgentLogs(prev => [...prev, `Elite_Worker_${agents[i].name}_Processing...`]);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAgentStatuses(prev => { const s = [...prev]; s[agentIndex] = 'done'; return s; });
    }
    
    setAgentLogs(prev => [...prev, 'SYNTHESIS_COMPLETE.']);
    setIsProcessing(false);
    
    // Reset statuses after delay
    setTimeout(() => {
      setAgentStatuses(Array(AGENTS.length).fill('ready'));
    }, 2000);
  };

  const runAiFusion = async () => {
    setIsProcessing(true);
    setIsFusing(true);
    setAgentLogs(['INIT_DEEP_MERGE...']);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newTab: Tab = {
      id: nextTabId,
      title: 'MASTER_SYNTHESIS.html',
      code: '<!-- FUSED_CONTENT -->\n' + tabs.map(t => `<!-- From: ${t.title} -->\n${t.code}`).join('\n\n'),
      history: [''],
      historyIndex: 0
    };
    newTab.history = [newTab.code];
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(prev => prev + 1);
    setAgentLogs(prev => [...prev, 'SYNTHESIS_STABLE_100.']);
    
    setIsFusing(false);
    setIsProcessing(false);
  };

  const handleSendMessage = async (message: string) => {
    if (!activeTab) return;
    setIsProcessing(true);
    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setChatMessages(prev => [...prev, {
      sender: 'ai',
      text: `PROCESSING_COMMAND: "${message}"\n\nTo enable full AI capabilities, connect Lovable Cloud for backend processing.\n\nCurrent code analysis:\n- Lines: ${activeTab.code.split('\n').length}\n- Size: ${activeTab.code.length} bytes`
    }]);
    
    setIsProcessing(false);
  };

  const handleAddTab = () => {
    const t: Tab = {
      id: nextTabId,
      title: `ext_node_${nextTabId}.html`,
      code: '<!-- RAW_DATA_ENTRY -->',
      history: ['<!-- RAW_DATA_ENTRY -->'],
      historyIndex: 0
    };
    setTabs([...tabs, t]);
    setActiveTabId(nextTabId);
    setNextTabId(nextTabId + 1);
  };

  const handleCloseTab = (id: number) => {
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) return;
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
    setTabs(newTabs);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const newTab: Tab = {
          id: nextTabId,
          title: file.name,
          code: content,
          history: [content],
          historyIndex: 0
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(nextTabId);
        setNextTabId(nextTabId + 1);
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    if (activeTab) {
      const blob = new Blob([activeTab.code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeTab.title;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-elite-dark border-b border-primary/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 elite-border elite-glow">
            <Code2 size={16} className="text-primary" />
          </div>
          <h1 className="font-black text-[10px] elite-text-tracking text-primary hidden sm:block">
            Elite_Nexus_Runner
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <div className="flex items-center gap-1 bg-elite-black p-0.5 elite-border">
            <button
              onClick={handleUndo}
              disabled={(activeTab?.historyIndex || 0) <= 0}
              className="p-1.5 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-20 text-primary"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={(activeTab?.historyIndex || 0) >= (activeTab?.history.length || 0) - 1}
              className="p-1.5 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-20 text-primary"
            >
              <RotateCw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-secondary hover:bg-primary hover:text-primary-foreground p-1.5 elite-border transition-all">
              <FileCode size={16} />
              <input
                type="file"
                className="hidden"
                accept=".html,.htm"
                onChange={handleFileUpload}
              />
            </label>
            <button
              onClick={handleDownload}
              className="bg-secondary hover:bg-primary hover:text-primary-foreground p-1.5 elite-border transition-all"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:grid md:grid-cols-3">
        <div className="flex-1 flex flex-col md:col-span-2">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCloseTab={handleCloseTab}
            onAddTab={handleAddTab}
          />
          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 flex-col ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'} md:border-r md:border-primary/20`}>
              <CodeEditor
                value={activeTab?.code || ''}
                onChange={updateActiveTabCode}
              />
            </div>
            <div className={`flex-1 flex-col ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
              <Preview code={activeTab?.code || ''} />
            </div>
          </div>
        </div>
        <div className={`flex-1 flex-col ${mobileTab === 'ai' ? 'flex' : 'hidden md:flex'} bg-elite-dark border-t md:border-t-0 md:border-l border-primary/30`}>
          <AiWorkbench
            onStartCollaboration={runAiCollaboration}
            onStartFusion={runAiFusion}
            isProcessing={isProcessing}
            isFusing={isFusing}
            agentStatuses={agentStatuses}
            agentLogs={agentLogs}
            canFuse={tabs.length > 1}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            onApplyCode={handleApplyCode}
            projectTabs={tabs}
          />
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex bg-elite-dark border-t border-primary/30 shrink-0">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
            mobileTab === 'editor' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          }`}
        >
          <FileCode size={18} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Logic</span>
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
            mobileTab === 'preview' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          }`}
        >
          <Play size={18} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Execute</span>
        </button>
        <button
          onClick={() => setMobileTab('ai')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
            mobileTab === 'ai' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          }`}
        >
          <Bot size={18} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Synthesis</span>
        </button>
      </nav>
    </div>
  );
};

export default Index;
