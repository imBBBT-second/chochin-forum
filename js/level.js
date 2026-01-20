/* ================= 데이터 및 상수 ================= */
// LEVEL_CONFIG는 HTML에서 정의되어야 함

const PLAYER_YOUTUBE = {
  imBBBT: 'https://www.youtube.com/@imBBBT',
  Choco: 'https://www.youtube.com/@초코5768',
  Light: 'https://www.youtube.com/@CC_Light722',
  Timo: 'https://www.youtube.com/@SNIPER_Timo',
};

const DEV_PASSWORD = 'tyviva123';

let demonData = [];
let changeHistory = [];
let filteredData = [];
let currentUser = localStorage.getItem('currentUser') || null;

let githubConfig = {
  owner: LEVEL_CONFIG.ghOwner,
  repo: LEVEL_CONFIG.ghRepo,
  path: LEVEL_CONFIG.ghPath,
  token: LEVEL_CONFIG.ghToken || localStorage.getItem('gh_token') || '',
};

document.addEventListener('DOMContentLoaded', async function () {
  try {
    const response = await fetch(LEVEL_CONFIG.jsonUrl);
    const data = await response.json();

    demonData = data.levels || data.buttons || data || [];
    changeHistory = data.history || [];
    filteredData = [...demonData];

    if (currentUser) {
      document.getElementById('userStatus').innerText =
        `접속 계정 : ${currentUser}`;
    }

    renderTagFilterButtons();
    generateList(filteredData);
    renderHistory();

    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    let initialIndex = 0;

    if (idParam) {
      const foundIndex = filteredData.findIndex((d) => d.id == idParam);
      if (foundIndex !== -1) initialIndex = foundIndex;
    }

    if (filteredData.length > 0) {
      const list = document.getElementById('list');
      const targetEl = list.children[initialIndex];
      showDetail(filteredData[initialIndex], targetEl);
      if (idParam && targetEl) targetEl.scrollIntoView({ block: 'center' });
    }
  } catch (err) {
    console.error('JSON 로드 실패 또는 파일 없음', err);
    document.getElementById('list').innerHTML =
      `<div style="color:white;text-align:center;padding:20px;">데이터를 불러오는 데 실패했습니다.</div>`;
  }
});

function login() {
  const name = prompt('닉네임을 입력해주세요.');
  if (!name) return;

  currentUser = name;
  localStorage.setItem('currentUser', name);
  document.getElementById('userStatus').innerText = `접속 계정 : ${name}`;
  alert(`${name}님, 환영합니다!`);

  generateList(filteredData);
}

function checkIfCleared(item) {
  if (!currentUser) return false;
  const name = currentUser.toLowerCase();

  const isInClearList =
    item.clears && item.clears.some((c) => c.player.toLowerCase() === name);
  const isVerifier = item.verifier && item.verifier.toLowerCase() === name;

  return isInClearList || isVerifier;
}

/* ================= 초기화 및 렌더링 ================= */
function generateList(data) {
  const list = document.getElementById('list');
  list.innerHTML = '';

  if (data.length === 0) {
    list.innerHTML =
      '<div style="color:#aaa; text-align:center; margin-top:20px;">검색 결과가 없습니다.</div>';
    return;
  }

  data.forEach((item) => {
    const isDone = checkIfCleared(item);
    const div = document.createElement('div');
    div.className = `item ${isDone ? 'cleared' : ''}`;
    div.innerHTML = `
      <div class="rank">${item.id}</div>
      <div>
        <div class="title">${item.title} ${
          isDone ? '<span class="clear-check">✅</span>' : ''
        }</div>
        <div class="creator">${item.creator}</div>
      </div>
    `;
    div.onclick = () => showDetail(item, div);
    list.appendChild(div);
  });
}

