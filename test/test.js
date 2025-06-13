thisOrThat({
 g1: [1, 2],   // 1, 2 서로 중복불가
 g2: [3, 4, 5], // 3, 4, 5는 서로 중복불가
 g3: [6, [7, 8]], // 6 선택시 7, 8 선택 불가 / 반대도 동일
 g4: [[9, 10], [11, 12]], // 9, 10 선택시 11, 12 선택 불가 / 반대도 동일
})

1~10
1~5, 11
6~10

11

window.between = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

groupRotation([
  between(1, 5),
  between(6, 10)
]) 

thisOrThat({
 g1: [1, 2],   // 1, 2 서로 중복불가
 g2: [3, 4, 5], // 3, 4, 5는 서로 중복불가
 g3: [6, [7, 8]], // 6 선택시 7, 8 선택 불가 / 반대도 동일
 g4: [[9, 10], [11, 12]], // 9, 10 선택시 11, 12 선택 불가 / 반대도 동일
})

// 1, 2번은 중복불가
// 3, 4번 중복불가
// 5~8번 보기가 있다고 가정

(()=>{
    const groups = {
      g1: [1, 2],
      g2: [3, 4],
      g3: [5, 6],
    };
    thisOrThat(groups);
    groupRotation(Object.values(groups));
    return true;
})()