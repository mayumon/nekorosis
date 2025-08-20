// js/about.js

const { Engine, Render, Runner, World, Bodies, Composite, Mouse, MouseConstraint } = Matter;

const box = document.getElementById('brick-box');
if (!box) {
    console.error('missing #brick-box');
}

const engine = Engine.create();
engine.gravity.y = 0.3;

const runner = Runner.create();

const rect = box.getBoundingClientRect();
const W = Math.max(100, rect.width);
const H = Math.max(100, rect.height);

// renderer
const render = Render.create({
    element: box,
    engine,
    options: {
        width: W,
        height: H,
        wireframes: false,
        background: 'transparent'
    }
});

// HUD
const hud = document.createElement('div');
Object.assign(hud.style, {
    position: 'absolute', top: '8px', left: '8px',
    background: 'rgba(0,0,0,0.6)', color: 'white', font: '12px monospace',
    padding: '6px 8px', border: '1px solid #fff', borderRadius: '4px',
    zIndex: '6', pointerEvents: 'none'
});
//box.appendChild(hud);

let frames = 0, lastT = performance.now();
Matter.Events.on(render, 'afterRender', () => { frames++; });

setInterval(() => {
    const now = performance.now();
    const dt = now - lastT;
    const fps = Math.round((frames * 1000) / dt);
    frames = 0; lastT = now;

    const bodies = Matter.Composite.allBodies(engine.world).length;
    const constraints = Matter.Composite.allConstraints(engine.world).length;
    const pairs = engine.pairs.list ? engine.pairs.list.length : 0;

    let buckets = 0;
    const bp = engine.broadphase || engine.grid || engine.world?.broadphase; // be defensive across versions
    if (bp && bp.buckets) buckets = Object.keys(bp.buckets).length;

    hud.textContent =
        `FPS ${fps}\n` +
        `bodies ${bodies}  constraints ${constraints}\n` +
        `pairs ${pairs}  buckets ${buckets}`;
}, 1000);


// banner
const MESSAGES = [
    "you're not helping...",
    "nOoOoOoOoOoOoOoOoOoOo",
    "the union will hear about this..."
];
let msgIndex = 0;
let lastShown = 0;
const COOLDOWN_MS = 5000;

const msgEl = document.createElement('div');
msgEl.id = 'wip-msg';
Object.assign(msgEl.style, {
    position: 'absolute',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '4px 8px',
    border: '1px solid white',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 250ms ease',
    zIndex: '5'
});
box.style.position = 'relative';
box.appendChild(msgEl);

let hideTimer = null;
function showBanner() {
    const now = Date.now();
    if (now - lastShown < COOLDOWN_MS) return;

    msgEl.textContent = MESSAGES[msgIndex];
    msgIndex = (msgIndex + 1) % MESSAGES.length;

    if (hideTimer) clearTimeout(hideTimer);
    msgEl.style.opacity = '1';
    hideTimer = setTimeout(() => (msgEl.style.opacity = '0'), 2000);

    lastShown = now;
}

function hideBannerNow() {
    if (hideTimer) clearTimeout(hideTimer);
    msgEl.style.opacity = '0';
}


// render
Render.run(render);
Runner.run(runner, engine);

// walls
const thickness = 30;
const floorOffset = 10;

const walls = [
    Bodies.rectangle(W/2, H-10-floorOffset, W, 20, { isStatic: true, render:{ fillStyle:'#000' } }),   // floor
    Bodies.rectangle(W/2, 10, W, 20, { isStatic: true, render:{ fillStyle:'#000' } }),     // ceiling
    Bodies.rectangle(10, H/2, 20, H, { isStatic: true, render:{ fillStyle:'#000' } }),     // left
    Bodies.rectangle(W-10, H/2, 20, H, { isStatic: true, render:{ fillStyle:'#000' } })    // right
];
World.add(engine.world, walls);

// guard walls
const guard = 200; // thickness
const guardWalls = [
    Bodies.rectangle(W/2, H + guard/2, W + guard*2, guard, { isStatic: true, render: { visible: false } }), // bottom
    Bodies.rectangle(W/2, -guard/2,     W + guard*2, guard, { isStatic: true, render: { visible: false } }), // top
    Bodies.rectangle(-guard/2, H/2,     guard, H + guard*2, { isStatic: true, render: { visible: false } }), // left
    Bodies.rectangle(W + guard/2, H/2,  guard, H + guard*2, { isStatic: true, render: { visible: false } })  // right
];
World.add(engine.world, guardWalls);


