import * as vscode from 'vscode';

function processText(input: string): string[] {
  return input
    .replace(/\t+/g, ' ') // 탭을 공백으로 치환
    .replace(/\n +\n/g, '\n\n') // 공백으로 채워진 줄 제거
    .replace(/\n{2,}/g, '\n') // 여러 개의 연속된 빈 줄을 하나로 줄임
    .trim() // 양 끝 공백 제거
    .split('\n') // 줄바꿈으로 텍스트 분리
    .map((line) => line.trim()); // 각 줄 양 끝 공백 제거
}

// 중복 요소 검사
function findDuplicatesList(items: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  items.forEach((item) => {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  });

  return Array.from(duplicates);
}

function checkDupeElement(checkText: string): string {
  const printId: string[] = [];
  const printText: string[] = [];
  const lines = checkText.split('\n');

  lines.forEach((line) => {
    if (line.trim()) {
      // label 값 추출
      const labelMatch = line.match(/id="([^"]+)"/);
      if (labelMatch) {
        printId.push(labelMatch[1]);
      }

      // 텍스트 추출
      const textMatch = line.match(/>([^<]+)</);
      if (textMatch) {
        const text = textMatch[1].trim().replace(/\s+/g, '').toUpperCase();
        printText.push(text);
      }
    }
  });

  // 중복 검사
  const duplicateId = findDuplicatesList(printId);
  const duplicateTexts = findDuplicatesList(printText);

  let rawText = checkText;

  if (duplicateId.length > 0) {
    const dupId = duplicateId.join(', ');
    rawText += `❌ [ERROR] 중복된 ID가 있습니다 : ${dupId}\n`;
  }

  if (duplicateTexts.length > 0) {
    const dupText = duplicateTexts.join(', ');
    rawText += `❌ [ERROR] 중복된 텍스트가 있습니다 : ${dupText}\n`;
  }

  return rawText;
}

const parseLine = (line: string) => {
  // 정규식: 다양한 형식의 번호 + 텍스트 분리
  const match = line.match(/^\s*\(?(\d+)\)?[.)]?\s+(.*)$/);
  if (match) {
    const number = parseInt(match[1], 10);
    const text = match[2].trim();
    return [number, text];
  }
  return null; // 매칭 안 되는 경우
};

// 태그 생성 함수
const executeCommand = async (includeCode: boolean, attrType: 'label' | 'option') => {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found!');
      return;
    }

    const document = editor.document;
    let selections = editor.selections;

    for (const selection of selections) {
      let text = document.getText(selection);
      if (!text) {
        text = '';
      }

      const lines = processText(text);

      let printPage = '';
      lines.forEach((line) => {
        if (includeCode) {
          const match = parseLine(line);
          if (match === null) {
            printPage += `<${attrType}>${line}</${attrType}> <!-- 매칭되지 않는 패턴 -->\n`;
          } else {
            printPage += `<${attrType} for="x${match[0]}">${match[1]}</${attrType}>\n`;
          }
        } else {
          printPage += `<${attrType}>${line}</${attrType}>\n`;
        }
      });

      let updatedText = checkDupeElement(printPage);

      editor.edit((editBuilder) => {
        editBuilder.replace(selection, updatedText);
      });
    }
  } catch (error: any) {
    console.error(error);
    vscode.window.showErrorMessage(`Error: ${error.message}`);
  }
};

