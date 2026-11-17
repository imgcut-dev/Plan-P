# Firebase 배포로 `.git`, `.claude`가 공개됨 (2026-11-17)

## 막힌 일
첫 배포 뒤 `https://plan-p-1b255.web.app/.git/config`가 200으로 열렸다. 점(.)으로 시작하는 폴더(`.git/`, `.claude/`)가 함께 올라간 것이다.

## 원인
`firebase.json`의 `public`이 프로젝트 루트(".")라서 저장소 전체가 올라간다. 기본 ignore의 `**/.*`는 점 파일만 막고 **점 폴더 안의 파일**은 막지 못한다. 처음에 설정이 안전하다고 잘못 안내했다.

## 푼 방법
`ignore`에 `"**/.*/**"`를 추가하고 재배포했다. `.git/config`가 404인 것을 확인했다.

## 다시 안 겪으려면
- 배포할 때마다 `/.git/config`, `/firestore.rules`, `/CLAUDE.md`가 404인지 확인한다.
- 사이트에 올리면 안 되는 파일(문서, 규칙 파일)은 `firebase.json`의 `ignore`에 넣는다.
- 가능하면 `public`을 별도 폴더로 분리하는 것이 근본 해결이다(아직 안 함).
