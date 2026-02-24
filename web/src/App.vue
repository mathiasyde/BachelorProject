<template>
  <h1>{{ status }}</h1>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'App',
  setup() {
    const status = ref('No Android bridge detected')

    onMounted(() => {
      status.value = native.hello()
    })

    return {
      status
    }
  }
}
</script>

<style scoped>

</style>
