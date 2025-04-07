/* ----------- qaMode --------------- */
// force를 true로 하면 오베이 앱에서 확인 가능
qaMode({ defaultMode: true });

function qaMode({ defaultMode = true, force = false }) {
  const surveyForm = document.querySelector('#survey_form');
  if (!surveyForm) {
    console.error('Survey form element not found');
    return;
  }
  function qaGoNext(fn) {
    return function (...args) {
      const result = fn.apply(this, args);
      const nextQAname = surveyForm.querySelector(`#survey${cur} .question-name`);
      if (nextQAname) {
        nextQAname.classList.remove('qa-not-base');
      }
      return result;
    };
  }

  window.goNext = qaGoNext(window.goNext);

  const inputTypes = {
    1: 'radio',
    2: 'checkbox',
    3: 'number',
    4: 'textarea',
    5: 'rating',
    6: 'rank',
    7: 'image',
    9: 'column rating',
    10: 'address',
    11: 'phone',
    12: 'date',
  };

  const ceTypes = [1, 2, 3, 5, 6, 9];

  if (!force) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class' && surveyForm.classList.contains('preview-caution')) {
          initQAMode();
          observer.disconnect();
          console.log('Preview Survey Form : QA Codes On');
          return;
        }
      }
    });
    setTimeout(() => {
      observer.disconnect();
      console.log('QA Mode observer disconnected after 5 seconds');
    }, 5000);

    observer.observe(surveyForm, { attributes: true });
  } else {
    initQAMode();
  }

  const checkQAMode = () => {
    const surveyForm = document.querySelector('#survey_form');
    return surveyForm.classList.contains('qa-mode');
  };
  window.checkQAMode = checkQAMode;
  const updateQASummary = (targetQid, updateText) => {
    try {
      const qaMode = document.querySelector(`#survey${targetQid} .qa-container`);
      if (qaMode) {
        const qaSummary = qaMode.querySelector('.qa-summary');
        const summaryText = qaSummary.textContent;
        let summaryParts = summaryText.split('/');
        summaryParts = summaryParts.map((part) => part.trim());
        summaryParts.push(updateText);

        const uniqueSummaryParts = summaryParts.filter((item, index) => summaryParts.indexOf(item) === index);
        qaSummary.textContent = uniqueSummaryParts.join(' / ');
      }
    } catch (error) {
      console.error('Error updating QA summary:', error);
    }
  };

  window.updateQASummary = updateQASummary;

  function initQAMode() {
    try {
      if (defaultMode) {
        surveyForm.classList.add('qa-mode');
      }
      const allQuestions = surveyForm.querySelectorAll('.survey');
      if (!allQuestions || allQuestions.length === 0) {
        throw new Error('No survey questions found');
      }
      const qaDialog = createQADialog();
      surveyForm.appendChild(qaDialog);
      processQuestions(allQuestions, qaDialog);
      addQAStyles(surveyForm);
      setJump();
    } catch (err) {
      console.error('QA Mode initialization failed:', err.message);
    }
  }

  function createQADialog() {
    const qaDialog = document.createElement('dialog');
    qaDialog.classList.add('qa-dialog');

    const qaDialogHeader = document.createElement('div');
    qaDialogHeader.classList.add('qa-dialog-header');
    qaDialog.appendChild(qaDialogHeader);

    const qaDialogTitle = document.createElement('h3');
    qaDialogTitle.classList.add('qa-dialog-title');
    qaDialogTitle.textContent = 'QA Mode';
    qaDialogHeader.appendChild(qaDialogTitle);

    const qaDialogClose = document.createElement('button');
    qaDialogClose.classList.add('qa-dialog-close');
    qaDialogClose.textContent = '×';
    qaDialogClose.addEventListener('click', () => qaDialog.close());
    qaDialogHeader.appendChild(qaDialogClose);

    const qaDialogContent = document.createElement('div');
    qaDialogContent.classList.add('qa-dialog-content');
    qaDialog.appendChild(qaDialogContent);

    qaDialog.addEventListener('click', (e) => {
      const dialogDimensions = qaDialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        qaDialog.close();
      }
    });

    try {
      const toggleContainer = document.createElement('div');
      toggleContainer.classList.add('qa-mode-toggle-container');

      const qaModeToggle = document.createElement('input');
      qaModeToggle.type = 'checkbox';
      qaModeToggle.id = 'qaToggle';
      qaModeToggle.classList.add('qa-mode-toggle');
      qaModeToggle.checked = defaultMode;

      const qaModeLabel = document.createElement('label');
      qaModeLabel.classList.add('qa-mode-label');
      qaModeLabel.setAttribute('for', 'qaToggle');
      qaModeLabel.textContent = 'QA Mode On/Off';

      toggleContainer.appendChild(qaModeToggle);
      toggleContainer.appendChild(qaModeLabel);
      qaDialogContent.appendChild(toggleContainer);

      const guideContainer = document.createElement('div');
      guideContainer.classList.add('qa-mode-guide-container');
      guideContainer.innerHTML = `
      <div><b>설문 테스트</b>를 위한 기능입니다.</div>
      <div style="margin-top: 5px;">
        <b>QA Mode 기능</b>
        <ul class="qa-mode-feature-list">
          <li>문항 번호 제시</li>
          <li>속성 코드 제시</li>
          <li>적용된 로직 제시</li>
          <li>이동 문항 제시</li>
          <li>점프 기능 활성화</li>
        </ul>
      </div>
      <div class="qa-mode-guide">✅ 문항 점프를 해도 해당 문항의 로직(응답 전)이 실행됩니다.</div>
      <div class="qa-mode-guide">✅ 베이스 로직은 제시되지 않습니다.</div>
      <div class="qa-mode-guide">✅ 오베이 앱에서 사용(리뷰 중)하려면 <b>force=true</b> 옵션 사용</div>
      <div class="qa-mode-guide">⚠️ 테스트 후 기능 삭제 또는 주석, <b>force=false</b> 옵션 사용</div>
      <div class="qa-mode-guide">⚠️ <b>문항 점프 시</b> 문항 번호가 <b style="color:#eb4141">빨간색</b> 으로 표시되면 응답 베이스가 맞지 않은 상태를 나타냅니다.</div>
      `;

      qaDialogContent.appendChild(guideContainer);

      qaModeToggle.addEventListener('change', () => {
        surveyForm.classList.toggle('qa-mode', qaModeToggle.checked);
      });
    } catch (error) {
      console.error('Error creating QA mode toggle:', error);
    }

    return qaDialog;
  }

  function getEntryCheckString() {
    const entryCheckString = entryCheck.toString();
    const caseRegex = /case\s+(\d+)\s*:(.*?)(?=case\s+\d+\s*:|default:|$)/gs;

    let match;
    const caseBlocks = {};

    while ((match = caseRegex.exec(entryCheckString)) !== null) {
      const condCode = match[2].trim();
      caseBlocks[match[1]] = condCode;
    }

    return caseBlocks;
  }

  function processQuestions(allQuestions, qaDialog) {
    [...allQuestions].forEach((question, index) => {
      try {
        if (!question.id) {
          throw new Error('Question element missing ID');
        }

        const qNumber = Number(question.id.replace('survey', ''));
        const questionBody = question.querySelector('.question-body');
        if (!questionBody) {
          throw new Error(`Question body not found for Q${qNumber}`);
        }

        const qaContainer = document.createElement('div');
        qaContainer.classList.add('qa-container');

        const questionName = document.createElement('div');
        questionName.classList.add('question-name');
        questionName.textContent = `Q${qNumber}`;
        qaContainer.appendChild(questionName);

        let otherQA = [];

        const nextq = surveyForm.querySelector(`#survey${cur} input#nextq`);
        if (nextq) {
          const nextqNumber = Number(nextq.value);
          let nextQnumber = nextqNumber === 0 || isNaN(nextqNumber) ? Number(qNumber) + 1 : nextqNumber;
          if (index === allQuestions.length - 1) {
            otherQA.push(`nextq: qualified`);
          } else if (nextQnumber === -1) {
            otherQA.push(`nextq: end`);
          } else {
            otherQA.push(`nextq: Q${nextQnumber}`);
          }
        }

        const pipingTypeElement = question.querySelector('#pipingType');
        if (pipingTypeElement) {
          const pipingType = Number(pipingTypeElement.value);
          const pipingParentElement = question.querySelector('#pipingParent');
          if (pipingParentElement && (pipingType === 1 || pipingType === 2)) {
            const pipingParent = pipingParentElement.value;
            let pipeType;
            if (pipingType === 1) {
              pipeType = 'o';
            }
            if (pipingType === 2) {
              pipeType = 'x';
            }
            otherQA.push(`pipe(${pipeType}): Q${pipingParent}`);
          }
        }

        const typeElement = question.querySelector('#type');
        if (typeElement) {
          const questionType = Number(typeElement.value);
          if ([1, 2, 9, 6].includes(questionType)) {
            const attributes = question.querySelectorAll('.answer-choice-wrapper');
            if (attributes && attributes.length > 0) {
              [...attributes].forEach((attr) => {
                const input = attr.querySelector('input');
                if (input) {
                  const attrSpan = document.createElement('span');
                  attrSpan.classList.add('qa-attribute');
                  attrSpan.textContent = input.value;

                  const nextq = attr.querySelector('#next');
                  if (nextq) {
                    const nextqNumber = Number(nextq.value);
                    if (!(nextqNumber === 0 || isNaN(nextqNumber))) {
                      attrSpan.textContent = `${attrSpan.textContent} > Q${nextqNumber}`;
                      attrSpan.classList.add('qa-attr-nextq');
                    }
                  }

                  attr.insertBefore(attrSpan, attr.firstChild);
                }
              });
            }
          }
          if (questionType === 5) {
            const cells = question.querySelectorAll('.answer table tbody tr:first-child td');
            const score = cells.length;
            if (score < 9) {
              [...cells].forEach((cell) => {
                cell.classList.add('qa-rating-cell');
                const cellValue = Number(cell.querySelector('input').value);
                const qaValue = document.createElement('div');
                qaValue.classList.add('qa-attribute', 'rating-value');
                qaValue.textContent = cellValue;
                cell.appendChild(qaValue);
              });
            }
          }
        }
        const questionSurveyTitle = question.querySelector('.question-survey-title');
        if (questionSurveyTitle) {
          questionSurveyTitle.addEventListener('click', () => {
            qaDialog.showModal();
          });
        }
        const qaSummary = otherQA.join(' / ');
        const qaText = document.createElement('div');
        qaText.classList.add('qa-summary');
        qaText.textContent = qaSummary;
        qaContainer.appendChild(qaText);

        questionBody.insertBefore(qaContainer, questionBody.firstChild);
      } catch (err) {
        console.error(`Error processing question: ${err.message}`);
      }
    });
    const caseBlocks = getEntryCheckString();
    Object.entries(caseBlocks).forEach(([qnum, cond]) => {
      const match = cond.match(/getNextQuestionRank\((\d+)\)/);
      if (match) {
        const nextQuestion = match[1];
        let failGotoNumber = nextQuestion;
        if (nextQuestion.includes('cur')) {
          const curChange = nextQuestion.replace('cur', qnum);
          failGotoNumber = eval(curChange);
        }

        const beforeQuestion = document.querySelector(`#survey${qnum - 1} .qa-container`);
        const qaSummary = beforeQuestion.querySelector('.qa-summary');
        const summaryText = qaSummary.textContent;
        let summaryParts = summaryText.split('/');
        summaryParts = summaryParts.map((part) => part.trim());
        summaryParts.push(`fail goto: Q${failGotoNumber}`);
        qaSummary.textContent = summaryParts.join(' / ');
      }
    });
  }

  function addQAStyles(surveyForm) {
    const testingCSS = `
.qa-container, .qa-attribute, .jump-container, .option-handler-qa { display: none; }
.question-survey-title { cursor: pointer; }
.qa-mode {
  position: relative;

  .option-handler-qa {
    display: block;
    position: absolute;
    right: 5%;
    top: 50%;
    font-size: 0.7rem;
    color: #7b7b7b;
    pointer-events: none;
    background: white;
    padding: 3px;
    border-radius: 10px;
    opacity: 0.7;
  }

  .qa-option-button {
    position: fixed;
    top: 19%;
    right: 10%;
    z-index: 9999;
    cursor: pointer;
    width: fit-content;
    border-radius: 100%;

    svg {
      width: 30px;
      height: 30px;
    }
  }

  .qa-container {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;

    .question-name {
      font-size: 0.8rem;
      font-weight: bold;
      padding: 5px;
      background-color: #26a9df;
      color: white;
      border-radius: 5px;

      &.qa-not-base {
        background-color: #eb4141;
      }
    }

    .qa-summary {
      font-size: 0.7rem;
      padding: 3px;
      width: 100%;
      font-style: italic;
      color: #494949;
    }

    .qa-mode-guide-container {
      font-size: 0.7rem;
      padding: 3px;
      width: 100%;
      color: #494949;

      .qa-mode-feature-list {
        list-style: disc;
        font-size: 0.6rem;
        font-style: italic
      }
    }
  }

  .answer-choice-wrapper, .qa-rating-cell {
    position: relative;
  }

  .qa-attribute {
    display: block;
    position: absolute;
    left: 4px;
    font-size: 0.6rem;
    color: #494949;
    font-style: italic;
    z-index: 999;
    pointer-events: none;

    &.qa-attr-nextq {
        color:#eb4141;
        font-weight: bold;
    }

    &.rating-value {
        top: -25%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
  }
  
  
  .jump-container {
    display: block;
    position: absolute;
    top: 1%;
    left: 35%;
    z-index: 9999;
    max-width: 110px;
    
    .jump-select-wrapper {
      position: relative;
      width: 100%;
    }
    
    .jump-search {
      width: 100%;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 0.7rem;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(38, 169, 223, 0.3);
    }
    
    .jump-search:hover, .jump-search:focus {
      border-color: #26a9df;
      outline: none;
    }
    
    .jump-dropdown {
      display: none;
      position: absolute;
      top: 100%;
      width: 100%;
      min-width: 200px;
      max-height: 300px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      overflow: auto;
    }
    
    .jump-dropdown.active {
      display: block;
    }
    
    .jump-option {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 0.7rem;
      transition: background 0.2s ease;
      margin-block: 2px;

      p {
        margin: unset!important;
      }

      .current-answer {
        padding-top: 5px;
        font-style: italic;
        color: #26a9df;
        font-weight: bold;

        &.qa-type-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
    
    .jump-option:hover {
      background: #f0f0f0;
    }
    
    .jump-option.hidden {
      display: none;
    }
    
    .jump-option-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.qa-dialog {
  position: fixed;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 0;
  border: none;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  background: #fff;
  width: 90%;
  max-width: 500px;

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .qa-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 10px;
    padding-block: 10px;
    background: #f8f9fa;
    border-radius: 12px 12px 0 0;
    border-bottom: 1px solid #e9ecef;

    .qa-dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #212529;
    }

    .qa-dialog-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6c757d;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        background: #e9ecef;
        color: #212529;
      }
    }
  }

  .qa-dialog-content {
    padding: 24px;
    overflow-y: auto;
    max-height: calc(90vh - 80px);
    color: #495057;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .qa-mode-toggle-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .qa-mode-label {
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
    }

    .qa-mode-guide {
      font-style: italic;
      margin-block: 7px;
    }

    .qa-mode-toggle {
      position: relative;
      width: 40px;
      height: 20px;
      -webkit-appearance: none;
      appearance: none;
      background: #e9ecef;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-block;

      &::before {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: all 0.3s ease;
      }

      &:checked {
        background: #26a9df;

        &::before {
          left: 20px;
        }
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(38, 169, 223, 0.2);
      }
    }
  }
}
`;
    const styleElement = document.createElement('style');
    styleElement.textContent = testingCSS;
    surveyForm.appendChild(styleElement);
  }

  function setJump() {
    const allQuestions = surveyForm.querySelectorAll('.survey');
    const questions = [...allQuestions].map((question) => {
      const qNumber = Number(question.id.replace('survey', ''));
      const qTitle = question.querySelector('.question-description').textContent.trim().replace(/\n/g, ' ');
      const qType = Number(question.querySelector('#type').value);

      return {
        qNumber,
        qTitle,
        qType,
      };
    });

    const initContainer = surveyForm.querySelector('.jump-container');
    if (initContainer) {
      initContainer.remove();
    }

    const jumpContainer = document.createElement('div');
    jumpContainer.classList.add('jump-container');

    const selectWrapper = document.createElement('div');
    selectWrapper.classList.add('jump-select-wrapper');

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.classList.add('jump-search');
    searchInput.placeholder = 'Question Jump';

    const dropdown = document.createElement('div');
    dropdown.classList.add('jump-dropdown');

    questions.forEach((question) => {
      const option = document.createElement('div');
      option.classList.add('jump-option', `qa-survey${question.qNumber}`);
      option.setAttribute('data-qtype', question.qType);
      option.setAttribute('tabindex', '0');

      option.innerHTML = `<p><b>[Q${question.qNumber}]</b> (${
        inputTypes[question.qType]
      })</p><p class="jump-option-title">${question.qTitle}</p><p class="current-answer"></p>`;
      option.setAttribute('data-qNumber', question.qNumber);
      dropdown.appendChild(option);

      option.addEventListener('click', () => {
        handleQuestionSelection(question.qNumber, option.textContent);
        dropdown.classList.remove('active');
        searchInput.value = '';
      });
    });

    searchInput.addEventListener('focus', () => {
      dropdown.classList.add('active');
    });

    const options = dropdown.querySelectorAll('.jump-option');
    searchInput.addEventListener('keyup', (e) => {
      const searchTerm = searchInput.value.toLowerCase();
      if (!dropdown.classList.contains('active')) {
        dropdown.classList.add('active');
      }
      options.forEach((option) => {
        if (option.textContent.toLowerCase().includes(searchTerm)) {
          option.classList.remove('hidden');
        } else {
          option.classList.add('hidden');
        }
      });

      if (e.key === 'ArrowDown') {
        const firstVisibleOption = [...dropdown.querySelectorAll('.jump-option')].find(
          (opt) => !opt.classList.contains('hidden')
        );
        if (firstVisibleOption) {
          firstVisibleOption.focus();
        }
      }

      if (e.key === 'Enter') {
        const visibleOption = [...dropdown.querySelectorAll('.jump-option')].filter(
          (opt) => !opt.classList.contains('hidden')
        );
        if (visibleOption.length > 0) {
          visibleOption[0].click();
        }
      }

      if (e.key === 'Escape') {
        dropdown.classList.remove('active');
        searchInput.blur();
        searchInput.value = '';
        return;
      }
    });

    dropdown.addEventListener('keydown', (e) => {
      const visibleOptions = [...dropdown.querySelectorAll('.jump-option')].filter(
        (opt) => !opt.classList.contains('hidden')
      );

      if (visibleOptions.length === 0) return;

      const currentFocused = document.activeElement;
      const currentIndex = visibleOptions.indexOf(currentFocused);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex === -1 || currentIndex === visibleOptions.length - 1) {
          visibleOptions[0].focus();
        } else {
          visibleOptions[currentIndex + 1].focus();
        }
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex === -1 || currentIndex === 0) {
          visibleOptions[visibleOptions.length - 1].focus();
        } else {
          visibleOptions[currentIndex - 1].focus();
        }
      }

      if (e.key === 'Enter' && currentIndex !== -1) {
        e.preventDefault();
        visibleOptions[currentIndex].click();
      }

      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        searchInput.focus();
        const length = searchInput.value.length;
        searchInput.setSelectionRange(length, length);
      }
    });

    const hideOptions = () => {
      options.forEach((option) => {
        option.classList.add('hidden');
      });
    };

    const showOptions = () => {
      options.forEach((option) => {
        option.classList.remove('hidden');
      });
    };

    const showCurrentAnswer = () => {
      const formData = new FormData(surveyForm);

      const answers = {};
      formData.forEach((value, key) => {
        const qNumber = key.match(/answer\[(\d+)\]/)?.[1] || undefined;
        if (qNumber === undefined) {
          return;
        }

        if (value.trim() === '') {
          return;
        }

        if (answers[qNumber]) {
          let currentAnswers = answers[qNumber];
          currentAnswers.push(value);
          answers[qNumber] = currentAnswers;
        } else {
          answers[qNumber] = [value];
        }
      });

      Object.entries(answers).forEach(([key, value]) => {
        const option = dropdown.querySelector(`.qa-survey${key}`);
        const qType = Number(option.getAttribute('data-qtype'));

        const numberValue = value.filter((v) => !isNaN(Number(v)));
        numberValue.sort((a, b) => a - b);

        const textValue = value.filter((v) => isNaN(Number(v)));

        const answerArrays = [...numberValue, ...textValue];

        let showAnswer = `> ${answerArrays.join(', ')}`;

        if (qType === 6) {
          const rankNumberAnswer = [];
          const rankTextAnswer = [];
          value.forEach((v) => {
            const splitValue = v.split('-');
            if (splitValue.length !== 2 || isNaN(Number(splitValue[0])) || isNaN(Number(splitValue[1]))) {
              rankTextAnswer.push(v);
            } else {
              rankNumberAnswer.push(splitValue.map((v) => Number(v)));
            }
          });
          rankNumberAnswer.sort((a, b) => a[1] - b[1]);
          const rankAnswerText = rankNumberAnswer.map((v) => `${v[1]}순위: ${v[0]}`).join(' / ');

          showAnswer = `> ${rankAnswerText}`;
          if (rankTextAnswer.length > 0) {
            const rankTextSummary = rankTextAnswer.join(' / ');
            showAnswer = `${showAnswer} / ${rankTextSummary}`;
          }
        }

        const target = option.querySelector('.current-answer');
        if (!ceTypes.includes(qType)) {
          target.classList.add('qa-type-text');
        }
        target.textContent = showAnswer;
      });
    };

    document.addEventListener('click', (e) => {
      if (!selectWrapper.contains(e.target)) {
        dropdown.classList.remove('active');
      } else {
        showCurrentAnswer();
        const currentJumpOption = dropdown.querySelector(`.qa-survey${cur}`);
        if (currentJumpOption) {
          dropdown.scrollTop = currentJumpOption.offsetTop - dropdown.offsetTop;
        }
      }

      showOptions();
    });

    selectWrapper.appendChild(searchInput);
    selectWrapper.appendChild(dropdown);
    jumpContainer.appendChild(selectWrapper);
    surveyForm.appendChild(jumpContainer);

    const curHandler = (showNumber) => {
      allQuestions.forEach((question) => {
        const qNumber = Number(question.id.replace('survey', ''));
        if (qNumber === showNumber) {
          question.style.display = 'block';
        } else {
          question.style.display = 'none';
        }
      });
    };

    function handleQuestionSelection(qNumber, selectedValue) {
      cur = qNumber;
      let baseChk = true;

      if (caseBlocks[qNumber]) {
        let cond = extractIfCondition(caseBlocks[qNumber].replace('break;', '').replace('\n', '').trim());
        cond = cond.substring(2, cond.length - 1);
        const conditions = splitTopLevelConditions(cond.replace(' ', '').replace('\n', '').replace('\t', ''));
        conditions.forEach((condition) => {
          try {
            const cond = eval(condition);
            if (!cond) {
              baseChk = false;
            }
          } catch (err) {
            console.error(`Error evaluating condition: ${err.message}`);
          }
        });
      }

      curHandler(qNumber);

      cur = qNumber;

      const qaQuestionName = document.querySelector(`#survey${qNumber} .question-name`);
      if (qaQuestionName) {
        if (baseChk) {
          qaQuestionName.classList.remove('qa-not-base');
        } else {
          qaQuestionName.classList.add('qa-not-base');
        }
      }

      referAnswers(cur);

      hideOptions();
    }

    const caseBlocks = getEntryCheckString();

    function splitTopLevelConditions(code) {
      const parts = [];
      let current = '';
      let depth = 0;
      let inString = false;
      let stringChar = '';
      let prevChar = '';

      for (let i = 0; i < code.length; i++) {
        const char = code[i];

        if (inString) {
          current += char;
          if (char === stringChar && prevChar !== '\\') inString = false;
        } else if (char === '"' || char === "'" || char === '`') {
          current += char;
          inString = true;
          stringChar = char;
        } else {
          '({['.includes(char) && depth++; //]})({[
          ']})'.includes(char) && depth--;

          if (char === '&' && i + 1 < code.length && code[i + 1] === '&' && depth === 0) {
            parts.push(current.trim());
            current = '';
            i++;
          } else {
            current += char;
          }
        }
        prevChar = char;
      }

      if (current.trim()) parts.push(current.trim());
      return parts;
    }
  }

  function extractIfCondition(code) {
    const ifIndex = code.indexOf('if');

    if (ifIndex === -1) return null;

    const start = code.indexOf('(', ifIndex);
    if (start === -1) return null;

    let openParens = 1;
    let i = start + 1;

    while (i < code.length && openParens > 0) {
      if (code[i] === '(') openParens++;
      else if (code[i] === ')') openParens--;
      i++;
    }

    if (openParens !== 0) return null;

    return code.slice(start + 1, i - 1).trim();
  } /* ) */
}
/* ----------- qaMode 실사 전 삭제 --------------- */

