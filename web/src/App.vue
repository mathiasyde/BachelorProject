<template>
  <main>
    <h1>Android Hybrid</h1>
    <p>This webpage demonstrates a WebView's ability to interact with native Android features.</p>

    <p id="bridge-status">{{ window.native ? "✅ Android bridge detected" : "❌ No Android bridge detected" }}</p>

    <p>If the Android bridge is detected, you can continue to request the neccessary permissions for this demonstration.</p>

    <button @click="requestPermissions">
      Request permissions
    </button>

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

    <button @click="takePhoto">
      Take Photo
    </button>

    <img v-if="photo" :src="`data:image/jpeg;base64,${photo}`" alt="Taken Photo">
  </main>

</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'App',
  setup() {
    const permissions = ref({})
    const photo = ref(null)

    onMounted(() => {
      if (window.native) {
        permissions.value = JSON.parse(window.native.getPermissionStatus())
      }
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

    return {
      window,

      permissions,
      photo,

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