function showDetail(item, element) {
  document
    .querySelectorAll('.item')
    .forEach((el) => el.classList.remove('active'));
  if (element) element.classList.add('active');

  const clearBox = document.getElementById('detailClears');
  if (!clearBox) return;

  document.getElementById('detailTitle').textContent = item.title;
  document.getElementById('detailCreator').textContent =
    item.creator === item.verifier
      ? `by ${item.creator}`
      : `by ${item.creator} / Verified by ${item.verifier}`;

  const videoFrame = document.getElementById('detailVideo');
  if (videoFrame) {
    videoFrame.src = item.video ? item.video : 'about:blank';
  }

  const info = document.getElementById('infoSection');
  if (info) {
    info.innerHTML = '';
    if (item.map) {
      info.innerHTML = `
      <div class="info-row" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #555;">
        <span><b>ID:</b> ${item.map?.mapId || '-'}</span>
        <span><b>Length:</b> ${item.map?.length || '-'}</span>
        <span><b>Objects:</b> ${item.map?.objects?.toLocaleString() || '0'}</span>
        <span><b>Date:</b> ${item.map?.uploadDate || '-'}</span>
      </div>
      <div class="song-info" style="background: #333; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
        <div style="font-family: Paperlogy7; color: #fff;">노래 정보</div>
        <div style="font-size: 0.9rem; color: #eee; font-family: Paperlogy5;">
          ${item.song?.artist || 'Unknown'} - ${item.song?.name || 'Unknown'}
          <span style="color: #888;">(ID: ${item.song?.id || '-'})</span>
        </div>
      </div>
    `;
    }
  }

  const graph = document.getElementById('graphSection');
  if (graph) {
    graph.innerHTML = '';
    if (item.gameplay) {
      graph.innerHTML += makeRatioGraph(
        '게임모드 비율',
        item.gameplay.modeRatio,
      );
      graph.innerHTML += makeRatioGraph('속도 비율', item.gameplay.speedRatio);
    }
    if (item.framePerfect) {
      graph.innerHTML += makeRatioGraph(
        '프레임 퍼펙트',
        item.framePerfect.fps,
        '',
      );
    }
  }

  const description = document.getElementById('detailDescription');
  if (description) {
    description.innerHTML = '';
    if (item.tags?.length) {
      const tagsHtml = item.tags
        .map(
          (t) => `<span class="tag" onclick="searchByTag('${t}')">#${t}</span>`,
        )
        .join('');
      description.innerHTML = `<div class="section"><div class="section-title">태그</div><div class="tag-group-container">${tagsHtml}</div></div>`;
    }
  }

  clearBox.innerHTML = '';
  if (item.clears?.length) {
    item.clears.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = `clear-row rank-${i + 1}`;
      const youtube =
        typeof PLAYER_YOUTUBE !== 'undefined' ? PLAYER_YOUTUBE[c.player] : null;
      const playerHTML = youtube
        ? `<a href="${youtube}" target="_blank">${c.player}</a>`
        : c.player;

      row.innerHTML = `
        <div class="clear-rank">${i + 1}</div>
        <div class="clear-player">${playerHTML}</div>
        <div class="clear-percent ${c.percent === 100 ? 'full' : ''}">${c.percent}%</div>
        <div class="clear-date">${c.date || ''}</div>
      `;
      clearBox.appendChild(row);
    });
  }

  if (typeof renderHistory === 'function') {
    renderHistory(item.title);
  }
}

function makeRatioGraph(title, data, suffix = '%') {
  if (!data || Object.keys(data).length === 0) return '';
  return `
    <div class="graph-box">
      <div class="graph-title">${title}</div>
      ${Object.entries(data)
        .map(
          ([k, v]) => `
        <div class="graph-row">
          <div class="graph-label">${k}</div>
          <div class="graph-bar-bg"><div class="graph-bar" data-key="${k}" style="width:${v}%"></div></div>
          <div class="graph-value">${v}${suffix}</div>
        </div>
      `,
        )
        .join('')}
    </div>
  `;
}

function renderTagFilterButtons() {
  const container = document.getElementById('tagCategoryContainer');
  if (!container) return;

  // LEVEL_CONFIG.filterCategories 사용
  container.innerHTML = Object.entries(LEVEL_CONFIG.filterCategories)
    .map(
      ([catName, tags]) => `
    <div class="tag-cat-row">
      <div class="tag-cat-name">${catName}</div>
      <div class="tag-cat-list">
        ${tags
          .map(
            (t) =>
              `<button class="filter-tag-btn" onclick="searchByTag('${t}')">#${t}</button>`,
          )
          .join('')}
      </div>
    </div>
  `,
    )
    .join('');
}

function searchByTag(tagName) {
  const searchInput = document.getElementById('search');
  if (searchInput.value === tagName) searchInput.value = '';
  else searchInput.value = tagName;
  updateFilter();
}

function updateFilter() {
  const term = document.getElementById('search').value.toLowerCase().trim();
  document.querySelectorAll('.filter-tag-btn').forEach((btn) => {
    if (btn.innerText.toLowerCase() === `#${term}`) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  filteredData = demonData.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(term);
    const tagMatch =
      item.tags &&
      item.tags.some(
        (t) => t.toLowerCase() === term || t.toLowerCase().includes(term),
      );
    return titleMatch || tagMatch;
  });

  generateList(filteredData);
  if (filteredData.length > 0) showDetail(filteredData[0]);
}

