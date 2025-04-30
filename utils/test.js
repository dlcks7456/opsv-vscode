validate(() => {
  if (now.a0) {
    return err('없음 응답 하드 에러');
  }

  if (now.etc) {
    return softErr('기타 응답 소프트 에러');
  }
}) &&
  (() => {
    Q20.setVal('테스트');
    Q21.setVal(32);
    Q22.setVal(5);
    Q23.setVal(1);
    Q24.setVal(5);
    Q25.setVal([1, 2, 3]);
    Q26.setVal([3, 2, 1]);
    return true;
  })();
