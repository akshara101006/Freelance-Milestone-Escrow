import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

declare global {
  interface Window {
    triggerMiraclePulse?: (type: string) => void;
  }
}

export const PreLoginBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, 12);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting setup (Verdant tones: luminous lime #bef264, emerald #10b981, chartreuse #a3e635)
    const ambient = new THREE.AmbientLight(0xd9f99d, 1.2);
    scene.add(ambient);

    const lightTop = new THREE.DirectionalLight(0xbef264, 3.8);
    lightTop.position.set(12, 16, 10);
    scene.add(lightTop);

    const lightBottom = new THREE.DirectionalLight(0x10b981, 3.2);
    lightBottom.position.set(-12, -14, -8);
    scene.add(lightBottom);

    const pointGlow = new THREE.PointLight(0xd9f99d, 8, 30);
    pointGlow.position.set(0, 0, 0);
    scene.add(pointGlow);

    const world = new THREE.Group();
    scene.add(world);

    // 1. THE MIRACLE SEED: Genesis Holographic Hyper-Core (Nested Multi-Geometry)
    const coreGroup = new THREE.Group();
    world.add(coreGroup);

    const innerIcoGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const innerIcoMat = new THREE.MeshPhongMaterial({
      color: 0x0f291e,
      emissive: 0x166534,
      specular: 0xbef264,
      shininess: 90,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });
    const innerIcoMesh = new THREE.Mesh(innerIcoGeo, innerIcoMat);
    coreGroup.add(innerIcoMesh);

    const innerWireGeo = new THREE.IcosahedronGeometry(1.24, 1);
    const innerWireMat = new THREE.MeshBasicMaterial({
      color: 0xbef264,
      wireframe: true,
      transparent: true,
      opacity: 0.95,
    });
    const innerWireMesh = new THREE.Mesh(innerWireGeo, innerWireMat);
    coreGroup.add(innerWireMesh);

    // Floating inner singularity gem
    const gemGeo = new THREE.OctahedronGeometry(0.65, 0);
    const gemMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const gemCore = new THREE.Mesh(gemGeo, gemMat);
    coreGroup.add(gemCore);

    // 2. THE MULTI-TIER CONSENSUS ORBITS (Validator Quorum Nodes & Smart Contract Shards)
    const custodianGroup = new THREE.Group();
    world.add(custodianGroup);

    const custodianNodes: { mesh: THREE.Mesh; angleOffset: number; r: number }[] = [];
    const custGeo = new THREE.BoxGeometry(0.55, 1.45, 0.28);
    const custEdges = new THREE.EdgesGeometry(custGeo);

    const custThemes = [
      { color: 0x14532d, emissive: 0x22c55e, wire: 0xbef264, label: 'Depositor Vault Bond' },
      { color: 0x064e3b, emissive: 0x10b981, wire: 0x6ee7b7, label: 'Beneficiary Settlement' },
      { color: 0x1c1917, emissive: 0x84cc16, wire: 0xa3e635, label: 'Oracle Arbiter Quorum' },
    ];

    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(
        custGeo,
        new THREE.MeshPhongMaterial({
          color: custThemes[i].color,
          emissive: custThemes[i].emissive,
          specular: 0xffffff,
          shininess: 95,
        })
      );
      mesh.add(
        new THREE.LineSegments(
          custEdges,
          new THREE.LineBasicMaterial({ color: custThemes[i].wire, linewidth: 2 })
        )
      );
      custodianGroup.add(mesh);
      custodianNodes.push({ mesh, angleOffset: (i * Math.PI * 2) / 3, r: 3.2 });
    }

    // 3. THE DISTRIBUTED LEDGER NETWORK: 12 Micro-Validators on complex orbital shells
    const microNodeGroup = new THREE.Group();
    world.add(microNodeGroup);

    const microNodes: {
      mesh: THREE.Mesh;
      radius: number;
      inclination: number;
      speed: number;
      seed: number;
    }[] = [];
    const numMicro = 12;
    const mGeo = new THREE.OctahedronGeometry(0.24, 0);
    const mEdge = new THREE.EdgesGeometry(mGeo);

    for (let i = 0; i < numMicro; i++) {
      const mMat = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x064e3b : 0x166534,
        emissive: i % 2 === 0 ? 0x10b981 : 0xbef264,
        shininess: 90,
      });
      const mMesh = new THREE.Mesh(mGeo, mMat);
      mMesh.add(new THREE.LineSegments(mEdge, new THREE.LineBasicMaterial({ color: 0xd9f99d })));
      microNodeGroup.add(mMesh);

      const inclination = (i / numMicro) * Math.PI - Math.PI / 2;
      const radius = 4.4 + Math.sin(i * 1.5) * 0.7;
      const speed = 0.5 + (i % 3) * 0.15;
      microNodes.push({ mesh: mMesh, radius, inclination, speed, seed: i * 1.2 });
    }

    // 4. NEURAL TRANSACTIONS & CRYPTOGRAPHIC LASER STREAMS
    const beamGroup = new THREE.Group();
    world.add(beamGroup);

    const laserLines: THREE.Line[] = [];
    for (let i = 0; i < 3; i++) {
      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ]);
      const beamMat = new THREE.LineDashedMaterial({
        color: i === 0 ? 0xbef264 : i === 1 ? 0x34d399 : 0xa3e635,
        dashSize: 0.22,
        gapSize: 0.12,
        linewidth: 2,
      });
      const line = new THREE.Line(beamGeo, beamMat);
      beamGroup.add(line);
      laserLines.push(line);
    }

    // Inter-validator mesh web: dynamic glowing synaptic links
    const webGeo = new THREE.BufferGeometry();
    const maxWebConnections = 18;
    const webPositions = new Float32Array(maxWebConnections * 2 * 3);
    webGeo.setAttribute('position', new THREE.BufferAttribute(webPositions, 3));
    const webMat = new THREE.LineBasicMaterial({
      color: 0xbef264,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const webMesh = new THREE.LineSegments(webGeo, webMat);
    world.add(webMesh);

    // 5. ASTRO-CRYPTOGRAPHIC CELESTIAL GIMBAL RINGS (Time-Lock & Multi-Sig Constraints)
    const ringGroup = new THREE.Group();
    world.add(ringGroup);

    const ringGeoA = new THREE.TorusGeometry(3.6, 0.035, 16, 100);
    const ringMatA = new THREE.MeshBasicMaterial({
      color: 0xbef264,
      transparent: true,
      opacity: 0.85,
    });
    const ringA = new THREE.Mesh(ringGeoA, ringMatA);
    ringGroup.add(ringA);

    const ringGeoB = new THREE.TorusGeometry(4.3, 0.03, 16, 100);
    const ringMatB = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.7,
    });
    const ringB = new THREE.Mesh(ringGeoB, ringMatB);
    ringB.rotation.x = Math.PI / 2.7;
    ringGroup.add(ringB);

    const ringGeoC = new THREE.TorusGeometry(5.2, 0.028, 16, 100);
    const ringMatC = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.55,
    });
    const ringC = new THREE.Mesh(ringGeoC, ringMatC);
    ringC.rotation.y = Math.PI / 3.2;
    ringGroup.add(ringC);

    // 6. MIRACLE CONSTELLATION: Stardust Consensus Cloud & Block Hash Sparks
    const pCount = 480;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pCols = new Float32Array(pCount * 3);
    const cLime = new THREE.Color(0xbef264);
    const cEmerald = new THREE.Color(0x10b981);
    const cMint = new THREE.Color(0xdcfce7);
    const cPureWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < pCount; i++) {
      const r = 2.6 + Math.random() * 5.6;
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI;
      pPos[i * 3] = r * Math.cos(ph) * Math.cos(th);
      pPos[i * 3 + 1] = r * Math.sin(ph);
      pPos[i * 3 + 2] = r * Math.cos(ph) * Math.sin(th);
      const rnd = Math.random();
      const c = rnd > 0.6 ? cLime : rnd > 0.3 ? cEmerald : rnd > 0.1 ? cMint : cPureWhite;
      pCols[i * 3] = c.r;
      pCols[i * 3 + 1] = c.g;
      pCols[i * 3 + 2] = c.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCols, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particleCloud = new THREE.Points(pGeo, pMat);
    world.add(particleCloud);

    // Drag rotation & interaction logic
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotX = 0.15;
    let rotY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        rotY += (e.clientX - prevX) * 0.0075;
        rotX += (e.clientY - prevY) * 0.0075;
        prevX = e.clientX;
        prevY = e.clientY;
      }
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('resize', onResize);

    window.triggerMiraclePulse = (type: string) => {
      if (type === 'consensus') {
        pointGlow.intensity = 15;
        innerWireMat.color.setHex(0xffffff);
        setTimeout(() => {
          pointGlow.intensity = 8;
          innerWireMat.color.setHex(0xbef264);
        }, 600);
      }
    };

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!isDragging) rotY += 0.0035;
      world.rotation.y += (rotY - world.rotation.y) * 0.07;
      world.rotation.x += (rotX - world.rotation.x) * 0.07;

      // 1. Core pulsing & organic breathing
      const pulse = 1.0 + Math.sin(t * 3.6) * 0.09;
      innerIcoMesh.scale.set(pulse, pulse, pulse);
      innerWireMesh.scale.set(pulse, pulse, pulse);
      innerIcoMesh.rotation.y = t * 0.4;
      innerIcoMesh.rotation.x = t * 0.25;
      innerWireMesh.rotation.y = -t * 0.3;
      gemCore.rotation.y = -t * 1.4;
      gemCore.rotation.z = t * 0.8;

      // 2. Custodian Shards Orbit & Lasers
      custodianNodes.forEach((node, idx) => {
        const angle = t * 0.75 + node.angleOffset;
        const yOsc = Math.sin(t * 1.8 + idx) * 0.55;
        const x = Math.cos(angle) * node.r;
        const z = Math.sin(angle) * node.r;
        node.mesh.position.set(x, yOsc, z);
        node.mesh.rotation.y = -angle;
        node.mesh.rotation.z = Math.sin(t * 2.0 + idx) * 0.2;

        const lPos = (laserLines[idx].geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array;
        lPos[0] = 0;
        lPos[1] = 0;
        lPos[2] = 0;
        lPos[3] = x;
        lPos[4] = yOsc;
        lPos[5] = z;
        laserLines[idx].geometry.attributes.position.needsUpdate = true;
        laserLines[idx].computeLineDistances();
      });

      // 3. Micro-validators orbiting across multi-inclination spheres
      microNodes.forEach((m, idx) => {
        const curAngle = t * m.speed + m.seed;
        const r = m.radius;
        const x = r * Math.cos(curAngle) * Math.cos(m.inclination);
        const y = r * Math.sin(curAngle) * Math.sin(m.inclination) + Math.sin(t * 2.2 + idx) * 0.3;
        const z = r * Math.sin(curAngle) * Math.cos(m.inclination);
        m.mesh.position.set(x, y, z);
        m.mesh.rotation.y = curAngle * 2;
        m.mesh.rotation.x = t * 1.5;
      });

      // 4. Update Dynamic Neural Synaptic Lines between micro-validators
      const wArr = webPositions;
      let lineIdx = 0;
      for (let i = 0; i < numMicro - 1 && lineIdx < maxWebConnections; i++) {
        const posA = microNodes[i].mesh.position;
        const posB = microNodes[(i + 3) % numMicro].mesh.position;
        const dist = posA.distanceTo(posB);
        if (dist < 4.8) {
          wArr[lineIdx * 6] = posA.x;
          wArr[lineIdx * 6 + 1] = posA.y;
          wArr[lineIdx * 6 + 2] = posA.z;
          wArr[lineIdx * 6 + 3] = posB.x;
          wArr[lineIdx * 6 + 4] = posB.y;
          wArr[lineIdx * 6 + 5] = posB.z;
          lineIdx++;
        }
      }
      webMesh.geometry.attributes.position.needsUpdate = true;

      // 5. Celestial Ring Rotations
      ringA.rotation.z = t * 0.35;
      ringB.rotation.z = -t * 0.45;
      ringB.rotation.x = Math.PI / 2.7 + Math.sin(t * 0.7) * 0.15;
      ringC.rotation.y = Math.PI / 3.2 + Math.cos(t * 0.6) * 0.2;

      // 6. Particle Cloud gentle orbital drift
      particleCloud.rotation.y = -t * 0.04;
      particleCloud.rotation.x = Math.sin(t * 0.02) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-0 bg-[#030705] overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />
      {/* Measured Radial Scrim so foreground UI typography maintains crisp readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(3, 7, 5, 0.32) 0%, rgba(3, 7, 5, 0.68) 65%, rgba(2, 5, 4, 0.88) 100%)',
        }}
      />
    </div>
  );
};
