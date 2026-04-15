import { useEffect, useRef } from 'react';

// Check WebGL support without touching the main canvas
function isWebGLAvailable(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const ctx = testCanvas.getContext('webgl') || testCanvas.getContext('webgl2');
    if (!ctx) return false;
    const ext = (ctx as WebGLRenderingContext).getExtension?.('WEBGL_lose_context');
    if (ext) ext.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function CosmicCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!isWebGLAvailable()) return;

    let animId: number;
    let cleanupFns: (() => void)[] = [];

    const run = async () => {
      try {
        const THREE = await import('three');

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 80;

        const starCount = 2000;
        const starGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 400;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 200 - 50;
          const t = Math.random();
          if (t < 0.6) { colors[i*3]=0.9; colors[i*3+1]=0.95; colors[i*3+2]=1.0; }
          else if (t < 0.85) { colors[i*3]=0.0; colors[i*3+1]=0.83; colors[i*3+2]=1.0; }
          else { colors[i*3]=0.48; colors[i*3+1]=0.31; colors[i*3+2]=0.91; }
          sizes[i] = Math.random() * 2.5 + 0.3;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starMat = new THREE.ShaderMaterial({
          vertexShader: `
            attribute float size; attribute vec3 color;
            varying vec3 vColor; varying float vAlpha;
            void main() {
              vColor = color;
              vec4 mvp = modelViewMatrix * vec4(position, 1.0);
              vAlpha = clamp(1.0 - length(position.xy)/200.0, 0.0, 1.0);
              gl_PointSize = size*(300.0/-mvp.z);
              gl_Position = projectionMatrix*mvp;
            }
          `,
          fragmentShader: `
            varying vec3 vColor; varying float vAlpha;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if(d>0.5) discard;
              gl_FragColor = vec4(vColor, (1.0-smoothstep(0.1,0.5,d))*vAlpha*0.85);
            }
          `,
          transparent: true, vertexColors: true, depthWrite: false,
          blending: THREE.AdditiveBlending,
        });

        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);

        const nebulaCount = 300;
        const nebulaGeo = new THREE.BufferGeometry();
        const nebulaPos = new Float32Array(nebulaCount * 3);
        for (let i = 0; i < nebulaCount; i++) {
          const r = Math.random()*120+20, theta = Math.random()*Math.PI*2, phi = (Math.random()-0.5)*Math.PI;
          nebulaPos[i*3]=r*Math.cos(theta)*Math.cos(phi); nebulaPos[i*3+1]=r*Math.sin(phi)*0.4; nebulaPos[i*3+2]=r*Math.sin(theta)*Math.cos(phi)-80;
        }
        nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
        const nebula = new THREE.Points(nebulaGeo, new THREE.PointsMaterial({ color:0x7B4FE8, size:6, transparent:true, opacity:0.08, depthWrite:false, blending:THREE.AdditiveBlending }));
        scene.add(nebula);

        const lineGroup = new THREE.Group();
        for (let i = 0; i < 40; i++) {
          const x1=(Math.random()-0.5)*200, y1=(Math.random()-0.5)*100, z1=(Math.random()-0.5)*80-30;
          const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x1+(Math.random()-0.5)*60, y1+(Math.random()-0.5)*40, z1+(Math.random()-0.5)*20)]);
          lineGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color:0x00D4FF, transparent:true, opacity:Math.random()*0.08+0.02, blending:THREE.AdditiveBlending })));
        }
        scene.add(lineGroup);

        const onMouse = (e: MouseEvent) => { targetRef.current.x=(e.clientX/window.innerWidth-0.5)*2; targetRef.current.y=(e.clientY/window.innerHeight-0.5)*2; };
        const onResize = () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); };
        window.addEventListener('mousemove', onMouse);
        window.addEventListener('resize', onResize);
        cleanupFns.push(() => { window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize); renderer.dispose(); });

        let t = 0;
        const animate = () => {
          animId = requestAnimationFrame(animate);
          t += 0.001;
          mouseRef.current.x += (targetRef.current.x - mouseRef.current.x)*0.03;
          mouseRef.current.y += (targetRef.current.y - mouseRef.current.y)*0.03;
          camera.position.x = mouseRef.current.x*8;
          camera.position.y = -mouseRef.current.y*5;
          camera.lookAt(0,0,0);
          stars.rotation.y = t*0.05; stars.rotation.x = t*0.02;
          nebula.rotation.y = -t*0.03; lineGroup.rotation.y = t*0.04;
          renderer.render(scene, camera);
        };
        animate();
      } catch (err) {
        // Silently degrade — CSS background still shows
      }
    };

    run();

    return () => {
      cancelAnimationFrame(animId);
      cleanupFns.forEach(fn => fn());
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
    />
  );
}
