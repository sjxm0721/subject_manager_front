//@/pages/preview/index.vue
<template>
    <view class="preview-container">
      <ResourcePreview v-if="resource" :resource="resource" />
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import ResourcePreview from '@/components/ResourcePreview.vue';
import Layout from "@/components/layout/Layout.vue";

interface Resource {
  name: string;
  type: 'pdf' | 'doc' | 'docx';
  path: string;
}

const resource = ref<Resource>();

onLoad((options) => {
  if (options.resource) {
    try {
      resource.value = JSON.parse(decodeURIComponent(options.resource));
    } catch (error) {
      uni.showToast({
        title: error?.message || '文件预览失败',
        icon: 'none'
      });
    }
  }
});
</script>


<style lang="scss">
.preview-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f8f9fa;
}
</style>
