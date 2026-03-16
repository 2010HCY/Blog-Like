(function(){
  // === 配置项 BEGIN ===
  var BLOG_LIKE_CONFIG = {
    enable: true,
    Backend: "Cloudflare",           // Cloudflare | Leancloud | PHP
    CloudflareBackend: "",           // Cloudflare后端地址
    PHPBackend: "/like",             // PHP后端接口地址
    AppID: "",                       // Leancloud AppID
    AppKEY: "",                      // Leancloud AppKEY
    GoogleAnalytics: false,          // 是否启用谷歌分析事件追踪，默认关闭
    GAEventCategory: "Engagement",   // 事件类别，默认Engagement
    GAEventAction: "Like"            // 事件操作名称，默认Like
  };
  // === 配置项 END ===
  if (!BLOG_LIKE_CONFIG.enable) return;

  var alertBox = null;
  var alertTimer = null;
  function showAlert(msg) {
    if (!alertBox) {
      alertBox = document.createElement("div");
      alertBox.style.position = "fixed";
      alertBox.style.top = "20%";
      alertBox.style.left = "50%";
      alertBox.style.transform = "translate(-50%, -50%)";
      alertBox.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
      alertBox.style.color = "white";
      alertBox.style.padding = "15px 30px";
      alertBox.style.borderRadius = "8px";
      alertBox.style.zIndex = "1000";
      alertBox.style.fontSize = "16px";
      alertBox.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.2)";
      document.body.appendChild(alertBox);
    }
    alertBox.innerText = msg;
    if (alertTimer) clearTimeout(alertTimer);
    alertTimer = setTimeout(function () {
      if (alertBox && alertBox.parentNode) {
        alertBox.parentNode.removeChild(alertBox);
      }
      alertBox = null;
      alertTimer = null;
    }, 1800);
  }
  function heartAnimation() {
    var hearts = document.querySelector('.heart');
    hearts.forEach(function(heart) {
      heart.classList.remove('heartAnimation');
      void heart.offsetWidth;
      heart.classList.add('heartAnimation');
      setTimeout(function(){
        heart.classList.remove('heartAnimation');
      },800);
    });
  }

  function getCookie(name) {
    var cookieArr = document.cookie.split(";");
    for (var i = 0; i < cookieArr.length; i++) {
      var cookie = cookieArr[i].trim();
      if (cookie.startsWith(name + "=")) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  }

  function setCookie(name, value, days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    var expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  function deleteCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
  }

  function getVisitorLiked(url) {
    var liked = getCookie("likes_" + url);
    return liked === "1";
  }

  function setVisitorLiked(url, liked) {
    if (liked) {
      setCookie("likes_" + url, "1", 30);
    } else {
      deleteCookie("likes_" + url);
    }
  }

  function setHeartLiked(liked) {
    var hearts = document.querySelector('.heart');
    hearts.forEach(function(heart) {
      if (liked) {
        heart.classList.add('liked');
      } else {
        heart.classList.remove('liked');
        heart.classList.remove('heartAnimation');
      }
    });
  }

  function updateZanText(num) {
    var els = document.querySelector('#zan_text');
    els.forEach(function(el) {
      el.innerHTML = num;
    });
  }
  function sendGAEvent() {
    if (BLOG_LIKE_CONFIG.GoogleAnalytics && typeof window.gtag === 'function') {
      gtag('event', BLOG_LIKE_CONFIG.GAEventAction || 'Like', {
        'event_category': BLOG_LIKE_CONFIG.GAEventCategory || 'Engagement',
        'event_label': window.url
      });
    }
  }

  // =============== Cloudflare 存储 ===============
  function mainCloudflare() {
    window.flag = 0;
    window.url = location.host + location.pathname;
    var url = window.url;
    var flag = window.flag;
    var isRequesting = false;

    function getCloudflareApiUrl() {
      return BLOG_LIKE_CONFIG.CloudflareBackend;
    }

    function cloudflareLike(delta, done) {
      var apiUrl = getCloudflareApiUrl();
      if (!apiUrl) {
        showAlert("Cloudflare 后端未配置");
        console.error('Cloudflare 后端未配置');
        if (done) done();
        return;
      }

      var bodyData = {
        Url: url,
        Add: delta
      };

      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        if (done) done();
      }

      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      })
      .then(function(resp){
        if (resp.status === 429) {
          showAlert("您已达到速率限制");
          throw new Error("429");
        }
        return resp.json();
      })
      .then(function(d){
        if (typeof d['likes'] !== "undefined") {
          updateZanText(d['likes']);
          if (delta > 0) {
            setVisitorLiked(url, true);
            setHeartLiked(true);
            heartAnimation();
          } else if (delta < 0) {
            setVisitorLiked(url, false);
            setHeartLiked(false);
          }
        } else {
          showAlert("Failed to get likes");
        }
        finish();
      })
      .catch(function(e){
        if(e && e.message === "429") return;
        showAlert("后端请求失败, 请检查Cloudflare配置");
        console.error("Cloudflare 请求失败：", e);
        finish();
      });
    }
    function likeBackend(delta, done) {
      cloudflareLike(delta, done);
    }
    window.goodplus = function(u, f) {
      if (isRequesting) return;
      var targetLiked = !getVisitorLiked(url);
      var delta = targetLiked ? 1 : -1;
      if (targetLiked) sendGAEvent();
      isRequesting = true;
      likeBackend(delta, function(){
        isRequesting = false;
      });
    };

    document.addEventListener('DOMContentLoaded', function() {
      setHeartLiked(getVisitorLiked(url));
      likeBackend(0);
    });
  }

  // =============== Leancloud 存储 ===============
  function mainLeancloud() {
    window.flag = 0;
    window.url = location.host + location.pathname;
    var url = window.url;
    var flag = window.flag;
    var isRequesting = false;

    function initLeanCloud() {
      if(!BLOG_LIKE_CONFIG.AppID || !BLOG_LIKE_CONFIG.AppKEY) {
        showAlert("LeanCloud 配置不完整");
        console.error('Leancloud密钥未配置！');
        return false;
      }
      try {
        AV.init({
          appId: BLOG_LIKE_CONFIG.AppID,
          appKey: BLOG_LIKE_CONFIG.AppKEY,
        });
      } catch(e) { showAlert("LeanCloud 初始化失败"); return false; }
      return true;
    }
    function leanCloudLike(delta, done) {
      if (!initLeanCloud()) { if (done) done(); return; }
      var Zan = AV.Object.extend('Zan');
      var query = new AV.Query('Zan');
      query.equalTo("url", url);
      query.find().then(function (results) {
        if (results.length === 0) {
          var zan = new Zan();
          var nextViews = delta > 0 ? 1 : 0;
          zan.set('url', url);
          zan.set('views', nextViews);
          zan.save().then(function () {
            updateZanText(nextViews);
            if (delta > 0) {
              setVisitorLiked(url, true);
              setHeartLiked(true);
              heartAnimation();
            } else if (delta < 0) {
              setVisitorLiked(url, false);
              setHeartLiked(false);
            }
            if (done) done();
          });
        } else {
          var zan = results[0];
          var vViews = zan.get('views') || 0;
          if (delta > 0) {
            var inc = vViews + 1;
            zan.set('views', inc);
            zan.save().then(function () {
              updateZanText(inc);
              setVisitorLiked(url, true);
              setHeartLiked(true);
              heartAnimation();
              if (done) done();
            });
          } else if (delta < 0) {
            var dec = Math.max(0, vViews - 1);
            zan.set('views', dec);
            zan.save().then(function () {
              updateZanText(dec);
              setVisitorLiked(url, false);
              setHeartLiked(false);
              if (done) done();
            });
          } else {
            updateZanText(vViews);
            if (done) done();
          }
        }
      }).catch(function (error) {
        showAlert("LeanCloud 失败: " + (error.message?error.message:error));
        console.error("查询或保存出错：", error);
        if (done) done();
      });
    }
    function likeBackend(delta, done) {
      leanCloudLike(delta, done);
    }
    window.goodplus = function(u, f) {
      if (isRequesting) return;
      var targetLiked = !getVisitorLiked(url);
      var delta = targetLiked ? 1 : -1;
      if (targetLiked) sendGAEvent();
      isRequesting = true;
      likeBackend(delta, function(){
        isRequesting = false;
      });
    };
    document.addEventListener('DOMContentLoaded', function() {
      setHeartLiked(getVisitorLiked(url));
      likeBackend(0);
    });
  }

  // =============== PHP 后端 ===============
  function mainPHP() {
    window.flag = 0;
    window.url = location.host + location.pathname;
    var url = window.url;
    var flag = window.flag;
    var isRequesting = false;

    function getPHPApiUrl() {
      return BLOG_LIKE_CONFIG.CloudflareBackend;
    }

    function phpLike(delta, done) {
      var apiUrl = getPHPApiUrl();
      if (!apiUrl) {
        showAlert("PHP 后端未配置");
        console.error('PHP 后端地址未配置！');
        if (done) done();
        return;
      }

      var bodyData = {
        Url: url,
        Add: delta
      };

      var xhr = new XMLHttpRequest();
      xhr.open("POST", apiUrl, true);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var response = JSON.parse(xhr.responseText);
              if (typeof response.likes !== "undefined") {
                updateZanText(response.likes);
                if (delta > 0) {
                  setVisitorLiked(url, true);
                  setHeartLiked(true);
                  heartAnimation();
                } else if (delta < 0) {
                  setVisitorLiked(url, false);
                  setHeartLiked(false);
                }
              } else {
                showAlert("后端请求失败,请稍后再试");
              }
            } catch (e) {
              showAlert("解析 JSON 失败");
              console.error("解析 PHP 后端返回失败：", e);
            }
          } else {
            showAlert("请求失败, 状态码: " + xhr.status);
          }
          if (done) done();
        }
      };
      xhr.send(JSON.stringify(bodyData));
    }

    function likeBackend(delta, done) {
      phpLike(delta, done);
    }

    window.goodplus = function(u, f) {
      if (isRequesting) return;
      var targetLiked = !getVisitorLiked(url);
      var delta = targetLiked ? 1 : -1;
      if (targetLiked) sendGAEvent();
      isRequesting = true;
      likeBackend(delta, function(){
        isRequesting = false;
      });
    };

    document.addEventListener('DOMContentLoaded', function() {
      setHeartLiked(getVisitorLiked(url));
      likeBackend(0);
    });
  }

  // =============== 主入口 ===============
  if (BLOG_LIKE_CONFIG.Backend === "Leancloud") {
    var s = document.createElement('script');
    s.src = "/Blog-Like/av-min.js";
    s.onload = mainLeancloud;
    s.onerror = function() {
      showAlert("LeanCloud SDK 文件加载失败，请检查 av-min.js 是否存在且未损坏！");
      console.error("LeanCloud SDK 加载失败: /Blog-Like/av-min.js");
    };
    document.head.appendChild(s);
  } else if (BLOG_LIKE_CONFIG.Backend === "PHP") {
    mainPHP();
  } else {
    mainCloudflare();
  }
})();