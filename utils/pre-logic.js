// sameRotationOrder(문번호);

window.exec = (fn) => {
  try {
    fn();
  } catch (error) {
    console.error(error);
  } finally {
    return true;
  }
};

window.cond = (fn) => {
  try {
    return fn();
  } catch (error) {
    console.error(error);
    return true;
  }
};

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

window.validate = (fn, target = null) => {
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

window.hangle = (qnum = null) => {
  if (qnum === null) {
    qnum = cur;
  }

  validate(() => {
    const textAnswers = document.querySelectorAll(`#survey${qnum} input[type="text"], #survey${qnum} textarea`);
    const badAnswer = [...textAnswers].some((answer) => {
      return answer.value.match(/[ㄱ-ㅎㅏ-ㅣ]/);
    });
    if (badAnswer) {
      return err('자/모음이 입력된 답변이 있습니다.');
    }
  });

  return true;
};

// ratingHandler({ reverse: true, showValue: true});
window.rating = (obj) => {
  return ratingHandler({ ...obj, qNum: cur });
};

function ratingHandler({ reverse = false, showValue = false, qNum = null, format = null }) {
  try {
    const surveyForm = document.querySelector('#survey_form');
    let ratings = [];
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

const optionHandler = (options, cond, qnum, logicType) => {
  try {
    if (qnum === null) {
      qnum = cur;
    }

    const qname = `#survey${qnum}`;
    const currentQuestion = document.querySelector(qname);

    if (logicType === 'disabled' && !currentQuestion.querySelector('style[data-disabled-style]')) {
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
      const targetElement = optionType === 'number' ? `#answer${qnum}-${option}` : option;
      const targetNode = document.querySelector(`${qname} ${targetElement}`);
      const targetOption = optionType === 'number' ? targetNode.parentNode : targetNode;

      const shouldFilter = (cond && logicType === 'hide') || (!cond && logicType === 'show');

      if (logicType === 'disabled') {
        if (cond) {
          targetOption.classList.add('disabled-logic');
          targetNode.readOnly = true;
        } else {
          targetOption.classList.remove('disabled-logic');
          targetNode.readOnly = false;
        }
      } else {
        targetOption.style.setProperty('display', shouldFilter ? 'none' : 'block', 'important');
        targetOption.classList.toggle('hide-logic', shouldFilter);
        if (targetNode.tagName.toLowerCase() === 'input') {
          targetNode.readOnly = shouldFilter;
        }
      }

      if (optionType === 'number') {
        const label = targetOption.querySelector(`label[for="answer${qnum}-${option}"]`);
        if (typeof checkQAMode === 'function' && checkQAMode()) {
          label.style.position = 'relative';
          const hideLogicDiv = document.createElement('div');
          hideLogicDiv.classList.add('option-handler-qa');
          hideLogicDiv.textContent = logicType;

          if (!label.querySelector('.option-handler-qa')) {
            label.appendChild(hideLogicDiv);
          } else {
            label.querySelector('.option-handler-qa').textContent = logicType;
          }
        } else {
          label.removeAttribute('style');
        }
      } else {
        const childInputs = targetNode.querySelectorAll('input');
        childInputs.forEach((input) => {
          if (logicType === 'disabled') {
            input.readOnly = cond;
          } else {
            input.readOnly = shouldFilter;
          }
        });
      }
    });
  } catch (error) {
    console.error(`Error in optionHandler (${logicType}):`, error);
  } finally {
    return true;
  }
};

window.hide = (options, cond = true, qnum = null) => {
  return optionHandler(options, cond, qnum, 'hide');
};

window.show = (options, cond = true, qnum = null) => {
  return optionHandler(options, cond, qnum, 'show');
};

window.disabled = (options, cond = true, qnum = null) => {
  return optionHandler(options, cond, qnum, 'disabled');
};

window.thisOrThat = (thisCodes, thatCodes = null, qNum = null) => {
  return exec(() => {
    let qnum = qNum;
    if (qnum === null) {
      qnum = cur;
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

    const currentElement = document.querySelector(`#survey${qnum}`);
    currentElement.addEventListener('click', () => {
      if (thatCodes === null) {
        thisAnswers.forEach((code, index) => {
          const currentInput = currentElement.querySelector(`input[id="answer${qnum}-${code}"]`);
          if (currentInput && currentInput.checked) {
            const otherCodes = thisAnswers.filter((_, idx) => idx !== index);
            disabled(otherCodes, true, qnum);
          }
        });

        const anyChecked = thisAnswers
          .map((code) => currentElement.querySelector(`input[id="answer${qnum}-${code}"]`))
          .some((el) => el && el.checked);

        if (!anyChecked) {
          disabled(thisAnswers, false, qnum);
        }
      } else {
        const thisChecked = thisAnswers
          .map((code) => currentElement.querySelector(`input[id="answer${qnum}-${code}"]`))
          .some((el) => el && el.checked);

        const thatChecked = thatAnswers
          .map((code) => currentElement.querySelector(`input[id="answer${qnum}-${code}"]`))
          .some((el) => el && el.checked);

        disabled(thisAnswers, thatChecked, qnum);
        disabled(thatAnswers, thisChecked, qnum);
      }
    });
  });
};

window.replaceText = (replacements, qNum = null) => {
  try {
    if (qNum === null) {
      qNum = cur;
    }
    const question = document.querySelector(`#survey${qNum}`);
    if (!question) {
      throw new Error(`Q${qNum} is not found`);
    }

    const mainFnc = () => {
      if (typeof replacements !== 'object' || replacements === null) {
        throw new Error('replacements must be an object');
      }

      const answerEvalText = question.querySelectorAll('.answer-eval-text');
      const answerLabel = question.querySelectorAll('.answer-label');
      const description = question.querySelectorAll('.question-description');
      const allElements = [...description, ...answerEvalText, ...answerLabel];

      for (const [key, conditions] of Object.entries(replacements)) {
        const pattern = new RegExp(`{{${key}}}`, 'g');
        const baseClass = `replace-${key.toLowerCase()}`;
        let changeText = conditions;
        if (typeof conditions === 'object' && conditions !== null) {
          const pipe = Object.entries(conditions).find(([key, value]) => value === true);
          if (!pipe || pipe.length === 0) {
            changeText = 'UNDEFINED';
          } else {
            changeText = pipe[0];
          }
        } else {
          changeText = conditions;
        }

        allElements.forEach((element) => {
          const replaceBase = element.querySelectorAll(`.${baseClass}`);
          if (replaceBase.length >= 1) {
            replaceBase.forEach((base) => {
              base.innerHTML = changeText;
            });
          } else {
            const replaceSpan = document.createElement('span');
            replaceSpan.classList.add(baseClass);
            replaceSpan.innerHTML = changeText;

            element.innerHTML = element.innerHTML.replace(pattern, function () {
              return replaceSpan.outerHTML;
            });
          }
        });
      }
    };

    const originReferAnswers = window.referAnswers;
    function referAnswersWrapper(fn) {
      return function (...args) {
        const result = fn.apply(this, args);
        mainFnc();
        return result;
      };
    }

    window.referAnswers = referAnswersWrapper(window.referAnswers);
    referAnswers(qnum);
    common_align(qnum);

    const nxtBtn = document.querySelector(`#survey${qnum} .next-btn-wrapper`);
    nxtBtn.addEventListener('click', () => {
      window.referAnswers = originReferAnswers;
      console.log(window.referAnswers);
    });
  } catch (error) {
    console.error(error);
  } finally {
    return true;
  }
};

window.shuffleBy = (baseQid, qnum = null) => {
  const params = { baseQid, qnum };
  for (const [key, value] of Object.entries(params)) {
    if (value === null && key === 'qnum') continue;
    if (typeof value !== 'number') {
      throw new Error(`Please set \`${key}\` as a number`);
    }
  }

  if (qnum === null) {
    qnum = cur;
  }

  try {
    const isDiffAnswer = (answer) => {
      return !answer.querySelector('.answer-etc') && answer.querySelector('input[id^="rank"]').value !== '-1';
    };

    const answerWrappers = '.answer-wrapper .answer-choice-wrapper';
    const baseQuestion = `#survey${baseQid} ${answerWrappers}`;
    const targetQuestion = `#survey${qnum} ${answerWrappers}`;

    const answerWrapper = document.querySelector(`#survey${qnum} .answer-wrapper`);

    const baseQuestionAnswers = document.querySelectorAll(baseQuestion);
    const filteredAnswers = [...baseQuestionAnswers].filter(isDiffAnswer);
    const answerOrderValues = filteredAnswers.map((ans) => ans.querySelector('input[id^="rank"]').value);

    const targetQuestionAnswers = document.querySelectorAll(targetQuestion);

    const targetAnswersArray = [...targetQuestionAnswers];
    const etcAnswers = targetAnswersArray.filter((ans) => !isDiffAnswer(ans));
    const targetAnswers = targetAnswersArray.filter(isDiffAnswer);
    const targetAnswerValues = targetAnswers.map((ans) => ans.querySelector('input[id^="rank"]').value);

    const remainAnswers = targetAnswerValues.filter((value) => !answerOrderValues.includes(value));
    if (remainAnswers.length > 0) {
      throw new Error(`There are mismatched answers. : ${remainAnswers}`);
    }

    try {
      const tempContainer = document.createDocumentFragment();

      while (answerWrapper.firstChild) {
        tempContainer.appendChild(answerWrapper.firstChild);
      }

      answerOrderValues.forEach((rank) => {
        try {
          const matchingAnswer = targetAnswers.find(
            (wrapper) => wrapper.querySelector('input[id^="rank"]').value === rank
          );
          if (matchingAnswer) {
            answerWrapper.appendChild(matchingAnswer);
          }
        } catch (error) {
          console.error('Error reordering answers:', error);
          throw error;
        }
      });

      etcAnswers.forEach((ans) => answerWrapper.appendChild(ans));

      if (typeof updateQASummary === 'function') {
        updateQASummary(qnum, `shb: Q${baseQid}`);
      }
    } catch (error) {
      console.error('Error relocating answers:', error);
      throw error;
    }
  } catch (error) {
    console.error('shuffleBy Function Errors:', error);
    throw error;
  } finally {
    return true;
  }
};

function sameRotationOrder(setRotationBase, excludeNumbers = []) {
  if (typeof setRotationBase !== 'number') {
    throw new Error('Please set `setRotationBase` as a number');
  }
  if (!Array.isArray(excludeNumbers)) {
    throw new Error('Please set `excludeNumbers` as an array');
  } else {
    excludeNumbers.forEach((number) => {
      if (typeof number !== 'number') {
        throw new Error('Please set `excludeNumbers` as an array of numbers');
      }
    });
  }

  const getPipingQuestions = (qnumber) => {
    try {
      const surveyForm = document.querySelector('#survey_form');
      const questions = surveyForm.querySelectorAll('.survey');
      return [...questions].filter((q) => Number(q.querySelector('#pipingParent').value) === qnumber);
    } catch (error) {
      console.error('getPipingQuestions function error:', error);
      throw error;
    }
  };

  const getQuestionNumber = (question) => {
    return Number(question.id.replace(/[^0-9]/g, ''));
  };

  try {
    const isDiffAnswer = (answer) => {
      try {
        return !answer.querySelector('.answer-etc') && answer.querySelector('input[id^="rank"]').value !== '-1';
      } catch (error) {
        console.error('isDiffAnswer function error:', error);
        throw error;
      }
    };

    const findAllPipingQuestions = (baseQid, processedQids = new Set(), result = []) => {
      try {
        if (processedQids.has(baseQid)) return result;

        processedQids.add(baseQid);
        const pipingQuestions = getPipingQuestions(baseQid);

        if (pipingQuestions.length > 0) {
          result.push(...pipingQuestions);

          pipingQuestions.forEach((question) => {
            findAllPipingQuestions(getQuestionNumber(question), processedQids, result);
          });
        }

        return result;
      } catch (error) {
        console.error('findAllPipingQuestions function error:', error);
        throw error;
      }
    };

    try {
      const setRotationQuestions = findAllPipingQuestions(setRotationBase);

      const answerWrappers = '.answer-wrapper .answer-choice-wrapper';
      const baseQuestionAnswers = document.querySelectorAll(`#survey${setRotationBase} ${answerWrappers}`);

      const filteredAnswers = [...baseQuestionAnswers].filter(isDiffAnswer);
      const answerOrderValues = filteredAnswers.map((ans) => ans.querySelector('input[id^="rank"]').value);

      setRotationQuestions.forEach((question) => {
        try {
          const questionNumber = getQuestionNumber(question);
          if (excludeNumbers.includes(questionNumber)) {
            console.log(`Q${questionNumber} > Random Rotation`);
            return;
          }

          const answerWrapper = question.querySelector('.answer-wrapper');
          const currentAnswers = [...question.querySelectorAll(answerWrappers)];

          const etcAnswers = currentAnswers.filter((ans) => !isDiffAnswer(ans));
          const normalAnswers = currentAnswers.filter(isDiffAnswer);

          const tempContainer = document.createDocumentFragment();

          answerOrderValues.forEach((rank) => {
            try {
              const matchingAnswer = normalAnswers.find(
                (wrapper) => wrapper.querySelector('input[id^="rank"]').value === rank
              );
              if (matchingAnswer) {
                tempContainer.appendChild(matchingAnswer);
              }
            } catch (error) {
              console.error('Error adjusting answer order:', error);
              throw error;
            }
          });

          etcAnswers.forEach((ans) => tempContainer.appendChild(ans));

          answerWrapper.appendChild(tempContainer);
        } catch (error) {
          console.error('Error processing question:', error);
          throw error;
        }
      });
    } catch (error) {
      console.error('Error in main logic processing:', error);
      throw error;
    }
  } catch (error) {
    console.error('sameRotationOrder function error:', error);
    throw error;
  }
}

window.holdNext = (seconds = 5, qnum = null) => {
  try {
    if (qnum === null) {
      qnum = cur;
    }
    const question = document.querySelector(`#survey${qnum}`);
    if (!question) {
      throw new Error(`Q${qnum} is not found`);
    }

    const wrapper = question.querySelector('.next-btn-wrapper');
    const target = wrapper.querySelector('.next');
    const originNextText = target.textContent;
    wrapper.style.pointerEvents = 'none';
    let remainingSeconds = seconds;
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
  } catch (error) {
    console.error(error);
  } finally {
    return true;
  }
};
