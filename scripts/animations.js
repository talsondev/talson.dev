import { animate, scroll, inView } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm"

console.log("animations.js loaded")

const backdrop = document.getElementById("backdrop-box");
if (backdrop) {
    // Stable scroll lag model:
    // - velocity sets a target offset (follows scroll direction)
    // - single RAF loop eases toward target
    // - target decays back to zero so backdrop recenters predictably
    let targetOffset = 0;
    let currentOffset = Math.min(700, Math.max(260, window.innerHeight * 0.72));
    let filteredVelocity = 0;
    let rafId = 0;
    let introOpacity = 0;

    const maxOffset = 620;
    const velocityToOffset = 0.42;
    const velocitySmoothing = 0.11;
    const followLerpMoving = 0.055;
    const followLerpSettling = 0.16;
    const recenterDecayMoving = 0.992;
    const recenterDecaySettling = 0.78;
    const settleVelocityThreshold = 30;

    const tick = () => {
        const isSettling = Math.abs(filteredVelocity) < settleVelocityThreshold;
        targetOffset *= isSettling ? recenterDecaySettling : recenterDecayMoving;
        const followLerp = isSettling ? followLerpSettling : followLerpMoving;
        currentOffset += (targetOffset - currentOffset) * followLerp;
        introOpacity += (1 - introOpacity) * 0.065;
        backdrop.style.transform = `translateY(${currentOffset.toFixed(2)}px)`;
        backdrop.style.opacity = introOpacity.toFixed(3);
        rafId = requestAnimationFrame(tick);
    };

    scroll((progress, info) => {
        const velocity = info.y.velocity || 0;
        filteredVelocity += (velocity - filteredVelocity) * velocitySmoothing;
        const desired = -filteredVelocity * velocityToOffset;
        targetOffset = Math.max(-maxOffset, Math.min(maxOffset, desired));
    });

    rafId = requestAnimationFrame(tick);

    window.addEventListener(
        "beforeunload",
        () => {
            if (rafId) cancelAnimationFrame(rafId);
        },
        { once: true }
    );
}

const elements = [
    document.getElementById("hero-p"),
    document.getElementById("about"),
    document.getElementById("experience"),
    document.getElementById("tech-stack"),
    document.getElementById("projects")
];

// Loop through the array
elements.forEach((el) => {
    // Only run if the element actually exists on the page
    if (el) {
        inView(el, (info) => {
            animate(el, 
                { opacity: [0, 1], y: [50, 0] }, 
                { duration: 0.5, delay: 0.5 }
            );
        });
    }
});