/* ----------- optionHandler --------------- */
const optionHandler = (options, cond, qid, logicType) => {
  try {
    let target = qid;
    if (target === null) {
      target = cur;
    }

    if (typeof target !== 'number') {
      throw new Error('qid must be a number');
    }

    const qname = `#survey${target}`;

    if (!Array.isArray(options)) {
      options = [options];
    }

    options.forEach((option) => {
      const optionType = typeof option;
      const targetElement = optionType === 'number' ? `#answer${target}-${option}` : option;
      const targetInput = document.querySelector(`${qname} ${targetElement}`);
      const targetOption = optionType === 'number' ? targetInput.parentNode : targetInput;
      const shouldFilter = (cond && logicType === 'hide') || (!cond && logicType === 'show');

      targetOption.style.setProperty('display', shouldFilter ? 'none' : 'block', 'important');

      if (targetInput.tagName.toLowerCase() === 'input') {
        if (shouldFilter) {
          targetInput.checked = false;
          targetInput.readOnly = true;
        } else {
          targetInput.readOnly = false;
        }
      }

      if (optionType === 'number') {
        const label = targetOption.querySelector(`label[for="answer${target}-${option}"]`);
        if (typeof checkQAMode === 'function' && checkQAMode()) {
          label.style.position = 'relative';
          const hideLogicDiv = document.createElement('div');
          hideLogicDiv.classList.add('option-handler-qa');
          hideLogicDiv.textContent = `${logicType}`;

          if (!label.querySelector('.option-handler-qa')) {
            label.appendChild(hideLogicDiv);
          } else {
            label.querySelector('.option-handler-qa').textContent = `${logicType}`;
          }
        } else {
          label.removeAttribute('style');
        }
      }
    });
  } catch (error) {
    console.error('Error hiding option:', error);
  } finally {
    return true;
  }
};

