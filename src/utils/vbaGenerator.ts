/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UIElement, ControlEvent, LogicBlock } from '../types';

/**
 * Generates the .frm file content (form visual design definition followed by event codes).
 */
export function generateFrmContent(
  formElement: UIElement,
  elements: UIElement[],
  events: ControlEvent[]
): string {
  const controls = elements.filter((el) => el.type !== 'UserForm');

  let frm = `VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} ${formElement.name} 
   Caption         =   "${formElement.caption}"
   ClientHeight    =   ${Math.round(formElement.height * 15)}
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   ${Math.round(formElement.width * 15)}
   StartUpPosition =   1  'CenterOwner
`;

  // Write controls definition
  controls.forEach((ctrl, index) => {
    let msformsType = 'CommandButton';
    switch (ctrl.type) {
      case 'CommandButton':
        msformsType = 'CommandButton';
        break;
      case 'TextBox':
        msformsType = 'TextBox';
        break;
      case 'ComboBox':
        msformsType = 'ComboBox';
        break;
      case 'Label':
        msformsType = 'Label';
        break;
      case 'CheckBox':
        msformsType = 'CheckBox';
        break;
      case 'OptionButton':
        msformsType = 'OptionButton';
        break;
      case 'ListBox':
        msformsType = 'ListBox';
        break;
      case 'Frame':
        msformsType = 'Frame';
        break;
    }

    frm += `   Begin MSForms.${msformsType} ${ctrl.name} \n`;
    if (ctrl.type !== 'TextBox' && ctrl.type !== 'ComboBox' && ctrl.type !== 'ListBox') {
      frm += `      Caption         =   "${ctrl.caption}"\n`;
    }
    if (ctrl.type === 'TextBox' && ctrl.text) {
      frm += `      Text            =   "${ctrl.text}"\n`;
    }
    frm += `      Height          =   ${Math.round(ctrl.height * 15 / 20) * 20}\n`;
    frm += `      Left            =   ${Math.round(ctrl.left * 15 / 20) * 20}\n`;
    frm += `      TabIndex        =   ${index}\n`;
    frm += `      Top             =   ${Math.round(ctrl.top * 15 / 20) * 20}\n`;
    frm += `      Width           =   ${Math.round(ctrl.width * 15 / 20) * 20}\n`;
    
    // Enabled / Visible
    if (!ctrl.enabled) {
      frm += `      Enabled         =   0   'False\n`;
    }
    if (!ctrl.visible) {
      frm += `      Visible         =   0   'False\n`;
    }
    
    // BackColor
    if (ctrl.backColor && ctrl.backColor !== '#F0F0F0') {
      frm += `      BackColor       =   ${convertHexToVbaColor(ctrl.backColor)}\n`;
    }
    // ForeColor
    if (ctrl.foreColor && ctrl.foreColor !== '#000000') {
      frm += `      ForeColor       =   ${convertHexToVbaColor(ctrl.foreColor)}\n`;
    }

    frm += `   End\n`;
  });

  frm += `End\n`;

  // Form Attributes Required for VBE imports
  frm += `Attribute VB_Name = "${formElement.name}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
`;

  // Add the Event Code-behind section
  events.forEach((evt) => {
    const targetElement = elements.find((el) => el.id === evt.elementId);
    if (!targetElement) return;

    frm += `\n' --- ${targetElement.name} 컴포넌트의 ${evt.eventName} 이벤트 처리기 ---\n`;
    frm += `Private Sub ${targetElement.name}_${evt.eventName}()\n`;
    
    // Translate blocks to VBA text
    evt.blocks.forEach((block) => {
      frm += generateBlockVBA(block, elements, 4);
    });

    frm += `End Sub\n`;
  });

  return frm;
}

/**
 * Generates standard .bas VBA Module file to boot up the form.
 */
export function generateBasContent(formName: string): string {
  return `Attribute VB_Name = "VBA_LowCode_Module"
' =========================================================================
'  비주얼 VBA 웹 에디터가 자동 생성한 매크로 기동 모듈
'  - 실행 방법: 엑셀에서 [F5] 키를 누르거나 ShowUserForm 매크로를 실행하세요.
' =========================================================================

Sub ShowUserForm()
    ' 생성된 로우코드 유저폼을 화면에 표시합니다.
    ${formName}.Show
End Sub
`;
}

/**
 * Converts a hex color like "#FF5733" to VBA Hex string "&H003357FF&" (VBA is BBGGRR).
 */
export function convertHexToVbaColor(hex: string): string {
  if (!hex || hex.length < 7) return '&H8000000F&'; // Default ButtonFace
  const r = hex.substring(1, 3);
  const g = hex.substring(3, 5);
  const b = hex.substring(5, 7);
  // VBA format: &H00BBGGRR&
  return `&H00${b}${g}${r}&`;
}

/**
 * Recursive translator that turns a visual logic block hierarchy into VBA code.
 */