// bricks setup
const BRICK_W = 64;
const BRICK_H = 28;
const GAP_Y   = 6;

const dy = BRICK_H + GAP_Y;

const offsetX = -120;
const centerX = W / 2 + offsetX;

const y0 = 350;

const INNER_TOP    = 20;
const INNER_BOTTOM = H - 20 - floorOffset;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));


// pyramid
function spawnPyramid() {
    const rows = [1, 2, 3];

    const y0Min = INNER_TOP + BRICK_H/2;
    const y0Max = INNER_BOTTOM - BRICK_H/2 - (rows.length - 1) * dy;
    const yTop  = clamp(y0, y0Min, y0Max);

    rows.forEach((count, rowIndex) => {
        const totalWidth = count * BRICK_W;
        const startX = centerX - totalWidth / 2 + BRICK_W / 2;
        const rowY = yTop + rowIndex * dy;
        for (let i = 0; i < count; i++) {
            const x = startX + i * BRICK_W;
            const brick = Bodies.rectangle(x, rowY, BRICK_W, BRICK_H, {
                chamfer: { radius: 3 },
                restitution: 0.1,
                frictionAir: 0.02,
                render: { fillStyle: '#AA9174', strokeStyle: '#000', lineWidth: 1 },
                plugin: { isBrick: true }
            });
            World.add(engine.world, brick);
        }
    });
}


// castle
function spawnCastle() {
    // helper: centered row of N bricks, returns x of the leftmost brick
    function addRow(count, centerY) {
        const totalW = count * BRICK_W;
        const startX = centerX - totalW/2 + BRICK_W/2;
        for (let i = 0; i < count; i++) {
            const x = startX + i * BRICK_W;
            const brick = Bodies.rectangle(x, centerY, BRICK_W, BRICK_H, {
                chamfer: { radius: 3 },
                restitution: 0.05,
                friction: 0.8,
                frictionAir: 0.02,
                render: { fillStyle: '#AA9174', strokeStyle: '#000', lineWidth: 1 },
                plugin: { isBrick: true }
            });
            World.add(engine.world, brick);
        }
        return startX;
    }

    const triBase = BRICK_W;
    const R = triBase / Math.sqrt(3);        // circumradius
    const r = triBase / (2 * Math.sqrt(3));  // inradius
    const dy = BRICK_H + GAP_Y;

    const y0Min = INNER_TOP + BRICK_H/2 + dy + GAP_Y + (r + R);
    const y0Max = INNER_BOTTOM - BRICK_H/2 - dy;
    const yTop  = clamp(y0, y0Min, y0Max);

    const rowTopY = yTop;
    const rowBotY = yTop + dy;
    const startX  = addRow(3, rowTopY);
    addRow(3, rowBotY);

    const leftX  = startX;                 // col 0
    const rightX = startX + 2 * BRICK_W;   // col 2
    const singleY = yTop - dy;             // one level above the top row

    [leftX, rightX].forEach(x => {
        const brick = Bodies.rectangle(x, singleY, BRICK_W, BRICK_H, {
            chamfer: { radius: 3 },
            restitution: 0.05,
            friction: 0.8,
            frictionAir: 0.02,
            render: { fillStyle: '#AA9174', strokeStyle: '#000', lineWidth: 1 },
            plugin: { isBrick: true }
        });
        World.add(engine.world, brick);

        // triangle topper
        const triCenterY = singleY - BRICK_H/2 - GAP_Y - r;
        const triangle = Bodies.polygon(x, triCenterY, 3, R, {
            restitution: 0.05,
            friction: 0.8,
            frictionAir: 0.02,
            render: { fillStyle: '#AB747C', strokeStyle: '#000', lineWidth: 1 }
        });
        Matter.Body.setAngle(triangle, Math.PI / 2); // point up
        World.add(engine.world, triangle);
    });
}



// spawn
if (Math.random() < 1/33) {
    spawnCastle();
} else {
    spawnPyramid();
}


// drag
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});
World.add(engine.world, mouseConstraint);
render.mouse = mouse;


// banner listener
const { Events } = Matter;

Events.on(mouseConstraint, 'startdrag', (e) => {
    if (e.body && e.body.plugin && e.body.plugin.isBrick) {
        showBanner();
    }
});