let tempCount = 1;
window.addEventListener("scroll", function () {
  tempCount = 1;
});
let appearObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("has-been-seen");
        entry.target.classList.add("active");
        entry.target.style.setProperty("--i", tempCount);
        setTimeout(
          function () {
            entry.target.classList.add("appeared");
          },
          tempCount * 120 + 1000,
        );
        tempCount++;
      } else {
        entry.target.classList.remove("active");
      }
    });
  },
  { rootMargin: "0px 0px -15% 0px" },
);
const cols = document.querySelectorAll(".appear:not(.appeared)");
cols.forEach((col) => {
  appearObserver.observe(col);
});
let animationsObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
      }
    });
  },
  { rootMargin: "0px 0px -10% 0px" },
);
const animations = document.querySelectorAll(".trigger-animation");
animations.forEach((col) => {
  animationsObserver.observe(col);
});

function getScrollLookup(targets, { start, pinnedContainer, containerAnimation }) {
  let triggers = gsap.utils.toArray(targets).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: start || "top top",
        pinnedContainer: pinnedContainer,
        refreshPriority: -10,
        containerAnimation: containerAnimation,
      }),
    ),
    st = containerAnimation && containerAnimation.scrollTrigger;
  return (target) => {
    let t = gsap.utils.toArray(target)[0],
      i = triggers.length;
    while (i-- && triggers[i].trigger !== t) {}
    if (i < 0) {
      return console.warn("target not found", target);
    }
    return containerAnimation ? st.start + (triggers[i].start / containerAnimation.duration()) * (st.end - st.start) : triggers[i].start;
  };
}

function getScrollPosition(animation, progress) {
  let p = gsap.utils.clamp(0, 1, progress || 0),
    st = animation.scrollTrigger,
    containerAnimation = st.vars.containerAnimation;
  if (containerAnimation) {
    let time = st.start + (st.end - st.start) * p;
    st = containerAnimation.scrollTrigger;
    return st.start + (st.end - st.start) * (time / containerAnimation.duration());
  }
  return st.start + (st.end - st.start) * p;
}