window.hide = (options, cond = true, qid = null) => {
  return optionHandler(options, cond, qid, 'hide');
};

window.show = (options, cond = true, qid = null) => {
  return optionHandler(options, cond, qid, 'show');
};

window.reset = () => {
  return optionHandler(options(cur), true, cur, 'show');
};

window.disabled = (options, cond = true, qid = null) => {
  try {
    let target = qid;
    if (target === null) {
      target = cur;
    }

    if (typeof target !== 'number') {
      throw new Error('qid must be a number');
    }

    const qname = `#survey${target}`;
    const currentQuestion = document.querySelector(qname);
    if (!currentQuestion.querySelector('style[data-disabled-style]')) {
      const disabledCSS = `
<style data-disabled-style>
${qname} .answer-choice-wrapper {
  transition: opacity 0.5s ease;
}

.disabled-logic {
  pointer-events: none!important;
  opacity: 0.3!important;
}
</style>
`;
      currentQuestion.insertAdjacentHTML('beforeend', disabledCSS);
    }

    if (!Array.isArray(options)) {
      options = [options];
    }

    options.forEach((option) => {
      const optionType = typeof option;
      const targetElement = optionType === 'number' ? `#answer${target}-${option}` : option;
      const targetInput = document.querySelector(`${qname} ${targetElement}`);
      const targetOption = optionType === 'number' ? targetInput.parentNode : targetInput;

      if (cond) {
        targetOption.classList.add('disabled-logic');
        targetInput.readOnly = true;
      } else {
        targetOption.classList.remove('disabled-logic');
        targetInput.readOnly = false;
      }

      if (optionType === 'number') {
        const label = targetOption.querySelector(`label[for="answer${target}-${option}"]`);
        if (typeof checkQAMode === 'function' && checkQAMode()) {
          label.style.position = 'relative';
          const hideLogicDiv = document.createElement('div');
          hideLogicDiv.classList.add('option-handler-qa');
          hideLogicDiv.textContent = 'disabled';

          if (!label.querySelector('.option-handler-qa')) {
            label.appendChild(hideLogicDiv);
          }
        } else {
          label.removeAttribute('style');
        }
      }
    });
  } catch (error) {
    console.error('Error disabling option:', error);
  } finally {
    return true;
  }
};

