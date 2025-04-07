/* ----------- rotationSameOrder --------------- */
// sameRotationOrder(10);
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

  // 특정 질문에 연결된 piping 질문들 찾기
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
    // 기타/없음 답변 제외 필터
    const isDiffAnswer = (answer) => {
      try {
        return !answer.querySelector('.answer-etc') && answer.querySelector('input[id^="rank"]').value !== '-1';
      } catch (error) {
        console.error('isDiffAnswer 함수 에러:', error);
        throw error;
      }
    };

    // 재귀적으로 piping 질문들을 찾는 함수
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
        console.error('findAllPipingQuestions 함수 에러:', error);
        throw error;
      }
    };

    try {
      // 기본 rotation 질문으로부터 모든 연결된 piping 질문 찾기
      const setRotationQuestions = findAllPipingQuestions(setRotationBase);

      // 기본 질문의 답변 순서 가져오기
      const answerWrappers = '.answer-wrapper .answer-choice-wrapper';
      const baseQuestionAnswers = document.querySelectorAll(`#survey${setRotationBase} ${answerWrappers}`);

      // 일반 답변만 필터링하고 순서 값 추출
      const filteredAnswers = [...baseQuestionAnswers].filter(isDiffAnswer);
      const answerOrderValues = filteredAnswers.map((ans) => ans.querySelector('input[id^="rank"]').value);

      // 모든 piping 질문의 답변 순서 조정
      setRotationQuestions.forEach((question) => {
        try {
          const questionNumber = getQuestionNumber(question);
          if (excludeNumbers.includes(questionNumber)) {
            console.log(`Q${questionNumber} > Random Rotation`);
            return;
          }

          const answerWrapper = question.querySelector('.answer-wrapper');
          const currentAnswers = [...question.querySelectorAll(answerWrappers)];

          // 기타/없음 답변과 일반 답변 분리
          const etcAnswers = currentAnswers.filter((ans) => !isDiffAnswer(ans)).map((ans) => ans.cloneNode(true));
          const normalAnswers = currentAnswers.filter(isDiffAnswer).map((ans) => ans.cloneNode(true));

          // 답변 컨테이너 비우기
          answerWrapper.innerHTML = '';

          // 기본 질문의 순서대로 답변 추가
          answerOrderValues.forEach((rank) => {
            try {
              const matchingAnswer = normalAnswers.find(
                (wrapper) => wrapper.querySelector('input[id^="rank"]').value === rank
              );
              if (matchingAnswer) {
                answerWrapper.appendChild(matchingAnswer);
              }
            } catch (error) {
              console.error('답변 순서 조정 중 에러:', error);
              throw error;
            }
          });

          // 기타/없음 답변 마지막에 추가
          etcAnswers.forEach((ans) => answerWrapper.appendChild(ans));
        } catch (error) {
          console.error('질문 처리 중 에러:', error);
          throw error;
        }
      });
    } catch (error) {
      console.error('메인 로직 처리 중 에러:', error);
      throw error;
    }
  } catch (error) {
    console.error('sameRotationOrder 함수 에러:', error);
    throw error;
  }
}

/* ----------- rotationSameOrder --------------- */
