/* ----------- optionHandler --------------- */
// 조건에 따라 옵션 숨김/보임 처리
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
      const targetOption = targetInput.parentNode;
      const shouldFilter = (cond && logicType === 'hide') || (!cond && logicType === 'show');

      // Set display style with !important
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
          hideLogicDiv.textContent = `${logicType} logic`;

          label.appendChild(hideLogicDiv);
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

// Hide Options
window.hide = (options, cond = true, qid = null) => {
  return optionHandler(options, cond, qid, 'hide');
};

// Show Options
window.show = (options, cond = true, qid = null) => {
  return optionHandler(options, cond, qid, 'show');
};

// Test용. 조건 초기화
window.reset = () => {
  return optionHandler(options(cur), true, cur, 'show');
};
/* ----------- optionHandler end --------------- */