/* ----------- optionHandler end --------------- */

/* ----------- 동시 선택 불가 로직 --------------- */
window.thisOrThat = (thisCodes, thatCodes = null, qNum = null) => {
  return exec(() => {
    let target = qNum;
    if (target === null) {
      target = cur;
    }

    let thisAnswers = thisCodes;
    if (thatCodes === null) {
      if (!Array.isArray(thisCodes)) {
        console.error('When thatCodes is null, thisCodes must be an array');
        return;
      }
      thisAnswers = thisCodes;
    } else if (!Array.isArray(thisAnswers)) {
      thisAnswers = [thisAnswers];
    }

    let thatAnswers = thatCodes;
    if (thatCodes !== null && !Array.isArray(thatAnswers)) {
      thatAnswers = [thatAnswers];
    }

    const currentElement = document.querySelector(`#survey${target}`);
    currentElement.addEventListener('click', () => {
      if (thatCodes === null) {
        thisAnswers.forEach((code, index) => {
          const currentInput = currentElement.querySelector(`input[id="answer${target}-${code}"]`);
          if (currentInput && currentInput.checked) {
            const otherCodes = thisAnswers.filter((_, idx) => idx !== index);
            disabled(otherCodes, true, target);
          }
        });

        const anyChecked = thisAnswers
          .map((code) => currentElement.querySelector(`input[id="answer${target}-${code}"]`))
          .some((el) => el && el.checked);

        if (!anyChecked) {
          disabled(thisAnswers, false, target);
        }
      } else {
        const thisChecked = thisAnswers
          .map((code) => currentElement.querySelector(`input[id="answer${target}-${code}"]`))
          .some((el) => el && el.checked);

        const thatChecked = thatAnswers
          .map((code) => currentElement.querySelector(`input[id="answer${target}-${code}"]`))
          .some((el) => el && el.checked);

        disabled(thisAnswers, thatChecked, target);
        disabled(thatAnswers, thisChecked, target);
      }
    });
  });
};
/* ----------- 동시 선택 불가 로직 End --------------- */

