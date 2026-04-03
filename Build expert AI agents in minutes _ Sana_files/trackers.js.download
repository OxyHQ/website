function createCookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    var expires = "; expires=" + date.toGMTString();
  } else var expires = "";
  document.cookie = escape(name) + "=" + escape(value) + expires + "; path=/";
}

function readCookie(name) {
  var nameEQ = escape(name) + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return unescape(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name, "", -1);
}

const deleteCookie = (name) => {
  const paths = ["/", window.location.pathname];
  const domains = [window.location.hostname, "." + window.location.hostname];

  paths.forEach((path) => {
    domains.forEach((domain) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
    });

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
  });
};

function deleteCookiesExcept(exceptions) {
  const cookies = document.cookie.split(";");
  // console.log(cookies);
  // console.log("deleting all cookies apart from exceptions");

  cookies.forEach((cookie) => {
    // console.log(cookie);
    const cookieName = cookie.split("=")[0].trim();

    if (!exceptions.includes(cookieName)) {
      // console.log(cookieName);
      deleteCookie(cookieName);
    }
  });
}

function loadThirdPartyScripts() {
  const scripts = document.querySelectorAll(`script[data-category="analytics"][type="text/plain"]`);

  scripts.forEach((script) => {
    const newScript = document.createElement("script");
    if (script.getAttribute("data-src") !== null) {
      newScript.src = script.getAttribute("data-src");
    } else {
      newScript.textContent = script.textContent;
    }
    if (script.getAttribute("async") !== null) newScript.async = true;
    if (script.getAttribute("defer") !== null) newScript.defer = true;
    script.parentNode.replaceChild(newScript, script);
  });
}

function initGoogleAnalytics() {
  (function (i, s, o, g, r, a, m) {
    i["GoogleAnalyticsObject"] = r;
    (i[r] =
      i[r] ||
      function () {
        (i[r].q = i[r].q || []).push(arguments);
      }),
      (i[r].l = 1 * new Date());
    (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga");
  ga("create", "UA-107903708-1", "auto");
  ga("send", "pageview");
}

function initGoogleTagManager() {
  (function (w, l) {
    w[l] = w[l] || [];
    function gtag() {
      w[l].push(arguments);
    }
    gtag("consent", "default", {
      ad_user_data: "denied",
      ad_personalization: "denied",
      ad_storage: "denied",
      analytics_storage: "denied",
      wait_for_update: 500,
    });
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    // console.log(w[l]);
  })(window, "dataLayer");
}

function initGoogleTagManagerPostConsent() {
  (function (w, d, s, l, i) {
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
    function gtag() {
      w[l].push(arguments);
    }
    gtag("consent", "update", {
      ad_user_data: "granted",
      ad_personalization: "granted",
      ad_storage: "granted",
      analytics_storage: "granted",
    });
    // console.log(w[l]);
  })(window, document, "script", "dataLayer", "GTM-KPSZMBG");
}

function initFacebookTracker() {
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", "804532406767932");
  fbq("track", "PageView");
}

function initAnalyticsCookies() {
  initGoogleTagManager();
  if (readCookie("cookieConsent") === "true") {
    console.log("Cookie consent given - Initializing analytics and tracking cookies");
    initGoogleAnalytics();
    initGoogleTagManagerPostConsent();
    initFacebookTracker();
    loadThirdPartyScripts();
  } else {
    // console.log("Cookie consent not given - Not initializing analytics and and tracking cookies removing any other cookies");
    deleteCookiesExcept(["cookieConsent", "can-download-whitepaper"]);
  }
}

$(document).ready(function () {
  initAnalyticsCookies();

  if (readCookie("cookieConsent") !== "true" && readCookie("cookieConsent") !== "false") {
    $("#cookie-consent").addClass("show");
  }

  if (readCookie("cookieConsent") === "true") {
    $("#cookie-toggle").addClass("on");
  }

  $("#cookie-consent-button").click(function (e) {
    e.preventDefault();
    createCookie("cookieConsent", "true", 1000);
    initAnalyticsCookies();
    $("#cookie-consent").removeClass("show");
    $("#cookie-toggle").addClass("on");
  });
  $("#cookie-consent-backdrop").click(function (e) {
    e.preventDefault();
    createCookie("cookieConsent", "true", 1000);
    initAnalyticsCookies();
    $("#cookie-consent").removeClass("show");
    $("#cookie-toggle").addClass("on");
  });

  $("#cookie-reject-button,#cookie-more").click(function (e) {
    e.preventDefault();
    createCookie("cookieConsent", "false", 1000);
    $("#cookie-consent").removeClass("show");
    $("#cookie-toggle").removeClass("on");
  });

  $("#cookie-toggle").click(function (e) {
    e.preventDefault();
    if (readCookie("cookieConsent") === "true") {
      createCookie("cookieConsent", "false", 1000);
      $("#cookie-toggle").removeClass("on");
      $("#cookie-consent").removeClass("show");
      location.reload();
    } else {
      createCookie("cookieConsent", "true", 1000);
      $("#cookie-toggle").addClass("on");
      $("#cookie-consent").removeClass("show");
      location.reload();
    }
  });
});
