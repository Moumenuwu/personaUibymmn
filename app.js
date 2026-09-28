const menuEntries = [
  {
    label: "خطة البحث",
    href: "page-1.html",
    idleImage: "assets/unselected/title-01.png",
    selectedImage: "assets/selected/title-01.png",
    selectedShift: "1%",
    hitTop: "6%",
    hitHeight: "24%",
  },
  {
    label: "المبحث الأول",
    href: "page-2.html",
    idleImage: "assets/unselected/title-02.png",
    selectedImage: "assets/selected/title-02.png",
    selectedShift: "4%",
    hitTop: "24%",
    hitHeight: "24%",
  },
  {
    label: "المبحث الثاني",
    href: "page-3.html",
    idleImage: "assets/unselected/title-03.png",
    selectedImage: "assets/selected/title-03.png",
    selectedShift: "23%",
    hitTop: "42%",
    hitHeight: "21%",
  },
  {
    label: "المبحث الثالث",
    href: "page-4.html",
    idleImage: "assets/unselected/title-04.png",
    selectedImage: "assets/selected/title-04.png",
    selectedShift: "40%",
    hitTop: "60%",
    hitHeight: "22%",
  },
  {
    label: "الخاتمة",
    href: "page-5.html",
    idleImage: "assets/unselected/title-05.png",
    selectedImage: "assets/selected/title-05.png",
    selectedShift: "59%",
    hitTop: "78%",
    hitHeight: "22%",
  },
];

const menuItemsContainer = document.querySelector(".menu-items");
const artworkContainer = document.querySelector(".title-canvas");
const currentPage = document.body.dataset.page;
const currentIndex = menuEntries.findIndex((entry) => entry.href === currentPage);
const menuItems = [];
const artworkLayers = [];
const researchButton = document.querySelector(".research-page__button");
const researchLinks = [...document.querySelectorAll(".research-menu a")];
let researchSelectedIndex = 0;
let pageTransitionStarted = false;
const activationSound = new Audio("assets/deck_ui_into_game_detail.wav");
const navigationSounds = {
  down: new Audio("assets/deck_ui_slider_down.wav"),
  up: new Audio("assets/deck_ui_slider_up.wav"),
};
let audioUnlocked = false;

Object.values(navigationSounds).forEach((audio) => {
  audio.preload = "auto";
  audio.addEventListener("error", () => {
    console.error(`Unable to load navigation sound: ${audio.src}`);
  });
});

activationSound.preload = "auto";
activationSound.addEventListener("error", () => {
  console.error(`Unable to load activation sound: ${activationSound.src}`);
});

function unlockAudio() {
  if (audioUnlocked) {
    return;
  }

  audioUnlocked = true;
  [activationSound, ...Object.values(navigationSounds)].forEach((audio) => {
    audio.load();
  });
}

document.addEventListener("pointerdown", unlockAudio, { passive: true });
document.addEventListener("keydown", unlockAudio);

menuEntries.forEach((entry, index) => {
  const artworkLayer = document.createElement("div");
  artworkLayer.className = "title-layer";
  artworkLayer.dataset.index = String(index);
  artworkLayer.style.setProperty("--stagger", `${index * 90}ms`);
  artworkLayer.style.setProperty("--selected-shift", entry.selectedShift);

  const floatingArtwork = document.createElement("div");
  floatingArtwork.className = "title-floater";
  floatingArtwork.style.setProperty("--wave-duration", `${8 + index * 0.7}s`);

  const idleImage = document.createElement("img");
  idleImage.className = "title-image title-image--idle";
  idleImage.src = entry.idleImage;
  idleImage.alt = "";
  idleImage.draggable = false;

  const selectedImage = document.createElement("img");
  selectedImage.className = "title-image title-image--selected";
  selectedImage.src = entry.selectedImage;
  selectedImage.alt = "";
  selectedImage.draggable = false;

  floatingArtwork.append(idleImage, selectedImage);
  artworkLayer.append(floatingArtwork);
  artworkContainer.append(artworkLayer);
  artworkLayers.push(artworkLayer);

  const menuItem = document.createElement("a");
  menuItem.className = "menu-item";
  menuItem.href = entry.href;
  menuItem.dataset.index = String(index);
  menuItem.setAttribute("aria-label", entry.label);
  menuItem.style.setProperty("--hit-top", entry.hitTop);
  menuItem.style.setProperty("--hit-height", entry.hitHeight);

  if (index === currentIndex) {
    menuItem.setAttribute("aria-current", "page");
  }

  const accessibleLabel = document.createElement("span");
  accessibleLabel.className = "sr-only";
  accessibleLabel.textContent = entry.label;
  menuItem.append(accessibleLabel);
  menuItemsContainer.append(menuItem);
  menuItems.push(menuItem);
});

