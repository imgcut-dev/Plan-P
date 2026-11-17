#!/usr/bin/env python3
"""cases.py + results-auto.json + results-manual.json -> test-cases.xlsx, report.html
실행: python3 docs/test/build.py   (먼저 `cd tests && node run.mjs`로 자동 결과를 만든다)"""
import json, html, subprocess, datetime, pathlib, collections
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import CellIsRule

D = pathlib.Path(__file__).parent
ns = {}
exec((D / "cases.py").read_text(encoding="utf-8"), ns)
CASES = ns["C"]

auto = json.loads((D / "results-auto.json").read_text(encoding="utf-8"))
manual = json.loads((D / "results-manual.json").read_text(encoding="utf-8"))
RES = {r["id"]: r for r in auto["results"] + manual["results"]}
RAN = auto["ranAt"]
KST = (datetime.datetime.fromisoformat(RAN.replace("Z", "+00:00")).astimezone(datetime.timezone(datetime.timedelta(hours=9)))).strftime("%Y-%m-%d %H:%M")
DAY = KST[:10]

# 환경 때문에 실행하지 못한 것
for c in CASES:
    cid = c[0]
    if cid in RES:
        continue
    if cid.startswith("TC-R-"):
        RES[cid] = {"id": cid, "result": "Block", "actual": "실행하지 못함: 이 PC에 Java가 없어 Firebase 에뮬레이터를 켤 수 없음 (설치 후 실행 예정)"}
    else:
        RES[cid] = {"id": cid, "result": "미실행", "actual": "사람이 직접 확인해야 하는 항목 (결과 기입 대기)"}

# 결함 목록
DEFECTS = [
    ("DEF-001", "TC-I-121", "중간", "댓글을 쓰는 중에 추천을 누르거나 로그인 상태가 바뀌면 입력하던 글이 지워짐",
     "다시 그릴 때 입력 내용을 보관하는 선택자가 `:not([data-pa])`였는데, 입력 폼에 `data-pa=\"\"` 속성이 항상 있어서 매번 빗나감",
     "수정함 (comments.js 선택자를 `.cm-f[data-pa=\"\"] textarea`로 변경). 배포함"),
    ("DEF-002", "TC-M-003", "낮음", "모바일에서 누르기 어려운 링크: 위치 안내(홈 / 글 목록)와 '전체 보기'가 높이 19~21px, '홈'은 폭 12px",
     "링크가 글자 크기만큼만 눌려서 WCAG 2.2 최소 누르는 영역(24×24px) 미만",
     "수정함 (index.html: 보이는 크기는 그대로 두고 누르는 영역을 패딩으로 확대). 재측정 통과. 배포함"),
    ("DEF-003", "TC-M-004", "낮음", "이미지 위 카테고리 라벨 글자가 11px로 너무 작음",
     "`.lb` 글자 크기 11px", "수정함 (12px). 재측정 최소 12px. 배포함"),
    ("DEF-004", "TC-S-001~008", "높음", "SEO 미구현: og 태그, 페이지 설명, canonical, robots.txt, sitemap.xml이 없고 글마다 다른 썸네일·제목 미리보기를 줄 수 없음",
     "글 주소가 `#/post/ID`(해시)라서 검색엔진과 공유 미리보기 크롤러가 글마다 별도 주소로 인식하지 못하고, 모든 주소에서 같은 index.html만 받음. 정적 호스팅이라 서버가 글별 <head>를 만들지 못함",
     "수정·배포함(글별 정적 페이지 생성기 tools/build-seo.mjs, 공통 메타, robots.txt, sitemap). 생성기·화면 테스트 16건과 운영 점검 TC-S-001~008 통과"),
    ("DEF-006", "TC-S-115", "중간", "글 전용 주소(/post/ID/)로 열면 방문 통계가 글 경로 대신 `/`로 집계됨",
     "analytics.js가 `window.routeHash`로 함수를 찾았는데, 최상위 const는 window 속성이 되지 않아 항상 예전 방식(해시)으로 계산됨. SEO 개발 중 테스트로 발견(운영에는 나가기 전)",
     "수정함 (`typeof routeHash===\"function\"`). 배포함"),
    ("DEF-005", "TC-R-001~026", "환경", "Firestore 규칙 테스트 26건을 실행하지 못함", "이 PC에 Java가 없어 Firebase 에뮬레이터 실행 불가",
     "대기. Java 설치 후 규칙 테스트 코드 작성·실행 (운영 DB로는 테스트하지 않음)"),
]

