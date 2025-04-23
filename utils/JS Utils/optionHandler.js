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
