/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { UIElement, ElementType } from '../types';
import {
  MousePointer,
  Type,
  Square,
  ChevronDown,
  CheckSquare,
  CircleDot,
  Frame as FrameIcon,
  Trash2,
  Maximize2,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';

interface UiBuilderProps {
  elements: UIElement[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<UIElement>) => void;
  onAddElement: (type: ElementType) => void;
  onDeleteElement: (id: string) => void;
}

export default function UiBuilder({
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onDeleteElement,
}: UiBuilderProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<'se' | 'e' | 's'>('se');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ w: 0, h: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const [startMousePos, setStartMousePos] = useState({ x: 0, y: 0 });

  const activeElement = elements.find((el) => el.id === selectedId) || null;
  const formElement = elements.find((el) => el.type === 'UserForm')!;

  // Map toolbox icons
  const getToolIcon = (type: ElementType) => {
    switch (type) {
      case 'UserForm':
        return <Square className="w-4 h-4 text-pink-500" />;
      case 'CommandButton':
        return <span className="text-[10px] font-bold bg-pink-950/50 text-pink-400 px-1 py-0.5 rounded border border-pink-500/30">btn</span>;
      case 'TextBox':
        return <Type className="w-4 h-4 text-emerald-400" />;
      case 'ComboBox':
        return <ChevronDown className="w-4 h-4 text-amber-400" />;
      case 'Label':
        return <span className="font-serif font-bold text-cyan-400 text-xs">Ab</span>;
      case 'CheckBox':
        return <CheckSquare className="w-4 h-4 text-fuchsia-400" />;
      case 'OptionButton':
        return <CircleDot className="w-4 h-4 text-teal-400" />;
      case 'Frame':
        return <FrameIcon className="w-4 h-4 text-purple-400" />;
      default:
        return <MousePointer className="w-4 h-4 text-slate-400" />;
    }
  };

  // Human-readable names for tools
  const getToolLabel = (type: ElementType) => {
    switch (type) {
      case 'CommandButton':
        return '명령 단추 (Button)';
      case 'TextBox':
        return '텍스트 상자 (TextBox)';
      case 'Label':
        return '레이블 (Label)';
      case 'ComboBox':
        return '복합 상자 (ComboBox)';
      case 'CheckBox':
        return '확인란 (CheckBox)';
      case 'OptionButton':
        return '옵션 단추 (OptionButton)';
      case 'Frame':
        return '프레임 (Frame Box)';
      default:
        return type;
    }
  };

  // Handle Dragging of Elements inside canvas
  const handleElementMouseDown = (e: React.MouseEvent, el: UIElement) => {
    e.stopPropagation();
    if (el.type === 'UserForm') return; // Cannot drag outer form inside itself

    onSelectElement(el.id);
    setIsDragging(true);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Handle Resizing of elements
  const handleResizeMouseDown = (e: React.MouseEvent, el: UIElement, dir: 'se' | 'e' | 's' = 'se') => {
    e.stopPropagation();
    onSelectElement(el.id);
    setIsResizing(true);
    setResizeDir(dir);
    setStartMousePos({ x: e.clientX, y: e.clientY });
    setInitialSize({ w: el.width, h: el.height });
  };

  // Document Mouse Move (handles drag & resize across viewport bounds smoothly)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !selectedId || !activeElement) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();

      if (isDragging) {
        // Calculate new Left and Top relative to canvas
        let newLeft = e.clientX - canvasRect.left - dragOffset.x;
        let newTop = e.clientY - canvasRect.top - dragOffset.y;

        // Snapping logic to 8px grids
        newLeft = Math.round(newLeft / 8) * 8;
        newTop = Math.round(newTop / 8) * 8;

        // Bound to canvas limits
        newLeft = Math.max(0, Math.min(newLeft, formElement.width - activeElement.width));
        newTop = Math.max(0, Math.min(newTop, formElement.height - activeElement.height));

        onUpdateElement(selectedId, { left: newLeft, top: newTop });
      }

      if (isResizing) {
        const deltaX = e.clientX - startMousePos.x;
        const deltaY = e.clientY - startMousePos.y;

        let newWidth = initialSize.w;
        let newHeight = initialSize.h;

        if (resizeDir === 'se' || resizeDir === 'e') {
          newWidth = initialSize.w + deltaX;
          newWidth = Math.max(24, Math.round(newWidth / 8) * 8);
          if (activeElement.left + newWidth > formElement.width) {
            newWidth = formElement.width - activeElement.left;
          }
        }

        if (resizeDir === 'se' || resizeDir === 's') {
          newHeight = initialSize.h + deltaY;
          newHeight = Math.max(16, Math.round(newHeight / 8) * 8);
          if (activeElement.top + newHeight > formElement.height) {
            newHeight = formElement.height - activeElement.top;
          }
        }

        onUpdateElement(selectedId, { width: newWidth, height: newHeight });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, resizeDir, selectedId, dragOffset, initialSize, startMousePos, activeElement, formElement]);

  // Quick alignment options
  const alignElement = (align: 'left' | 'center' | 'top' | 'middle') => {
    if (!activeElement) return;
    if (align === 'left') {
      onUpdateElement(activeElement.id, { left: 8 });
    } else if (align === 'center') {
      const formWidth = formElement.width;
      onUpdateElement(activeElement.id, { left: Math.round((formWidth - activeElement.width) / 2 / 8) * 8 });
    } else if (align === 'top') {
      onUpdateElement(activeElement.id, { top: 8 });
    } else if (align === 'middle') {
      const formHeight = formElement.height;
      onUpdateElement(activeElement.id, { top: Math.round((formHeight - activeElement.height) / 2 / 8) * 8 });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full" id="ui_builder_container">
      
      {/* 1. Component Toolbox Palette */}
      <div className="lg:col-span-3 flex flex-col gap-4 border border-purple-500/30 bg-[#0f0a28]/90 p-4 rounded-lg shadow-xl backdrop-blur-md">
        <div>
          <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-purple-500/20 pb-2">
            <Layers className="w-4 h-4 text-pink-500" />
            도구 상자 (Toolbox)
          </h3>
          <p className="text-[10.5px] text-slate-300 mt-1.5 leading-relaxed">
            컴포넌트를 캔버스로 올려 화면을 디자인하십시오.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-purple-950/40 border border-purple-950 rounded overflow-hidden">
          {(['CommandButton', 'TextBox', 'Label', 'ComboBox', 'CheckBox', 'OptionButton', 'Frame'] as ElementType[]).map((type) => (
            <button
              key={type}
              onClick={() => onAddElement(type)}
              className="bg-[#130d35] p-3.5 flex flex-col items-center hover:bg-[#1f164f] cursor-pointer text-center text-slate-300 hover:text-pink-400 transition-all duration-200 group focus:outline-none"
            >
              <div className="w-7 h-7 flex items-center justify-center bg-[#1c1445] group-hover:bg-purple-950/80 rounded transition mb-1 shrink-0 border border-purple-900/30">
                {getToolIcon(type)}
              </div>
              <span className="text-[10px] font-semibold tracking-tight">{type}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-purple-500/20 pt-3 text-[10px] text-slate-400 italic leading-relaxed flex items-start gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-pink-500/50 shrink-0 mt-0.5" />
          <p>컴포넌트를 추가한 후, 우측 속성 창에서 변수명(VBA Name) 및 표시값을 수정하십시오.</p>
        </div>
      </div>

      {/* 2. Visual Drag & Drop Canvas */}
      <div className="lg:col-span-6 flex flex-col bg-[#050210] rounded-lg border border-purple-500/30 p-4 relative min-h-[400px] shadow-inner">
        {/* Canvas Toolbar */}
        <div className="flex items-center justify-between mb-3 text-xs bg-[#11092e] p-2.5 rounded border border-purple-500/20 shadow-sm text-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-pink-400 text-xs">🎨 UserForm 디자인 캔버스</span>
            <span className="text-[10px] bg-purple-950/50 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-mono">GRID: 8PX SNAP</span>
          </div>

          {activeElement && activeElement.type !== 'UserForm' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-pink-400 font-bold bg-pink-950/40 px-1.5 py-0.5 rounded border border-pink-500/30">
                선택: {activeElement.name}
              </span>
              <button
                onClick={() => alignElement('center')}
                className="p-1 px-2 bg-[#18113e] hover:bg-[#231a54] border border-purple-900 rounded text-slate-300 hover:text-white font-semibold text-[10px] transition-colors"
                title="가로 기준 중앙 정렬"
              >
                가로 중앙 정렬
              </button>
              <button
                onClick={() => onDeleteElement(activeElement.id)}
                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 rounded text-rose-300 hover:text-rose-100 border border-rose-500/30 transition-colors"
                title="컴포넌트 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Visual Drawing Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div
            ref={canvasRef}
            onClick={() => onSelectElement(formElement.id)}
            style={{
              width: `${formElement.width}px`,
              height: `${formElement.height}px`,
              backgroundColor: formElement.backColor,
              color: formElement.foreColor,
              position: 'relative',
              boxShadow: '0 20px 40px -15px rgba(236, 72, 153, 0.25)',
              borderRadius: '3px',
              border: selectedId === formElement.id ? '2px solid #ec4899' : '1px solid #7c3aed',
              backgroundImage: 'radial-gradient(#ec4899 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px',
            }}
            className="transition-shadow select-none cursor-pointer"
          >
            {/* Form Title Bar */}
            <div className="h-6 bg-[#D4D0C8] border-b border-slate-400 flex items-center justify-between px-2 text-slate-800 select-none">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-blue-800 shrink-0"></div>
                <span className="text-[11px] font-bold tracking-tight">{formElement.caption || 'UserForm'}</span>
              </div>
              <div className="flex space-x-0.5 shrink-0">
                <div className="w-3.5 h-3.5 bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold shadow-xs">_</div>
                <div className="w-3.5 h-3.5 bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold shadow-xs">✕</div>
              </div>
            </div>

            {/* Elements inside the Form */}
            {elements
              .filter((el) => el.type !== 'UserForm')
              .map((el) => {
                const isSelected = selectedId === el.id;
                
                // Base styling for inside components
                const elementStyle: React.CSSProperties = {
                  position: 'absolute',
                  left: `${el.left}px`,
                  top: `${el.top}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  color: el.foreColor,
                  backgroundColor: el.backColor,
                  fontSize: `${el.fontSize * 1.1}px`,
                  fontWeight: el.fontBold ? 'bold' : 'normal',
                  border: isSelected ? '1px dashed #ec4899' : '1px solid #CBD5E1',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: el.type === 'Frame' ? '12px 6px 6px' : '4px 8px',
                  boxSizing: 'border-box',
                  opacity: el.visible ? 1 : 0.4,
                };

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    onClick={(e) => e.stopPropagation()}
                    style={elementStyle}
                    className="cursor-move select-none text-xs hover:border-pink-500 group-element"
                  >
                    {/* Highlight Box if Selected */}
                    {isSelected && (
                      <div className="absolute inset-[-2px] border-2 border-pink-500 pointer-events-none z-50">
                        {/* Static corner decoration handles */}
                        <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-white border-2 border-pink-500 rounded-full"></div>
                        <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white border-2 border-pink-500 rounded-full"></div>
                        <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-white border-2 border-pink-500 rounded-full"></div>
                        
                        {/* Active resize handles */}
                        {/* Right edge width handle */}
                        <div 
                          className="absolute right-[-4px] top-[calc(50%-5px)] w-2.5 h-2.5 bg-pink-500 border border-white rounded-xs cursor-e-resize pointer-events-auto shadow-sm"
                          onMouseDown={(e) => handleResizeMouseDown(e, el, 'e')}
                          title="가로 크기 조절"
                        ></div>
                        {/* Bottom edge height handle */}
                        <div 
                          className="absolute bottom-[-4px] left-[calc(50%-5px)] w-2.5 h-2.5 bg-pink-500 border border-white rounded-xs cursor-s-resize pointer-events-auto shadow-sm"
                          onMouseDown={(e) => handleResizeMouseDown(e, el, 's')}
                          title="세로 크기 조절"
                        ></div>
                        {/* Bottom-right diagonal corner handle */}
                        <div 
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-pink-500 border-2 border-white rounded-full cursor-se-resize pointer-events-auto shadow-md hover:scale-110 transition-transform flex items-center justify-center"
                          onMouseDown={(e) => handleResizeMouseDown(e, el, 'se')}
                          title="대각선 크기 조절"
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}

                    {/* Rendering based on type */}
                    {el.type === 'CommandButton' && (
                      <div className="w-full text-center truncate font-bold text-slate-800">
                        {el.caption}
                      </div>
                    )}

                    {el.type === 'TextBox' && (
                      <div className="w-full text-slate-400 font-normal truncate italic">
                        {el.text || el.placeholder || 'TextBox'}
                      </div>
                    )}

                    {el.type === 'Label' && (
                      <div className="w-full text-left font-medium break-words leading-tight">
                        {el.caption}
                      </div>
                    )}

                    {el.type === 'ComboBox' && (
                      <div className="w-full flex justify-between items-center text-slate-700 font-normal">
                        <span className="truncate">{el.value || el.options[0] || '선택하세요'}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    )}

                    {el.type === 'CheckBox' && (
                      <div className="w-full flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center shrink-0 ${el.value === 'True' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                          {el.value === 'True' && '✓'}
                        </div>
                        <span className="truncate">{el.caption}</span>
                      </div>
                    )}

                    {el.type === 'OptionButton' && (
                      <div className="w-full flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border rounded-full flex items-center justify-center shrink-0 bg-white border-slate-300">
                          {el.value === 'True' && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>}
                        </div>
                        <span className="truncate">{el.caption}</span>
                      </div>
                    )}

                    {el.type === 'Frame' && (
                      <div className="absolute top-[-8px] left-2 px-1 text-[10px] text-slate-500 font-semibold border-l border-r border-slate-200" style={{ backgroundColor: el.backColor || '#fff' }}>
                        {el.caption}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* 3. Fully Localized Property Inspector */}
      <div className="lg:col-span-3 border border-purple-500/30 bg-[#0f0a28]/90 p-4 rounded-lg flex flex-col h-full overflow-y-auto shadow-xl backdrop-blur-md">
        <div className="border-b border-purple-500/20 pb-2 mb-3">
          <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-500" />
            속성 편집기 (Properties)
          </h3>
          <p className="text-[10px] text-slate-300 mt-0.5">
            선택한 컴포넌트의 VBA 및 시각 속성을 편집합니다.
          </p>
        </div>

        {activeElement ? (
          <div className="space-y-4 text-xs flex-1">
            <div className="bg-pink-950/40 px-2.5 py-1.5 rounded text-[10px] text-pink-300 font-bold border border-pink-500/30">
              객체 형식: <span className="text-pink-400 uppercase font-mono">{activeElement.type}</span>
            </div>

            {/* Name / ID (VBA Name) */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-bold">Name</label>
              <input
                type="text"
                value={activeElement.name}
                onChange={(e) => onUpdateElement(activeElement.id, { name: e.target.value.replace(/\s+/g, '') })}
                className="w-full p-1.5 bg-[#130d35] border border-purple-900/50 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none font-mono text-xs text-white"
              />
              <p className="text-[9px] text-slate-400">VBA 매크로 코드에서 인식할 고유 변수명</p>
            </div>

            {/* Caption (Visible Title) - Button, Label, CheckBox, Frame, UserForm */}
            {activeElement.type !== 'TextBox' && activeElement.type !== 'ComboBox' && (
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">Caption (표시제목)</label>
                <input
                  type="text"
                  value={activeElement.caption}
                  onChange={(e) => onUpdateElement(activeElement.id, { caption: e.target.value })}
                  className="w-full p-1.5 bg-[#130d35] border border-purple-900/50 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-white"
                />
              </div>
            )}

            {/* Text Value (for TextBox) */}
            {activeElement.type === 'TextBox' && (
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">Text (기본 텍스트)</label>
                <input
                  type="text"
                  value={activeElement.text}
                  onChange={(e) => onUpdateElement(activeElement.id, { text: e.target.value })}
                  className="w-full p-1.5 bg-[#130d35] border border-purple-900/50 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-white"
                />
              </div>
            )}

            {/* Selection value (for CheckBox, OptionButton) */}
            {(activeElement.type === 'CheckBox' || activeElement.type === 'OptionButton') && (
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">Value (선택상태)</label>
                <select
                  value={activeElement.value}
                  onChange={(e) => onUpdateElement(activeElement.id, { value: e.target.value })}
                  className="w-full p-1.5 bg-[#130d35] border border-purple-900/50 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-white"
                >
                  <option value="True">선택됨 (True)</option>
                  <option value="False">해제됨 (False)</option>
                </select>
              </div>
            )}

            {/* Options Dropdown list - only ComboBox */}
            {activeElement.type === 'ComboBox' && (
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">ListOptions (줄바꿈 구분)</label>
                <textarea
                  value={activeElement.options.join('\n')}
                  onChange={(e) => onUpdateElement(activeElement.id, { options: e.target.value.split('\n') })}
                  rows={3}
                  className="w-full p-1.5 bg-[#130d35] border border-purple-900/50 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none font-mono text-xs text-white"
                  placeholder="예: 영업1팀&#10;영업2팀&#10;인사과"
                />
              </div>
            )}

            {/* Size & Position Box */}
            <div className="border border-purple-900/50 rounded p-2.5 space-y-2 bg-[#160f3d]">
              <span className="font-bold text-pink-300 text-[10px] block uppercase tracking-wider">좌표 및 크기 사양</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-300 font-mono">Left</label>
                  <input
                    type="number"
                    value={activeElement.left}
                    onChange={(e) => onUpdateElement(activeElement.id, { left: Math.round(Number(e.target.value)) })}
                    className="w-full p-1 bg-[#1a1246] border border-purple-900/40 rounded text-pink-300 text-xs"
                    disabled={activeElement.type === 'UserForm'}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 font-mono">Top</label>
                  <input
                    type="number"
                    value={activeElement.top}
                    onChange={(e) => onUpdateElement(activeElement.id, { top: Math.round(Number(e.target.value)) })}
                    className="w-full p-1 bg-[#1a1246] border border-purple-900/40 rounded text-pink-300 text-xs"
                    disabled={activeElement.type === 'UserForm'}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 font-mono">Width</label>
                  <input
                    type="number"
                    value={activeElement.width}
                    onChange={(e) => onUpdateElement(activeElement.id, { width: Math.round(Number(e.target.value)) })}
                    className="w-full p-1 bg-[#1a1246] border border-purple-900/40 rounded text-pink-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 font-mono">Height</label>
                  <input
                    type="number"
                    value={activeElement.height}
                    onChange={(e) => onUpdateElement(activeElement.id, { height: Math.round(Number(e.target.value)) })}
                    className="w-full p-1 bg-[#1a1246] border border-purple-900/40 rounded text-pink-300 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-[11px]">ForeColor</label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="color"
                    value={activeElement.foreColor}
                    onChange={(e) => onUpdateElement(activeElement.id, { foreColor: e.target.value })}
                    className="w-6 h-6 rounded border border-purple-900/50 cursor-pointer shrink-0 bg-[#130d35]"
                  />
                  <span className="font-mono text-[9px] uppercase text-pink-400 truncate">{activeElement.foreColor}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-[11px]">BackColor</label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="color"
                    value={activeElement.backColor}
                    onChange={(e) => onUpdateElement(activeElement.id, { backColor: e.target.value })}
                    className="w-6 h-6 rounded border border-purple-900/50 cursor-pointer shrink-0 bg-[#130d35]"
                  />
                  <span className="font-mono text-[9px] uppercase text-pink-400 truncate">{activeElement.backColor}</span>
                </div>
              </div>
            </div>

            {/* Visibility & Enabled */}
            <div className="grid grid-cols-2 gap-2 border-t border-purple-500/20 pt-3">
              <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={activeElement.visible}
                  onChange={(e) => onUpdateElement(activeElement.id, { visible: e.target.checked })}
                  className="rounded-xs border-purple-900/50 text-pink-500 focus:ring-pink-500 bg-[#130d35]"
                />
                <span>Visible</span>
              </label>
              <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={activeElement.enabled}
                  onChange={(e) => onUpdateElement(activeElement.id, { enabled: e.target.checked })}
                  className="rounded-xs border-purple-900/50 text-pink-500 focus:ring-pink-500 bg-[#130d35]"
                />
                <span>Enabled</span>
              </label>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 border border-dashed border-purple-500/30 rounded-lg bg-[#0f0a28]/40">
            <MousePointer className="w-8 h-8 text-pink-500/50 mb-2" />
            <p className="text-xs font-semibold text-pink-400">선택된 요소 없음</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              캔버스 위 컴포넌트나 UserForm 테두리를 선택해 속성을 구성하세요.
            </p>
          </div>
        )}

        <div className="p-3.5 bg-purple-950/40 border-t border-purple-500/20 rounded-b-lg -mx-4 -mb-4 mt-4 select-none">
          <h4 className="text-[10px] font-bold text-pink-400 uppercase mb-1">Tip: 이벤트 매핑</h4>
          <p className="text-[10px] text-purple-300 leading-tight">버튼을 더블 클릭하거나 2단계 동작 탭에서 각 엘리먼트의 클릭/체인지 이벤트에 VBA 매크로 블록을 결합해 보세요.</p>
        </div>
      </div>

    </div>
  );
}