/* ----------- ratingHandler --------------- */
// 평가형 문항 일괄 처리
// ratingHandler({ reverse: true, showValue: true});

window.rating = (obj) => {
  return ratingHandler({ ...obj, qNum: cur });
};

function ratingHandler({ reverse = false, showValue = false, qNum = null, format = null }) {
  try {
    const surveyForm = document.querySelector('#survey_form');
    let ratings = [];
    // 평가형 문항만 필터링
    if (qNum === null) {
      const allQuestions = surveyForm.querySelectorAll('.survey');
      ratings = [...allQuestions].filter((question) => [5, 9].includes(Number(question.querySelector('#type').value)));
    } else {
      if (Array.isArray(qNum)) {
        ratings = qNum.map((q) => surveyForm.querySelectorAll(`#survey${q}`));
      } else {
        ratings = [surveyForm.querySelector(`#survey${qNum}`)];
      }
    }

    ratings.forEach((rating) => {
      const cells = rating.querySelectorAll('.answer-eval-wrapper tbody tr:first-child td');
      const score = cells.length;
      const ratingType = Number(rating.querySelector('#type').value);
      const tableFlag = score > 7;

      let ratingCSS = '';
      let tableCellCSS = '';

      if (ratingType === 5) {
        tableCellCSS += `
        td {
            width: 100%;
        }`;

        if (reverse) {
          ratingCSS += `
        #${rating.id} .answer-eval-wrapper {
            tbody tr {
                ${tableFlag ? 'display: flex;' : ''}
                flex-direction: row-reverse;
                
                ${tableFlag ? tableCellCSS : ''}
        
                &:last-child {
                  td:first-child {
                    text-align: right!important;
                  }
                  td:last-child {
                    text-align: left!important;
                  }
                }
            }
        }
        `;
        }

        if (showValue && !tableFlag) {
          ratingCSS += `
            #${rating.id} table tbody tr:first-child td {
                position: relative;
            }

            #${rating.id} .cell-value {
                position: absolute;
                bottom: -60%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 0.7rem;
                z-index: 999;
                color: #2b2a2a;
                pointer-events: none;
                font-weight: bold;
                width: 100%;
                text-align: center;
            }`;

          cells.forEach((cell) => {
            const cellValue = Number(cell.querySelector('input').value);
            const valueLabel = document.createElement('div');
            valueLabel.classList.add('cell-value');
            valueLabel.textContent = `[${cellValue}점]`;
            if (format !== null) {
              valueLabel.textContent = format.replace('%d', cellValue);
            }
            cell.appendChild(valueLabel);
          });
        }
      }

      if (ratingType === 9) {
        ratingCSS += `
  #${rating.id} .answer .answer-wrapper {
    display: flex;
    flex-direction: column-reverse;
  }
  `;
      }

      const styleTag = document.createElement('style');
      styleTag.textContent = ratingCSS;
      rating.insertBefore(styleTag, rating.firstChild);
    });
  } catch (error) {
    console.error('ratingHandler error:', error);
  } finally {
    return true;
  }
}

/* ----------- ratingHandler --------------- */

/* ----------- utils --------------- */
window.questionChange = (fn, qNum = null) => {
  return exec(() => {
    if (qNum === null) {
      qNum = cur;
    }
    const question = document.querySelector(`#survey${qNum}`);
    const existingListeners = question.getAttribute('data-has-change');
    if (!existingListeners) {
      question.addEventListener('change', fn);
      question.setAttribute('data-has-change', 'true');
    }
  });
};
/* ----------- exec End --------------- */

/* ----------- validate --------------- */
const exec = (fn) => {
  try {
    fn();
  } catch (error) {
    console.error(error);
  } finally {
    return true;
  }
};

window.exec = exec;

const cond = (fn) => {
  try {
    return fn();
  } catch (error) {
    console.error(error);
    return true;
  }
};

window.cond = cond;

window.err = (msg) => {
  alert(msg);
  return true;
};

window.softFlag = true;
window.softErr = (msg) => {
  if (window.softFlag) {
    alert(msg);
    window.softFlag = false;
    return true;
  } else {
    window.softFlag = true;
    return false;
  }
};

const validate = (fn, target = null) => {
  const wrappedFn = () => {
    try {
      const result = fn();
      return result;
    } catch (error) {
      return false;
    }
  };

  return exec(() => {
    if (target !== null && typeof target !== 'number') {
      throw new Error('target must be a number');
    }

    let qNumber = target;
    if (qNumber === null) {
      qNumber = cur;
    }

    if (typeof fn !== 'function') {
      throw new Error('fn must be a function');
    }

    const targetQuestion = document.querySelector(`#survey${qNumber}`);
    const targetBtn = targetQuestion.querySelector('.next-btn-wrapper');
    targetBtn.removeAttribute('onclick');
    targetBtn.onclick = null;

    targetBtn.addEventListener('click', () => {
      const validateResult = wrappedFn();

      if (validateResult === true) {
        return;
      } else {
        goNext();
      }
    });
  });
};

