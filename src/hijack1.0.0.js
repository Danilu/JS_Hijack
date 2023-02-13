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

    /**
     * 内联事件拦截
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
     * 扫描元素是否存在内联事件
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
        if (isClick && elem.tagName == 'A' && elem.protocol == 'javascript:') {
            var code = elem.href.substr(11);
            if (blackListMatch(keywordBlackList, string)) {
                // 注销代码
                elem.href = 'javascript:void(0)';
                console.log('拦截可疑事件:' + code);
                hijackReport('拦截可疑javascript:代码', code);
            }
        }

        // 递归扫描上级元素
        scanElement(elem.parentNode)
    }

    /**
     * 黑名单匹配
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

    /**
     * 自定义上报
     * @param {[String]} name 拦截类型
     * @param {[String]} value 拦截值
     */
    function hijackReport(name, value) {
        var hijackName = name,
            hijackValue = value.toString(),
            curDate = new Date().getTime();
        console.log('hijackName:' + hijackName + 'value' + hijackValue + '当前日期：' + curDate);
    }

    // 主动防御MutationEvent
    function interceptionStaticScript() {
        // 兼容
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

        // 实例化一个新的Mutation观察者对象
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // 返回被添加的节点，直到是null
                var nodes = mutation.addedNodes;

                // 遍历
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    // 扫描script 和 ifram
                    if (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME') {
                        // 拦截到可疑iframe
                        if (node.tagName === 'IFRAME' && node.srcdoc) {
                            node.parentNode.removeChild(node);
                            console.log('拦截到可疑iframe', node.srcdoc);
                            hijackReport('拦截可疑静态脚本', node.srcdoc);

                        } else if (node.src) {
                            // 只放行白名单
                            if (!whileListMatch(whiteList, node.src)) {
                                node.parentNode.removeChild(node);
                                // 上报
                                console.log('拦截可疑静态脚本:', node.src);
                                hijackReport('拦截可疑静态脚本', node.src);
                            }
                        }
                    }
                }
            })
        })

        observer.observe(document, {
            subtree: true,
            childList: true
        })
    }

    /**
     * 使用DOMNodeInserted 进行动态脚本检测
     */
    function interceptionDynamicScript() {
        // DOMNodeInserted 的执行早于 MutationObserver
        document.addEventListener('DOMNodeInserted', function (e) {
            var node = e.target;
            if (/xss/i.test(node.src) || /xss/i.test(node.innerHTML)) {
                node.parentNode.removeChild(node);
                console.log('拦截可疑动态脚本:', node);
                hijackReport('拦截可疑动态脚本', node.src);
            }
        }, true);
    }

    // 重写 createElement
    function resetCreateElement() { }

    /**
     * 重写单个 window 窗口的 document.write 属性
     * @param  {[BOM]} window [浏览器window对象]
     * @return {[type]}       [description]
     */
    function resetDocumentWrite(window) {
        var old_write = window.document.write;

        window.document.write = function (string) {
            if (blackListMatch(keywordBlackList, string)) {
                console.log('拦截可疑模块:', string);
                hijackReport('拦截可疑document-write', string);
                return;
            }

            // 调用原始接口
            old_write.apply(document, arguments);
        }
    }

    /**
   * 重写单个 window 窗口的 setAttribute 属性
   * @param  {[BOM]} window [浏览器window对象]
   * @return {[type]} [description]
   */
    function resetSetAttribute(window) {
        // 保存原有接口
        var old_setAttribute = window.Element.prototype.setAttribute;

        // 重写 setAttribute 接口
        window.Element.prototype.setAttribute = function (name, value) {

            // 额外细节实现
            if (this.tagName == 'SCRIPT' && /^src$/i.test(name)) {

                if (!whileListMatch(whiteList, value)) {
                    console.log('拦截可疑模块:', value);
                    hijackReport('拦截可疑setAttribute', value);
                    return;
                }
            }

            // 调用原始接口
            old_setAttribute.apply(this, arguments);
        };
    }

    /**
     * 使用 MutationObserver 对生成的 iframe 页面进行监控，
     * 防止调用内部原生 setAttribute 及 document.write
     * @return {[type]} [description]
     */
    function defenseIframe() {
        // 先保护当前页面
        installHook(window);
    }

    /**
     * 实现单个 window 窗口的 setAttribute保护
     * @param  {[BOM]} window [浏览器window对象]
     * @return {[type]}       [description]
     */
    function installHook(window) {
        // 重写单个 window 窗口的 setAttribute 属性
        resetSetAttribute(window);
        // 重写单个 window 窗口的 document.Write 属性
        resetDocumentWrite(window);

        // MutationObserver 的不同兼容性写法
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

        // 该构造函数用来实例化一个新的 Mutation 观察者对象
        // Mutation 观察者对象能监听在某个范围内的 DOM 树变化
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // 返回被添加的节点,或者为null.
                var nodes = mutation.addedNodes;

                // 逐个遍历
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];

                    // 给生成的 iframe 里环境也装上重写的钩子
                    if (node.tagName == 'IFRAME') {
                        installHook(node.contentWindow);
                    }
                }
            });
        });

        observer.observe(document, {
            subtree: true,
            childList: true
        });
    }

    /**
     * 使用 Object.defineProperty，锁住call和apply，使之无法被重写
     * @return {[type]} [description]
     */
    function lockCallAndApply() {
        // 锁住 call
        Object.defineProperty(Function.prototype, 'call', {
            value: Function.prototype.call,
            // 当且仅当仅当该属性的 writable 为 true 时，该属性才能被赋值运算符改变
            writable: false,
            // 当且仅当该属性的 configurable 为 true 时，该属性才能够被改变，也能够被删除
            configurable: false,
            enumerable: true
        });
        // 锁住 apply
        Object.defineProperty(Function.prototype, 'apply', {
            value: Function.prototype.apply,
            writable: false,
            configurable: false,
            enumerable: true
        });
    }

    /**
     * 重定向iframe hijack（页面被iframe包裹）
     */
    function redirectionIframeHijack() {
        var flag = 'iframe_hijack_redirected';
        // 当前页面存在于一个 iframe 中
        // 此处需要建立一个白名单匹配规则，白名单默认放行
        if (self != top) {
            var
                // 使用 document.referrer 可以拿到跨域 iframe 父页面的 URL
                parentUrl = document.referrer,
                length = whiteList.length,
                i = 0;

            for (; i < length; i++) {
                // 建立白名单正则
                var reg = new RegExp(whiteList[i], 'i');

                // 存在白名单中，放行
                if (reg.test(parentUrl)) {
                    return;
                }
            }

            var url = location.href;
            var parts = url.split('#');
            if (location.search) {
                parts[0] += '&' + flag + '=1';
            } else {
                parts[0] += '?' + flag + '=1';
            }
            try {
                console.log('页面被嵌入iframe中:', parentUrl);
                hijackReport('页面被嵌入iframe中', parentUrl);
                top.location.href = parts.join('#');
            } catch (e) { }
        }
    }

    /**
  * [白名单匹配]
  * @param  {[Array]} whileList [白名单]
  * @param  {[String]} value    [需要验证的字符串]
  * @return {[Boolean]}         [false -- 验证不通过，true -- 验证通过]
  */
    function whileListMatch(whileList, value) {
        var length = whileList.length,
            i = 0;

        for (; i < length; i++) {
            // 建立白名单正则
            var reg = new RegExp(whiteList[i], 'i');

            // 存在白名单中，放行
            if (reg.test(value)) {
                return true;
            }
        }
        return false;
    }

    // 初始化方法
    hijack.init = function () {
        // 触发内联事件拦截
        triggerIE();
        // 进行静态脚本拦截
        interceptionStaticScript();
        // 进行动态脚本拦截
        // interceptionDynamicScript();
        // 锁住 apply 和 call
        lockCallAndApply();
        // 对当前窗口及多重内嵌 iframe 进行 setAttribute | document.write 重写
        defenseIframe();
        // 对iframe劫持进行重定向
        redirectionIframeHijack();
    }

    window.hijack = hijack;

})(window)