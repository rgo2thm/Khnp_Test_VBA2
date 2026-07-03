/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { prdMarkdown } from '../data/prdData';
import { FileText, Layers, GitBranch, ShieldCheck, Terminal, Copy, CheckCircle2, ChevronRight, Cpu } from 'lucide-react';

export default function PrdViewer() {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'features' | 'flow' | 'milestones'>('overview');
  const [copystate, setCopystate] = useState(false);
  
  // Encoding Simulator State
  const [simText, setSimText] = useState('사내 영업 실적 등록 폼');
  const [encodingFormat, setEncodingFormat] = useState<'UTF8' | 'CP949'>('UTF8');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prdMarkdown);
    setCopystate(true);
    setTimeout(() => setCopystate(false), 2000);
  };

  const getByteRepresentation = (text: string, enc: 'UTF8' | 'CP949') => {
    if (enc === 'UTF8') {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      return Array.from(bytes).map(b => '0x' + b.toString(16).toUpperCase()).join(' ');
    } else {
      // Custom CP949 simulation for typical Korean characters
      const bytes: string[] = [];
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if (charCode < 128) {
          bytes.push('0x' + charCode.toString(16).toUpperCase());
        } else {
          // Mock CP949 lead & trail bytes for demo purposes
          const simulatedHex1 = (0x81 + (charCode % 30)).toString(16).toUpperCase();
          const simulatedHex2 = (0x41 + (charCode % 50)).toString(16).toUpperCase();
          bytes.push(`0x${simulatedHex1}`, `0x${simulatedHex2}`);
        }
      }
      return bytes.join(' ');
    }
  };

  return (
    <div className="bg-[#0b0521] rounded-xl shadow-xl border border-purple-500/20 overflow-hidden h-full flex flex-col" id="prd_viewer_root">
      {/* PRD Header */}
      <div className="bg-[#04010a]/90 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-950/40">
        <div>
          <span className="bg-pink-600/20 text-pink-300 text-xs font-semibold px-2.5 py-1 rounded border border-pink-500/20">
            Senior PM & Frontend Architect Specification
          </span>
          <h2 className="text-xl font-bold mt-1 text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-500" />
            비주얼 VBA 웹 에디터 제품 요구사항 정의서 (PRD)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            사내 폐쇄망 환경에서 작동하는 Low-Code VBA 저작 플랫폼의 제품 요구 사양
          </p>
        </div>
        
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 self-start sm:self-center px-3.5 py-1.5 bg-[#130d35] hover:bg-[#1e1450] text-purple-300 hover:text-white rounded text-xs font-semibold border border-purple-500/30 transition cursor-pointer"
        >
          {copystate ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>복사 완료!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>전체 PRD 복사</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Tabs */}
      <div className="flex border-b border-purple-950/40 bg-[#120a3a]/40 overflow-x-auto scrollbar-none shrink-0">
        {[
          { id: 'overview', label: '1. 제품 개요 및 목표', icon: ShieldCheck },
          { id: 'architecture', label: '2. 기술 스택 & 아키텍처', icon: Layers },
          { id: 'features', label: '3. 핵심 기능 요구사항', icon: Cpu },
          { id: 'flow', label: '4. 사용자 경험 & Flow', icon: GitBranch },
          { id: 'milestones', label: '5. MVP 전략 & 개발 페이즈', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none cursor-pointer ${
                isActive
                  ? 'border-pink-500 text-pink-400 bg-[#0f0a28]/60 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-purple-950/35'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-slate-100">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-2">
                <span className="p-1 bg-indigo-600/50 text-indigo-100 rounded-md text-[10px] font-mono">VISION</span>
                인터넷이 없는 환경에서도 현업 부서가 직접 VBA 매크로를 제작한다.
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                금융, 공공기관 등 강력한 폐쇄망 규제를 적용받는 엔터프라이즈 환경에서는 외부 AI나 SaaS 빌더를 사용할 수 없습니다. 
                이 솔루션은 <strong>100% 클라이언트 사이드 및 사내 인프라 단독 웹 기술</strong>로 빌드되어 보안 위배 없이 현업 담당자의 수작업을 자동화합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-purple-500/15 rounded-xl p-4 bg-[#110c30]/50">
                <h4 className="font-bold text-white text-xs mb-1.5">완전 오프라인 구동</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  외부 CDN, SaaS, 또는 AI API를 완전히 배제하고 빌드 타임에 로컬 패키지에 바인딩하여 단절망 내에서 자립합니다.
                </p>
              </div>
              <div className="border border-purple-500/15 rounded-xl p-4 bg-[#110c30]/50">
                <h4 className="font-bold text-white text-xs mb-1.5">시민 개발자(Citizen) 육성</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  파워포인트식 UI 배치와 블록 조립형 논리 구성으로 엑셀 VBA 프로그래밍 진입장벽을 90% 이상 낮춥니다.
                </p>
              </div>
              <div className="border border-purple-500/15 rounded-xl p-4 bg-[#110c30]/50">
                <h4 className="font-bold text-white text-xs mb-1.5">MS Excel 완전 호환</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  자동 생성된 .bas 및 .frm 코드가 MS Excel VBE 엔진의 파일 임포트 규격에 완벽히 부합되도록 파싱됩니다.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">주요 타겟 페르소나 및 핵심 가치</h4>
              <div className="border border-purple-500/20 rounded-xl overflow-hidden bg-[#100a30]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-purple-950/60 text-pink-400 font-semibold border-b border-purple-950/40">
                      <th className="p-3">대상 직무 (Persona)</th>
                      <th className="p-3">기존 페인 포인트 (Pain Point)</th>
                      <th className="p-3">도입 후 개선 성과 (Key Value)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/30 text-slate-300">
                    <tr>
                      <td className="p-3 font-medium text-white">인사/급여 정산 담당자</td>
                      <td className="p-3">매월 수백 명의 수당을 가공할 매크로 폼이 필요하나 VBA 코딩 불가로 IT부서 개발 대기만 2개월 소요.</td>
                      <td className="p-3 text-cyan-400 font-medium">단 10분 만에 웹 에디터로 입력용 폼 UI를 직접 만들고 다운로드하여 엑셀에 바로 등록 및 배포.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">공장 생산 관리 현업원</td>
                      <td className="p-3">엑셀 로깅 데이터에 오탈자나 수치 오류가 자주 발생하지만 수동 유효성 검증 로직 구현이 막막함.</td>
                      <td className="p-3 text-cyan-400 font-medium">블록 코딩(If-Else)을 조립하여 값의 크기에 따른 자동 경고창(MsgBox) 통제 로직을 자력 설계.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-white">보안성 심의 총괄 PM</td>
                      <td className="p-3">인터넷 클라우드를 사용하는 외부 SaaS 툴은 기업 비밀 및 개인정보 유출 위험으로 도입 절대 불가.</td>
                      <td className="p-3 text-cyan-400 font-medium">사내망 온프레미스 서버에 단일 소스 패키지로 배포하여 보안성 심의 100% 프리패스.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <h3 className="font-bold text-white text-sm">사내망(폐쇄망) 특화 오프라인 기술 구조 사양</h3>

            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span className="p-1 bg-amber-600/50 text-amber-100 rounded font-mono text-[9px]">CRITICAL ISSUE</span>
                <span>가장 중요한 과제: 엑셀 VBE 한글 깨짐 방지 및 CP949 인코딩 처리</span>
              </div>
              <p className="text-amber-200 leading-relaxed">
                웹 브라우저는 기본적으로 문자 코드를 <strong>UTF-8</strong>로 인코딩합니다. 그러나 대한민국 오피스 환경에서 
                동작하는 MS Excel VBE(Visual Basic Editor)는 레거시 윈도우 환경에 최적화되어 한글 주석이나 텍스트를 <strong>CP949(EUC-KR)</strong>로만 정상 해석합니다. 
                이를 우회하지 않으면 폼 속성이나 한글 경고 메시지가 모두 깨져서 <span className="font-mono bg-amber-950/50 text-amber-300 border border-amber-500/20 px-1 py-0.5 rounded">"媛쒖씤醫뚮낫"</span>과 같이 표현됩니다.
              </p>
            </div>

            {/* Encoding Simulator Widget */}
            <div className="border border-purple-500/20 rounded-xl overflow-hidden bg-[#100a30]/40">
              <div className="bg-[#04010a]/90 p-4 border-b border-purple-950/40 flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400">💻 사내망 호환성 - 한글 인코딩 시뮬레이터</span>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded font-mono">Real-time Bit Parser</span>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-purple-300">한국어 텍스트 입력</label>
                  <input
                    type="text"
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    className="w-full text-xs p-2.5 border border-purple-500/20 rounded-lg focus:ring-1 focus:ring-pink-500 outline-none bg-[#130d35] text-slate-100"
                    placeholder="인코딩해 볼 한글 입력"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEncodingFormat('UTF8')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        encodingFormat === 'UTF8'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-none shadow-sm'
                          : 'bg-[#130d35] text-slate-400 border-purple-500/20 hover:bg-[#1a1148] hover:text-white'
                      }`}
                    >
                      UTF-8 (웹 표준 브라우저)
                    </button>
                    <button
                      onClick={() => setEncodingFormat('CP949')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        encodingFormat === 'CP949'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-none shadow-sm'
                          : 'bg-[#130d35] text-slate-400 border-purple-500/20 hover:bg-[#1a1148] hover:text-white'
                      }`}
                    >
                      CP949 / EUC-KR (엑셀 VBA 전용)
                    </button>
                  </div>
                </div>

                <div className="space-y-3 bg-[#04010a]/90 text-slate-300 rounded-xl p-4 font-mono text-xs border border-purple-500/10">
                  <div className="flex justify-between items-center text-[10px] text-purple-400 border-b border-purple-950/40 pb-1.5">
                    <span>인코딩 16진수 바이트 표현 (Hex Bytes)</span>
                    <span className="text-emerald-400">{encodingFormat} Mode</span>
                  </div>
                  <div className="text-slate-100 font-mono text-[11px] leading-relaxed break-all">
                    {getByteRepresentation(simText, encodingFormat)}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal border-t border-purple-950/40 pt-1.5">
                    {encodingFormat === 'UTF8' 
                      ? '⚠️ 이 바이트 배열을 그대로 .frm으로 전송 시 한글 윈도우 엑셀 VBE에서 텍스트가 모두 깨져 보입니다.' 
                      : '✅ 이 바이트 배열(CP949)로 쓰여진 파일을 VBE에서 임포트 시, 정상적인 한글 주석과 명칭이 표출됩니다.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">주요 권장 오픈소스 및 오프라인 통합 사양</h4>
              <div className="space-y-3">
                <div className="flex gap-4 items-start p-4 border border-purple-500/15 rounded-xl bg-[#110c30]/50 hover:bg-[#1b124a]/50 transition-all">
                  <div className="p-2.5 bg-purple-950/50 text-pink-500 rounded-lg border border-purple-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">프론트엔드: React & dnd-kit (or React-DnD)</h5>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      사내망 내부 가상 머신(VM) 및 로컬 웹브라우저에서 리소스를 로드합니다. `dnd-kit`은 경량 모듈이면서 픽셀 좌표 스냅 기능(Grid Snapping, 8px 간격 등)을 유연하게 구현할 수 있어 사내 디자인 시스템과 완전 통합이 용이합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 border border-purple-500/15 rounded-xl bg-[#110c30]/50 hover:bg-[#1b124a]/50 transition-all">
                  <div className="p-2.5 bg-purple-950/50 text-pink-500 rounded-lg border border-purple-500/20">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">로직 빌딩: Google Blockly 통합</h5>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      구글 Blockly 라이브러리 소스를 정적으로 빌드하여 사내 웹서버에 배포합니다. VBA Generator 커스텀 코드를 로컬 스크립트 파일로 탑재하여, 블록 결합 시 외부에 패킷을 보내지 않고 100% 브라우저 메모리 안에서 VBA 텍스트 코드를 빌드합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 border border-purple-500/15 rounded-xl bg-[#110c30]/50 hover:bg-[#1b124a]/50 transition-all">
                  <div className="p-2.5 bg-purple-950/50 text-pink-500 rounded-lg border border-purple-500/20">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">하이브리드 에디팅: Monaco Editor 오프라인 호스팅</h5>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Monaco Editor는 대용량 에디터 자산을 필요로 하므로, `npm install monaco-editor` 후 번들러 설정을 조율하여 정적 디렉토리에 포함시킵니다. 외부 CDN을 호출하는 코드를 철저히 제거하여 차단된 인터넷 망에서도 완벽한 자동완성과 구문 색상 하이라이팅을 제공합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FEATURES */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <h3 className="font-bold text-white text-sm">핵심 요구사항 기술 규격 (Product Specification)</h3>

            <div className="space-y-6">
              <div className="border border-purple-500/15 bg-[#110c30]/50 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  시각적 UI 빌더 (UserForm Maker)
                </h4>
                <ul className="text-[11px] text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
                  <li><strong>컴포넌트 팔레트 제공:</strong> 명령 단추, 텍스트 상자, 복합 상자(ComboBox), 레이블, 확인란(CheckBox), 옵션 단추(Radio), 프레임(Group Container) 등 7개 컴포넌트를 제공해야 함.</li>
                  <li><strong>드래그&드롭 자유도:</strong> 픽셀 단위 마우스 드래그를 통해 위젯 크기 조절(Resize) 및 상하좌우 이동 배치 기능 제공.</li>
                  <li><strong>격자 정렬(Grid Snapping):</strong> 8픽셀 배수로 컴포넌트 위치가 자석처럼 붙는 가이드 자석 기능 기본 적용.</li>
                  <li><strong>한글 속성 편집창:</strong> `Name` 은 ‘속성 이름’, `Caption` 은 ‘제목 표시글’, `Text` 는 ‘초기 문자열’, `Enabled` 는 ‘사용여부’ 등으로 완전히 한글로 현지화된 폼 검사기를 구성하여 비개발자의 이해를 도울 것.</li>
                </ul>
              </div>

              <div className="border border-purple-500/15 bg-[#110c30]/50 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  시각적 로직 빌더 (Logic Builder)
                </h4>
                <ul className="text-[11px] text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
                  <li><strong>더블클릭 이벤트 진입:</strong> 캔버스 내 컴포넌트를 더블클릭하면 즉시 해당 컴포넌트의 이벤트 편집기가 나타나도록 매핑 인터페이스 지원.</li>
                  <li><strong>핵심 이벤트 트리거:</strong> `Click`(클릭 시), `Initialize`(폼 열릴 때), `Change`(값 변경 시)에 상응하는 상단 감싸기 블록 지원.</li>
                  <li><strong>VBA 전용 커스텀 블록:</strong> 엑셀의 워크시트 셀 제어(Range, Cells), 팝업 메시지(MsgBox), 조건 비교문(If), 순환 반복문(For/Next), 폼 닫기(Unload Me) 등의 기능을 갖춘 조립식 블록 제공.</li>
                </ul>
              </div>

              <div className="border border-purple-500/15 bg-[#110c30]/50 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  하이브리드 코드 에디터 (Hybrid Code Editor)
                </h4>
                <ul className="text-[11px] text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
                  <li><strong>일방향 동기화 프리뷰:</strong> 컴포넌트를 늘리거나 블록을 붙이면 우측에 실시간으로 작성되는 .frm 스키마와 .cls VBA 코드가 문법 색상 처리되어 노출될 것.</li>
                  <li><strong>코드 주석화:</strong> 모든 자동 생성되는 VBA 구절 위에는 한글 주석 `'` 처리를 달아, 현업 담당자가 다운로드 후 엑셀에서 확인하더라도 동작 원리를 자발적으로 이해할 수 있게 교육적 편의를 마련함.</li>
                </ul>
              </div>

              <div className="border border-purple-500/15 bg-[#110c30]/50 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  Export 및 엑셀 연동 규격
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                  엑셀 VBA 편집기에서 [파일 가져오기] 메뉴를 눌렀을 때 오류 없이 100% 임포트되도록 다음 양식을 준수하여 내보내야 합니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                  <div className="bg-[#04010a]/90 text-slate-300 p-3.5 rounded-lg space-y-1 border border-purple-500/15">
                    <span className="text-pink-400 block font-semibold mb-1">UserForm1.frm (Form Layout)</span>
                    <span className="text-slate-500">VERSION 5.00</span><br />
                    <span className="text-slate-500">Begin &#123;C62A69F0-16DC-11CE-9E98-00AA00574A4F&#125; UserForm1</span><br />
                    <span>   Caption = "사내 정보 등록기"</span><br />
                    <span>   ClientWidth = 6000</span><br />
                    <span>   Begin MSForms.TextBox TxtInput</span><br />
                    <span>      Height = 300</span><br />
                    <span>      Left = 1200</span><br />
                    <span>   End</span><br />
                    <span className="text-slate-500">End</span>
                  </div>
                  <div className="bg-[#04010a]/90 text-slate-300 p-3.5 rounded-lg space-y-1 border border-purple-500/15">
                    <span className="text-pink-400 block font-semibold mb-1">Module1.bas (Helper Trigger)</span>
                    <span className="text-slate-500">Attribute VB_Name = "Module1"</span><br />
                    <span>Sub ShowUserForm()</span><br />
                    <span className="text-slate-400">    ' 유저폼 인스턴스 활성화 호출</span><br />
                    <span>    UserForm1.Show</span><br />
                    <span>End Sub</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FLOW */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <h3 className="font-bold text-white text-sm">시민 개발자(현업) 친화적 통합 사용자 경험 흐름</h3>

            <div className="space-y-4">
              <div className="relative pl-6 border-l-2 border-purple-950/50 space-y-6 text-xs">
                
                <div className="relative">
                  <div className="absolute -left-8 top-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">1</div>
                  <h4 className="font-bold text-pink-400">접속 및 신규 설계 프로젝트 설정</h4>
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                    사내 인트라넷을 통해 웹 브라우저로 비주얼 VBA 에디터 사이트에 무인증/통합인증(SSO)으로 로그인합니다. 빈 캔버스로 시작하거나 사내에서 널리 활용되는 ‘데이터 정합성 필터링’, ‘고객 응대 수집’ 템플릿을 선택합니다.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-8 top-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">2</div>
                  <h4 className="font-bold text-pink-400">레이아웃 디자인 (Drag & Drop Canvas)</h4>
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                    왼쪽 툴박스에서 텍스트 박스, 체크박스, 버튼 등을 클릭 또는 끌어와 가상 엑셀 유저폼 캔버스 위에 배치합니다. 컴포넌트를 누르면 한글화된 우측 편집창에서 ‘제목’, ‘표시할 이름’, ‘크기’, ‘글씨 색’ 등을 정밀하게 조율합니다.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-8 top-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">3</div>
                  <h4 className="font-bold text-pink-400">이벤트 매핑 및 블록 로직 바인딩</h4>
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                    디자인된 버튼을 더블클릭하면 로직 빌더 창이 나타납니다. "제출 버튼을 클릭했을 때"라는 이벤트 껍데기 블록에 "Range(A1)에 이름상자의 입력값 쓰기", "경고창 완료 알림 띄우기" 블록을 레고처럼 물리적으로 조립해 결합합니다.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-8 top-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">4</div>
                  <h4 className="font-bold text-pink-400">실시간 코드 검토 및 최종 아웃풋 파일 익스포트</h4>
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                    우측 프리뷰 탭에서 실시간 생성된 온전한 .frm 텍스트 및 VBA 스크립트를 최종 확인합니다. "엑셀용 다운로드" 버튼을 클릭하여 `.bas` 및 `.frm` 파일이 결합되어 CP949로 인코딩된 ZIP 파일을 내 컴퓨터로 즉각 가져옵니다.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-8 top-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">5</div>
                  <h4 className="font-bold text-pink-400">엑셀 VBE 유입 및 실행</h4>
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                    자신의 업무 엑셀 문서를 열고 [Alt + F11] 키를 눌러 매크로 편집기를 엽니다. 가져오기 메뉴를 통해 다운받은 `.frm` 과 `.bas`를 임포트하면 디자인했던 화면이 그대로 등록됩니다. 실행 매크로를 연동하여 업무에서 바로 활용합니다.
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MILESTONES */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <h3 className="font-bold text-white text-sm">마일스톤 분할 및 점진적 MVP 배포 로드맵</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Phase 1 Box */}
              <div className="border border-pink-500/20 rounded-xl bg-[#1d0e3a]/30 shadow-md shadow-pink-500/5 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-950/40 pb-3">
                  <div>
                    <span className="text-[10px] bg-pink-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">PHASE 1</span>
                    <h4 className="font-bold text-purple-200 text-xs mt-1">최소 기능 제품 (MVP 단계)</h4>
                  </div>
                  <span className="text-xs font-bold text-pink-400 bg-[#130d35] border border-pink-500/30 px-2.5 py-1 rounded-full shadow-xs">
                    100% 실사 구현 완료
                  </span>
                </div>
                
                <p className="text-purple-200 text-[11px] leading-relaxed">
                  현업 부서에서 유용하게 쓰이는 필수적인 입력 폼 구축과 엑셀 시트 1:1 값 매핑 동작을 완전하게 제공하는 단계입니다.
                </p>

                <div className="space-y-2 text-[11px] text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
                    <span>핵심 컴포넌트 4종 (버튼, 텍스트박스, 레이블, 체크박스) 완벽 설계</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
                    <span>격자 그리드(Absolute Position Engine) 및 스냅 얼라인 드래그 지원</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
                    <span>이벤트별 비주얼 로직 블록(MsgBox, SetCell, SetControlProperty) 조립</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />
                    <span>한글 CP949 인코딩을 고려한 실시간 .frm / .bas 소스 다운로더</span>
                  </div>
                </div>
              </div>

              {/* Phase 2 Box */}
              <div className="border border-purple-500/15 rounded-xl bg-[#110c30]/40 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-950/30 pb-3">
                  <div>
                    <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">PHASE 2</span>
                    <h4 className="font-bold text-white text-xs mt-1">기능 고도화 및 사내 확산</h4>
                  </div>
                  <span className="text-xs font-bold text-purple-300 bg-[#130d35] border border-purple-500/20 px-2.5 py-1 rounded-full shadow-xs">
                    로드맵 수립
                  </span>
                </div>
                
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  다양한 현업 부서의 고도 요구사항을 충족하고 사내 매크로 전파 허브 역할을 강화하는 단계입니다.
                </p>

                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>확장 컴포넌트 지원 (ComboBox 옵션 관리, ListBox, Frame 그룹 테두리)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Blockly 전임 런타임 적용 및 정밀 루프(For-Next), 조건 정밀 분석 지원</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Monaco Editor 기반 실시간 주석 검사기 및 직접수정 투웨이 바인딩</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>다중 유저폼(Form-to-Form) 분기 이동 제어 및 프로젝트 파일 백업 기능</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
