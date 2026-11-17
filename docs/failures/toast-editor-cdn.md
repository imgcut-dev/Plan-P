# TOAST UI Editor가 로드되지 않음 (2026-11-17)

## 막힌 일
관리자 글쓰기에서 에디터가 뜨지 않고 `PluginKey is not defined` 오류가 났다.

## 원인
jsDelivr의 `dist/toastui-editor.js`는 의존 모듈을 따로 불러와야 하는 번들이라 단독으로 동작하지 않았다.

## 푼 방법
공식 CDN `https://uicdn.toast.com/editor/3.2.2/`의 `toastui-editor-all.min.js`(의존 모듈 포함)와 `i18n/ko-kr.js`를 쓴다. 사이트의 글 보기는 `toastui-editor-viewer.min.js`를 필요할 때만 불러온다.

## 다시 안 겪으려면
- 버전은 3.2.2로 고정한다(최신 버전으로 올리지 않는다).
- CDN을 바꾸면 에디터 로드와 글 저장, 사이트 본문 표시를 모두 확인한다.
