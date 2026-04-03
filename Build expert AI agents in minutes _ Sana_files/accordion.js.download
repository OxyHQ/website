let slideUp = (target, duration = 500) => {
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.height = target.offsetHeight + "px";
  target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  window.setTimeout(() => {
    target.style.display = "none";
    target.style.removeProperty("height");
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
    //alert("!");
  }, duration);
};

let slideDown = (target, duration = 500) => {
  target.style.removeProperty("display");
  let display = window.getComputedStyle(target).display;
  if (display === "none") display = "block";
  target.style.display = display;
  let height = target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  target.offsetHeight;
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.height = height + "px";
  target.style.removeProperty("padding-top");
  target.style.removeProperty("padding-bottom");
  target.style.removeProperty("margin-top");
  target.style.removeProperty("margin-bottom");
  window.setTimeout(() => {
    target.style.removeProperty("height");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
  }, duration);
};

const accordions = document.querySelectorAll(".accordion");
if (accordions) {
  const matchAccordionModuleHeight = () => {
    accordions.forEach((accordion) => {
      const currentActiveMedia = accordion.querySelector(".accordion-row.active .accordion-row-media");
      const activeMediaHeight = parseInt(currentActiveMedia.getBoundingClientRect().height);
      accordion.style.minHeight = activeMediaHeight + "px";
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    matchAccordionModuleHeight();
    accordions.forEach((accordion) => {
      accordion.querySelector(".accordion-row.active .bottom").style.display = "block";
      if (window.innerWidth < 950) {
        accordion.querySelector(".accordion-row.active .accordion-row-media").style.display = "block";
      }
      const rows = accordion.querySelectorAll(".accordion-row");
      rows.forEach((row) => {
        row.querySelector(".top").addEventListener("click", () => {
          if (!row.classList.contains("active")) {
            accordion.querySelectorAll(".accordion-row.active").forEach((row) => {
              row.classList.remove("active");
              if (window.innerWidth < 950) {
                slideUp(row.querySelector(".accordion-row-media"), 200);
              }
              slideUp(row.querySelector(".bottom"), 200);
              let video = row.querySelector(".accordion-row-media video");
              if (video) {
                video.pause();
              }
            });
            row.classList.add("active");
            slideDown(row.querySelector(".bottom"), 200);
            let video = row.querySelector(".accordion-row-media video");
            if (video) {
              video.play();
            }
            if (window.innerWidth < 950) {
              slideDown(row.querySelector(".accordion-row-media"), 200);
            }
            if (window.innerWidth < 950) {
              setTimeout(() => {
                // console.log(row.getBoundingClientRect().top);
                window.scrollTo({
                  top: window.scrollY + row.getBoundingClientRect().top - 50,
                  behavior: "smooth",
                });
              }, 400);
            }
          }
        });
      });
    });
  });
  window.addEventListener("load", () => {
    matchAccordionModuleHeight();
  });
  window.addEventListener("resize", () => {
    matchAccordionModuleHeight();
  });
}
