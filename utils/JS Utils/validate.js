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
