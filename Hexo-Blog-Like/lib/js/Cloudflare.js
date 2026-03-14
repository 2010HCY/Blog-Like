  function mainCloudflare() {
    window.flag = 0;
    window.url = location.host + location.pathname;
    var url = window.url;
    var flag = window.flag;
    var isRequesting = false;

    function getCloudflareApiUrl() {
      var backend = BLOG_LIKE_CONFIG.CloudflareBackend;
      if (!backend) return null;
      return /^https?:\/\//.test(backend) ? backend.replace(/\/$/, '') : backend;
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
            showAlert("点赞成功");
          } else if (delta < 0) {
            setVisitorLiked(url, false);
            setHeartLiked(false);
            showAlert("取消点赞");
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