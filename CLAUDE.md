# Plan-P 블로그

순수 HTML/CSS/JS 정적 블로그. 사이트 `index.html`, 관리자 `admin.html`, 데이터 `data.js`.

- GitHub: imgcut-dev/Plan-P (`main`, Pages) · Firebase: `plan-p-1b255` (https://plan-p-1b255.web.app)
- 디자인 규칙은 `design-system/README.md`와 `tokens.json`을 먼저 읽고 맞춘다.

## 정한 것
- 관리자 로그인은 Google 로그인(Firebase Auth)만 쓴다. DB는 Firestore.
- 정책의 이유와 날짜는 `docs/decisions.md`에 적는다. 새 결정이 생기면 그 파일 맨 위에 추가한다.
- 보안 규칙(읽기 공개, 쓰기 관리자 이메일만)을 먼저 설정한 뒤에 쓰기 코드를 배포한다.
- 관리자 이메일, 비밀 값은 커밋하지 않는다. 그래서 `firestore.rules`(관리자 이메일 포함)는 `.gitignore`에 있고 이 PC에만 있다. 배포: `firebase deploy --only firestore:rules`.
- 데이터: `site/config`(설정·메뉴·메인) + `posts/{id}`. 임시저장 글은 규칙이 막는다. `fb.js`의 웹 앱 설정값은 공개용이라 커밋해도 된다.
- 글 본문은 마크다운, 에디터는 TOAST UI. `status: draft`는 사이트에 안 보인다.

## 디자인
- 포인트 색은 파랑 하나. 그림자, 그라데이션, 이모지 강조, 광고 영역은 쓰지 않는다.
- 문구는 한국어 존댓말, 버튼은 동사("발행", "임시저장").

## 배포
- `firebase.json` ignore의 `**/.*/**`와 `design-system/**`는 지우지 않는다. (`.git` 공개된 적 있음)
- 배포 후 `/.git/config`가 404인지 확인한다.
- 커밋, 푸시, 배포는 요청받았을 때만 한다. 화면은 로컬에서 확인한 뒤 커밋한다.
