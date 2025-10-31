uniform float time;
uniform vec3 routeColor;
uniform float progress;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    float glow = abs(sin(time * 2.0 + vUv.x * 10.0)) * 0.5 + 0.5;
    float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
    
    float progressMask = step(vUv.x, progress);
    
    vec3 color = routeColor * (glow * 0.5 + 0.5);
    float alpha = edge * 0.8 * progressMask;
    
    gl_FragColor = vec4(color, alpha);
}