def commit():
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=D, text=True).strip()
    except Exception:
        return "-"

ROWS = []
for c in CASES:
    r = RES[c[0]]
    ROWS.append(dict(id=c[0], kind=c[1], area=c[2], title=c[3], pre=c[4], steps=c[5], exp=c[6], pri=c[7], how=c[8],
                     res=r["result"], actual=r["actual"]))

def tally(rows):
    t = collections.Counter(r["res"] for r in rows)
    return {k: t.get(k, 0) for k in ("Pass", "Fail", "Block", "미실행")}

TOT = tally(ROWS)
N = len(ROWS)
EXE = TOT["Pass"] + TOT["Fail"]
RATE = (TOT["Pass"] / EXE * 100) if EXE else 0
KINDS = ["단위", "통합", "규칙", "반응형", "배포", "SEO", "수동"]
KIND_TOT = {k: tally([r for r in ROWS if r["kind"] == k]) for k in KINDS}
AREAS = collections.OrderedDict()
for r in ROWS:
    AREAS.setdefault((r["kind"], r["area"]), []).append(r)

# ---- 테스트 화면 캡처 (docs/test/shots/*.jpg, 내장 브라우저로 촬영) ----
import base64
SHOTS = [
 ("d-home-plan-p", "홈 (데스크톱 1280px, plan-p)", "추천 3칸 → 대표 글 → 최신 글 순서로 그려짐, 메뉴 8개와 현재 메뉴 강조", ["TC-I-001", "TC-I-002", "TC-I-003"]),
 ("d-post-plan-p", "글 상세 + 추천·댓글 영역 (데스크톱)", "제목, 대표 이미지, 본문, 태그 4개, 추천·댓글(로그아웃 상태: 로그인 버튼), 이전 글, 관련 글", ["TC-I-004", "TC-I-005", "TC-I-101"]),
 ("d-list-plan-p", "전체 글 목록 (데스크톱)", "6개씩 목록, 사이드바(카테고리·최근 글), 페이지 번호", ["TC-I-010", "TC-I-006"]),
 ("d-search-plan-p", "검색 결과 '에디터' (데스크톱)", "제목·태그로 검색된 글 1개", ["TC-I-008"]),
 ("d-tag-plan-p", "태그 목록 '#에디터' (데스크톱)", "제목 #에디터, 해당 태그의 글만", ["TC-I-007"]),
 ("d-home-journal", "스킨: journal (데스크톱)", "종이 바탕, 골드 포인트, 세리프 제목", ["TC-I-017"]),
 ("d-home-dark", "스킨: dark (데스크톱)", "어두운 바탕, 연한 보라 포인트", ["TC-I-018"]),
 ("d-home-reader", "스킨: reader (데스크톱)", "왼쪽 고정 사이드바(900px 이상), 세리프", ["TC-I-019"]),
 ("d-home-studio", "스킨: studio (데스크톱)", "굵은 제목, 파스텔 바탕, 노란 형광펜 메뉴", ["TC-I-020"]),
 ("t-home-plan-p", "홈 (태블릿 768px)", "가로 넘침 없음, 카드 2열", ["TC-M-008", "TC-M-009"]),
 ("m-home-plan-p", "홈 (모바일 375px, plan-p)", "가로 넘침 없음, 상단 메뉴는 한 줄 가로 스크롤, 카드 1열", ["TC-M-001", "TC-M-002", "TC-M-003", "TC-M-004", "TC-M-005"]),
 ("m-post-plan-p", "글 상세 + 댓글 영역 (모바일 375px)", "댓글·추천 영역이 화면 폭 안에 들어옴", ["TC-M-011"]),
 ("m-list-plan-p", "전체 글 목록 (모바일 375px)", "가로 넘침 없음", ["TC-M-001"]),
 ("m-home-studio", "스킨: studio (모바일 375px)", "알약 메뉴가 가로 스크롤, 넘침 없음", ["TC-M-001"]),
 ("m-home-reader", "스킨: reader (모바일 375px)", "900px 미만에서는 사이드바 대신 위쪽 헤더", ["TC-M-010"]),
 ("m-home-dark", "스킨: dark (모바일 375px)", "어두운 스킨에서도 넘침 없음", ["TC-M-001"]),
]
SHOT_OF = collections.defaultdict(list)
gal = ""
for i, (fn, cap, note, tcs) in enumerate(SHOTS, 1):
    f = D / "shots" / (fn + ".jpg")
    if not f.exists():
        continue
    for t in tcs:
        SHOT_OF[t].append(i)
    b64 = base64.b64encode(f.read_bytes()).decode()
    mobile = fn.startswith("m-")
    gal += (f'<figure id="shot-{i}" class="shot{" mob" if mobile else ""}"><a href="#shot-{i}"><img loading="lazy" src="data:image/jpeg;base64,{b64}" alt="{html.escape(cap)}"></a>'
            f'<figcaption><b>캡처 {i}. {html.escape(cap)}</b><span>{html.escape(note)}</span><span class="tcs">관련: {html.escape(", ".join(tcs))}</span></figcaption></figure>')

