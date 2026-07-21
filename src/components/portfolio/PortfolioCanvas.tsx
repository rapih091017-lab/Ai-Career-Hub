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
import type { SectionId, ThemeDefinition, ThemeColors } from "./types";
import { THEMES, DEFAULT_THEME_ID } from "./themes";

/* ─── Context ─── */

const ThemeContext = createContext<ThemeDefinition>(THEMES[DEFAULT_THEME_ID]);
export { ThemeContext };
export const usePortfolioTheme = () => useContext(ThemeContext);

/** Provides section-scoped theme override for per-section colors */

interface OrderContextType {
  sectionOrder: SectionId[];
  setSectionOrder: (order: SectionId[]) => void;
  sectionConfigs: Record<SectionId, { id: SectionId; label: string; icon: string; visible: boolean }>;
  toggleSection: (id: SectionId) => void;
}

const OrderContext = createContext<OrderContextType | null>(null);
export const useSectionOrder = () => useContext(OrderContext)!;

/* ─── Section-scoped Theme Provider ─── */

function SectionThemeProvider({ sectionId, children }: { sectionId: SectionId; children: React.ReactNode }) {
  const theme = usePortfolioTheme();
  const sectionColor = theme.sectionColors?.[sectionId];

  if (!sectionColor) return <>{children}</>;

  // Merge section colors into full theme
  const mergedTheme: ThemeDefinition = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: sectionColor.primary || theme.colors.primary,
      accent: sectionColor.accent || theme.colors.accent,
      primaryGlow: sectionColor.primaryGlow || theme.colors.primaryGlow,
    },
  };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ─── Sortable Section Wrapper ─── */

function SortableSection({ id, children, isSelected, onSelect }: {
  id: SectionId;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
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
        style={{ color: "var(--p-text-muted, #666)" }}
        aria-label="Drag untuk urutkan"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </button>

      {/* Click to select for editing */}
      <div
        onClick={onSelect}
        className={`transition-all duration-200 rounded-xl ${
          isSelected ? "ring-2 ring-offset-2" : ""
        }`}
        style={{
          "--tw-ring-color": theme.colors.primary,
          "--tw-ring-offset-color": theme.colors.bg,
          cursor: "pointer",
        } as React.CSSProperties}
      >
        <SectionThemeProvider sectionId={id}>
          {children}
        </SectionThemeProvider>
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
  testimonials: { label: "Testimoni", icon: "format_quote" },
  contact: { label: "Kontak", icon: "contact_support" },
};

/* ─── MAIN COMPONENT ─── */

type FontSize = "small" | "medium" | "large";

interface PortfolioCanvasProps {
  themeId: string;
  sectionOrder: SectionId[];
  onSectionOrderChange: (order: SectionId[]) => void;
  sectionVisibility: Record<SectionId, boolean>;
  onToggleSection: (id: SectionId) => void;
  selectedSection: SectionId | null;
  onSelectSection: (id: SectionId | null) => void;
  fontSize?: FontSize;
  children: React.ReactNode;
}

const FONT_SIZE_MAP: Record<string, { base: string; small: string; h2: string; h3: string }> = {
  small: { base: "14px", small: "12px", h2: "1.25rem", h3: "1.05rem" },
  medium: { base: "16px", small: "13px", h2: "1.5rem", h3: "1.15rem" },
  large: { base: "18px", small: "14px", h2: "1.75rem", h3: "1.3rem" },
};

export default function PortfolioCanvas({
  themeId,
  sectionOrder,
  onSectionOrderChange,
  sectionVisibility,
  onToggleSection,
  selectedSection,
  onSelectSection,
  fontSize = "medium",
  children,
}: PortfolioCanvasProps) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const [activeId, setActiveId] = React.useState<SectionId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleSections = sectionOrder.filter(id => sectionVisibility[id]);
  const fm = FONT_SIZE_MAP[fontSize];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = visibleSections.indexOf(active.id as SectionId);
      const newIndex = visibleSections.indexOf(over.id as SectionId);
      const newOrder = [...visibleSections];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as SectionId);

      const hidden = sectionOrder.filter(id => !sectionVisibility[id]);
      const result: SectionId[] = [];
      let vi = 0;
      for (const sid of sectionOrder) {
        if (sectionVisibility[sid]) {
          result.push(newOrder[vi++]);
        } else {
          result.push(sid);
        }
      }
      onSectionOrderChange(result);
    }
  };

  const sectionConfigs = Object.fromEntries(
    Object.entries(SECTION_META).map(([id, meta]) => [
      id,
      { id: id as SectionId, ...meta, visible: sectionVisibility[id as SectionId] },
    ])
  ) as Record<SectionId, { id: SectionId; label: string; icon: string; visible: boolean }>;

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
            "--p-font-size-base": fm.base,
            "--p-font-size-sm": fm.small,
            "--p-font-size-h2": fm.h2,
            "--p-font-size-h3": fm.h3,
            fontSize: fm.base,
          } as React.CSSProperties}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as SectionId)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={visibleSections} strategy={verticalListSortingStrategy}>
              <div className="relative">
                {React.Children.map(children, (child) => {
                  if (!React.isValidElement(child)) return null;
                  // @ts-expect-error - data-section-id is a custom prop
                  const sectionId = child.props["data-section-id"] as SectionId;
                  if (!sectionId || !sectionVisibility[sectionId]) return null;
                  return (
                    <SortableSection
                      id={sectionId}
                      isSelected={selectedSection === sectionId}
                      onSelect={() => onSelectSection(selectedSection === sectionId ? null : sectionId)}
                    >
                      {child}
                    </SortableSection>
                  );
                })}
              </div>
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
            &copy; 2026. Dibuat dengan MyCivi AI Career Hub
          </footer>
        </div>
      </OrderContext.Provider>
    </ThemeContext.Provider>
  );
}
