window.mobilecheck = function () {
  var check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  // console.log(check);
  return check;
};

$(document).ready(function () {
  if ($(".banner:not(.banner_trigger) .banner-top").length > 0) {
    setTimeout(function () {
      pushHeaderFixedHeight($(".header .navbar"));
    }, 250);


    $(window).resize(function () {
      pushHeaderFixedHeight($(".header .navbar"));
    });
  }

  //bsnav mobile fixedTop
  if ($('.bsnav-mobile.right').length > 0 || $('.bsnav-mobile.left').length > 0) {
    if ($(".banner:not(.banner_trigger) .banner-top").length > 0) {
      setTimeout(function () {
        pushHeaderFixedHeightMobile($(".header .navbar"));
      }, 250);

      $(window).resize(function () {
        pushHeaderFixedHeightMobile($(".header .navbar"));
      });
    }
  }

  $(window).scroll(function (e) {
    scrollCheck();
  });


  // setTimeout(function () {
  //     scrollCheck()
  // }, 250);


  //gotop Animate
  if ($(".footer .gotop").length > 0) {
    $(".footer .gotop a").click(function (e) {
      $("html,body").animate({ scrollTop: 0 }, 600);
      return false;
    });
  }
  if ($(".floating_circle .fcgotop").length > 0) {
    $(".floating_circle .fcgotop").click(function (e) {
      $("html,body").animate({ scrollTop: 0 }, 600);
      $('.floating_circle #fmenu-open').prop('checked', false);
      return false;
    });

  }


  



  //bsnav
  $(".bsnav .navbar-toggler").click(function () {
    if ($(".bsnavclose.close-btn").length > 0 && $(".bsnav-mobile").hasClass("full") || $(".bsnav-mobile").hasClass("down")) {
      if ($(".bsnavclose.close-btn").hasClass("active")) {
        $(".bsnavclose.close-btn").removeClass("active");
      } else {
        $(".bsnavclose.close-btn").addClass("active");
      }
    }

    $(".bsnav-mobile .navbar-nav.navbar-mobile > .nav-item > .nav-link").click(function () {
      $(".bsnav-mobile .navbar-nav.navbar-mobile > .nav-item > .nav-link").not(this).parent("li").removeClass("in");
      $(".bsnav-mobile .navbar-nav.navbar-mobile > .nav-item > .nav-link").not(this).next("ul").slideUp();

    });

    return false;
  });


  $(".collapse-side-btn").click(function () {
    $(".collapse-side-content").toggleClass("show");
    $(".side .navbar > .collapse").toggleClass("show");
  });

  //側選單單層收合
  if ($(".side .filter-title .collapsed-btn").length > 0) {

    $(".side .filter-title .collapsed-btn").each(function (index, element) {

      var filterCont = $(this).parents(".filter-item").find(".filter-content");
      if (filterCont.length > 0) {
        var originNum = $(this).data("num");
        $(this).attr("data-bs-toggle", "collapse");
        $(this).attr("aria-expanded", "true");
        $(this).attr("aria-controls", "collapse_" + originNum);
        $(this).attr("href", "#collapse_" + originNum);
        $(this).addClass("dropdown-toggle");
        filterCont.attr("id", "collapse_" + originNum);
        // filterCont.removeClass("show");    
      }
    });
  }

  if ($('[data-datepicker]').length > 0) {
    var now = Date.now();

    $('[data-datepicker]').datepicker({
      language: 'zh-CN',
      format: 'yyyy-mm-dd',
      autoHide: true,
      startDate: now,
      weekStart: 0,
    });

    var $startDate = $('.startDate');
    var $endDate = $('.endDate');

    $startDate.datepicker({
      autoHide: true,
    });
    $endDate.datepicker({
      autoHide: true,
      startDate: $startDate.datepicker('getDate'),
    });

    $startDate.on('change', function () {
      $endDate.datepicker('setStartDate', $startDate.datepicker('getDate'));
    });
  }

  if ($("[data-fancybox]").length > 0) {
    Fancybox.bind('[data-fancybox]', {
      Toolbar: {
        display: {
          left: ["infobar"],
          right: ["zoomIn", "zoomOut", "close"],
        },
      },
    });
  }

    aniAos(); // 初始化 AOS

    $(window).resize(function () {
        AOS.refresh(); // 確保視窗大小變化時刷新 AOS
    });

    $(window).on("scroll", function () {
        AOS.refresh();
    });

    // 確保所有圖片載入完成後執行 AOS.refresh()
    $(window).on("load", function () {
        AOS.refresh(); // 所有圖片載入完後刷新 AOS
    });

});