/* ================= 개발자 패널 로직 ================= */
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
    const panel = document.getElementById('devPanel');
    if (panel.classList.contains('open')) panel.classList.remove('open');
    else if (prompt('개발자 비밀번호') === DEV_PASSWORD) {
      panel.classList.add('open');
      renderDevHome();
    }
  }
});

function renderDevHome() {
  document.getElementById('devContent').innerHTML = `
    <button class="dev-btn" onclick="renderLevelForm()">새 레벨 등록</button>
    <button class="dev-btn" onclick="renderEditList()">레벨 수정 / 기록 갱신</button>
    <button class="dev-btn" onclick="renderGitHubConfig()" style="background:#8e44ad;">GitHub 설정</button>
    <button class="dev-btn" onclick="saveToGitHub()" style="background:#2980b9;">GitHub에 저장</button>
    <button class="dev-btn" onclick="exportJson()" style="background:#5cb85c;">JSON 내보내기</button>
  `;
}

function renderEditList() {
  let html =
    '<h3>수정할 레벨 선택</h3><div style="max-height:300px; overflow-y:auto; background:#333; border-radius:5px;">';
  demonData.forEach((lv, idx) => {
    html += `<div class="item" style="padding:10px; border-bottom:1px solid #444;" onclick="renderLevelForm()">
              ${lv.id}. ${lv.title}
              </div>`;
  });
  html +=
    '</div><button class="dev-btn" onclick="renderDevHome()">뒤로가기</button>';
  document.getElementById('devContent').innerHTML = html;
}

function renderLevelForm(idx = null) {
  const isEdit = idx !== null;
  const lv = isEdit
    ? demonData[idx]
    : {
        title: '',
        creator: '',
        verifier: '',
        video: '',
        map: { mapId: '', length: '', objects: 0, uploadDate: '' },
        song: { name: '', artist: '', id: '' },
        gameplay: { modeRatio: {}, speedRatio: {} },
        framePerfect: { total: 0, fps: {} },
        tags: [],
      };

  const mkInput = (id, ph, val, type = 'text') =>
    `<input id="${id}" class="dev-input" type="${type}" placeholder="${ph}" value="${val || ''}">`;

  document.getElementById('devContent').innerHTML = `
    <h3>${isEdit ? '레벨 수정' : '새 레벨 등록'}</h3>
    <div style="max-height:450px; overflow-y:auto; padding-right:10px; display:flex; flex-direction:column; gap:10px;">
    <label>순위 설정 (현재 총 ${demonData.length}개)</label>
      ${mkInput(
        'f-placement',
        `순위 (1~${demonData.length + (isEdit ? 0 : 1)})`,
        isEdit ? idx + 1 : demonData.length + 1,
        'number',
      )}
        
      <label>기본: 제목, 제작자, 베리파이어, 영상URL</label>
      ${mkInput('f-title', '제목', lv.title)}
      ${mkInput('f-creator', '제작자', lv.creator)}
      ${mkInput('f-verifier', '베리파이어', lv.verifier)}
      ${mkInput('f-video', '영상 URL', lv.video)}

      <label>맵: ID, 길이, 오브젝트, 날짜</label>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
        ${mkInput('f-mid', '맵 ID', lv.map?.mapId)}
        ${mkInput('f-mlen', '길이', lv.map?.length)}
        ${mkInput('f-mobj', '오브젝트', lv.map?.objects)}
        ${mkInput('f-mdate', '날짜', lv.map?.uploadDate)}
      </div>

      <label>노래: 제목, 작곡가, 노래 ID</label>
      ${mkInput('f-sname', '노래 제목', lv.song?.name)}
      ${mkInput('f-sauth', '작곡가', lv.song?.artist)}
      ${mkInput('f-sid', '노래 ID', lv.song?.id)}

      <label>비율(JSON): 모드, 속도, 프레임퍼펙트</label>
      <textarea id="f-mode" class="dev-input" placeholder='모드 비율 {"Cube":50...}' style="min-height:60px;">${JSON.stringify(
        lv.gameplay?.modeRatio || {},
      )}</textarea>
      <textarea id="f-speed" class="dev-input" placeholder='속도 비율 {"1x":100...}' style="min-height:60px;">${JSON.stringify(
        lv.gameplay?.speedRatio || {},
      )}</textarea>
      <textarea id="f-fps" class="dev-input" placeholder='FPS {"60hz":1...}' style="min-height:60px;">${JSON.stringify(
        lv.framePerfect?.fps || {},
      )}</textarea>

      <label class="dev-label">태그 (쉼표 구분)</label>
      ${mkInput('f-tags', '태그1, 태그2', lv.tags?.join(', '))}
    </div>
    <button class="dev-btn dev-btn-save" onclick="saveLevelForm()">
  ${isEdit ? '수정 완료' : '등록 완료'}
</button>
    ${
      isEdit
        ? `<button class="dev-btn" onclick="deleteLevel()" style="background:#e74c3c;">삭제</button>`
        : ''
    }
    <button class="dev-btn" onclick="renderDevHome()">취소</button>

    <label class="dev-label">기록 관리 (Clears)</label>
      <div id="f-clears-container" style="display:flex; flex-direction:column; gap:5px;">
        ${(lv.clears || [])
          .map(
            (c, i) => `
          <div class="clear-edit-row" style="display:flex; gap:3px;">
            <input class="dev-input cl-p" placeholder="유저" value="${c.player}" style="flex:2">
            <input class="dev-input cl-v" placeholder="%" value="${c.percent}" style="flex:1">
            <input class="dev-input cl-d" placeholder="날짜" value="${c.date || ''}" style="flex:1.5">
            <button onclick="this.parentElement.remove()" style="background:#e74c3c; border:none; color:white; border-radius:4px; cursor:pointer; width:30px;">X</button>
          </div>
        `,
          )
          .join('')}
      </div>
      <button class="dev-btn" onclick="addClearInputRow()" style="background:#3498db; margin-top:5px;">+ 기록 추가</button>
      `;
}

