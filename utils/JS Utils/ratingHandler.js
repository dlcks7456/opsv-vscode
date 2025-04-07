/* ----------- ratingHandler --------------- */
// 평가형 문항 일괄 처리
// ratingHandler({ reverse: true, showValue: true});

// 특정 문항 처리
window.rating = (obj) => {
  return ratingHandler({ ...obj, qNum: cur });
};

function ratingHandler({ reverse = false, showValue = false, qNum = null }) {
  try {
    const surveyForm = document.querySelector('#survey_form');
    let ratings = [];
    // 평가형 문항만 필터링
    if (qNum === null) {
      const allQuestions = surveyForm.querySelectorAll('.survey');
      ratings = [...allQuestions].filter((question) => [5, 9].includes(Number(question.querySelector('#type').value)));
    } else {
      if (Array.isArray(qNum)) {
        ratings = qNum.map((q) => surveyForm.querySelectorAll(`#survey${q}`));
      } else {
        ratings = [surveyForm.querySelector(`#survey${qNum}`)];
      }
    }

    ratings.forEach((rating) => {
      const cells = rating.querySelectorAll('.answer-eval-wrapper tbody tr:first-child td');
      const score = cells.length;
      const ratingType = Number(rating.querySelector('#type').value);
      const tableFlag = score > 7;

      let ratingCSS = '';
      let tableCellCSS = '';

      // 일반 평가형
      if (ratingType === 5) {
        tableCellCSS += `
        td {
            width: 100%;
        }`;

        if (reverse) {
          ratingCSS += `
        #${rating.id} .answer-eval-wrapper {
            tbody tr {
                ${tableFlag ? 'display: flex;' : ''}
                flex-direction: row-reverse;
                
                ${tableFlag ? tableCellCSS : ''}
        
                &:last-child {
                  td:first-child {
                    text-align: right!important;
                  }
                  td:last-child {
                    text-align: left!important;
                  }
                }
            }
        }
        `;
        }

        if (showValue && !tableFlag) {
          ratingCSS += `
            #${rating.id} table tbody tr:first-child td {
                position: relative;
            }

            #${rating.id} .cell-value {
                position: absolute;
                bottom: -60%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 0.7rem;
                z-index: 999;
                color: #2b2a2a;
                pointer-events: none;
                font-weight: bold;
            }`;

          cells.forEach((cell) => {
            const cellValue = Number(cell.querySelector('input').value);
            const valueLabel = document.createElement('div');
            valueLabel.classList.add('cell-value');
            valueLabel.textContent = `[${cellValue}]`;
            cell.appendChild(valueLabel);
          });
        }
      }

      // 객관식 단일 평가형
      if (ratingType === 9) {
        ratingCSS += `
  #${rating.id} .answer .answer-wrapper {
    display: flex;
    flex-direction: column-reverse;
  }
  `;
      }

      const styleTag = document.createElement('style');
      styleTag.textContent = ratingCSS;
      rating.insertBefore(styleTag, rating.firstChild);
    });
  } catch (error) {
    console.error('ratingHandler error:', error);
  } finally {
    return true;
  }
}

/* ----------- ratingHandler --------------- */
