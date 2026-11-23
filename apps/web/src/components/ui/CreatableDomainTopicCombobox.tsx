import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import type { UserDomainContract, UserTopicContract } from '@sos/contracts';

export interface CreatableDomainTopicComboboxProps {
  selectedDomainName?: string;
  selectedTopicName?: string;
  onSelectDomain: (domainId: string | null, domainName: string) => void;
  onSelectTopic?: (topicId: string | null, topicName: string) => void;
  className?: string;
}

export const CreatableDomainTopicCombobox: React.FC<CreatableDomainTopicComboboxProps> = ({
  selectedDomainName = '',
  selectedTopicName = '',
  onSelectDomain,
  onSelectTopic,
  className = ''
}) => {
  const [isDomainOpen, setIsDomainOpen] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [domainInput, setDomainInput] = useState(selectedDomainName);
  const [topicInput, setTopicInput] = useState(selectedTopicName);
  const [domains, setDomains] = useState<UserDomainContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const domainContainerRef = useRef<HTMLDivElement>(null);
  const topicContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDomainInput(selectedDomainName);
  }, [selectedDomainName]);

  useEffect(() => {
    setTopicInput(selectedTopicName);
  }, [selectedTopicName]);

  const fetchDomains = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/domains');
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
      }
    } catch (err) {
      console.warn('Failed to fetch domains:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        domainContainerRef.current &&
        !domainContainerRef.current.contains(e.target as Node)
      ) {
        setIsDomainOpen(false);
      }
      if (
        topicContainerRef.current &&
        !topicContainerRef.current.contains(e.target as Node)
      ) {
        setIsTopicOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateDomain = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (res.ok) {
        const createdDomain: UserDomainContract = await res.json();
        setDomains((prev) => {
          const exists = prev.some((d) => d.id === createdDomain.id);
          return exists ? prev : [...prev, createdDomain];
        });
        onSelectDomain(createdDomain.id, createdDomain.name);
        setDomainInput(createdDomain.name);
        setIsDomainOpen(false);
      }
    } catch (err) {
      console.warn('Failed to create domain:', err);
    }
  };

  const handleCreateTopic = async (domainId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !onSelectTopic) return;
    try {
      const res = await fetch(`/api/domains/${domainId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (res.ok) {
        const createdTopic: UserTopicContract = await res.json();
        setDomains((prev) =>
          prev.map((d) => {
            if (d.id === domainId) {
              return { ...d, topics: [...(d.topics || []), createdTopic] };
            }
            return d;
          })
        );
        onSelectTopic(createdTopic.id, createdTopic.name);
        setTopicInput(createdTopic.name);
        setIsTopicOpen(false);
      }
    } catch (err) {
      console.warn('Failed to create topic:', err);
    }
  };

  // Domain search filter
  const dQuery = domainInput.trim().toLowerCase();
  const filteredDomains = domains.filter((d) =>
    dQuery ? d.name.toLowerCase().includes(dQuery) : true
  );
  const exactDomainMatch = domains.some((d) => d.name.toLowerCase() === dQuery);

  // Current domain object
  const currentDomainObj = domains.find(
    (d) => d.name.toLowerCase() === selectedDomainName.trim().toLowerCase()
  );

  // Available topics for selected domain
  const availableTopics = currentDomainObj?.topics || [];
  const tQuery = topicInput.trim().toLowerCase();
  const filteredTopics = availableTopics.filter((t) =>
    tQuery ? t.name.toLowerCase().includes(tQuery) : true
  );
  const exactTopicMatch = availableTopics.some(
    (t) => t.name.toLowerCase() === tQuery
  );

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {/* 1. DOMAIN FIELD */}
      <div
        ref={domainContainerRef}
        data-testid="domain-topic-combobox-btn"
        className="relative flex flex-col gap-1.5"
      >
        <span className="sr-only">{selectedDomainName}</span>
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium select-none">
          Domain
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            data-testid="domain-input"
            value={domainInput}
            onChange={(e) => {
              setDomainInput(e.target.value);
              setIsDomainOpen(true);
            }}
            onFocus={() => {
              setIsDomainOpen(true);
              setIsTopicOpen(false);
              fetchDomains();
            }}
            onClick={() => {
              setIsDomainOpen(true);
              setIsTopicOpen(false);
            }}
            placeholder="Select or type domain..."
            className="w-full h-10 bg-[#161619] border border-white/[0.08] focus:border-white/25 rounded-lg pl-3 pr-9 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setIsDomainOpen(!isDomainOpen);
              setIsTopicOpen(false);
              if (!isDomainOpen) fetchDomains();
            }}
            className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Absolute floating monochrome dropdown (z-50) */}
        {isDomainOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto bg-[#161619] border border-white/[0.1] rounded-lg p-1 shadow-2xl custom-scrollbar">
            {/* Create Domain Option (at top) */}
            {domainInput.trim() && !exactDomainMatch && (
              <button
                type="button"
                onClick={() => handleCreateDomain(domainInput.trim())}
                className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-md text-sm text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer border-b border-white/[0.06]"
              >
                <Plus className="w-4 h-4 text-zinc-400" />
                <span>
                  Create <span className="font-semibold text-white">"{domainInput.trim()}"</span>
                </span>
              </button>
            )}

            {filteredDomains.map((d) => {
              const isSelected =
                selectedDomainName.toLowerCase() === d.name.toLowerCase();
              return (
                <button
                  key={d.id}
                  type="button"
                  data-testid={`domain-option-${d.id}`}
                  onClick={() => {
                    onSelectDomain(d.id, d.name);
                    setDomainInput(d.name);
                    setIsDomainOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer text-left transition-colors ${
                    isSelected
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="truncate">{d.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-zinc-200 shrink-0" />}
                </button>
              );
            })}

            {!isLoading && filteredDomains.length === 0 && !domainInput.trim() && (
              <div className="py-3 text-center text-xs text-zinc-500">
                No domains found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. TOPIC FIELD (OPTIONAL) */}
      <div
        ref={topicContainerRef}
        data-testid="topic-combobox-btn"
        className="relative flex flex-col gap-1.5"
      >
        <span className="sr-only">{selectedTopicName}</span>
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium select-none">
          Topic (Optional)
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            data-testid="topic-input"
            value={topicInput}
            onChange={(e) => {
              setTopicInput(e.target.value);
              setIsTopicOpen(true);
            }}
            onFocus={() => {
              setIsTopicOpen(true);
              setIsDomainOpen(false);
            }}
            onClick={() => {
              setIsTopicOpen(true);
              setIsDomainOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const trimmed = topicInput.trim();
                if (!trimmed) return;
                if (currentDomainObj) {
                  handleCreateTopic(currentDomainObj.id, trimmed);
                } else if (onSelectTopic) {
                  onSelectTopic(null, trimmed);
                  setIsTopicOpen(false);
                }
              }
            }}
            placeholder="Select or type topic..."
            className="w-full h-10 bg-[#161619] border border-white/[0.08] focus:border-white/25 rounded-lg pl-3 pr-9 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setIsTopicOpen(!isTopicOpen);
              setIsDomainOpen(false);
            }}
            className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Absolute floating monochrome dropdown (z-50) */}
        {isTopicOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto bg-[#161619] border border-white/[0.1] rounded-lg p-1 shadow-2xl custom-scrollbar">
            {/* Create Topic Option (at top) */}
            {topicInput.trim() && !exactTopicMatch && (
              <button
                type="button"
                onClick={() => {
                  const trimmed = topicInput.trim();
                  if (currentDomainObj) {
                    handleCreateTopic(currentDomainObj.id, trimmed);
                  } else if (onSelectTopic) {
                    onSelectTopic(null, trimmed);
                    setIsTopicOpen(false);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-md text-sm text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer border-b border-white/[0.06]"
              >
                <Plus className="w-4 h-4 text-zinc-400" />
                <span>
                  Create <span className="font-semibold text-white">"{topicInput.trim()}"</span>
                </span>
              </button>
            )}

            {/* Clear Topic Option if set */}
            {selectedTopicName && (
              <button
                type="button"
                onClick={() => {
                  if (onSelectTopic) onSelectTopic(null, '');
                  setTopicInput('');
                  setIsTopicOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                Clear Topic
              </button>
            )}

            {filteredTopics.map((topic) => {
              const isSelected =
                selectedTopicName.toLowerCase() === topic.name.toLowerCase();
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    if (onSelectTopic) onSelectTopic(topic.id, topic.name);
                    setTopicInput(topic.name);
                    setIsTopicOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer text-left transition-colors ${
                    isSelected
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="truncate">{topic.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-zinc-200 shrink-0" />}
                </button>
              );
            })}

            {filteredTopics.length === 0 && !topicInput.trim() && (
              <div className="py-3 text-center text-xs text-zinc-500">
                {currentDomainObj ? 'No topics found. Type to create one.' : 'Select a domain or type to set topic.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
