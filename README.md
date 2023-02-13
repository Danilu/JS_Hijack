# JS_Hijack

使用**JavaScript**实现前端防御**http劫持**以及防御**XSS攻击**并进行上报

## 安全问题

web中常见的安全问题有：

1. SQL注入
2. XSS攻击
3. CSRF
4. 点击劫持

### SQL注入

**原理：**通过把SQL语句插入到web表单提交/输入域名/页面请求时提交的字符串中，达到欺骗服务器执行恶意SQL命令的目的

**防御：**

1. 进行输入校验
2. SQL参数化，避免动态拼装
3. 尽量不适用管理员权限进行数据库连接，每个应用应该有单独的权限，对应有限个数据库
4. 避免机密信息明文存放

### XSS攻击

**原理：**不需要做任何登录认证，攻击者通过合法的操作(如在`url`或评论框中输入)，往`web`页面插入恶意的`html`标签或`JavaScript`代码

**防御：**

1. `encode`:最普遍的做法是转义输入输出的内容，对于引号、尖括号、斜杠等进行转义

   ```
   function transform(str) {
   	str = str.replace(/&/g, "&amp;");
   	str = str.replace(/</g, "&lt;");
   	str = str.eplace(/>/g, "&gt;");
   	str = str.replace(/"/g, "&quto;");
   	str = str.replace(/'/g, "&##39;");
   	str = str.replace(/`/g, "&##96;");
      str = str.replace(/\//g, "&##x2F;");
      return str
   }
   ```

   

2. 富文本设置白名单

3. 过滤:移除用户输入的和事件相关的属性。如`onerror`可以自动触发攻击，还有`onclick`等。移除用户输入的`style`，`script`，`iframe`节点，尤其是`script`节点，它支持跨域，一定要移除。

### CSRF

```
CSRF`即跨站请求伪造`(cross-site request forgery)
```

要完成一次`CSRF`攻击，受害者必须满足两个必要的条件:

1. 登录受信任网站`A`，并在本地生成`cookie`。(如果用户没有登录网站`A`，那么网站`B`在请求网站`A`的接口时，会诱导用户登录`A`)
2. 在不登出`A`的情况下，访问危险网站`B`。(其实是利用了网站`A`的漏洞)

**防御：**

1. `Token`验证:(最常用)

   - 服务器发送给客户端一个`Token`

   - 客户端提交的表单中带着这个`Token`

   - 如果这个`Token`不合法，服务器就拒绝这个请求
2. 隐藏令牌:

     把`Token`隐藏在`Http`的`Head`头中。隐藏令牌和`Token`验证有点像，本质上没有太大区别，只是使用方式上有区别。
3. Referer验证:

​		Referer指的是页面请求来源。意思是，只接受本站的请求，服务器才做响应。如果不是，就拦截。

### 点击劫持

**原理：**击劫持是一种视觉欺骗的攻击手段。攻击者将需要攻击的网站通过`iframe`嵌套的方式嵌入自己的网页中，并将`iframe`设置为透明，在页面中透出一个按钮诱导用户点击。

**防御：**

1. `X-FRAME-OPTIONS`

	`X-FRAME-OPTIONS`是一个`Http`响应头，这个响应头就是为了防御用`iframe`嵌套的点击 劫持攻击。

	`X-FRAME-OPTIONS`有三个值可选，分别是

	- `DENY`，表示页面不允许通过iframe的方式展示
	- `SAMEORIGIN`，表示页面可以在相同域名下通过iframe的方式展示
	
	- `FROM`，表示页面可以在指定来源的`iframe`中展示

2. `JS`防御

   对于不兼容`X-FRAME-OPTIONS`的浏览器，只能通过`JS`的方式来防御点击劫持
