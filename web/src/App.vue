<template>
  <main>
    <h1>Android Hybrid</h1>

    <section>
      <!-- <p>This webpage demonstrates the WebView's ability to interact with native Android features.</p>
       <p>This demonstration shows a webpage's ability to interface with native Android features through a WebView.</p>
       <p>This webpage is supposed to run on the dedicated Android app which has the necessary JavaScriptInterface bridge.</p> -->

      <p>This is a demonstration of WebView's ability to interact with native Android features. Through an JavaScriptInterface, the webpage can access native Android functionality.</p>
      <p>For this showcase, the page requests the app to take a photo using the device's camera, and display the taken photo on the webpage.
      Successfully demonstrating back-to-back communication through the WebView and JavaScriptInterface.</p>
    </section>


    <p id="bridge-status">{{ window.native ? "✅ Android bridge detected" : "❌ No Android bridge detected" }}</p>

    <section v-if="!window.native">
      <p>It doesn't seem like you're running this webpage inside the Android app.</p>
      <p>(No window.native object detected)</p>
    </section>

    <section v-if="window.native">
      <p>Please click the button below to request the necessary permissions for this demonstration.</p>

      <button @click="requestPermissions">
        Request permissions
      </button>

      <p>The table shows what permissions are available.</p>

      <table>
        <thead>
          <tr>
            <th>Permission</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, key) in permissions" :key="key">
            <td>{{ key }}</td>
            <td>{{ value ? "✅" : "❌" }}</td>
          </tr>
        </tbody>
      </table>

      <p>If you have granted the camera permission, you can now take a photo.</p>
      <p>Per default, Android emulators simulate a camera with a fake video feed.</p>

      <button @click="takePhoto">
        Take Photo
      </button>

      <img v-if="photo" :src="`data:image/jpeg;base64,${photo}`" alt="Taken Photo">

      <p>
        If you are running this demonstration with FRIDA instrumentation with the sentry hooks,
        you should see the logged permission requests and camera access in the console output of the Android app.

        The Android JavaScriptInterface is detected and all of its methods are hooked too, allowing you to see the communication between the webpage and the native Android app in real time.
      </p>

      <p>
        Functions within the JavaScript runtime are also intercepted, so calls to functions like window.fetch are logged to console output.

        Try it with the dog.ceo image API, click the image to get a new random dog image, and see the logged fetch calls in the Android app's console output.
      </p>

      <button @click="callAPI">
        <img :src="resultAPI" alt="" srcset="">
      </button>
    </section>
  </main>

</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'App',
  setup() {
    const permissions = ref({})
    const photo = ref(null)
    const resultAPI = ref(null)

    onMounted(() => {
      if (window.native) {
        permissions.value = JSON.parse(window.native.getPermissionStatus())
      }

      callAPI();
    })

    const requestPermissions = () => {
      if (window.native) {
        window.native.requestPermissions()
        permissions.value = JSON.parse(window.native.getPermissionStatus())
      }
    }

    const takePhoto = () => {
      if (window.native) {
        photo.value = window.native.takePhoto()
      }
    }

    const callAPI = async () => {
      try {
        const response = await window.fetch('https://dog.ceo/api/breeds/image/random')
        const data = await response.json()
        resultAPI.value = data.message
      } catch (error) {
        console.error('Error fetching API:', error)
      }
    }

    return {
      window,

      permissions,
      photo,

      callAPI,
      resultAPI,

      requestPermissions,
      takePhoto
    }
  }
}
</script>

<style scoped>

main {
  margin: 0 auto;
  padding: 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4em;
}

section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
}

main > h1 {
  font-size: 2em;
  color: #333;
  text-align: center;
  margin: 0.2em;
}

#bridge-status {
  font-size: 1.2em;
  color: #000;
  margin: 0.5em;
  border: 1px solid #333;
  padding: 0.5em 1em;
}

button {
  margin: auto;
  border: 1px solid #333;
  padding: 0.5em 1em;
  border-radius: 4px;
}

table {
  margin: 1em auto;
  border-collapse: collapse;
  width: 50%;
}

th, td {
  border: 1px solid #333;
  padding: 0.5em;
  text-align: left;
}

td:nth-child(2) {
  text-align: center;
}


</style>
