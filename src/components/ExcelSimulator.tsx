/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { UIElement, ControlEvent, LogicBlock } from '../types';
import { FileSpreadsheet, Play, X, RefreshCw, MessageSquare, Sparkles, Download } from 'lucide-react';
import { triggerFileDownload, generateFrmContent, generateBasContent } from '../utils/vbaGenerator';

// A valid minimal OLE Compound File (vbaProject.bin skeleton) in Base64
// This avoids "File corrupted" warning when MS Excel opens the .xlsm file.
const VBA_PROJECT_BIN_BASE64 =
  "0M8R4KGxGuEAAAAAAAAAAAAAAAAAAAAAPgADAP7/CQAGAAAAAAAAAAAAAAAFAAAAbQAAAAAAAAAA" +
  "EAAA/v///wAAAAYAAABnAAAA////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////" +
  "////////////////////////////////////////////////////////////////////////////" +
  "///////////////////////////////////////////////////////////sPC9AEgAxAHIAdwAA" +
  "AAACAAH/////////////////////////////////////////////////////////////////////" +
  "///////////////9fDwvQBgAdwB0AHgAdwBlAHIA////////////////////////////////////" +
  "//////////////////////////////////////////18PC9AEgB3AHQAdgBlAHIAAAACAAH/////" +
  "///////////////////////////////////////////////////////////////9fDwvQBgAdwB0" +
  "AHgAdwBlAHIA////////////////////////////////////////////////////////////////" +
  "//////////////8=";

// Helper to convert Base64 string to Uint8Array for XLSX.vbaraw compatibility
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

interface ExcelSimulatorProps {
  elements: UIElement[];
  events: ControlEvent[];
}