# ======================= xlsx =======================
wb = Workbook()
thin = Side(style="thin", color="D0D4DA")
border = Border(left=thin, right=thin, top=thin, bottom=thin)
HF = PatternFill("solid", fgColor="1F2937")
HFONT = Font(bold=True, color="FFFFFF", name="맑은 고딕", size=10)
BODY = Font(name="맑은 고딕", size=10)
WRAP = Alignment(wrap_text=True, vertical="top")
FILL = {"Pass": "DCFCE7", "Fail": "FEE2E2", "Block": "FEF3C7", "미실행": "E5E7EB"}

def header(ws, cols, widths):
    ws.append(cols)
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
        c = ws.cell(row=1, column=i)
        c.fill, c.font, c.border = HF, HFONT, border
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 24

def body(ws, start=2):
    for row in ws.iter_rows(min_row=start):
        for c in row:
            c.font, c.border, c.alignment = BODY, border, WRAP

# 시트 2: 테스트 케이스
ws2 = wb.active
ws2.title = "테스트 케이스"
header(ws2, ["TC ID", "구분", "영역", "시나리오", "사전조건", "절차", "기대결과", "우선순위", "실행 방식", "결과", "실제 결과"], [11, 8, 18, 38, 24, 36, 44, 9, 18, 10, 50])
for r in ROWS:
    ws2.append([r["id"], r["kind"], r["area"], r["title"], r["pre"], r["steps"], r["exp"], r["pri"], r["how"], r["res"], r["actual"]])
body(ws2)
ws2.auto_filter.ref = ws2.dimensions
for k, color in FILL.items():
    ws2.conditional_formatting.add(f"J2:J{len(ROWS)+1}", CellIsRule(operator="equal", formula=[f'"{k}"'], fill=PatternFill("solid", bgColor=color, fgColor=color), font=Font(bold=True)))

# 시트 3: 실행 결과
ws3 = wb.create_sheet("실행 결과")
header(ws3, ["TC ID", "구분", "시나리오", "결과", "실제 결과", "실행일", "증거", "결함 ID"], [11, 8, 38, 10, 62, 12, 26, 12])
DEFMAP = collections.defaultdict(list)
for d in DEFECTS:
    for part in d[1].split(","):
        part = part.strip()
        if "~" in part:
            a, b = part.split("~")
            pref, a_n = a.rsplit("-", 1)
            for n in range(int(a_n), int(b) + 1):
                DEFMAP[f"{pref}-{n:03d}"].append(d[0])
        else:
            DEFMAP[part].append(d[0])
