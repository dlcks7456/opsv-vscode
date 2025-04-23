window.quotaFull = () => {
  const Q3 = getAnswerSet(3);
  const genderQuota = {
    남자: Q3.exists([1]),
    여자: Q3.exists([2]),
  };

  const Q4 = getAnswerSet(4);
  const ageQuota = {
    '10대': Q4.val() >= 10 && Q4.val() <= 19,
    '20대': Q4.val() >= 20 && Q4.val() <= 29,
    '30대': Q4.val() >= 30 && Q4.val() <= 39,
    '40대': Q4.val() >= 40 && Q4.val() <= 49,
    '50대': Q4.val() >= 50 && Q4.val() <= 59,
    '60대': Q4.val() >= 60,
  };

  const quotaFlag = $(`#quotaFlag`);
  quotaFlag.val(2); // Complete

  const singleQuotas = singleQuotaFull([genderQuota, ageQuota]);

  if (!singleQuotas) {
    quotaFlag.val(3); // Quota Full
  }

  return singleQuotas;
};

function singleQuotaFull(singleQuotas = []) {
  for (const quota of singleQuotas) {
    let flag = false;
    Object.entries(quota).forEach(([cell, cond]) => {
      if (cond) {
        flag = true;
      }
    });

    if (!flag) {
      return false;
    }
  }
  return true;
}
