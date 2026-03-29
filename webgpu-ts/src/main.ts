const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("#app element not found.");
}

app.innerHTML = `
  <div style="display:flex; flex-direction:column; gap:12px; padding:16px; color:white; background:#111; min-height:100vh; box-sizing:border-box;">
    <h1 style="margin:0; font-size:20px;">WebGPU First Step</h1>
    <div id="status">Initializing...</div>
    <canvas id="gpu-canvas" width="1280" height="720" style="width:960px; max-width:100%; aspect-ratio:16/9; border:1px solid #333;"></canvas>
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

  const commandEncoder = device.createCommandEncoder();

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.08, g: 0.09, b: 0.12, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  renderPass.end();

  device.queue.submit([commandEncoder.finish()]);

  setStatus("WebGPU initialized successfully.");
}

initWebGPU().catch((error) => {
  console.error(error);
  setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
});