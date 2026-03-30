---
layout: home

hero:
  name: "Rendering Lab"
  text: "WebGPU로 렌더러를 만들며 기록하는 개발 로그"
  tagline: "Vite + TypeScript + WebGPU로 렌더링 기초를 직접 구현하고, 기능 단위로 정리합니다."
  image:
    src: /images/kitten.png
    alt: Rendering Lab PReview
  actions:
    - theme: brand
      text: 개발 로그 보기
      link: /posts/
    - theme: alt
      text: GitHub 저장소
      link: https://github.com/여기에-본인아이디/rendering-lab

features:
  - title: 무엇을 만드는가
    details: WebGPU 기반의 작은 렌더링 실험실을 만들며, 초기화부터 드로우콜까지 단계적으로 정리합니다.

  - title: 어떻게 기록하는가
    details: 각 글은 문제, 구현 내용, 핵심 API, 막혔던 점, 다음 단계 순서로 작성합니다.

  - title: 왜 기록하는가
    details: 단순 커밋 로그가 아니라, 나중에 다시 읽어도 이해되는 개발 문서를 남기기 위해서입니다.
---

## 소개

이 사이트는 `rendering-lab` 저장소의 개발 과정을 정리한 문서 사이트입니다.

현재 프로젝트는 아래 구조로 나뉘어 있습니다.

- `webgpu-ts/` : 실제 WebGPU + Vite + TypeScript 앱
- `docs/` : VitePress로 만든 공개용 개발 로그 사이트
- `screenshots/` : 실험 결과 스크린샷 보관용 폴더

## 현재 진행 상황

- Vite 기반 WebGPU 프로젝트 구성
- `src/shaders/triangle.wgsl`로 셰이더 파일 분리
- `main.ts` 중심으로 렌더링 흐름 정리
- 기능별 구현 과정을 문서로 남길 준비

## 이 사이트에서 다룰 내용

- WebGPU adapter / device / context 초기화
- RenderPass와 clear color
- 삼각형 출력
- 셰이더 파일 분리
- 버퍼 구조화
- 카메라, 유니폼, 렌더링 구조 개선

## 글 읽는 순서

1. 환경 구성
2. WebGPU 초기화
3. 첫 출력 확인
4. 셰이더 정리
5. 버퍼와 파이프라인 구조화

## 바로 가기

- [개발 로그 목록](/posts/)
- [첫 글 템플릿](/posts/first-post-template)