/* ===========================================================
   신청 폼 → 구글 시트 연결 (티칭코칭)
   -----------------------------------------------------------
   이 사이트의 모든 신청은 시트의 "과외" 탭으로 들어갑니다.
   (폼이 sheet=과외 값을 함께 전송 → Apps Script 가 해당 탭에 기록)

   ▶ 연결 방법
   1) 국제학교/와와와 같은 시트의 Apps Script 웹앱 URL 을 아래에 붙여넣기
      (https://script.google.com/macros/s/..../exec)
   2) 저장 → git push
   ※ 기존 Apps Script 가 e.parameter.sheet 로 탭을 고르지 않는다면,
     doPost 안에서 var sh = ss.getSheetByName(e.parameter.sheet || "과외");
     형태로 한 줄만 맞춰주면 됩니다.
   =========================================================== */

const SHEET_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

function _val(id){ const el = document.getElementById(id); return el ? String(el.value).trim() : ""; }

function _sendToSheet(payload){
  if(!SHEET_ENDPOINT || SHEET_ENDPOINT.indexOf("PASTE_") === 0){
    // 아직 시트 URL 미연결 → 데모 모드 (전송 없이 성공 표시)
    return Promise.resolve();
  }
  return fetch(SHEET_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(payload).toString()
  });
}

/* 폼 하나를 시트에 연결하는 공용 함수
   opts = { formId, okId, required:[id...], fields:{시트컬럼명: inputId} } */
function _wireForm(opts){
  const form = document.getElementById(opts.formId);
  if(!form) return;
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    // 필수값 검사
    for(const id of opts.required){
      if(!_val(id)){ alert("필수 항목을 모두 입력해 주세요."); const el=document.getElementById(id); if(el) el.focus(); return; }
    }
    const payload = { sheet: "과외", _form: opts.title, _page: location.pathname, _time: new Date().toLocaleString("ko-KR") };
    for(const col in opts.fields){ payload[col] = _val(opts.fields[col]); }

    const btn = form.querySelector('button[type="submit"], button');
    const orig = btn ? btn.textContent : "";
    if(btn){ btn.disabled = true; btn.textContent = "접수 중…"; }
    try{ await _sendToSheet(payload); }catch(_){ /* no-cors: 응답 못 읽어도 정상 */ }
    const ok = document.getElementById(opts.okId);
    if(ok) ok.style.display = "block";
    if(btn){ btn.textContent = "신청 완료 ✓"; }
  });
}

// 1) 홈 - 무료 상담 신청
_wireForm({
  formId: "applyForm", okId: "okMsg", title: "홈-상담신청",
  required: ["name","phone","grade","subject"],
  fields: { 이름:"name", 연락처:"phone", 학년:"grade", 분야:"subject", 남길말:"memo" }
});

// 2) 수업방식 - 무료 상담/체험 신청
_wireForm({
  formId: "trialForm", okId: "tOk", title: "수업방식-체험신청",
  required: ["t_name","t_phone","t_target","t_type","t_subject"],
  fields: { 이름:"t_name", 연락처:"t_phone", 대상:"t_target", 수업종류:"t_type",
            과목학교학년:"t_subject", 선생님성별:"t_gender", 수업방식:"t_mode", 수업스타일:"t_style" }
});

// 3) 방문/화상 - 무료 30분 화상 수업 신청
_wireForm({
  formId: "onlineForm", okId: "oOk", title: "화상-무료수업신청",
  required: ["o_school","o_subject","o_phone"],
  fields: { 학교학년:"o_school", 과목:"o_subject", 선생님성별:"o_gender",
            수업스타일:"o_style", 연락처:"o_phone" }
});
