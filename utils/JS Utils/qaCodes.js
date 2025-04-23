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
/* 실사 전 삭제 */
