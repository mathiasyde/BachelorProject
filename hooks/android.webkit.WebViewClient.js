const WebViewClient = Java.use("android.webkit.WebViewClient");
const ValueCallback = Java.use("android.webkit.ValueCallback");
const StringClass = Java.use("java.lang.String");

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
    window.__frida__.events.push(event);
    return JSON.stringify(event);
  }

  if (window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      report({name: "fetch", resource: args[0]});
      return originalFetch.apply(this, args);
    };
  }
})();`;

const inject = (view) => {
  try {
    view.evaluateJavascript(StringClass.$new(INJECTION), null);
  } catch (error) {
    console.log("[!] Failed to inject: " + error);
  }
}

Java.perform(() => {
  console.log("[*] WebViewClient instrumentation started");

  const ProbeCallback = Java.registerClass({
    name: "com.frida.instrumentation.ProbeCallback",
    implements: [ValueCallback],
    methods: {
      onReceiveValue: function (value) {
        const data = JSON.parse(value);
        (data.events || []).forEach(event => console.log(event.name + ": " + event.resource));
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
      console.log("[!] Failed to probe: " + error);
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
          console.log("[!] Failed to poll: " + error);
        }
      });
    });
  }, 1000)

  WebViewClient.onPageFinished.overload("android.webkit.WebView", "java.lang.String").implementation = function (view, url) {
    const retval = this.onPageFinished(view, url);
    console.log(`WebViewClient.onPageFinished(view=${view}, url=${url}) => ${retval}`);
    inject(view);
    active = Java.retain(view);
    return retval;
  }

  WebViewClient.onLoadResource.overload("android.webkit.WebView", "java.lang.String").implementation = function (view, url) {
    const retval = this.onLoadResource(view, url);
    console.log(`WebViewClient.onLoadResource(view=${view}, url=${url}) => ${retval}`);
    inject(view);
    active = Java.retain(view);
    return retval;
  }

  startPolling();
});
