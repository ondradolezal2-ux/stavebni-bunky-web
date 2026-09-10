/*
 * 3D model stavební buňky. Rozměry i materiály odpovídají technickému listu
 * ze stavebni-bunky.cz – vnější rozměr 4500 × 2500 × 2600 mm.
 * Zadní stěna chybí schválně, aby byl vidět vnitřek.
 */
(function () {
    const mount = document.getElementById('bunka-3d');
    if (!mount || typeof THREE === 'undefined') return;

    const D = { delka: 4.5, sirka: 2.5, vyska: 2.6 };
    const BARVA = {
        plast: 0xf1f1ee,   // panely KINGSPAN, RAL 9010
        ram: 0x3f4650,     // konstrukce v šedivé vrchní barvě
        strecha: 0xacb3ba,
        sklo: 0x24303d,
        podlaha: 0x8a6a4a, // lino
        skrin: 0x2f6fb0,   // šatní skříně
        nabytek: 0xa9784b
    };

    // Pár hlavních výhod, ukotvených na místo, kde na buňce jsou.
    const VYHODY = [
        { popis: 'KINGSPAN 40 mm',   bod: [-1.85, 2.0, 1.28] },
        { popis: 'Mříž v okně',      bod: [1.0, 1.78, 1.32] },
        { popis: 'Bezpečnostní zámek', bod: [-0.5, 1.15, 1.32] },
        { popis: 'Rám IPE 120',      bod: [-1.9, 0.06, 1.28] }
    ];

    // Model se neotáčí – díváme se na něj pořád ze stejného rohu. Úhel je
    // volený tak, aby bylo vidět podélnou stěnu i dovnitř otevřeným čelem.
    const UHEL = -0.8;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 2.1, 8.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    scene.add(new THREE.HemisphereLight(0xffffff, 0x30363d, 0.9));
    const slunce = new THREE.DirectionalLight(0xffffff, 0.85);
    slunce.position.set(2, 5, 9);
    scene.add(slunce);
    const doplnek = new THREE.DirectionalLight(0xffffff, 0.25);
    doplnek.position.set(-6, 3, -4);
    scene.add(doplnek);

    // Světlo uvnitř buňky, aby vybavení v řezu nezapadlo do stínu
    const uvnitr = new THREE.PointLight(0xfff2e0, 0.55, 8);
    uvnitr.position.set(0.8, 1.9, 0);

    const bunka = new THREE.Group();
    bunka.position.y = -1.25;
    scene.add(bunka);
    bunka.add(uvnitr);

    function hmota(barva) {
        return new THREE.MeshStandardMaterial({ color: barva, roughness: 0.82, metalness: 0.05 });
    }

    function kvadr(w, h, d, barva, x, y, z, obrys) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, hmota(barva));
        mesh.position.set(x, y, z);
        bunka.add(mesh);
        if (obrys !== false) {
            const hrany = new THREE.LineSegments(
                new THREE.EdgesGeometry(geo),
                new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.35 })
            );
            hrany.position.copy(mesh.position);
            bunka.add(hrany);
        }
        return mesh;
    }

    // --- Konstrukce ---------------------------------------------------------
    kvadr(D.delka, 0.12, D.sirka, BARVA.ram, 0, 0.06, 0);                       // rám IPE 120
    kvadr(D.delka - 0.1, 0.04, D.sirka - 0.1, BARVA.podlaha, 0, 0.14, 0, false); // podlaha / lino
    kvadr(D.delka + 0.1, 0.09, D.sirka + 0.1, BARVA.strecha, 0, 2.56, 0);        // trapézová střecha

    const vyskaSteny = 2.4;
    const stredSteny = 0.12 + vyskaSteny / 2;

    kvadr(D.delka, vyskaSteny, 0.04, BARVA.plast, 0, stredSteny, D.sirka / 2 - 0.02);   // přední
    kvadr(0.04, vyskaSteny, D.sirka, BARVA.plast, -D.delka / 2 + 0.02, stredSteny, 0);  // levá
    kvadr(D.delka, vyskaSteny, 0.04, BARVA.plast, 0, stredSteny, -D.sirka / 2 + 0.02);  // zadní

    // Pravé čelo se při výběru vybavení odkryje jako řez, ať je vidět dovnitř.
    const celoRez = kvadr(0.04, vyskaSteny, D.sirka, BARVA.plast, D.delka / 2 - 0.02, stredSteny, 0);
    celoRez.material.transparent = true;

    // Svislá profilace panelů KINGSPAN. Drážky na odkrývaném čele blednou
    // spolu s ním, jinak by v řezu zůstala viset mřížka pruhů.
    const drazka = new THREE.MeshStandardMaterial({ color: 0xd9d9d4, roughness: 0.9, metalness: 0.04 });
    const drazkaRez = new THREE.MeshStandardMaterial({ color: 0xd9d9d4, roughness: 0.9, metalness: 0.04, transparent: true });

    for (let x = -D.delka / 2 + 0.3; x < D.delka / 2 - 0.2; x += 0.3) {
        [-1, 1].forEach(sz => {
            const zebro = new THREE.Mesh(new THREE.BoxGeometry(0.02, vyskaSteny - 0.06, 0.012), drazka);
            zebro.position.set(x, stredSteny, sz * (D.sirka / 2 + 0.005));
            bunka.add(zebro);
        });
    }
    for (let z = -D.sirka / 2 + 0.3; z < D.sirka / 2 - 0.2; z += 0.3) {
        const leve = new THREE.Mesh(new THREE.BoxGeometry(0.012, vyskaSteny - 0.06, 0.02), drazka);
        leve.position.set(-(D.delka / 2 + 0.005), stredSteny, z);
        bunka.add(leve);

        const prave = new THREE.Mesh(new THREE.BoxGeometry(0.012, vyskaSteny - 0.06, 0.02), drazkaRez);
        prave.position.set(D.delka / 2 + 0.005, stredSteny, z);
        bunka.add(prave);
    }

    // Trapézové vlny na střeše
    const trapez = new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: 0.85, metalness: 0.1 });
    for (let x = -D.delka / 2; x < D.delka / 2; x += 0.22) {
        const vlna = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, D.sirka + 0.08), trapez);
        vlna.position.set(x, 2.62, 0);
        bunka.add(vlna);
    }

    [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
        kvadr(0.1, vyskaSteny, 0.1, BARVA.ram, sx * (D.delka / 2 - 0.05), stredSteny, sz * (D.sirka / 2 - 0.05));
    }));

    // Dveře JANSEN
    kvadr(0.9, 2.0, 0.06, BARVA.ram, -0.85, 1.12, D.sirka / 2);
    kvadr(0.06, 0.18, 0.06, 0xd8dde2, -0.48, 1.1, D.sirka / 2 + 0.04, false);

    // Okno 900 × 900 s pevnou mříží
    kvadr(0.9, 0.9, 0.05, BARVA.sklo, 1.0, 1.75, D.sirka / 2);
    for (let i = 0; i < 4; i++) {
        kvadr(0.035, 0.86, 0.03, BARVA.ram, 0.66 + i * 0.23, 1.75, D.sirka / 2 + 0.04, false);
    }

    // Závěsná oka (U100) – nahoře na podélných stěnách, kvůli převozu jeřábem
    [-1, 1].forEach(sz => [-1.75, 1.75].forEach(x => {
        kvadr(0.22, 0.1, 0.06, BARVA.ram, x, 2.48, sz * (D.sirka / 2 + 0.03), false);
        kvadr(0.05, 0.16, 0.06, BARVA.ram, x - 0.085, 2.42, sz * (D.sirka / 2 + 0.03), false);
        kvadr(0.05, 0.16, 0.06, BARVA.ram, x + 0.085, 2.42, sz * (D.sirka / 2 + 0.03), false);
    }));

    // --- Vybavení (jen naznačené) -------------------------------------------
    const vybaveni = {
        kancelar: new THREE.Group(),
        satna: new THREE.Group(),
        sklad: new THREE.Group()
    };
    Object.values(vybaveni).forEach(g => { g.visible = false; bunka.add(g); });

    function blok(skupina, w, h, d, barva, x, y, z) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, hmota(barva));
        mesh.position.set(x, y, z);
        skupina.add(mesh);
    }

    // Vybavení stavíme do poloviny u otevřeného čela, jinak by ho zakryla stěna.
    // Kancelář: stůl, židle, skříňka
    blok(vybaveni.kancelar, 1.5, 0.07, 0.7, BARVA.nabytek, 0.9, 0.78, -0.72);
    blok(vybaveni.kancelar, 0.08, 0.62, 0.08, BARVA.ram, 0.25, 0.45, -0.72);
    blok(vybaveni.kancelar, 0.08, 0.62, 0.08, BARVA.ram, 1.55, 0.45, -0.72);
    blok(vybaveni.kancelar, 0.5, 0.07, 0.5, BARVA.ram, 0.9, 0.48, 0.15);
    blok(vybaveni.kancelar, 0.5, 0.55, 0.07, BARVA.ram, 0.9, 0.78, 0.38);
    blok(vybaveni.kancelar, 0.75, 1.7, 0.42, BARVA.nabytek, 1.85, 1.02, 0.85);

    // Šatna: skříně a lavice
    for (let i = 0; i < 4; i++) {
        blok(vybaveni.satna, 0.42, 1.8, 0.5, BARVA.skrin, 0.35 + i * 0.5, 1.07, -0.85);
    }
    blok(vybaveni.satna, 1.8, 0.08, 0.36, BARVA.nabytek, 1.1, 0.5, 0.55);
    blok(vybaveni.satna, 0.08, 0.34, 0.34, BARVA.ram, 0.35, 0.31, 0.55);
    blok(vybaveni.satna, 0.08, 0.34, 0.34, BARVA.ram, 1.85, 0.31, 0.55);

    // --- Šipky s popisky ----------------------------------------------------
    const vrstva = document.createElement('div');
    vrstva.className = 'model-hotspots';
    mount.appendChild(vrstva);

    const hotspoty = VYHODY.map(v => {
        const prvek = document.createElement('div');
        prvek.className = 'hotspot';
        prvek.innerHTML = '<span class="hotspot-dot"></span><span class="hotspot-label"></span>';
        prvek.querySelector('.hotspot-label').textContent = v.popis;
        vrstva.appendChild(prvek);
        return { prvek: prvek, bod: new THREE.Vector3().fromArray(v.bod) };
    });

    const _bod = new THREE.Vector3();

    function prekresliHotspoty(sirka, vyska) {
        hotspoty.forEach(h => {
            _bod.copy(h.bod).applyMatrix4(bunka.matrixWorld).project(camera);
            const x = (_bod.x * 0.5 + 0.5) * sirka;
            const y = (-_bod.y * 0.5 + 0.5) * vyska;
            h.prvek.classList.add('is-visible');
            h.prvek.classList.toggle('is-left', x > sirka * 0.55);
            h.prvek.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        });
    }

    // --- Stav ---------------------------------------------------------------
    bunka.rotation.y = UHEL;
    bunka.updateMatrixWorld();

    let cilovaPruhlednost = 1;

    function nastavVyuziti(klic) {
        Object.keys(vybaveni).forEach(k => { vybaveni[k].visible = k === klic && k !== 'sklad'; });
        // U prázdného skladu není do čeho koukat, čelo tedy necháme celé.
        cilovaPruhlednost = klic === 'sklad' ? 1 : 0;
    }

    // --- Smyčka -------------------------------------------------------------
    let posledniSirka = 0;
    let posledniVyska = 0;

    function zmerPlochu() {
        const sirka = mount.clientWidth;
        const vyska = mount.clientHeight;
        if (sirka !== posledniSirka || vyska !== posledniVyska) {
            posledniSirka = sirka;
            posledniVyska = vyska;
            renderer.setSize(sirka, vyska, false);
            camera.aspect = sirka / vyska || 1;
            camera.updateProjectionMatrix();
        }
        return [sirka, vyska];
    }

    let bezi = true;
    const pozorovatel = new IntersectionObserver(zaznamy => {
        bezi = zaznamy[0].isIntersecting;
    }, { threshold: 0.05 });
    pozorovatel.observe(mount);

    function snimek() {
        requestAnimationFrame(snimek);
        if (!bezi || !mount.offsetParent) return;

        const [sirka, vyska] = zmerPlochu();
        if (!sirka || !vyska) return;

        const rozdil = cilovaPruhlednost - celoRez.material.opacity;
        if (Math.abs(rozdil) > 0.002) {
            celoRez.material.opacity += rozdil * 0.12;
            drazkaRez.opacity = celoRez.material.opacity;
        }

        prekresliHotspoty(sirka, vyska);
        renderer.render(scene, camera);
    }

    requestAnimationFrame(snimek);
    mount.classList.add('is-ready');

    window.bunkaModel = { nastavVyuziti: nastavVyuziti };

    // Vybavení srovnáme s tím, co je zrovna navolené na stránce.
    const zvolene = document.querySelector('.use-tab[aria-pressed="true"]');
    nastavVyuziti(zvolene ? zvolene.dataset.use : 'kancelar');
    celoRez.material.opacity = cilovaPruhlednost;
    drazkaRez.opacity = cilovaPruhlednost;
})();
