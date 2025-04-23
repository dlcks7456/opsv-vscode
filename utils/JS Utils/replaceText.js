window.replaceText = (replacements, qnum = null) => {
  try {
    if (qnum === null) {
      qnum = cur;
    }
    const question = document.querySelector(`#survey${qnum}`);
    if (!question) {
      throw new Error(`Q${qnum} is not found`);
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
