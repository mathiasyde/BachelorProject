Java.perform(function () {
  const Bridge = Java.use("com.example.bachelorproject.Bridge");

  console.log("[*] Bridge instrumentation started");

  try {
    const methods = Bridge.class.getDeclaredMethods();

    methods.forEach(function (method) {
      const name = method.getName();

      try {
        Bridge[name].implementation = function (...args) {
          const retval = this[name].apply(this, args);
          console.log(`\nBridge.${name}(${args.map(arg => `'${arg}'`).join(", ")}) => ${JSON.stringify(retval)}`);
          return retval;
        };
      } catch (err) {
        console.log(`[!] Could not hook Bridge.${name}: `, err);
      }
    });

    console.log("[*] Bridge hooks installed");
  } catch (err) {
    console.log("[!] Could not hook Bridge: ", err);
  }
});