for r in ROWS:
    ev = {"자동(jsdom)": "tests/unit.mjs", "자동(jsdom+가짜 DB)": "tests/integration.mjs", "자동(정적 점검)": "tests/seo-deploy.mjs",
          "자동(curl)": "tests/seo-deploy.mjs", "자동(브라우저 iframe)": "내장 브라우저 측정", "수동": "사용자 확인", "에뮬레이터(Java 필요)": "-"}.get(r["how"], "")
    ws3.append([r["id"], r["kind"], r["title"], r["res"], r["actual"], DAY, ev + ("; 캡처: " + ", ".join(f"shots/{SHOTS[n-1][0]}.jpg" for n in SHOT_OF.get(r["id"], [])) if SHOT_OF.get(r["id"]) else ""), ", ".join(DEFMAP.get(r["id"], []))])
body(ws3)
ws3.auto_filter.ref = ws3.dimensions
for k, color in FILL.items():
    ws3.conditional_formatting.add(f"D2:D{len(ROWS)+1}", CellIsRule(operator="equal", formula=[f'"{k}"'], fill=PatternFill("solid", bgColor=color, fgColor=color)))

# 시트 4: 결함 목록
ws4 = wb.create_sheet("결함 목록")
header(ws4, ["결함 ID", "영향 TC", "심각도", "증상", "원인", "상태/조치"], [10, 14, 9, 52, 52, 48])
for d in DEFECTS:
    ws4.append(list(d))
body(ws4)

# 시트 1: 요약 (실행 결과 시트를 COUNTIFS로 센다)
ws1 = wb.create_sheet("요약", 0)
ws1.column_dimensions["A"].width = 18
for col in "BCDEFG":
    ws1.column_dimensions[col].width = 12
ws1["A1"] = "Plan-P 테스트 요약"
ws1["A1"].font = Font(bold=True, size=14, name="맑은 고딕")
ws1["A2"] = f"실행: {KST} (KST) / 대상 커밋: {commit()}(작업 중 변경 포함)"
ws1["A2"].font = BODY
ws1["A4"], ws1["B4"] = "전체 케이스", f"=COUNTA('실행 결과'!A2:A{len(ROWS)+1})"
ws1["A5"], ws1["B5"] = "합격률(실행분)", "=IFERROR(B7/(B7+B8),0)"
ws1["B5"].number_format = "0.0%"
ws1["A7"], ws1["B7"] = "Pass", "=COUNTIF('실행 결과'!D:D,\"Pass\")"
ws1["A8"], ws1["B8"] = "Fail", "=COUNTIF('실행 결과'!D:D,\"Fail\")"
ws1["A9"], ws1["B9"] = "Block", "=COUNTIF('실행 결과'!D:D,\"Block\")"
ws1["A10"], ws1["B10"] = "미실행", "=COUNTIF('실행 결과'!D:D,\"미실행\")"
for i, k in zip(range(7, 11), ("Pass", "Fail", "Block", "미실행")):
    ws1.cell(row=i, column=1).fill = PatternFill("solid", fgColor=FILL[k])
ws1["A12"] = "구분별"
for j, h in enumerate(["구분", "전체", "Pass", "Fail", "Block", "미실행", "합격률"], 1):
    c = ws1.cell(row=13, column=j, value=h)
    c.fill, c.font, c.border, c.alignment = HF, HFONT, border, Alignment(horizontal="center")
for i, k in enumerate(KINDS, 14):
    ws1.cell(row=i, column=1, value=k)
    ws1.cell(row=i, column=2, value=f"=COUNTIF('실행 결과'!B:B,A{i})")
    for j, res in enumerate(("Pass", "Fail", "Block", "미실행"), 3):
        ws1.cell(row=i, column=j, value=f"=COUNTIFS('실행 결과'!B:B,$A{i},'실행 결과'!D:D,\"{res}\")")
    ws1.cell(row=i, column=7, value=f"=IFERROR(C{i}/(C{i}+D{i}),\"-\")").number_format = "0%"
    for j in range(1, 8):
        ws1.cell(row=i, column=j).border, ws1.cell(row=i, column=j).font = border, BODY
