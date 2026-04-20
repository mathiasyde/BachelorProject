const WebView = Java.use("android.webkit.WebView");
const WebViewClient = Java.use("android.webkit.WebViewClient");
const ValueCallback = Java.use("android.webkit.ValueCallback");
const StringClass = Java.use("java.lang.String");

const PROBE_POLLING_RATE = 1000; // ms

const PROBE = `(function() {
  const events = window.__frida__.events;
  window.__frida__.events = [];

  return {
    href: location.href,
    events: events,
  };
})();`;


const INJECTION = `(function() {
  if (window.__frida__) { return; }

  window.__frida__ = {
    events: [],
  };

  function report(event) {
    window.__frida__.events.push({
      timestamp: new Date().toISOString(),
      ...event,
    });
    return JSON.stringify(event);
  }

  function intercept(original, name) {
    return function(...args) {
      report({name, arguments: args});
      return original.apply(this, args);
    };
  }

  window.fetch = intercept(window.fetch, "fetch");
  window.eval = intercept(window.eval, "eval");
  XMLHttpRequest.prototype.send = intercept(XMLHttpRequest.prototype.send, "XMLHttpRequest.send");
  XMLHttpRequest.prototype.open = intercept(XMLHttpRequest.prototype.open, "XMLHttpRequest.open");
  localStorage.setItem = intercept(localStorage.setItem, "localStorage.setItem");
  localStorage.getItem = intercept(localStorage.getItem, "localStorage.getItem");
})();`;

const inject = (view) => {
  try {
    view.evaluateJavascript(StringClass.$new(INJECTION), null);
  } catch (error) {
    console.log("[!] Failed to inject: " + error);
  }
}

// WebViewClient
Java.perform(() => {
  const log = (message) => console.log(`[WebViewClient] ${message}`)

  console.log("[*] WebViewClient instrumentation started");

  const ProbeCallback = Java.registerClass({
    name: "com.frida.instrumentation.ProbeCallback",
    implements: [ValueCallback],
    methods: {
      onReceiveValue: function (value) {
        const data = JSON.parse(value);
        const events = data.events || [];

        events.forEach(event => {
          log(`[Probe] ${event.name}(${JSON.stringify(event.arguments)})`);
        });
      }
    }
  });

  const probe = (view) => {
    try {
      view.evaluateJavascript(
        StringClass.$new(PROBE),
        ProbeCallback.$new()
      );
    } catch (error) {
      log("[!] Failed to probe: " + error);
    }
  }

  let active = null;

  const startPolling = () => setInterval(() => {
    Java.perform(() => {
      if (active === null) { return; }

      Java.scheduleOnMainThread(() => {
        try {
          active.evaluateJavascript(
            StringClass.$new(PROBE),
            ProbeCallback.$new()
          );
        } catch (error) {
          log("[!] Failed to poll: " + error);
        }
      });
    });
  }, PROBE_POLLING_RATE);

  WebViewClient.onPageFinished.overload("android.webkit.WebView", "java.lang.String").implementation = function (view, url) {
    const retval = this.onPageFinished(view, url);
    log(`WebViewClient.onPageFinished(view=${view}, url=${url}) => ${retval}`);
    inject(view);
    active = Java.retain(view);
    return retval;
  }

  WebViewClient.onLoadResource.overload("android.webkit.WebView", "java.lang.String").implementation = function (view, url) {
    const retval = this.onLoadResource(view, url);
    log(`WebViewClient.onLoadResource(view=${view}, url=${url}) => ${retval}`);
    inject(view);
    active = Java.retain(view);
    return retval;
  }

  startPolling();
});

// WebView
Java.perform(function () {
  const log = (message) => console.log(`[WebView] ${message}`)

  WebView.$init.overload("android.content.Context").implementation = function (context) {
    const retval = this.$init(context);
    log("WebView(context=" + context + ") => " + retval);
    this.setWebContentsDebuggingEnabled(true);
    return retval;
  }

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
