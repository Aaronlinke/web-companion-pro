import React from 'react';
import { Plus, X } from 'lucide-react';

export interface Tab {
  id: number;
  title: string;
  code: string;
  history: string[];
  historyIndex: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: number;
  onSelectTab: (id: number) => void;
  onCloseTab: (id: number) => void;
  onAddTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
}) => {
  return (
    <div className="flex items-center gap-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className={`group flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
            activeTabId === tab.id
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <span className="truncate max-w-[100px]">{tab.title}</span>
          {tabs.length > 1 && (
            <X
              size={10}
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0"
            />
          )}
        </button>
      ))}
      <button
        onClick={onAddTab}
        className="p-1 text-muted-foreground hover:text-primary transition-colors"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};