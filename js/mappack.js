const DEV_PASSWORD = 'tyviva123';
const TIER_COLORS = {
  'Tier 1': '#00ffff',
  'Tier 2': '#00ff00',
  'Tier 3': '#ffff00',
  'Tier 4': '#ffaa00',
  'Tier 5': '#ff0000',
  'Tier 6': '#ff00ff',
  Unrated: '#888888',
};

let packData = [];
let classicLevelData = [];
let changeHistory = [];
let currentUser = localStorage.getItem('currentUser') || null;

// 데이터 로딩
Promise.all([
  fetch('mappack.json')
    .then((r) => r.json())
    .catch(() => ({ packs: [], history: [] })),
  fetch('level/classic.json')
    .then((r) => r.json())
    .catch(() => ({ levels: [] })),
])
  .then(([packJson, levelJson]) => {
    packData = packJson.packs || [];
    changeHistory = packJson.history || [];
    classicLevelData = levelJson.levels || [];

    if (currentUser)
      document.getElementById('userStatus').innerText = `접속: ${currentUser}`;
    initPage();
  })
  .catch((err) => {
    console.error('데이터 로딩 실패:', err);
  });

function initPage() {
  packData.sort((a, b) => {
    const getTierNum = (str) => {
      const match = (str || '').match(/Tier\s+(\d+)/i);
      return match ? parseInt(match[1]) : 999;
    };
    return getTierNum(a.tier) - getTierNum(b.tier);
  });

  renderList(packData);
  renderHistory();
  if (packData.length > 0) showPackDetail(packData[0]);
}

// 클리어 체크 로직
function checkIfLevelCleared(levelName) {
  if (!currentUser) return false;
  const name = currentUser.toLowerCase();
  const level = classicLevelData.find(
    (l) => l.title.trim().toLowerCase() === levelName.trim().toLowerCase(),
  );

  if (!level) return false;

  const isCleared =
    level.clears &&
    level.clears.some(
      (c) => c.player.toLowerCase() === name && Number(c.percent) === 100,
    );
  const isVerifier = level.verifier && level.verifier.toLowerCase() === name;

  return isCleared || isVerifier;
}

function getLevelRank(levelName, author) {
  const levelIndex = classicLevelData.findIndex(
    (l) =>
      l.title.trim().toLowerCase() === levelName.trim().toLowerCase() &&
      l.creator.trim().toLowerCase() === author.trim().toLowerCase(),
  );
  return levelIndex !== -1 ? levelIndex + 1 : '???';
}

// 맵 팩 리스트 렌더링
function renderList(data) {
  const list = document.getElementById('packList');
  list.innerHTML = '';
  data.forEach((pack) => {
    // 맵 팩 전체 클리어 여부 확인
    const isPackAllCleared = pack.levels.every((lvl) =>
      checkIfLevelCleared(lvl.name),
    );

    const div = document.createElement('div');
    div.className = `item ${isPackAllCleared ? 'all-cleared' : ''}`;
    const tierColor = TIER_COLORS[pack.tier] || '#ffffff';
    div.innerHTML = `
      <div class="pack-tier" style="color: ${tierColor}">${pack.tier}</div>
      <div>
        <div class="title">${pack.title} ${isPackAllCleared ? '✅' : ''}</div>
        <div class="creator">by ${pack.creator}</div>
      </div>
    `;
    div.onclick = () => showPackDetail(pack, div);
    list.appendChild(div);
  });
}

// 상세 페이지 렌더링
function showPackDetail(pack, el) {
  document
    .querySelectorAll('.item.active')
    .forEach((i) => i.classList.remove('active'));
  if (el) el.classList.add('active');

  const tierColor = TIER_COLORS[pack.tier] || '#ffffff';
  const content = document.getElementById('packDetailContent');

  content.innerHTML = `
    <div class="detail-header">
      <div class="pack-title">${pack.title}</div>
      <div class="pack-subtitle">${pack.description}</div>
      <div style="margin-top:10px;">
        <span style="background:#333; padding:5px 12px; border-radius:15px; border: 1px solid ${tierColor}; color: ${tierColor}; font-weight:bold;">${
          pack.tier
        }</span>
        <span style="background:#444; padding:5px 12px; border-radius:15px; margin-left:5px; color:#ddd;">Levels: ${
          pack.levels.length
        }</span>
      </div>
    </div>

    <div class="pack-content-box">
      <div class="content-header">맵 리스트</div>
      ${pack.levels
        .map((lvl, idx) => {
          const cleared = checkIfLevelCleared(lvl.name);
          const rank = getLevelRank(lvl.name, lvl.author);
          return `
          <div class="level-item ${
            cleared ? 'cleared' : ''
          }" onclick="goToLevelAuto('${lvl.name}', '${lvl.author}')">
            <div class="level-idx">${idx + 1}</div>
            <div class="level-info">
              <div class="level-name">${
                lvl.name
              } <span class="check-mark">✅</span></div>
              <div class="level-author">by ${lvl.author}</div>
            </div>
            <div class="level-rank">#${rank}</div>
            <div style="color:#888; font-size:0.8rem;">Click to View →</div>
          </div>
        `;
        })
        .join('')}
    </div>
  `;

  const clearBox = document.getElementById('packClears');
  clearBox.innerHTML = '';
  if (pack.clears && pack.clears.length > 0) {
    pack.clears.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'clear-row';
      row.innerHTML = `<span class="clear-user">${c.player}</span><span class="clear-date">${c.date}</span>`;
      clearBox.appendChild(row);
    });
  } else {
    clearBox.innerHTML =
      '<div style="text-align:center; color:#777; margin-top:20px;">클리어 유저가 없습니다.</div>';
  }
}

// 계정 선택 (로그인)
function login() {
  const name = prompt('닉네임을 입력해주세요.');
  if (!name) return;
  currentUser = name;
  localStorage.setItem('currentUser', name);
  document.getElementById('userStatus').innerText = `접속 계정 : ${name}`;
  alert(`${name}님, 환영합니다!`);
  renderList(packData);
  // 현재 선택된 팩 상세 내용 갱신
  const activeTitle = document
    .querySelector('.item.active .title')
    ?.innerText.replace(' ✅', '');
  const currentPack = packData.find((p) => p.title === activeTitle);
  if (currentPack) showPackDetail(currentPack);
}

function goToLevelAuto(levelName, author) {
  const target = classicLevelData.find(
    (l) =>
      l.title.trim().toLowerCase() === levelName.trim().toLowerCase() &&
      l.creator.trim().toLowerCase() === author.trim().toLowerCase(),
  );
  if (target && target.id) {
    window.location.href = `level/classic.html?id=${target.id}`;
  } else {
    alert(`'${levelName}' 레벨을 찾을 수 없습니다.`);
  }
}

document.getElementById('search').addEventListener('input', (e) => {
  const val = e.target.value.toLowerCase();
  const filtered = packData.filter((p) => p.title.toLowerCase().includes(val));
  renderList(filtered);
});

function renderHistory() {
  const box = document.getElementById('historyBox');
  box.innerHTML = changeHistory
    .slice(0, 10)
    .map(
      (h) => `
    <div style="color:#ccc; font-family:Paperlogy3; margin-bottom:5px;">
      <span style="color:#66ccff">[${h.time}]</span> <b>${h.type}</b>: ${h.detail}
    </div>
  `,
    )
    .join('');
}
