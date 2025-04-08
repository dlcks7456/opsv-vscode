/* ----------- shuffleBy --------------- */
function shuffleBy(baseQid, targetQid = null) {
  const params = { baseQid, targetQid };
  for (const [key, value] of Object.entries(params)) {
    if (value === null && key === 'targetQid') continue;
    if (typeof value !== 'number') {
      throw new Error(`Please set \`${key}\` as a number`);
    }
  }

  if (targetQid === null) {
    targetQid = cur;
  }

  try {
    const isDiffAnswer = (answer) => {
      return !answer.querySelector('.answer-etc') && answer.querySelector('input[id^="rank"]').value !== '-1';
    };

    const answerWrappers = '.answer-wrapper .answer-choice-wrapper';
    const baseQuestion = `#survey${baseQid} ${answerWrappers}`;
    const targetQuestion = `#survey${targetQid} ${answerWrappers}`;

    const answerWrapper = document.querySelector(`#survey${targetQid} .answer-wrapper`);
    if (!answerWrapper) throw new Error('답변 컨테이너를 찾을 수 없습니다.');

    const baseQuestionAnswers = document.querySelectorAll(baseQuestion);
    if (!baseQuestionAnswers.length) throw new Error('기본 질문의 답변들을 찾을 수 없습니다.');

    const filteredAnswers = [...baseQuestionAnswers].filter(isDiffAnswer);
    const answerOrderValues = filteredAnswers.map((ans) => ans.querySelector('input[id^="rank"]').value);

    const targetQuestionAnswers = document.querySelectorAll(targetQuestion);
    if (!targetQuestionAnswers.length) throw new Error('현재 질문의 답변들을 찾을 수 없습니다.');

    const targetAnswersArray = [...targetQuestionAnswers];
    const etcAnswers = targetAnswersArray.filter((ans) => !isDiffAnswer(ans)).map((ans) => ans.cloneNode(true));

    const targetAnswers = targetAnswersArray.filter(isDiffAnswer).map((ans) => ans.cloneNode(true));
    const targetAnswerValues = targetAnswers.map((ans) => ans.querySelector('input[id^="rank"]').value);

    const remainAnswers = targetAnswerValues.filter((value) => !answerOrderValues.includes(value));
    if (remainAnswers.length > 0) {
      throw new Error(`There are mismatched answers. : ${remainAnswers}`);
    }

    try {
      answerWrapper.innerHTML = '';

      // 중요한 답변 순서 조정 로직은 try-catch 유지
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

      // QA Mode
      if (typeof updateQASummary === 'function') {
        updateQASummary(targetQid, `shb: Q${baseQid}`);
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
}

window.shuffleBy = shuffleBy;

/* ----------- shuffleBy --------------- */
