/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UIElement, ControlEvent, LogicBlock, BlockType } from '../types';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Terminal,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  GitFork,
  Repeat,
  X,
  PlusCircle,
  FolderOpen
} from 'lucide-react';

interface LogicBuilderProps {
  elements: UIElement[];
  events: ControlEvent[];
  activeElementId: string | null;
  onSetActiveElementId: (id: string | null) => void;
  onUpdateEvents: (updatedEvents: ControlEvent[]) => void;
}

export default function LogicBuilder({
  elements,
  events,
  activeElementId,
  onSetActiveElementId,
  onUpdateEvents,
}: LogicBuilderProps) {
  
  // Filter elements that can have events (Form, Buttons, CheckBoxes, OptionButtons, TextBoxes)
  const eventTriggerElements = elements.filter(
    (el) => el.type === 'UserForm' || el.type === 'CommandButton' || el.type === 'CheckBox' || el.type === 'OptionButton'
  );

  // Fallback to first trigger element if none active
  const selectedElementId = activeElementId || (eventTriggerElements[0]?.id || null);
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Event Name mapping (UserForm defaults to Initialize, buttons/checks to Click)
  const activeEventName = selectedElement?.type === 'UserForm' ? 'Initialize' : 'Click';

  // Find or create current active event structure
  const activeEvent = events.find(
    (e) => e.elementId === selectedElementId && e.eventName === activeEventName
  ) || {
    elementId: selectedElementId || '',
    eventName: activeEventName,
    blocks: [],
  };

  // Update current active event blocks
  const updateActiveEventBlocks = (newBlocks: LogicBlock[]) => {
    if (!selectedElementId) return;
    const existingIndex = events.findIndex(
      (e) => e.elementId === selectedElementId && e.eventName === activeEventName
    );

    const updatedEvent: ControlEvent = {
      elementId: selectedElementId,
      eventName: activeEventName,
      blocks: newBlocks,
    };

    let newEvents = [...events];
    if (existingIndex >= 0) {
      newEvents[existingIndex] = updatedEvent;
    } else {
      newEvents.push(updatedEvent);
    }
    onUpdateEvents(newEvents);
  };

  // Block definitions template generator
  const createNewBlock = (type: BlockType): LogicBlock => {
    const id = 'block_' + Math.random().toString(36).substr(2, 9);
    switch (type) {
      case 'MsgBox':
        return { id, type, prompt: '등록이 완료되었습니다!', title: '알림' };
      case 'SetCell':
        return { id, type, cellAddress: 'A" & nextRow & "', cellValue: 'TxtCustomerName.Text' };
      case 'GetCell':
        return { id, type, cellAddress: 'A1', targetVarName: 'myValue' };
      case 'SetControlProperty': {
        const firstBtn = elements.find(el => el.type !== 'UserForm');
        return {
          id,
          type,
          targetElementId: firstBtn?.id || '',
          targetProperty: 'Caption',
          propertyValue: '등록 완료',
        };
      }
      case 'Variable':
        return { id, type, varName: 'nextRow', varValue: 'ActiveSheet.Cells(ActiveSheet.Rows.Count, "A").End(xlUp).Row + 1' };
      case 'VBAExpression':
        return { id, type, expression: "ActiveSheet.Range(\"A:D\").Columns.AutoFit\nMsgBox \"자동 너비 조절 완료!\"" };
      case 'CloseForm':
        return { id, type };
      case 'Condition':
        return {
          id,
          type,
          conditionLeft: 'TxtBudgetAmount.Text',
          conditionOp: '>=',
          conditionRight: '5000000',
          trueBlocks: [
            { id: id + '_t1', type: 'MsgBox', prompt: '500만원 초과는 부서장 전결이 필요합니다.', title: '전결 경고' }
          ],
          falseBlocks: []
        };
      case 'Loop':
        return {
          id,
          type,
          loopVar: 'i',
          loopStart: '1',
          loopEnd: '10',
          loopBlocks: []
        };
    }
  };

  // Add block to stack
  const handleAddBlock = (type: BlockType) => {
    if (!selectedElementId) return;
    const newBlock = createNewBlock(type);
    const updated = [...activeEvent.blocks, newBlock];
    updateActiveEventBlocks(updated);
  };

  // Update specific block properties in stack
  const handleUpdateBlock = (blockId: string, updates: Partial<LogicBlock>) => {
    const updateRecursive = (list: LogicBlock[]): LogicBlock[] => {
      return list.map((b) => {
        if (b.id === blockId) {
          return { ...b, ...updates };
        }
        if (b.trueBlocks) {
          b = { ...b, trueBlocks: updateRecursive(b.trueBlocks) };
        }
        if (b.falseBlocks) {
          b = { ...b, falseBlocks: updateRecursive(b.falseBlocks) };
        }
        if (b.loopBlocks) {
          b = { ...b, loopBlocks: updateRecursive(b.loopBlocks) };
        }
        return b;
      });
    };
    updateActiveEventBlocks(updateRecursive(activeEvent.blocks));
  };

  // Delete specific block
  const handleDeleteBlock = (blockId: string) => {
    const filterRecursive = (list: LogicBlock[]): LogicBlock[] => {
      return list
        .filter((b) => b.id !== blockId)
        .map((b) => {
          if (b.trueBlocks) {
            b = { ...b, trueBlocks: filterRecursive(b.trueBlocks) };
          }
          if (b.falseBlocks) {
            b = { ...b, falseBlocks: filterRecursive(b.falseBlocks) };
          }
          if (b.loopBlocks) {
            b = { ...b, loopBlocks: filterRecursive(b.loopBlocks) };
          }
          return b;
        });
    };
    updateActiveEventBlocks(filterRecursive(activeEvent.blocks));
  };

  // Move block up or down
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const list = [...activeEvent.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    updateActiveEventBlocks(list);
  };

  // Sub-block add utility for nested components
  const handleAddSubBlock = (parentBlockId: string, subType: 'true' | 'false' | 'loop', type: BlockType) => {
    const newSub = createNewBlock(type);
    const addRecursive = (list: LogicBlock[]): LogicBlock[] => {
      return list.map((b) => {
        if (b.id === parentBlockId) {
          if (subType === 'true') {
            return { ...b, trueBlocks: [...(b.trueBlocks || []), newSub] };
          } else if (subType === 'false') {
            return { ...b, falseBlocks: [...(b.falseBlocks || []), newSub] };
          } else if (subType === 'loop') {
            return { ...b, loopBlocks: [...(b.loopBlocks || []), newSub] };
          }
        }
        if (b.trueBlocks) {
          b = { ...b, trueBlocks: addRecursive(b.trueBlocks) };
        }
        if (b.falseBlocks) {
          b = { ...b, falseBlocks: addRecursive(b.falseBlocks) };
        }
        if (b.loopBlocks) {
          b = { ...b, loopBlocks: addRecursive(b.loopBlocks) };
        }
        return b;
      });
    };
    updateActiveEventBlocks(addRecursive(activeEvent.blocks));
  };

  // Render a block component
  const renderSingleBlock = (block: LogicBlock, index: number, isSubBlock: boolean = false, parentId?: string, subStackType?: 'true' | 'false' | 'loop') => {
    return (
      <div
        key={block.id}
        style={{ contentVisibility: 'auto' }}
        className={`rounded-lg border shadow-lg flex flex-col transition-all text-xs overflow-hidden ${
          block.type === 'MsgBox'
            ? 'border-blue-500/40 bg-[#0e2049]/90 text-slate-100 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
            : block.type === 'SetCell' || block.type === 'GetCell'
            ? 'border-emerald-500/40 bg-[#0c2e28]/90 text-slate-100 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
            : block.type === 'SetControlProperty'
            ? 'border-purple-500/40 bg-[#241249]/90 text-slate-100 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
            : block.type === 'Condition'
            ? 'border-amber-500/40 bg-[#311f18]/90 text-slate-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
            : block.type === 'Loop'
            ? 'border-orange-500/40 bg-[#3a1d12]/90 text-slate-100 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
            : block.type === 'Variable'
            ? 'border-cyan-500/40 bg-[#0e2542]/90 text-slate-100 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
            : block.type === 'VBAExpression'
            ? 'border-pink-500/40 bg-[#2b0820]/90 text-slate-100 shadow-[0_0_10px_rgba(236,72,153,0.15)]'
            : 'border-rose-500/40 bg-[#3b0b23]/90 text-slate-100 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
        }`}
      >
        {/* Block Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#04010a]/40 border-b border-purple-950/40 font-bold text-slate-200 text-[11px]">
          <div className="flex items-center gap-1.5">
            {block.type === 'MsgBox' && <MessageSquare className="w-3.5 h-3.5 text-blue-400" />}
            {(block.type === 'SetCell' || block.type === 'GetCell') && <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
            {block.type === 'SetControlProperty' && <Settings className="w-3.5 h-3.5 text-purple-400" />}
            {block.type === 'Condition' && <GitFork className="w-3.5 h-3.5 text-amber-400" />}
            {block.type === 'Loop' && <Repeat className="w-3.5 h-3.5 text-orange-400" />}
            {block.type === 'Variable' && <Terminal className="w-3.5 h-3.5 text-cyan-400" />}
            {block.type === 'VBAExpression' && <Terminal className="w-3.5 h-3.5 text-pink-400" />}
            {block.type === 'CloseForm' && <X className="w-3.5 h-3.5 text-rose-400" />}

            <span>
              {block.type === 'MsgBox' && '알림 팝업창 (MsgBox)'}
              {block.type === 'SetCell' && '엑셀 시트에 쓰기 (Set Cell Value)'}
              {block.type === 'GetCell' && '엑셀 시트 읽기 (Get Cell Value)'}
              {block.type === 'SetControlProperty' && '화면 요소 속성 변경 (Control Property)'}
              {block.type === 'Variable' && 'VBA 변수 정의 (Variable Assign)'}
              {block.type === 'VBAExpression' && '고급 VBA 명령 직접 쓰기 (Expression)'}
              {block.type === 'CloseForm' && '유저폼 닫기 (Unload Form)'}
              {block.type === 'Condition' && '조건 판단 (If...Then...Else)'}
              {block.type === 'Loop' && '순환 반복문 (For...Next Loop)'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!isSubBlock && (
              <>
                <button
                  onClick={() => handleMoveBlock(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-purple-950 rounded text-slate-400 hover:text-white disabled:opacity-30"
                  title="위로 이동"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleMoveBlock(index, 'down')}
                  disabled={index === activeEvent.blocks.length - 1}
                  className="p-1 hover:bg-purple-950 rounded text-slate-400 hover:text-white disabled:opacity-30"
                  title="아래로 이동"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={() => handleDeleteBlock(block.id)}
              className="p-1 hover:bg-rose-950/60 rounded text-rose-400 hover:text-rose-200 transition"
              title="블록 제거"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Block Body Controls */}
        <div className="p-3 space-y-2.5">
          {/* 1. MsgBox */}
          {block.type === 'MsgBox' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">대화창 내용 (Prompt)</label>
                <input
                  type="text"
                  value={block.prompt}
                  onChange={(e) => handleUpdateBlock(block.id, { prompt: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">상단 타이틀 (Title)</label>
                <input
                  type="text"
                  value={block.title}
                  onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                />
              </div>
            </div>
          )}

          {/* 2. SetCell */}
          {block.type === 'SetCell' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">대상 셀 주소 (Cell Address)</label>
                <input
                  type="text"
                  value={block.cellAddress}
                  onChange={(e) => handleUpdateBlock(block.id, { cellAddress: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono"
                  placeholder='A1 또는 A" & nextRow'
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">입력할 값/컨트롤명 (Cell Value)</label>
                <input
                  type="text"
                  value={block.cellValue}
                  onChange={(e) => handleUpdateBlock(block.id, { cellValue: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono"
                  placeholder='TxtCustomerName.Text 또는 "기본값"'
                />
              </div>
            </div>
          )}

          {/* 3. GetCell */}
          {block.type === 'GetCell' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">불러올 셀 주소 (Cell Address)</label>
                <input
                  type="text"
                  value={block.cellAddress}
                  onChange={(e) => handleUpdateBlock(block.id, { cellAddress: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">저장할 변수명 (Target Variable)</label>
                <input
                  type="text"
                  value={block.targetVarName}
                  onChange={(e) => handleUpdateBlock(block.id, { targetVarName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono"
                />
              </div>
            </div>
          )}

          {/* 4. SetControlProperty */}
          {block.type === 'SetControlProperty' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">대상 컴포넌트</label>
                <select
                  value={block.targetElementId}
                  onChange={(e) => handleUpdateBlock(block.id, { targetElementId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white"
                >
                  <option value="">-- 선택 --</option>
                  {elements.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.name} ({el.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">변경할 속성</label>
                <select
                  value={block.targetProperty}
                  onChange={(e) => handleUpdateBlock(block.id, { targetProperty: e.target.value as any })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono"
                >
                  <option value="Caption">Caption (제목글)</option>
                  <option value="Text">Text (텍스트내용)</option>
                  <option value="Value">Value (값)</option>
                  <option value="Visible">Visible (표시여부)</option>
                  <option value="Enabled">Enabled (사용가능)</option>
                  <option value="BackColor">BackColor (배경색)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">반영할 값 (Value Expression)</label>
                <input
                  type="text"
                  value={block.propertyValue}
                  onChange={(e) => handleUpdateBlock(block.id, { propertyValue: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono"
                  placeholder='"값" 또는 True'
                />
              </div>
            </div>
          )}

          {/* 5. Variable */}
          {block.type === 'Variable' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">선언할 변수 이름 (Var Name)</label>
                <input
                  type="text"
                  value={block.varName}
                  onChange={(e) => handleUpdateBlock(block.id, { varName: e.target.value.replace(/\s+/g, '') })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5">값 또는 연산식 (Value Expression)</label>
                <input
                  type="text"
                  value={block.varValue}
                  onChange={(e) => handleUpdateBlock(block.id, { varValue: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono"
                />
              </div>
            </div>
          )}

          {/* 6. VBAExpression (Raw input) */}
          {block.type === 'VBAExpression' && (
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-0.5">VBA 코드 직접 입력 (줄바꿈 가능)</label>
              <textarea
                value={block.expression}
                onChange={(e) => handleUpdateBlock(block.id, { expression: e.target.value })}
                rows={3}
                className="w-full p-2 border border-slate-200 rounded-md bg-white font-mono text-xs focus:ring-1 focus:ring-slate-400 outline-none"
                placeholder="' 여기에 자유로운 VBA 매크로 문법을 기재하세요."
              />
            </div>
          )}

          {/* 7. CloseForm */}
          {block.type === 'CloseForm' && (
            <p className="text-[11px] text-slate-500 italic">
              호출 시 메모리에서 현재 UserForm을 언로드하고 창을 완전히 종료합니다. (`Unload Me`)
            </p>
          )}

          {/* 8. Condition (If ... Then ... Else) */}
          {block.type === 'Condition' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bold text-amber-800 shrink-0">만약 (If)</span>
                <input
                  type="text"
                  value={block.conditionLeft}
                  onChange={(e) => handleUpdateBlock(block.id, { conditionLeft: e.target.value })}
                  className="flex-1 p-2 border border-slate-200 rounded-md bg-white font-mono text-xs"
                  placeholder="변수 또는 속성"
                />
                <select
                  value={block.conditionOp}
                  onChange={(e) => handleUpdateBlock(block.id, { conditionOp: e.target.value as any })}
                  className="p-2 border border-slate-200 rounded-md bg-white font-mono text-xs font-bold"
                >
                  <option value="=">=</option>
                  <option value="<>">&lt;&gt;</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                </select>
                <input
                  type="text"
                  value={block.conditionRight}
                  onChange={(e) => handleUpdateBlock(block.id, { conditionRight: e.target.value })}
                  className="flex-1 p-2 border border-slate-200 rounded-md bg-white font-mono text-xs"
                  placeholder="비교할 값"
                />
                <span className="font-bold text-amber-800 shrink-0">이면 (Then)</span>
              </div>

              {/* True Blocks Container */}
              <div className="border border-dashed border-amber-300 rounded-lg p-3 bg-amber-50/40 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-amber-800 font-bold mb-1">
                  <span>참일 때 실행할 블록 (True)</span>
                  <div className="flex gap-1.5">
                    {['MsgBox', 'SetCell', 'SetControlProperty', 'CloseForm'].map((subType) => (
                      <button
                        key={subType}
                        onClick={() => handleAddSubBlock(block.id, 'true', subType as any)}
                        className="bg-white hover:bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[9px] font-medium text-amber-800"
                      >
                        + {subType}
                      </button>
                    ))}
                  </div>
                </div>

                {block.trueBlocks && block.trueBlocks.length > 0 ? (
                  block.trueBlocks.map((tb, idx) => renderSingleBlock(tb, idx, true, block.id, 'true'))
                ) : (
                  <p className="text-[10px] text-slate-400 italic text-center py-2">
                    여기에 조립할 하위 블록을 추가하세요.
                  </p>
                )}
              </div>

              {/* False Blocks Container */}
              <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/40 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-700 font-bold mb-1">
                  <span>아니면 실행할 블록 (Else)</span>
                  <div className="flex gap-1.5">
                    {['MsgBox', 'SetCell', 'SetControlProperty', 'CloseForm'].map((subType) => (
                      <button
                        key={subType}
                        onClick={() => handleAddSubBlock(block.id, 'false', subType as any)}
                        className="bg-white hover:bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-700"
                      >
                        + {subType}
                      </button>
                    ))}
                  </div>
                </div>

                {block.falseBlocks && block.falseBlocks.length > 0 ? (
                  block.falseBlocks.map((fb, idx) => renderSingleBlock(fb, idx, true, block.id, 'false'))
                ) : (
                  <p className="text-[10px] text-slate-400 italic text-center py-2">
                    (선택사항) 조건에 맞지 않을 때 수행할 동작이 있다면 추가하세요.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 9. Loop (For...Next) */}
          {block.type === 'Loop' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bold text-orange-800 shrink-0">반복 변수</span>
                <input
                  type="text"
                  value={block.loopVar}
                  onChange={(e) => handleUpdateBlock(block.id, { loopVar: e.target.value.replace(/\s+/g, '') })}
                  className="w-16 p-2 border border-slate-200 rounded-md bg-white font-mono text-center text-xs"
                />
                <span className="font-bold text-orange-800 shrink-0">를</span>
                <input
                  type="text"
                  value={block.loopStart}
                  onChange={(e) => handleUpdateBlock(block.id, { loopStart: e.target.value })}
                  className="w-16 p-2 border border-slate-200 rounded-md bg-white font-mono text-center text-xs"
                />
                <span className="font-bold text-orange-800 shrink-0">부터</span>
                <input
                  type="text"
                  value={block.loopEnd}
                  onChange={(e) => handleUpdateBlock(block.id, { loopEnd: e.target.value })}
                  className="w-16 p-2 border border-slate-200 rounded-md bg-white font-mono text-center text-xs"
                />
                <span className="font-bold text-orange-800 shrink-0">까지 반복</span>
              </div>

              {/* Loop Blocks Container */}
              <div className="border border-dashed border-orange-300 rounded-lg p-3 bg-orange-50/40 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-orange-800 font-bold mb-1">
                  <span>반복 내부 실행 블록</span>
                  <div className="flex gap-1.5">
                    {['MsgBox', 'SetCell', 'SetControlProperty'].map((subType) => (
                      <button
                        key={subType}
                        onClick={() => handleAddSubBlock(block.id, 'loop', subType as any)}
                        className="bg-white hover:bg-orange-100 border border-orange-300 px-1.5 py-0.5 rounded text-[9px] font-medium text-orange-800"
                      >
                        + {subType}
                      </button>
                    ))}
                  </div>
                </div>

                {block.loopBlocks && block.loopBlocks.length > 0 ? (
                  block.loopBlocks.map((lb, idx) => renderSingleBlock(lb, idx, true, block.id, 'loop'))
                ) : (
                  <p className="text-[10px] text-slate-400 italic text-center py-2">
                    여기에 반복할 동작 블록을 추가하세요.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full" id="logic_builder_container">
      
      {/* 1. Event Selection & Block Vault */}
      <div className="lg:col-span-4 flex flex-col gap-4 border border-purple-500/20 bg-[#0b0521] p-4 rounded-lg shadow-xl">
        <div className="border-b border-purple-950/40 pb-3">
          <label className="block text-xs font-bold text-pink-400 mb-1.5">1. 대상 객체 및 이벤트 선택</label>
          <select
            value={selectedElementId || ''}
            onChange={(e) => onSetActiveElementId(e.target.value || null)}
            className="w-full p-2 border border-purple-900/50 rounded bg-[#130d35] text-xs font-semibold text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 shadow-sm"
          >
            {eventTriggerElements.map((el) => (
              <option key={el.id} value={el.id} className="bg-[#130d35] text-white">
                {el.name} ({el.type === 'UserForm' ? '유저폼 기동시' : `${el.caption} 클릭시`})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            이벤트 핸들러: <span className="font-mono text-cyan-400 font-bold">{selectedElement?.name}_{activeEventName}</span>
          </p>
        </div>

        <div>
          <h4 className="text-[11px] font-bold text-pink-400 uppercase tracking-wider mb-2">
            2. 블록 보관함 (Block Palette)
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">
            요소를 조립창에 삽입하려면 아래 블록을 클릭하세요.
          </p>

          <div className="flex flex-col gap-2">
            {[
              { type: 'Variable', label: 'VBA 변수 정의 (Dim)', color: 'border-cyan-500/30 bg-[#0e2542] hover:bg-[#15345a] text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.1)]' },
              { type: 'SetCell', label: '엑셀 셀 값 대입 (Set Cell)', color: 'border-emerald-500/30 bg-[#0c2e28] hover:bg-[#13443a] text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.1)]' },
              { type: 'GetCell', label: '엑셀 셀 값 변수화 (Get Cell)', color: 'border-emerald-500/30 bg-[#0c2e28] hover:bg-[#13443a] text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.1)]' },
              { type: 'SetControlProperty', label: '요소 속성 변경 (Property)', color: 'border-purple-500/30 bg-[#241249] hover:bg-[#321c5f] text-purple-300 shadow-[0_0_8px_rgba(139,92,246,0.1)]' },
              { type: 'Condition', label: '조건문 설정 (If...Else)', color: 'border-amber-500/30 bg-[#311f18] hover:bg-[#462d22] text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.1)]' },
              { type: 'Loop', label: '반복문 설정 (For...Next)', color: 'border-orange-500/30 bg-[#3a1d12] hover:bg-[#522b1a] text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.1)]' },
              { type: 'MsgBox', label: '경고/알림창 (MsgBox)', color: 'border-blue-500/30 bg-[#0e2049] hover:bg-[#18316c] text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.1)]' },
              { type: 'CloseForm', label: '폼 닫기 (Unload Me)', color: 'border-rose-500/30 bg-[#3b0b23] hover:bg-[#571437] text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.1)]' },
              { type: 'VBAExpression', label: '고급 스크립트 직접 쓰기', color: 'border-pink-500/30 bg-[#2b0820] hover:bg-[#3d102e] text-pink-300 shadow-[0_0_8px_rgba(236,72,153,0.1)]' },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleAddBlock(btn.type as BlockType)}
                className={`flex justify-between items-center p-2.5 border rounded text-left text-[11px] font-semibold transition cursor-pointer shadow-md ${btn.color}`}
              >
                <span>{btn.label}</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Block Stack Workspace */}
      <div className="lg:col-span-8 border border-purple-500/20 bg-[#0b0521] p-4 rounded-lg flex flex-col min-h-[400px] shadow-xl">
        <div className="flex items-center justify-between border-b border-purple-950/40 pb-2 mb-4 shrink-0">
          <div>
            <h3 className="font-bold text-pink-400 text-xs flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-pink-500" />
              블록 조립 영역 (Block Workspace)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              레고처럼 블록을 쌓고 매개변수 값을 조정해 동작 원리를 결정합니다.
            </p>
          </div>

          <span className="text-[10px] bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-bold text-purple-300">
            블록 개수: {activeEvent.blocks.length}개
          </span>
        </div>

        {/* Workspace List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {activeEvent.blocks.length > 0 ? (
            activeEvent.blocks.map((block, idx) => renderSingleBlock(block, idx))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 border border-dashed border-purple-500/20 rounded bg-[#100b2b]/40 my-auto">
              <PlusCircle className="w-10 h-10 text-pink-500/30 mb-2.5" />
              <p className="text-xs font-bold text-slate-200">조립 영역이 비어 있습니다</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-sm">
                왼쪽 "블록 보관함"에서 원하는 로직 블록들을 하나씩 추가하여 순서대로 작업을 누적 쌓아 올려 보세요.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
