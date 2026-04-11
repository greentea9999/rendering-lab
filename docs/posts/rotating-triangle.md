---
title: 회전하는 삼각형 출력하기
description: WebGPU 초기화, 파이프라인, 버퍼, 바인드 그룹, 렌더 루프를 이용해 회전하는 삼각형을 출력한 과정
---

# 회전하는 삼각형 출력하기

## 이번 단계에서 만들고자 한 것

이번 단계의 목표는 화면에 삼각형을 출력하고, 시간에 따라 회전하도록 만드는 것이었습니다.

이 과정에서 아래 흐름을 구현했습니다.

- WebGPU 초기화
- 셰이더 / 파이프라인 생성
- 정점 버퍼 생성
- uniform buffer와 bind group 생성
- `requestAnimationFrame` 기반 렌더 루프 구성
- 매 프레임 회전값 갱신 후 렌더링

## 전체 흐름

이 코드의 큰 흐름은 아래와 같습니다.

1. HTML에 canvas를 만든다
2. `initWebGPU()`에서 GPU 관련 객체를 초기화한다
3. 파이프라인, 정점 버퍼, uniform buffer, bind group을 생성한다
4. `startRenderLoop()`에서 프레임마다 회전값을 갱신한다
5. `render()`에서 draw call을 수행한다

---

## 1. 초기화 부분

### 1-1. `navigator.gpu`

https://developer.mozilla.org/ko/docs/Web/API/Window/navigator

Navigtor 인터페이스는 사용자 에이전트의 상태와 신원 정보를 나타내며, 스크립트로 해당 정보를 질의할 떄와 애플리케이션을 특정 활동에 등록할 때 사용합니다. (읽기 전용)

'navigator.gpu' 는 현재 브라우징의 GPU 객체를 반환하며 WebGPU API 의 진입점임.
디바이스 장치를 요청하고 피처와 제한등을 알 수 있음.

```ts
if (!navigator.gpu) {
  throw new Error("WebGPU is not supported in this browser.");
}

```

이후 `navigator.gpu.requestAdapter()` 로 GPUDevice 를 요청할 수 있고 어댑터 정보와 피처, 제한등을 질의 할 수 있음.

```ts
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) 
  {
    throw new Error("Failed to get GPU adapter.");
  }
```

디바이스는 `adapter.requestDevice()` 로 접근. 
이렇게 얻은 디바이스는 타입 스크립트에서 `GPUDevice` 타입으로 사용됨.

```ts
  const device = await adapter.requestDevice();
````

### 1-2. 캔버스 및 캔버스 포맷 준비

웹 페이지에 렌더링을 할 캔버스 요소를 얻어와야한다.
`HTML canvas` 는 캔버스 스크립팅 API 혹은 WebGL API 와 함께 사용해 그래픽 혹은 애니메이션을 그린다.

```ts
  const canvasMaybe = document.querySelector<HTMLCanvasElement>("#gpu-canvas");
```

querySelector 함수는 DOM (Document Object Model)을 쿼리하며 웹 페이지의 구조와 내용을 정의하는 오브젝트들이다. 타입 스크립트의 경우 반환값의 타입을 지정하여 안전한 코드를 작성

얻은 canvas 객체는 `getContext` 함수를 통하여 `GPUCanvasContext` 드로잉 컨텍스트를 얻는다.

```ts
  const context = canvas.getContext("webgpu") as GPUCanvasContext | null;
  if (!context) 
  {
    throw new Error("Failed to get WebGPU canvas context.");
  }
```

캔버스 포맷은  `navigator.gpu` 객체의 `getPreferredCanvasFormat` 함수로 얻는다

```ts
const format = navigator.gpu.getPreferredCanvasFormat();
```

### 1-3 GPU 에 출력 설정 등록

디바이스, 포멧, 컨텍스트 얻었으면 GPU 에 등록하여 프레임 버퍼를 받아올 수 있게 준비해야한다.

```ts
context.configure({
    device,
    format,
    alphaMode: "opaque",
  });
