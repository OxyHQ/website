//LOAD PAGE
$(window).on('load', function() {
  $("#cover").fadeOut(300);
  $("body").addClass("show");
});
$(window).scroll(function(){
  if ($(this).scrollTop() > 52) {
      $('#sub-menu-wrap').addClass('fixed');
  } else {
      $('#sub-menu-wrap').removeClass('fixed');
  }
});
$(window).scroll(function() {
  var $window = $(window),
      $sub = $('#sub-menu'),
      $panel = $('section');
  var scroll = $window.scrollTop() + ($window.height() / 5);
  $panel.each(function () {
    var $this = $(this);
    if ($this.position().top <= scroll && $this.position().top + $this.height() > scroll) {
      $sub.removeClass(function (index, css) {
        return (css.match (/(^|\s)\S+/g) || []).join(' ');
      });
      $sub.addClass('' + $(this).data('sub'));
      $(this).addClass('show');
    }
  });    
}).scroll();

 //LAXX
 window.onload = function() {
  laxxx.setup()
    
  document.addEventListener('scroll', function(x) {
    laxxx.update(window.scrollY)
  }, false)
  laxxx.update(window.scrollY)
}
//LAXX DISABLE ON MOBILE
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
if (!isMobile()) {
  document.write('<script src="/js/laxxx.js"></script>');
}

$("#togglemenu").click(function() {
  $(this).toggleClass("open");
  $("header").toggleClass("open");
  $("body").toggleClass("noscroll");
});
//Open Contact Popup
$(".open-platform-contact").click(function() {
  $("#platform-contact-popup").addClass("visible");
  $("body").addClass("noscroll");
});
$(".open-sana-ai-contact").click(function() {
  $("#sana-ai-contact-popup").addClass("visible");
  $("body").addClass("noscroll");
});
$(".open-sana-ai-entrprice").click(function() {
  $("#sana-ai-enterprice").addClass("visible");
  $("body").addClass("noscroll");
});
$(".open-core-popup").click(function() {
  $("#core-popup").addClass("visible");
  $("body").addClass("noscroll");
});
$(".open-enterprise-popup").click(function() {
  $("#enterprise-popup").addClass("visible");
  $("body").addClass("noscroll");
});
$(".sais-24-popup").click(function() {
  $("#sais-24-popup").addClass("visible");
  $("body").addClass("noscroll");
});
$(".sais-24-rsvp").click(function() {
  $("#sais-24-rsvp").addClass("visible");
  $("body").addClass("noscroll");
});
$(".open-transform").click(function() {
  $("#open-transform").addClass("visible");
  $("body").addClass("noscroll");
});
$(".close-pop-up").click(function(){
  $(".pop-up").removeClass("visible");
  $("body").removeClass("noscroll");
  $(".video-pop-up").attr('src', '')
});
$("#open-svea-vid").click(function() {
  $("#svea-vid").addClass("visible");
  $("#svea-vid-vid").attr('src', $("#svea-vid-vid").attr('data-src'));
});
$("#open-alan-vid").click(function() {
  $("#alan-vid").addClass("visible");
  $("#alan-vid-vid").attr('src', $("#alan-vid-vid").attr('data-src'));
});
$("#open-merck-vid").click(function() {
  $("#merck-vid").addClass("visible");
  $("#merck-vid-vid").attr('src', $("#merck-vid-vid").attr('data-src'));
});

//YOUTUBE
$(".youtube-cover").click(function() {
  $(this).toggleClass("play");
  $("#video")[0].src += "?autoplay=1";
});

//NEO HEADER
$(".show-backdrop").click(function() {
  $("#menu-backdrop").addClass("on");
  $("#sub-menu-content").addClass("on");
  $("body").addClass("noscroll");
});
$("#products-nav-btn").click(function() {
  $("#sub-menu-content").removeClass("company");
  $("#sub-menu-content").addClass("product");
});
$("#company-nav-btn").click(function() {
  $("#sub-menu-content").removeClass("product");
  $("#sub-menu-content").addClass("company");
});
$("#sub-menu-content").click(function() {
  $("#menu-backdrop").removeClass("on");
  $("#sub-menu-content").removeClass("on");
  $(".header-wrap").removeClass("show-backdrop");
  $("body").removeClass("noscroll");
});