let selectedIndex = currentIndex >= 0 ? currentIndex : 0;

if (currentPage === "page-1.html") {
  const arrivedThroughTransition = new URLSearchParams(window.location.search).has("transitioned");

  if (arrivedThroughTransition) {
    document.body.classList.add("research-opening-complete");
  } else {
    document.body.classList.add("research-opening-active");
  }
}

function closeResearchPage() {
  if (currentPage !== "page-1.html") {
    return;
  }

  if (document.body.classList.contains("research-close-active")) {
    return;
  }

  document.body.classList.add("research-close-active");
  const closingCircle = document.querySelector(".research-close-transition__black");
  if (!closingCircle) {
    throw new Error("The research closing circle is missing.");
  }

  waitForAnimation(closingCircle, "research-black-bloom")
    .then(() => new Promise((resolve) => window.setTimeout(resolve, 1000)))
    .then(() => {
      if (!document.body.classList.contains("research-close-active")) {
        return;
      }

      document.querySelector(".research-menu")?.classList.add("is-revealed");
      document.querySelector(".research-return-hint")?.classList.add("is-revealed");

      const lastResearchLink = researchLinks[researchLinks.length - 1];
      if (!lastResearchLink) {
        throw new Error("The research section links are missing.");
      }

      return waitForAnimation(lastResearchLink, "research-menu-item-reveal");
    })
    .then(() => {
      if (document.body.classList.contains("research-close-active")) {
        selectResearchLink(0);
      }
    })
    .catch((error) => {
      console.error("Unable to reveal the research section menu.", error);
    });
}

function playActivationSound() {
  activationSound.currentTime = 0;
  const playback = activationSound.play();
  if (playback) {
    playback.catch((error) => {
      console.warn("Unable to play activation sound.", error);
    });
  }
}

function selectResearchLink(index) {
  if (currentPage !== "page-1.html" || researchLinks.length === 0) {
    return;
  }

  researchSelectedIndex = index;
  researchLinks.forEach((link, linkIndex) => {
    link.classList.toggle("is-research-selected", linkIndex === index);
  });
}

researchLinks.forEach((link, index) => {
  link.addEventListener("focus", () => selectResearchLink(index));
});

if (currentPage === "index.html" && new URLSearchParams(window.location.search).has("returning")) {
  document.body.classList.add("home-return-active");
  window.setTimeout(() => {
    document.body.classList.remove("home-return-active");
  }, 1800);
}

researchButton?.addEventListener("click", () => {
  playActivationSound();
  closeResearchPage();
});

function navigateWithTransition(href) {
  if (pageTransitionStarted) {
    return;
  }

  pageTransitionStarted = true;
  const transition = document.createElement("div");
  transition.className = "page-transition";
  transition.setAttribute("aria-hidden", "true");
  document.body.append(transition);
  document.body.classList.add("page-transition-active");

  window.setTimeout(() => {
    window.location.assign(href);
  }, 1200);
}

function waitForImage(image) {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve();
  }

  if (image.complete && image.naturalWidth === 0) {
    return Promise.reject(new Error(`Unable to load transition GIF: ${image.currentSrc || image.src}`));
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      image.removeEventListener("load", handleReady);
      image.removeEventListener("error", handleError);
    };
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error(`Unable to load transition GIF: ${image.currentSrc || image.src}`));
    };

    image.addEventListener("load", handleReady, { once: true });
    image.addEventListener("error", handleError, { once: true });
  });
}

function waitForAnimation(element, animationName) {
  return new Promise((resolve) => {
    const handleAnimationEnd = (event) => {
      if (event.target === element && event.animationName === animationName) {
        element.removeEventListener("animationend", handleAnimationEnd);
        resolve();
      }
    };

    element.addEventListener("animationend", handleAnimationEnd);
  });
}

async function openResearchPage() {
  if (currentPage !== "index.html") {
    window.location.assign("page-1.html");
    return;
  }

  if (document.body.classList.contains("research-transition-active")) {
    return;
  }

  document.body.classList.add("research-transition-active");
  const closingCircle = document.querySelector(".research-transition__black");
  const transitionGif = document.querySelector(".research-transition__gif");

  if (!closingCircle || !transitionGif) {
    throw new Error("The research transition layers are missing.");
  }

  try {
    await waitForAnimation(closingCircle, "research-black-bloom");
    await waitForImage(transitionGif);
    document.body.classList.add("research-transition-gif-active");
    await waitForAnimation(transitionGif, "research-gif-bloom");
    window.location.assign("page-1.html?transitioned=1");
  } catch (error) {
    document.body.classList.remove("research-transition-active");
    console.error("Unable to complete the research page transition.", error);
    window.location.assign("page-1.html");
  }
}

