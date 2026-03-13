import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LotConfig, LotType, StreetWidth, ZoningParams, DormerMode } from '../types.ts';

interface Visualizer3DProps {
  config: LotConfig;
  activeZoning: ZoningParams;
  calculations: any;
}

const Visualizer3D: React.FC<Visualizer3DProps> = ({ config, activeZoning, calculations }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2c3e50);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(config.width * 1.5, config.depth * 1.5, config.width * 1.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    const lotW = config.width;
    const lotD = config.depth;
    const isCorner = config.lotType === LotType.CORNER;
    const isWide = config.streetWidth === StreetWidth.WIDE;
    
    const rearYard = isCorner ? 0 : 30;
    const frontYard = activeZoning.fy || 0;
    const sideYard = activeZoning.sy || 0;
    const setback = (isWide ? 10 : 15);
    const streetWallH = activeZoning.b_max;
    const totalH = activeZoning.h;
    const fH = config.floorHeight;
    
    const buildW = lotW - (sideYard * 2);
    const buildD_max = lotD - rearYard - frontYard;
    const buildD_cov = lotD * calculations.maxCovPct;
    const buildD = Math.max(0, Math.min(buildD_max, buildD_cov));

    const groundGeo = new THREE.PlaneGeometry(lotW, lotD);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const lotEdges = new THREE.EdgesGeometry(groundGeo);
    const lotLine = new THREE.LineSegments(lotEdges, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true }));
    lotLine.rotation.x = -Math.PI / 2;
    scene.add(lotLine);

    const buildGroup = new THREE.Group();
    const zPosFront = lotD / 2 - frontYard;
    
    const floorLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });

    const addFloorOutline = (w: number, d: number, y: number, zOffset: number) => {
        const floorGeo = new THREE.PlaneGeometry(w, d);
        const edges = new THREE.EdgesGeometry(floorGeo);
        const line = new THREE.LineSegments(edges, floorLineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, y, zOffset);
        buildGroup.add(line);
    };

    if (buildW > 0 && buildD > 0) {
        const lowerGeo = new THREE.BoxGeometry(buildW, streetWallH, buildD);
        const lowerMat = new THREE.MeshPhongMaterial({ color: 0x0088bb, transparent: true, opacity: 0.7 });
        const lowerMesh = new THREE.Mesh(lowerGeo, lowerMat);
        lowerMesh.position.set(0, streetWallH / 2, zPosFront - buildD / 2);
        buildGroup.add(lowerMesh);

        const numBaseFloors = Math.floor(streetWallH / fH);
        for (let i = 1; i <= numBaseFloors; i++) {
            addFloorOutline(buildW, buildD, i * fH, zPosFront - buildD / 2);
        }

        const upperH = totalH - streetWallH;
        const upperD = Math.max(0, buildD - setback);
        if (upperH > 0 && upperD > 0) {
            const upperGeo = new THREE.BoxGeometry(buildW, upperH, upperD);
            const upperMat = new THREE.MeshPhongMaterial({ color: 0x0088bb, transparent: true, opacity: 0.4 });
            const upperMesh = new THREE.Mesh(upperGeo, upperMat);
            upperMesh.position.set(0, streetWallH + upperH / 2, zPosFront - setback - upperD / 2);
            buildGroup.add(upperMesh);

            const numSetbackFloors = Math.floor(upperH / fH);
            for (let i = 1; i <= numSetbackFloors; i++) {
                addFloorOutline(buildW, upperD, streetWallH + (i * fH), zPosFront - setback - upperD / 2);
            }
        }

        if (config.dormerMode !== DormerMode.NONE && upperH > 0) {
          const dormerMat = new THREE.MeshPhongMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.6 });
          const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5 });

          if (config.dormerMode === DormerMode.DORMER_40) {
            const dWidth = buildW * 0.4;
            const dormerGeo = new THREE.BoxGeometry(dWidth, upperH, setback);
            const dormerMesh = new THREE.Mesh(dormerGeo, dormerMat);
            dormerMesh.position.set(0, streetWallH + upperH / 2, zPosFront - setback / 2);
            buildGroup.add(dormerMesh);

            const dormerEdges = new THREE.EdgesGeometry(dormerGeo);
            const dormerLine = new THREE.LineSegments(dormerEdges, wireMat);
            dormerLine.position.copy(dormerMesh.position);
            buildGroup.add(dormerLine);
          } else if (config.dormerMode === DormerMode.DORMER_60) {
            const numFloorsAbove = Math.ceil(upperH / fH);
            for (let i = 0; i < numFloorsAbove; i++) {
              const currentFloorPct = 0.5 - (i * 0.1);
              if (currentFloorPct <= 0) break;
              const dWidth = buildW * currentFloorPct;
              const currentFloorH = Math.min(fH, upperH - (i * fH));
              if (currentFloorH <= 0) break;

              const dormerGeo = new THREE.BoxGeometry(dWidth, currentFloorH, setback);
              const dormerMesh = new THREE.Mesh(dormerGeo, dormerMat);
              dormerMesh.position.set(0, streetWallH + (i * fH) + (currentFloorH / 2), zPosFront - setback / 2);
              buildGroup.add(dormerMesh);

              const dormerEdges = new THREE.EdgesGeometry(dormerGeo);
              const dormerLine = new THREE.LineSegments(dormerEdges, wireMat);
              dormerLine.position.copy(dormerMesh.position);
              buildGroup.add(dormerLine);
            }
          }
        }
    }

    scene.add(buildGroup);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
      renderer.dispose();
    };
  }, [config, activeZoning, calculations]);

  return <div ref={mountRef} className="w-full h-full cursor-move" />;
};

export default Visualizer3D;