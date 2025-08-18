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
                render: { fillStyle: '#AA9174', strokeStyle: '#000', lineWidth: 1 }
            });
            World.add(engine.world, brick);
        }
    });
}


// castle
function spawnCastle() {
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
                render: { fillStyle: '#AA9174', strokeStyle: '#000', lineWidth: 1 }
            });
            World.add(engine.world, brick);
        }
        return startX;
    }

    // triangle topper
    const triBase = BRICK_W;
    const R = triBase / Math.sqrt(3);
    const r = triBase / (2 * Math.sqrt(3));

    const y0Min = INNER_TOP + 2*dy + BRICK_H/2 + GAP_Y + r;
    const y0Max = INNER_BOTTOM - BRICK_H/2 - dy;
    const yTop  = clamp(y0, y0Min, y0Max);

    const rowTopY = yTop;
    const rowBotY = yTop + dy;
    const leftColX = addRow(3, rowTopY);
    addRow(3, rowBotY);

    const single1Y = yTop - dy;
    const single2Y = yTop - 2*dy;
    [single1Y, single2Y].forEach(yc => {
        const brick = Bodies.rectangle(leftColX, yc, BRICK_W, BRICK_H, {
            chamfer: { radius: 3 },
            restitution: 0.05,
            friction: 0.8,
            frictionAir: 0.02,
            render: { fillStyle: '#AA9174', strokeStyle: '#000', lineWidth: 1 }
        });
        World.add(engine.world, brick);
    });

    const triCenterY = single2Y - BRICK_H/2 - GAP_Y - r;
    const triangle = Bodies.polygon(leftColX, triCenterY, 3, R, {
        restitution: 0.05,
        friction: 0.8,
        frictionAir: 0.02,
        render: { fillStyle: '#AB747C', strokeStyle: '#000', lineWidth: 1 }
    });
    Matter.Body.setAngle(triangle, Math.PI / 2);

    const origInertia = triangle.inertia;
    Matter.Body.setInertia(triangle, Infinity);
    World.add(engine.world, triangle);
    setTimeout(() => Matter.Body.setInertia(triangle, origInertia || 1), 800);
}


// spawn
if (Math.random() < 1/20) {
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