function saveLevelForm(idx) {
  const isEdit = idx !== null;

  try {
    const playerInputs = document.querySelectorAll('.cl-p');
    const percentInputs = document.querySelectorAll('.cl-v');
    const dateInputs = document.querySelectorAll('.cl-d');
    const newClears = [];
    const placementInput = document.getElementById('f-placement');
    let targetRank = placementInput
      ? parseInt(placementInput.value) - 1
      : isEdit
        ? idx
        : demonData.length;

    playerInputs.forEach((input, i) => {
      const pName = input.value.trim();
      if (pName) {
        newClears.push({
          player: pName,
          percent: parseInt(percentInputs[i].value) || 100,
          date: dateInputs[i]?.value.trim() || '',
        });
      }
    });

    const getValue = (id) => document.getElementById(id)?.value || '';

    let fpsData = {};
    try {
      fpsData = JSON.parse(getValue('f-fps') || '{}');
    } catch (e) {
      alert('FPS 데이터 형식 오류');
      return;
    }

    const newData = {
      id: isEdit ? demonData[idx].id : demonData.length + 1,
      title: getValue('f-title'),
      creator: getValue('f-creator'),
      verifier: getValue('f-verifier'),
      video: getValue('f-video'),
      map: {
        mapId: getValue('f-mid'),
        length: getValue('f-mlen'),
        objects: parseInt(getValue('f-mobj')) || 0,
        uploadDate: getValue('f-mdate'),
      },
      song: {
        name: getValue('f-sname'),
        artist: getValue('f-sauth'),
        id: getValue('f-sid'),
      },
      gameplay: {
        modeRatio: JSON.parse(getValue('f-mode') || '{}'),
        speedRatio: JSON.parse(getValue('f-speed') || '{}'),
      },
      framePerfect: {
        fps: fpsData,
        total: Object.values(fpsData).reduce(
          (a, b) => a + (parseInt(b) || 0),
          0,
        ),
      },
      tags: getValue('f-tags')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t),
      clears: newClears,
    };

    if (isEdit) {
      const oldRank = idx;
      if (oldRank !== targetRank) {
        const direction = targetRank < oldRank ? '상승' : '하락';
        addHistory(
          'reeval',
          newData.title,
          `'${newData.title}' 레벨의 재평가로 인해 순위가 ${oldRank + 1}위에서 ${targetRank + 1}위로 ${direction}하였습니다.`,
        );

        const start = Math.min(oldRank, targetRank);
        const end = Math.max(oldRank, targetRank);
        const shift = targetRank < oldRank ? 1 : -1;

        for (let i = start; i <= end; i++) {
          if (i === oldRank) continue;
          const affectedLv = demonData[i];
          const shiftDir = shift > 0 ? '하락' : '상승';
          addHistory(
            'move',
            affectedLv.title,
            `'${newData.title}' 레벨의 순위 변동으로 인해 순위가 ${i + 1}위에서 ${i + 1 + shift}위로 ${shiftDir}하였습니다.`,
          );
        }

        demonData.splice(oldRank, 1);
        demonData.splice(targetRank, 0, newData);
      } else {
        demonData[idx] = newData;
      }
    } else {
      for (let i = targetRank; i < demonData.length; i++) {
        addHistory(
          'move',
          demonData[i].title,
          `'${newData.title}' 레벨 추가로 인해 순위가 ${i + 1}위에서 ${i + 2}위로 하락하였습니다.`,
        );
      }

      demonData.splice(targetRank, 0, newData);
      addHistory(
        'add',
        newData.title,
        `${targetRank + 1}위에 새로운 레벨이 등록되었습니다.`,
      );
    }

    demonData.forEach((lv, i) => {
      lv.id = i + 1;
    });

    generateList(demonData);
    alert('저장 완료');
    renderDevHome();
  } catch (err) {
    console.error('저장 중 에러 발생:', err);
    alert('저장 실패');
  }
}

