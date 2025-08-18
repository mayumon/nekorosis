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

// pyramid setup
// === bricks setup (pyramid or rare castle) ===
const BRICK_W = 64;
const BRICK_H = 28;
const GAP_Y   = 6;

// small horizontal shift so it sits more to the left
const offsetX = -120;
const centerX = W / 2 + offsetX;

// start higher so everything "falls into place"
const y0 = 60;

// normal (inverted) pyramid like you have: 1 → 2 → 3 (top → bottom)
function spawnPyramid() {
    const rows = [1, 2, 3];
    rows.forEach((count, rowIndex) => {
        const totalWidth = count * BRICK_W;
        const startX = centerX - totalWidth / 2 + BRICK_W / 2;
        const rowY = y0 + rowIndex * (BRICK_H + GAP_Y);
        for (let i = 0; i < count; i++) {
            const x = startX + i * BRICK_W;
            const brick = Bodies.rectangle(x, rowY, BRICK_W, BRICK_H, {
                restitution: 0.1,
                frictionAir: 0.02,
                render: {
                    fillStyle: '#AA9174', // orange
                    strokeStyle: '#000',
                    lineWidth: 1
                }
            });
            World.add(engine.world, brick);
        }
    });
}


function spawnCastle() {
    // helper: add a centered row of N bricks, return x of the leftmost brick
    function addRow(count, centerY) {
        const totalW = count * BRICK_W;
        const startX = centerX - totalW/2 + BRICK_W/2;
        for (let i = 0; i < count; i++) {
            const x = startX + i * BRICK_W;
            const brick = Bodies.rectangle(x, centerY, BRICK_W, BRICK_H, {
                restitution: 0.05,
                friction: 0.3,
                frictionAir: 0.02,
                render: { fillStyle: '#AA9174', strokeStyle: '#000', lineWidth: 1 }
            });
            World.add(engine.world, brick);
        }
        return startX;
    }

    const dy = BRICK_H + GAP_Y;

    // Anchor lower so the singles + triangle aren't off-screen
    const yStart = y0 + 3 * dy;      // top 3-wide row
    const rowTopY = yStart;
    const rowBotY = yStart + dy;

    const leftColX = addRow(3, rowTopY);
    addRow(3, rowBotY);

    // two single bricks ABOVE those rows
    const single1Y = yStart - dy;      // above top row
    const single2Y = yStart - 2 * dy;  // above that
    [single1Y, single2Y].forEach(yc => {
        const brick = Bodies.rectangle(leftColX, yc, BRICK_W, BRICK_H, {
            restitution: 0.05,
            friction: 0.3,
            frictionAir: 0.02,
            render: { fillStyle: '#AA9174', strokeStyle: '#000', lineWidth: 1 }
        });
        World.add(engine.world, brick);
    });

    // red triangle topper
    const triBase = BRICK_W;
    const R = triBase / Math.sqrt(3);
    const r = triBase / (2 * Math.sqrt(3));
    const triCenterY = single2Y - BRICK_H/2 - GAP_Y - r;

    const triangle = Bodies.polygon(leftColX, triCenterY, 3, R, {
        restitution: 0.05,
        friction: 0.3,
        frictionAir: 0.02,
        render: { fillStyle: '#AB747C', strokeStyle: '#000', lineWidth: 1 }
    });

    Matter.Body.setAngle(triangle, Math.PI / 2);

    const origInertia = triangle.inertia;
    Matter.Body.setInertia(triangle, Infinity);
    World.add(engine.world, triangle);
    setTimeout(() => Matter.Body.setInertia(triangle, origInertia || 1), 800)
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
