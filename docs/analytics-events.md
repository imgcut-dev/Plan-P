# GA4 이벤트 택소노미 (규칙표)

이벤트를 추가하거나 고칠 때 **이 표를 먼저 고친다.** 이벤트는 만드는 곳에 따라 두 종류다.

- **코드 이벤트**: 사이트 코드가 GA로 보낸다(`analytics.js`, 연결은 `index.html`). 클릭, 스크롤 비율, 검색어처럼 *행동*을 잡는다.
- **GA 생성 이벤트**: GA의 "이벤트 만들기"(관리 > 데이터 표시 > 이벤트)에서 만든다. 코드 없이, 이미 들어온 `page_view`의 주소 조건으로 *화면 종류*를 잡는다.

측정 ID와 설정 배경은 `docs/decisions.md`의 "방문 통계" 항목에 있다. 관리자 화면은 집계하지 않는다.

## 1. 이름 규칙 (두 종류 공통)
- 영문 소문자와 밑줄(`snake_case`). GA 권장 이름(`search`, `select_content`)이 있으면 그 이름을 쓴다.
- 형식은 이름만 봐도 종류를 알 수 있게 한다.

| 종류 | 이름 형식 | 예 |
|---|---|---|
| 화면 종류 (GA 생성) | `view_대상` | `view_post`, `view_tag` |
| 클릭 | `대상_click` | `tag_click`, `category_click` |
| 진행 | `대상_progress` | `read_progress` |
| GA 권장 이름 | 그대로 | `search`, `select_content` |

- 이미 있는 이름(`page_view`, `search` 등)과 겹치는 GA 생성 이벤트는 만들지 않는다.
- 개인정보(이름, 이메일 등)를 파라미터에 넣지 않는다. 이벤트 이름은 15개 안팎으로 유지한다(GA 한도: 이름 500개, 이벤트당 파라미터 25개).

## 2. 이벤트 목록과 상태

### 2-1. 자동으로 들어오는 것
| 이벤트 | 내용 | 상태 |
|---|---|---|
| `page_view` | 화면이 바뀔 때. `#/post/글ID`를 `/post/글ID`로 바꿔 `page_location`, `page_path`, `page_title`로 보낸다 (`gaView`) | 배포됨 |
| `scroll`, `click`(이탈), `file_download` | GA 향상된 측정이 자동으로 보낸다 | 자동 |

### 2-2. 코드 이벤트 (행동)
| 이벤트 | 언제 | 파라미터 | 코드 | 상태 |
|---|---|---|---|---|
| `search` | 검색어 입력이 1.2초 멈췄을 때 한 번 | `search_term` | `gaView` | 코드 완료, 배포 전 |
| `read_progress` | 글 본문 25/50/75/100% 도달, 비율마다 글당 한 번 | `post_id`, `percent` | `gaRead` | 코드 완료, 배포 전 |
| `tag_click` | 글 아래 `#태그` 링크 클릭 | `tag_name` | `gaBind` | 코드 완료, 배포 전 |
| `category_click` | 카테고리 링크 클릭 | `category`, `source`(`menu`/`chips`/`sidebar`/`post`/`other`) | `gaBind` | 코드 완료, 배포 전 |
| `select_content` | 메인 화면 섹션 안에서 글 클릭 | `content_type=home_section`, `content_id=섹션 종류`(`picks`/`feature`/`latest`/`category`/`text`), `post_id` | `gaBind` | 코드 완료, 배포 전 |
| `comment_submit` | 댓글·답글 등록 성공 | `post_id`, `is_reply`(true/false) | `comments.js` | 코드 완료, 배포 전 |
| `like_click` | 추천을 눌러 추가했을 때(취소는 보내지 않음) | `target`(`post`/`comment`), `post_id` | `comments.js` | 코드 완료, 배포 전 |
| `share` | 글 아래 "공유하기" 버튼을 눌렀을 때 | `method`(`copy_link`/`x`/`facebook`/`linkedin`/`naver`/`native`), `content_type=post`, `item_id=글ID` | `index.html` | 코드 완료, 배포 전 |

### 2-3. GA 생성 이벤트 (화면 종류)
소스 이벤트는 모두 `page_view`다. GA에서 **관리 > 데이터 표시 > 이벤트 > 이벤트 만들기 > 코드 없이 만들기**로 만든다.

