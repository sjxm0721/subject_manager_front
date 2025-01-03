<template>
  <view class="homework-page">
    <homework-tabs />
  </view>
</template>

<script setup lang="ts">
import HomeworkTabs from './components/HomeworkTabs.vue'
</script>

<style lang="scss" scoped>
.homework-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>
