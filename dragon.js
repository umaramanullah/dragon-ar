/* Original low-poly dragon built from primitives. Works with any three.js r120+.
   buildDragon(THREE) -> { object, update(t, dt), breathe() }
   Local frame: +z forward, +y up. Fits roughly inside a 1 x 1 unit marker. */
function buildDragon(THREE) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .5, metalness: .2, flatShading: true }, o || {}));
  const SKIN = mat(0x17885a), DARK = mat(0x0d5638), BELLY = mat(0xe9b949, { metalness: .4, roughness: .35 });
  const BONE = mat(0xf2e6c4, { roughness: .4, metalness: .05 });
  const WING = mat(0x22b673, { side: THREE.DoubleSide, roughness: .75, metalness: 0, emissive: 0x062a18 });
  const EYE = new THREE.MeshBasicMaterial({ color: 0xffc21a });

  const ell = (rx, ry, rz, m, seg) => { seg = seg || 12; const s = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.max(6, seg * .7 | 0)), m); s.scale.set(rx, ry, rz); return s; };
  const cone = (r, h, m, seg) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 5), m);
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const bone = (a, b, r, m) => {
    const d = b.clone().sub(a), len = d.length();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r * .7, r, len, 6), m);
    c.position.copy(a).addScaledVector(d, .5);
    c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    return c;
  };
  const sail = (pts, m) => {
    const p = [];
    for (let i = 1; i < pts.length - 1; i++) [pts[0], pts[i], pts[i + 1]].forEach(v => p.push(v.x, v.y, v.z));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.computeVertexNormals();
    return new THREE.Mesh(g, m);
  };
  const spike = (parent, x, y, z, s) => { const c = cone(.028 * s, .09 * s, BONE, 4); c.rotation.x = -.5; parent.add(at(c, x, y, z)); };

  const object = new THREE.Group();      // sits on the marker
  const flyer = new THREE.Group();       // moves around the circle
  const rig = new THREE.Group();         // bob + bank
  object.add(flyer); flyer.add(rig);

  // soft shadow on the marker
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.32, 32), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .3, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .003; object.add(shadow);

  // torso
  rig.add(ell(.16, .15, .3, SKIN));
  rig.add(at(ell(.13, .115, .27, BELLY), 0, -.045, .01));
  for (let i = 0; i < 5; i++) spike(rig, 0, .14 - Math.abs(i - 2) * .006, -.2 + i * .1, 1.1);

  // neck chain
  let link = at(new THREE.Group(), 0, .06, .24); rig.add(link);
  const neck = [];
  for (let i = 0; i < 4; i++) {
    const g = at(new THREE.Group(), 0, 0, i ? .075 : 0); g.rotation.x = -.3;
    g.add(at(ell(.075 - i * .006, .075 - i * .006, .07), 0, 0, .035));
    g.children[0].material = SKIN;
    spike(g, 0, .065, .03, .8);
    link.add(g); link = g; neck.push(g);
  }

  // head
  const head = at(new THREE.Group(), 0, 0, .085); head.rotation.x = 1.0; link.add(head);
  head.add(at(ell(.09, .075, .1, SKIN), 0, 0, .04));
  head.add(at(ell(.062, .045, .095, SKIN), 0, -.005, .14));
  head.add(at(ell(.05, .022, .08, DARK), 0, .035, .1));
  const jaw = at(new THREE.Group(), 0, -.035, .06); head.add(jaw);
  jaw.add(at(ell(.052, .022, .09, BELLY), 0, -.01, .07));
  for (let i = 0; i < 4; i++) { const t = cone(.008, .025, BONE, 4); t.rotation.x = Math.PI; head.add(at(t, (i % 2 ? 1 : -1) * .035, -.045, .1 + (i >> 1) * .05)); }
  [-1, 1].forEach(s => {
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), EYE), s * .056, .03, .085));
    const h = cone(.024, .17, BONE, 5); h.rotation.set(-1.05, 0, -s * .3); head.add(at(h, s * .05, .07, -.04));
    const h2 = cone(.014, .08, BONE, 4); h2.rotation.set(-1.3, 0, -s * .9); head.add(at(h2, s * .08, .01, 0));
  });
  const mouth = at(new THREE.Object3D(), 0, -.03, .24); head.add(mouth);

  // tail chain
  const tail = [];
  link = at(new THREE.Group(), 0, 0, -.25); link.rotation.x = -.12; rig.add(link);
  for (let k = 0; k < 10; k++) {
    const r = .11 * (1 - k / 11.5), len = .085;
    const g = at(new THREE.Group(), 0, 0, k ? -len : 0);
    g.add(at(ell(r, r * .95, len * .75, SKIN, 8), 0, 0, -len / 2));
    if (k % 2 === 0) spike(g, 0, r * .9, -len / 2, .9 - k * .06);
    link.add(g); link = g; tail.push(g);
  }
  const spade = at(ell(.07, .012, .07, BONE, 4), 0, 0, -.11); spade.rotation.y = Math.PI / 4; link.add(spade);

  // tucked legs
  [[1, .17], [-1, .17], [1, -.17], [-1, -.17]].forEach(([s, z]) => {
    const hip = at(new THREE.Group(), s * .11, -.07, z); hip.rotation.x = .7; rig.add(hip);
    hip.add(at(ell(.055, .075, .065, SKIN, 8), 0, -.02, 0));
    hip.add(at(ell(.032, .08, .032, DARK, 6), 0, -.11, .01));
    hip.add(at(ell(.04, .018, .055, DARK, 6), 0, -.18, .035));
    for (let c = -1; c <= 1; c++) { const k = cone(.009, .04, BONE, 4); k.rotation.x = Math.PI / 2; hip.add(at(k, c * .022, -.185, .09)); }
  });

  // wings: shoulder pivot (inner sail) + elbow pivot (finger sail). Shared edges lie on the z axis of each pivot, so the sails never tear.
  const wings = [-1, 1].map(s => {
    const sh = at(new THREE.Group(), s * .12, .1, .1); rig.add(sh);
    const E = V(s * .4, 0, 0);
    sh.add(bone(V(0, 0, 0), E, .022, DARK));
    sh.add(sail([V(0, 0, 0), E, V(s * .4, 0, -.34), V(0, 0, -.4)], WING));
    const el = at(new THREE.Group(), E.x, 0, 0); sh.add(el);
    el.add(at(new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 5), DARK), 0, 0, 0));
    const thumb = cone(.012, .06, BONE, 4); thumb.rotation.z = -s * Math.PI / 2; el.add(at(thumb, s * .03, .01, .02));
    const tips = [[.12, .5], [.6, .44], [1.05, .36]].map(([a, L]) => V(s * Math.cos(a) * L, 0, -Math.sin(a) * L));
    tips.forEach(t => el.add(bone(V(0, 0, 0), t, .012, DARK)));
    const scal = (a, b) => a.clone().add(b).multiplyScalar(.5).multiplyScalar(.78);
    el.add(sail([V(0, 0, 0), tips[0], scal(tips[0], tips[1]), tips[1], scal(tips[1], tips[2]), tips[2], V(0, 0, -.34)], WING));
    return { s, sh, el };
  });

  // fire particles
  const fx = new THREE.Group(); object.add(fx);
  const parts = [];
  for (let i = 0; i < 46; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 5), new THREE.MeshBasicMaterial({ color: 0xffa21a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.visible = false; m.userData = { life: 0, v: V(0, 0, 0) }; fx.add(m); parts.push(m);
  }
  let fireUntil = -1, nextFire = 3, pi = 0, emitAcc = 0;
  const tmp = V(0, 0, 0), dir = V(0, 0, 0), q = new THREE.Quaternion(), fxq = new THREE.Quaternion();
  const breathe = () => { fireUntil = clock + 1.6; };
  let clock = 0;

  const update = (t, dt) => {
    dt = Math.min(dt || .016, .05); clock = t;
    const w = 5.2, f = Math.sin(t * w);
    // flight path
    const R = .34, a = t * .45;
    flyer.position.set(R * Math.cos(a), .62, R * Math.sin(a));
    flyer.rotation.y = -a;
    rig.position.y = -.035 * f;
    rig.rotation.z = .22 + .03 * Math.sin(t * 1.3);
    rig.rotation.x = .05 * Math.sin(t * w + 1);
    shadow.position.x = flyer.position.x; shadow.position.z = flyer.position.z;
    shadow.scale.setScalar(.9 + .1 * f);
    // wings
    wings.forEach(({ s, sh, el }) => {
      sh.rotation.z = s * (.15 + .62 * f);
      el.rotation.z = s * (.12 + .5 * Math.sin(t * w - .7));
      sh.rotation.y = s * .12 * Math.sin(t * w + .4);
    });
    // tail + neck
    tail.forEach((g, k) => { g.rotation.y = .16 * Math.sin(t * 1.8 - k * .55); g.rotation.x = (k ? .03 : -.12) + .05 * Math.sin(t * 2.1 - k * .4); });
    neck.forEach((g, i) => { g.rotation.y = .1 * Math.sin(t * .7 + i * .3); });

    // fire
    if (t > nextFire && fireUntil < t) { breathe(); nextFire = t + 6.5; }
    const firing = t < fireUntil;
    jaw.rotation.x += ((firing ? .55 : .05) - jaw.rotation.x) * Math.min(1, dt * 10);
    if (firing) {
      emitAcc += dt * 60;
      object.updateMatrixWorld(true);
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const p = parts[pi++ % parts.length];
        mouth.getWorldPosition(tmp); fx.worldToLocal(p.position.copy(tmp));
        // mouth direction in world space, then into fx space
        dir.set((Math.random() - .5) * .35, (Math.random() - .5) * .35, 1).applyQuaternion(mouth.getWorldQuaternion(q));
        dir.applyQuaternion(fx.getWorldQuaternion(fxq).invert()).normalize();
        p.userData.v.copy(dir).multiplyScalar(.55 + Math.random() * .25);
        p.userData.life = 0; p.visible = true;
      }
    }
    parts.forEach(p => {
      if (!p.visible) return;
      const u = p.userData; u.life += dt;
      const k = u.life / .55;
      if (k >= 1) { p.visible = false; p.material.opacity = 0; return; }
      p.position.addScaledVector(u.v, dt);
      u.v.y += dt * .25;
      p.scale.setScalar(.012 + k * .05);
      p.material.opacity = (1 - k) * .9;
      p.material.color.setHSL(.12 - k * .11, 1, .6 - k * .2);
    });
  };

  return { object, update, breathe };
}
if (typeof module !== 'undefined') module.exports = buildDragon;
