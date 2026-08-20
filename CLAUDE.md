# 티칭코칭 과외 사이트 — 프로젝트 안내 (이어서 작업용)

## 개요
- 지역·학교별 1:1 과외 홍보 사이트 (정적 사이트, GitHub Pages)
- **라이브 주소:** https://perfectedu.co.kr
- **GitHub 저장소:** https://github.com/x26589334-cpu/gwaoe-page  (기본 브랜치: **master**)
- **상담 전화:** 010-6832-1994

## 배포 방법 (수정 → 반영)
```
git add .
git commit -m "메시지"
git push
```
→ 1~2분 후 라이브 반영. 캐시로 안 보이면 Ctrl+Shift+R.

## 파일 구조
- `index.html` — 홈
- `schools.html` — 학교 검색 (탭: 전체/초/중/고). 검색은 띄어쓰기 다중 단어 지원("강남 휘문고"). 결과 300개 제한.
- `schools-data.js` — 학교 데이터 `window.SCHOOLS=[{n,r,t}]` (t="초"/"중"/"고", 전용글 있으면 `p`)
- `school.html` — 학교 상세(동적, ?name=&region=&type=). 초/중/고별 내용 자동 생성 + canonical/JSON-LD 주입.
- `visit-online.html` — 방문/화상. 방문=간편검색+단계선택(시도→구→동, 뒤로가기), 화상=사례영상+서술형 신청폼.
- `teachers.html` — 선생님 찾기 (검색 + 필터: 수업형태/과목/방문지역/성별, 24명씩 페이지네이션)
- `teachers-data.js` — 선생님 목록 데이터 `window.TEACHERS=[{i,n,g,c,s,gr,r,sd}]` (i=publicId, n=마스킹이름, c=수업형태, s=과목, gr=학년, r=방문지역, sd=시도)
- `teacher-{publicId}.html` — 선생님 개별 페이지 **707개** (와와 코치 데이터 기반, 2026-08-20 생성)
- `style.css` 공용 스타일 / `script.js` 공용 스크립트 / `form.js`(있으면 폼)
  - ⚠️ **style.css 수정 시 전 페이지의 `style.css?v=` 숫자를 올려야 반영됨** (현재 v3)
- `sitemap.xml`(주요 페이지) + `sitemap-schools.xml`(학교 12,084개) / `robots.txt` / `CNAME`(perfectedu.co.kr)

## 오늘까지 한 일 (2026-06-29, 집 PC)
- **전국 학교 데이터 전부 추가** → `schools-data.js` 총 **12,105개** (초 6,337 / 중 3,350 / 고 2,418). 17개 시·도 초·중·고 전부. (NEIS 공공데이터 API로 수집, 기존 큐레이션·전용페이지 21곳은 유지·중복제외)
- **schools.html 검색 개선:** 지역+학교 띄어쓰기 다중 단어, 결과 300개 제한(속도)
- **visit-online.html:** 방문 지역선택을 한 단계씩 표시+뒤로가기 / 방문 **간편검색** 추가 / 화상수업 신청폼의 "수업 스타일"을 서술형으로 / 화상 신청폼 위에 사례영상(유튜브 embed, ※ 상상코칭 타사 영상 — 추후 자체영상으로 교체 권장)
- **SEO:** `sitemap-schools.xml`(학교 12,084 URL) 생성, robots.txt에 등록, school.html에 canonical+구조화데이터 주입

## ⚠️ 중요 규칙
- **학교 데이터(schools-data.js)를 바꾸면 `sitemap-schools.xml`도 다시 생성**해야 함. (정규식으로 {n,r,t} 파싱, `p` 있는 항목은 제외. 지역 라벨: 광역시/세종=short+동/구, 도=short+시(접미사제거)+구. 시도short: 서울/경기/인천/부산/대구/광주/대전/울산/세종/강원/충북/충남/전북/전남/경북/경남/제주)
- 학교 추가/다른지역 갱신엔 **NEIS 인증키 필요**(없으면 5개만 응답). 키는 보안상 깃허브에 안 올림 — NEIS(open.neis.go.kr) 마이페이지에서 확인하거나 채팅으로 전달.
- NEIS 시도명 주의: 전북="전북특별자치도", 강원="강원특별자치도", 제주="제주특별자치도", 세종="세종특별자치시".

## 선생님 707명 데이터 (2026-08-20 추가)
- 원본: 와와 사내 코치 관리 웹앱에서 추출 (`바탕화면/코치상세.json`, 707건). **티칭코칭과 와와는 같은 회사**이며 과외 전문은 티칭코칭.
- 이름은 **가운데 글자 ㅇ 마스킹** (박인옥 → 박ㅇ옥). 사진은 사용하지 않음(이니셜 원형으로 대체).
- **공개 제외 필드**(내부 관리용): 신뢰도·순위·팀장·운용조·소속지점·관리회원수·추가타임·최고매니저 등
- **소개/경력 정제 규칙**: 내부 조직 태그(타겟N조·운영N조), 내부 용어(테콜→연락, 회차보고서→수업 리포트), 외모 언급, 검증 불가 성과 주장(N점 상승·대학 합격·100%·다수 배출) 제거. 검정고시 지도 안내는 유지.
- **방문 선생님(219명)**: 소개글에 학교명이 있으면 그 학교(18명), 없으면 방문 가능 지역의 학교 전부 부여(201명, 평균 91곳). 학교는 `school.html?name=&region=&type=` 로 링크.
- 재생성 스크립트는 세션 scratchpad의 `prep2.ps1`(정제) + `gen_teachers.ps1`(생성). **PowerShell 5.1은 BOM 없는 .ps1을 CP949로 읽어 한글이 깨지므로 실행 전 UTF-8 BOM 추가 필요.**

## 다음에 할 후보
- 구글 서치콘솔 / 네이버 서치어드바이저에 `sitemap-schools.xml` 제출 (색인 가속)
- 화상수업 사례영상을 자체 영상으로 교체
- reviews.html 실제 후기, teachers.html 등 콘텐츠 보강

## 다른 PC(회사)에서 이어서 하기
1. git 설치 (https://git-scm.com)
2. `git clone https://github.com/x26589334-cpu/gwaoe-page.git`
3. 그 폴더에서 Claude Code 실행 → "이 과외 사이트(perfectedu) 이어서 작업해줘"
4. 수정 후 `git add . && git commit -m "..." && git push`