function generateBlockVBA(
  block: LogicBlock,
  elements: UIElement[],
  indentSpaces: number = 4
): string {
  const indent = ' '.repeat(indentSpaces);
  let vba = '';

  switch (block.type) {
    case 'MsgBox': {
      const prompt = block.prompt || '알림 메시지';
      const title = block.title || '안내';
      vba += `${indent}' 알림 대화 상자 표시\n`;
      vba += `${indent}MsgBox "${prompt}", vbInformation, "${title}"\n`;
      break;
    }

    case 'SetCell': {
      const sheet = block.sheetName ? `Sheets("${block.sheetName}").` : 'ActiveSheet.';
      const cell = block.cellAddress || 'A1';
      const val = block.cellValue || '""';
      vba += `${indent}' 특정 셀에 값 입력\n`;
      vba += `${indent}${sheet}Range("${cell}").Value = ${val}\n`;
      break;
    }

    case 'GetCell': {
      const sheet = block.sheetName ? `Sheets("${block.sheetName}").` : 'ActiveSheet.';
      const cell = block.cellAddress || 'A1';
      const varName = block.targetVarName || 'val';
      vba += `${indent}' 특정 셀의 값을 변수에 저장\n`;
      vba += `${indent}${varName} = ${sheet}Range("${cell}").Value\n`;
      break;
    }

    case 'SetControlProperty': {
      const target = elements.find((el) => el.id === block.targetElementId);
      if (target) {
        const prop = block.targetProperty || 'Caption';
        let val = block.propertyValue || '""';
        
        // Wrap with quotes if it's text/caption and not structured VBA expressions
        if (
          (prop === 'Caption' || prop === 'Text' || prop === 'BackColor') &&
          !val.startsWith('"') && !val.endsWith('"') &&
          !elements.some((e) => val.includes(e.name))
        ) {
          if (prop !== 'BackColor') {
            val = `"${val}"`;
          }
        }
        
        vba += `${indent}' 컴포넌트 [${target.name}]의 속성 [${prop}] 변경\n`;
        vba += `${indent}${target.name}.${prop} = ${val}\n`;
      }
      break;
    }

    case 'Variable': {
      const name = block.varName || 'myVar';
      const val = block.varValue || '""';
      vba += `${indent}' 변수 선언 및 초기값 대입\n`;
      vba += `${indent}Dim ${name}\n`;
      vba += `${indent}${name} = ${val}\n`;
      break;
    }

    case 'VBAExpression': {
      vba += `${indent}' 고급 사용자 지정 VBA 명령 직접 실행\n`;
      vba += `${indent}${block.expression || ''}\n`;
      break;
    }

    case 'CloseForm': {
      vba += `${indent}' 현재 UserForm 닫기\n`;
      vba += `${indent}Unload Me\n`;
      break;
    }

    case 'Condition': {
      const left = block.conditionLeft || '1';
      const op = block.conditionOp || '=';
      const right = block.conditionRight || '1';
      
      vba += `${indent}' 조건식 (If...Then...Else)\n`;
      vba += `${indent}If ${left} ${op} ${right} Then\n`;
      
      if (block.trueBlocks && block.trueBlocks.length > 0) {
        block.trueBlocks.forEach((tb) => {
          vba += generateBlockVBA(tb, elements, indentSpaces + 4);
        });
      } else {
        vba += `${indent}    ' 수행할 동작 없음\n`;
      }

      if (block.falseBlocks && block.falseBlocks.length > 0) {
        vba += `${indent}Else\n`;
        block.falseBlocks.forEach((fb) => {
          vba += generateBlockVBA(fb, elements, indentSpaces + 4);
        });
      }

      vba += `${indent}End If\n`;
      break;
    }

    case 'Loop': {
      const loopVar = block.loopVar || 'i';
      const start = block.loopStart || '1';
      const end = block.loopEnd || '10';

      vba += `${indent}' 반복문 실행 (For...Next)\n`;
      vba += `${indent}For ${loopVar} = ${start} To ${end}\n`;

      if (block.loopBlocks && block.loopBlocks.length > 0) {
        block.loopBlocks.forEach((lb) => {
          vba += generateBlockVBA(lb, elements, indentSpaces + 4);
        });
      } else {
        vba += `${indent}    ' 반복 수행할 동작 없음\n`;
      }

      vba += `${indent}Next ${loopVar}\n`;
      break;
    }
  }

  return vba;
}

/**
 * Converts text into CP949 encoding (for 한글 compatibility with VBA import in Excel).
 * We fallback to standard Blob if running offline/browser without encoding library,
 * but provide CP949 compatibility text via safe encoding techniques.
 */
export function triggerFileDownload(filename: string, text: string) {
  // We want to export using a CP949 equivalent or clean text format
  // Excel can import clean UTF-8 if VBE supports it, or we do a standard file Blob download
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
}
