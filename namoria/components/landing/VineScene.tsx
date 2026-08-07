"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Imperative handle the scroll layer drives. */
export interface VineApi {
  /** 0 = seedlings at the base, 1 = tips meet at the trellis. */
  setProgress: (p: number) => void;
  /** true = the flower opens and the trellis lights up in the accent tone. */
  setBloom: (on: boolean) => void;
}

const PANEL_BG = 0x16241a;
// Trellis sits well below the top edge so the flower's petals open with
// headroom instead of being clipped at the top of the frame.
const TRELLIS_Y = 1.7;
const BASE_Y = -3.2;
const HEIGHT = TRELLIS_Y - BASE_Y;

// Cottagecore anchors (match app/globals.css tokens).
const NODE_COLORS = [0xa7b99a, 0x7c97a6, 0xd8a7a0, 0x9a8cb0];
const TRELLIS_CALM = new THREE.Color(0xcfe0c4);
const TRELLIS_BLOOM = new THREE.Color(0xe6b3d2);
const BLOOM_COLOR = new THREE.Color(0xc98bb0);

/** A point on one intertwining vine at parameter t in [0,1]. */
function vinePoint(t: number, phase: number, out: THREE.Vector3) {
  // Radius shrinks to ~0 at the top so both vines converge at the trellis.
  const radius = THREE.MathUtils.lerp(1.25, 0.04, t * t * (3 - 2 * t));
  const angle = t * Math.PI * 3 + phase;
  out.set(
    radius * Math.cos(angle),
    BASE_Y + t * HEIGHT,
    radius * Math.sin(angle) * 0.55,
  );
  return out;
}