window.validate = validate;
/* ----------- validate End --------------- */

/* ----------- replaceText --------------- */
const replaceText = (replacements, qNum = null) => {
  return exec(() => {
    if (typeof replacements !== 'object' || replacements === null) {
      throw new Error('replacements must be an object');
    }

    let target = qNum === null ? cur : qNum;
    const question = document.querySelector(`#survey${target}`);
    if (!question) {
      throw new Error(`Q${target} is not found`);
    }

    const questionHTML = question.innerHTML;
    if (!window.questionOriginalHTML) {
      window.questionOriginalHTML = {};
    }

    const questionId = `q${target}`;
    if (!window.questionOriginalHTML[questionId]) {
      window.questionOriginalHTML[questionId] = questionHTML;
    }

    let targetQuestion = window.questionOriginalHTML[questionId];

    for (const [key, conditions] of Object.entries(replacements)) {
      const pattern = new RegExp(`{{${key}}}`, 'g');

      let changeText = conditions;
      if (typeof conditions === 'object' && conditions !== null) {
        const pipe = Object.entries(conditions).find(([key, value]) => value === true);
        if (!pipe || pipe.length === 0) {
          changeText = 'UNDEFINED';
        } else {
          changeText = pipe[0];
        }
      }

      targetQuestion = targetQuestion.replace(pattern, changeText);
    }

    question.innerHTML = targetQuestion;
    referAnswers(target);
    common_align(target);
  });
};

window.replaceText = replaceText;

/* ----------- replaceText --------------- */

/* ----------- Question Class --------------- */
const values = (qNum) => {
  if (qNum === null) {
    throw new Error('qNum is required');
  }

  const question = document.querySelector(`#survey${qNum}`);
  if (!question) {
    throw new Error(`Q${qNum} is not found`);
  }

  const inputs = question.querySelectorAll('input[type="radio"], input[type="checkbox"]');
  if (inputs.length === 0) {
    return [];
  }

  const inputValues = [...inputs].map((input) => {
    const valueCheck = Number(input.value);

    if (isNaN(valueCheck)) {
      const rankCheck = input.value.split('-');
      if (rankCheck.length === 2) {
        return Number(rankCheck[0]);
      } else if (rankCheck.length === 3) {
        return -Number(rankCheck[1]);
      }
    } else {
      return Number(input.value);
    }
  });

  class Values extends Array {
    constructor(inputValues) {
      super(...inputValues);
      this.inputValues = [...inputValues];
      this.sort((a, b) => a - b);
    }

    get order() {
      return [...this.inputValues];
    }

    valueOf() {
      return Array.from(this);
    }

    toString() {
      return this.valueOf().toString();
    }
  }

  return new Values(inputValues);
};

window.values = values;

class BaseAttribute {
  constructor(parent) {
    this.parent = parent;
    this.qNum = this.parent.qNum;
  }
  get node() {
    throw new Error('node getter must be implemented by subclass');
  }
  returnSelf() {
    return this;
  }
}

class SetAttribute extends BaseAttribute {
  constructor(parent, value, target, etc) {
    super(parent);
    this.value = value;
    this.target = target;
    this.label = `a${value === -1 ? 0 : value}`;
    this.isEtc = etc;
    this.element = document.querySelector(this.target);
    const labelElement = this.node.parentNode.querySelector('.answer-label');
    this.originText = labelElement ? labelElement.cloneNode(true).textContent : '';
    this.text = this.originText;
  }

  get node() {
    return this.element.parentNode;
  }

  setText(text = null) {
    const labelElement = this.node.querySelector('.answer-label');
    if (labelElement) {
      if (text === null) {
        labelElement.innerHTML = `<p class="fr-tag">${this.originText}</p>`;
        this.text = this.originText;
      } else {
        labelElement.innerHTML = `<p class="fr-tag">${text}</p>`;
        this.text = text;
      }
    }
    return this.returnSelf();
  }
}

class SetEtc extends BaseAttribute {
  constructor(parent, code, element) {
    super(parent);
    this.code = Number(code);
    this.element = element;
    this.origin = element ? element : null;

    if (!this.element) {
      return null;
    }
  }

  valueOf() {
    return this.val;
  }

  toString() {
    return this.val;
  }

  get val() {
    let answer = this.element.value;

    const answerSet = this.parent.origin().answers;
    if (answerSet.length !== 0) {
      const etc = answerSet.find((answer) => answer.value.alternative !== null);
      if (etc) {
        answer = etc.value.alternative;
      }
    }

    return answer;
  }

  get node() {
    return document.querySelector(`#survey${this.qNum} input[id="answer${this.qNum}-${this.code}"]`).parentNode;
  }

  placeholder(newPlaceholder = null) {
    const el = this.element;
    if (el === null) {
      return this.returnSelf();
    }

    el.setAttribute('placeholder', newPlaceholder);
    return this.returnSelf();
  }

  isNumber(flag = true) {
    const el = this.element;
    if (el === null) {
      return this.returnSelf();
    }

    if (flag) {
      el.addEventListener('keyup', () => {
        const value = el.value;
        const numericValue = value.replace(/[^0-9]/g, '');
        if (value !== numericValue) {
          el.value = numericValue;
        }
      });
    }

    return this.returnSelf();
  }
}

class SetRankAttribute extends BaseAttribute {
  constructor(parent, rkValue) {
    super(parent);
    this.rkValue = rkValue;
    this.label = `rk${rkValue}`;
    this.#setupDynamicProperties();
  }

  #setupDynamicProperties() {
    const questionValues = this.parent.values;
    if (Array.isArray(questionValues) && questionValues.length > 0) {
      questionValues.forEach((value) => {
        if (typeof value === 'number') {
          const target = `#survey${this.qNum} input[id="answer${this.qNum}-${value}"]`;
          const etc = document.querySelector(
            `#survey${this.qNum} label[for="answer${this.qNum}-${value}"] input[type="text"].answer-etc-text`
          );
          let attrName = etc ? 'etc' : `a${value === -1 ? 0 : value}`;

          if (!document.querySelector(target)) {
            return;
          }

          Object.defineProperty(this, attrName, {
            get() {
              const partentAnswer = this.parent.val;

              if (!partentAnswer) {
                return false;
              }
              const answer = partentAnswer[this.rkValue - 1];
              if (!answer) {
                return false;
              }
              return answer === value;
            },
          });
        }
      });
    }
  }

  any(condition = null) {
    const partentAnswer = this.parent.val;
    if (!partentAnswer) {
      return false;
    }
    if (!Array.isArray(partentAnswer)) {
      return false;
    }

    const answer = partentAnswer[this.rkValue - 1];

    if (condition === null) {
      if (answer === -1) {
        return false;
      } else {
        return answer !== undefined;
      }
    } else {
      if (!Array.isArray(condition)) {
        return answer === condition;
      } else {
        return condition.includes(answer);
      }
    }
  }
}

class RatingAttribute {
  constructor(parent, originText, index) {
    this.parent = parent;
    this.index = index;
    this.originText = originText;
    this.text = this.node.textContent;
  }

