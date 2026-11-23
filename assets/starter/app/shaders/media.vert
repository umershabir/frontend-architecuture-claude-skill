#define PI 3.1415926535897932384626433832795

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float uSpeed;
uniform vec2 uViewportSizes;

varying vec2 vUv;

void main() {
  vUv = uv;

  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

  // Bend toward the camera at the viewport centre, proportional to scroll speed.
  viewPosition.z += sin(viewPosition.y / uViewportSizes.y * PI + PI / 2.0) * -uSpeed;

  gl_Position = projectionMatrix * viewPosition;
}