const createInputs = (base: string, inputType: 'text' | 'number') => {
  const hasLabels = /<label\b[^>]*>/i.test(base);

  const splitSelections = base.split('\n');
  const qidLine = splitSelections[0];
  const trimLine = qidLine.split('-').map((txt) => txt.trim());
  const qnumber = trimLine[0];

  /* 나중에 삭제될 항목들 */
  const styleProp = `style="border: 1px solid #ccc; height: 25px; width: 100%; max-width: 200px;"`;
  /* ----------------- */

  let replaceHtml = '';
  if (hasLabels) {
    const labelMatches = base.match(/<label\b[^>]*>(.*?)<\/label>/gs);
    const labels = labelMatches
      ?.map((label, index) => {
        // for 속성 존재 여부 검사
        const forMatch = label.match(/for\s*=\s*["']x(\d+)["']/);
        if (forMatch) {
          const forValue = forMatch[1];
          const setId = `${qnumber}x${forValue}`;
          const updatedLabel = label.replace(/for\s*=\s*["'][^"']*["']/, `for="${setId}"`);
          return `\t<div class="opsv-multi">\n\t\t${updatedLabel}\n\t\t<input type="${inputType}" class="multi" id="${setId}" ${styleProp}/>\n\t</div>`;
        } else {
          const setId = `${qnumber}x${index + 1}`;
          const updatedLabel = label.replace(/^<label\b/, `<label for="${setId}"`);
          return `\t<div class="opsv-multi">\n\t\t${updatedLabel}\n\t\t<input type="${inputType}" class="multi" id="${setId}" ${styleProp}/>\n\t</div>`;
        }
      })
      .join('\n');

    replaceHtml = `<div class="opsv-q-container" id="${qnumber}-inputs">\n${labels}\n</div>`;
  } else {
    let rows = trimLine[1] ? Number(trimLine[1]) : 1;
    if (isNaN(rows)) {
      rows = 1;
    }

    const inputRows = Array.from({ length: rows }, (_, i) => i + 1);
    const inputTage = inputRows
      .map((input) => `\t<input type="${inputType}" class="opsv-multi multi" id="${qnumber}x${input}" ${styleProp}/>`)
      .join('\n');

    replaceHtml = `<div class="opsv-q-container" id="${qnumber}-inputs">\n${inputTage}\n</div>`;
  }

  return replaceHtml;
};

export function activate(context: vscode.ExtensionContext) {
  // ctrl+1 : label 태그 생성
  const createLabel = vscode.commands.registerCommand('opsv-snd-editor.createLabel', () => {
    executeCommand(false, 'label');
  });
  context.subscriptions.push(createLabel);

  // ctrl+shift+1 : 코드 매칭 label 태그 생성
  const createLabelWithValue = vscode.commands.registerCommand('opsv-snd-editor.createLabelWithValue', () => {
    executeCommand(true, 'label');
  });
  context.subscriptions.push(createLabelWithValue);

  // ctrl+t : input text를 생성
  const createInputTexts = vscode.commands.registerCommand('opsv-snd-editor.createInputTexts', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found!');
      return;
    }

    const document = editor.document;
    let selections = editor.selections;

    for (const selection of selections) {
      const base = document.getText(selection).trim();
      let replaceHtml = createInputs(base, 'text');

      editor.edit((editBuilder) => {
        editBuilder.replace(selection, replaceHtml);
      });
    }
  });

  context.subscriptions.push(createInputTexts);

  // ctrl+n : input text를 생성
  const createInputNumbers = vscode.commands.registerCommand('opsv-snd-editor.createInputNumbers', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found!');
      return;
    }

    const document = editor.document;
    let selections = editor.selections;

    for (const selection of selections) {
      const base = document.getText(selection).trim();
      let replaceHtml = createInputs(base, 'number');

      editor.edit((editBuilder) => {
        editBuilder.replace(selection, replaceHtml);
      });
    }
  });

  context.subscriptions.push(createInputNumbers);

  // ctrl+c : 복사 했을 때 line join, trim()을 한 뒤에 복사
  const copyForEditor = vscode.commands.registerCommand('opsv-snd-editor.copyForEditor', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    let text = document.getText(selection);

    if (!text) {
      // 아무것도 선택 안했을 경우, 현재 줄 복사
      const line = document.lineAt(selection.active.line);
      text = line.text;
    }

    // 줄바꿈 제거 + trim
    const processed = text
      .split('\n')
      .map((line) => line.trim())
      .join('');

    // 클립보드에 복사
    await vscode.env.clipboard.writeText(processed);
  });

  context.subscriptions.push(copyForEditor);
}

export function deactivate() {}
