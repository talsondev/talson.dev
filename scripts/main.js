function initTechStackMarquee() {
    const marquee = document.querySelector("[data-tech-stack-marquee]");
    const track = document.querySelector("[data-tech-stack-track]");
    if (!marquee || !track) return;

    const originals = Array.from(track.children);
    if (!originals.length) return;

    const duplicateTimes = 2;
    for (let i = 0; i < duplicateTimes; i++) {
        originals.forEach((item) => {
            const clone = item.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            track.appendChild(clone);
        });
    }

    let running = true;
    let rafId = 0;
    const speed = 0.036;
    let lastTime = performance.now();
    let virtualOffset = 0;

    const cycleWidth = track.scrollWidth / (duplicateTimes + 1);

    function normalizeOffset(value) {
        if (cycleWidth <= 0) return 0;
        return ((value % cycleWidth) + cycleWidth) % cycleWidth;
    }

    function syncScrollFromVirtual() {
        marquee.scrollLeft = virtualOffset;
    }

    function tick(now) {
        const dt = now - lastTime;
        lastTime = now;

        if (running) {
            virtualOffset = normalizeOffset(virtualOffset + speed * dt);
            syncScrollFromVirtual();
        }

        rafId = requestAnimationFrame(tick);
    }

    marquee.addEventListener("mouseenter", () => {
        running = false;
    });

    marquee.addEventListener("mouseleave", () => {
        running = true;
        lastTime = performance.now();
    });

    marquee.addEventListener(
        "wheel",
        (event) => {
            const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
            if (delta === 0) return;
            event.preventDefault();
            running = false;
            virtualOffset = normalizeOffset(virtualOffset + delta);
            syncScrollFromVirtual();
        },
        { passive: false }
    );

    rafId = requestAnimationFrame(tick);

    window.addEventListener(
        "beforeunload",
        () => {
            if (rafId) cancelAnimationFrame(rafId);
        },
        { once: true }
    );
}

function initContactFlipCard() {
    const wrap = document.getElementById("contact-flip-wrap");
    const button = document.getElementById("contact-flip-button");
    const scene = document.getElementById("contact-flip-scene");
    const tilt = document.getElementById("contact-flip-tilt");
    const content = document.getElementById("contact-card-content");
    const glare = document.getElementById("contact-card-glare");
    if (!wrap || !button || !scene || !tilt || !content || !glare) return;

    const layers = Array.from(content.querySelectorAll("[data-depth]"));
    let isOpen = false;
    let isHovered = false;
    let rafId = 0;
    const state = { rx: 0, ry: 0, tx: 0, ty: 0 };

    const setOpen = (next) => {
        isOpen = next;
        wrap.classList.toggle("is-open", isOpen);
        button.classList.toggle("is-open", isOpen);
        button.setAttribute("aria-expanded", String(isOpen));
        if (!isOpen) {
            state.tx = 0;
            state.ty = 0;
        }
    };

    const animate = () => {
        state.rx += (state.tx - state.rx) * 0.14;
        state.ry += (state.ty - state.ry) * 0.14;

        const scale = isOpen && isHovered ? 1.1 : 1;
        tilt.style.transform = `scale(${scale}) rotateX(${state.rx}deg) rotateY(${state.ry}deg)`;

        layers.forEach((layer) => {
            const depth = Number(layer.getAttribute("data-depth")) || 0;
            const px = state.ry * (depth / 120);
            const py = -state.rx * (depth / 130);
            layer.style.transform = `translate3d(${px}px, ${py}px, ${depth}px)`;
        });

        const sx = -state.ry * 1.08;
        const sy = 18 + state.rx * 0.9;
        tilt.style.setProperty("--card-shadow-x", `${sx}px`);
        tilt.style.setProperty("--card-shadow-y", `${sy}px`);

        const gx = 50 + state.ry * 2.2;
        const gy = 50 - state.rx * 2.4;
        glare.style.setProperty("--glare-x", `${Math.max(0, Math.min(100, gx))}%`);
        glare.style.setProperty("--glare-y", `${Math.max(0, Math.min(100, gy))}%`);
        glare.style.opacity = isOpen ? "0.42" : "0.2";

        rafId = requestAnimationFrame(animate);
    };

    const updateTilt = (clientX, clientY) => {
        const rect = button.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        const dx = x - 0.5;
        const dy = y - 0.5;
        const baseY = isOpen ? 26 : 3;
        const baseX = isOpen ? 22 : 2.5;
        const diagonalMix = Math.abs(dx * dy) * 4;
        const horizontalDamp = 1 - Math.min(0.42, diagonalMix * 0.3);
        const verticalDamp = 1 - Math.min(0.16, diagonalMix * 0.12);
        state.tx = -dy * baseX * verticalDamp;
        state.ty = dx * baseY * horizontalDamp;
    };

    button.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLAnchorElement) return;
        setOpen(!isOpen);
    });

    button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(!isOpen);
        }
        if (event.key === "Escape") {
            setOpen(false);
        }
    });

    button.addEventListener("pointermove", (event) => {
        updateTilt(event.clientX, event.clientY);
    });

    button.addEventListener("pointerenter", () => {
        isHovered = true;
    });

    button.addEventListener("pointerleave", () => {
        isHovered = false;
        state.tx = 0;
        state.ty = 0;
    });

    document.addEventListener("click", (event) => {
        if (!isOpen) return;
        if (button.contains(event.target)) return;
        setOpen(false);
    });

    animate();

    window.addEventListener(
        "beforeunload",
        () => {
            if (rafId) cancelAnimationFrame(rafId);
        },
        { once: true }
    );
}

document.addEventListener("DOMContentLoaded", () => {
    initTechStackMarquee();
    initContactFlipCard();
});
