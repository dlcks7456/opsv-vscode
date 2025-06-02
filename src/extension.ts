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
      lines.forEach((line, index) => {
        if (includeCode) {
          const match = parseLine(line);
          if (match === null) {
            printPage += `<${attrType}>${line}</${attrType}> <!-- 매칭되지 않는 패턴 -->\n`;
          } else {
            if (attrType === 'label') {
              printPage += `<${attrType} for="x${match[0]}">${match[1]}</${attrType}>\n`;
            } else {
              printPage += `<${attrType} value="${match[0]}">${match[1]}</${attrType}>\n`;
            }
          }
        } else {
          if (attrType === 'label') {
            printPage += `<${attrType}>${line}</${attrType}>\n`;
          } else {
            printPage += `<${attrType} value="${index + 1}">${line}</${attrType}>\n`;
          }
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

  let qnumber = '';
  if (trimLine.length === 2) {
    qnumber = trimLine[0];
  }

  /* 나중에 삭제될 항목들 */
  const maxWidth = inputType === 'text' ? '200px' : '70px';
  const styleProp = `style="border: 1px solid #ccc; border-radius: 7px; height: 25px; width: 100%; max-width: ${maxWidth};"`;
  /* ----------------- */

  let replaceHtml = '';
  if (hasLabels) {
    const labelMatches = base.match(/<label\b[^>]*>(.*?)<\/label>/gs);
    const labels = labelMatches
      ?.map((label, index) => {
        // for 속성 존재 여부 검사
        const forMatch = label.match(/for\s*=\s*["']a(\d+)["']/);
        if (forMatch) {
          const forValue = forMatch[1];
          const setId = `${qnumber}x${forValue}`;
          const updatedLabel = label.replace(/for\s*=\s*["'][^"']*["']/, `for="${setId}"`);
          return `\t<div class="multi multi-${forValue}" style="display: flex;flex-direction: column;gap: 5px;margin-bottom: 7px;">\n\t\t${updatedLabel}\n\t\t<div style="display: flex; gap:5px; align-items: center;">\n\t\t\t<input type="${inputType}" id="${setId}" ${styleProp}/>\n\t\t</div>\n\t</div>`;
        } else {
          const code = index + 1;
          const setId = `${qnumber}x${code}`;
          const updatedLabel = label.replace(/^<label\b/, `<label for="${setId}"`);
          return `\t<div class="multi multi-${code}" style="display: flex;flex-direction: column;gap: 5px;margin-bottom: 7px;">\n\t\t${updatedLabel}\n\t\t<div style="display: flex; gap:5px; align-items: center;">\n\t\t\t<input type="${inputType}" id="${setId}" ${styleProp}/>\n\t\t</div>\n\t</div>`;
        }
      })
      .join('\n');

    replaceHtml = `<div class="multi-container" style="width: 100%;display: flex;flex-direction: column;gap: 10px;padding: 5px;">\n${labels}\n</div>`;
  } else {
    let rows = Number(trimLine[0]);

    if (trimLine.length === 2) {
      rows = Number(trimLine[1]);
    }

    if (isNaN(rows)) {
      rows = 1;
    }

    const inputRows = Array.from({ length: rows }, (_, i) => i + 1);
    const inputTage = inputRows
      .map(
        (input) =>
          `\t<div class="multi multi-${input}">\n\t\t<div style="display: flex; gap:5px; align-items: center;">\n\t\t\t<input type="${inputType}" id="${qnumber}x${input}" ${styleProp}/>\n\t\t</div>\n\t</div>`
      )
      .join('\n');

    replaceHtml = `<div class="multi-container" style="width: 100%;display: flex;flex-direction: column;gap: 10px;padding: 5px;">\n${inputTage}\n</div>`;
  }

  return replaceHtml;
};

const createSelect = (base: string) => {
  const hasOptions = /<option\b[^>]*>/i.test(base);
  let replaceHtml = '';

  if (hasOptions) {
    const options = base.match(/<option\b[^>]*>(.*?)<\/option>/gs) || [];

    // 1. option 태그를 제외한 나머지 텍스트 추출
    let remainingText = base;
    options.forEach((option) => {
      remainingText = remainingText.replace(option, '');
    });

    // 2. 나머지 텍스트가 있는 경우 배열로 분리
    const textArray = remainingText.trim() !== '' ? remainingText.trim().split('\n') : [];
    const defaultOption = `<option value="">하나 선택...</option>`;

    // 3 & 4. 배열 기반으로 select 태그 생성 및 option 삽입
    if (textArray.length > 0) {
      replaceHtml = textArray
        .map((text, index) => {
          const code = index + 1;
          const id = `x${code}`;
          return `\t<div class="multi multi-${code}" style="display:flex; flex-direction: column; gap: 5px;">
\t\t<label for="${id}">${text.trim()}</label>
\t\t<div style="display: flex; gap: 10px; align-items: center;">
\t\t\t<select id="${id}" style="width: 100%;min-height: 30px;border: 1px solid #ccc;border-radius: 7px;">
\t\t\t\t${defaultOption}
\t\t\t\t${options.join('\n\t\t\t\t')}
\t\t\t</select>
\t\t</div>
\t</div>`;
        })
        .join('\n');
    } else {
      // 5. 배열이 비어있으면 select 태그 하나만 생성
      replaceHtml = `\t<div class="multi multi-1">
\t\t<select id="x1" style="width: 100%;min-height: 30px;border: 1px solid #ccc;border-radius: 7px;">
\t\t\t${defaultOption}
\t\t\t${options.join('\n\t\t\t')}
\t\t</select>
\t</div>`;
    }
  }

  replaceHtml = `<div class="multi-container" style="display:flex; flex-direction: column; gap: 20px; width: 100%;">\n${replaceHtml}\n</div>`;

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

  // ctrl+2 : option 태그 생성
  const createOption = vscode.commands.registerCommand('opsv-snd-editor.createOption', () => {
    executeCommand(false, 'option');
  });
  context.subscriptions.push(createLabel);

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

  // ctrl+shift+s Create Dropdown
  const createDropdown = vscode.commands.registerCommand('opsv-snd-editor.createDropdown', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found!');
      return;
    }

    const document = editor.document;
    let selections = editor.selections;

    for (const selection of selections) {
      const base = document.getText(selection).trim();
      let replaceHtml = createSelect(base);

      editor.edit((editBuilder) => {
        editBuilder.replace(selection, replaceHtml);
      });
    }
  });

  context.subscriptions.push(createDropdown);

  // ctrl+shift+c : 복사 했을 때 line join, trim()을 한 뒤에 복사
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
      .join(' ');

    // 클립보드에 복사
    await vscode.env.clipboard.writeText(processed);
  });

  context.subscriptions.push(copyForEditor);

  // ctrl+shift+a : to array (1-9 > [1, 2, 3, 4, 5, 6, 7, 8, 9])
  const createArray = vscode.commands.registerCommand('opsv-snd-editor.createArray', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    let text = document.getText(selection);

    if (!text.includes('-')) {
      vscode.window.showErrorMessage('`-` 를 통해 범위를 지정해주세요. (ex. 1-9)');
      return;
    }

    const splitText = text.split('-');
    if (splitText.length !== 2) {
      vscode.window.showErrorMessage('입력 포맷을 확인해주세요. (ex. 1-9)');
      return;
    }

    const [start, end] = splitText.map(Number);

    if (start > end) {
      vscode.window.showErrorMessage('시작 숫자가 끝 숫자보다 클 수 없습니다.');
      return;
    }

    const arr: any = [];
    for (let i = start; i <= end; i++) {
      arr.push(i);
    }

    editor.edit((editBuilder) => {
      editBuilder.replace(selection, `[${arr.filter((a: any) => a > 0).join(', ')}]`);
    });
  });

  context.subscriptions.push(createArray);
}

export function deactivate() {}
