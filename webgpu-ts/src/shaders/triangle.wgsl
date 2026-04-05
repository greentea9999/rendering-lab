struct Uniforms{
  angleVector : vec4f,
}

@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec3f,
};

@vertex
fn vs_main(
  @location(0) position : vec2f,
  @location(1) color : vec3f
) -> VertexOut {
  var out : VertexOut;

  let xPos = position.x * uniforms.angleVector.x + position.y * uniforms.angleVector.z;
  let yPos = position.x * uniforms.angleVector.y + position.y * uniforms.angleVector.w;

  out.position = vec4f(xPos, yPos, 0.0, 1.0);
  out.color = color;
  return out;
}

@fragment
fn fs_main(in : VertexOut) -> @location(0) vec4f {
  return vec4f(in.color, 1.0);
}