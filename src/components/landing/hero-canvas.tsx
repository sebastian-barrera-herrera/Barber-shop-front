'use client';

import { useEffect, useRef } from 'react';
import type { ThemeTokens } from '@/lib/theme';

/**
 * Un solo objeto: un "canto rodado" cuyo material depende del negocio
 * (cerámica, latón cepillado, piedra, laca, seda). Gira despacio y se inclina hacia el cursor.
 * Se pausa fuera de pantalla y con la pestaña oculta. Se carga solo en el cliente.
 */
export default function HeroCanvas({
  material,
  accent,
  paper,
  onReady,
}: {
  material: ThemeTokens['material'];
  accent: string;
  paper: string;
  onReady?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      const { RoomEnvironment } =
        await import('three/examples/jsm/environments/RoomEnvironment.js');
      const { mergeVertices } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = material === 'metal' ? 1.1 : 0.95;
      el.appendChild(renderer.domElement);
      renderer.domElement.style.opacity = '0';
      renderer.domElement.style.transition = 'opacity 900ms cubic-bezier(0.22,1,0.36,1)';

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
      scene.environment = envTexture;

      const camera = new THREE.PerspectiveCamera(28, el.clientWidth / el.clientHeight, 0.1, 50);
      camera.position.set(0, 0, 7);

      // Geometría: esfera deformada con ruido suave y achatada → canto rodado.
      let geometry: import('three').BufferGeometry = new THREE.IcosahedronGeometry(1.35, 40);
      geometry.deleteAttribute('normal');
      geometry.deleteAttribute('uv');
      geometry = mergeVertices(geometry);
      const pos = geometry.getAttribute('position');
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).normalize();
        const n =
          0.09 * Math.sin(v.x * 2.1 + v.y * 1.3) +
          0.06 * Math.sin(v.y * 3.3 - v.z * 1.7 + 1.2) +
          0.035 * Math.sin(v.z * 5.1 + v.x * 2.4);
        v.multiplyScalar(1.35 * (1 + n));
        pos.setXYZ(i, v.x * 1.08, v.y * 0.8, v.z);
      }
      geometry.computeVertexNormals();

      const color = new THREE.Color(
        { ceramic: paper, metal: accent, stone: accent, lacquer: accent, silk: accent }[material],
      );
      if (material === 'ceramic') color.offsetHSL(0, -0.02, -0.06);
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        ...{
          ceramic: { roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 },
          metal: { metalness: 1, roughness: 0.3 },
          stone: { roughness: 0.92, metalness: 0 },
          lacquer: { roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 },
          silk: {
            roughness: 0.55,
            sheen: 1,
            sheenRoughness: 0.35,
            sheenColor: new THREE.Color('#fff2e8'),
          },
        }[material],
      });

      const mesh = new THREE.Mesh(geometry, mat);
      mesh.rotation.set(0.35, -0.4, 0.15);
      scene.add(mesh);

      const key = new THREE.DirectionalLight('#ffffff', 1.1);
      key.position.set(3, 4, 5);
      scene.add(key);

      // Interacción: inclinación suave hacia el cursor.
      const target = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
        target.y = (e.clientY / window.innerHeight - 0.5) * 0.35;
      };
      window.addEventListener('pointermove', onPointer, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      io.observe(el);
      const ro = new ResizeObserver(() => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(el);

      const clock = new THREE.Clock();
      let frame = 0;
      let first = true;
      const tick = () => {
        frame = requestAnimationFrame(tick);
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!visible || document.hidden) return;
        const t = clock.elapsedTime;
        mesh.rotation.y += dt * 0.12;
        mesh.rotation.x += (0.35 + target.y - mesh.rotation.x) * 0.04;
        mesh.rotation.z += (0.15 + target.x * 0.6 - mesh.rotation.z) * 0.04;
        mesh.position.y = Math.sin(t * 0.6) * 0.05;
        renderer.render(scene, camera);
        if (first) {
          first = false;
          renderer.domElement.style.opacity = '1';
          onReady?.();
        }
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onPointer);
        io.disconnect();
        ro.disconnect();
        geometry.dispose();
        mat.dispose();
        envTexture.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [material, accent, paper, onReady]);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}
