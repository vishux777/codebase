uniform float time;
uniform float severity;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    float pulse = sin(time * 2.0 + vUv.x * 3.0) * 0.5 + 0.5;
    float intensity = pulse * severity;
    
    vec3 color;
    if (severity > 0.7) {
        color = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), intensity);
    } else if (severity > 0.4) {
        color = mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.5, 0.0), intensity);
    } else {
        color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.8, 0.0), intensity);
    }
    
    float alpha = intensity * 0.6;
    gl_FragColor = vec4(color, alpha);
}