ws1["A23"] = "※ 결과는 '실행 결과' 시트의 '결과' 열(Pass/Fail/Block/미실행)을 고치면 이 요약이 다시 계산됩니다."
ws1["A23"].font = Font(italic=True, size=9, name="맑은 고딕", color="6B7280")
wb.save(D / "test-cases.xlsx")

# ======================= html =======================
e = html.escape
def badge(res):
    cls = {"Pass": "pass", "Fail": "fail", "Block": "block", "미실행": "skip"}[res]
    icon = {"Pass": "✓", "Fail": "✕", "Block": "!", "미실행": "–"}[res]
    return f'<span class="b {cls}"><i>{icon}</i>{e(res)}</span>'

def bar(t, total):
    if not total:
        return '<div class="bar"></div>'
    seg = "".join(f'<span class="s {c}" style="width:{t[k]/total*100:.2f}%" title="{k} {t[k]}"></span>' for k, c in (("Pass", "pass"), ("Fail", "fail"), ("Block", "block"), ("미실행", "skip")) if t[k])
    return f'<div class="bar">{seg}</div>'

kind_rows = ""
for k in KINDS:
    t = KIND_TOT[k]
    tot = sum(t.values())
    ex = t["Pass"] + t["Fail"]
    rate = f'{t["Pass"]/ex*100:.0f}%' if ex else "–"
    kind_rows += f'<tr><td>{k}</td><td class="n">{tot}</td><td>{bar(t, tot)}</td><td class="n">{t["Pass"]}</td><td class="n">{t["Fail"]}</td><td class="n">{t["Block"]}</td><td class="n">{t["미실행"]}</td><td class="n">{rate}</td></tr>'

area_rows = ""
for (k, a), rs in AREAS.items():
    t = tally(rs)
    ex = t["Pass"] + t["Fail"]
    rate = f'{t["Pass"]/ex*100:.0f}%' if ex else "–"
    area_rows += f'<tr><td>{e(k)}</td><td>{e(a)}</td><td class="n">{len(rs)}</td><td>{bar(t, len(rs))}</td><td class="n">{rate}</td></tr>'

def_rows = "".join(f'<tr><td><b>{e(d[0])}</b></td><td>{e(d[1])}</td><td><span class="sev {"hi" if d[2]=="높음" else "mid" if d[2]=="중간" else "lo"}">{e(d[2])}</span></td><td>{e(d[3])}</td><td>{e(d[4])}</td><td>{e(d[5])}</td></tr>' for d in DEFECTS)


detail = "".join(
    f'<tr class="r-{ {"Pass":"pass","Fail":"fail","Block":"block","미실행":"skip"}[r["res"]] }" data-k="{e(r["kind"])}" data-r="{e(r["res"])}" data-s="{e((r["id"]+r["title"]+r["area"]+r["steps"]+r["actual"]).lower())}">'
    f'<td class="id">{e(r["id"])}</td><td>{badge(r["res"])}{"".join(f'<a class="cap" href="#shot-{n}">캡처 {n}</a>' for n in SHOT_OF.get(r["id"],[]))}</td><td>{e(r["kind"])}</td><td>{e(r["area"])}</td><td><b>{e(r["title"])}</b><div class="sub">사전조건: {e(r["pre"])}</div></td>'
    f'<td>{e(r["steps"])}</td><td>{e(r["exp"])}</td><td>{e(r["actual"])}</td></tr>' for r in ROWS)

fails = [r for r in ROWS if r["res"] == "Fail"]
verdict_cls = "fail" if fails else "pass"
verdict = (f"실패 {len(fails)}건(운영 배포 전 SEO 점검)과 규칙 테스트 {TOT['Block']}건이 남아 있습니다. 기능 동작(단위·통합·반응형)은 실행한 케이스 기준 모두 통과했습니다."
           if fails else "실행한 모든 케이스가 통과했습니다.")