function parents(element, className) {
  let parent = element.parentElement;
  while (parent && !parent.classList.contains(className)) {
    parent = parent.parentElement;
  }
  return parent;
}

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  const countups = document.querySelectorAll(".count-up");
  countups.forEach((countup) => {
    const start = parseFloat(countup.getAttribute("data-start"));
    const end = parseFloat(countup.getAttribute("data-end"));
    const decimalsAttr = parseFloat(countup.getAttribute("data-decimals"));
    const digitsAttr = parseFloat(countup.getAttribute("data-digits"));
    // console.log(decimalsAttr);
    let decimals = 0;
    if (decimalsAttr) {
      decimals = decimalsAttr;
    }
    let formatting = false;
    if (digitsAttr) {
      formatting = (v) => String(Math.floor(v)).padStart(digitsAttr, "0");
    }
    const options = {
      startVal: start,
      enableScrollSpy: true,
      scrollSpyOnce: true,
      duration: 2,
      decimalPlaces: decimals,
      formattingFn: formatting,
    };
    let numAnim = new countUp.CountUp(countup, end, options);
  });

  const quoteSliders = document.querySelectorAll(".quote-slider");
  quoteSliders.forEach((quoteSlider) => {
    quoteSlider.classList.remove("is-hidden");
    quoteSlider.offsetHeight;
    var flkty = new Flickity(quoteSlider, {
      cellAlign: "left",
      contain: true,
      dragThreshold: 10,
      percentPosition: true,
      groupCells: true,
      pageDots: false,
      arrowShape: "M2.72108 45.7939C2.26007 46.2626 1.89146 46.7887 1.61551 47.3492C1.1725 48.2487 0.968963 49.2352 1.00382 50.2144C1.05551 51.6663 1.63136 53.1018 2.72782 54.2129L45.7089 98.1936C48.025 100.563 51.8237 100.607 54.1936 98.2911C56.5636 95.975 56.6072 92.1763 54.2912 89.8064L21.2531 56H93C96.3137 56 99 53.3137 99 50C99 46.6863 96.3137 44 93 44H21.2531L54.2911 10.1936C56.6072 7.82368 56.5635 4.02494 54.1936 1.70888C51.8237 -0.607181 48.0249 -0.563517 45.7089 1.80641L2.72108 45.7939Z",
    });
  });

  const roiSliders = document.querySelectorAll(".roi-slider");
  roiSliders.forEach((roiSlider) => {
    roiSlider.classList.remove("is-hidden");
    roiSlider.offsetHeight;
    var flkty = new Flickity(roiSlider, {
      cellAlign: "left",
      contain: true,
      dragThreshold: 10,
      percentPosition: true,
      groupCells: true,
      adaptiveHeight: false,
      pageDots: false,
      arrowShape: "M2.72108 45.7939C2.26007 46.2626 1.89146 46.7887 1.61551 47.3492C1.1725 48.2487 0.968963 49.2352 1.00382 50.2144C1.05551 51.6663 1.63136 53.1018 2.72782 54.2129L45.7089 98.1936C48.025 100.563 51.8237 100.607 54.1936 98.2911C56.5636 95.975 56.6072 92.1763 54.2912 89.8064L21.2531 56H93C96.3137 56 99 53.3137 99 50C99 46.6863 96.3137 44 93 44H21.2531L54.2911 10.1936C56.6072 7.82368 56.5635 4.02494 54.1936 1.70888C51.8237 -0.607181 48.0249 -0.563517 45.7089 1.80641L2.72108 45.7939Z",
    });
  });

  const caseStudiesSliders = document.querySelectorAll(".case-studies-slider:not(.delayed)");
  caseStudiesSliders.forEach((caseStudiesSlider) => {
    caseStudiesSlider.classList.remove("is-hidden");
    caseStudiesSlider.offsetHeight;
    var flkty = new Flickity(caseStudiesSlider, {
      cellAlign: "left",
      contain: true,
      dragThreshold: 10,
      percentPosition: true,
      groupCells: true,
      adaptiveHeight: false,
      pageDots: false,
      arrowShape: "M2.72108 45.7939C2.26007 46.2626 1.89146 46.7887 1.61551 47.3492C1.1725 48.2487 0.968963 49.2352 1.00382 50.2144C1.05551 51.6663 1.63136 53.1018 2.72782 54.2129L45.7089 98.1936C48.025 100.563 51.8237 100.607 54.1936 98.2911C56.5636 95.975 56.6072 92.1763 54.2912 89.8064L21.2531 56H93C96.3137 56 99 53.3137 99 50C99 46.6863 96.3137 44 93 44H21.2531L54.2911 10.1936C56.6072 7.82368 56.5635 4.02494 54.1936 1.70888C51.8237 -0.607181 48.0249 -0.563517 45.7089 1.80641L2.72108 45.7939Z",
    });
  });

  const blockquoteSliders = document.querySelectorAll(".blockquote-slider");
  blockquoteSliders.forEach((blockquoteSlider) => {
    blockquoteSlider.classList.remove("is-hidden");
    blockquoteSlider.offsetHeight;
    if (blockquoteSlider.querySelectorAll(".blockquote-slide").length > 1) {
      var flkty = new Flickity(blockquoteSlider, {
        contain: false,
        dragThreshold: 10,
        percentPosition: true,
        groupCells: true,
        pageDots: false,
        arrowShape: "M2.72108 45.7939C2.26007 46.2626 1.89146 46.7887 1.61551 47.3492C1.1725 48.2487 0.968963 49.2352 1.00382 50.2144C1.05551 51.6663 1.63136 53.1018 2.72782 54.2129L45.7089 98.1936C48.025 100.563 51.8237 100.607 54.1936 98.2911C56.5636 95.975 56.6072 92.1763 54.2912 89.8064L21.2531 56H93C96.3137 56 99 53.3137 99 50C99 46.6863 96.3137 44 93 44H21.2531L54.2911 10.1936C56.6072 7.82368 56.5635 4.02494 54.1936 1.70888C51.8237 -0.607181 48.0249 -0.563517 45.7089 1.80641L2.72108 45.7939Z",
      });
    }
  });

  const imageCardSliders = document.querySelectorAll(".image-card-slider");
  imageCardSliders.forEach((imageCardSlider) => {
    imageCardSlider.classList.remove("is-hidden");
    imageCardSlider.offsetHeight;
    const AUTOPLAY_DURATION = 5000;
    let isPlaying = false;
    let lastNow = performance.now();
    var flkty = new Flickity(imageCardSlider, {
      cellAlign: "left",
      contain: true,
      dragThreshold: 10,
      percentPosition: true,
      groupCells: true,
      pageDots: true,
      prevNextButtons: false,
      autoPlay: false,
      pauseAutoPlayOnHover: false,
      on: {
        ready: function () {
          lastNow = performance.now();
          const dots = imageCardSlider.querySelectorAll(".flickity-page-dots .dot");
          dots.forEach((dot) => {
            const timerDiv = document.createElement("div");
            timerDiv.classList.add("timer");
            dot.appendChild(timerDiv);
          });
          const wrapper = document.createElement("div");
          const dotsEl = imageCardSlider.querySelector(".flickity-page-dots");
          wrapper.classList.add("image-card-slider-ui-wrapper");
          dotsEl.parentNode.insertBefore(wrapper, dotsEl);

          const toggleAutoPlayButton = document.createElement("button");
          toggleAutoPlayButton.classList.add("toggle-autoplay", "paused");
          toggleAutoPlayButton.innerHTML = `<svg width="8" height="12" class="pause" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.895149 12C0.594679 12 0.369327 11.9157 0.219092 11.7471C0.0730308 11.5785 0 11.3255 0 10.9883V1.00468C0 0.672131 0.0751174 0.421546 0.225352 0.252927C0.375587 0.0843091 0.598852 0 0.895149 0H2.3662C2.65832 0 2.8795 0.0819672 3.02973 0.245902C3.18414 0.409836 3.26135 0.662763 3.26135 1.00468V10.9883C3.26135 11.3255 3.18414 11.5785 3.02973 11.7471C2.8795 11.9157 2.65832 12 2.3662 12H0.895149ZM5.64006 12C5.33959 12 5.11424 11.9157 4.96401 11.7471C4.81377 11.5785 4.73865 11.3255 4.73865 10.9883V1.00468C4.73865 0.672131 4.81377 0.421546 4.96401 0.252927C5.11424 0.0843091 5.33959 0 5.64006 0H7.09859C7.39906 0 7.62441 0.0819672 7.77465 0.245902C7.92488 0.409836 8 0.662763 8 1.00468V10.9883C8 11.3255 7.92488 11.5785 7.77465 11.7471C7.62441 11.9157 7.39906 12 7.09859 12H5.64006Z" fill="#0A0A0A" />
        </svg>
        <svg width="10" height="11" class="play" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 9.96835V1.03165C0 0.681435 0.0904393 0.421941 0.271318 0.253165C0.452196 0.0843882 0.667528 0 0.917313 0C1.14126 0 1.3652 0.0611814 1.58915 0.183544L9.21835 4.55063C9.49397 4.70675 9.69208 4.85443 9.81266 4.99367C9.93755 5.13291 10 5.30169 10 5.5C10 5.69409 9.93755 5.86287 9.81266 6.00633C9.69208 6.14557 9.49397 6.29325 9.21835 6.44937L1.58915 10.8165C1.3652 10.9388 1.14126 11 0.917313 11C0.667528 11 0.452196 10.9135 0.271318 10.7405C0.0904393 10.5717 0 10.3143 0 9.96835Z" fill="#0A0A0A" />
        </svg>`;
          wrapper.appendChild(dotsEl);
          wrapper.appendChild(toggleAutoPlayButton);

          if (imageCardSlider.getAttribute("data-button-url")) {
            const sliderButton = document.createElement("a");
            sliderButton.href = imageCardSlider.getAttribute("data-button-url");
            sliderButton.innerText = imageCardSlider.getAttribute("data-button-text");
            sliderButton.classList.add("btn", "bg-black", "white");
            wrapper.appendChild(sliderButton);
          }

          toggleAutoPlayButton.addEventListener("click", function () {
            if (toggleAutoPlayButton.classList.contains("paused")) {
              toggleAutoPlayButton.classList.remove("paused");
              lastNow = performance.now();
              isPlaying = true;
              // flkty.unpausePlayer();
            } else {
              isPlaying = false;
              toggleAutoPlayButton.classList.add("paused");
              // flkty.pausePlayer();
            }
          });
        },
      },
    });

    setupDotTimer(imageCardSlider);
    function setupDotTimer(rootEl) {
      let elapsedForCurrent = 0;

      function resetAllTimers() {
        rootEl.querySelectorAll(".flickity-page-dots .dot .timer").forEach((bar) => {
          bar.style.width = "0%";
        });
      }
      flkty.on("select", function () {
        resetAllTimers();
        elapsedForCurrent = 0;
        lastNow = performance.now();
      });

      function tick(now) {
        const delta = now - lastNow;
        lastNow = now;

        if (isPlaying) {
          elapsedForCurrent += delta;
        }

        const activeTimer = rootEl.querySelector(".flickity-page-dots .dot.is-selected .timer");
        if (activeTimer) {
          let progress = elapsedForCurrent / AUTOPLAY_DURATION;
          if (progress < 0) progress = 0;
          if (progress > 1) progress = 1;
          activeTimer.style.width = progress * 100 + "%";
        }

        if (isPlaying && elapsedForCurrent >= AUTOPLAY_DURATION) {
          flkty.next(true);
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    let autoStarted = false;
    const sliderInViewObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && autoStarted == false) {
            autoStarted = true;
            imageCardSlider.querySelector(".toggle-autoplay").classList.remove("paused");
            lastNow = performance.now();
            isPlaying = true;
          }
        });
      },
      { rootMargin: "0px 0px 0px 0px" },
    );
    sliderInViewObserver.observe(imageCardSlider);
  });

  const quoteCardSliders = document.querySelectorAll(".quote-card-slider");
  quoteCardSliders.forEach((quoteCardSlider) => {
    quoteCardSlider.classList.remove("is-hidden");
    quoteCardSlider.offsetHeight;
    const AUTOPLAY_DURATION = 5000;
    let isPlaying = false;
    let lastNow = performance.now();

    Flickity.prototype._createResizeClass = function () {
      this.element.classList.add("flickity-resize");
    };

    Flickity.createMethods.push("_createResizeClass");
    var resize = Flickity.prototype.resize;
    Flickity.prototype.resize = function () {
      this.element.classList.remove("flickity-resize");
      resize.call(this);
      this.element.classList.add("flickity-resize");
    };

    var flkty = new Flickity(quoteCardSlider, {
      cellAlign: "left",
      contain: true,
      dragThreshold: 10,
      percentPosition: true,
      groupCells: true,
      pageDots: true,
      prevNextButtons: false,
      autoPlay: false,
      pauseAutoPlayOnHover: false,
      on: {
        ready: function () {
          lastNow = performance.now();
          const dots = quoteCardSlider.querySelectorAll(".flickity-page-dots .dot");
          dots.forEach((dot) => {
            const timerDiv = document.createElement("div");
            timerDiv.classList.add("timer");
            dot.appendChild(timerDiv);
          });
          const wrapper = document.createElement("div");
          const dotsEl = quoteCardSlider.querySelector(".flickity-page-dots");
          wrapper.classList.add("quote-card-slider-ui-wrapper");
          dotsEl.parentNode.insertBefore(wrapper, dotsEl);

          const toggleAutoPlayButton = document.createElement("button");
          toggleAutoPlayButton.classList.add("toggle-autoplay", "paused");
          toggleAutoPlayButton.innerHTML = `<svg width="8" height="12" class="pause" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.895149 12C0.594679 12 0.369327 11.9157 0.219092 11.7471C0.0730308 11.5785 0 11.3255 0 10.9883V1.00468C0 0.672131 0.0751174 0.421546 0.225352 0.252927C0.375587 0.0843091 0.598852 0 0.895149 0H2.3662C2.65832 0 2.8795 0.0819672 3.02973 0.245902C3.18414 0.409836 3.26135 0.662763 3.26135 1.00468V10.9883C3.26135 11.3255 3.18414 11.5785 3.02973 11.7471C2.8795 11.9157 2.65832 12 2.3662 12H0.895149ZM5.64006 12C5.33959 12 5.11424 11.9157 4.96401 11.7471C4.81377 11.5785 4.73865 11.3255 4.73865 10.9883V1.00468C4.73865 0.672131 4.81377 0.421546 4.96401 0.252927C5.11424 0.0843091 5.33959 0 5.64006 0H7.09859C7.39906 0 7.62441 0.0819672 7.77465 0.245902C7.92488 0.409836 8 0.662763 8 1.00468V10.9883C8 11.3255 7.92488 11.5785 7.77465 11.7471C7.62441 11.9157 7.39906 12 7.09859 12H5.64006Z" fill="#0A0A0A" />
        </svg>
        <svg width="10" height="11" class="play" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 9.96835V1.03165C0 0.681435 0.0904393 0.421941 0.271318 0.253165C0.452196 0.0843882 0.667528 0 0.917313 0C1.14126 0 1.3652 0.0611814 1.58915 0.183544L9.21835 4.55063C9.49397 4.70675 9.69208 4.85443 9.81266 4.99367C9.93755 5.13291 10 5.30169 10 5.5C10 5.69409 9.93755 5.86287 9.81266 6.00633C9.69208 6.14557 9.49397 6.29325 9.21835 6.44937L1.58915 10.8165C1.3652 10.9388 1.14126 11 0.917313 11C0.667528 11 0.452196 10.9135 0.271318 10.7405C0.0904393 10.5717 0 10.3143 0 9.96835Z" fill="#0A0A0A" />
        </svg>`;
          wrapper.appendChild(dotsEl);
          wrapper.appendChild(toggleAutoPlayButton);

          toggleAutoPlayButton.addEventListener("click", function () {
            if (toggleAutoPlayButton.classList.contains("paused")) {
              toggleAutoPlayButton.classList.remove("paused");
              lastNow = performance.now();
              isPlaying = true;
              // flkty.unpausePlayer();
            } else {
              isPlaying = false;
              toggleAutoPlayButton.classList.add("paused");
              // flkty.pausePlayer();
            }
          });
        },
      },
    });

    setupDotTimer(quoteCardSlider);
    function setupDotTimer(rootEl) {
      let elapsedForCurrent = 0;

      function resetAllTimers() {
        rootEl.querySelectorAll(".flickity-page-dots .dot .timer").forEach((bar) => {
          bar.style.width = "0%";
        });
      }
      flkty.on("select", function () {
        resetAllTimers();
        elapsedForCurrent = 0;
        lastNow = performance.now();
      });

      function tick(now) {
        const delta = now - lastNow;
        lastNow = now;

        if (isPlaying) {
          elapsedForCurrent += delta;
        }

        const activeTimer = rootEl.querySelector(".flickity-page-dots .dot.is-selected .timer");
        if (activeTimer) {
          let progress = elapsedForCurrent / AUTOPLAY_DURATION;
          if (progress < 0) progress = 0;
          if (progress > 1) progress = 1;
          activeTimer.style.width = progress * 100 + "%";
        }

        if (isPlaying && elapsedForCurrent >= AUTOPLAY_DURATION) {
          flkty.next(true);
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    let autoStarted = false;
    const sliderInViewObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && autoStarted == false) {
            autoStarted = true;
            quoteCardSlider.querySelector(".toggle-autoplay").classList.remove("paused");
            lastNow = performance.now();
            isPlaying = true;
          }
        });
      },
      { rootMargin: "0px 0px 0px 0px" },
    );
    sliderInViewObserver.observe(quoteCardSlider);
  });

  const roiStatsSliders = document.querySelectorAll(".roi-stats");
  roiStatsSliders.forEach((roiStatsSlider) => {
    roiStatsSlider.classList.remove("is-hidden");
    roiStatsSlider.offsetHeight;

    const flickityOptions = {
      cellAlign: "left",
      contain: true,
      dragThreshold: 10,
      percentPosition: true,
      groupCells: true,
      pageDots: true,
      prevNextButtons: false,
      on: {
        ready: function () {
          const wrapper = document.createElement("div");
          const dotsEl = roiStatsSlider.querySelector(".flickity-page-dots");
          wrapper.classList.add("roi-stats-ui-wrapper");
          dotsEl.parentNode.insertBefore(wrapper, dotsEl);
          wrapper.appendChild(dotsEl);
        },
      },
    };
    var flkty = new Flickity(roiStatsSlider, flickityOptions);

    const mediaQuery = window.matchMedia("(max-width: 1460px)");
    function handleWidthChange(event) {
      if (event.matches) {
        flkty = new Flickity(roiStatsSlider, flickityOptions);
      } else {
        roiStatsSlider.appendChild(roiStatsSlider.querySelector(".flickity-page-dots"));
        roiStatsSlider.querySelector(".roi-stats-ui-wrapper").remove();
        flkty.destroy();
      }
    }
    mediaQuery.addEventListener("change", handleWidthChange);
    handleWidthChange(mediaQuery);
  });

  let windowHeight = window.innerHeight * 0.75;
  let fullHeightTriggered = false;
  const revealAfterScrolls = document.querySelectorAll(".reveal-after-full-scroll");
  if (revealAfterScrolls) {
    const triggerReveals = () => {
      const scroll = window.scrollY;
      if (scroll > windowHeight && fullHeightTriggered == false) {
        fullHeightTriggered = true;
        revealAfterScrolls.forEach((revealAfterScroll) => {
          revealAfterScroll.classList.add("show");
        });
      } else if (scroll < windowHeight && fullHeightTriggered == true) {
        fullHeightTriggered = false;
        revealAfterScrolls.forEach((revealAfterScroll) => {
          revealAfterScroll.classList.remove("show");
        });
      }
    };
    document.addEventListener("scroll", (e) => {
      triggerReveals();
    });
    window.addEventListener("load", () => {
      triggerReveals();
    });
    window.addEventListener("resize", () => {
      windowHeight = window.innerHeight * 0.75;
    });
  }

  const withEmbeds = document.querySelectorAll(".media.with-embed");
  if (withEmbeds.length > 0) {
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  window.onYouTubeIframeAPIReady = function () {
    withEmbeds.forEach((withEmbed) => {
      let player;
      const iframe = withEmbed.querySelector("iframe");
      const iframeID = iframe.getAttribute("id");
      player = new YT.Player(iframeID, {
        playerVars: {
          playsinline: 1,
        },
        events: {
          onStateChange: onPlayerStateChange,
        },
      });

      function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.ENDED) {
          setTimeout(() => {
            withEmbed.querySelector(".embed-content").classList.remove("show");
          }, 500);
        }
      }

      withEmbed.addEventListener("click", (e) => {
        withEmbed.querySelector(".embed-content").classList.add("show");
        player.playVideo();
        e.preventDefault();
      });
    });
  };

  const tabNavLinks = document.querySelectorAll("a[data-tab]");
  tabNavLinks.forEach((tabNavLink) => {
    tabNavLink.addEventListener("click", (e) => {
      const clicked = e.target.closest("a");
      // console.log(clicked);
      const nav = parents(clicked, "tabs-nav");
      let tabs;
      let tabsSection;
      if (nav.classList.contains("global")) {
        tabsSection = document;
        tabs = document.querySelector(".tabs");
      } else {
        tabsSection = clicked.closest("section");
        tabs = tabsSection.querySelector(".tabs");
      }
      const newTabID = clicked.getAttribute("data-tab");
      const newTabs = tabsSection.querySelectorAll('.tab[data-tab="' + newTabID + '"]');
      // console.log(newTabID);
      if (!clicked.classList.contains("active")) {
        const otherLinks = tabsSection.querySelectorAll("a[data-tab]");
        otherLinks.forEach((otherLink) => {
          otherLink.classList.remove("active");
        });
        clicked.classList.add("active");
        const otherSameTabLinks = tabsSection.querySelectorAll('a[data-tab="' + newTabID + '"]:not(.active)');
        otherSameTabLinks.forEach((otherSameTabLink) => {
          otherSameTabLink.classList.add("active");
        });
        const currentActiveTabs = tabsSection.querySelectorAll(".tab.active");
        currentActiveTabs.forEach((currentActiveTab) => {
          currentActiveTab.classList.remove("active");
          const oldPlayer = currentActiveTab.querySelector("mux-player");
          if (oldPlayer) {
            oldPlayer.pause();
          }
        });
        newTabs.forEach((newTab) => {
          newTab.classList.add("active");
          const player = newTab.querySelector("mux-player");
          if (player) {
            autoplayVidsObserver.observe(player);
            player.play().catch((err) => {
              console.error("Play failed:", err);
            });
          }
        });
      }
      if (nav.classList.contains("no-default")) {
        e.preventDefault();
        return false;
      }
    });
  });

  const currencyChangerLinks = document.querySelectorAll(".currency-toggle a[data-currency]");
  currencyChangerLinks.forEach((currencyChangerLink) => {
    currencyChangerLink.addEventListener("click", (e) => {
      currencyChangerLinks.forEach((currencyChangerLinkLoop) => {
        currencyChangerLinkLoop.classList.remove("active");
      });
      currencyChangerLink.classList.add("active");
      const currency = currencyChangerLink.getAttribute("data-currency");
      const symbols = document.querySelectorAll(".currency-symbol");
      const amounts = document.querySelectorAll(".currency-amount");
      symbols.forEach((symbol) => {
        symbol.setAttribute("data-currency", currency);
      });
      if (currency == "eur") {
        symbols.forEach((symbol) => {
          symbol.textContent = "€";
        });
        amounts.forEach((amount) => {
          amount.textContent = amount.getAttribute("data-eur");
        });
      }
      if (currency == "usd") {
        symbols.forEach((symbol) => {
          symbol.textContent = "$";
        });
        amounts.forEach((amount) => {
          amount.textContent = amount.getAttribute("data-usd");
        });
      }
      e.preventDefault();
    });
  });

  const IPINFO_TOKEN = "58e24916dbd989";
  async function getUserRegion() {
    const res = await fetch(`https://api.ipinfo.io/lite/me?token=${IPINFO_TOKEN}`);
    if (!res.ok) {
      throw new Error("IPinfo error: " + res.status);
    }

    const data = await res.json();

    let region = "other";

    if (data.country === "United States") {
      region = "us";
    } else if (data.continent === "Europe") {
      region = "europe";
    }

    return { region, data };
  }

  if (currencyChangerLinks.length > 0) {
    getUserRegion()
      .then(({ region, data }) => {
        switch (region) {
          case "us":
            break;
          case "europe":
            document.querySelector('.currency-toggle a[data-currency="eur"]').click();
            break;
          default:
        }
      })
      .catch((err) => {
        console.error("Failed to determine region", err);
        // choose your failure mode here (allow or block)
      });
  }

  const playInViews = document.querySelectorAll("mux-player.play-in-view");
  if (playInViews.length > 0) {
    let playInViewObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!entry.target.classList.contains("has-played") && !entry.target.classList.contains("energy-saving")) {
              entry.target.play();
              entry.target.classList.add("has-played");
            }
          }
        });
      },
      { rootMargin: "0px 0px 0px 0px" },
    );
    playInViews.forEach((playInView) => {
      playInViewObserver.observe(playInView);
    });
  }

  const faqRows = document.querySelectorAll(".faq-row");
  faqRows.forEach((faqRow) => {
    faqRow.addEventListener("click", (e) => {
      if (!e.target.closest("div").classList.contains("faq-answer")) {
        faqRow.classList.toggle("open");
      }
    });
  });

  const autoPlayMuxVideos = document.querySelectorAll('mux-player[autoplay="muted"]');
  const autoPlayHTMLVideos = document.querySelectorAll("video[autoplay]");
  let autoplayVidsObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          entry.target.classList.add("energy-saving");
          // entry.target.style.opacity = "0.5";
          entry.target.pause();
        } else {
          entry.target.classList.remove("energy-saving");
          // entry.target.style.opacity = "1";
          entry.target.play();
        }
      });
    },
    { threshold: 0, rootMargin: "-1% 0px -1% 0px" },
  );
  autoPlayMuxVideos.forEach((autoPlayMuxVideo) => {
    // console.log(autoPlayMuxVideo);
    autoplayVidsObserver.observe(autoPlayMuxVideo);
  });
  autoPlayHTMLVideos.forEach((autoPlayHTMLVideo) => {
    // console.log(autoPlayHTMLVideo);
    autoplayVidsObserver.observe(autoPlayHTMLVideo);
  });
});

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});
