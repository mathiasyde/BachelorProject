<template>
  <h1>{{ status }}</h1>
  <br>
  <h2>{{ JSON.stringify(window.__frida__) }}</h2>
  <br>
  <button v-on:click="requestPermissions">Request Permissions</button>
  <br>
  <button v-on:click="testFetch">testFetch</button>

  <table>
    <thead>
      <tr>
        <th>Permission</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(value, key) in permissions" :key="key">
        <td>{{ PERMISSIONS_DISPLAY_NAMES[key] || key }}</td>
        <td>{{ value ? "✅" : "❌" }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'App',
  setup() {
    const PERMISSIONS_DISPLAY_NAMES = {
      "android.permission.ACCESS_FINE_LOCATION": "Fine Location",
      "android.permission.ACCESS_COARSE_LOCATION": "Coarse Location",
      "android.permission.ACCESS_BACKGROUND_LOCATION": "Background Location",
      "android.permission.READ_CONTACTS": "Read Contacts",
      "android.permission.READ_SMS": "Read SMS"
    }

    const status = ref("No Android bridge detected")
    const permissions = ref({})

    const testFetch = async () => {
      try {
        const response = await window.fetch("https://jsonplaceholder.typicode.com/todos/1")
        const data = await response.json()
        status.value = `testFetch: ${data.title}`
      } catch (error) {
        status.value = "testFetch failed"
        console.error(error)
      }
    }

    onMounted(() => {
      status.value = native.hello("vue")
      permissions.value = JSON.parse(native.getPermissionStatus())
    })

    const requestPermissions = () => {
      native.requestPermissions();
      permissions.value = JSON.parse(native.getPermissionStatus())
    }

    return {
      status,
      permissions,
      PERMISSIONS_DISPLAY_NAMES,
      window,
      testFetch,
      requestPermissions
    }
  }
}
</script>

<style scoped>

</style>