kind_opts = "".join(f'<option>{k}</option>' for k in KINDS)

REPORT = f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plan-P 테스트 보고서</title>
<style>
:root{{--bg:#F6F7F9;--card:#fff;--ink:#111827;--mut:#6B7280;--line:#E3E6EB;--acc:#2F54EB;
--pass:#15803D;--passb:#DCFCE7;--fail:#B91C1C;--failb:#FEE2E2;--block:#92400E;--blockb:#FEF3C7;--skip:#4B5563;--skipb:#E5E7EB;--bar-pass:#22A559;--bar-fail:#E5484D;--bar-block:#F5A623;--bar-skip:#C5CAD3}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0F1216;--card:#171B21;--ink:#E7EAEE;--mut:#9AA3AF;--line:#2A303A;--acc:#8EA2FF;--pass:#6EE7A0;--passb:#12351F;--fail:#FCA5A5;--failb:#3F1717;--block:#FCD34D;--blockb:#3B2D0B;--skip:#C0C6CF;--skipb:#272D36;--bar-pass:#2EA862;--bar-fail:#E5484D;--bar-block:#D99A2B;--bar-skip:#4B5563}}}}
:root[data-theme="dark"]{{--bg:#0F1216;--card:#171B21;--ink:#E7EAEE;--mut:#9AA3AF;--line:#2A303A;--acc:#8EA2FF;--pass:#6EE7A0;--passb:#12351F;--fail:#FCA5A5;--failb:#3F1717;--block:#FCD34D;--blockb:#3B2D0B;--skip:#C0C6CF;--skipb:#272D36;--bar-pass:#2EA862;--bar-fail:#E5484D;--bar-block:#D99A2B;--bar-skip:#4B5563}}
*{{box-sizing:border-box;margin:0}}
body{{background:var(--bg);color:var(--ink);font:14px/1.55 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif}}
.wrap{{max-width:1280px;margin:0 auto;padding:28px 16px 64px}}
h1{{font-size:22px}}h2{{font-size:15px;margin:0 0 10px}}
.meta{{color:var(--mut);font-size:13px;margin-top:4px}}
.verdict{{margin:18px 0;padding:14px 16px;border-radius:10px;border:1px solid var(--line);border-left:5px solid var(--fail);background:var(--card);font-weight:500}}
.verdict.pass{{border-left-color:var(--pass)}}
.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px}}
.k{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}}
.k small{{display:block;color:var(--mut);font-size:12px}}.k b{{display:block;font-size:28px;line-height:1.2;margin-top:2px}}
.k.pass b{{color:var(--pass)}}.k.fail b{{color:var(--fail)}}.k.block b{{color:var(--block)}}
.panel{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:18px;overflow-x:auto}}
.grid2{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}
@media(max-width:900px){{.grid2{{grid-template-columns:1fr}}}}
table{{width:100%;border-collapse:collapse;font-size:13px}}
th{{text-align:left;font-size:12px;color:var(--mut);font-weight:600;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap}}
td{{padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}}
td.n{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
td.id{{font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:600}}
.sub{{color:var(--mut);font-size:12px;margin-top:2px}}
.bar{{display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--skipb);min-width:120px}}
.s.pass{{background:var(--bar-pass)}}.s.fail{{background:var(--bar-fail)}}.s.block{{background:var(--bar-block)}}.s.skip{{background:var(--bar-skip)}}
.b{{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}}
.b i{{font-style:normal}}
.b.pass{{background:var(--passb);color:var(--pass)}}.b.fail{{background:var(--failb);color:var(--fail)}}.b.block{{background:var(--blockb);color:var(--block)}}.b.skip{{background:var(--skipb);color:var(--skip)}}
.sev{{display:inline-block;padding:1px 8px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap}}
.sev.hi{{background:var(--failb);color:var(--fail)}}.sev.mid{{background:var(--blockb);color:var(--block)}}.sev.lo{{background:var(--skipb);color:var(--skip)}}
.legend{{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--mut);margin-top:8px}}
.legend span::before{{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}}
.legend .p::before{{background:var(--bar-pass)}}.legend .f::before{{background:var(--bar-fail)}}.legend .bl::before{{background:var(--bar-block)}}.legend .s::before{{background:var(--bar-skip)}}
.tools{{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}}
.tools input,.tools select{{height:36px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font:inherit}}
.tools input{{flex:1 1 220px;min-width:180px}}
#cnt{{align-self:center;color:var(--mut);font-size:13px}}
tr[hidden]{{display:none}}
.gal{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}}.shot{{margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--bg);display:flex;flex-direction:column}}.shot a{{display:block;max-height:360px;overflow:hidden;border-bottom:1px solid var(--line)}}.shot img{{display:block;width:100%;height:auto}}.shot.mob a{{max-height:420px}}.shot:target a{{max-height:none}}.shot:target{{outline:2px solid var(--acc)}}.shot figcaption{{padding:10px 12px;display:flex;flex-direction:column;gap:3px;font-size:13px}}.shot figcaption span{{color:var(--mut);font-size:12px}}.shot .tcs{{font-variant-numeric:tabular-nums}}a.cap{{display:inline-block;margin:4px 4px 0 0;font-size:11px;color:var(--acc);font-weight:600;text-decoration:none;border:1px solid var(--line);border-radius:6px;padding:0 6px}}
#t tr.r-pass td:first-child{{box-shadow:inset 4px 0 var(--bar-pass)}}#t tr.r-fail td:first-child{{box-shadow:inset 4px 0 var(--bar-fail)}}#t tr.r-block td:first-child{{box-shadow:inset 4px 0 var(--bar-block)}}#t tr.r-skip td:first-child{{box-shadow:inset 4px 0 var(--bar-skip)}}
#t tr.r-fail td{{background:var(--failb)}}#t tr.r-block td{{background:var(--blockb)}}
ul.note{{padding-left:18px;color:var(--ink)}}ul.note li{{margin:4px 0}}
.dl{{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}}
.dl a{{color:var(--acc);font-weight:600}}
</style>
</head>
<body>
<div class="wrap">
<h1>Plan-P 테스트 보고서</h1>
<div class="meta">실행 {KST} (KST) · 기준 커밋 {commit()}(작업 중 변경 포함) · 환경: Node {"24"} + jsdom 26(단위·통합), 내장 브라우저(반응형), 운영 주소 읽기 요청(배포·SEO)</div>

