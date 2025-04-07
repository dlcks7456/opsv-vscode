validate(() => {
  if (now.rk1.a1) {
    return err('1순위에서 보기 1 응답');
  }

  if (now.rk2.a2) {
    return err('2순위에서 보기 2 응답');
  }
});
