##基于XMLHttpRequest封装的web请求##

对网络请求做了一个简单的封装，可以实现图片下载、post表单请求、get请求、json请求，from表单、jsonp请求。具体使用方法如下：


	let request = {
            method:"get",
            timeout:5000,
            bodyType:"",
            body:{
                name:"hcl"
            },
            async:true,
            headers:{
                "Content-Type":"application/x-www-form-urlencoded"
            }
        }
        ajax("http://www.wanandroid.com/article/list/0/json",request
            ).then(function(response){
                if (response.status==200) {
                    return response.json()
                }
            }).then(function(result){
                console.log(result)
            }).catch((error)=>{
                console.log(error)
            });

下面说一下request中每一个参数的说明

-   ***method***

请求方法 支持'DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'

-   ***timeout***

超时时间，只有在async未true时候才生效，同步请求不允许设置超时间

-   ***body***

请求参数，任何请求参数都放在这个对象中，用key-value方式

-   ***async***

请求方式 同步或者异步

-   ***headers***

需要向头部添加的信息

-   ***jsonp***

只有在bodyType为jsonp时候才使用，该字段用于jsonp请求，后台需要接收该字段阿里包裹返回的结果

-   ***jsonpCallbackFunction***

该字段是jsonp返回结果包裹的方法，可以不用传，不传回自动生产一个随机的字符来包裹。

-   ***bodyType***

这个字段所传字段比较多有json、from、blob，jsonp。

		json:  请求参数是json类型的
		from：  字段为这时候，body传输的是一个from表单对象
		blob：  该字段用于图片下载使用
		jsonp：  用于发送jsonp请求使用












