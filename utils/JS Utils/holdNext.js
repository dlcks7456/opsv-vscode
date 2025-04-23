window.holdNext = (seconds = 5, qnum = null) => {
  try {
    if (qnum === null) {
      qnum = cur;
    }
    const question = document.querySelector(`#survey${qnum}`);
    if (!question) {
      throw new Error(`Q${qnum} is not found`);
    }

    const wrapper = question.querySelector('.next-btn-wrapper');
    const target = wrapper.querySelector('.next');
    const originNextText = target.textContent;
    wrapper.style.pointerEvents = 'none';
    let remainingSeconds = seconds;
    target.textContent = remainingSeconds;

    const countdownInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds > 0) {
        target.textContent = remainingSeconds;
      } else {
        clearInterval(countdownInterval);
        target.textContent = originNextText;
        wrapper.style.pointerEvents = 'auto';
      }
    }, 1000);
  } catch (error) {
    console.error(error);
  } finally {
    return true;
  }
};
