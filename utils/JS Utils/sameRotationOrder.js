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
