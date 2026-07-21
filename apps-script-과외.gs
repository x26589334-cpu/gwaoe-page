/* =========================================================================
   티칭코칭(과외) 신청 → 구글 시트 "과외" 탭 저장용 Apps Script
   -------------------------------------------------------------------------
   ▶ 붙여넣는 법 (국제학교/와와 스크립트는 건드리지 않습니다)
   1) "과외" 탭이 들어있는 그 구글 시트를 연다
   2) 상단 메뉴 [확장 프로그램] → [Apps Script]  클릭
   3) 새 프로젝트가 열리면, 기존 코드 다 지우고 아래 전체를 붙여넣기
      (이미 다른 코드가 있으면, 이 doPost 를 새 파일로 추가해도 됨)
   4) 저장(💾) → [배포] → [새 배포] → 유형: 웹 앱
        - 설명: 과외
        - 실행 계정: 나
        - 액세스 권한: 모든 사용자
      → 배포 → 나오는 "웹 앱 URL"(.../exec) 복사해서 알려주기
   5) 그 URL 을 form.js 의 SHEET_ENDPOINT 에 넣으면 끝 (이건 제가 처리)
   ========================================================================= */

var SHEET_NAME = "과외"; // 저장할 탭 이름

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) sh = ss.insertSheet(SHEET_NAME); // 탭이 없으면 생성

    var params = (e && e.parameter) ? e.parameter : {};

    // 내부용 키(_로 시작, sheet)는 컬럼에서 제외하되 접수시각/구분은 따로 기록
    var when = params._time || new Date().toLocaleString("ko-KR");
    var kind = params._form || "";

    // 첫 행(헤더)이 비어 있으면 헤더 자동 생성
    var lastCol = sh.getLastColumn();
    var headers;
    if (sh.getLastRow() === 0) {
      headers = ["접수시각", "구분"];
      for (var k in params) {
        if (k.charAt(0) === "_" || k === "sheet") continue;
        headers.push(k);
      }
      sh.appendRow(headers);
    } else {
      headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      // 새로 들어온 키가 헤더에 없으면 헤더 끝에 추가
      for (var k2 in params) {
        if (k2.charAt(0) === "_" || k2 === "sheet") continue;
        if (headers.indexOf(k2) === -1) {
          headers.push(k2);
          sh.getRange(1, headers.length).setValue(k2);
        }
      }
    }

    // 헤더 순서에 맞춰 한 행 구성
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      if (h === "접수시각") row.push(when);
      else if (h === "구분") row.push(kind);
      else row.push(params[h] != null ? params[h] : "");
    }
    sh.appendRow(row);

    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("error: " + err);
  }
}
