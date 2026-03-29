# Setup Notes

## 목적
이 프로젝트는 WebGPU 기반 렌더링 실험을 빠르게 반복하기 위한 환경이다.

## 왜 Vite를 사용했는가
- 로컬 실행이 빠름
- TypeScript 템플릿으로 바로 시작 가능
- 이후 GitHub Pages 배포도 비교적 단순함

## 현재 상태
현재 `main.ts`는 다음 역할만 담당한다.
- DOM에 canvas 생성
- WebGPU adapter/device/context 초기화
- render pass를 만들어 clear color 출력
- 상태 메시지 표시

## 성공 기준
- 브라우저에서 canvas가 보인다
- `WebGPU initialized successfully.` 메시지가 출력된다
- clear color가 정상적으로 렌더링된다

## 다음 단계
- triangle 렌더링
- shader module 분리
- sphere mesh 추가
- Lambert shading 구현