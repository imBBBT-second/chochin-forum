let classicLevels = [];
const selectedCategories = new Set();

fetch('level/classic.json')
  .then((res) => res.json())
  .then((data) => {
    classicLevels = data.levels || [];
  })
  .catch((err) => console.error('레벨 데이터를 불러오지 못했습니다.', err));

function toggleCategory(category, btn) {
  if (selectedCategories.has(category)) {
    selectedCategories.delete(category);
    btn.classList.remove('active');
  } else {
    selectedCategories.add(category);
    btn.classList.add('active');
  }
}

function startSpin() {
  if (classicLevels.length === 0) {
    alert('레벨 데이터가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  if (selectedCategories.size === 0) {
    alert('범위를 하나 이상 선택해주세요!');
    return;
  }

  let pool = [];
  if (selectedCategories.has('main'))
    pool = pool.concat(classicLevels.filter((l) => l.id >= 1 && l.id <= 10));
  if (selectedCategories.has('ext'))
    pool = pool.concat(classicLevels.filter((l) => l.id >= 11 && l.id <= 20));
  if (selectedCategories.has('legacy'))
    pool = pool.concat(classicLevels.filter((l) => l.id >= 21));

  if (pool.length === 0) {
    alert('해당 범위에 레벨이 없습니다.');
    return;
  }

  // UI 초기화
  const resultBox = document.getElementById('resultBox');
  const titleEl = document.getElementById('resultTitle');
  const creatorEl = document.getElementById('resultCreator');
  const linkEl = document.getElementById('resultLink');

  resultBox.style.display = 'block';
  linkEl.style.display = 'none'; // 추첨 중에는 링크 숨김

  let count = 0;
  const maxCount = 20; // 20번 바뀜
  const interval = setInterval(() => {
    const randomLevel = pool[Math.floor(Math.random() * pool.length)];
    titleEl.innerText = `#${randomLevel.id} - ${randomLevel.title}`;
    creatorEl.innerText = `by ${randomLevel.creator}`;

    count++;
    if (count >= maxCount) {
      clearInterval(interval);
      // 최종 결과 확정 (마지막에 보여진 것이 결과가 됨)
      linkEl.href = `level/classic.html?id=${randomLevel.id}`;
      linkEl.style.display = 'inline-block';
    }
  }, 80); // 0.08초마다 변경
}
