import React, { useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { Theme, TimeSignature } from '../types';

interface MeasureSyncData {
  startTime: number;
  bpm: number;
}

interface VisualPanelProps {
  isPlaying: boolean;
  bpm: number;
  theme: Theme;
  timeSignature: TimeSignature;
  measureSync: MeasureSyncData;
}

/**
 * VisualPanel
 * A contained, GPU-accelerated visualizer that renders a tempo-synced
 * psychedelic liquid light field with particle effects and shockwaves.
 * Adapts to Light/Dark mode.
 */
export const VisualPanel: React.FC<VisualPanelProps> = ({ 
  isPlaying, 
  bpm, 
  theme,
  timeSignature,
  measureSync
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Use a Ref to store the latest props so the animation loop can access them 
  // without triggering a re-effect/re-compile of the shader.
  const propsRef = useRef({ isPlaying, bpm, theme, measureSync });

  useEffect(() => {
    propsRef.current = { isPlaying, bpm, theme, measureSync };
  }, [isPlaying, bpm, theme, measureSync]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize WebGL
    const gl = canvas.getContext('webgl', { 
      alpha: true, 
      depth: false, 
      antialias: false,
      powerPreference: 'high-performance' 
    });

    if (!gl) return;

    // --- SHADER DEFINITIONS ---

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
      uniform float uIntensity;
      uniform float uIsDark;
      uniform float uBeatPulse;
      uniform float uChaos; // Random seed/offset

      // --- COLOR PALETTE (Cosine Based Iridescent) ---
      vec3 palette(float t) {
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.263, 0.416, 0.557);
          return a + b * cos(6.28318 * (c * t + d));
      }
      
      // --- HASH NOISE ---
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        // Center UVs
        // We preserve aspect ratio (Y is 1.0) but X depends on width.
        vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
        vec2 uv0 = uv;
        
        // --- RANDOMIZED TURBULENCE ---
        // Add time-based noise to distort the space, creating randomness
        float turbulence = noise(uv * 1.5 + uTime * 0.15 + uChaos);
        uv += vec2(turbulence) * 0.1 * uIntensity;

        // --- BEAT SYNCED VARS ---
        float pulse = uBeatPulse * uIntensity; // 0.0 to 1.0 on beat
        
        // --- RIPPLE DISTORTION ---
        // Stretched Ripple to match wide aspect AND fill vertical space
        // Lower Y value (0.5) means "wider/taller" visual distribution
        float dist = length(uv * vec2(0.25, 0.6)); 
        
        // Stronger shockwave with some noise applied to the ring
        float shockRing = dist * 15.0 - uTime * 12.0 + turbulence * 2.0;
        float shockwave = smoothstep(0.0, 0.2, pulse) * (1.0 - smoothstep(0.2, 0.8, pulse));
        uv *= 1.0 - (0.1 * shockwave * sin(shockRing));

        vec3 finalColor = vec3(0.0);
        
        // --- NEON FRACTAL LOOPS ---
        for (float i = 0.0; i < 3.0; i++) {
            // Space folding with slight rotation based on turbulence
            uv = fract(uv * 1.5) - 0.5;

            // Attenuate glow based on distance, but stretch the "sweet spot"
            // vec2(0.2, 0.5) stretches X by 5 and Y by 2 relative to unit circle
            float wideCenterDist = length(uv0 * vec2(0.2, 0.5));
            float d = length(uv) * exp(-wideCenterDist);

            // Color selection - inject turbulence into the palette lookup for random hues
            vec3 col = palette(length(uv0) + i * 0.4 + uTime * 0.4 + pulse * 0.2 + turbulence * 0.4);

            // Ring animation
            d = sin(d * 8.0 + uTime) / 8.0;
            d = abs(d);

            // Glow Intensity (reacts to beat)
            float glowPower = 1.1 + (pulse * 0.8); 
            d = pow(0.01 / d, glowPower);

            finalColor += col * d;
        }
        
        // --- PARTICLE DUST ---
        // Add uChaos to noise seed for unique dust patterns
        float n = noise(uv0 * 10.0 + vec2(uTime * 0.5, uChaos));
        float sparkle = pow(n, 12.0); // More sparkles
        vec3 sparkleColor = palette(uTime + n);
        finalColor += sparkleColor * sparkle * 4.0 * uIntensity;
        
        // --- EXPLOSIVE FLASH ---
        // Also stretched
        float flashDist = length(uv0 * vec2(0.25, 0.6));
        float flash = 1.0 / (flashDist + 0.1);
        flash = pow(flash, 2.0) * pulse * 0.15;
        finalColor += vec3(1.0, 0.9, 0.8) * flash;

        // --- MASKING ---
        // Rectangular soft border logic to keep edges clean but maximize space
        vec2 sUV = gl_FragCoord.xy / uResolution.xy;
        float borderX = smoothstep(0.0, 0.02, sUV.x) * (1.0 - smoothstep(0.98, 1.0, sUV.x));
        float borderY = smoothstep(0.0, 0.05, sUV.y) * (1.0 - smoothstep(0.95, 1.0, sUV.y));
        finalColor *= borderX * borderY;

        // --- THEME ADAPTATION ---
        if (uIsDark > 0.5) {
            // DARK MODE: Standard Additive Neon
            if (uIntensity < 0.5) finalColor *= 0.3; // Dim when stopped
            gl_FragColor = vec4(finalColor, 1.0);
        } else {
            // LIGHT MODE: Subtractive Ink on Paper
            // Invert color to create CMY-like ink effects on white
            vec3 lightColor = 1.0 - finalColor;
            
            // Increase contrast for light mode to make it "pop"
            lightColor = pow(lightColor, vec3(1.2));
            
            // When stopped, fade to a clean white/grey
            if (uIntensity < 0.5) {
                lightColor = mix(vec3(0.95), lightColor, 0.3);
            }
            
            gl_FragColor = vec4(lightColor, 1.0);
        }
      }
    `;

    // --- COMPILE HELPERS ---
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
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
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // --- GEOMETRY ---
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // --- UNIFORMS ---
    const locs = {
      uTime: gl.getUniformLocation(program, 'uTime'),
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uBpm: gl.getUniformLocation(program, 'uBpm'),
      uIntensity: gl.getUniformLocation(program, 'uIntensity'),
      uIsDark: gl.getUniformLocation(program, 'uIsDark'),
      uBeatPulse: gl.getUniformLocation(program, 'uBeatPulse'),
      uChaos: gl.getUniformLocation(program, 'uChaos'),
    };

    // --- ANIMATION LOOP ---
    const render = () => {
      // Access current state via Ref
      const { isPlaying, bpm, theme, measureSync } = propsRef.current;

      // 1. Resize handling
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // 2. Audio Time & Phasing
      const time = audioService.getCurrentTime();
      
      // Calculate phase relative to the MEASURE START TIME
      // This ensures 0.0 is exactly on the beat, assuming spb matches bpm
      let beatPhase = 0.0;
      
      if (isPlaying && measureSync.bpm > 0) {
        // Use the bpm from measureSync to be exactly accurate with the audio engine
        const spb = 60.0 / measureSync.bpm; 
        const elapsed = time - measureSync.startTime;
        
        // Calculate total beats elapsed
        const beatsElapsed = elapsed / spb;
        
        // The fractional part is our position within a beat (0.0 to 1.0)
        beatPhase = beatsElapsed - Math.floor(beatsElapsed);
      }

      // Pulse calculation (Decay curve)
      const pulse = isPlaying ? Math.exp(-3.0 * beatPhase) : 0.0;

      // Chaos factor: slowly drifts over time, creating unique variations
      const chaos = Math.sin(time * 0.2) + Math.cos(time * 0.31) * 0.5;

      // 3. Update Uniforms
      gl.uniform1f(locs.uTime, isPlaying ? time : performance.now() / 1000);
      gl.uniform2f(locs.uResolution, canvas.width, canvas.height);
      // Use display bpm for visuals speed, or sync bpm? 
      // Using visual BPM (dial) feels more responsive when changing dial, 
      // but syncing is key. Let's use dial BPM for general flow, but pulse is strictly synced.
      gl.uniform1f(locs.uBpm, bpm); 
      gl.uniform1f(locs.uIntensity, isPlaying ? 1.0 : 0.0); 
      gl.uniform1f(locs.uIsDark, theme === 'dark' ? 1.0 : 0.0);
      gl.uniform1f(locs.uBeatPulse, pulse);
      gl.uniform1f(locs.uChaos, chaos);

      // 4. Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []); // Run ONCE on mount (and on unmount cleanup). Deps are handled via ref.

  return (
    <div className="relative w-full h-full bg-zinc-50 dark:bg-black overflow-hidden rounded-xl shadow-sm dark:shadow-none border border-zinc-200 dark:border-zinc-800 transition-colors duration-500">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
      {/* Glossy Overlay for "Screen" look - adapted for light mode */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] rounded-xl ring-1 ring-inset ring-black/5 dark:ring-white/10"></div>
    </div>
  );
};