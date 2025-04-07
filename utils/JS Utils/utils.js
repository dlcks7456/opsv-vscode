/* ----------- utils --------------- */
// try-catch 문 축약
const exec = (fn) => {
  try {
    fn();
  } catch (error) {
    console.error(error);
  } finally {
    return true;
  }
};

window.exec = exec;

const values = (qNum) => {
  if (qNum === null) {
    throw new Error('qNum is required');
  }

  const question = document.querySelector(`#survey${qNum}`);
  if (!question) {
    throw new Error(`Q${qNum} is not found`);
  }

  const inputs = question.querySelectorAll('input[type="radio"], input[type="checkbox"]');
  const inputValues = [...inputs].map((input) => {
    const valueCheck = Number(input.value);

    if (isNaN(valueCheck)) {
      // Rank가 응답이 있는 경우 처리
      const rankCheck = input.value.split('-');
      if (rankCheck.length === 2) {
        // Rank
        return Number(rankCheck[0]);
      } else if (rankCheck.length === 3) {
        // Rank None
        return -Number(rankCheck[1]);
      }
    } else {
      // Radio, Checkbox
      return Number(input.value);
    }
  });

  class Values extends Array {
    constructor(inputValues) {
      // Store original order in inputValues
      super(...inputValues);
      this.inputValues = [...inputValues];
      // Sort the array values
      this.sort((a, b) => a - b);
    }

    get order() {
      return [...this.inputValues];
    }

    valueOf() {
      return Array.from(this);
    }

    toString() {
      return this.valueOf().toString();
    }
  }

  return new Values(inputValues);
};

window.values = values;

window.err = (msg) => {
  alert(msg);
  return true;
};

