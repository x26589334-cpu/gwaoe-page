$ErrorActionPreference='Stop'
# rss.xml 생성 — 블로그 글 + 선생님 추천 글을 날짜 내림차순으로 최대 100건.
# 데일리 글을 올린 뒤 매번 실행한다 (재실행 안전).
$repo = "$HOME\gwaoe-page"
$enc  = New-Object System.Text.UTF8Encoding $false
$BASE = 'https://perfectedu.co.kr'
$MAX  = 100

function X($s) { return ("$s" -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;') }

$items = New-Object System.Collections.ArrayList
foreach ($f in Get-ChildItem "$repo\*.html") {
  if ($f.Name -in @('blog.html','teacher-pick.html','news.html','index.html')) { continue }
  $t = [System.IO.File]::ReadAllText($f.FullName)
  $crumb = [regex]::Match($t, '<div class="crumb">(.*?)</div>').Groups[1].Value
  if ($crumb -match '선생님 추천') { $cat = '선생님 추천' }
  elseif ($crumb -match '블로그') { $cat = '블로그' }
  else { continue }
  $dm = [regex]::Match($t, '<p>(\d{4})\.(\d{2})\.(\d{2})')
  if (-not $dm.Success) { continue }
  $date = Get-Date -Year ([int]$dm.Groups[1].Value) -Month ([int]$dm.Groups[2].Value) -Day ([int]$dm.Groups[3].Value) -Hour 10 -Minute 0 -Second 0
  $title = ([regex]::Match($t, '<title>([^<]*)</title>')).Groups[1].Value -replace '\s*·\s*티칭코칭\s*$',''
  $desc  = ([regex]::Match($t, '<meta name="description" content="([^"]*)"')).Groups[1].Value
  $img   = ([regex]::Match($t, '<meta property="og:image" content="([^"]*)"')).Groups[1].Value
  [void]$items.Add([pscustomobject]@{ file=$f.Name; cat=$cat; date=$date; title=$title; desc=$desc; img=$img })
}
$items = @($items | Sort-Object @{e='date';Descending=$true}, @{e='file';Descending=$false} | Select-Object -First $MAX)
if ($items.Count -eq 0) { throw '수집된 글이 없습니다' }

function Rfc822($d) { return $d.ToString('ddd, dd MMM yyyy HH:mm:ss', [Globalization.CultureInfo]::InvariantCulture) + ' +0900' }

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">')
[void]$sb.AppendLine('<channel>')
[void]$sb.AppendLine('  <title>티칭코칭 — 학교별 과외 전략 · 동네별 선생님 추천</title>')
[void]$sb.AppendLine("  <link>$BASE/</link>")
[void]$sb.AppendLine('  <description>초·중·고 학교별 내신·과외 전략 글과 동네별 방문 과외 선생님 추천을 매일 올립니다.</description>')
[void]$sb.AppendLine('  <language>ko</language>')
[void]$sb.AppendLine("  <lastBuildDate>$(Rfc822 $items[0].date)</lastBuildDate>")
[void]$sb.AppendLine("  <atom:link href=`"$BASE/rss.xml`" rel=`"self`" type=`"application/rss+xml`" />")
[void]$sb.AppendLine("  <image><url>$BASE/apple-touch-icon.png</url><title>티칭코칭</title><link>$BASE/</link></image>")
foreach ($it in $items) {
  $url = "$BASE/$($it.file)"
  [void]$sb.AppendLine('  <item>')
  [void]$sb.AppendLine("    <title>$(X $it.title)</title>")
  [void]$sb.AppendLine("    <link>$url</link>")
  [void]$sb.AppendLine("    <guid isPermaLink=`"true`">$url</guid>")
  [void]$sb.AppendLine("    <pubDate>$(Rfc822 $it.date)</pubDate>")
  [void]$sb.AppendLine("    <category>$(X $it.cat)</category>")
  [void]$sb.AppendLine("    <description><![CDATA[$($it.desc)]]></description>")
  if ($it.img) { [void]$sb.AppendLine("    <enclosure url=`"$(X $it.img)`" type=`"image/jpeg`" length=`"0`" />") }
  [void]$sb.AppendLine('  </item>')
}
[void]$sb.AppendLine('</channel>')
[void]$sb.AppendLine('</rss>')
[System.IO.File]::WriteAllText("$repo\rss.xml", $sb.ToString(), $enc)

$byCat = $items | Group-Object cat | ForEach-Object { "$($_.Name) $($_.Count)" }
Write-Output "rss.xml: $($items.Count)건 ($($byCat -join ', ')) / 최신 $($items[0].date.ToString('yyyy-MM-dd')) $($items[0].title)"
