import * as vscode from 'vscode';

let boldFontColor = '#1446be';
let bgColor = '#c2f1ff';

// test.html에서 추출한 컬러 팔레트
const colorPalette = [
  '#8B1416',
  '#673919',
  '#735C23',
  '#4B511D',
  '#244826',
  '#29496A',
  '#053269',
  '#44255C',
  '#82053C',
  '#000000',
  '#FF2A20',
  '#FF9B28',
  '#FDD41B',
  '#75B52C',
  '#00A453',
  '#00AFEE',
  '#1446BE',
  '#961E8C',
  '#FF268A',
  '#434343',
  '#FFC1AF',
  '#FFD4A8',
  '#FFF59B',
  '#C4DD9E',
  '#6FC89E',
  '#67DDFF',
  '#8CA0DC',
  '#C18EBE',
  '#FFB1CD',
  '#636363',
  '#FFE6DF',
  '#FFEEDC',
  '#FFFBD7',
  '#E7F1D8',
  '#C5E9D8',
  '#C2F1FF',
  '#C6E8FF',
  '#E6D2E5',
  '#FFE0EB',
  '#FFFFFF',
];

// Webview 컬러 팔레트
async function showColorPaletteWebview(title: string, currentColor: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const prevEditor = vscode.window.activeTextEditor;
    const panel = vscode.window.createWebviewPanel('colorPalette', title, vscode.ViewColumn.Active, {
      enableScripts: true,
    });

    const colorBoxHtml = colorPalette
      .map(
        (color, idx) => `
      <button class="color-box${
        color === currentColor ? ' selected' : ''
      }" data-color="${color}" tabindex="0" aria-label="${color}" style="background:${color};" data-idx="${idx}"></button>
    `
      )
      .join('');

    panel.webview.html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <style>
          body { background: #f6f6f6; margin: 0; padding: 18px 10px 10px 10px; font-family: 'Segoe UI', 'Apple SD Gothic Neo', Arial, sans-serif; }
          h3 { margin: 0 0 12px 0; font-size: 1.08em; color: #222; }
          .palette {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            gap: 8px;
            width: 300px;
            max-width: 100vw;
          }
          .color-box {
            width: 28px; height: 28px; border-radius: 7px; border: 2px solid #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.07);
            cursor: pointer;
            outline: none;
            transition: border 0.18s, box-shadow 0.18s;
            padding: 0; margin: 0;
            display: flex; align-items: center; justify-content: center;
          }
          .color-box.selected,
          .color-box:focus {
            border: 2.5px solid #0078d4;
            box-shadow: 0 0 0 2px #b3d6f7;
            z-index: 1;
          }
          .color-box:hover {
            border: 2.5px solid #333;
          }
        </style>
      </head>
      <body>
        <h3>${title}</h3>
        <div class="palette" id="palette">
          ${colorBoxHtml}
        </div>
        <script>
          const boxes = Array.from(document.querySelectorAll('.color-box'));
          let focusIdx = boxes.findIndex(b => b.classList.contains('selected'));
          if (focusIdx < 0) focusIdx = 0;
          boxes[focusIdx].focus();

          function selectColor(idx) {
            const color = boxes[idx].getAttribute('data-color');
            window.acquireVsCodeApi().postMessage({ type: 'colorSelected', color });
          }

          document.addEventListener('keydown', (e) => {
            if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter"," ","Tab","Shift","Escape"].includes(e.key)) return;
            let rowLen = 10;
            if (e.key === 'ArrowLeft') {
              focusIdx = (focusIdx + boxes.length - 1) % boxes.length;
              boxes[focusIdx].focus();
              e.preventDefault();
            } else if (e.key === 'ArrowRight') {
              focusIdx = (focusIdx + 1) % boxes.length;
              boxes[focusIdx].focus();
              e.preventDefault();
            } else if (e.key === 'ArrowUp') {
              focusIdx = (focusIdx - rowLen + boxes.length) % boxes.length;
              boxes[focusIdx].focus();
              e.preventDefault();
            } else if (e.key === 'ArrowDown') {
              focusIdx = (focusIdx + rowLen) % boxes.length;
              boxes[focusIdx].focus();
              e.preventDefault();
            } else if (e.key === 'Enter' || e.key === ' ') {
              selectColor(focusIdx);
              e.preventDefault();
            } else if (e.key === 'Escape') {
              window.acquireVsCodeApi().postMessage({ type: 'cancel' });
            }
          });

          boxes.forEach((box, idx) => {
            box.addEventListener('click', () => selectColor(idx));
            box.addEventListener('focus', () => { focusIdx = idx; });
          });
        </script>
      </body>
      </html>
    `;

    // 메시지 수신
    panel.webview.onDidReceiveMessage(
      async (msg) => {
        if (msg.type === 'colorSelected') {
          resolve(msg.color);
          panel.dispose();
          if (prevEditor) {
            await vscode.window.showTextDocument(prevEditor.document, prevEditor.viewColumn, false);
          }
        } else if (msg.type === 'cancel') {
          resolve(undefined);
          panel.dispose();
          if (prevEditor) {
            await vscode.window.showTextDocument(prevEditor.document, prevEditor.viewColumn, false);
          }
        }
      },
      undefined,
      []
    );

    // 닫으면 undefined 반환 + 포커스 복원
    panel.onDidDispose(
      async () => {
        resolve(undefined);
        if (prevEditor) {
          await vscode.window.showTextDocument(prevEditor.document, prevEditor.viewColumn, false);
        }
      },
      null,
      []
    );
  });
}

function processText(input: string): string[] {
  return input
    .replace(/"/g, '\\"') // 쌍따옴표를 이스케이프 처리
    .replace(/'/g, "\\'") // 따옴표를 이스케이프 처리
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

// 텍스트에서 좌측 번호 패턴 제거 함수
const removeLeftNumberPattern = (text: string): string => {
  // 좌측에 있는 번호 패턴들을 정의 (^ 앵커로 문자열 시작 부분만 매칭)
  const patterns = [
    /^\d+\)\s*/, // 1), 2), 3) 등
    /^\(\d+\)\s*/, // (1), (2), (3) 등
    /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]\s*/, // ①, ②, ③ 등
    /^\d+\.\s*/, // 1., 2., 3. 등
    /^\d+\s+/, // 1 , 2 , 3  등 (숫자 뒤에 공백)
  ];

  let result = text;

  // 각 패턴을 순서대로 확인하여 매칭되는 첫 번째 패턴을 제거
  for (const pattern of patterns) {
    if (pattern.test(result)) {
      result = result.replace(pattern, '');
      break; // 첫 번째 매칭되는 패턴만 제거하고 종료
    }
  }

  return result;
};

// dict / list 생성 함수
const createOptionList = async (includeCode: boolean, attrType: 'dict' | 'list') => {
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

      const printArray: string[] = [];

      lines.forEach((line, index) => {
        const result = removeLeftNumberPattern(line);
        let appendText = `"${result}",`;

        if (attrType === 'dict') {
          printArray.push(`\t${index + 1}: ${appendText}`);
        } else {
          printArray.push(`\t"${result}",`);
        }
      });

      let updatedText = checkDupeElement(printArray.join('\n'));

      if (attrType === 'dict') {
        updatedText = `{\n${updatedText}\n}`;
      } else {
        updatedText = `[\n${updatedText}\n]`;
      }

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
        const forMatch = label.match(/for\s*=\s*["']x(\d+)["']/);

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

const matchDictionary = (base: string) => {
  // Python dict 형식을 찾는 정규식 패턴
  // { 로 시작해서 } 로 끝나는 패턴을 찾되, 중괄호 안의 내용도 포함
  const dictPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;

  const matches = base.match(dictPattern);

  if (matches && matches.length > 0) {
    // 첫 번째 매치된 dict를 반환
    return matches[0];
  }

  return null;
};

export function activate(context: vscode.ExtensionContext) {
  // ctrl+1 : label 태그 생성
  const createLabel = vscode.commands.registerCommand('opsv-snd-editor.createLabel', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    if (document.uri.path.toLowerCase().endsWith('.html')) {
      // HTML
      executeCommand(false, 'label');
    }

    // 파일 확장자가 ipynb 인 경우
    if (document.uri.path.toLowerCase().endsWith('.ipynb')) {
      // ipynb
      createOptionList(false, 'list');
    }
  });
  context.subscriptions.push(createLabel);

  // ctrl+shift+1 : 코드 매칭 label 태그 생성
  const createLabelWithValue = vscode.commands.registerCommand('opsv-snd-editor.createLabelWithValue', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    if (document.uri.path.toLowerCase().endsWith('.html')) {
      // HTML
      executeCommand(true, 'label');
    }

    if (document.uri.path.toLowerCase().endsWith('.ipynb')) {
      // ipynb
      createOptionList(true, 'dict');
    }
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

  // ctrl+b : <b> Tag
  const createBoldTag = vscode.commands.registerCommand('opsv-snd-editor.createBoldTag', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    let text = document.getText(selection);

    editor.edit((editBuilder) => {
      editBuilder.replace(selection, `<b>${text}</b>`);
    });
  });

  context.subscriptions.push(createBoldTag);

  // ctrl+u : underline
  const createUnderlineTag = vscode.commands.registerCommand('opsv-snd-editor.createUnderlineTag', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    let text = document.getText(selection);

    editor.edit((editBuilder) => {
      editBuilder.replace(selection, `<u>${text}</u>`);
    });
  });

  context.subscriptions.push(createUnderlineTag);

  // ctrl+i : <i> Tag
  const createItalicTag = vscode.commands.registerCommand('opsv-snd-editor.createItalicTag', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    let text = document.getText(selection);

    editor.edit((editBuilder) => {
      editBuilder.replace(selection, `<i>${text}</i>`);
    });
  });

  context.subscriptions.push(createItalicTag);

  // ctrl+shift+b : <span> + color Tag
  const createSpanColorTag = vscode.commands.registerCommand('opsv-snd-editor.createSpanColorTag', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    let text = document.getText(selection);

    editor.edit((editBuilder) => {
      editBuilder.replace(selection, `<span style="color: ${boldFontColor};font-weight: bold;">${text}</span>`);
    });
  });

  context.subscriptions.push(createSpanColorTag);

  // ctrl+shift+h : <span> + background color Tag
  const createSpanBgColorTag = vscode.commands.registerCommand('opsv-snd-editor.createSpanBgColorTag', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    let text = document.getText(selection);

    editor.edit((editBuilder) => {
      editBuilder.replace(selection, `<span style="background-color: ${bgColor};"><b>${text}</b></span>`);
    });
  });

  context.subscriptions.push(createSpanBgColorTag);

  // ctrl+alt+b : boldFontColor 변경 (Webview)
  const changeBoldFontColor = vscode.commands.registerCommand('opsv-snd-editor.changeBoldFontColor', async () => {
    const newColor = await showColorPaletteWebview('글자 색상 변경', boldFontColor);
    if (newColor) {
      boldFontColor = newColor;
      vscode.window.showInformationMessage(`글자 색상이 ${newColor}로 변경되었습니다.`);
    }
  });
  context.subscriptions.push(changeBoldFontColor);

  // ctrl+alt+h : bgColor 변경 (Webview)
  const changeBgColor = vscode.commands.registerCommand('opsv-snd-editor.changeBgColor', async () => {
    const newColor = await showColorPaletteWebview('배경 색상 변경', bgColor);
    if (newColor) {
      bgColor = newColor;
      vscode.window.showInformationMessage(`배경 색상이 ${newColor}로 변경되었습니다.`);
    }
  });
  context.subscriptions.push(changeBgColor);

  // 공통 함수: 질문 생성 로직
  const createQuestion = (questionType: 'sa' | 'ma' | 'rank' | 'scale' | 'text' | 'number') => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    let selections = editor.selections;

    for (const selection of selections) {
      const base = document.getText(selection).trim();
      let qid = base.split('\n')[0].trim();
      let title = base.split('\n').slice(1).join('\n');
      let optionList = matchDictionary(title);

      let hasOptions = false;
      if (optionList !== null) {
        title = title.replace(optionList, '').trim();
        optionList = optionList.replace(/}$/, '\t}');
        hasOptions = true;
      } else {
        optionList = '{}';
      }

      let pythonCode = '';

      switch (questionType) {
        case 'sa':
          pythonCode = `${qid} = bl.sa(
    qid='${qid}',
    title=f'''
${title}
    ''',
    options = ${optionList},
    etc=False,
    na=None,
    rotation=False
)`;
          break;

        case 'ma':
        case 'rank':
          pythonCode = `${qid} = bl.${questionType}(
    qid='${qid}',
    title=f'''
${title}
    ''',
    options = ${optionList},
    etc=False,
    na=None,
    min=1,
    max=None,
    rotation=False
)`;
          break;

        case 'scale':
          pythonCode = `${qid} = bl.scale(
    qid='${qid}',
    title=f'''
${title}
    ''',
    left='',
    center='',
    right='',
    score=5,
)`;
          break;

        case 'text':
          if (hasOptions) {
            pythonCode = `${qid} = bl.text(
    qid='${qid}',
    title=f'''
${title}
    ''',
    multi=${optionList},
)`;
          } else {
            pythonCode = `${qid} = bl.text(
    qid='${qid}',
    title=f'''
${title}
    ''',
)`;
          }
          break;

        case 'number':
          if (hasOptions) {
            pythonCode = `${qid} = bl.number(
    qid='${qid}',
    title=f'''
${title}
    ''',
    min=0,
    max=999,
    total=None,
    multi=${optionList},
    multi_post='',
)`;
          } else {
            pythonCode = `${qid} = bl.number(
    qid='${qid}',
    title=f'''
${title}
    ''',
    min=0,
    max=999,
    post_text=''
)`;
          }
          break;
      }

      editor.edit((editBuilder) => {
        editBuilder.replace(selection, pythonCode);
      });
    }
  };

  // ctrl+r : Create Radio Question
  const createRadioQuestion = vscode.commands.registerCommand('opsv-snd-editor.createRadioQuestion', async () => {
    createQuestion('sa');
  });

  context.subscriptions.push(createRadioQuestion);

  // ctrl+m : Create Multiple Answer Question
  const createMultipleAnswerQuestion = vscode.commands.registerCommand(
    'opsv-snd-editor.createMultipleAnswerQuestion',
    async () => {
      createQuestion('ma');
    }
  );

  context.subscriptions.push(createMultipleAnswerQuestion);

  // ctrl+shift+r : Create Rank Question
  const createRankQuestion = vscode.commands.registerCommand('opsv-snd-editor.createRankQuestion', async () => {
    createQuestion('rank');
  });

  context.subscriptions.push(createRankQuestion);

  // ctrl+shift+s : Create Scale Question
  const createScaleQuestion = vscode.commands.registerCommand('opsv-snd-editor.createScaleQuestion', async () => {
    createQuestion('scale');
  });

  context.subscriptions.push(createScaleQuestion);

  // ctrl+t : Create Text Question
  const createTextQuestion = vscode.commands.registerCommand('opsv-snd-editor.createTextQuestion', async () => {
    createQuestion('text');
  });

  context.subscriptions.push(createTextQuestion);

  // ctrl+n : Create Number Question
  const createNumberQuestion = vscode.commands.registerCommand('opsv-snd-editor.createNumberQuestion', async () => {
    createQuestion('number');
  });

  context.subscriptions.push(createNumberQuestion);
}

export function deactivate() {}
