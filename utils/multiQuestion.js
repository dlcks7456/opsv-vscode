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
      validate: () => atleast !== null && answerCount < atleast.value,
      getMessage: () => {
        return atleast.msg;
      },
    },
    atmost: {
      validate: () => atmost !== null && answerCount > atmost.value,
      getMessage: () => {
        return atmost.msg;
      },
    },
    exactly: {
      validate: () => exactly !== null && answerCount !== exactly.value,
      getMessage: () => {
        return exactly.msg;
      },
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
  for (const [name, validator] of Object.entries(validators)) {
    if (validator.validate()) {
      alert(validator.getMessage());
      return false;
    }
  }

  return true;
};

class MultiText {
  constructor(targetQuestionNumber, multiBaseId) {
    this.qnum = targetQuestionNumber;
    this.baseId = multiBaseId;
    this.baseNode = document.querySelector(this.baseId);
    this.nodes = document.querySelectorAll(`${multiBaseId} .multi`);
    this.inputs = document.querySelectorAll(`${multiBaseId} input[type="text"]`);
    this.hasLabels = [...this.nodes].some((node) => node.querySelector('label'));
    this.target = document.querySelector(`#answer${this.qnum}`);
    this.min = null;
    this.max = null;
    this.exactly = null;
    this.order = {
      value: !this.hasLabels,
      msg: '순서대로 입력해주세요.',
    };
    this.every = { value: true, msg: '모두 응답해주세요.' };
    this.duplicate = {
      value: !this.hasLabels,
      msg: '중복해서 입력하지 마세요.',
    };
    this.hangle = { value: true, msg: '자/모음만 입력하지 마세요.' };
    this.special = { value: true, msg: '`와 |는 입력 불가능합니다.' };
    this.exclude = { value: [], msg: null };
    this.answer = null;
    this.cnt = [...this.inputs].filter((input) => input.value !== '').length;
  }

  shuffle(baseOrder = true) {
    const nodes = [...this.nodes].map((node) => node.cloneNode(true));
    if (typeof baseOrder === 'boolean' && baseOrder) {
      nodes.sort(() => Math.random() - 0.5);

      this.baseNode.innerHTML = '';

      nodes.forEach((node, index) => {
        this.baseNode.appendChild(node);
      });

      this.order = null;
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
      this.order = null;
    }

    return this;
  }

  setMin(min, msg = `최소 ${min}개 이상 응답해주세요.`) {
    this.min = { value: min, msg: msg };
    return this;
  }

  setMax(max, msg = `최대 ${max}개 이하로 응답해주세요.`) {
    this.max = { value: max, msg: msg };
    return this;
  }

  setExactly(exactly, msg = `정확히 ${exactly}개를 응답해주세요.`) {
    this.exactly = { value: exactly, msg: msg };
    return this;
  }

  setOrder(order, msg = null) {
    this.order = { value: order, msg: msg || this.order.msg };
    return this;
  }

  setEvery(every, msg = null) {
    this.every = { value: every, msg: msg || this.every.msg };
    return this;
  }

  setDup(duplicate, msg = null) {
    this.duplicate = {
      value: duplicate,
      msg: msg || this.duplicate.msg,
    };
    return this;
  }

  setHan(hangle, msg = null) {
    this.hangle = {
      value: hangle,
      msg: msg || this.hangle.msg,
    };
    return this;
  }

  setSpecial(special, msg = null) {
    this.special = {
      value: special,
      msg: msg || '`와 |는 입력 불가능합니다.',
    };
    return this;
  }

  setExclude(exclude, msg = null) {
    if (!Array.isArray(exclude)) {
      exclude = [exclude];
    }
    this.exclude = {
      value: exclude,
      msg: msg || `${exclude}는 입력 불가능합니다.`,
    };
    return this;
  }

  submit() {
    const currAnswer = document.querySelectorAll(`${this.baseId} input[type="text"]`);
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
      const targetObject = `Q${this.qnum}`;

      const processedIds = new Set();
      [...currAnswer].forEach((input) => {
        const id = input.id;
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

      if (!window.custom) {
        window.custom = {};
      }

      window.custom[targetObject] = this;
      if (window[targetObject]) {
        window[targetObject].custom = this;
      }
    } else {
      return false;
    }
  }
}

const setMultiQuestion = (qnum, multiBaseId, questionType) => {
  const target = document.querySelector(`#survey${qnum}`);
  const styleId = `survey-style-${qnum}`;

  if (!document.getElementById(styleId)) {
    const addCSS = `
#survey${qnum} .opsv-q-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 5px;

    input[type="text"],
    input[type="number"] {
        border: 1px solid #8d8d8d;
        border-radius: 5px;
        min-height: 25px;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    input[type="number"] {
        text-align: right;
    }

	div.multi {
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin-bottom: 7px;
	}
}`;
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = addCSS;
    target.insertBefore(styleTag, target.firstChild);
  }
  if (questionType === 'text') {
    return new MultiText(qnum, multiBaseId);
  }
  // TBD
};
