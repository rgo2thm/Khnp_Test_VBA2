/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { generateFrmContent, generateBasContent, triggerFileDownload } from '../utils/vbaGenerator';
import { UIElement, ControlEvent } from '../types';
import { Terminal, Download, Copy, Check, Info, FileCode, Edit3, Eye, RotateCcw } from 'lucide-react';

interface CodePreviewProps {
  elements: UIElement[];
  events: ControlEvent[];
}

export default function CodePreview({ elements, events }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<'frm' | 'bas' | 'readme'>('frm');
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const formElement = elements.find((el) => el.type === 'UserForm')!;
  
  const [frmCode, setFrmCode] = useState('');
  const [basCode, setBasCode] = useState('');
  const [readmeCode, setReadmeCode] = useState('');

  const [prevDefaultFrm, setPrevDefaultFrm] = useState('');
  const [prevDefaultBas, setPrevDefaultBas] = useState('');

  const readmeText = `=========================================================================
  비주얼 VBA 웹 에디터 - 오프라인 엑셀 파일 가져오기(Import) 가이드
=========================================================================

다운로드한 .frm 및 .bas 파일을 엑셀에 연동하려면 아래 절차를 차례대로 따르십시오.
인터넷 연결이 필요 없는 100% 사내망(폐쇄망) 환경 전용 가이드입니다.

1단계: 준비 단계
--------------------------------------------------
1. 본인의 엑셀(MS Excel) 작업 창을 엽니다.
2. 키보드 단축키 [Alt + F11]을 눌러 VBE(Visual Basic Editor) 편집기 창을 기동합니다.

2단계: 파일 가져오기 (Import File)
--------------------------------------------------
1. VBE 편집기 상단 메뉴에서 [파일(F)] ➔ [파일 가져오기(I)...] 메뉴를 차례로 클릭합니다.
2. 다운로드받은 파일 중 "${formElement.name}.frm" 파일을 찾아 선택하고 [열기]를 누릅니다.
   - 폼 디자인이 엑셀 좌측 프로젝트 탐색기에 '폼' 폴더 아래에 정상 유입된 것을 확인합니다.
3. 다시 [파일(F)] ➔ [파일 가져오기(I)...]를 누릅니다.
4. 이번에는 "VBA_LowCode_Module.bas" 파일을 찾아 선택하고 [열기]를 누릅니다.
   - '모듈' 폴더 아래에 매크로 부팅 모듈이 추가됩니다.

3단계: 매크로 실행 및 테스트
--------------------------------------------------
1. 엑셀 워크시트로 돌아가서 [Alt + F8] 키를 누릅니다.
2. 매크로 목록에서 "ShowUserForm" 매크로를 선택하고 [실행] 단추를 누릅니다.
3. 웹 에디터에서 정성스레 구성한 현대적인 입력 폼 화면이 엑셀에 그대로 팝업 기동되며 작동합니다!
4. 데이터 입력 후 버튼을 누르면 엑셀 행과 셀에 데이터가 순차적으로 기록되는지 확인하세요.

--------------------------------------------------
제작자: 사내망 Low-Code 비주얼 VBA 웹 에디터 런타임 엔진
공동 협조: 프론트엔드 아키텍처 & 시니어 PM 설계본부
`;

  const currentDefaultFrm = generateFrmContent(formElement, elements, events);
  const currentDefaultBas = generateBasContent(formElement.name);
  const currentDefaultReadme = readmeText;

  useEffect(() => {
    const nextFrm = currentDefaultFrm;
    const nextBas = currentDefaultBas;

    if (!frmCode || frmCode === prevDefaultFrm) {
      setFrmCode(nextFrm);
    }
    setPrevDefaultFrm(nextFrm);

    if (!basCode || basCode === prevDefaultBas) {
      setBasCode(nextBas);
    }
    setPrevDefaultBas(nextBas);

    if (!readmeCode) {
      setReadmeCode(readmeText);
    }
  }, [elements, events, formElement.name]);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'frm':
        return frmCode;
      case 'bas':
        return basCode;
      case 'readme':
        return readmeCode;
    }
  };

  const handleCodeChange = (newVal: string) => {
    switch (activeTab) {
      case 'frm':
        setFrmCode(newVal);
        break;
      case 'bas':
        setBasCode(newVal);
        break;
      case 'readme':
        setReadmeCode(newVal);
        break;
    }
  };

  const isCurrentTabModified = () => {
    switch (activeTab) {
      case 'frm':
        return frmCode !== currentDefaultFrm;
      case 'bas':
        return basCode !== currentDefaultBas;
      case 'readme':
        return readmeCode !== currentDefaultReadme;
    }
  };

  const handleRestoreCurrent = () => {
    if (window.confirm('현재 탭의 코드를 자동 생성된 초기 코드로 복원하시겠습니까? 수동 수정한 내용은 지워집니다.')) {
      switch (activeTab) {
        case 'frm':
          setFrmCode(currentDefaultFrm);
          break;
        case 'bas':
          setBasCode(currentDefaultBas);
          break;
        case 'readme':
          setReadmeCode(currentDefaultReadme);
          break;
      }
    }
  };

  const getActiveFilename = () => {
    switch (activeTab) {
      case 'frm':
        return `${formElement.name}.frm`;
      case 'bas':
        return `VBA_LowCode_Module.bas`;
      case 'readme':
        return `VBA_Import_Guide.txt`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    triggerFileDownload(getActiveFilename(), getActiveCode());
  };

  const handleDownloadAll = () => {
    triggerFileDownload(`${formElement.name}.frm`, frmCode);
    setTimeout(() => {
      triggerFileDownload(`VBA_LowCode_Module.bas`, basCode);
    }, 200);
    setTimeout(() => {
      triggerFileDownload(`VBA_Import_Guide.txt`, readmeCode);
    }, 400);
  };

  // Simple, elegant client-side highlight decorator for standard VBA keywords
  const renderHighlightedCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      // Split by quotes to protect strings from keyword highlighting
      const parts = line.split(/("[^"]*")/g);
      const highlightedParts = parts.map((part, pIdx) => {
        // If it is a string literal, color it differently
        if (part.startsWith('"') && part.endsWith('"')) {
          return <span key={pIdx} className="text-emerald-400">{part}</span>;
        }
        // If it is a comment, color it green and return remaining
        if (part.includes("'")) {
          const comIdx = part.indexOf("'");
          const codePart = part.substring(0, comIdx);
          const commentPart = part.substring(comIdx);
          return (
            <span key={pIdx}>
              {highlightKeywords(codePart)}
              <span className="text-slate-400 italic">{commentPart}</span>
            </span>
          );
        }
        return highlightKeywords(part);
      });

      return (
        <div key={idx} className="table-row">
          <span className="table-cell text-right pr-4 text-slate-500 font-mono text-[10px] select-none w-8 border-r border-slate-800/50">
            {idx + 1}
          </span>
          <span className="table-cell pl-4 font-mono text-[11.5px] whitespace-pre text-slate-200">
            {highlightedParts}
          </span>
        </div>
      );
    });
  };

  const highlightKeywords = (text: string) => {
    const words = text.split(/(\s+|,|\.|\(|\)|=|<|>|\+|-|\*|\/|&|\[|\])/);
    
    // VBA keywords
    const keywords = new Set([
      'VERSION', 'Begin', 'End', 'Attribute', 'VB_Name', 'VB_GlobalNameSpace', 
      'VB_Creatable', 'VB_PredeclaredId', 'VB_Exposed', 'Dim', 'As', 'Sub', 'Private', 
      'Public', 'End Sub', 'End Sub', 'If', 'Then', 'Else', 'ElseIf', 'End If', 
      'For', 'To', 'Next', 'Unload', 'Me', 'True', 'False', 'Sheets', 'Range', 
      'ActiveSheet', 'MsgBox', 'vbInformation', 'vbExclamation', 'vbCritical', 
      'Val', 'Long', 'String', 'Integer', 'Double', 'ActiveSheet', 'Cells', 'Rows', 'Count'
    ]);

    return words.map((word, index) => {
      if (keywords.has(word)) {
        return <span key={index} className="text-pink-400 font-semibold">{word}</span>;
      }
      if (!isNaN(Number(word.trim())) && word.trim() !== '') {
        return <span key={index} className="text-amber-400">{word}</span>;
      }
      return word;
    });
  };

  return (
    <div className="bg-[#0b0521] rounded-xl shadow-xl border border-purple-500/20 overflow-hidden h-full flex flex-col" id="code_preview_root">
      
      {/* Editor Tab Header */}
      <div className="bg-[#04010a]/90 px-4 py-3 border-b border-purple-950/40 flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-pink-500" />
          <span className="text-xs font-bold text-pink-400">💻 하이브리드 VBA 코드 에디터</span>
        </div>

        <div className="flex gap-1.5 bg-[#130d35] p-1 rounded-lg border border-purple-900/40">
          <button
            onClick={() => setActiveTab('frm')}
            className={`px-3 py-1 rounded-md text-[10.5px] font-semibold transition cursor-pointer ${
              activeTab === 'frm' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {formElement.name}.frm (디자인+코드)
          </button>
          <button
            onClick={() => setActiveTab('bas')}
            className={`px-3 py-1 rounded-md text-[10.5px] font-semibold transition cursor-pointer ${
              activeTab === 'bas' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VBA_Module.bas (호출모듈)
          </button>
          <button
            onClick={() => setActiveTab('readme')}
            className={`px-3 py-1 rounded-md text-[10.5px] font-semibold transition cursor-pointer ${
              activeTab === 'readme' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            사용 가이드 (Guide)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit/View Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isEditMode 
                ? 'bg-pink-600 border-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]' 
                : 'bg-[#130d35] border-purple-500/30 text-purple-300 hover:text-white hover:bg-[#1e1450]'
            }`}
            title={isEditMode ? '뷰어 모드로 전환' : '직접 코드 수정하기'}
          >
            {isEditMode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditMode ? '뷰어 (Viewer)' : '직접 수정 (Edit)'}</span>
          </button>

          {/* Restore Button */}
          {isCurrentTabModified() && (
            <button
              onClick={handleRestoreCurrent}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1b0d45] hover:bg-pink-900/30 border border-pink-500/40 text-pink-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              title="원래 생성된 코드로 복원"
            >
              <RotateCcw className="w-3.5 h-3.5 text-pink-500" />
              <span className="hidden md:inline">복원</span>
            </button>
          )}

          <div className="w-[1px] h-4 bg-purple-500/20 mx-1" />

          <button
            onClick={handleCopy}
            className="p-1.5 bg-[#130d35] hover:bg-[#1e1450] text-purple-300 hover:text-white rounded-lg border border-purple-500/30 transition cursor-pointer"
            title="현재 코드 복사"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownloadSingle}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
            title="현재 파일 개별 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span>이 파일 다운로드</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-hidden bg-slate-950/85 font-mono text-slate-300 min-h-[350px] relative flex flex-col">
        {isEditMode ? (
          <div className="flex-1 p-2 relative flex flex-col h-full min-h-0">
            {/* Soft indicator of editing */}
            <div className="absolute top-3 right-5 z-10 px-2 py-0.5 bg-pink-950/50 border border-pink-500/30 text-pink-400 text-[10px] rounded select-none font-sans font-bold">
              EDITING MODE
            </div>
            <textarea
              value={getActiveCode()}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="flex-1 w-full h-full bg-slate-950/40 text-slate-200 font-mono text-[11.5px] p-4 border-0 focus:ring-0 outline-none resize-none leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-purple-900/50"
              placeholder="여기에 VBA 코드를 입력하여 수정하실 수 있습니다..."
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <div className="table w-full border-collapse">
              {renderHighlightedCode(getActiveCode())}
            </div>
          </div>
        )}
      </div>

      {/* Editor Bottom Actions Info */}
      <div className="bg-[#04010a]/90 p-3 border-t border-purple-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-pink-500 shrink-0" />
          <span>수정한 내용도 "이 파일 다운로드" 및 "일괄 다운로드"를 통해 실시간으로 반영되어 저장됩니다.</span>
        </div>

        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0c2e28] hover:bg-[#13443a] text-emerald-300 border border-emerald-500/30 hover:text-white rounded-lg text-xs font-bold shadow-md transition self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <FileCode className="w-4 h-4" />
          <span>VBA 프로젝트 일괄 다운로드 (.ZIP 세트)</span>
        </button>
      </div>

    </div>
  );
}