  setText(text = null) {
    if (text === null) {
      this.node.innerHTML = `<p class="fr-tag">${this.originText}</p>`;
      this.text = this.originText;
    } else {
      this.node.innerHTML = `<p class="fr-tag">${text}</p>`;
      this.text = text;
    }
    return this;
  }

  get node() {
    return this.parent.node.querySelectorAll('.answer-eval-text')[this.index];
  }
}

class SetQuestion {
  constructor(qNum, surveyId) {
    this.qNum = qNum;
    this.surveyId = surveyId;
    this.currSurvey = this.surveyId === null;
    this.type = null;

    if (this.currSurvey) {
      const question = document.querySelector(`#survey${this.qNum}`);
      const questionType = Number(question.querySelector('#type').value);
      this.type = questionType;

      this.originTitle = question.querySelector('.question-description').cloneNode(true).innerHTML;
      this.originFooter = question.querySelector('.question-range').cloneNode(true).innerHTML;

      this.isRank = this.type === 6;
      this.isRating = [5, 9].includes(this.type);
      this.isRowRating = this.type === 5;
      this.isNPS = this.isRowRating && this.values.length === 11;
      if (this.isRating) {
        this.score = this.values.length;
      }
      this.isOpenEnded = [3, 4].includes(this.type);
      this.originPlaceholder = this.isOpenEnded
        ? question.querySelector(`[name="answer[${this.qNum}]"]`).placeholder || null
        : null;

      this.attr = {};

      const questionValues = values(this.qNum);

      if (Array.isArray(questionValues) && questionValues.length > 0) {
        questionValues.forEach((value, index) => {
          if (typeof value === 'number') {
            const target = `#survey${this.qNum} input[id="answer${this.qNum}-${value}"]`;
            const etc = document.querySelector(
              `#survey${this.qNum} label[for="answer${this.qNum}-${value}"] .answer-etc-text`
            );
            const isEtc = etc ? true : false;
            let attrName = isEtc ? 'etc' : `a${value === -1 ? 0 : value}`;

            if (!document.querySelector(target)) {
              return;
            }

            const attribute = isEtc ? new SetEtc(this, value, etc) : new SetAttribute(this, value, target);

            this.attr[attrName] = attribute;
            Object.defineProperty(this, attrName, {
              get() {
                return this.any(value);
              },
            });
          }
        });

        if (this.isRowRating) {
          const evalTexts = question.querySelectorAll('.answer-eval-text');
          const ratingCategory = evalTexts.length === 2 ? ['left', 'right'] : ['left', 'center', 'right'];
          ratingCategory.forEach((flag, index) => {
            const attribute = new RatingAttribute(this, evalTexts[index].textContent, index);
            this.attr[flag] = attribute;
          });
        }
      }

      if (this.isRank) {
        const minRank = this.min;
        const maxRank = this.max;
        this.ranks = {};
        Array.from({ length: maxRank - minRank + 1 }, (_, i) => minRank + i).forEach((rk) => {
          const rankName = `rk${rk}`;
          this.ranks[rankName] = new SetRankAttribute(this, rk);
          Object.defineProperty(this, rankName, {
            get() {
              return this.ranks[rankName];
            },
          });
        });
      }
    }
  }

