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
    const answerWrappers = '.answer-wrapper .answer-choice-wrapper';
    const baseQuestion = `#survey${baseQid} ${answerWrappers}`;
    const targetQuestion = `#survey${qnum} ${answerWrappers}`;

    const answerWrapper = document.querySelector(`#survey${qnum} .answer-wrapper`);

    const baseQuestionAnswers = document.querySelectorAll(baseQuestion);
    const answerOrderValues = [...baseQuestionAnswers].map((ans) => ans.querySelector('input[id^="rank"]').value);

    const targetQuestionAnswers = document.querySelectorAll(targetQuestion);
    const targetAnswers = [...targetQuestionAnswers];
    const targetAnswerValues = targetAnswers.map((ans) => ans.querySelector('input[id^="rank"]').value);

    const remainAnswers = targetAnswerValues.filter((value) => !answerOrderValues.includes(value) && value !== '-1');
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

      while (tempContainer.firstChild) {
        answerWrapper.appendChild(tempContainer.firstChild);
      }

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
