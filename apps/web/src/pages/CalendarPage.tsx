import React, { useEffect, useMemo } from 'react';
import { useCalendarStore } from '../stores/calendar-store.js';
import {
  CalendarToolbar,
  CalendarWeekView,
  CalendarDayView,
  CalendarMonthView,
  CalendarBottomDock,
  ScheduleLearningBlockModal
} from '../components/calendar/index.js';
import { SOSCard } from '../components/ui/SOSCard.js';

export const CalendarPage: React.FC = () => {
  const {
    blocks,
    summary,
    viewMode,
    selectedBlockId,
    isModalOpen,
    editingBlock,
    initialSlot,
    loadBlocks,
    selectBlock,
    openCreateModal,
    openEditModal,
    closeModal,
    createBlock,
    updateBlock,
    deleteBlock
  } = useCalendarStore();

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  // Selected block lookup
  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [selectedBlockId, blocks]);

  return (
    <div
      data-testid="calendar-view"
      onClick={() => {
        // Deselect when clicking outside blocks
        if (selectedBlockId) {
          selectBlock(null);
        }
      }}
      className="flex-1 flex flex-col items-center justify-center p-4 md:p-5 overflow-hidden w-full h-full relative bg-[#080808] select-none"
    >
      <h1 className="sr-only">Academic Calendar • Learning Calendar</h1>

      {/* Elevated Cohesive Large Rounded Container (SOSCard SSoT) */}
      <SOSCard
        onClick={(e) => {
          // If clicking container backdrop directly, deselect
          if (e.target === e.currentTarget && selectedBlockId) {
            selectBlock(null);
          }
        }}
        className="w-full h-full max-w-[1360px] rounded-2xl flex flex-col shadow-sm relative animate-tier-1"
      >
        {/* 1. CALENDAR TOOLBAR */}
        <CalendarToolbar onNewEvent={() => openCreateModal()} />

        {/* 2. CALENDAR ACTIVE VIEW STAGE (Day, Week, Month) */}
        <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
          {viewMode === 'day' && (
            <CalendarDayView
              onSelectBlock={(id) => selectBlock(id)}
              onOpenCreateModal={(slot) => openCreateModal(slot)}
              onEditBlock={(block) => openEditModal(block)}
              onDeleteBlock={async (id, scope) => {
                await deleteBlock(id, scope);
              }}
            />
          )}

          {viewMode === 'week' && (
            <CalendarWeekView
              onSelectBlock={(id) => selectBlock(id)}
              onOpenCreateModal={(slot) => openCreateModal(slot)}
              onEditBlock={(block) => openEditModal(block)}
              onDeleteBlock={async (id, scope) => {
                await deleteBlock(id, scope);
              }}
            />
          )}

          {viewMode === 'month' && (
            <CalendarMonthView
              onSelectBlock={(id) => selectBlock(id)}
              onOpenCreateModal={(slot) => openCreateModal(slot)}
            />
          )}

          {/* 3. PERSISTENT BOTTOM BAR (Dual-State: State A Default / State B Block Inspector) */}
          <CalendarBottomDock
            summary={summary}
            selectedBlock={selectedBlock}
            onEditBlock={(block) => openEditModal(block)}
            onDeleteBlock={async (id) => {
              await deleteBlock(id);
            }}
          />
        </div>
      </SOSCard>

      {/* 4. SCHEDULE / EDIT LEARNING BLOCK MODAL */}
      {isModalOpen && (
        <ScheduleLearningBlockModal
          editingBlock={editingBlock}
          initialSlot={initialSlot}
          onClose={closeModal}
          onSave={async (params) => {
            if (editingBlock) {
              await updateBlock(editingBlock.id, params);
            } else {
              await createBlock(params);
            }
          }}
        />
      )}
    </div>
  );
};
