const multiTextMsgs = {
  atleast: '최소 {min}개 이상 응답해주세요.',
  atmost: '최대 {max}개 이하로 응답해주세요.',
  exactly: '정확히 {exactly}개를 응답해주세요.',
  order: '순서대로 입력해주세요.',
  every: '모두 응답해주세요.',
  duplicate: '중복해서 입력하지 마세요.',
  hangle: '자/모음만 입력하지 마세요.',
  special: '`와 |는 입력 불가능합니다.',
  exclude: '{exclude}는 입력 불가능합니다.',
};

// join answers
const joinMultiAnswers = (answers) => {
  return answers.join('|');
};

// text validate answers
const multiTextValidate = ({
  answers,
  atleast = null,
  atmost = null,
  exactly = null,
  every = null,
  duplicate = null,
  hangle = null,
  special = null,
  exclude = null,
  order = null,
} = {}) => {
  const inputAnswers = [...answers].map((answer) => (answer === '' ? null : answer));

  const someNull = inputAnswers.some((answer) => {
    return answer === null;
  });

  const answerCount = inputAnswers.filter((answer) => {
    return answer !== null;
  }).length;

  // 검증 객체 정의
  const validators = {
    order: {
      validate: () => {
        return (
          order !== null &&
          order.value === true &&
          inputAnswers.slice(1).some((answer, index) => {
            return answer !== null && inputAnswers[index] === null;
          })
        );
      },
      getMessage: () => order.msg,
    },
    atleast: {
      validate: () => !every.value && atleast !== null && answerCount < atleast.value,
      getMessage: () => {
        return atleast.msg;
      },
    },
    atmost: {
      validate: () => !every.value && atmost !== null && answerCount > atmost.value,
      getMessage: () => {
        return atmost.msg;
      },
    },
    exactly: {
      validate: () => !every.value && exactly !== null && answerCount !== exactly.value,
      getMessage: () => {
        return exactly.msg;
      },
    },
    every: {
      validate: () => {
        return every.value && answerCount !== inputAnswers.length;
      },
      getMessage: () => every.msg,
    },
    duplicate: {
      validate: () => {
        const duplicateAnswers = inputAnswers.some((answer) => {
          return duplicate !== null && duplicate.value === true
            ? inputAnswers.filter((a) => a !== null && a === answer).length > 1
            : false;
        });
        return duplicateAnswers;
      },
      getMessage: () => duplicate.msg,
    },
    hangle: {
      validate: () => {
        const hangleAnswers = inputAnswers.some((answer) => {
          return hangle !== null && hangle.value === true ? answer !== null && answer.match(/[ㄱ-ㅎㅏ-ㅣ]/) : false;
        });
        return hangleAnswers;
      },
      getMessage: () => hangle.msg,
    },
    special: {
      validate: () => {
        const specialAnswers = inputAnswers.some((answer) => {
          return special !== null && special.value === true ? answer !== null && answer.match(/[`|]/) : false;
        });
        return specialAnswers;
      },
      getMessage: () => special.msg,
    },
    exclude: {
      validate: () => {
        return exclude !== null && exclude.value.some((value) => answers.some((answer) => answer.includes(value)));
      },
      getMessage: () => exclude.msg,
    },
    allAnswers: {
      validate: () => {
        const requireAllAnswers = [atleast, atmost, exactly].every((param) => param === null);
        return requireAllAnswers && someNull;
      },
      getMessage: () => every.msg,
    },
  };

  // 검증 실행
  const validationErrors = [];
  for (const [name, validator] of Object.entries(validators)) {
    if (validator.validate()) {
      validationErrors.push(`- ${validator.getMessage()}`);
    }
  }

  if (validationErrors.length > 0) {
    alert(validationErrors.join('\n'));
    return false;
  }

  return true;
};

class MultipleTextQuestion {
  constructor(targetQuestionNumber, altLabel = null) {
    this.qNum = targetQuestionNumber;
    this.qLabel = altLabel === null ? `Q${this.qNum}` : altLabel;
    this.baseNode = document.querySelector(`#survey${this.qNum} .multi-container`);
    this.nodes = this.baseNode.querySelectorAll(`.multi`);
    this.inputs = this.baseNode.querySelectorAll(`input[type="text"]`);
    this.hasLabels = [...this.nodes].some((node) => node.querySelector('label'));
    this.target = document.querySelector(`#answer${this.qNum}`);
    this.min = { value: 1, msg: multiTextMsgs.atleast.replace('{min}', 1) };
    this.max = { value: this.inputs.length, msg: multiTextMsgs.atmost.replace('{max}', this.inputs.length) };
    this.exactly = null;
    this.order = {
      value: !this.hasLabels,
      msg: multiTextMsgs.order,
    };
    this.every = { value: this.hasLabels, msg: multiTextMsgs.every };
    this.duplicate = {
      value: !this.hasLabels,
      msg: multiTextMsgs.duplicate,
    };
    this.hangle = { value: true, msg: multiTextMsgs.hangle };
    this.special = { value: true, msg: multiTextMsgs.special };
    this.exclude = { value: [], msg: null };
    this.answer = null;
    this.cnt = [...this.inputs].filter((input) => input.value !== '').length;
  }

  shuffle(baseOrder = true) {
    const nodes = [...this.nodes].map((node) => node.cloneNode(true));
    this.setEvery();
    if (typeof baseOrder === 'boolean' && baseOrder) {
      nodes.sort(() => Math.random() - 0.5);

      this.baseNode.innerHTML = '';

      nodes.forEach((node, index) => {
        this.baseNode.appendChild(node);
      });
    } else if (Array.isArray(baseOrder)) {
      const uniqueValues = new Set(baseOrder);
      if (uniqueValues.size !== baseOrder.length) {
        throw new Error('Duplicate values found in the flag array. Each input field should be specified only once.');
      }
      if (baseOrder.length !== this.inputs.length) {
        throw new Error('The length of the flag array does not match the number of input fields.');
      }
      const withIndex = baseOrder.map((v) => nodes[v - 1]);
      this.baseNode.innerHTML = '';
      withIndex.forEach((node) => {
        this.baseNode.appendChild(node);
        node.placeholder = node.id;
      });
    }

    this.order = null;

    return this;
  }

  setMin(min, msg = multiTextMsgs.atleast.replace('{min}', min)) {
    this.min = { value: min, msg: msg };
    this.setEvery(false);
    return this;
  }

  setMax(max, msg = multiTextMsgs.atmost.replace('{max}', max)) {
    this.max = { value: max, msg: msg };
    this.setEvery(false);
    return this;
  }

  setExactly(exactly, msg = multiTextMsgs.exactly.replace('{exactly}', exactly)) {
    this.exactly = { value: exactly, msg: msg };
    this.setEvery(false);
    return this;
  }

  setOrder(order = true, msg = multiTextMsgs.order) {
    this.order = { value: order, msg: msg };
    return this;
  }

  setEvery(every = true, msg = multiTextMsgs.every) {
    this.every = { value: every, msg: msg };
    return this;
  }

  setDup(duplicate = true, msg = multiTextMsgs.duplicate) {
    this.duplicate = {
      value: duplicate,
      msg: msg,
    };
    return this;
  }

  setHan(hangle = true, msg = null) {
    this.hangle = {
      value: hangle,
      msg: msg || this.hangle.msg,
    };
    return this;
  }

  setSpecial(special = true, msg = null) {
    this.special = {
      value: special,
      msg: msg || multiTextMsgs.special,
    };
    return this;
  }

  setExclude(exclude, msg = null) {
    if (!Array.isArray(exclude)) {
      exclude = [exclude];
    }
    this.exclude = {
      value: exclude,
      msg: msg || multiTextMsgs.exclude,
    };
    return this;
  }

  submit() {
    const currAnswer = document.querySelectorAll(`#survey${this.qNum} .multi-container input[type="text"]`);
    this.answer = [...this.inputs].map((input) => {
      const matchingInput = [...currAnswer].find((curr) => curr.id === input.id);
      return matchingInput ? matchingInput.value : '';
    });
    const answerValidate = multiTextValidate({
      answers: [...currAnswer].map((input) => input.value),
      atleast: this.min,
      atmost: this.max,
      order: this.order,
      exactly: this.exactly,
      every: this.every,
      duplicate: this.duplicate,
      hangle: this.hangle,
      special: this.special,
      exclude: this.exclude,
    });

    this.cnt = this.answer.filter((input) => input.value !== '').length;

    if (answerValidate) {
      this.target.value = joinMultiAnswers(this.answer);
      const targetObject = this.qLabel;

      const processedIds = new Set();
      [...currAnswer].forEach((input) => {
        const id = `${this.qLabel}${input.id}`;
        if (processedIds.has(id)) {
          throw new Error(`Duplicate ID: ${id}`);
        }
        processedIds.add(id);

        const isAnswer = input.value === '' ? false : true;
        this[id.replace(targetObject, '')] = {
          label: input.id,
          val: input.value === '' ? null : input.value,
          isAnswer: isAnswer,
          type: 'text',
        };
      });

      if (!window.multi) {
        window.multi = {};
      }

      window.multi[targetObject] = this;
      if (window[targetObject]) {
        window[targetObject].multi = this;
      }

      return true;
    } else {
      return false;
    }
  }
}

window.multiText = (altLabel = null) => {
  const target = document.querySelector(`#survey${cur} .question-description`);
  const styleId = `survey-style-${cur}`;

  if (!document.getElementById(styleId)) {
    const addCSS = `
#survey${cur} .multi-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 5px;

  input[type="text"] {
      border: 1px solid #ccc;
      border-radius: 5px;
      min-height: 25px;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      width: 90%;
  }

  div.multi {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 7px;

    label {
      width: 100%;
      text-align: left;
      font-weight: bold;
    }
  }
}`;
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = addCSS;
    target.insertBefore(styleTag, target.firstChild);
  }

  const qNode = document.querySelector(`#survey${cur}`);

  const labels = qNode.querySelectorAll('.multi label');
  if (labels.length >= 1) {
    [...labels].forEach((label) => {
      label.addEventListener('click', () => {
        const parentDiv = label.closest('.multi');
        const input = parentDiv.querySelector('input');
        if (input) {
          input.focus();
        }
      });
    });
  }

  const multiText = new MultipleTextQuestion(cur, altLabel);

  qNode.querySelector('.answer').style.display = 'none';
  const targetBtn = qNode.querySelector('.next-btn-wrapper');
  targetBtn.removeAttribute('onclick');
  targetBtn.onclick = null;

  targetBtn.addEventListener('click', () => {
    const result = multiText.submit();
    if (result) {
      goNext();
    }
  });

  return multiText;
};
