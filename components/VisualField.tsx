import React, { useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { Theme } from '../types';

interface VisualFieldProps {
  isPlaying: boolean;
  bpm: number;
  theme: Theme;
}

/**
 * A WebGL-based reactive background.
 * Uses a fragment shader to create a "Liquid Light" / Lava Lamp effect
 * that pulses with the actual AudioContext clock.
 */
export const VisualField: React.FC<VisualFieldProps> = ({ isPlaying, bpm, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const programRef = useRef<WebGLProgram | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, depth: false, antialias: false });
    if (!gl) return;

    // --- SHADER SOURCES ---
    const vertexSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;
      
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uBpm;
      uniform float uIntensity; // 0.0 (stopped) to 1.0 (playing)
      uniform float uIsDark;    // 1.0 for dark mode, 0.0 for light
      
      // Simplex Noise (Approximated)
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        
        // --- TIMING & PULSE ---
        // Calculate beat phase (0.0 to 1.0) based on actual audio clock
        float beatDur = 60.0 / uBpm;
        float beatPhase = mod(uTime, beatDur) / beatDur;
        
        // Exponential decay for kick pulse (sharp attack, long tail)
        // Only active when playing
        float pulse = uIntensity * exp(-4.0 * beatPhase); 
        
        // --- LIQUID MOTION ---
        // Flow speed influenced by BPM
        float flowTime = uTime * (uBpm / 120.0) * 0.2;
        
        // Domain warping for "Lava" effect
        vec2 q = vec2(0.);
        q.x = snoise(uv + vec2(flowTime * 0.5, flowTime * 0.3));
        q.y = snoise(uv + vec2(0.0));

        vec2 r = vec2(0.);
        r.x = snoise(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * flowTime);
        r.y = snoise(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * flowTime);

        float f = snoise(uv + r);

        // --- COLOR PALETTE ---
        vec3 color;
        
        if (uIsDark > 0.5) {
            // DARK MODE: Deep Zinc/Black with Amber pulses
            // Base background
            vec3 c1 = vec3(0.05, 0.05, 0.07); // Very dark zinc
            vec3 c2 = vec3(0.96, 0.62, 0.11); // Amber-500
            
            // Mix based on noise and pulse
            // Base noise mix
            color = mix(c1, c1 * 1.5, f); 
            
            // Add Amber flare on pulse
            float flare = smoothstep(0.4, 1.0, f + pulse * 0.3);
            color = mix(color, c2, flare * 0.15 * uIntensity);
            
            // Vignette
            float dist = distance(uv, vec2(0.5));
            color *= 1.0 - dist * 0.6;
            
        } else {
            // LIGHT MODE: White/Light Zinc with Subtle Amber
            vec3 c1 = vec3(0.98, 0.98, 0.98); // Off white
            vec3 c2 = vec3(0.96, 0.62, 0.11); // Amber
            vec3 c3 = vec3(0.9, 0.9, 0.92); // Zinc-100

            // Mix noise
            color = mix(c1, c3, f);
            
            // Add Amber flare
            float flare = smoothstep(0.3, 1.0, f + pulse * 0.2);
            color = mix(color, c2, flare * 0.1 * uIntensity);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // --- COMPILE ---
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = createShader(gl.VERTEX_SHADER, vertexSource);
    const frag = createShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    
    programRef.current = program;
    gl.useProgram(program);

    // --- BUFFERS ---
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // --- UNIFORMS ---
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const uBpmLoc = gl.getUniformLocation(program, 'uBpm');
    const uIntensityLoc = gl.getUniformLocation(program, 'uIntensity');
    const uIsDarkLoc = gl.getUniformLocation(program, 'uIsDark');

    // --- ANIMATION LOOP ---
    const render = () => {
      if (!canvas) return;
      
      // Handle Resize
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      // Low-DPI for performance on high-res screens
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); 
      
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // Time Logic
      // If playing, use audio time for perfect sync.
      // If stopped, use a slow performance timer to keep the lava moving gently.
      const time = isPlaying 
        ? audioService.getCurrentTime() 
        : performance.now() / 1000;
        
      const intensity = isPlaying ? 1.0 : 0.0;

      gl.uniform1f(uTimeLoc, time);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uBpmLoc, bpm);
      gl.uniform1f(uIntensityLoc, intensity);
      gl.uniform1f(uIsDarkLoc, theme === 'dark' ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      // Clean up GL resources if necessary (usually context loss handles this in React unmounts)
    };
  }, [isPlaying, bpm, theme]); // Re-init not strictly needed for props, but cleaner

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000"
      style={{ 
        opacity: isPlaying ? 1 : 0.3, // Dim when idle
        mixBlendMode: theme === 'dark' ? 'screen' : 'multiply', // Blend strategy
        zIndex: 0 
      }}
    />
  );
};