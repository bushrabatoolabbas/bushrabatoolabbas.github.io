const root = document.documentElement;
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const year = document.querySelector("#year");
const themeButtons = Array.from(document.querySelectorAll("[data-theme-value]"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const themes = new Set(["fortress", "aurora", "ember"]);

if (year) {
  year.textContent = String(new Date().getFullYear());
}

function readStoredTheme() {
  try {
    return localStorage.getItem("portfolio-theme");
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem("portfolio-theme", theme);
  } catch {
    // Theme persistence is a bonus; the switcher still works without storage.
  }
}

function setTheme(theme) {
  const nextTheme = themes.has(theme) ? theme : "fortress";
  root.dataset.theme = nextTheme;
  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeValue === nextTheme;
    button.setAttribute("aria-pressed", String(isActive));
  });
  storeTheme(nextTheme);
}

setTheme(readStoredTheme() || "fortress");

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(button.dataset.themeValue);
  });
});

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    }
  });
}

function getThemeRgb() {
  const value = getComputedStyle(root).getPropertyValue("--cursor-rgb").trim();
  return value || "15, 118, 110";
}

function startLiveBackground() {
  const canvas = document.querySelector("#live-background");
  if (!canvas || reducedMotion.matches) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.min(86, Math.max(34, Math.floor((width * height) / 18000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      size: 1.2 + Math.random() * 2.2
    }));
  }

  function draw() {
    const rgb = getThemeRgb();
    context.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(${rgb}, 0.34)`;
      context.fill();
    }

    for (let index = 0; index < particles.length; index += 1) {
      for (let next = index + 1; next < particles.length; next += 1) {
        const a = particles[index];
        const b = particles[next];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 132) {
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.strokeStyle = `rgba(${rgb}, ${(1 - distance / 132) * 0.2})`;
          context.lineWidth = 1;
          context.stroke();
        }
      }
    }

    animationFrame = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);

  reducedMotion.addEventListener("change", () => {
    cancelAnimationFrame(animationFrame);
    if (!reducedMotion.matches) {
      resize();
      draw();
    }
  });
}

function startCursorTrail() {
  if (reducedMotion.matches || window.matchMedia("(pointer: coarse)").matches) {
    return;
  }

  const dots = Array.from({ length: 14 }, (_, index) => {
    const dot = document.createElement("span");
    dot.className = "cursor-dot";
    dot.style.opacity = String(1 - index / 16);
    dot.style.scale = String(1 - index * 0.035);
    document.body.appendChild(dot);
    return { element: dot, x: -100, y: -100 };
  });

  let targetX = -100;
  let targetY = -100;
  let active = false;

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    active = true;
  });

  window.addEventListener("pointerleave", () => {
    active = false;
  });

  function animateTrail() {
    let x = targetX;
    let y = targetY;

    dots.forEach((dot, index) => {
      dot.x += (x - dot.x) * (index === 0 ? 0.45 : 0.28);
      dot.y += (y - dot.y) * (index === 0 ? 0.45 : 0.28);
      dot.element.style.opacity = active ? String(Math.max(0.12, 1 - index / 15)) : "0";
      dot.element.style.transform = `translate3d(${dot.x - 4}px, ${dot.y - 4}px, 0)`;
      x = dot.x;
      y = dot.y;
    });

    requestAnimationFrame(animateTrail);
  }

  animateTrail();
}

startLiveBackground();
startCursorTrail();