/** Soft radial sprite so points read as luminous pollen, not hard dots. */
function makeGlowTexture(): THREE.Texture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function VineScene({
  apiRef,
  nodeCount = 90,
}: {
  apiRef: React.MutableRefObject<VineApi | null>;
  nodeCount?: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ---- Renderer / scene / camera ------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setClearColor(PANEL_BG, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.1, 7.2);
    camera.lookAt(0, 0.1, 0);

    const group = new THREE.Group();
    scene.add(group);

    const glow = makeGlowTexture();

    // ---- Stems (thin curved lines, two vines) -------------------------
    const SEG = 160;
    const stems: THREE.Line[] = [];
    for (let v = 0; v < 2; v++) {
      const phase = v * Math.PI;
      const pos = new Float32Array((SEG + 1) * 3);
      const tmp = new THREE.Vector3();
      for (let i = 0; i <= SEG; i++) {
        vinePoint(i / SEG, phase, tmp);
        pos.set([tmp.x, tmp.y, tmp.z], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x8fae86,
        transparent: true,
        opacity: 0.55,
      });
      const line = new THREE.Line(geo, mat);
      stems.push(line);
      group.add(line);
    }

    // ---- Nodes (buds / leaf tips) as glowing points -------------------
    const nodePos = new Float32Array(nodeCount * 3);
    const nodeCol = new Float32Array(nodeCount * 3);
    const nodeT = new Float32Array(nodeCount); // parametric height, for growth
    const tmp = new THREE.Vector3();
    const col = new THREE.Color();
    for (let i = 0; i < nodeCount; i++) {
      const v = i % 2;
      const t = Math.pow(i / (nodeCount - 1), 0.85); // denser near base
      // small jitter along the stem so nodes read as leaves, not beads
      const jitter = (Math.random() - 0.5) * 0.12;
      vinePoint(THREE.MathUtils.clamp(t + jitter, 0, 1), v * Math.PI, tmp);
      tmp.x += (Math.random() - 0.5) * 0.18;
      tmp.z += (Math.random() - 0.5) * 0.18;
      nodePos.set([tmp.x, tmp.y, tmp.z], i * 3);
      nodeT[i] = t;
      col.setHex(NODE_COLORS[i % NODE_COLORS.length]);
      nodeCol.set([col.r, col.g, col.b], i * 3);
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeCol, 3));
    const nodeMat = new THREE.PointsMaterial({
      size: 0.18,
      map: glow,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    group.add(nodes);

    // ---- Trellis (luminous horizontal line at the top) ----------------
    const trellisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.1, TRELLIS_Y, 0),
      new THREE.Vector3(3.1, TRELLIS_Y, 0),
    ]);
    const trellisMat = new THREE.LineBasicMaterial({
      color: TRELLIS_CALM.clone(),
      transparent: true,
      opacity: 0.6,
    });
    const trellis = new THREE.Line(trellisGeo, trellisMat);
    scene.add(trellis); // steady — not affected by the vine sway

    // ---- Flower (petals that open on bloom, at the meeting point) ------
    const PETALS = 12;
    const petalPos = new Float32Array(PETALS * 3);
    const petalDir: { x: number; y: number }[] = [];
    for (let i = 0; i < PETALS; i++) {
      const a = (i / PETALS) * Math.PI * 2;
      petalDir.push({ x: Math.cos(a), y: Math.sin(a) });
      petalPos.set([0, TRELLIS_Y, 0], i * 3);
    }
    const petalGeo = new THREE.BufferGeometry();
    petalGeo.setAttribute("position", new THREE.BufferAttribute(petalPos, 3));
    const petalMat = new THREE.PointsMaterial({
      size: 0.26,
      map: glow,
      color: BLOOM_COLOR.clone(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const flower = new THREE.Points(petalGeo, petalMat);
    scene.add(flower); // stays put at the trellis meeting point

    // ---- State + imperative API ---------------------------------------
    const state = { progress: reduced ? 1 : 0, bloom: reduced };
    let curProgress = state.progress;
    let bloomAmt = reduced ? 1 : 0;

    apiRef.current = {
      setProgress: (p) => {
        state.progress = THREE.MathUtils.clamp(p, 0, 1);
      },
      setBloom: (on) => {
        state.bloom = on;
      },
    };

    // ---- Resize -------------------------------------------------------
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---- Render loop --------------------------------------------------
    let raf = 0;
    const t0 = performance.now();
    // Keep sprouts visible even at rest (progress 0), so the panel is never bare.
    const GROWTH_FLOOR = 0.14;

    const applyGrowth = () => {
      const g = GROWTH_FLOOR + (1 - GROWTH_FLOOR) * curProgress;
      // Stems grow from the fixed base: only extend the visible draw range.
      const stemCount = Math.max(2, Math.round(g * (SEG + 1)));
      for (const s of stems) s.geometry.setDrawRange(0, stemCount);
      // Nodes appear once the growth front passes their height.
      let visible = 0;
      for (let i = 0; i < nodeCount; i++) if (nodeT[i] <= g) visible++;
      nodeGeo.setDrawRange(0, visible);
    };

    const render = () => {
      const t = (performance.now() - t0) / 1000;
      // Inertia: ease the growth front toward the target (body with weight).
      curProgress += (state.progress - curProgress) * 0.08;
      const target = state.bloom ? 1 : 0;
      bloomAmt += (target - bloomAmt) * 0.09;

      applyGrowth();

      // Gentle sway, like a plant with weight in the wind.
      if (!reduced) {
        group.rotation.y = Math.sin(t * 0.4) * 0.12;
        group.rotation.z = Math.sin(t * 0.32) * 0.02;
      }

      // Bloom feedback: trellis warms + brightens, petals open.
      trellisMat.color.copy(TRELLIS_CALM).lerp(TRELLIS_BLOOM, bloomAmt);
      trellisMat.opacity = 0.6 + bloomAmt * 0.4;
      petalMat.opacity = bloomAmt;
      const r = bloomAmt * 0.42;
      const p = flower.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      for (let i = 0; i < PETALS; i++) {
        p.setXYZ(
          i,
          petalDir[i].x * r,
          TRELLIS_Y + petalDir[i].y * r,
          0,
        );
      }
      p.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    // ---- Cleanup ------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      apiRef.current = null;
      glow.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      petalGeo.dispose();
      petalMat.dispose();
      trellisGeo.dispose();
      trellisMat.dispose();
      for (const s of stems) {
        s.geometry.dispose();
        (s.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [apiRef, nodeCount]);

  return <div ref={mountRef} className="h-full w-full" />;
}

export default VineScene;
