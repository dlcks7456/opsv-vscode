window.thisOrThat = (groups = {}, qnum = null) => {
  try {
    if (qnum === null) qnum = cur;
    if (Object.keys(groups).length === 0) return true;

    const questionId = `#survey${qnum}`;
    const question = document.querySelector(questionId);

    if (!question.querySelector('style[data-this-that-style]')) {
      const thisThatCSS = `
    <style data-this-that-style>
    ${questionId} .answer-choice-wrapper {
        transition: opacity 0.5s ease;
    }
    </style>`;
      question.insertAdjacentHTML('beforeend', thisThatCSS);
    }

    const optionMap = {};
    const groupInfo = {};

    Object.entries(groups).forEach(([group, arr]) => {
      if (!Array.isArray(arr)) return;

      if (arr.every((v) => typeof v === 'number')) {
        groupInfo[group] = { type: 'exclusive', sets: [arr] };
        mapOptionsToGroup(arr, group, 0);
      } else if (arr.length === 2) {
        const agroup = arr[0];
        const bgroup = arr[1];
        const sets = [Array.isArray(agroup) ? agroup : [agroup], Array.isArray(bgroup) ? bgroup : [bgroup]];
        groupInfo[group] = { type: 'pair', sets };
        sets.forEach((set, idx) => mapOptionsToGroup(set, group, idx));
      } else {
        const flatArr = arr.flat();
        groupInfo[group] = { type: 'exclusive', sets: [flatArr] };
        mapOptionsToGroup(flatArr, group, 0);
      }
    });

    function mapOptionsToGroup(options, group, role) {
      options.forEach((code) => {
        if (!optionMap[code]) optionMap[code] = [];
        optionMap[code].push({ group, role });
      });
    }

    Object.keys(optionMap).forEach((code) => {
      const input = document.querySelector(`#answer${qnum}-${code}`);
      if (input) {
        input.addEventListener('change', updateDisabled);
      }
    });

    function updateDisabled() {
      const checked = Object.keys(optionMap).filter((code) => {
        const input = document.querySelector(`#answer${qnum}-${code}`);
        return input && input.checked;
      });

      Object.keys(optionMap).forEach((code) => {
        let shouldDisable = false;

        optionMap[code].forEach(({ group, role }) => {
          const info = groupInfo[group];

          if (info.type === 'exclusive') {
            checked.forEach((checkedCode) => {
              if (checkedCode !== code && optionMap[checkedCode].some((x) => x.group === group)) {
                shouldDisable = true;
              }
            });
          } else if (info.type === 'pair') {
            checked.forEach((checkedCode) => {
              optionMap[checkedCode].forEach(({ group: checkedGroup, role: checkedRole }) => {
                if (group === checkedGroup && role !== checkedRole) {
                  shouldDisable = true;
                }
              });
            });
          }
        });

        const input = document.querySelector(`#answer${qnum}-${code}`);
        const option = input?.parentNode;
        if (input && option) {
          input.readOnly = shouldDisable;
          option.style.opacity = shouldDisable ? '0.5' : '1';
          option.style.pointerEvents = shouldDisable ? 'none' : '';
        }
      });
    }

    updateDisabled();
  } catch (e) {
    console.error('Error in thisOrThat function:', e);
  } finally {
    return true;
  }
};
