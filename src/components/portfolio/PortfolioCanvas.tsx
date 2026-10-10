"use client";

import React, { createContext, useContext } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import type { FontSize, PortfolioData, SectionConfig, SectionId, SectionVisibility, ThemeDefinition } from "./types";
import { isSectionVisible, resolveVisibility } from "./sectionVisibility";
import { SECTION_IDS } from "./types";
import { THEMES, DEFAULT_THEME_ID } from "./themes";
import type { ThemeId } from "./types";
import PortfolioDocument from "./render/PortfolioDocument";

/* ─── Context ─── */

const ThemeContext = createContext<ThemeDefinition>(THEMES[DEFAULT_THEME_ID]);
export { ThemeContext };
export const usePortfolioTheme = () => useContext(ThemeContext);

interface OrderContextType {
  sectionOrder: SectionId[];
  setSectionOrder: (order: SectionId[]) => void;
  sectionConfigs: Record<SectionId, SectionConfig>;
  toggleSection: (id: SectionId) => void;
}

const OrderContext = createContext<OrderContextType | null>(null);
export const useSectionOrder = () => useContext(OrderContext)!;

/* ─── Sortable Section Wrapper ─── */

function SortableSection({ id, children, isSelected }: {
  id: SectionId;
  children: React.ReactNode;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const theme = usePortfolioTheme();
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/section relative">
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover/section:opacity-100 transition-opacity p-1 rounded cursor-grab active:cursor-grabbing"
        style={{ color: "var(--p-text-secondary, #4a4452)" }}
        aria-label="Drag untuk urutkan"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </button>

      {/* Selection ring; klik section ditangani onSectionClick dari PortfolioDocument */}
      <div
        className={`transition-all duration-200 rounded-xl ${
          isSelected ? "ring-2 ring-offset-2" : ""
        }`}
        style={{
          "--tw-ring-color": theme.colors.primary,
          "--tw-ring-offset-color": theme.colors.bg,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Active Drag Overlay ─── */

function DragOverlayContent({ id }: { id: SectionId }) {
  const ctx = useSectionOrder();
  const config = ctx?.sectionConfigs[id];
  const theme = usePortfolioTheme();

  return (
    <div
      className="p-4 rounded-xl shadow-2xl"
      style={{
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.primary}`,
        width: 280,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-lg" style={{ color: theme.colors.primary }}>
          {config?.icon || "drag_indicator"}
        </span>
        <span className="font-semibold text-sm" style={{ color: theme.colors.text }}>
          {config?.label || id}
        </span>
      </div>
    </div>
  );
}

/* ─── SECTION INFO ─── */

export const SECTION_META: Record<SectionId, { label: string; icon: string }> = {
  hero: { label: "Hero & Branding", icon: "palette" },
  about: { label: "Tentang Saya", icon: "person" },
  stats: { label: "Statistik", icon: "bar_chart" },
  experience: { label: "Pengalaman", icon: "work" },
  education: { label: "Pendidikan", icon: "school" },
  projects: { label: "Project", icon: "folder" },
  skills: { label: "Keahlian", icon: "stars" },
  certifications: { label: "Sertifikat", icon: "workspace_premium" },
  organizations: { label: "Organisasi", icon: "groups" },
  hobbies: { label: "Hobi & Minat", icon: "favorite" },
  testimonials: { label: "Testimoni", icon: "format_quote" },
  contact: { label: "Kontak", icon: "contact_support" },
};

/* ─── MAIN COMPONENT ─── */

export interface PortfolioCanvasProps {
  themeId: string;
  data: PortfolioData;
  sectionOrder: SectionId[];
  onSectionOrderChange: (order: SectionId[]) => void;
  sectionVisibility: SectionVisibility;
  onToggleSection: (id: SectionId) => void;
  selectedSection: SectionId | null;
  onSelectSection: (id: SectionId | null) => void;
  fontSize?: FontSize;
  sectionStyle?: Partial<Record<SectionId, CSSProperties>>;
}

export default function PortfolioCanvas({
  themeId,
  data,
  sectionOrder,
  onSectionOrderChange,
  sectionVisibility,
  onToggleSection,
  selectedSection,
  onSelectSection,
  fontSize = "medium",
  sectionStyle,
}: PortfolioCanvasProps) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const [activeId, setActiveId] = React.useState<SectionId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleSections = resolveVisibility(sectionOrder, sectionVisibility);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = visibleSections.indexOf(active.id as SectionId);
      const newIndex = visibleSections.indexOf(over.id as SectionId);
      const newOrder = [...visibleSections];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as SectionId);

      const result: SectionId[] = [];
      let vi = 0;
      for (const sid of sectionOrder) {
        if (isSectionVisible(sectionVisibility, sid)) {
          result.push(newOrder[vi++]);
        } else {
          result.push(sid);
        }
      }
      onSectionOrderChange(result);
    }
  };

  const sectionConfigs = Object.fromEntries(
    SECTION_IDS.map((id) => [
      id,
      { id, ...SECTION_META[id], visible: isSectionVisible(sectionVisibility, id) },
    ])
  ) as Record<SectionId, SectionConfig>;

  return (
    <ThemeContext.Provider value={theme}>
      <OrderContext.Provider value={{
        sectionOrder,
        setSectionOrder: onSectionOrderChange,
        sectionConfigs,
        toggleSection: onToggleSection,
      }}>
        <div
          className="min-h-screen"
          style={{
            backgroundColor: theme.colors.bg,
            color: theme.colors.text,
            fontFamily: theme.font.includes(" ") ? `'${theme.font}', sans-serif` : `${theme.font}, sans-serif`,
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as SectionId)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={visibleSections} strategy={verticalListSortingStrategy}>
              <PortfolioDocument
                data={data}
                themeId={themeId as ThemeId}
                mode="editor"
                sectionOrder={sectionOrder}
                sectionVisibility={sectionVisibility}
                fontSize={fontSize}
                sectionStyle={sectionStyle}
                onSectionClick={(id) => onSelectSection(selectedSection === id ? null : id)}
                sectionWrapper={(id, node) => (
                  <SortableSection id={id} isSelected={selectedSection === id}>
                    {node}
                  </SortableSection>
                )}
              />
            </SortableContext>

            <DragOverlay>
              {activeId ? <DragOverlayContent id={activeId} /> : null}
            </DragOverlay>
          </DndContext>

          {/* Footer */}
          <footer
            className="text-center py-8"
            style={{ color: theme.colors.textMuted, borderTop: `1px solid ${theme.colors.border}`, fontSize: "var(--p-font-size-sm, 13px)" }}
          >
            &copy; {new Date().getFullYear()}. Dibuat dengan AI Career Hub
          </footer>
        </div>
      </OrderContext.Provider>
    </ThemeContext.Provider>
  );
}