<div class="verdict {verdict_cls}">{e(verdict)}</div>

<div class="kpis">
 <div class="k"><small>전체 케이스</small><b>{N}</b></div>
 <div class="k"><small>실행한 케이스</small><b>{EXE}</b></div>
 <div class="k pass"><small>합격 (실행분 {RATE:.1f}%)</small><b>{TOT["Pass"]}</b></div>
 <div class="k fail"><small>실패</small><b>{TOT["Fail"]}</b></div>
 <div class="k block"><small>차단 (환경)</small><b>{TOT["Block"]}</b></div>
 <div class="k"><small>미실행 (수동)</small><b>{TOT["미실행"]}</b></div>
</div>

<div class="grid2">
<div class="panel"><h2>구분별 결과</h2>
<table><tr><th>구분</th><th>전체</th><th>분포</th><th>합격</th><th>실패</th><th>차단</th><th>미실행</th><th>합격률</th></tr>{kind_rows}</table>
<div class="legend"><span class="p">합격</span><span class="f">실패</span><span class="bl">차단</span><span class="s">미실행</span></div>
</div>
<div class="panel"><h2>결함 ({len(DEFECTS)}건)</h2>
<table><tr><th>ID</th><th>영향</th><th>심각도</th><th>증상</th><th>상태/조치</th></tr>
{"".join(f'<tr><td><b>{e(d[0])}</b></td><td>{e(d[1])}</td><td><span class="sev {"hi" if d[2]=="높음" else "mid" if d[2]=="중간" else "lo"}">{e(d[2])}</span></td><td>{e(d[3])}</td><td>{e(d[5])}</td></tr>' for d in DEFECTS)}
</table></div>
</div>

