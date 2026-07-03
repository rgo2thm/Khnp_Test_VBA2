/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UIElement, ControlEvent, ElementType } from './types';
import { predefinedTemplates } from './data/templates';
import PrdViewer from './components/PrdViewer';
import UiBuilder from './components/UiBuilder';
import LogicBuilder from './components/LogicBuilder';
import CodePreview from './components/CodePreview';
import ExcelSimulator from './components/ExcelSimulator';
import {
  FileText,
  Layers,
  Sparkles,
  Terminal,
  Play,
  RotateCcw,
  BookOpen,
  Info,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Cpu,
  Activity,
  Keyboard
} from 'lucide-react';

const INITIAL_FORM_ELEMENT: UIElement = {
  id: 'form_root',
  type: 'UserForm',
  name: 'UserForm1',
  caption: '사내 정보 등록기',
  text: '',
  left: 0,
  top: 0,
  width: 320,
  height: 280,
  foreColor: '#000000',
  backColor: '#F8FAFC',
  fontSize: 10,
  fontBold: false,
  value: '',
  placeholder: '',
  options: [],
  visible: true,
  enabled: true,
};

export default function App() {
  const [isPending, startTransition] = useTransition();
  // Navigation: PRD view vs. Interactive Builder view
  const [viewMode, setViewMode] = useState<'builder' | 'prd'>('builder');

  // Active Builder Tab (UI, Logic, Code, Sandbox)
  const [activeBuilderTab, setActiveBuilderTab] = useState<'ui' | 'logic' | 'code' | 'sandbox'>('ui');

  // Low-code Platform State
  const [elements, setElements] = useState<UIElement[]>([INITIAL_FORM_ELEMENT]);
  const [events, setEvents] = useState<ControlEvent[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>('form_root');
  const [activeTemplateId, setActiveTemplateId] = useState<string>('custom');

  // Load Preset Automation Template
  const handleLoadTemplate = (templateId: string) => {
    if (templateId === 'custom') {
      setElements([INITIAL_FORM_ELEMENT]);
      setEvents([]);
      setSelectedElementId('form_root');
      setActiveTemplateId('custom');
      return;
    }

    const template = predefinedTemplates.find((t) => t.id === templateId);
    if (template) {
      setElements(template.elements);
      setEvents(template.events);
      setSelectedElementId('form_root');
      setActiveTemplateId(templateId);
    }
  };

  // Add Element to Canvas
  const handleAddElement = (type: ElementType) => {
    const id = `el_${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-generate safe variable name
    const count = elements.filter((el) => el.type === type).length + 1;
    const name = `${type}${count}`;

    // Compute sane top position so items don't stack directly over each other
    const lastEl = elements[elements.length - 1];
    const top = lastEl && lastEl.type !== 'UserForm' ? Math.min(220, lastEl.top + 32) : 60;

    let newEl: UIElement = {
      id,
      type,
      name,
      caption: type === 'CommandButton' ? `단추 ${count}` : type === 'Label' ? `레이블 ${count}:` : type === 'Frame' ? `그룹 프레임 ${count}` : `${type} ${count}`,
      text: '',
      left: 30,
      top,
      width: type === 'CommandButton' ? 120 : type === 'Label' ? 100 : type === 'Frame' ? 240 : 160,
      height: type === 'CommandButton' ? 35 : type === 'Label' ? 20 : type === 'Frame' ? 100 : 25,
      foreColor: '#000000',
      backColor: type === 'CommandButton' ? '#E2E8F0' : type === 'TextBox' || type === 'ComboBox' ? '#FFFFFF' : '#F8FAFC',
      fontSize: 9,
      fontBold: type === 'CommandButton',
      value: '',
      placeholder: type === 'TextBox' ? '값을 입력하세요' : '',
      options: type === 'ComboBox' ? ['옵션1', '옵션2', '옵션3'] : [],
      visible: true,
      enabled: true,
    };

    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(id);
  };

  // Delete Element
  const handleDeleteElement = (id: string) => {
    if (id === 'form_root') return; // Cannot delete the main Form itself
    setElements((prev) => prev.filter((el) => el.id !== id));
    setEvents((prev) => prev.filter((evt) => evt.elementId !== id));
    setSelectedElementId('form_root');
  };

  // Update Element Properties
  const handleUpdateElement = (id: string, updates: Partial<UIElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Reset entire project to blank state
  const handleResetAll = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    setElements([INITIAL_FORM_ELEMENT]);
    setEvents([]);
    setSelectedElementId('form_root');
    setActiveTemplateId('custom');
    setShowResetConfirm(false);
  };

  return (
    <div className="h-screen bg-vba-bg text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-blue-600 selection:text-white" id="app_master_root">
      
      {/* 1. Global Enterprise Status Header (Professional Blue IDE style) */}
      <header className="h-14 border-b border-vba-border bg-vba-sidebar flex items-center justify-between px-6 z-50 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <span className="text-white font-bold text-xs">V</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-vba-text-dim">
                VISUAL VBA
              </h1>
              <span className="text-[10px] font-semibold text-vba-accent tracking-wider bg-blue-950/40 border border-blue-500/30 px-2 py-0.5 rounded animate-pulse">
                CLUB EDITION V1.0.4
              </span>
            </div>
          </div>
        </div>

        {/* Global Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('builder')}
            className={`px-4 py-1.5 transition-all text-sm font-semibold rounded-full flex items-center gap-2 cursor-pointer ${
              viewMode === 'builder'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-vba-text-dim hover:text-white border border-vba-border'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>에디터 (VBA Creator)</span>
          </button>
          <button
            onClick={() => setViewMode('prd')}
            className={`px-4 py-1.5 transition-all text-sm font-semibold rounded-full flex items-center gap-2 cursor-pointer ${
              viewMode === 'prd'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-vba-text-dim hover:text-white border border-vba-border'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>요구사항 정의서 (PRD)</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {viewMode === 'prd' ? (
          /* PRD Mode renders the structured product requirements book */
          <div className="flex-1 min-h-0 p-6 overflow-y-auto">
            <PrdViewer />
          </div>
        ) : (
          /* Low-Code Platform Builder Mode */
          <div className="flex-1 flex flex-col min-h-0 bg-vba-bg">
            
            {/* Step Selection Tabs & Global Controls Consolidated Block (Unified Sizing & Symmetrical Height) */}
            <div className="bg-vba-sidebar/80 border-b border-vba-border p-4 flex flex-col gap-3 shrink-0 select-none">
              
              {/* Step Tabs with Equalized Height and Padding */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-vba-surface p-1 rounded-xl border border-vba-border w-full">
                {[
                  { id: 'ui', num: '1', label: '1단계: UI 화면 구성 (UserForm Maker)' },
                  { id: 'logic', num: '2', label: '2단계: 동작 로직 구성 (Logic Builder)' },
                  { id: 'code', num: '3', label: '3단계: 생성된 VBA 코드 (Code Preview)' },
                  { id: 'sandbox', num: '4', label: '4단계: 가상 엑셀 실행' },
                ].map((tab) => {
                  const isActive = activeBuilderTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => startTransition(() => setActiveBuilderTab(tab.id as any))}
                      className={`h-11 px-6 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400 active-glow'
                          : 'text-vba-text-dim hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${isActive ? 'bg-blue-500 text-white' : 'bg-vba-border text-vba-text-dim'}`}>
                        {tab.num}
                      </span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Global Project Controls: PLACED DIRECTLY BELOW TABS with NO blank gap */}
              <div className="bg-vba-surface border border-vba-border rounded-xl px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-950/40 border border-blue-500/30 rounded-lg text-blue-400 shrink-0">
                    <Activity className="w-4 h-4 animate-pulse text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">전체 프로젝트 제어 (Global Controls)</h4>
                    <p className="text-[10px] text-vba-text-dim leading-none mt-0.5">현재 작업 중인 유저폼 디자인과 모든 이벤트 로직 설정을 초기 상태로 안전하게 되돌립니다.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
                  <div className="flex items-center gap-1.5 bg-vba-bg border border-vba-border rounded-md px-2.5 py-1 text-[10px] text-vba-text-dim">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="leading-tight font-medium">보안 안심: 로컬 브라우저 세션 컴파일 (외부 유출 걱정 없음)</span>
                  </div>

                  <button
                    onClick={handleResetAll}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-650 hover:bg-blue-600 border border-blue-500/40 text-blue-100 hover:text-white text-xs font-bold rounded transition shadow-[0_0_12px_rgba(59,130,246,0.15)] shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>프로젝트 완전 초기화</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Split Sidebar & Active Panel */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 p-5 min-h-0 overflow-hidden">
              
              {/* Left Sidebar: Predefined Templates & General Setup */}
              <div className="xl:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
                
                {/* Box 1: Pre-made Automation Templates */}
                <div className="bg-vba-surface p-4 rounded-xl border border-vba-border shadow-lg">
                  <div className="border-b border-vba-border pb-2 mb-3">
                    <h3 className="text-[11px] font-bold text-vba-accent uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-vba-accent" />
                      실무 자동화 템플릿 로드
                    </h3>
                  </div>
                  <p className="text-[10px] text-vba-text-dim mb-3 leading-relaxed">
                    현업 부서에서 즉각 사용 가능한 최적의 매크로 폼 설계를 불러와서 수정해 볼 수 있습니다.
                  </p>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleLoadTemplate('custom')}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all duration-200 text-xs font-semibold cursor-pointer ${
                        activeTemplateId === 'custom'
                          ? 'bg-blue-600/10 border-blue-500 text-blue-300 active-glow'
                          : 'bg-vba-bg/60 border-vba-border text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-blue-300 font-bold">🆕 새 프로젝트 (Blank Form)</span>
                        <ChevronRight className="w-3 h-3 text-blue-400 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-vba-text-dim font-normal leading-normal">아무런 요소가 배치되지 않은 초기 상태에서 디자인을 새로 창작합니다.</p>
                    </button>

                    {predefinedTemplates.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => handleLoadTemplate(tmpl.id)}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all duration-200 text-xs font-semibold cursor-pointer ${
                          activeTemplateId === tmpl.id
                            ? 'bg-blue-600/10 border-blue-500 text-blue-300 active-glow'
                            : 'bg-vba-bg/60 border-vba-border text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-blue-300 font-bold">{tmpl.name}</span>
                          <ChevronRight className="w-3 h-3 text-blue-400 font-bold" />
                        </div>
                        <p className="text-[10px] text-vba-text-dim font-normal leading-normal">{tmpl.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box 2: Live VBA Developer Stats & Compile Monitor Panel */}
                <div className="bg-vba-surface p-4 rounded-xl border border-vba-border shadow-lg space-y-3">
                  <div className="border-b border-vba-border pb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-vba-accent uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
                      실시간 프로젝트 분석기
                    </h3>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">
                      LIVE
                    </span>
                  </div>

                  {/* Grid stats */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-vba-bg/70 p-2 rounded border border-vba-border">
                      <div className="text-vba-text-dim text-[10px]">총 컴포넌트</div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {Math.max(0, elements.length - 1)} <span className="text-[10px] text-vba-text-dim font-normal">개</span>
                      </div>
                    </div>
                    <div className="bg-vba-bg/70 p-2 rounded border border-vba-border">
                      <div className="text-vba-text-dim text-[10px]">바인딩된 이벤트</div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {events.length} <span className="text-[10px] text-vba-text-dim font-normal">개</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-component breakdown */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-300 font-semibold">
                      <span>컴포넌트 분포</span>
                      <span className="text-[9px] font-mono text-vba-text-dim">Total: {elements.length}</span>
                    </div>
                    
                    <div className="bg-vba-bg/90 rounded p-2 border border-vba-border text-[10px] space-y-1 font-mono">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>• Buttons:</span>
                        <span className="text-blue-400 font-bold">{elements.filter(el => el.type === 'CommandButton').length}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>• TextBoxes:</span>
                        <span className="text-blue-400 font-bold">{elements.filter(el => el.type === 'TextBox').length}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>• Labels:</span>
                        <span className="text-blue-400 font-bold">{elements.filter(el => el.type === 'Label').length}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>• ComboBoxes:</span>
                        <span className="text-blue-400 font-bold">{elements.filter(el => el.type === 'ComboBox').length}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>• Checks/Options:</span>
                        <span className="text-blue-400 font-bold">
                          {elements.filter(el => el.type === 'CheckBox' || el.type === 'OptionButton').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Developer shortcuts list */}
                  <div className="space-y-1.5 pt-1.5 border-t border-vba-border">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-300">
                      <Keyboard className="w-3.5 h-3.5 text-blue-500" />
                      <span>실무 Excel VBA 단축키 가이드</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                      <div className="bg-vba-bg/40 p-1.5 rounded text-slate-300 flex justify-between items-center border border-vba-border">
                        <span className="text-blue-400 font-bold">Alt + F11</span>
                        <span className="text-vba-text-dim">VBA 창</span>
                      </div>
                      <div className="bg-vba-bg/40 p-1.5 rounded text-slate-300 flex justify-between items-center border border-vba-border">
                        <span className="text-blue-400 font-bold">F5 Key</span>
                        <span className="text-vba-text-dim">실행</span>
                      </div>
                      <div className="bg-vba-bg/40 p-1.5 rounded text-slate-300 flex justify-between items-center border border-vba-border">
                        <span className="text-blue-400 font-bold">F7 Key</span>
                        <span className="text-vba-text-dim">코드창</span>
                      </div>
                      <div className="bg-vba-bg/40 p-1.5 rounded text-slate-300 flex justify-between items-center border border-vba-border">
                        <span className="text-blue-400 font-bold">Alt + Q</span>
                        <span className="text-vba-text-dim">엑셀복귀</span>
                      </div>
                    </div>
                  </div>

                  {/* Live simulated console line */}
                  <div className="bg-vba-bg p-2 rounded border border-vba-border text-[9px] font-mono text-vba-accent flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">VBA v7.1 Compiler Status: READY (SNAP 8)</span>
                  </div>
                </div>

              </div>

              {/* Center/Right Panel: Workspace Sub-module */}
              <div className="xl:col-span-9 bg-vba-surface rounded-xl border border-vba-border overflow-hidden flex flex-col min-h-0 shadow-2xl">
                <div className={`flex-1 overflow-hidden flex flex-col p-4 md:p-5 min-h-0 ${isPending ? 'opacity-50 transition-opacity' : ''}`}>
                  {activeBuilderTab === 'ui' && (
                    <UiBuilder
                      elements={elements}
                      selectedId={selectedElementId}
                      onSelectElement={setSelectedElementId}
                      onUpdateElement={handleUpdateElement}
                      onAddElement={handleAddElement}
                      onDeleteElement={handleDeleteElement}
                    />
                  )}

                  {activeBuilderTab === 'logic' && (
                    <LogicBuilder
                      elements={elements}
                      events={events}
                      activeElementId={selectedElementId}
                      onSetActiveElementId={setSelectedElementId}
                      onUpdateEvents={setEvents}
                    />
                  )}

                  {activeBuilderTab === 'code' && (
                    <CodePreview
                      elements={elements}
                      events={events}
                    />
                  )}

                  {activeBuilderTab === 'sandbox' && (
                    <ExcelSimulator
                      elements={elements}
                      events={events}
                    />
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* 4. Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-vba-surface border border-blue-500/30 rounded-xl p-6 shadow-[0_0_50px_rgba(59,130,246,0.3)] overflow-hidden z-10"
            >
              {/* Top Neon Accent Line */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-950/50 border border-blue-500/40 rounded-lg text-blue-500 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    프로젝트를 완전 초기화하시겠습니까?
                  </h3>
                  <p className="text-[11px] text-vba-text-dim mt-2 leading-relaxed">
                    디자인 캔버스에 배치된 모든 컴포넌트와 이벤트 로직 설정이 전부 지워지며, 초기화된 작업은 복구할 수 없습니다. 정말 새로 시작하시겠습니까?
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2.5 mt-6 border-t border-vba-border pt-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-vba-bg hover:bg-vba-sidebar text-vba-text-dim hover:text-white border border-vba-border rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  취소 (Cancel)
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>예, 새로 기동</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
