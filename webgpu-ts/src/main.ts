import "./style.css";
import triangleShaderCode from "./shaders/triangle.wgsl?raw";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app)
{
  throw new Error("#app element not found.");
}

app.innerHTML = `
  <div style="display:flex; flex-direction:column; gap:12px; padding:16px; color:white; background:#111; min-height:100vh; box-sizing:border-box;">
    <h1 style="margin:0; font-size:20px;">WebGPU Triangle Step</h1>
    <div id="status">Initializing...</div>
    <canvas
      id="gpu-canvas"
      width="1280"
      height="720"
      style="width:960px; max-width:100%; aspect-ratio:16/9; border:1px solid #333;"
    ></canvas>
  </div>
`;

const statusEl = document.querySelector<HTMLDivElement>("#status");
const canvas = document.querySelector<HTMLCanvasElement>("#gpu-canvas");

if (!statusEl || !canvas)
{
  throw new Error("Required DOM elements not found.");
}

function setStatus(message: string)
{
  statusEl.textContent = message;
}

async function initWebGPU()
{
  if (!navigator.gpu) 
  {
    throw new Error("WebGPU is not supported in this browser.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) 
  {
    throw new Error("Failed to get GPU adapter.");
  }

  const device = await adapter.requestDevice();

  const context = canvas.getContext("webgpu");
  if (!context) 
  {
    throw new Error("Failed to get WebGPU canvas context.");
  }

  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });

  // vertex = [pos.x, pos.y, color.r, color.g, color.b]
  const vertices = new Float32Array([
    // top
     0.0,  0.6, 1.0, 0.0, 0.0,
    // left
    -0.6, -0.6, 0.0, 1.0, 0.0,
    // right
     0.6, -0.6, 0.0, 0.0, 1.0,
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  const shaderModule = device.createShaderModule({
    label: "Triangle Shader",
    code: triangleShaderCode,
  });

  const pipeline = device.createRenderPipeline({
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
          format,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  function render() 
  {
    const commandEncoder = device.createCommandEncoder();

    const textureView = context.getCurrentTexture().createView();

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
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.draw(3);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
  setStatus("Triangle rendered successfully.");
}

initWebGPU().catch((error) => {
  console.error(error);
  setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
});