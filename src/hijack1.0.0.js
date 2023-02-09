(function (window, undefined) {
    var hijack = function () { },
        // hash map，记录是否被扫描过
        checkedMap = {},
        checkedID = 0;

    // 创建白名单
    var whiteList = [
        'www.baidu.com',
        'www.google.cn'
    ];
    // 创建黑名单
    var blackList = [
        '192.168.1.0'
    ];

    // 关键词黑名单
    var keywordBlackList = [
        'xss',
        'BAIDU_SSP__wrapper',
        'BAIDU_DSPUI_FLOWBAR'
    ];

    // 触发内联事件拦截
    function triggerIE() {
        var i = 0,
            obj = null;
        for (obj in document) {
            if (/^on./.test(obj)) {
                // 
                preventInterEvent(obj, i++)
            }
        }
    }

    // 内联事件拦截
    /**
     * 
     * @param {[String]} eventName [内联事件名]
     * @param {[Number]} eventID   [内联事件ID]
     * @param {[type]}             [description]
     */
    function preventInterEvent(eventName, eventID) {
        var isClick = (eventName == 'onclick')

        document.addEventListener(eventName.substr(2), function (e) {
            // 扫描元素是否存在内联事件
        }, true);
    }

    /**
     * 
     * @param {[DOM]} elem [DOM元素]
     * @param {[Boolean]} isClick [是否内联点击事件]
     * @param {[String]} eventName [内联 on* 事件名]
     * @param {[Number]} eventID [给每一个内联事件一个ID]
     */
    function scanElement(elem, isClick, eventName, eventID) {
        var flag = elem['isScan'],
            code = '',
            hash = 0;

        // 跳过已经扫描的事件
        if (!flag) {
            flag = elem['isScan'] = ++checkedID;
        }

        hash = (flag << 8) | eventID;

        if (hash in checkedMap) {
            return;
        }

        checkedMap[hash] = true;

        // 非节点元素
        if (elem.nodeType != Node.ELEMENT_NODE) {
            return;
        }

        if (elem[eventName]) {
            code = elem.getAttribute(eventName);
            if (code && blackListMatch(keywordBlackList, code)) {
                elem[eventName] = null;
                hijackReport('拦截可疑内联事件', code)
            }
        }

        // 扫描 <a href='javascript:'>的脚本
        

        // 递归扫描上级元素
        scanElement(elem.parentNode)
    }

    /**
     * 
     * @param {[Array]} blackList [黑名单]
     * @param {[String]} value [需要验证的字符串]
     * @returns {[Boolean]}  false --验证不通过  true --验证通过
     */
    function blackListMatch(blackList, value) {
        var length = blackList.length,
            i = 0;
        for (; i < length; i++) {
            var reg = new RegExp(blackList[i], 'i');
            if (reg.test(value)) {
                return true;
            }
        }
        return false;
    }

    function hijackReport(name, value) {
        var img = document.createElement('img'),
            hijackName = name,
            hijackValue = value.toString(),
            curDate = new Date().getTime();
        console.log('hijackName:' + hijackName + 'value' + hijackValue + '当前日期：' + curDate);
    }
})(window)