  #isOtherSurvey() {
    return !this.currSurvey;
  }

  etcAnswer(value) {
    if (!this.#isOtherSurvey()) {
      return this;
    }
    const answers = getAnswerSet(this.qNum, this.surveyId).getAnswers();
    const answer = answers.find((e) => e.getValue().getOrder() === value);
    return answer.getValue().getAlternative();
  }

  get node() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    return document.querySelector(`#survey${this.qNum}`);
  }

  get origin() {
    return getAnswerSet(this.qNum, this.surveyId);
  }

  get attrs() {
    return Object.values(this.attr);
  }

  valueOf() {
    return this.origin;
  }

  #getFormData() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const surveyForm = document.querySelector('#survey_form');
    const formData = new FormData(surveyForm);
    const filteredData = [...formData]
      .map(([key, value]) => {
        const qNumber = key.match(/answer\[(\d+)\]/)?.[1] || undefined;
        if (Number(qNumber) === this.qNum) {
          return value;
        }
      })
      .filter((value) => value !== undefined)
      .map((value) => {
        if ([10, 11, 12].includes(this.type)) {
          return value !== '' ? value : null;
        } else {
          return isNaN(Number(value)) ? value : Number(value);
        }
      });

    return filteredData;
  }

  #realTimeAnswer() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const formData = this.#getFormData();

    const closeEnded = (data) => {
      return data.filter((value) => typeof value === 'number');
    };
    const openEnded = (data) => {
      return data.filter((value) => typeof value === 'string');
    };
    if ([1, 3, 5, 9].includes(this.type)) {
      const answer = closeEnded(formData);
      return answer.length > 0 ? answer[0] : null;
    }
    if ([2].includes(this.type)) {
      const answer = closeEnded(formData);
      return answer.length > 0 ? answer : null;
    }
    if ([4, 7].includes(this.type)) {
      const answer = openEnded(formData);
      return answer.length > 0 ? answer : null;
    }
    if ([6].includes(this.type)) {
      const rankAnswer = formData
        .map((value) => {
          const parts = value.split('-');
          const rank = parseInt(parts.pop());
          const responseValue = parts.join('-');

          if (!isNaN(parseInt(responseValue))) {
            return {
              value: parseInt(responseValue),
              rank: rank,
            };
          }
          return null;
        })
        .filter((item) => item !== null)
        .sort((a, b) => a.rank - b.rank);

      return rankAnswer.length > 0 ? rankAnswer.map((item) => item.value) : null;
    }

    if ([10].includes(this.type)) {
      if (formData.every((value) => value === null)) {
        return null;
      } else {
        return formData.filter((value) => value !== null).join('|');
      }
    }

    if ([11, 12].includes(this.type)) {
      if (formData.every((value) => value === null)) {
        return null;
      } else {
        return formData.filter((value) => value !== null).join('-');
      }
    }
  }

  any(condition = null) {
    const answers = this.origin;
    if (this.#isOtherSurvey()) {
      return answers.exists(condition);
    }

    if (condition === null) {
      return !this.any([-1]) && this.cnt >= 1;
    } else {
      let formData = this.#realTimeAnswer();
      if (!Array.isArray(formData)) {
        formData = [formData];
      }

      if (Array.isArray(condition)) {
        return answers.exists(condition) || formData.some((value) => condition.includes(value));
      } else if (typeof condition === 'number') {
        return answers.exists(condition) || formData.includes(condition);
      }
    }
  }

  all(condition) {
    const answers = this.origin;
    if (this.#isOtherSurvey()) {
      if (Array.isArray(condition)) {
        return condition.map((value) => answers.exists(value)).every((value) => value === true);
      } else if (typeof condition === 'number') {
        return answers.exists(condition);
      }
    }
    let formData = this.#realTimeAnswer();
    if (!Array.isArray(formData)) {
      formData = [formData];
    }

    if (Array.isArray(condition)) {
      return (
        condition.map((value) => answers.exists(value)).every((value) => value === true) ||
        condition.every((value) => formData.includes(value))
      );
    } else if (typeof condition === 'number') {
      return answers.exists(condition) || formData.includes(condition);
    }
  }

  get val() {
    if (this.#isOtherSurvey()) {
      return this.origin.val();
    }
    let returnValue = null;
    if ([1].includes(this.type)) {
      const ans = this.origin.val();
      returnValue = ans ? ans.order : null;
      return returnValue || this.#realTimeAnswer();
    }
    if ([5, 9, 3, 4, 7, 10, 11, 12].includes(this.type)) {
      returnValue = this.origin.val();
      return returnValue || this.#realTimeAnswer();
    }
    if ([2, 6].includes(this.type)) {
      returnValue = this.origin.answers.map((answer) => answer.value.order);
      const arr = this.#realTimeAnswer() === null ? [] : this.#realTimeAnswer();
      return returnValue.length > 0 ? returnValue : arr;
    }
  }

  get answer() {
    if (this.#isOtherSurvey()) {
      return this.origin.toBriefString();
    }
    const answerList = this.origin.answers.map((ans) => {
      const value = ans.value;
      const type = ans.type;
      if (type === 'text') {
        return value;
      } else {
        const description = value.description;
        const alternative = value.alternative;
        if (alternative !== null) {
          return alternative;
        } else {
          return description;
        }
      }
    });

    return answerList.join(', ');
  }

  get cnt() {
    if (this.#isOtherSurvey()) {
      return this.origin.len();
    }

    let formData = this.#realTimeAnswer();
    if (!Array.isArray(formData)) {
      formData = [formData];
    }

    return formData.length;
  }

  just(eqv) {
    if (this.#isOtherSurvey()) {
      return this.origin.eqv(eqv);
    }
    let formData = this.#realTimeAnswer();
    if (!Array.isArray(formData)) {
      formData = [formData];
    }

    let result = null;
    if ([1, 2, 5, 6, 9].includes(this.type) && formData) {
      result = formData.includes(eqv) && formData.length === 1;
    }

    return this.origin.eqv(eqv) || result;
  }

  get title() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const description = this.node.querySelector('.question-description');
    return description ? description.textContent : null;
  }

  setTitle(title = null) {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const description = this.originTitle.innerHTML;
    if (!description) {
      return this;
    }
    if (title === null) {
      description.innerHTML = this.originTitle;
    } else {
      description.innerHTML = title;
    }

    return this;
  }

  get footer() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const footer = this.node.querySelector('.question-range');
    return footer ? footer.textContent : null;
  }

  setFooter(footerText = null) {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const footer = this.originFooter.innerHTML;
    if (!footer) {
      return this;
    }
    if (footerText === null) {
      footer.innerHTML = this.originFooter;
    } else {
      footer.innerHTML = '';
      footer.insertAdjacentHTML('beforeend', footerText);
    }
    return this;
  }

  hideNext() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const nextButton = this.node.querySelector('.next-btn-wrapper');
    if (!nextButton) {
      return this;
    }
    nextButton.classList.add('filtered');
    return this;
  }

  showNext() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const nextButton = this.node.querySelector('.next-btn-wrapper');
    if (!nextButton) {
      return this;
    }
    nextButton.classList.remove('filtered');
    return this;
  }

  get max() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    let target = '#max';
    if (this.type === 3) {
      target = '#maxVal';
    }
    const maxVal = this.node.querySelector(target);
    return maxVal ? Number(maxVal.value) : null;
  }

  setMax(value) {
    if (this.#isOtherSurvey()) {
      return this;
    }
    let target = '#max';
    if (this.type === 3) {
      target = '#maxVal';
    }
    const maxVal = this.node.querySelector(target);
    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }
    if (!maxVal) {
      throw new Error('maxVal is not found');
    }

    maxVal.value = value;

    return this;
  }

  get min() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    let target = '#min';
    if (this.type === 3) {
      target = '#minVal';
    }
    if (this.type === 4) {
      target = '#minCharacterLength';
    }
    const minVal = this.node.querySelector(target);
    return minVal ? Number(minVal.value) : null;
  }

  setMin(value = null) {
    if (this.#isOtherSurvey() || value === null) {
      return this;
    }
    let target = '#min';
    if (this.type === 3) {
      target = '#minVal';
    }
    if (this.type === 4) {
      target = '#minCharacterLength';
    }
    const minVal = this.node.querySelector(target);
    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }
    if (!minVal) {
      throw new Error('minVal is not found');
    }

    minVal.value = value;

    return this;
  }

  setStep(value = null, msg = null, target = null) {
    if (this.#isOtherSurvey() || value === null) {
      return this;
    }
    let numbers = this.node.querySelectorAll('input[type="number"]');
    if (target !== null) {
      numbers = this.node.querySelectorAll(target);
    }

    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }

    [...numbers].forEach((num) => {
      num.step = value;
    });

    let errorMsg = `${value}의 배수만 입력해주세요.`;
    if (msg !== null) {
      errorMsg = msg;
    }

    validate(() => {
      const allNumbers = this.node.querySelectorAll('input[type="number"]');
      const allNumbersArray = [...allNumbers].map((num) => Number(num.value));
      const answers = allNumbersArray.every((num) => num % value === 0);
      if (!answers) {
        return err(errorMsg);
      }
    });

    return this;
  }

  get values() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    return values(this.qNum);
  }

  get placeholder() {
    if (this.#isOtherSurvey() || !this.isOpenEnded) {
      return this;
    }
    const placeholder = this.node.querySelector('input[type="text"], textarea, input[type="number"]');
    return placeholder ? placeholder.placeholder : null;
  }

  setPlaceholder(newPlaceholder = null) {
    if (this.#isOtherSurvey() || !this.isOpenEnded) {
      return this;
    }
    const questionPlaceholder = this.node.querySelector('input[type="text"], textarea, input[type="number"]');
    if (!questionPlaceholder) {
      return this;
    }
    if (newPlaceholder === null) {
      questionPlaceholder.placeholder = this.originPlaceholder;
      return this;
    }
    questionPlaceholder.placeholder = newPlaceholder;
    return this;
  }

  hold(hold = null) {
    if (this.#isOtherSurvey() || this.hold === null || typeof hold !== 'number') {
      return this;
    }
    const wrapper = this.node.querySelector('.next-btn-wrapper');
    const target = wrapper.querySelector('.next');
    const originNextText = target.textContent;
    // 카운트다운 시작
    wrapper.style.pointerEvents = 'none';
    let remainingSeconds = hold;
    target.textContent = remainingSeconds;

    const countdownInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds > 0) {
        target.textContent = remainingSeconds;
      } else {
        clearInterval(countdownInterval);
        target.textContent = originNextText;
        wrapper.style.pointerEvents = 'auto';
      }
    }, 1000);
  }
}

const allQuestions = document.querySelectorAll('.survey');
[...allQuestions].forEach((question) => {
  const qNum = Number(question.id.replace('survey', ''));
  window[`Q${qNum}`] = new SetQuestion(qNum, null);
});

window.getQ = (qNum) => {
  return new SetQuestion(qNum, null);
};

window.otherQ = (surveyId, qNum) => {
  return new SetQuestion(qNum, surveyId);
};

Object.defineProperty(window, 'now', {
  get: function () {
    return window[`Q${cur}`];
  },
});
/* ----------- Question Class End --------------- */
/* ----------- utils End --------------- */
