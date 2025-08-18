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
const BRICK_W = 64;
const BRICK_H = 28;
const rows = [1,2,3];
let y = 60;

rows.forEach((count, rowIndex) => {
    const totalWidth = count * BRICK_W;
    const offsetX = -120;
    const startX = (W - totalWidth) / 2 + BRICK_W / 2 + offsetX;
    const rowY = y + rowIndex * (BRICK_H + 6);
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

// drag
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});
World.add(engine.world, mouseConstraint);
render.mouse = mouse;
