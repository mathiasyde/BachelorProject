const PROBE_POLLING_RATE = 1000; // ms

const EVENT_TYPE = Object.freeze({
  WEBVIEW_CREATED: "webview.created",
  WEBVIEW_PAGE_LOADED: "webview.page.loaded",
  WEBVIEW_ADDED: "webview.added",
  URL_LOADED: "url.loaded",
  JS_EVALUATED: "js.evaluated",
  JS_PROBE: "js.probe",
  BRIDGE_ADDED: "bridge.added",
  BRIDGE_METHOD_CALLED: "bridge.method.called",
  BRIDGE_METHOD_ADDED: "bridge.method.added",
  PERMISSION_REQUESTED: "permission.requested",
});

const PROBE = `(function() {
  const events = window.__frida__.events.slice();
  window.__frida__.events.length = 0;

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
  }

  function intercept(original, name) {
    return function(...args) {
      report({name: name, arguments: args});
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

// safe serializer that handles circular refs and Frida Java proxies
function sanitize(value, seen = new Set()) {
  if (value === null || value === undefined) return null;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (t === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (seen.has(value)) return "[Circular]";
  if (Array.isArray(value)) {
    seen.add(value);
    const arr = value.map((v) => sanitize(v, seen));
    seen.delete(value);
    return arr;
  }
  if (t === "object") {
    // Frida Java proxies usually expose $className
    if (value.$className) {
      try {
        return value.toString();
      } catch (e) {
        return `[Java object ${value.$className}]`;
      }
    }
    seen.add(value);
    const out = {};
    for (const k in value) {
      try {
        out[k] = sanitize(value[k], seen);
      } catch (e) {
        out[k] = `[Unserializable]`;
      }
    }
    seen.delete(value);
    return out;
  }
  return String(value);
}

Java.perform(() => {
  const WebView = Java.use("android.webkit.WebView");
  const WebViewClient = Java.use("android.webkit.WebViewClient");
  const ValueCallback = Java.use("android.webkit.ValueCallback");
  const StringClass = Java.use("java.lang.String");
  const ActivityCompat = Java.use("androidx.core.app.ActivityCompat");

  const ProbeCallback = Java.registerClass({
    name: "com.frida.instrumentation.ProbeCallback",
    implements: [ValueCallback],
    methods: {
      onReceiveValue: function (value) {
        const data = JSON.parse(value);

        data.events.forEach((event) => {
          log(
            EVENT_TYPE.JS_PROBE,
            { name: event.name, arguments: event.arguments },
            event.timestamp,
          );
        });
      },
    },
  });

  let messages = [];
  let active = null;

  const log = (type, data, timestamp = new Date().toISOString()) => {
    messages.push({ type: type, timestamp: timestamp, data: data });
  };

  setInterval(() => {
    Java.scheduleOnMainThread(() => {
      if (active != null) {
        active.evaluateJavascript(
          StringClass.$new(PROBE),
          ProbeCallback.$new(),
        );
      }
    });

    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    messages.forEach((message) => {
      console.log(JSON.stringify(sanitize(message)));
    });

    messages.length = 0;
  }, 1000);

  WebView.loadUrl.overload("java.lang.String").implementation = function (url) {
    const retval = this.loadUrl(url);
    log(EVENT_TYPE.URL_LOAD, { url: url, retval: retval });
    return retval;
  };

  WebView.$init.overload("android.content.Context").implementation = function (
    context,
  ) {
    const retval = this.$init(context);
    log(EVENT_TYPE.WEBVIEW_CREATED, { context: context, retval: retval });
    this.setWebContentsDebuggingEnabled(true);
    return retval;
  };

  const inject = (view) => {
    view.evaluateJavascript(StringClass.$new(INJECTION), null);
  };

  WebViewClient.onPageFinished.overload(
    "android.webkit.WebView",
    "java.lang.String",
  ).implementation = function (view, url) {
    const retval = this.onPageFinished(view, url);

    log(EVENT_TYPE.WEBVIEW_PAGE_LOADED, {
      url: url,
      view: view,
      retval: retval,
    });

    inject(view);
    active = Java.retain(view);

    return retval;
  };

  WebViewClient.onLoadResource.overload(
    "android.webkit.WebView",
    "java.lang.String",
  ).implementation = function (view, url) {
    const retval = this.onLoadResource(view, url);

    inject(view);
    active = Java.retain(view);

    return retval;
  };

  WebView.evaluateJavascript.overload(
    "java.lang.String",
    "android.webkit.ValueCallback",
  ).implementation = function (script, callback) {
    const retval = this.evaluateJavascript(script, callback);

    // omit __frida__ scripts to avoid noise in logs
    if (script.includes("__frida__") == false) {
      log(EVENT_TYPE.JS_EVALUATED, {
        retval: retval,
        callback: callback,
        script: script,
      });
    }

    return retval;
  };

  ActivityCompat.requestPermissions.overload(
    "android.app.Activity",
    "java.lang.String[]",
    "int",
  ).implementation = function (activity, permissions, requestCode) {
    const retval = this.requestPermissions(activity, permissions, requestCode);

    log(EVENT_TYPE.PERMISSION_REQUESTED, {
      activity: activity,
      permissions: permissions,
      requestCode: requestCode,
      retval: retval,
    });

    return retval;
  };

  WebView.addJavascriptInterface.overload(
    "java.lang.Object",
    "java.lang.String",
  ).implementation = function (object, interfaceName) {
    const retval = this.addJavascriptInterface(object, interfaceName);

    log(EVENT_TYPE.BRIDGE_ADDED, {
      object: object,
      interfaceName: interfaceName,
      retval: retval,
    });

    // instantiate the specific object as the subclass
    const instance = Java.cast(object, Java.use(object.$className));
    const methods = instance.class.getDeclaredMethods();

    methods.forEach((method) => {
      const methodName = method.getName();
      const methodArgs = method
        .getParameterTypes()
        .map((parameter) => parameter.getName());

      log(EVENT_TYPE.BRIDGE_METHOD_ADDED, {
        object: object,
        interfaceName: interfaceName,
        method: methodName,
        args: methodArgs,
      });

      // https://github.com/iddoeldor/frida-snippets#hook-overloads
      instance[methodName].overload.apply(
        instance[methodName],
        methodArgs,
      ).implementation = function (...args) {
        const retval = this[methodName].apply(this, args);
        log(EVENT_TYPE.BRIDGE_METHOD_CALLED, {
          object: object,
          interfaceName: interfaceName,
          methodName: methodName,
          methodArgs: methodArgs,
          args: args,
          retval: retval,
        });
        return retval;
      };
    });

    return retval;
  };
});