| 이벤트 이름 | 일치 조건 (URL contains) | 의미 | 주요 이벤트 | 상태 |
|---|---|---|---|---|
| `view_post` | `/post/` | 글을 열어 본 횟수 | 끔 | 만들기 필요 |
| `view_category` | `/cat/` | 카테고리 목록 화면 | 끔 | 만들기 필요 |
| `view_tag` | `/tag/` | 태그 목록 화면 | 끔 | 만들기 필요 |
| `view_search` | `/search/` | 검색 결과 화면 | 끔 | 만들기 필요 |

만드는 법(이벤트마다 반복):
1. 이벤트 이름에 위 이름을 쓴다.
2. 데이터 스트림 `plan-p`, 기존 이벤트 이름 `page_view`를 그대로 둔다.
3. 일치 조건 `URL contains`, URL 칸에 위 값(예: `/post/`)을 쓴다.
4. 주요 이벤트 표시는 끈 채로 **만들기**를 누른다.

주의:
- 만든 시점부터 들어오는 데이터에만 적용되고 소급되지 않는다.
- 파생 이벤트는 `page_view`를 대체하지 않고 **같은 조회가 한 번 더** 집계된다. `view_post` + `view_tag` 등을 `page_view`와 합산하지 않는다.
- GA 생성 이벤트는 클릭이나 읽은 비율은 만들 수 없다. 그런 행동은 2-2의 코드 이벤트로만 만든다.

## 3. 동작 규칙 (코드 이벤트)
- `read_progress`: 짧은 글이 열자마자 100%가 되지 않도록, 스크롤이 있거나 5초가 지난 뒤에만 센다. 다른 화면으로 가면 감지를 멈춘다.
- 집계 제외: 로컬(`localhost`), 미리보기(`?demo`, `?skin`), 관리자 화면.
- GA 설정: 향상된 측정의 "브라우저 기록 이벤트 기반 페이지 변경"은 **꺼 둔다**(켜면 `page_view`가 두 번 잡힌다).

## 4. GA에 등록할 맞춤 측정기준 (범위: 이벤트)
관리 > 데이터 표시 > 맞춤 정의 > 맞춤 측정기준. 등록 전 데이터는 소급되지 않는다. 앞의 5개는 등록 완료. 추천 대상(`target`), 답글 여부(`is_reply`)는 **코드 배포 전에 등록**한다.

| 이름 | 이벤트 매개변수 |
|---|---|
| 글 ID | `post_id` |
| 읽은 비율 | `percent` |
| 태그 이름 | `tag_name` |
| 카테고리 | `category` |
| 클릭 위치 | `source` |
| 추천 대상 | `target` |
| 답글 여부 | `is_reply` |

`search_term`, `content_type`, `content_id`는 GA 기본 항목이라 등록하지 않는다. 검색어가 보고서에 안 나오면 `search_term`을 맞춤 측정기준으로 추가한다.

## 5. 보는 법
| 알고 싶은 것 | 이벤트 | 어디서 |
|---|---|---|
| 가장 많이 읽힌 글 | `page_view` 또는 `view_post` | 보고서 > 참여도 > 페이지 및 화면(경로 `/post/글ID`) |
| 끝까지 읽은 글 | `read_progress` | 탐색 > 자유 형식: 행 `글 ID`, `읽은 비율`, 값 이벤트 수 |
| 인기 검색어 | `search` | 탐색 > 자유 형식: 행 `검색어` |
| 인기 태그 | `tag_click` | 탐색 > 자유 형식: 행 `태그 이름` |
| 인기 카테고리, 어디서 눌렀는지 | `category_click` | 탐색: 행 `카테고리`, `클릭 위치` |
| 메인 구성의 효과 | `select_content` | 탐색: 행 `content_id`(섹션 종류), 값 이벤트 수 |
| 화면 종류별 방문 | `view_post`, `view_category`, `view_tag`, `view_search` | 보고서 > 참여도 > 이벤트 |

이벤트 이름과 횟수는 실시간 화면에서 몇 분 안에, 맞춤 측정기준으로 나눠 보는 값은 보통 하루 뒤부터 나타난다.

## 6. 새 이벤트를 추가하는 순서
1. 이 문서의 2-2(코드) 또는 2-3(GA 생성)에 **먼저** 한 줄 추가하고 이름 규칙을 지킨다.
2. 파라미터가 새로 생기면 4번 표에 추가하고 GA에서 맞춤 측정기준을 만든다(코드 배포 전에).
3. 구현한다. 코드 이벤트는 `analytics.js`와 `index.html`, GA 생성 이벤트는 GA 화면에서 만든다.
4. 실시간(또는 DebugView)에서 이름과 횟수를 확인하고 상태 칸을 "배포됨"/"완료"로 바꾼다.
5. `docs/decisions.md`에 이유를 남긴다.
