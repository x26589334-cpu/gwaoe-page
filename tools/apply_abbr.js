/* 학교 페이지에 약칭 넣기 + 학교 × 과목 페이지 만들기 (2026-10-04, 사용자 결정)
   실행: ELECTRON_RUN_AS_NODE=1 Code.exe tools/apply_abbr.js   (저장소 루트에서. 여러 번 돌려도 같은 결과)
   왜: 사람들은 "단대부고 과외" 로 검색하지 "단국대학교사범대학부속고등학교 과외" 로 검색하지 않는다.
       학교 페이지 2,130장에 약칭이 한 번도 없어서 약칭 검색에 아예 안 잡혔다.
   하는 일
     1) school-{정식명}-{지역}.html : 주소는 그대로. 제목·설명·큰 제목·본문 첫 줄에 약칭을 앞세우고(정식 명칭은 함께), 과목 페이지 링크 5개 추가
     2) school-{약칭}-{지역}-{과목}과외.html 신설 (국어·영어·수학·사회·과학). 본문은 tools/subjects.js — 과목·학교급마다 다르다
     3) sitemap-schools.xml 에 과목 페이지 추가
   ※ 학교 페이지를 만드는 원래 생성기는 저장소에 없다(세션 밖에 있었음). 새 학교 페이지를 만들면 이 도구를 다시 돌릴 것.
   ※ 학교별 시험 범위·출제 경향은 쓰지 않는다(지어내기 금지). */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://perfectedu.co.kr';
const { SUBJ, subjectsFor, C } = require('./subjects');
const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const enc = s => encodeURIComponent(s);
const MARK = '<!-- abbr:v1 -->';
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

/* 약칭 규칙 — 사이트관리/도구/지역과외/lib.js 의 shortName 과 같게 유지할 것 */
const UNIV = { '단국': '단대', '고려': '고대', '중앙': '중대', '한양': '한대', '홍익': '홍대', '건국': '건대', '동국': '동대', '상명': '상명',
  '서울': '서울사대', '강원': '강원사대', '전남': '전남사대', '전북': '전북사대', '전주': '전주사대', '경북': '경북사대', '충북': '충북사대', '충남': '충남사대',
  '공주': '공주사대', '부산': '부산사대', '경상': '경상사대', '제주': '제주사대' };
const FIX = { '단국대학교부속소프트웨어고등학교': '단국대소프트웨어고', '이화여자대학교병설미디어고등학교': '이대병설미디어고',
  '상명대학교사범대학부속여자고등학교': '상명부속여고', '상명대학교사범대학부속여자중학교': '상명부속여중' };
function shortName(n) {
  if (FIX[n]) return FIX[n];
  const m = n.match(/^(.+?)대학교사범대학(?:부속|부설)(.*?)(여자)?(초등학교|중학교|고등학교)$/);
  if (m) { const l = m[4] === '고등학교' ? '고' : m[4] === '중학교' ? '중' : '초';
    return m[2] ? m[2] + (m[3] ? '여' : '') + l : (UNIV[m[1]] || m[1]) + '부' + (m[3] ? '여' : '') + l; }
  return n.replace(/여자상업고등학교$/, '여상').replace(/여자고등학교$/, '여고').replace(/여자중학교$/, '여중')
    .replace(/외국어고등학교$/, '외고').replace(/공업고등학교$/, '공고').replace(/상업고등학교$/, '상고')
    .replace(/예술고등학교$/, '예고').replace(/체육고등학교$/, '체고')
    .replace(/초등학교$/, '초').replace(/중학교$/, '중').replace(/고등학교$/, '고');
}
const levelOf = n => /초등학교$/.test(n) ? '초' : /중학교$/.test(n) ? '중' : /고등학교$/.test(n) ? '고' : '';
const LEVEL = { '초': '초등학교', '중': '중학교', '고': '고등학교' };
const GORD = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
const covers = (range, lv) => { const m = String(range).match(/(초|중|고)(\d)\s*~\s*(초|중|고)(\d)/); if (!m) return String(range).includes(lv);
  const a = GORD.indexOf(m[1] + m[2]), b = GORD.indexOf(m[3] + m[4]), lo = GORD.indexOf(lv + '1'), hi = GORD.indexOf(lv === '초' ? '초6' : lv + '3'); return a <= hi && b >= lo; };
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return w + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0) ? a : b); };
const rep = (s, from, to) => s.split(from).join(to);

