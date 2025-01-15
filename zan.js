AV.init({
    appId: '你的ID',
    appKey: '你的KEY'
});

var flag = 0; 
var url = encodeURIComponent(window.location.href);

function goodplus(url) {
    senddata(url, 1); 
}

function senddata(url, flag) {
    var Zan = AV.Object.extend('Zan');
    var query = new AV.Query('Zan'); 
    query.equalTo("url", url); 

    query.find().then(function (results) {
        if (results.length === 0) {
            console.log("新增记录");
            var zan = new Zan();
            zan.set('url', url);
            zan.set('views', flag === 1 ? 1 : 0);
            zan.save().then(function () {
                document.getElementById("zan_text").innerHTML = flag === 1 ? "1" : "0";
            });
        } else {
            var zan = results[0];
            var vViews = zan.get('views');
            if (flag === 1) {
                console.log("更新记录");
                zan.set('views', vViews + 1);
                zan.save().then(function () {
                    document.getElementById("zan_text").innerHTML = vViews + 1;
                });
            } else {
                console.log("显示已有数据");
                document.getElementById("zan_text").innerHTML = vViews;
            }
        }
    }).catch(function (error) {
        console.error("查询或保存出错：", error);
    });
}

function remcls() {
    $('.heart').removeClass("heartAnimation");
}

function addcls() {
    $('.heart').addClass("heartAnimation");
}

$(document).ready(function () {
    senddata(url, flag);

    $('body').on("click", '.heart', function () {
        var heartClass = $('.heart').attr("class");
        if (heartClass === 'heart') {
            $('.heart').addClass("heartAnimation");
            setTimeout(remcls, 800);
        } else {
            remcls();
            setTimeout(addcls, 100);
        }
    });
});
