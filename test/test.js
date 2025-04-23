$(`#survey${cur} .answer`).hide() &&
  $(`#survey${cur} .next-btn-wrapper`).attr('onclick', null) &&
  $(`#survey${cur} .next-btn-wrapper`).click(function () {
    if (
      !$(`#survey${cur} .multi:first`)
        .toArray()
        .every(function (e) {
          return e.value.trim() != '';
        })
    ) {
      alert('첫번째 칸은 반드시 입력해주세요.');
      return;
    }
    $(`#answer${cur}`).val(
      $(`#survey${cur} .multi`)
        .toArray()
        .map(function (e) {
          return e.value;
        })
        .join('|')
    );
    goNext();
  });