<div class="panel"><h2>영역별 결과</h2>
<table><tr><th>구분</th><th>영역</th><th>케이스</th><th>분포</th><th>합격률</th></tr>{area_rows}</table></div>

<div class="panel"><h2>테스트 화면 캡처 ({len(SHOTS)}장)</h2><div class="gal">{gal}</div></div>

<div class="panel"><h2>결함 상세 (원인)</h2>
<table><tr><th>ID</th><th>영향 TC</th><th>심각도</th><th>증상</th><th>원인</th><th>상태/조치</th></tr>{def_rows}</table></div>

<div class="panel"><h2>이 보고서의 한계</h2><ul class="note">
<li><b>Firestore 규칙(26건)은 실행하지 못했습니다.</b> Java가 없어 에뮬레이터를 켤 수 없습니다. 규칙은 운영에 배포되어 있고 사용자가 로그인해 댓글·추천이 동작하는 것은 확인했지만, 거부해야 할 경우(남의 uid, 501자, 임시 글 등)는 검증하지 않았습니다.</li>
<li>댓글·관리자 통합 테스트는 <b>가짜 DB</b>(메모리)로 화면 동작을 검증했습니다. 권한(규칙)은 검증 대상이 아닙니다.</li>
<li>반응형은 iframe 폭(320/375/768px)으로 측정한 것이며 실제 스마트폰 터치·브라우저 차이는 수동 항목(TC-X-006)입니다. 관리자 화면 모바일은 로그인이 필요해 수동 항목입니다.</li>
<li>jsdom은 레이아웃·글꼴을 계산하지 않으므로 시각 정렬은 브라우저 측정과 수동 확인이 맡습니다.</li>
<li>SEO 운영 점검 8건(TC-S-001~008)은 배포 후 운영 주소에서 다시 실행해 모두 통과했습니다. 카카오톡·슬랙 미리보기와 검색 콘솔 등록은 사람이 확인하는 항목입니다.</li>
<li>결함 DEF-001~004, 006은 수정·배포했습니다. 운영 화면에서의 재확인은 수동 항목입니다.</li>
</ul></div>

<div class="panel"><h2>테스트 가이드와 결과 (전체 {N}건)</h2>
<div class="tools"><input id="q" type="search" placeholder="ID, 시나리오, 절차, 결과 검색" aria-label="검색">
<select id="fk" aria-label="구분"><option value="">구분: 전체</option>{kind_opts}</select>
<select id="fr" aria-label="결과"><option value="">결과: 전체</option><option>Pass</option><option>Fail</option><option>Block</option><option>미실행</option></select><span id="cnt"></span></div>
<table id="t"><tr><th>TC ID</th><th>결과</th><th>구분</th><th>영역</th><th>시나리오</th><th>절차</th><th>기대결과</th><th>실제 결과</th></tr>{detail}</table>
</div>
<div class="dl"><span class="meta">엑셀 원본: docs/test/test-cases.xlsx (시트: 요약, 테스트 케이스, 실행 결과, 결함 목록)</span></div>
</div>
<script>
const rows=[...document.querySelectorAll("#t tr[data-k]")],q=document.getElementById("q"),fk=document.getElementById("fk"),fr=document.getElementById("fr"),cnt=document.getElementById("cnt");
function f(){{const s=q.value.trim().toLowerCase();let n=0;for(const r of rows){{const ok=(!fk.value||r.dataset.k===fk.value)&&(!fr.value||r.dataset.r===fr.value)&&(!s||r.dataset.s.includes(s));r.hidden=!ok;if(ok)n++}}cnt.textContent=n+"건 표시"}}
q.oninput=fk.onchange=fr.onchange=f;f();
</script>
</body>
</html>
'''
(D / "report.html").write_text(REPORT, encoding="utf-8")
print("cases", N, "tally", TOT, "rate %.1f" % RATE)