```

컨텍스트의 `configure` 를 통해 장치와 포멧, 알파모드를 전달하여 어떤 디바이스로 렌더링하고 캔버스에 표시할 포멧및 알파 처리방식을 지정한다. 이후 `context.getCurrentTexture()` 함수로 프레임 버퍼를 받아 올 수 있게 된다.


## 2. 드로잉 준비.

### 2-1 파이프 라인 생성.

파이프 라인을 생성하기전에 파이프라인에 전달하기 위한 `GPUShaderModule` 세이더 모듈을 생성한다. WGSL 세이더를 포함하는 객체로 파이프라인에 의해 GPU 에 제출된다.

```ts
    const shaderModule = state.device.createShaderModule({
    label: "Triangle Shader",
    code: triangleShaderCode,
  });
```

label 은 객체를 구분하는 라벨, 코드는 직접 입력하거나 따로 임포트하여 사용해도 좋다.

디바이스에서 `createRenderPipeline` 함수를 호출하여 `GPURenderPipeline` 객체를 생성한다.
해당 객체는 버텍스, 프래그먼트 세이더 스테이지를 컨트롤하며 `GPURenderPassEncoder`, `GPURenderBundleEncoder` 에 사용된다.

```ts
  const pipeline = state.device.createRenderPipeline({
    label: "Triangle Pipeline",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 5 * 4, // 5 floats * 4 bytes
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x2",
            },
            {
              shaderLocation: 1,
              offset: 2 * 4,
              format: "float32x3",
            },
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [
        {
          format: state.format,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

```

위 코드에서는 안나왔지만 뎁스 스텐실, 멀티 샘플등을 추가로 설정 할 수 있다.

`layout` 필드는  해당 파이프라인에 사용되는 모든 GPU 리소스의 타입을 정의한다.
`GPUPipelineLayout` 오브젝트를 입력할 수 있으며 디바이스에서 `createPipelineLayout` 함수로 생성 할 수 있다. 그외에는 auto 를 지정하여 세이더 코드에 바인딩된 레이아웃을 기반으로 파이프라인이 암묵적으로 생성한다. 이렇게 생성된 바인드 그룹 레이아웃은 현재 파이프라인에서만 사용 할 수 있다 (재사용이 가능

`vertex` 버텍스 세이더의 진입점을 정의하고, 입력되는 정점 버퍼의 레이아웃을 정의한다.
`fragment` 프래그먼트 세이더의 진입점을 정의하고, 출력 컬러의 포멧을 정의한다. 이 부분을 공란으로 남겨두어도 여전히 래스터라이제이션과 뎁스스테이지는 수행된다.

두 필드 모드 세이더 모듈을 받는다.

`primitive` 버텍스 입력으로부터 어떻게 프리미티브를 만들지 정의한다.


### 2-3 버텍스 버퍼및 유니폼 버퍼 생성.

파이프라인을 생성했다면 이제 버텍스 버퍼와 트라이앵글 회전을 위한 유니폼 버퍼를 준비한다.

버퍼 생성은 디바이스의 `createBuffer` 함수로 `GPUBuffer` 객체를 만든다.

```ts
  // vertex = [pos.x, pos.y, color.r, color.g, color.b]
  const vertices = new Float32Array([
    // top
     0.0,  0.8, 1.0, 0.0, 0.0,
    // left
    -0.6, -0.4, 0.0, 1.0, 0.0,
    // right
     0.6, -0.4, 0.0, 0.0, 1.0,
  ]);

  const vertexBuffer = state.device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  state.device.queue.writeBuffer(vertexBuffer, 0, vertices);
```

`createBuffer` 함수는 버퍼의 사이즈와 용도를 입력 받는다.
위 코드에서는 버텍스 버퍼에 사용되고 복사 대상으로 사용된다.

이후 `queue.writeBuffer` 를 통해 버퍼에 기록을 하는데. queue 는 `GPUQueue` 객체이다.
해당 객체에 인코딩된 커맨드들의 실행을 컨트롤하는 객체이다. `writeBuffer` 함수를 호출하여 커맨드를 하나 큐잉하게 된다.

`writeBuffer` 함수는 생성된 `GPUBuffer` 객체를 받고 버퍼 오프셋을 받아 해당 버퍼의 시작지점을 정의한다. 마지막으로 data 를 입력받는다.

유니폼 버퍼도 위와 동일하다. 다만 용도가 GPUBufferUsage.UNIFORM 이고 렌더링 루프에서 계속 업데이트 하는것이 차이이다.

## 2-4 바인드 그룹 생성.
마지막으로 `GPUBindGroup` 객체를 생성한다.
바인드 그룹은 `GPUBindGroupLayout`을 기반으로 세이더에 사용되는 리소스들을 하나로 묶어주는 역할을 한다. 

```ts
const bindGroupLayout = state.device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "uniform",
        },
      },
    ],
  });

