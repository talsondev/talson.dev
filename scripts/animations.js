import { animate, inView, stagger } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm"

// Defer animation setup to avoid competing with initial WebGL rendering
// This gives the shader/renderer time to warm up first
function initializeAnimations() {
  console.log('[Motion Animations] Initializing at', Math.round(performance.now()), 'ms');

  const nameElement = document.getElementById("name");
  if (!nameElement) {
    console.log('[Motion Animations] name element not found');
    return;
  }

  nameElement.style.visibility = "visible";

  const text = nameElement.innerText;
  nameElement.innerHTML = text
    .split("")
    .map(char => `<span style="display: inline-block; opacity: 0;">${char}</span>`)
    .join("");

  const letters = nameElement.querySelectorAll("span");

  inView(nameElement, () => {
    console.log('[Motion Animations] Name animation triggered');
    animate(
      letters,
      { opacity: [0, 1], y: [20, 0] },
      { duration: 0.3, delay: stagger(0.05) }
    );
  }, { once: true });

  const elements = [
    document.getElementById("hero-h2"),
    document.getElementById("hero-p1"),
    document.getElementById("hero-p2"),
    document.getElementById("about"),
    document.getElementById("experience"),
    document.getElementById("tech-stack"),
    document.getElementById("projects")
  ];

  elements.forEach((el) => {
    if (el) {
      // Add will-change to hint browser about animations
      el.style.willChange = "opacity, transform";

      inView(el, (info) => {
        console.log('[Motion Animations] Element animation triggered:', el.id);
        animate(el,
          { opacity: [0, 1], y: [50, 0] },
          { duration: 0.5, delay: 0.5 }
        );
      }, { once: true });
    }
  });
}

// Defer animation initialization by 800ms to let WebGL render cycle start
// This prevents layout thrashing during initial frame renders
console.log('[Motion Animations] Scheduling initialization at 800ms');
setTimeout(() => {
  console.log('[Motion Animations] 800ms timer fired, calling initializeAnimations');
  initializeAnimations();
}, 800);