function deleteLevel(idx) {
  if (
    !confirm(
      '정말로 이 레벨을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.',
    )
  )
    return;

  const deletedLv = demonData[idx];
  const oldRank = idx + 1;

  addHistory(
    'remove',
    deletedLv.title,
    `${oldRank}위에 있던 레벨이 삭제되었습니다.`,
  );

  for (let i = idx + 1; i < demonData.length; i++) {
    const affectedLv = demonData[i];
    addHistory(
      'move',
      affectedLv.title,
      `'${deletedLv.title}' 레벨 삭제로 인해 순위가 ${i + 1}위에서 ${i}위로 상승하였습니다.`,
    );
  }

  demonData.splice(idx, 1);
  demonData.forEach((lv, i) => (lv.id = i + 1));

  generateList(demonData);
  alert('삭제되었습니다.');
  renderDevHome();
}

function addClearInputRow() {
  const container = document.getElementById('f-clears-container');
  const div = document.createElement('div');
  div.className = 'clear-edit-row';
  div.style = 'display:flex; gap:3px;';
  div.innerHTML = `
    <input class="dev-input cl-p" placeholder="유저" style="flex:2">
    <input class="dev-input cl-v" placeholder="%" style="flex:1">
    <input class="dev-input cl-d" placeholder="날짜" style="flex:1.5">
    <button onclick="this.parentElement.remove()" style="background:#e74c3c; border:none; color:white; border-radius:4px; cursor:pointer; width:30px;">X</button>
  `;
  container.appendChild(div);
}

function exportJson() {
  const data = {
    levels: demonData,
    history: changeHistory,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = LEVEL_CONFIG.jsonUrl;
  a.click();

  URL.revokeObjectURL(url);
}

function renderGitHubConfig() {
  const isTokenFixed = !!LEVEL_CONFIG.ghToken;
  document.getElementById('devContent').innerHTML = `
    <h3>GitHub 연동 설정</h3>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <label class="dev-label">Repository Owner (고정)</label>
      <input class="dev-input" value="${githubConfig.owner}" readonly style="background:#222; color:#888;">
      
      <label class="dev-label">Repository Name (고정)</label>
      <input class="dev-input" value="${githubConfig.repo}" readonly style="background:#222; color:#888;">
      
      <label class="dev-label">File Path (고정)</label>
      <input class="dev-input" value="${githubConfig.path}" readonly style="background:#222; color:#888;">
      
      <label class="dev-label">Personal Access Token ${isTokenFixed ? '(고정됨)' : ''}</label>
      <input id="gh-token" class="dev-input" type="password" value="${githubConfig.token}" ${
        isTokenFixed
          ? 'readonly style="background:#222; color:#888;"'
          : 'placeholder="ghp_..."'
      }>
      
      ${
        !isTokenFixed
          ? '<button class="dev-btn dev-btn-save" onclick="saveGitHubConfig()">토큰 저장</button>'
          : ''
      }
      <button class="dev-btn" onclick="renderDevHome()">뒤로가기</button>
    </div>
  `;
}

function saveGitHubConfig() {
  if (!LEVEL_CONFIG.ghToken) {
    githubConfig.token = document.getElementById('gh-token').value.trim();
    localStorage.setItem('gh_token', githubConfig.token);
    alert('토큰이 저장되었습니다.');
  }
  renderDevHome();
}

async function saveToGitHub() {
  if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
    if (confirm('GitHub 설정이 필요합니다. 설정 화면으로 이동할까요?'))
      renderGitHubConfig();
    return;
  }

  const content = JSON.stringify(
    { levels: demonData, history: changeHistory },
    null,
    2,
  );
  const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`;

  try {
    let sha = null;
    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${githubConfig.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (getRes.ok) {
      const json = await getRes.json();
      sha = json.sha;
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update ${githubConfig.path} via Web`,
        content: btoa(unescape(encodeURIComponent(content))),
        sha: sha,
      }),
    });

    if (putRes.ok) alert('GitHub에 성공적으로 저장되었습니다!');
    else {
      const err = await putRes.json();
      alert(`저장 실패: ${err.message}`);
    }
  } catch (e) {
    alert(`오류 발생: ${e.message}`);
  }
}

