/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ElementType =
  | 'UserForm'
  | 'CommandButton'
  | 'TextBox'
  | 'ComboBox'
  | 'Label'
  | 'CheckBox'
  | 'OptionButton'
  | 'ListBox'
  | 'Frame';

export interface UIElement {
  id: string;
  type: ElementType;
  name: string;
  caption: string; // Used for Labels, Buttons, CheckBoxes, Frames, OptionButtons, UserForm
  text: string;    // Used for TextBox
  left: number;    // Coordinates on Canvas
  top: number;
  width: number;
  height: number;
  foreColor: string; // Hex color e.g., "#000000"
  backColor: string; // Hex color e.g., "#F0F0F0"
  fontSize: number;  // Font size in points
  fontBold: boolean;
  value: string;     // Default or current value
  placeholder: string; // Placeholder text
  options: string[];   // ComboBox / ListBox list items
  visible: boolean;
  enabled: boolean;
}

export type BlockType =
  | 'MsgBox'
  | 'SetCell'
  | 'GetCell'
  | 'SetControlProperty'
  | 'Condition'
  | 'Loop'
  | 'Variable'
  | 'VBAExpression'
  | 'CloseForm';

export interface LogicBlock {
  id: string;
  type: BlockType;
  // MsgBox
  prompt?: string;
  title?: string;
  // SetCell / GetCell
  sheetName?: string;
  cellAddress?: string; // e.g., "A1" or "B" & i
  cellValue?: string;
  targetVarName?: string;
  // SetControlProperty
  targetElementId?: string;
  targetProperty?: 'Caption' | 'Text' | 'Value' | 'Visible' | 'Enabled' | 'BackColor';
  propertyValue?: string;
  // Variable definition
  varName?: string;
  varValue?: string;
  // Condition (If...Then...Else)
  conditionLeft?: string;
  conditionOp?: '=' | '<>' | '>' | '<' | '>=' | '<=';
  conditionRight?: string;
  trueBlocks?: LogicBlock[];
  falseBlocks?: LogicBlock[];
  // Loop (For...Next)
  loopVar?: string;
  loopStart?: string;
  loopEnd?: string;
  loopBlocks?: LogicBlock[];
  // Custom Raw VBA Expression
  expression?: string;
}

export interface ControlEvent {
  elementId: string;
  eventName: 'Click' | 'Change' | 'DblClick' | 'Initialize';
  blocks: LogicBlock[];
}

export interface VBAProject {
  id: string;
  name: string;
  description: string;
  elements: UIElement[];
  events: ControlEvent[];
}
