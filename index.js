/**
 * jsonp请求方法
 */
//jsonp 请求返回的包裹方法名称
function generateCallbackFunction() {
	return 'jsonp_' + Date.now() + '_' + Math.ceil(Math.random() * 100000);
};
//清除script标签中的function函数
function clearFunction(functionName) {
	try {
		delete window[functionName];
	} catch (e) {
		window[functionName] = undefined;
	}
};
//移除script标签
function removeScript(scriptId) {
	var script = document.getElementById(scriptId);
	if (script) {
		document.getElementsByTagName('head')[0].removeChild(script);
	}
};
//处理jsonp返回的结果
function ResponseJsonp(response) {
	this.status = 200;
	this.response = response;
	this.json = function() {
		try {　
			if (typeof response == "object") {
				return response
			} else {
				return JSON.parse(response)
			}　
		} catch (error) {
			return {}
		}
	};

}
//发送jsonp请求
function ajaxjsonp(request, resolve, reject) {
	var timeoutId = undefined;
	var callbackFunction = request.jsonpCallbackFunction || generateCallbackFunction();
	var scriptId = '_' + callbackFunction;
	window[callbackFunction] = function(response) {
		resolve(new ResponseJsonp(response))
		if (timeoutId) {
			clearTimeout(timeoutId)
		};
		removeScript(scriptId);
		clearFunction(callbackFunction);
	};
	var jsonpScript = document.createElement('script');
	jsonpScript.setAttribute('src', '' + request.url + "&" + request.jsonp + '=' + callbackFunction);
	jsonpScript.id = scriptId;
	document.getElementsByTagName('head')[0].appendChild(jsonpScript);

	//请求超时
	timeoutId = setTimeout(function() {
		clearFunction(callbackFunction);
		removeScript(scriptId);
		reject("请求超时")
	}, request.timeout);

	//出现 404/500
	jsonpScript.onerror = function() {
		clearFunction(callbackFunction);
		removeScript(scriptId);
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		reject('JSONP request to ' + request.url + ' failed')
	};
}
/**
 * 正常XMLHttpRequest请求
 * @type {Array}
 */
const methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']
//规范的HTTP方法
function normalizeMethod(method, bodyType) {
	if (bodyType.toLowerCase() == "jsonp") { //jsonp请求只能是get请求
		return "GET"
	} else {
		let upcased = method.toUpperCase()
		return methods.indexOf(upcased) > -1 ? upcased : method
	}
}
//拼接get请求的url
function xhrUrl(url, body) {
	body = body || {}
	if (typeof body == 'object') {
		let bodys = ""
		Object.keys(body).forEach(function(key) {
			bodys += key + "=" + encodeURIComponent(body[key]) + "&";
		})
		if (bodys) {
			url = url + (url.indexOf('?') > -1 ? '' : '?') + bodys.substring(0, bodys.length - 1);
		} else {
			url = url + (url.indexOf('?') > -1 ? '' : '?') + bodys
		}
	}
	return url;
}
//根据bodyType设置body值
function xhrSendData(bodyType, body) {
	body = body || {}
	if (bodyType.toLowerCase() == "http") {
		let formData = new FormData()
		let bodys = [];
		Object.keys(body).forEach(function(key) {
			formData.append(encodeURIComponent(key), encodeURIComponent(body[key]))
			// bodys.push(encodeURIComponent(key) + '=' + encodeURIComponent(body[key]));
		})
		return formData;
	} else if (bodyType.toLowerCase() == "json") {
		return JSON.stringify(body);
	} else if (bodyType.toLowerCase() == "from") {
		return new FormData(body);
	}
}
//设置头部信息
function xhrHeaders(method, bodyType, headers) {
	headers = headers || {}
	if (method != "GET") {
		if (bodyType.toLowerCase() == "http") {
			if (!headers["Content-Type"]) {
				headers["Content-Type"] = "application/x-www-form-urlencoded";
			}
			return headers;
		} else if (bodyType.toLowerCase() == "json") {
			if (!headers["Content-Type"]) {
				headers["Content-Type"] = "application/json;charset=utf-8";
			}
			return headers;
		} else {
			return headers;
		}
	} else {
		return headers;
	}

}
//返回头部信息
function parseHeaders(rawHeaders) {
	let headers = {}
	var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
	preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
		var parts = line.split(':')
		var key = parts.shift().trim()
		if (key) {
			var value = parts.join(':').trim()
			headers[key] = value
		}
	})
	return headers
}
//处理请求参数
function Request(url, options) {
	options = options || {}
	this.bodyType = options.bodyType || "http";
	this.method = normalizeMethod(options.method || 'GET', this.bodyType);
	this.body = this.method == "GET" ? null : xhrSendData(this.bodyType, options.body);
	this.url = this.method == "GET" ? xhrUrl(String(url), options.body) : String(url);
	this.headers = xhrHeaders(this.method, this.bodyType, options.headers);
	this.async = options.async == null ? true : options.async;
	this.timeout = options.timeout || 3000;
	this.jsonp = options.jsonp || "jsoncallback";
	this.jsonpCallbackFunction = options.jsonpCallbackFunction;

}
//处理返回的结果
function Response(xhr) {
	this.status = xhr.status;
	this.headers = parseHeaders(xhr.getAllResponseHeaders());
	this.response = 'response' in xhr ? xhr.response : xhr.responseText;
	this.getHeader = function(key) {
		return this.headers[key]

	};
	this.json = function() {
		try {　　
			return JSON.parse(this.response)
		} catch (error) {
			return {}
		}
	};

}
//发送请求
export function ajax(url, options) {
	return new Promise(function(resolve, reject) {
		let request = new Request(url, options);
		if (request.bodyType.toLowerCase() == "jsonp") {
			ajaxjsonp(request, resolve, reject)
			return
		}
		var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'); //兼容ie
		if (request.async === true) {
			xhr.timeout = request.timeout;
		} else {
			xhr.timeout = 0;
		}
		xhr.open(request.method, request.url, request.async);
		Object.keys(request.headers).forEach(function(key) {
			xhr.setRequestHeader(key, request.headers[key]);
		})
		if (request.bodyType.toLowerCase() == "blob") {
			xhr.responseType = 'blob';
		}
		xhr.send(request.body)
		if (request.async) { //异步
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status != 0) {
					resolve(new Response(xhr));
				}
			}
			xhr.ontimeout = function() {
				reject('请求超时');
			}
			xhr.onerror = function() {
				reject('Network request failed');
			}
		} else { //同步
			let response = 'response' in xhr ? xhr.response : xhr.responseText
			resolve(new Response(xhr));
		}
	})
}