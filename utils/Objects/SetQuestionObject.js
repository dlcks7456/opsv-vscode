/* ----------- Question Class --------------- */
const values = (qNum) => {
  if (qNum === null) {
    qNum = cur;
  }

  const question = document.querySelector(`#survey${qNum}`);
  if (!question) {
    throw new Error(`Q${qNum} is not found`);
  }

  const inputs = question.querySelectorAll('input[type="radio"], input[type="checkbox"]');
  if (inputs.length === 0) {
    return [];
  }

  const inputValues = [...inputs].map((input) => {
    const valueCheck = Number(input.value);

    if (isNaN(valueCheck)) {
      const rankCheck = input.value.split('-');
      if (rankCheck.length === 2) {
        return Number(rankCheck[0]);
      } else if (rankCheck.length === 3) {
        return -Number(rankCheck[1]);
      }
    } else {
      return Number(input.value);
    }
  });

  class Values extends Array {
    constructor(inputValues) {
      super(...inputValues);
      this.inputValues = [...inputValues];
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

class BaseAttribute {
  constructor(parent) {
    this.parent = parent;
    this.qNum = this.parent.qNum;
  }
  get node() {
    throw new Error('node getter must be implemented by subclass');
  }
  returnSelf() {
    return this;
  }
}

class SetAttribute extends BaseAttribute {
  constructor(parent, value, target, etc) {
    super(parent);
    this.value = value;
    this.target = target;
    this.label = `a${value === -1 ? 0 : value}`;
    this.isEtc = etc;
    this.element = document.querySelector(this.target);
    const labelElement = this.node.parentNode.querySelector('.answer-label');
    this.originText = labelElement ? labelElement.cloneNode(true).textContent : '';
    this.text = this.originText;
  }

  get node() {
    return this.element.parentNode;
  }

  setText(text = null) {
    const labelElement = this.node.querySelector('.answer-label');
    if (labelElement) {
      if (text === null) {
        labelElement.innerHTML = `<p class="fr-tag">${this.originText}</p>`;
        this.text = this.originText;
      } else {
        labelElement.innerHTML = `<p class="fr-tag">${text}</p>`;
        this.text = text;
      }
    }
    return this.returnSelf();
  }
}

class SetEtc extends BaseAttribute {
  constructor(parent, code, element) {
    super(parent);
    this.code = Number(code);
    this.element = element;
    this.origin = element ? element : null;

    if (!this.element) {
      return null;
    }
  }

  valueOf() {
    return this.val;
  }

  toString() {
    return this.val;
  }

  get val() {
    let answer = this.element.value;

    const answerSet = this.parent.origin().answers;
    if (answerSet.length !== 0) {
      const etc = answerSet.find((answer) => answer.value.alternative !== null);
      if (etc) {
        answer = etc.value.alternative;
      }
    }

    return answer;
  }

  get node() {
    return document.querySelector(`#survey${this.qNum} input[id="answer${this.qNum}-${this.code}"]`).parentNode;
  }

  placeholder(newPlaceholder = null) {
    const el = this.element;
    if (el === null) {
      return this.returnSelf();
    }

    el.setAttribute('placeholder', newPlaceholder);
    return this.returnSelf();
  }

  isNumber(flag = true) {
    const el = this.element;
    if (el === null) {
      return this.returnSelf();
    }

    if (flag) {
      el.addEventListener('keyup', () => {
        const value = el.value;
        const numericValue = value.replace(/[^0-9]/g, '');
        if (value !== numericValue) {
          el.value = numericValue;
        }
      });
    }

    return this.returnSelf();
  }
}

class SetRankAttribute extends BaseAttribute {
  constructor(parent, rkValue) {
    super(parent);
    this.rkValue = rkValue;
    this.label = `rk${rkValue}`;
    this.#setupDynamicProperties();
  }

  #setupDynamicProperties() {
    const questionValues = this.parent.values;
    if (Array.isArray(questionValues) && questionValues.length > 0) {
      questionValues.forEach((value) => {
        if (typeof value === 'number') {
          const target = `#survey${this.qNum} input[id="answer${this.qNum}-${value}"]`;
          const etc = document.querySelector(
            `#survey${this.qNum} label[for="answer${this.qNum}-${value}"] input[type="text"].answer-etc-text`
          );
          let attrName = etc ? 'etc' : `a${value === -1 ? 0 : value}`;

          if (!document.querySelector(target)) {
            return;
          }

          Object.defineProperty(this, attrName, {
            get() {
              const partentAnswer = this.parent.val;

              if (!partentAnswer) {
                return false;
              }
              const answer = partentAnswer[this.rkValue - 1];
              if (!answer) {
                return false;
              }
              return answer === value;
            },
          });
        }
      });
    }
  }

  any(condition = null) {
    const partentAnswer = this.parent.val;
    if (!partentAnswer) {
      return false;
    }
    if (!Array.isArray(partentAnswer)) {
      return false;
    }

    const answer = partentAnswer[this.rkValue - 1];

    if (condition === null) {
      if (answer === -1) {
        return false;
      } else {
        return answer !== undefined;
      }
    } else {
      if (!Array.isArray(condition)) {
        return answer === condition;
      } else {
        return condition.includes(answer);
      }
    }
  }
}

class RatingAttribute {
  constructor(parent, originText, index) {
    this.parent = parent;
    this.index = index;
    this.originText = originText;
    this.text = this.node.textContent;
  }

  setText(text = null) {
    if (text === null) {
      this.node.innerHTML = `<p class="fr-tag">${this.originText}</p>`;
      this.text = this.originText;
    } else {
      this.node.innerHTML = `<p class="fr-tag">${text}</p>`;
      this.text = text;
    }
    return this;
  }

  get node() {
    return this.parent.node.querySelectorAll('.answer-eval-text')[this.index];
  }
}

class SetQuestion {
  constructor(qNum, surveyId) {
    this.qNum = qNum;
    this.surveyId = surveyId;
    this.currSurvey = this.surveyId === null;
    this.type = null;

    if (this.currSurvey) {
      const question = document.querySelector(`#survey${this.qNum}`);
      const questionType = Number(question.querySelector('#type').value);
      this.type = questionType;

      this.originTitle = question.querySelector('.question-description').cloneNode(true).innerHTML;
      this.originFooter = question.querySelector('.question-range').cloneNode(true).innerHTML;

      this.isRank = this.type === 6;
      this.isRating = [5, 9].includes(this.type);
      this.isRowRating = this.type === 5;
      this.isNPS = this.isRowRating && this.values.length === 11;
      if (this.isRating) {
        this.score = this.values.length;
      }
      this.isOpenEnded = [3, 4].includes(this.type);
      this.originPlaceholder = this.isOpenEnded
        ? question.querySelector(`[name="answer[${this.qNum}]"]`).placeholder || null
        : null;

      this.attr = {};

      const questionValues = values(this.qNum);

      if (Array.isArray(questionValues) && questionValues.length > 0) {
        questionValues.forEach((value, index) => {
          if (typeof value === 'number') {
            const target = `#survey${this.qNum} input[id="answer${this.qNum}-${value}"]`;
            const etc = document.querySelector(
              `#survey${this.qNum} label[for="answer${this.qNum}-${value}"] .answer-etc-text`
            );
            const isEtc = etc ? true : false;
            let attrName = isEtc ? 'etc' : `a${value === -1 ? 0 : value}`;

            if (!document.querySelector(target)) {
              return;
            }

            const attribute = isEtc ? new SetEtc(this, value, etc) : new SetAttribute(this, value, target);

            this.attr[attrName] = attribute;
            Object.defineProperty(this, attrName, {
              get() {
                return this.any(value);
              },
            });
          }
        });

        if (this.isRowRating) {
          const evalTexts = question.querySelectorAll('.answer-eval-text');
          const ratingCategory = evalTexts.length === 2 ? ['left', 'right'] : ['left', 'center', 'right'];
          ratingCategory.forEach((flag, index) => {
            const attribute = new RatingAttribute(this, evalTexts[index].textContent, index);
            this.attr[flag] = attribute;
          });
        }
      }

      if (this.isRank) {
        const minRank = this.min;
        const maxRank = this.max;
        this.ranks = {};
        Array.from({ length: maxRank - minRank + 1 }, (_, i) => minRank + i).forEach((rk) => {
          const rankName = `rk${rk}`;
          this.ranks[rankName] = new SetRankAttribute(this, rk);
          Object.defineProperty(this, rankName, {
            get() {
              return this.ranks[rankName];
            },
          });
        });
      }
    }
  }

  #isOtherSurvey() {
    return !this.currSurvey;
  }

  etcAnswer(value) {
    if (!this.#isOtherSurvey()) {
      return this;
    }
    const answers = getAnswerSet(this.qNum, this.surveyId).getAnswers();
    const answer = answers.find((e) => e.getValue().getOrder() === value);
    return answer.getValue().getAlternative();
  }

  get node() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    return document.querySelector(`#survey${this.qNum}`);
  }

  get origin() {
    return getAnswerSet(this.qNum, this.surveyId);
  }

  get attrs() {
    return Object.values(this.attr);
  }

  valueOf() {
    return this.origin;
  }

  #getFormData() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const surveyForm = document.querySelector('#survey_form');
    const formData = new FormData(surveyForm);
    const filteredData = [...formData]
      .map(([key, value]) => {
        const qNumber = key.match(/answer\[(\d+)\]/)?.[1] || undefined;
        if (Number(qNumber) === this.qNum) {
          return value;
        }
      })
      .filter((value) => value !== undefined)
      .map((value) => {
        if ([10, 11, 12].includes(this.type)) {
          return value !== '' ? value : null;
        } else {
          return isNaN(Number(value)) ? value : Number(value);
        }
      });

    return filteredData;
  }

  #realTimeAnswer() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const formData = this.#getFormData();

    const closeEnded = (data) => {
      return data.filter((value) => typeof value === 'number');
    };
    const openEnded = (data) => {
      return data.filter((value) => typeof value === 'string');
    };
    if ([1, 3, 5, 9].includes(this.type)) {
      const answer = closeEnded(formData);
      return answer.length > 0 ? answer[0] : null;
    }
    if ([2].includes(this.type)) {
      const answer = closeEnded(formData);
      return answer.length > 0 ? answer : null;
    }
    if ([4, 7].includes(this.type)) {
      const answer = openEnded(formData);
      return answer.length > 0 ? answer : null;
    }
    if ([6].includes(this.type)) {
      const rankAnswer = formData
        .map((value) => {
          const parts = value.split('-');
          const rank = parseInt(parts.pop());
          const responseValue = parts.join('-');

          if (!isNaN(parseInt(responseValue))) {
            return {
              value: parseInt(responseValue),
              rank: rank,
            };
          }
          return null;
        })
        .filter((item) => item !== null)
        .sort((a, b) => a.rank - b.rank);

      return rankAnswer.length > 0 ? rankAnswer.map((item) => item.value) : null;
    }

    if ([10].includes(this.type)) {
      if (formData.every((value) => value === null)) {
        return null;
      } else {
        return formData.filter((value) => value !== null).join('|');
      }
    }

    if ([11, 12].includes(this.type)) {
      if (formData.every((value) => value === null)) {
        return null;
      } else {
        return formData.filter((value) => value !== null).join('-');
      }
    }
  }

  any(condition = null) {
    const answers = this.origin;
    if (this.#isOtherSurvey()) {
      return answers.exists(condition);
    }

    if (condition === null) {
      return !this.any([-1]) && this.cnt >= 1;
    } else {
      let formData = this.#realTimeAnswer();
      if (!Array.isArray(formData)) {
        formData = [formData];
      }

      if (Array.isArray(condition)) {
        return answers.exists(condition) || formData.some((value) => condition.includes(value));
      } else if (typeof condition === 'number') {
        return answers.exists(condition) || formData.includes(condition);
      }
    }
  }

  all(condition) {
    const answers = this.origin;
    if (this.#isOtherSurvey()) {
      if (Array.isArray(condition)) {
        return condition.map((value) => answers.exists(value)).every((value) => value === true);
      } else if (typeof condition === 'number') {
        return answers.exists(condition);
      }
    }
    let formData = this.#realTimeAnswer();
    if (!Array.isArray(formData)) {
      formData = [formData];
    }

    if (Array.isArray(condition)) {
      return (
        condition.map((value) => answers.exists(value)).every((value) => value === true) ||
        condition.every((value) => formData.includes(value))
      );
    } else if (typeof condition === 'number') {
      return answers.exists(condition) || formData.includes(condition);
    }
  }

  get val() {
    if (this.#isOtherSurvey()) {
      return this.origin.val();
    }
    let returnValue = null;
    if ([1].includes(this.type)) {
      const ans = this.origin.val();
      returnValue = ans ? ans.order : null;
      return returnValue || this.#realTimeAnswer();
    }
    if ([5, 9, 3, 4, 7, 10, 11, 12].includes(this.type)) {
      returnValue = this.origin.val();
      return returnValue || this.#realTimeAnswer();
    }
    if ([2, 6].includes(this.type)) {
      returnValue = this.origin.answers.map((answer) => answer.value.order);
      const arr = this.#realTimeAnswer() === null ? [] : this.#realTimeAnswer();
      return returnValue.length > 0 ? returnValue : arr;
    }
  }

  setVal(value) {
    if ([1, 2, 6, 9].includes(this.type)) {
      // 단수/복수/순위형/객관식 평가형
      const setValues = !Array.isArray(value) ? [value] : value;
      if (!setValues.every((v) => typeof v === 'number')) {
        throw new Error('value must be a number');
      }
      const answerElements = setValues.map((v) => {
        const wrapper = this.node.querySelector(`#answer${this.qNum}-${v}`).parentNode;
        const desc = wrapper.querySelector('.answer-label').textContent;
        return new AnswerElement(ValueType.OPTION, new Option(v, desc));
      });

      const answer = new AnswerList(answerElements, 0);
      setAnswerList(answer, this.qNum);
    }

    if ([3, 5].includes(this.type)) {
      // 숫자/평가형
      if (!typeof value === 'number') {
        throw new Error('value must be a number');
      }
      const answer = new AnswerList([new AnswerElement(ValueType.NUMBER, value)], 0);
      setAnswerList(answer, this.qNum);
    }

    if ([4].includes(this.type)) {
      // 문자
      if (!typeof value === 'string') {
        throw new Error('value must be a string');
      }
      const answer = new AnswerList([new AnswerElement(ValueType.TEXT, value)], 0);
      setAnswerList(answer, this.qNum);
    }

    return this;
  }

  get answer() {
    if (this.#isOtherSurvey()) {
      return this.origin
        .getAnswers()
        .map((e) => e.getValue().getDescription())
        .toString();
    }
    const answerList = this.origin.answers.map((ans) => {
      const value = ans.value;
      const type = ans.type;
      if (type === 'text' || type === 'number') {
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
    if (this.#isOtherSurvey()) {
      return this.origin.len();
    }

    let formData = this.#realTimeAnswer();
    if (!Array.isArray(formData)) {
      formData = [formData];
    }

    return formData.length;
  }

  just(eqv) {
    if (this.#isOtherSurvey()) {
      return this.origin.eqv(eqv);
    }
    let formData = this.#realTimeAnswer();
    if (!Array.isArray(formData)) {
      formData = [formData];
    }

    let result = null;
    if ([1, 2, 5, 6, 9].includes(this.type) && formData) {
      result = formData.includes(eqv) && formData.length === 1;
    }

    return this.origin.eqv(eqv) || result;
  }

  get title() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const description = this.node.querySelector('.question-description');
    return description ? description.textContent : null;
  }

  setTitle(title = null) {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const description = this.originTitle.innerHTML;
    if (!description) {
      return this;
    }
    if (title === null) {
      description.innerHTML = this.originTitle;
    } else {
      description.innerHTML = title;
    }

    return this;
  }

  get footer() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const footer = this.node.querySelector('.question-range');
    return footer ? footer.textContent : null;
  }

  setFooter(footerText = null) {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const footer = this.originFooter.innerHTML;
    if (!footer) {
      return this;
    }
    if (footerText === null) {
      footer.innerHTML = this.originFooter;
    } else {
      footer.innerHTML = '';
      footer.insertAdjacentHTML('beforeend', footerText);
    }
    return this;
  }

  hideNext() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const nextButton = this.node.querySelector('.next-btn-wrapper');
    if (!nextButton) {
      return this;
    }
    nextButton.classList.add('filtered');
    return this;
  }

  showNext() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    const nextButton = this.node.querySelector('.next-btn-wrapper');
    if (!nextButton) {
      return this;
    }
    nextButton.classList.remove('filtered');
    return this;
  }

  get max() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    let target = '#max';
    if (this.type === 3) {
      target = '#maxVal';
    }
    const maxVal = this.node.querySelector(target);
    return maxVal ? Number(maxVal.value) : null;
  }

  setMax(value) {
    if (this.#isOtherSurvey()) {
      return this;
    }
    let target = '#max';
    if (this.type === 3) {
      target = '#maxVal';
    }
    const maxVal = this.node.querySelector(target);
    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }
    if (!maxVal) {
      throw new Error('maxVal is not found');
    }

    maxVal.value = value;

    return this;
  }

  get min() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    let target = '#min';
    if (this.type === 3) {
      target = '#minVal';
    }
    if (this.type === 4) {
      target = '#minCharacterLength';
    }
    const minVal = this.node.querySelector(target);
    return minVal ? Number(minVal.value) : null;
  }

  setMin(value = null) {
    if (this.#isOtherSurvey() || value === null) {
      return this;
    }
    let target = '#min';
    if (this.type === 3) {
      target = '#minVal';
    }
    if (this.type === 4) {
      target = '#minCharacterLength';
    }
    const minVal = this.node.querySelector(target);
    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }
    if (!minVal) {
      throw new Error('minVal is not found');
    }

    minVal.value = value;

    return this;
  }

  setStep(value = null, msg = null, target = null) {
    if (this.#isOtherSurvey() || value === null) {
      return this;
    }
    let numbers = this.node.querySelectorAll('input[type="number"]');
    if (target !== null) {
      numbers = this.node.querySelectorAll(target);
    }

    if (!typeof value === 'number') {
      throw new Error('value must be a number');
    }

    [...numbers].forEach((num) => {
      num.step = value;
    });

    let errorMsg = `${value}의 배수만 입력해주세요.`;
    if (msg !== null) {
      errorMsg = msg;
    }

    validate(() => {
      const allNumbers = this.node.querySelectorAll('input[type="number"]');
      const allNumbersArray = [...allNumbers].map((num) => Number(num.value));
      const answers = allNumbersArray.every((num) => num % value === 0);
      if (!answers) {
        return err(errorMsg);
      }
    });

    return this;
  }

  get values() {
    if (this.#isOtherSurvey()) {
      return this;
    }
    return values(this.qNum);
  }

  get placeholder() {
    if (this.#isOtherSurvey() || !this.isOpenEnded) {
      return this;
    }
    const placeholder = this.node.querySelector('input[type="text"], textarea, input[type="number"]');
    return placeholder ? placeholder.placeholder : null;
  }

  setPlaceholder(newPlaceholder = null) {
    if (this.#isOtherSurvey() || !this.isOpenEnded) {
      return this;
    }
    const questionPlaceholder = this.node.querySelector('input[type="text"], textarea, input[type="number"]');
    if (!questionPlaceholder) {
      return this;
    }
    if (newPlaceholder === null) {
      questionPlaceholder.placeholder = this.originPlaceholder;
      return this;
    }
    questionPlaceholder.placeholder = newPlaceholder;
    return this;
  }
}

const allQuestions = document.querySelectorAll('.survey');
[...allQuestions].forEach((question) => {
  const qNum = Number(question.id.replace('survey', ''));
  window[`Q${qNum}`] = new SetQuestion(qNum, null);
});

window.getQ = (qNum) => {
  return new SetQuestion(qNum, null);
};

window.otherQ = (surveyId, qNum) => {
  return new SetQuestion(qNum, surveyId);
};

Object.defineProperty(window, 'now', {
  get: function () {
    return window[`Q${cur}`];
  },
});
/* ----------- Question Class End --------------- */