function playNavigationSound(direction) {
  unlockAudio();
  const audio = navigationSounds[direction];
  audio.currentTime = 0;
  const playback = audio.play();
  if (playback) {
    playback.catch((error) => {
      console.warn(`Unable to play ${direction} navigation sound.`, error);
    });
  }
}

function selectMenuItem(index, focus = false, direction = null) {
  const previousIndex = selectedIndex;
  if (index === previousIndex) {
    artworkLayers[index].classList.add("is-selected");
    menuItems[index].classList.add("keyboard-selected");
    if (focus) {
      menuItems[index].focus();
    }
    return;
  }

  artworkLayers[selectedIndex].classList.remove("is-selected");
  menuItems[selectedIndex].classList.remove("keyboard-selected");
  selectedIndex = index;
  artworkLayers[selectedIndex].classList.add("is-selected");
  menuItems[selectedIndex].classList.add("keyboard-selected");
  playNavigationSound(direction ?? (index > previousIndex ? "down" : "up"));

  if (focus) {
    menuItems[selectedIndex].focus();
  }
}

selectMenuItem(selectedIndex);

menuItems.forEach((menuItem, index) => {
  menuItem.addEventListener("click", (event) => {
    unlockAudio();
    playActivationSound();
    if (currentPage === "index.html" && index === 0) {
      event.preventDefault();
      openResearchPage();
    } else {
      event.preventDefault();
      navigateWithTransition(menuItem.href);
    }
  });
  menuItem.addEventListener("pointerenter", () => {
    if (document.body.classList.contains("scene-ready")) {
      selectMenuItem(index);
    }
  });
  menuItem.addEventListener("focus", () => selectMenuItem(index));
});

document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (currentPage === "page-1.html") {
    if (!document.body.classList.contains("research-close-active")) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        unlockAudio();
        playActivationSound();
        closeResearchPage();
        return;
      }
    } else if (
      event.key === "ArrowRight" &&
      document.querySelector(".research-return-hint")?.classList.contains("is-revealed")
    ) {
      event.preventDefault();
      unlockAudio();
      playActivationSound();
      if (!document.body.classList.contains("research-return-active")) {
        document.body.classList.add("research-return-active");
        window.setTimeout(() => {
          window.location.assign("index.html?returning=1");
        }, 1800);
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (researchSelectedIndex + 1) % researchLinks.length;
      selectResearchLink(nextIndex);
      researchLinks[nextIndex].focus();
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      const nextIndex = (researchSelectedIndex - 1 + researchLinks.length) % researchLinks.length;
      selectResearchLink(nextIndex);
      researchLinks[nextIndex].focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      return;
    }
  }

  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    event.preventDefault();
    unlockAudio();
    selectMenuItem((selectedIndex + 1) % menuItems.length, true, "down");
    return;
  }

  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    event.preventDefault();
    unlockAudio();
    selectMenuItem((selectedIndex - 1 + menuItems.length) % menuItems.length, true, "up");
    return;
  }

  if (/^[1-5]$/.test(event.key)) {
    selectMenuItem(Number(event.key) - 1, true);
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    playActivationSound();
    if (currentPage === "page-1.html") {
      closeResearchPage();
    } else if (selectedIndex === 0 && currentPage === "index.html") {
      openResearchPage();
    } else {
      navigateWithTransition(menuItems[selectedIndex].href);
    }
    return;
  }

  if (event.key === "Escape" && currentIndex >= 0) {
    window.location.assign("index.html");
  }
});

const backgroundVideo = document.querySelector(".background-video");
const videoError = document.querySelector(".video-error");
let revealTimer;
let playbackWatchdog;

function revealMenu() {
  window.clearTimeout(revealTimer);
  revealTimer = window.setTimeout(() => {
    document.body.classList.add("scene-ready");
  }, 1000);
}

backgroundVideo.addEventListener(
  "playing",
  () => {
    window.clearTimeout(playbackWatchdog);
    videoError.hidden = true;
    revealMenu();
  },
  { once: true },
);
backgroundVideo.addEventListener(
  "error",
  () => {
    window.clearTimeout(revealTimer);
    window.clearTimeout(playbackWatchdog);
    document.body.classList.add("scene-ready");
    videoError.hidden = false;
  },
  { once: true },
);

if (!backgroundVideo.paused) {
  revealMenu();
}

playbackWatchdog = window.setTimeout(() => {
  if (backgroundVideo.readyState < 2 || backgroundVideo.paused) {
    window.clearTimeout(revealTimer);
    document.body.classList.add("scene-ready");
    videoError.hidden = false;
  }
}, 5000);

const playback = backgroundVideo.play();
if (playback) {
  playback.catch(() => {
    window.clearTimeout(revealTimer);
    window.clearTimeout(playbackWatchdog);
    document.body.classList.add("scene-ready");
    videoError.hidden = false;
  });
}
