# Plan-P 블로그

순수 HTML/CSS/JS 정적 블로그. 사이트 `index.html`, 관리자 `admin.html`, 데이터 `data.js`(기본 데이터·`SKINS`·`SECTIONS`·`loadCfg`), 스킨 `skins.css`, Firebase 연결 `fb.js`, 방문 통계 `analytics.js`(사이트만, 관리자 제외).

- GitHub: imgcut-dev/Plan-P (`main`, Pages) · Firebase: `plan-p-1b255` (https://plan-p-1b255.web.app)
- 읽을 문서: 디자인은 `DESIGN.md`(+ `design-system/`), 정한 것과 이유는 `docs/decisions.md`, 막혔던 일은 `docs/failures/`.

## 구조
- 해시 라우팅(`#/post/ID`, `#/cat/이름`, `#/all`, `#/search/검색어`). 글 본문은 마크다운, 에디터는 TOAST UI 3.2.2.
- 데이터는 Firestore: `site/config`(site·nav·home) + `posts/{id}`. `status: draft`는 규칙이 막아 관리자만 읽는다.
- 메인은 `home.sections` 목록(섹션 종류는 `SECTIONS`, 그리는 곳은 `index.html`의 `SEC`). 스킨은 `site.skin` 하나.

## 규칙
- 관리자 로그인은 Google만. 쓰기 권한은 Firestore 규칙이 정한다. 규칙을 먼저 배포한 뒤에 쓰기 코드를 배포한다.
- 관리자 이메일, 비밀 값은 커밋하지 않는다. `firestore.rules`는 `.gitignore`에 있고 이 PC에만 있다(`firebase deploy --only firestore:rules`).
- 관리자 화면에서는 "카테고리"로 통일한다. 문구는 한국어 존댓말, 버튼은 동사.
- 디자인: 한 스킨 안에서 포인트 색 하나, 그림자·그라데이션·광고 없음. 상세는 `DESIGN.md`.

## 배포
- 순서: 로컬에서 확인 → 커밋·푸시 → `node tools/build-seo.mjs`(글 공유 페이지와 sitemap 생성) → `firebase deploy --only hosting`. 글을 발행·수정했다면 생성을 빼먹지 않는다. GitHub 푸시와 호스팅 배포는 **별개**다. 요청받았을 때만 한다.
- `firebase.json` ignore(`**/.*/**`, `design-system/**`, `docs/**`, `CLAUDE.md`, `firestore.rules`)는 지우지 않는다. 배포 후 `/.git/config`, `/firestore.rules`가 404인지 확인한다.

## 문서 안내
파일 이름은 **영문 소문자와 하이픈**으로 짓는다(한글 파일명 금지). `CLAUDE.md`, `DESIGN.md`는 이름이 정해진 것이라 바꾸지 않는다.

| 파일 | 무엇인가 | 언제 쓰는가 |
|---|---|---|
| `CLAUDE.md` | 이 프로젝트에서 Claude가 지킬 규칙, 구조, 배포 순서. 세션 시작 때 자동으로 읽힌다 | 구조, 규칙, 배포 방식이 바뀔 때 |
| `DESIGN.md` | 디자인 원칙, 색·글꼴·간격 값, 스킨 규칙 (정본 값은 `design-system/tokens.json`) | 디자인 규칙이 바뀔 때, 새 스킨을 추가할 때 |
| `docs/analytics-events.md` | GA4 이벤트 이름·파라미터 규칙표, GA에 등록할 맞춤 측정기준 | 이벤트를 추가하거나 고칠 때 (이름은 이 표를 먼저 고친다) |
| `docs/test/` + `tests/` | 테스트 케이스(`cases.py`), 자동 결과, 엑셀(`test-cases.xlsx`), HTML 보고서(`report.html`). 실행: `cd tests && npm i && node run.mjs`, 이어서 `python3 docs/test/build.py` | 기능을 추가·수정한 뒤, 배포 전 |
| `docs/decisions.md` | 정한 것과 이유, 날짜. 새 결정은 맨 위에 추가 | 정책이나 방향을 정한 **그 자리에서** |
| `docs/failures/주제-영문.md` | 막혔던 일 / 원인 / 푼 방법 / 다시 안 겪으려면. 주제마다 파일 하나, 목록은 `README.md` | 막혔다가 푼 **직후** |

**사용 방법**
- Claude는 작업 전에 읽는다: 화면 작업은 `DESIGN.md`, 새 방향을 정하기 전에는 `decisions.md`(이미 정한 것을 뒤집지 않으려고), 오류를 만나면 `failures/`.
- 사용자는 이렇게 시킨다: "이 결정 decisions에 적어 줘", "방금 막힌 일 failures에 남겨 줘", "DESIGN.md 스킨 규칙 고쳐 줘".

**백업**
- 문서는 코드와 함께 GitHub에 커밋·푸시하는 것이 백업이다. 문서를 고친 뒤 요청받으면 커밋한다.
- 글과 설정(Firestore)은 관리자 "데이터" 탭의 **data.json 내보내기**로 받아 둔다(큰 변경 전, 정기적으로).
- `firestore.rules`는 저장소에 없다. Firebase 콘솔 Firestore > 규칙 화면에서 확인할 수 있고, 정책 내용은 `docs/decisions.md`가 기준이다.