const files = fs.readdirSync(ROOT).filter(f => /^school-.+-[^-]+\.html$/.test(f) && !/과외\.html$/.test(f));
let patched = 0, already = 0, skipped = 0, made = 0; const subjUrls = []; const usedNames = new Set();

for (const f of files) {
  const m = f.match(/^school-(.+)-([^-]+)\.html$/); const N = m[1], R = m[2];
  const lv = levelOf(N); if (!lv) { skipped++; continue; }          // 정식 명칭이 아닌 옛 항목(단국대사대부고 등)은 건드리지 않는다
  const sn = shortName(N); if (sn === N) { skipped++; continue; }
  const p = path.join(ROOT, f); let h = fs.readFileSync(p, 'utf8');
  const rm = h.match(/<p>([^<·]+?) · (초등학교|중학교|고등학교) · /); const area = rm ? rm[1].trim() : R;   // "서울 강남구"
  const subs = subjectsFor(lv);
  const subjFile = sub => `school-${sn}-${R}-${sub}과외`;

  /* 1) 학교 페이지 */
  if (!h.includes(MARK)) {
    /* 제목 틀이 두 가지다: "N 과외 · 지역 1:1 맞춤 수업"(방문 지역) / "N 과외 — 지역 화상 1:1 맞춤 수업"(화상 전용 지역) */
    const newTitle = `${sn} 과외 · ${N} 내신·시험대비 1:1 | ${area}`;
    const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tRe = new RegExp('(<title>|<meta property="og:title" content=")' + reEsc(N) + ' 과외 [·—] [^<"]*?1:1 (?:맞춤 )?수업', 'g');
    /* 제목이 이 틀이 아닌 페이지(CTR 실험으로 제목을 따로 지은 곳 등)는 제목을 그대로 두고 본문만 고친다 */
    if (h.search(tRe) >= 0) h = h.replace(tRe, (x, a) => a + esc(newTitle));
    h = h.replace(/(<meta (?:name="description"|property="og:description") content=")/g, (x, a) => `${a}${sn}(${N}) 과외. `);
    h = h.replace(/(<meta name="keywords" content=")/, (x, a) => `${a}${sn} 과외, ${sn} 수학과외, ${sn} 영어과외, ${sn} 국어과외, ${sn} 내신, `);
    h = rep(h, `› ${N}</div>`, `› ${sn}</div>`);
    h = rep(h, `<h1>${N} 1:1 맞춤 과외</h1>`, `<h1>${sn} 과외 — ${N} 1:1 맞춤 수업</h1>`);
    h = rep(h, `<strong>${N} 학부모님께 드리는 안내입니다.</strong>`, `<strong>${sn}(${N}) 학부모님께 드리는 안내입니다.</strong>`);
    h = rep(h, `<h2>${N} 과외, 이렇게 준비합니다</h2>`, `<h2>${sn} 과외, 이렇게 준비합니다</h2>`);
    const links = subs.map(sub => `        <a class="sc" href="${enc(subjFile(sub))}.html">${SUBJ[sub].icon} ${esc(sn)} ${sub}과외</a>`).join('\n');
    const block = `      ${MARK}\n      <h2>${esc(sn)} 과목별 과외</h2>\n      <div class="schoolbox">\n${links}\n      </div>\n`;
    const i = h.search(/^[ \t]*<div class="hl-box">/m);              // 틀에 따라 들여쓰기가 다르다
    if (i < 0) { skipped++; continue; }
    h = h.slice(0, i) + block + h.slice(i);
    fs.writeFileSync(p, h, 'utf8'); patched++;
  } else already++;

  /* 2) 과목 페이지 — 틀(머리말·메뉴·하단)은 학교 페이지에서 가져온다 */
  const heroAt = h.indexOf('<section class="page-hero">'), footAt = h.indexOf('<footer>');
  if (heroAt < 0 || footAt < 0) continue;
  /* 이 학교 페이지에 실린 선생님 카드(그 지역 방문 가능 선생님) 중 과목·학교급이 맞는 사람 */
  const onlineOnly = /화상 수업으로 진행합니다/.test(h) && !/class="tgrid"/.test(h);
  const cards = (h.match(/<a class="tc" href="teacher-[\s\S]*?<\/a>/g) || []);
  for (const sub of subs) {
    const K = C[sub], file = subjFile(sub);
    if (usedNames.has(file)) continue; usedNames.add(file);
    const url = `${SITE}/${enc(file)}.html`;
    const title = `${sn} ${sub}과외 · ${N} ${sub} 내신·시험 대비 1:1 | ${area}`;
    const desc = `${sn}(${N}) ${sub}과외. ${area} ${sn} 학생의 ${sub} 중간고사·기말고사·수행평가·서술형을 ${onlineOnly ? '화상 수업' : '방문 수업과 화상 수업'}으로 1:1 준비합니다.`;
    const mine = cards.filter(c => (c.match(/<span class="chip">([^<]*)<\/span>/g) || []).some(ch => { const t = ch.replace(/<[^>]*>/g, ''); return t.startsWith(sub + ' ') && covers(t, lv); })).slice(0, 4);
    const faq = [...K.faq,
      [`${sn} 학생만 신청할 수 있나요?`, `아닙니다. 이 페이지는 ${N} 학생이 찾기 쉽게 만든 안내이고, ${area}의 다른 학교 학생도 같은 방식으로 수업합니다.`],
      onlineOnly ? ['방문 수업도 가능한가요?', `${josa(area, '은', '는')} 화상 수업을 기본으로 합니다. 방문 수업을 원하시면 상담 때 가능한 선생님이 있는지 확인해 드립니다.`]
                 : ['방문 수업과 화상 수업 중 무엇이 맞나요?', '집중이 어려운 학생은 방문 수업이, 이동 시간을 줄이고 선생님 선택 폭을 넓히고 싶으면 화상 수업이 맞습니다. 방문 가능 여부는 동네와 시간대에 따라 달라 상담 때 확인해 드립니다.'],
      ['상담은 무료인가요?', '네. 학년과 과목, 지금 어려운 부분을 알려 주시면 맞는 선생님을 추천해 드립니다. 전화 010-6832-1994.']];
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: '관리중인 학교', item: SITE + '/schools.html' },
        { '@type': 'ListItem', position: 3, name: `${sn} 과외`, item: `${SITE}/${enc(f)}` },
        { '@type': 'ListItem', position: 4, name: `${sn} ${sub}과외`, item: url }] },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, x]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: x } })) }] };
    const head = h.slice(0, heroAt)
      .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)} · 티칭코칭</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, (x, a) => a + esc(desc))
      .replace(/(<meta name="keywords" content=")[^"]*/, (x, a) => a + esc(`${sn} ${sub}과외, ${N} ${sub}과외, ${sn} ${sub} 내신, ${sn} ${sub} 시험대비, ${area} ${sub}과외, ${sn} 과외, 티칭코칭`))
      .replace(/(<link rel="canonical" href=")[^"]*/, (x, a) => a + url)
      .replace(/(<meta property="og:title" content=")[^"]*/, (x, a) => a + esc(title))
      .replace(/(<meta property="og:description" content=")[^"]*/, (x, a) => a + esc(desc))
      .replace(/(<meta property="og:url" content=")[^"]*/, (x, a) => a + url)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
    const others = subs.filter(x => x !== sub).map(x => `        <a class="sc" href="${enc(subjFile(x))}.html">${SUBJ[x].icon} ${esc(sn)} ${x}과외</a>`).join('\n');
    const teacherHtml = mine.length ? `
<section style="background:var(--bg-soft)">
  <div class="wrap">
    <div class="center">
      <h2 class="title">${esc(sn)} ${sub}과외 선생님</h2>
      <p class="lead">${esc(area)} 지역으로 방문할 수 있는 선생님 가운데 ${LEVEL[lv]} ${josa(sub, '을', '를')} 가르치는 분들입니다. 화상 수업은 전국 어디서나 가능합니다.</p>
    </div>
    <div class="tgrid">
      ${mine.join('\n      ')}
    </div>
  </div>
</section>` : '';
    const body = `<section class="page-hero">
  <div class="wrap">
    <div class="crumb"><a href="index.html">홈</a> › <a href="schools.html">관리중인 학교</a> › <a href="${enc(f)}">${esc(sn)}</a> › ${sub}</div>
    <h1>${esc(sn)} ${sub}과외</h1>
    <p>${esc(area)} · ${esc(N)} · ${sub} 내신과 수행평가를 1:1로 준비합니다</p>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="article">
      <p><strong>${esc(sn)}(${esc(N)}) ${sub}과외 안내입니다.</strong> ${esc(K.lead[lv](sn))}</p>
      <h2>${esc(sn)} ${sub}, 학년별로 이렇게 봅니다</h2>
      <ul>
${K.grades[lv].map(([g, t]) => `        <li><strong>${g}</strong> — ${esc(t)}</li>`).join('\n')}
      </ul>
      <h2>${esc(sn)} ${sub} 내신 대비</h2>
      <p>${esc(sn)} ${sub} 시험은 학교 수업에서 다룬 내용이 중심입니다. 시험 범위와 출제 방식은 학교와 학년마다 달라, 첫 수업에서 지난 시험지와 교과서·프린트를 함께 보고 계획을 세웁니다.</p>
      <ul>
${K.exam.map(x => { const [a, b] = x.split(' — '); return `        <li><strong>${esc(a)}</strong>${b ? ' — ' + esc(b) : ''}</li>`; }).join('\n')}
      </ul>
      <h2>${esc(sn)} ${sub} 수행평가·서술형</h2>
      <p>${esc(K.perf)}</p>
      <h2>학원 대신 ${sub} 1:1 과외를 고르는 이유</h2>
      <p>${esc(K.why)}</p>
      <div class="hl-box">💡 <strong>티칭코칭</strong>은 ${esc(area)} ${esc(sn)} 학생에게 맞춘 ${sub} 1:1 ${onlineOnly ? '화상' : '방문·화상'} 수업을 제공합니다. 상담은 무료입니다.</div>
    </div>
  </div>
</section>${teacherHtml}
<section>
  <div class="wrap article">
      <h2>${esc(sn)} 다른 과목도 함께 준비하세요</h2>
      <div class="schoolbox">
${others}
        <a class="sc" href="${enc(f)}">🏫 ${esc(sn)} 과외 전체 안내</a>
      </div>
      <h2>자주 묻는 질문</h2>
${faq.map(([q, x]) => `      <h3>${esc(q)}</h3>\n      <p>${esc(x)}</p>`).join('\n')}
  </div>
</section>
<section style="background:var(--bg-soft)">
  <div class="wrap center">
    <h2 class="title">${esc(sn)} ${sub}과외, 무료 상담부터 시작하세요</h2>
    <p class="lead center">학년과 지금 어려운 부분만 알려주시면 24시간 안에 맞는 ${sub} 선생님을 추천해 드립니다.</p>
    <div class="hero-cta" style="justify-content:center;margin-top:24px">
      <a href="tel:01068321994" class="btn btn-primary">📞 010-6832-1994 상담신청</a>
      <a href="process.html#trial" class="btn btn-ghost">무료 체험 신청하기</a>
    </div>
  </div>
</section>
`;
    fs.writeFileSync(path.join(ROOT, file + '.html'), head + body + h.slice(footAt), 'utf8');
    subjUrls.push(url); made++;
  }
}

/* 3) sitemap-schools.xml — 과목 페이지 줄을 다시 만든다(기존 학교 줄은 그대로) */
const smPath = path.join(ROOT, 'sitemap-schools.xml');
let sm = fs.readFileSync(smPath, 'utf8');
sm = sm.split('\n').filter(l => !/%EA%B3%BC%EC%99%B8\.html<\/loc>/.test(l)).join('\n');   // …과외.html 로 끝나는 예전 과목 줄 제거
const add = subjUrls.map(u => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`).join('\n');
sm = sm.replace(/\n?<\/urlset>\s*$/, '\n' + add + '\n</urlset>\n');
fs.writeFileSync(smPath, sm, 'utf8');

console.log(`학교 페이지: 수정 ${patched} · 이미 적용 ${already} · 건너뜀 ${skipped} / 과목 페이지 ${made}장 / sitemap-schools ${(sm.match(/<loc>/g) || []).length} URL`);