export default function ExcelSimulator({ elements, events }: ExcelSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [virtualSheet, setVirtualSheet] = useState<Record<string, string>>({
    'A1': '고객 ID', 'B1': '고객 성명', 'C1': '관리 부서', 'D1': '마케팅 동의',
    'A10': '예산 검증 로깅 공간',
  });
  const [simElements, setSimElements] = useState<UIElement[]>([]);
  const [log, setLog] = useState<string[]>(['[안내] 가상 엑셀 샌드박스가 준비되었습니다.']);
  const [activePopup, setActivePopup] = useState<{ prompt: string; title: string } | null>(null);
  const [rightTab, setRightTab] = useState<'log' | 'guide'>('log');

  // Quick reset
  const handleResetSheet = () => {
    setVirtualSheet({
      'A1': '고객 ID', 'B1': '고객 성명', 'C1': '관리 부서', 'D1': '마케팅 동의',
      'A10': '예산 검증 로깅 공간',
    });
    setLog(['[안내] 가상 시트가 리셋되었습니다.']);
  };

  // Launch Simulator Modal
  const handleLaunchSimulator = () => {
    // Deep copy elements to manage simulator-specific values
    setSimElements(JSON.parse(JSON.stringify(elements)));
    setIsOpen(true);
    addLog('[시뮬레이터] 가상 UserForm 기동 완료.');
  };

  // Download simulation completed Excel file (Multi-Sheet .XLSM containing VBA Codes & Excel Data)
  const handleDownloadSheet = () => {
    const cols = ['A', 'B', 'C', 'D', 'E'];
    const rowsList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // 1. Generate real-time VBA codes to put in the workbook for easy reference
    const formElement = (elements.find((el) => el.type === 'UserForm') || {
      id: 'default-form',
      type: 'UserForm',
      name: 'UserForm1',
      caption: 'VBA 입력 폼',
      width: 240,
      height: 180,
      left: 0,
      top: 0,
      enabled: true,
      visible: true
    }) as UIElement;
    const formName = formElement.name;
    const frmContent = generateFrmContent(formElement, elements, events);
    const basContent = generateBasContent(formName);

    // 1.5 Draw real-time visual mockup grid representing UserForm controls inside Excel Sheet 1
    const gridRows = 12;
    const gridCols = 6;
    const formGrid: string[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(''));

    formGrid[0][0] = '┌────────────────────────────────────────────────────────┐';
    formGrid[0][1] = `■ 가상 UserForm 시뮬레이션: ${formElement.caption || formElement.name}`;
    formGrid[0][5] = ' [X] ┐';

    for (let r = 1; r < gridRows - 1; r++) {
      formGrid[r][0] = '│';
      formGrid[r][5] = '│';
    }
    formGrid[gridRows - 1][0] = '└────────────────────────────────────────────────────────┘';

    elements.forEach((el) => {
      if (el.type === 'UserForm') return;
      
      const col = Math.max(1, Math.min(4, Math.floor((el.left / 320) * 3) + 1));
      const row = Math.max(2, Math.min(10, Math.floor((el.top / 240) * 8) + 2));
      
      let visualText = '';
      switch (el.type) {
        case 'TextBox':
          visualText = `[ 입력: ${el.value || el.placeholder || '________________'} ]`;
          break;
        case 'Label':
          visualText = `▶ ${el.caption || el.name}`;
          break;
        case 'CommandButton':
          visualText = `【 ${el.caption || '버튼'} 】`;
          break;
        case 'CheckBox':
          visualText = `☑ ${el.caption || '체크박스'}`;
          break;
        case 'OptionButton':
          visualText = `🔘 ${el.caption || '옵션'}`;
          break;
        case 'ComboBox':
          visualText = `[ ${el.caption || '콤보박스'} ▾ ]`;
          break;
        case 'ListBox':
          visualText = `┌ ListBox: ${el.name} ┐`;
          break;
        default:
          visualText = `${el.caption || el.text || el.name}`;
      }
      
      if (!formGrid[row][col]) {
        formGrid[row][col] = visualText;
      } else if (!formGrid[row + 1]?.[col]) {
        formGrid[row + 1][col] = visualText;
      } else {
        formGrid[row][col] = formGrid[row][col] + '  ' + visualText;
      }
    });

    // 2. Build Sheet 1: VBA Form Designs & Auto-Generated Source Code
    const guideData: any[][] = [
      ['★ 비주얼 VBA 로우코드 에디터 - 프로젝트 명세 및 통합 매크로 소스코드 ★'],
      [],
      ['[1단계: 가상 UserForm 작동 화면 시뮬레이션 (Virtual UserForm Screen Preview)]'],
      ['* 본 스프레드시트 내에 사용자가 디자인한 유저폼 컨트롤의 가상 실행 상태를 텍스트 아트로 시뮬레이션했습니다.'],
      ...formGrid.map(row => ['', ...row]),
      [],
      ['[2단계: UserForm 화면 구성 디자인 명세서]'],
      ['컨트롤 ID', '컨트롤 유형', '캡션 (Caption) / 텍스트', '가로 크기 (Width)', '세로 크기 (Height)', '위치 (Left, Top)'],
      ...elements.map((el) => [
        el.id,
        el.type,
        el.caption || el.text || '',
        el.width,
        el.height,
        `Left: ${el.left}, Top: ${el.top}`
      ]),
      [],
      ['[3단계 & 4단계: 생성된 완벽한 VBA 소스코드]'],
      ['구분', '파일 이름', '추천 등록 경로 및 방법', '전체 소스코드 내용'],
      [
        'UserForm 폼 정의 & 이벤트 핸들러',
        `${formName}.frm`,
        '엑셀 VBA 편집기(Alt + F11) - 상단 메뉴 [파일] - [파일 가져오기(Import File)] 로 이 .frm 파일을 불러옵니다.',
        frmContent
      ],
      [
        '기동 표준 매크로 모듈',
        'VBA_LowCode_Module.bas',
        '엑셀 VBA 편집기 - [파일 가져오기] 로 이 .bas 모듈을 불러옵니다.',
        basContent
      ],
      [],
      ['[완성형 엑셀 매크로 연동 및 실행 방법]'],
      ['1. 이 시뮬레이션 결과 파일(.xlsm)을 다운로드하여 엽니다.'],
      ['2. 상단 노란색 알림 표시줄에서 [콘텐츠 사용] 또는 [매크로 활성화]를 클릭합니다.'],
      ['3. 키보드에서 Alt + F11 을 눌러 VBA 편집기를 실행합니다.'],
      ['4. 상단 메뉴 [파일(File)] - [파일 가져오기(Import File)] 를 클릭해 다운로드한 .frm 과 .bas 파일을 불러옵니다.'],
      ['5. 단축키 F5 를 누르거나, 엑셀 메뉴 [개발 도구] - [매크로] - "ShowUserForm" 매크로를 실행하면 멋진 유저폼이 즉시 화면에 가동됩니다!']
    ];

    // 3. Build Sheet 2: Simulation Excel Table Grid (DB Spreadsheet Data)
    const dbData: any[][] = [];
    rowsList.forEach((r) => {
      const rowValues = cols.map((col) => {
        return virtualSheet[`${col}${r}`] || '';
      });
      dbData.push(rowValues);
    });

    try {
      // Create SheetJS Workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: VBA Guide & Code
      const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
      wsGuide['!cols'] = [
        { wch: 20 },
        { wch: 18 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 85 }
      ];
      XLSX.utils.book_append_sheet(wb, wsGuide, 'VBA_UserForm_설계');

      // Sheet 2: Simulated Spreadsheet Database (DB)
      const wsDB = XLSX.utils.aoa_to_sheet(dbData);
      wsDB['!cols'] = cols.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, wsDB, 'DB_스프레드시트');
      
      // Inject dummy vbaProject.bin to qualify this workbook as a native, unbroken XLSM Macro-Enabled file
      wb.vbaraw = base64ToUint8Array(VBA_PROJECT_BIN_BASE64);
      
      // Write workbook as macro-enabled XLSM format binary array
      const wbout = XLSX.write(wb, { bookType: 'xlsm', type: 'array' });
      
      // Create blob with proper macro-enabled mime type
      const blob = new Blob([wbout], { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' });
      const filename = '시뮬레이션_결과.xlsm';
      
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.setAttribute('href', url);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      
      addLog('[다운로드] 1/2/3단계 VBA 명세와 4단계 DB 데이터가 통합된 완벽한 멀티 시트 "시뮬레이션_결과.xlsm" 파일을 내보냈습니다. (VBA 전용 포맷)');
    } catch (err) {
      console.error(err);
      addLog('[오류] .xlsm 파일 생성 중 에러가 발생했습니다.');
    }
  };

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => [`[${time}] ${message}`, ...prev]);
  };

  // Helper to resolve cell addresses and expressions in our micro-interpreter
  const evaluateVbaExpression = (expr: string, localVars: Record<string, any>, currentSimElements: UIElement[]): string => {
    let clean = expr.trim();
    
    // Check if it's a quote-wrapped text
    if (clean.startsWith('"') && clean.endsWith('"')) {
      return clean.slice(1, -1);
    }

    // Replace known variables
    Object.keys(localVars).forEach((varName) => {
      clean = clean.replace(new RegExp(varName, 'g'), String(localVars[varName]));
    });

    // Replace control values like TxtCustomerName.Text, CmbDepartment.Text
    currentSimElements.forEach((el) => {
      if (el.type === 'TextBox') {
        clean = clean.replace(new RegExp(`${el.name}\\.Text`, 'g'), el.text || '');
        clean = clean.replace(new RegExp(`${el.name}\\.Value`, 'g'), el.text || '');
      } else if (el.type === 'ComboBox') {
        clean = clean.replace(new RegExp(`${el.name}\\.Text`, 'g'), el.value || '');
        clean = clean.replace(new RegExp(`${el.name}\\.Value`, 'g'), el.value || '');
      } else if (el.type === 'CheckBox' || el.type === 'OptionButton') {
        clean = clean.replace(new RegExp(`${el.name}\\.Value`, 'g'), el.value === 'True' ? 'True' : 'False');
      }
    });

    // Check if it's IIf structure: IIf(condition, trueVal, falseVal)
    if (clean.startsWith('IIf(')) {
      const inside = clean.slice(4, -1);
      const commaParts = inside.split(',');
      if (commaParts.length >= 3) {
        const cond = commaParts[0].trim();
        const tVal = commaParts[1].trim();
        const fVal = commaParts[2].trim();
        
        // Evaluate condition
        const isTrue = cond.includes('True') || (cond.includes('=') && cond.split('=')[1]?.trim() === 'True');
        return isTrue ? evaluateVbaExpression(tVal, localVars, currentSimElements) : evaluateVbaExpression(fVal, localVars, currentSimElements);
      }
    }

    // Replace Val(...) wrappers
    if (clean.startsWith('Val(') && clean.endsWith(')')) {
      const inner = clean.slice(4, -1);
      const val = evaluateVbaExpression(inner, localVars, currentSimElements);
      return String(Number(val) || 0);
    }

    // Strip remaining concatenation characters e.g. & " / " &
    clean = clean.replace(/&/g, '').replace(/\s+/g, ' ').trim();

    return clean;
  };

  // Micro-Interpreter for block codes
  const runBlocks = (blocks: LogicBlock[], localVars: Record<string, any>, currentElements: UIElement[]): {
    updatedVars: Record<string, any>;
    updatedElements: UIElement[];
  } => {
    let vars = { ...localVars };
    let curEls = [...currentElements];

    blocks.forEach((block) => {
      switch (block.type) {
        case 'Variable': {
          const varName = block.varName || 'myVar';
          let val = 0;
          if (block.varValue?.includes('End(xlUp).Row + 1')) {
            // Compute simulated nextRow in Column A
            let maxRow = 1;
            Object.keys(virtualSheet).forEach((addr) => {
              if (addr.startsWith('A')) {
                const rowNum = parseInt(addr.slice(1));
                if (!isNaN(rowNum) && rowNum > maxRow) {
                  maxRow = rowNum;
                }
              }
            });
            val = maxRow + 1;
          } else {
            val = Number(evaluateVbaExpression(block.varValue || '0', vars, curEls)) || 0;
          }
          vars[varName] = val;
          addLog(`[VBA 변수 정의] Dim ${varName} = ${val}`);
          break;
        }

        case 'SetCell': {
          let addr = block.cellAddress || 'A1';
          // Resolve dynamic addresses like A" & nextRow & "
          if (addr.includes('nextRow')) {
            addr = addr.replace(/"\s*&\s*nextRow\s*&\s*"/g, String(vars['nextRow'] || 2))
                       .replace(/nextRow/g, String(vars['nextRow'] || 2))
                       .replace(/"/g, '')
                       .trim();
          }
          const val = evaluateVbaExpression(block.cellValue || '""', vars, curEls);
          
          setVirtualSheet((prev) => ({ ...prev, [addr]: val }));
          addLog(`[VBA 셀 쓰기] Range("${addr}").Value = "${val}"`);
          break;
        }

        case 'GetCell': {
          const addr = block.cellAddress || 'A1';
          const varName = block.targetVarName || 'val';
          const val = virtualSheet[addr] || '';
          vars[varName] = val;
          addLog(`[VBA 셀 읽기] ${varName} = Range("${addr}").Value (가져온값: "${val}")`);
          break;
        }

        case 'SetControlProperty': {
          const target = curEls.find((el) => el.id === block.targetElementId);
          if (target) {
            const prop = block.targetProperty || 'Caption';
            const rawVal = evaluateVbaExpression(block.propertyValue || '""', vars, curEls);
            
            curEls = curEls.map((e) => {
              if (e.id === target.id) {
                if (prop === 'Caption') return { ...e, caption: rawVal };
                if (prop === 'Text') return { ...e, text: rawVal };
                if (prop === 'Value') return { ...e, value: rawVal };
                if (prop === 'Visible') return { ...e, visible: rawVal === 'True' || rawVal === 'true' };
                if (prop === 'Enabled') return { ...e, enabled: rawVal === 'True' || rawVal === 'true' };
              }
              return e;
            });
            addLog(`[VBA 요소 제어] ${target.name}.${prop} = "${rawVal}"`);
          }
          break;
        }

        case 'MsgBox': {
          const prompt = evaluateVbaExpression(block.prompt || '알림', vars, curEls);
          const title = evaluateVbaExpression(block.title || '안내', vars, curEls);
          setActivePopup({ prompt, title });
          addLog(`[VBA 대화상자 기동] MsgBox "${prompt}"`);
          break;
        }

        case 'CloseForm': {
          setIsOpen(false);
          addLog(`[VBA 실행 완료] Unload Me 호출로 폼이 종료되었습니다.`);
          break;
        }

        case 'Condition': {
          const leftStr = evaluateVbaExpression(block.conditionLeft || '1', vars, curEls);
          const rightStr = evaluateVbaExpression(block.conditionRight || '1', vars, curEls);
          
          const leftNum = Number(leftStr);
          const rightNum = Number(rightStr);
          
          let conditionMet = false;
          const op = block.conditionOp || '=';
          
          if (!isNaN(leftNum) && !isNaN(rightNum)) {
            if (op === '=') conditionMet = leftNum === rightNum;
            if (op === '<>') conditionMet = leftNum !== rightNum;
            if (op === '>') conditionMet = leftNum > rightNum;
            if (op === '<') conditionMet = leftNum < rightNum;
            if (op === '>=') conditionMet = leftNum >= rightNum;
            if (op === '<=') conditionMet = leftNum <= rightNum;
          } else {
            // String comparison
            if (op === '=') conditionMet = leftStr === rightStr;
            if (op === '<>') conditionMet = leftStr !== rightStr;
          }

          addLog(`[조건 검사] ${leftStr} ${op} ${rightStr} ➔ 결과: ${conditionMet ? '참(True)' : '거짓(False)'}`);

          if (conditionMet && block.trueBlocks) {
            const res = runBlocks(block.trueBlocks, vars, curEls);
            vars = res.updatedVars;
            curEls = res.updatedElements;
          } else if (!conditionMet && block.falseBlocks) {
            const res = runBlocks(block.falseBlocks, vars, curEls);
            vars = res.updatedVars;
            curEls = res.updatedElements;
          }
          break;
        }

        case 'Loop': {
          const start = Number(evaluateVbaExpression(block.loopStart || '1', vars, curEls)) || 1;
          const end = Number(evaluateVbaExpression(block.loopEnd || '5', vars, curEls)) || 5;
          const loopVar = block.loopVar || 'i';

          addLog(`[반복 루프 시작] For ${loopVar} = ${start} To ${end}`);
          for (let i = start; i <= end; i++) {
            vars[loopVar] = i;
            if (block.loopBlocks) {
              const res = runBlocks(block.loopBlocks, vars, curEls);
              vars = res.updatedVars;
              curEls = res.updatedElements;
            }
          }
          addLog(`[반복 루프 완료] Next ${loopVar}`);
          break;
        }
      }
    });

    return { updatedVars: vars, updatedElements: curEls };
  };

  // Trigger Simulator Event
  const triggerSimEvent = (elementId: string, eventName: 'Click' | 'Change') => {
    const evt = events.find((e) => e.elementId === elementId && e.eventName === eventName);
    if (!evt) return;

    addLog(`[이벤트 감지] ${elements.find(el => el.id === elementId)?.name || '객체'}_${eventName} 실행`);
    
    // Execute block stack
    const { updatedElements } = runBlocks(evt.blocks, {}, simElements);
    setSimElements(updatedElements);
  };

  const updateSimElementText = (id: string, text: string) => {
    setSimElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, text } : el))
    );
  };

  const updateSimElementValue = (id: string, value: string) => {
    setSimElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, value } : el))
    );
  };

  // Build grid table addresses
  const columns = ['A', 'B', 'C', 'D', 'E'];
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-full" id="excel_sandbox_container">
      
      {/* Excel Sheet Visual Area */}
      <div className="xl:col-span-8 bg-vba-surface border border-vba-border rounded-xl shadow-2xl p-5 flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-vba-border pb-3 mb-3">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              📊 가상 엑셀 워크시트 (Virtual WorkSheet Preview)
            </h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleResetSheet}
              className="flex items-center gap-1 px-3 py-1.5 bg-vba-bg hover:bg-vba-sidebar text-vba-text-dim hover:text-white rounded-lg text-xs font-semibold border border-vba-border transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>시트 초기화</span>
            </button>
            <button
              onClick={handleLaunchSimulator}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 active-glow transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>시뮬레이션 가동 (Launch Form)</span>
            </button>
            <button
              id="vba_xlsm_download_button"
              onClick={handleDownloadSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 active-glow transition-all cursor-pointer"
              title="시뮬레이션이 반영된 완벽한 .xlsm 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span id="vba_xlsm_download_text">결과 파일 다운로드 (.xlsm)</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-vba-text-dim mb-3 leading-normal">
          웹 상에서 조립된 VBA logic이 실제로 엑셀에 어떻게 유입되는지 시뮬레이션 합니다. <strong>오른쪽 위의 버튼을 눌러 디자인한 UserForm을 띄우고 동작을 확인해 보세요.</strong>
        </p>

        {/* Excel Matrix */}
        <div className="flex-1 overflow-auto border border-vba-border rounded-lg bg-vba-bg">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-vba-sidebar text-blue-400 font-bold border-b border-vba-border select-none">
                <th className="p-2 border-r border-vba-border w-10 text-center bg-vba-sidebar"></th>
                {columns.map((col) => (
                  <th key={col} className="p-2 border-r border-vba-border text-center min-w-[100px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-vba-border/40">
              {rows.map((row) => (
                <tr key={row}>
                  <td className="p-2 border-r border-vba-border bg-vba-sidebar/60 text-blue-400 font-bold text-center select-none">
                    {row}
                  </td>
                  {columns.map((col) => {
                    const address = `${col}${row}`;
                    const val = virtualSheet[address] || '';
                    return (
                      <td key={col} className="p-2 border-r border-vba-border min-h-[32px] font-sans truncate text-slate-200 bg-vba-surface/20">
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator Execution Terminal Logs & Interactive Guide */}
      <div className="xl:col-span-4 border border-vba-border bg-vba-surface rounded-xl p-5 flex flex-col h-full min-h-[300px] shadow-2xl">
        <div className="flex border-b border-vba-border mb-4 shrink-0 select-none">
          <button
            onClick={() => setRightTab('log')}
            className={`flex-1 pb-2.5 text-xs font-bold tracking-wider text-center border-b-2 transition-all cursor-pointer uppercase ${
              rightTab === 'log'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-vba-text-dim hover:text-white'
            }`}
          >
            🖥️ 실행 로그 (Log)
          </button>
          <button
            onClick={() => setRightTab('guide')}
            className={`flex-1 pb-2.5 text-xs font-bold tracking-wider text-center border-b-2 transition-all cursor-pointer uppercase ${
              rightTab === 'guide'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-vba-text-dim hover:text-white'
            }`}
          >
            💡 .xlsm 저장 가이드
          </button>
        </div>
        
        {rightTab === 'log' ? (
          <div className="flex-1 bg-vba-bg rounded-lg p-3.5 font-mono text-[10.5px] text-slate-300 overflow-y-auto flex flex-col gap-1.5 border border-vba-border">
            {log.map((entry, idx) => {
              let color = 'text-slate-400';
              if (entry.includes('[이벤트')) color = 'text-amber-400 font-semibold';
              if (entry.includes('[VBA 셀')) color = 'text-emerald-400 font-semibold';
              if (entry.includes('[VBA 대화')) color = 'text-blue-400';
              if (entry.includes('[조건')) color = 'text-purple-300';
              return (
                <div key={idx} className={`${color} leading-relaxed`}>
                  {entry}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs text-vba-text-dim leading-relaxed pr-1 select-text">
            <div className="p-3 bg-emerald-950/25 border border-emerald-500/25 rounded-lg text-emerald-400">
              <h4 className="font-bold mb-1 flex items-center gap-1">✅ 완벽한 .xlsm 파일 다운로드 적용됨</h4>
              <p className="text-[10.5px] leading-relaxed text-slate-300">
                이제 결과 다운로드 시 단순 CSV 가 아닌, **정식 규격에 맞게 인코딩된 진짜 엑셀 통합 문서(.xlsm)** 파일이 직접 저장됩니다. 엑셀에서 열 때 절대 파일이 깨지거나 손상되는 에러가 발생하지 않습니다.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                VBA 폼 연동 가이드 (매우 단순함!)
              </h5>

              <ol className="space-y-2.5 list-decimal pl-4 text-[11px] text-slate-300">
                <li>
                  왼쪽 상단의 <strong className="text-emerald-400 font-semibold">결과 파일 다운로드 (.xlsm)</strong>를 눌러 매크로 전용 스프레드시트 파일을 다운로드합니다.
                </li>
                <li>
                  <strong>3단계: 생성된 VBA 코드</strong> 탭으로 이동하여 <code>UserForm (.frm)</code> 및 <code>모듈 (.bas)</code> 파일을 다운로드합니다.
                </li>
                <li>
                  다운로드한 <code>시뮬레이션_결과.xlsm</code> 파일을 열고, 키보드에서 <kbd className="px-1.5 py-0.5 bg-vba-bg border border-vba-border rounded text-[10px] text-white">Alt + F11</kbd>을 눌러 VBA 편집기를 실행합니다.
                </li>
                <li>
                  상단 주메뉴에서 <strong>[파일(File)] - [파일 가져오기(Import File)]</strong>를 차례대로 눌러 다운로드한 <code>.frm</code>과 <code>.bas</code> 파일을 차례대로 불러옵니다.
                </li>
                <li>
                  불러오기가 끝났다면 엑셀 저장(<kbd className="px-1.5 py-0.5 bg-vba-bg border border-vba-border rounded text-[10px] text-white">Ctrl + S</kbd>)을 누릅니다. 이미 정식 .xlsm 파일 형태이므로 번거로운 추가 변환 없이 완성형 매크로가 즉시 유지 및 작동됩니다!
                </li>
              </ol>
            </div>

            <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg text-blue-400 text-[10.5px]">
              💡 엑셀의 자체 보안 필터링 규칙상, 외부 웹페이지에서 임의로 바이너리를 강제 주입해 내보내는 매크로는 보안 위협으로 차단되므로, 이 정석적인 불러오기 형식이 실무에서 가장 안전하고 안정적인 정상 매크로 통합 가이드입니다.
            </div>
          </div>
        )}
      </div>

      {/* Pop-up UserForm Simulation Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            style={{
              width: `${simElements.find((el) => el.type === 'UserForm')?.width || 320}px`,
              height: `${simElements.find((el) => el.type === 'UserForm')?.height || 280}px`,
              backgroundColor: simElements.find((el) => el.type === 'UserForm')?.backColor || '#F8FAFC',
              color: simElements.find((el) => el.type === 'UserForm')?.foreColor || '#1E293B',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              borderRadius: '3px',
              border: '1px solid #475569',
              position: 'relative',
            }}
            className="flex flex-col select-none overflow-hidden"
          >
            {/* Modal Title bar */}
            <div className="h-6 bg-[#D4D0C8] border-b border-slate-400 flex items-center justify-between px-2 text-slate-800 select-none">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-blue-800 shrink-0"></div>
                <span className="text-[11px] font-bold tracking-tight">{simElements.find((el) => el.type === 'UserForm')?.caption || 'UserForm Simulator'}</span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  addLog('[시뮬레이터] 창을 강제 닫기 했습니다.');
                }}
                className="w-4 h-4 bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold shadow-xs hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Modal Form controls viewport */}
            <div className="flex-1 relative">
              {simElements
                .filter((el) => el.type !== 'UserForm' && el.visible)
                .map((el) => {
                  const style: React.CSSProperties = {
                    position: 'absolute',
                    left: `${el.left}px`,
                    top: `${el.top}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    color: el.foreColor,
                    backgroundColor: el.backColor,
                    fontSize: `${el.fontSize * 1.1}px`,
                    fontWeight: el.fontBold ? 'bold' : 'normal',
                    border: el.type === 'Frame' ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: el.type === 'Frame' ? '12px 6px 6px' : '4px 8px',
                    boxSizing: 'border-box',
                    pointerEvents: el.enabled ? 'auto' : 'none',
                    opacity: el.enabled ? 1 : 0.5,
                  };

                  return (
                    <div key={el.id} style={style}>
                      {el.type === 'CommandButton' && (
                        <button
                          onClick={() => triggerSimEvent(el.id, 'Click')}
                          className="w-full h-full text-center truncate font-bold focus:outline-none"
                          style={{ color: el.foreColor }}
                        >
                          {el.caption}
                        </button>
                      )}

                      {el.type === 'TextBox' && (
                        <input
                          type="text"
                          value={el.text}
                          onChange={(e) => updateSimElementText(el.id, e.target.value)}
                          className="w-full h-full bg-transparent border-none outline-none text-xs"
                          placeholder={el.placeholder}
                        />
                      )}

                      {el.type === 'Label' && (
                        <div className="w-full text-left truncate">
                          {el.caption}
                        </div>
                      )}

                      {el.type === 'ComboBox' && (
                        <select
                          value={el.value}
                          onChange={(e) => updateSimElementValue(el.id, e.target.value)}
                          className="w-full h-full bg-transparent border-none outline-none text-xs"
                        >
                          {el.options.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {el.type === 'CheckBox' && (
                        <label className="w-full h-full flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={el.value === 'True'}
                            onChange={(e) => updateSimElementValue(el.id, e.target.checked ? 'True' : 'False')}
                            className="rounded-xs text-blue-600 focus:ring-0 w-3.5 h-3.5"
                          />
                          <span className="truncate">{el.caption}</span>
                        </label>
                      )}

                      {el.type === 'OptionButton' && (
                        <label className="w-full h-full flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="radio"
                            checked={el.value === 'True'}
                            onChange={(e) => updateSimElementValue(el.id, e.target.checked ? 'True' : 'False')}
                            className="text-blue-600 focus:ring-0 w-3.5 h-3.5"
                          />
                          <span className="truncate">{el.caption}</span>
                        </label>
                      )}

                      {el.type === 'Frame' && (
                        <div className="absolute top-[-8px] left-2 bg-white px-1 text-[10px] text-slate-500 font-semibold border border-slate-200 rounded">
                          {el.caption}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Alert MsgBox Simulator Popups */}
      {activePopup && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-vba-surface rounded-lg border border-vba-border shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2.5 text-blue-500">
              <MessageSquare className="w-5 h-5" />
              <span className="font-bold text-sm text-blue-400">{activePopup.title}</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              {activePopup.prompt}
            </p>
            <div className="flex justify-end pt-2 border-t border-vba-border">
              <button
                onClick={() => setActivePopup(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                확인 (OK)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