function addHistory(type, levelTitle, detail) {
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;

  changeHistory.unshift({
    time: timeStr,
    type,
    title: levelTitle,
    detail,
  });
}

function renderHistory(targetTitle = null) {
  const list = document.getElementById('historyList');
  if (!list) return;

  list.innerHTML = '';

  if (targetTitle) {
    let bestRank = 999999;
    const currentLv = demonData.find((l) => l.title === targetTitle);
    if (currentLv) {
      bestRank = currentLv.id;
    }

    const specificHistory = changeHistory.filter(
      (h) => h.title === targetTitle,
    );
    specificHistory.forEach((h) => {
      const matches = h.detail.match(/(\d+)위/g);
      if (matches) {
        matches.forEach((m) => {
          const r = parseInt(m.replace('위', ''));
          if (!isNaN(r) && r < bestRank) bestRank = r;
        });
      }
    });

    if (bestRank !== 999999) {
      const bestRankDiv = document.createElement('div');
      bestRankDiv.style =
        'background: #333; color: #ffd700; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-family: Paperlogy7; border: 1px solid #ffd700;';
      bestRankDiv.innerHTML = `🏆 최고 순위 : ${bestRank}위`;
      list.appendChild(bestRankDiv);
    }
  }

  const displayData = targetTitle
    ? changeHistory.filter((h) => h.title === targetTitle)
    : changeHistory;

  displayData.forEach((h) => {
    let typeClass =
      h.type === 'add'
        ? 'add'
        : h.type === 'remove'
          ? 'remove'
          : h.type === 'reeval'
            ? 'reeval'
            : 'move';

    const item = document.createElement('div');
    item.className = `history-item ${typeClass}`;
    item.style =
      'display: flex; gap: 15px; padding: 10px; border-bottom: 1px solid #444; color: #eee;';
    item.innerHTML = `
      <div style="color: #aaa; min-width: 100px;">${h.time.split(' ')[0]}</div>
      <div style="flex: 1;"><b style="color: #fff;">${h.title}</b> ${h.detail}</div>
    `;
    list.appendChild(item);
  });
}

function toggleTagPanel() {
  const content = document.getElementById('tagContent');
  const btn = document.getElementById('tagToggleBtn');
  content.classList.toggle('collapsed');
  if (content.classList.contains('collapsed')) {
    btn.textContent = '펴기';
  } else {
    btn.textContent = '접기';
  }
}

function toggleHistoryPanel() {
  const wrapper = document.getElementById('historyContentWrapper');
  const btn = document.getElementById('historyToggleBtn');
  wrapper.classList.toggle('collapsed');
  if (wrapper.classList.contains('collapsed')) {
    btn.textContent = '펴기';
  } else {
    btn.textContent = '접기';
  }
}

function toggleMobilePanel(type, btn) {
  if (type === 'list') {
    document.getElementById('mobileListPanel').classList.toggle('show');
    btn.classList.toggle('active');
  } else if (type === 'clears') {
    document.getElementById('mobileClearsPanel').classList.toggle('show');
    btn.classList.toggle('active');
  }
}
