Java.perform(function () {
  const log = (message) => console.log(`[WebView] ${message}`)

  const WebView = Java.use("android.webkit.WebView");

  WebView.addJavascriptInterface.overload("java.lang.Object", "java.lang.String").implementation = function (object, interfaceName) {
    const retval = this.addJavascriptInterface(object, interfaceName);
    log("WebView.addJavascriptInterface(obj=" + object.$className + ", name=" + interfaceName + ") => " + retval);

    // instantiate the specific object as the subclass
    const instance = Java.cast(object, Java.use(object.$className));
    const methods = instance.class.getDeclaredMethods();

    methods.forEach(function (method) {
      const name = method.getName();
      const parameters = method.getParameterTypes().map(parameter => parameter.getName());

      // https://github.com/iddoeldor/frida-snippets#hook-overloads
      instance[name].overload.apply(instance[name], parameters).implementation = function (...args) {
        const retval = this[name].apply(this, args);
        console.log(`[JavascriptInterface] ${interfaceName}.${name}(${args.map(arg => `'${arg}'`).join(", ")}) => ${JSON.stringify(retval)}`);
        return retval;
      };
    });

    return retval;
  };

  WebView.evaluateJavascript.overload("java.lang.String", "android.webkit.ValueCallback").implementation = function (script, callback) {
    const retval = this.evaluateJavascript(script, callback);

    // omit __frida__ scripts to avoid noise in logs
    if (script.includes("__frida__") == false) {
      log("WebView.evaluateJavascript(script=" + script + ") => " + retval);
    }

    return retval;
  };

  WebView.loadUrl.overload("java.lang.String").implementation = function (url) {
    const retval = this.loadUrl(url);
    log("WebView.loadUrl(url=" + url + ") => " + retval);
    return retval;
  };
});