function aniAos() {
    AOS.init({
        duration: 900,
        once: true,
    });
}


//無障礙TAB設定
let isTabPressed = false;

// 記錄 Tab 鍵按下狀態
document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
        isTabPressed = true;
    }

    const key = e.key.toUpperCase();
    const isTriggered = isTabPressed || e.altKey;

    if (isTriggered && ['U', 'C', 'B'].includes(key)) {
        let targetId = '';
        let targetWrapper = null;

        if (key === 'U') {
            targetId = 'header-block';
            targetWrapper = document.querySelector('header');
        } else if (key === 'C') {
            targetId = 'main-block';
            targetWrapper = document.querySelector('main');
        } else if (key === 'B') {
            targetId = 'footer-block';
            targetWrapper = document.querySelector('footer');
        }

        const targetAnchor = document.getElementById(targetId);

        if (targetWrapper && targetAnchor) {
            e.preventDefault();

            // 1. 平滑捲動至目標區塊
            targetWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // 2. 焦點直接進入該錨點（防止原生跳動影響平滑滾動）
            targetAnchor.focus({ preventScroll: true });
        }
    }
});

// 重設 Tab 鍵狀態
document.addEventListener('keyup', function (e) {
    if (e.key === 'Tab') {
        isTabPressed = false;
    }
});


// 定義 resetOption 函數，接收按鈕元素作為參數
function resetOption(button) {
  // console.log('start');

  // 找到按鈕的父元素 .tab-pane
  var tabPane = $(button).closest('.tab-pane');
  // console.log(tabPane);
  var tabPaneFreq = tabPane.find('.freq');
  // console.log(tabPaneFreq);

  // 遍歷該 .tab-pane 內的所有 .freq 中的 input:radio 元素並取消選中
  tabPaneFreq.find('input:radio').each(function () {
    // console.log($(this));
    $(this).prop('checked', false);
  });
}

function tooltipUpdate() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = Array.from(tooltipTriggerList).map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

function pushHeaderFixedHeight(t) {
  var winW = $(window).width(),
    pushH = t.outerHeight();
  $(".banner").css("padding-top", pushH);
}

function pushHeaderFixedHeightMobile(t) {
  var pushH = t.outerHeight();
  if ($(".top_marquee").length > 0) {
    pushH += $(".top_marquee").outerHeight();
  }

  if (t.hasClass("scrollToFixed") || t.parents(".header").hasClass("scrolldownHeader")) {
    pushH = ($(".top_marquee").length > 0) ? $(".top_marquee").outerHeight() : 0;
  }

  $(".bsnav-mobile ").css("top", pushH);
  $(".bsnav-mobile-overlay").css("top", pushH);
}

function scrollCheck() {
  var win_h = $(window).scrollTop();
  (win_h > 10) ? $("body").addClass("is_scroll") : $("body").removeClass("is_scroll");
}

var thisUrl = window.location.href;
var windowSize = "height=500,width=600";
var thisTitle = document.title;
function shareTo(target, currUrl = "") {

  if (currUrl === "") {
    currUrl = thisUrl;
  }

  switch (target) {
    case "fb":
      window.open('http://www.facebook.com/share.php?u='.concat(encodeURIComponent(currUrl)), '', config = windowSize);
      break;
    case "line":
      window.open('https://lineit.line.me/share/ui?url=' + encodeURIComponent(currUrl) + '&text=' + encodeURIComponent(document.title), '_blank', config = windowSize);
      break;
    case "twitter":
      window.open('http://twitter.com/home/?status='.concat(encodeURIComponent(document.title)).concat(' ').concat(encodeURIComponent(currUrl)), '', config = windowSize);
      break;
    case "mail":
      window.location = "mailto:?subject=" + thisTitle + "&body=" + thisTitle + currUrl, '', config = windowSize;
      break;
    case "linkedin":
      window.open('https://www.linkedin.com/shareArticle?mini=true&url='.concat(encodeURIComponent(currUrl)).concat('&title=').concat(encodeURIComponent(document.title)).concat('&summary=').concat(encodeURIComponent(document.title)).concat('&source=LinkedIn').concat(' '), '', config = windowSize);
      break;
  }
}



