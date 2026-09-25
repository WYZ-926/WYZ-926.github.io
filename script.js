const body = document.body;
const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const navLinks = navigation ? [...navigation.querySelectorAll('a[href^="#"]')] : [];

const setActiveNav = (id) => {
  navLinks.forEach((link) => {
    if (link.hash === `#${id}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const closeMenu = () => {
  body.classList.remove("nav-open");
  menuToggle?.setAttribute("aria-expanded", "false");
};

menuToggle?.addEventListener("click", () => {
  const isOpen = body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navigation?.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (link?.hash) {
    setActiveNav(link.hash.slice(1));
    closeMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    menuToggle?.focus();
  }
});

document.addEventListener("click", (event) => {
  if (body.classList.contains("nav-open") && !event.target.closest(".site-header")) {
    closeMenu();
  }
});

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 16);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const navSections = document.querySelectorAll("[data-nav-section]");

if ("IntersectionObserver" in window && navSections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => Math.abs(first.boundingClientRect.top) - Math.abs(second.boundingClientRect.top))[0];

      if (current) {
        setActiveNav(current.target.id);
      }
    },
    { rootMargin: "-38% 0px -52% 0px", threshold: 0 },
  );

  navSections.forEach((section) => sectionObserver.observe(section));
}

const revealItems = document.querySelectorAll(".reveal");
const showRevealItems = () => {
  revealItems.forEach((item) => item.classList.add("is-visible"));
};

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  showRevealItems();
}

requestAnimationFrame(showRevealItems);
window.setTimeout(showRevealItems, 1200);

const canTilt = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");

document.querySelectorAll("[data-tilt]").forEach((element) => {
  const scene = element.querySelector(".planet-scene");

  if (!scene || !canTilt.matches) {
    return;
  }

  let frame;

  element.addEventListener("pointermove", (event) => {
    if (frame) {
      cancelAnimationFrame(frame);
    }

    frame = requestAnimationFrame(() => {
      const bounds = element.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
      const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

      scene.style.setProperty("--tilt-y", `${horizontal * 10}deg`);
      scene.style.setProperty("--tilt-x", `${vertical * -10}deg`);
    });
  });

  element.addEventListener("pointerleave", () => {
    scene.style.setProperty("--tilt-y", "0deg");
    scene.style.setProperty("--tilt-x", "0deg");
  });
});

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const starfield = document.querySelector("#starfield");
const surpriseMessage = document.querySelector("#surprise-message");
const starfieldContext = starfield?.getContext("2d");

if (starfield && starfieldContext && surpriseMessage) {
  const context = starfieldContext;
  const starColors = ["#71806c", "#df8f76", "#8f8aa6", "#20231f"];
  const surpriseMessages = [
    "抓到一顆星星，送給閃亮的你",
    "今天也值得被喜歡",
    "許個願望吧",
    "這顆星星為你停留",
    "你的努力正在發光",
    "收集到一點點好運氣",
    "悄悄話：一切都會好起來",
  ];
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const randomBetween = (minimum, maximum) => Math.random() * (maximum - minimum) + minimum;
  let stars = [];
  let bursts = [];
  let width = 0;
  let height = 0;
  let previousTime = 0;
  let animationFrame = null;
  let messageTimer;
  let lastMessageIndex = -1;

  const drawStar = (x, y, size, rotation, color, alpha) => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.beginPath();

    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? size : size * 0.44;
      const angle = -Math.PI / 2 + point * (Math.PI / 5);
      const pointX = Math.cos(angle) * radius;
      const pointY = Math.sin(angle) * radius;

      if (point === 0) {
        context.moveTo(pointX, pointY);
      } else {
        context.lineTo(pointX, pointY);
      }
    }

    context.closePath();
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.shadowColor = color;
    context.shadowBlur = size * 3;
    context.fill();
    context.restore();
  };

  const createStar = () => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    size: randomBetween(1.8, 4.4),
    speedX: randomBetween(-0.09, 0.09),
    speedY: randomBetween(-0.24, -0.07),
    driftSpeed: randomBetween(0.4, 1.1),
    driftPhase: randomBetween(0, Math.PI * 2),
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.012, 0.012),
    twinkleSpeed: randomBetween(0.6, 1.5),
    twinklePhase: randomBetween(0, Math.PI * 2),
    color: starColors[Math.floor(Math.random() * starColors.length)],
    alpha: randomBetween(0.42, 0.78),
    pulse: 0,
  });

  const drawScene = (time, delta) => {
    context.clearRect(0, 0, width, height);

    stars.forEach((star) => {
      if (delta > 0) {
        star.y += star.speedY * (delta / 16);
        star.x += star.speedX * (delta / 16);
        star.driftPhase += delta * 0.0004 * star.driftSpeed;
        star.x += Math.sin(star.driftPhase) * 0.08;
        star.rotation += star.rotationSpeed * (delta / 16);
        star.pulse = Math.max(0, star.pulse - delta / 650);
      }

      if (star.y < -14) {
        star.y = height + 12;
        star.x = randomBetween(0, width);
      }

      if (star.x < -14) {
        star.x = width + 12;
      } else if (star.x > width + 14) {
        star.x = -12;
      }

      const twinkle = 0.6 + Math.sin(time * 0.001 * star.twinkleSpeed + star.twinklePhase) * 0.4;
      const size = star.size * (1 + star.pulse * 0.8);
      drawStar(star.x, star.y, size, star.rotation, star.color, star.alpha * twinkle);
    });

    bursts.forEach((burst) => {
      burst.age += delta / 950;
    });
    bursts = bursts.filter((burst) => burst.age < 1);

    bursts.forEach((burst) => {
      const progress = Math.min(1, burst.age);
      const radius = 8 + progress * 78;
      const alpha = (1 - progress) * 0.9;

      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = burst.color;
      context.lineWidth = Math.max(0.6, 2.2 * (1 - progress));
      context.beginPath();
      context.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
      context.stroke();

      for (let ray = 0; ray < 8; ray += 1) {
        const angle = burst.rotation + ray * (Math.PI / 4);
        const innerX = burst.x + Math.cos(angle) * radius * 0.58;
        const innerY = burst.y + Math.sin(angle) * radius * 0.58;
        const outerX = burst.x + Math.cos(angle) * radius * 1.08;
        const outerY = burst.y + Math.sin(angle) * radius * 1.08;
        context.beginPath();
        context.moveTo(innerX, innerY);
        context.lineTo(outerX, outerY);
        context.stroke();
      }

      context.restore();
    });
  };

  const resizeStarfield = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    starfield.width = Math.round(width * ratio);
    starfield.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const starCount = Math.min(76, Math.max(28, Math.floor((width * height) / 24000)));
    stars = Array.from({ length: starCount }, createStar);
    bursts = [];
    drawScene(0, 0);
  };

  const showSurprise = (x, y) => {
    let messageIndex = Math.floor(Math.random() * surpriseMessages.length);

    if (messageIndex === lastMessageIndex) {
      messageIndex = (messageIndex + 1) % surpriseMessages.length;
    }

    lastMessageIndex = messageIndex;
    const horizontalMargin = 130;
    const messageX = Math.min(Math.max(x, horizontalMargin), Math.max(horizontalMargin, width - horizontalMargin));
    const messageY = Math.min(Math.max(y, 90), Math.max(90, height - 24));

    surpriseMessage.style.left = `${messageX}px`;
    surpriseMessage.style.top = `${messageY}px`;
    surpriseMessage.textContent = surpriseMessages[messageIndex];
    surpriseMessage.classList.remove("is-visible");
    void surpriseMessage.offsetWidth;
    surpriseMessage.classList.add("is-visible");

    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(() => surpriseMessage.classList.remove("is-visible"), 1800);
  };

  const animate = (time) => {
    const delta = Math.min(40, time - (previousTime || time));
    previousTime = time;
    drawScene(time, delta);
    animationFrame = window.requestAnimationFrame(animate);
  };

  const startAnimation = () => {
    if (animationFrame !== null) {
      return;
    }

    previousTime = window.performance.now();
    animationFrame = window.requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    drawScene(0, 0);
  };

  document.addEventListener("click", (event) => {
    const clickedStar = stars.find((star) => {
      const deltaX = event.clientX - star.x;
      const deltaY = event.clientY - star.y;
      const hitRadius = Math.max(24, star.size + 20);
      return deltaX * deltaX + deltaY * deltaY <= hitRadius * hitRadius;
    });

    if (!clickedStar) {
      return;
    }

    clickedStar.pulse = 1;
    bursts.push({
      x: clickedStar.x,
      y: clickedStar.y,
      color: clickedStar.color,
      age: 0,
      rotation: Math.random() * Math.PI,
    });
    showSurprise(event.clientX, event.clientY);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resizeStarfield, 140);
  }, { passive: true });

  motionPreference.addEventListener?.("change", () => {
    if (motionPreference.matches) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  resizeStarfield();

  if (!motionPreference.matches) {
    startAnimation();
  }
}