const bindGroup  = state.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer
          },
        },
      ],
    });
```

`GPUBindGroupLayout` 은 파이프라인에서 사용될 GPU 리소스들과 연관된 구조를 정의하기위한 인터페이스이다. 레이아웃을 여러개 있을수 있으므로 entries 로 관리하며
각각의 entry는 `binding` 필드를 가지는데 `GPUBindGroup` 의 entries binding 필드와 매칭되며 세이더 코드에서 `@binding(n)` 코드에 대응한다. 

```ts
code in triangle.wgsl
struct Uniforms{
  angleVector : vec4f,
}

@binding(0) @group(0) var<uiform> uniforms : Uniforms;
```

`visibility` 필드는 `GPUBindGroup`의 entry 가 어느 세이더 스테이지에 사용되는지 정의한다. 

이후 리소스 레이아웃을 정의하게되는데 위에서는 `buffer` 로 정의한다. 이것은 `GPUBindGroup`의 entry가 `GPUBufferBinding` 라는 의미이다.
그외에 여러 레이아웃이 있는데 아래 사이트를 참조

https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createBindGroupLayout
https://www.w3.org/TR/webgpu/#gpubindgrouplayout

BindGroupLayout 이 만들어졌으면 BindGorup을 만들어준다.

`createBindGroup` 에서 layout 으로 `GPUBindGroupLayout` 객체를 받고 entry 들을 서술한다. 각 entry는 `GPUBindGroupEntry` 이다.

멤버로 바인드 포인트인 `GPUIndex32` 와 리소스인 `GPUBindingResource` 를 가지는데.
바인딩 리소스의 경우 `GPUSampler`, `GPUTexture`, `GPUBuffer` 등 여러 타입이 있다.

위 예시에서 `GPUBuffer` 의 경우 uniformBuffer 이다.

## 3. 드로우

회전하는 삼각형을 보여주려면 렌더링 루프가 필요하다.
typescript 에서 렌더링 루프를 구현하려면 `requestAnimationFrame` 함수사용 해야하는데.
`requestAnimationFrame` 함수는 파라매터로 다른 함수를 받는다.

```ts
function startRenderLoop(state: WebGPUState, pipeline: GPURenderPipeline, vertexBuffer: GPUBuffer, uniformBuffer: GPUBuffer, bindGroup: GPUBindGroup) {
   let lastStamp: DOMHighResTimeStamp | null = null;

  function frame(timestamp: DOMHighResTimeStamp) {
    let deltaTime = 0;

    if (lastStamp !== null) {
      deltaTime = timestamp - lastStamp;
    }

    lastStamp = timestamp;

    updateRotationUniform(state, uniformBuffer, deltaTime);

    render(state, pipeline, vertexBuffer, bindGroup);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
```

startRenderLoop 함수를 보면 내부에서 `requestAnimationFrame` 함수를 호출하면서 로컬 함수인 frame 을 전달하는데. frame 함수가 브라우저 다음 리페인트 직전에 콜백으로 불린다.
그리고 frame 함수안세더 다시 호출한다.

일반적으로 콜백함수가 호출되는 빈도는 디스플레이의 새로고침 주기와 일치함.

```ts
function updateRotationUniform(state: WebGPUState, buffer: GPUBuffer, deltaTime: number)
{
  angle += deltaTime * 0.001;

  const angleDatas = new Float32Array([
    Math.cos(angle), -Math.sin(angle), Math.sin(angle), Math.cos(angle)
  ]);

  state.device.queue.writeBuffer(buffer, 0, angleDatas);
}
```

또한 콜백되면서 `DOMHighResTimeStamp` double 타입의 변수를 입력 받는데.
이 변수로 삼각형을 회전할 angle 데이터를 계산한다.
버퍼에 기록하는 방식은 동일하다.

```ts
function render(state: WebGPUState, pipeline: GPURenderPipeline, vertexBuffer: GPUBuffer, bindGroup: GPUBindGroup) 
{
  const commandEncoder = state.device.createCommandEncoder();
  const textureView = state.context.getCurrentTexture().createView();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: textureView,
        clearValue: { r: 0.08, g: 0.09, b: 0.12, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });
  renderPass.setPipeline(pipeline);
  renderPass.setBindGroup(0, bindGroup);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.draw(3);
  renderPass.end();
  state.device.queue.submit([commandEncoder.finish()]);
}
```
`createCommandEncoder` 함수는 인코딩된 커맨드 GPU에 발행하는 역할을 담당한다.
커맨드 인코더를 통해 렌더패스 명령어를 기록할 객체를 생성한다. (beginRenderPass)

`getCurrentTexture` 는 웹 페이지에 합성되어 보여질 텍스처를 가져오는것으로 `GPUTexture` 타입이다. `createView()` 함수를 호출하여 `GPUTextureView` 를 반환 받는다.

`GPUCommandEncoder` 의 `beginRenderPass` 함수를 호출한다. 해당 함수는 `GPURenderPassDescriptor	` 를 파라매터로 받고 `GPURenderPassEncoder` 를 반환한다.

`GPURenderPassDescriptor` 는 Color Attachment, DepthStencil Attachment, OcclusionQueryset 등등 정의하는데.
여기서 Color Attachment 는 어떤 텍스처에 렌더 패스 결과를 기록할지 정한다.
텍스처 뷰로 컨텍스트에서 얻은 텍스처뷰를 전달하며 추가로 초기화 색상, 로딩, 저장 수행방식도 정한다.

이렇게 생성된 `GPURenderPassEncoder` 객체를 통하여 파이프라인, 바인드그룹, 버텍스 버퍼를 세팅하고 드로우 함수를 호출한다. 

beginRenderPass 함수 호출부터 시작하여 명령어 기록을 끝내려면 `end` 함수를 호출한다.

마지막으로 `GPUQueue` 객체의 `submit` 함수를 호출하는데. 커맨드 버퍼를 파라매터로 전달한다. 전달된 커맨드는 GPU에 의해 실행된다. [] 에 커맨드 버퍼를 넣는데. 이것은 배열을 전달하는것이다. 배열 순서대로 실행된다.


<script setup>
import { withBase } from 'vitepress'

const demoUrl = withBase('/demo/')
</script>

## 실행 데모

<ClientOnly>
  <iframe
    :src="demoUrl"
    title="WebGPU rotating triangle demo"
    style="
      width: 100%;
      max-width: 960px;
      aspect-ratio: 16 / 9;
      border: 1px solid var(--vp-c-divider);
      border-radius: 12px;
      background: #111;
    "
  />
</ClientOnly>

<p>
  <a :href="demoUrl" target="_blank" rel="noreferrer">새 탭으로 열기</a>
</p>