const validate = (fn, target = null) => {
  // Wrap the original function with debugging
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

window.validate = validate;

class Question {
  constructor(qNum, surveyId, type) {
    this.qNum = qNum;
    this.surveyId = surveyId;
    this.type = type;
  }

  element() {
    return document.querySelector(`#survey${this.qNum}`);
  }

  origin() {
    return getAnswerSet(this.qNum, this.surveyId);
  }

  valueOf() {
    return this.origin();
  }

  getFormData() {
    const surveyForm = document.querySelector('#survey_form');
    const formData = new FormData(surveyForm);
    // 폼 데이터를 출력해보기
    const filteredData = [...formData]
      .map(([key, value]) => {
        // 정규식으로 key의 대괄호 안의 숫자 추출
        const qNumber = key.match(/answer\[(\d+)\]/)?.[1] || undefined;
        if (Number(qNumber) === this.qNum) {
          return value;
        }
      })
      .filter((value) => value !== undefined)
      .map((value) => (isNaN(Number(value)) ? value : Number(value)));

    return filteredData;
  }

  realTimeAnswer() {
    const formData = this.getFormData();
    const closeEnded = (data) => {
      return data.filter((value) => typeof value === 'number');
    };
    const openEnded = (data) => {
      return data.filter((value) => typeof value === 'string');
    };
    if ([1, 3, 5, 9].includes(this.type)) {
      // radio, number, rating, columnRating
      const answer = closeEnded(formData);
      return answer.length > 0 ? answer[0] : null;
    }
    if ([2].includes(this.type)) {
      // checkbox
      const answer = closeEnded(formData);
      return answer.length > 0 ? answer : null;
    }
    if ([4, 7].includes(this.type)) {
      // textarea, image
      const answer = openEnded(formData);
      return answer.length > 0 ? answer : null;
    }
    if ([6].includes(this.type)) {
      // rank
      const rankAnswer = formData
        .map((value) => {
          // value 형식: "응답값-순위" (예: "1-1", "3-2", "15-3", "-1-1" 등)
          const parts = value.split('-');
          // 마지막 요소는 순위, 그 앞의 모든 부분을 합쳐서 응답값으로 처리
          // (마이너스 값이 있을 경우 처리)
          const rank = parseInt(parts.pop());
          const responseValue = parts.join('-');

          // 응답값이 숫자인 경우에만 객체 반환, 아니면 null 반환
          if (!isNaN(parseInt(responseValue))) {
            return {
              value: parseInt(responseValue),
              rank: rank,
            };
          }
          return null;
        })
        .filter((item) => item !== null);
      return rankAnswer.length > 0 ? rankAnswer.map((item) => item.value) : null;
    }

    // if(10) // address
    // if(11) // phone
    // if(12) // date
  }

  // 배열의 요소 중 하나라도 조건을 만족하는지 확인

  any(condition) {
    const answers = this.origin();
    let formData = this.realTimeAnswer();
    if (!Array.isArray(formData)) {
      formData = [formData];
    }

    if (Array.isArray(condition)) {
      // 배열/숫자로 조건을 전달한 경우
      return answers.exists(condition) || formData.some((value) => condition.includes(value));
    } else if (typeof condition === 'number') {
      return answers.exists(condition) || formData.includes(condition);
    }
  }

  get val() {
    let returnValue = null;
    if ([1].includes(this.type)) {
      // radio
      const ans = this.origin().val();
      returnValue = ans ? ans.order : null;
      return returnValue || this.realTimeAnswer();
    }
    if ([5, 9, 3, 4, 7, 10, 11, 12].includes(this.type)) {
      // rating, columnRating, number, textarea, image, address, phone, date
      returnValue = this.origin().val();
      return returnValue || this.realTimeAnswer();
    }
    if ([2, 6].includes(this.type)) {
      // checkbox, rank
      returnValue = this.origin().answers.map((answer) => answer.value.order);
      const arr = this.realTimeAnswer() === null ? [] : this.realTimeAnswer();
      return returnValue || arr;
    }
  }

  get answer() {
    const answerList = this.origin().answers.map((ans) => {
      const value = ans.value;
      const type = ans.type;
      if (type === 'text') {
        return value;
      } else {
        const description = value.description;
        const alternative = value.alternative;
        if (alternative !== null) {
          return alternative;
        } else {
          return description;
        }
      }
    });

    return answerList.join(', ');
  }

  get cnt() {
    let formData = this.realTimeAnswer();
    if (!Array.isArray(formData)) {
      formData = [formData];
    }

    return formData.length;
  }

  only(eqv) {
    return this.origin().eqv(eqv);
  }

  get max() {
    const maxVal = this.element().querySelector('#maxVal');
    return maxVal ? Number(maxVal.value) : null;
  }

  max(value) {
    const maxVal = this.element().querySelector('#maxVal');
    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }
    if (!maxVal) {
      throw new Error('maxVal is not found');
    }

    maxVal.value = value;

    return true;
  }

  // textarea는 min만 존재
  get min() {
    let target = '#minVal';
    if (this.type === 4) {
      target = '#minCharacterLength';
    }
    const minVal = this.element().querySelector(target);
    return minVal ? Number(minVal.value) : null;
  }

  min(value) {
    let target = '#minVal';
    if (this.type === 4) {
      target = '#minCharacterLength';
    }
    const minVal = this.element().querySelector(target);
    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }
    if (!minVal) {
      throw new Error('minVal is not found');
    }

    minVal.value = value;

    return true;
  }

  step(value, target = null) {
    let numbers = this.element().querySelectorAll('input[type="number"]');
    if (target !== null) {
      numbers = this.element().querySelectorAll(target);
    }

    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }

    [...numbers].forEach((num) => {
      num.step = value;
    });

    return true;
  }
}

// 모든 질문에 대해서 객체 생성
const allQuestions = document.querySelectorAll('.survey');
[...allQuestions].forEach((question) => {
  const qNum = Number(question.id.replace('survey', ''));
  const questionType = Number(question.querySelector('#type').value);
  window[`Q${qNum}`] = new Question(qNum, null, questionType);
});
/* ----------- utils --------------- */
