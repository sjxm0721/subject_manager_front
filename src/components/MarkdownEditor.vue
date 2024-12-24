<template>
  <view class="markdown-editor">
    <view class="editor-header">
      <view class="toolbar">
        <view
            v-for="tool in tools"
            :key="tool.type"
            class="tool-item"
            @click="handleToolClick(tool.type)"
        >
          {{ tool.icon }}
        </view>
      </view>
    </view>
    <textarea
        :value="modelValue"
        class="editor-content"
        :placeholder="placeholder"
        @input="handleInput"
    />
    <!-- 预览模式 -->
    <view v-if="showPreview" class="preview-content">
      <rich-text :nodes="previewContent"></rich-text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容'
  }
})

const emit = defineEmits(['update:modelValue'])

const showPreview = ref(false)

const tools = [
  { type: 'bold', icon: 'B' },
  { type: 'italic', icon: 'I' },
  { type: 'link', icon: '🔗' },
  { type: 'list', icon: '•' },
  { type: 'preview', icon: '👁' }
]

const previewContent = computed(() => {
  return md.render(props.modelValue)
})

const handleInput = (e: any) => {
  emit('update:modelValue', e.detail.value)
}

const handleToolClick = (type: string) => {
  if (type === 'preview') {
    showPreview.value = !showPreview.value
    return
  }

  let insertion = ''
  let selectLength = 0

  switch (type) {
    case 'bold':
      insertion = '**粗体文字**'
      selectLength = 4
      break
    case 'italic':
      insertion = '*斜体文字*'
      selectLength = 4
      break
    case 'link':
      insertion = '[链接文字](url)'
      selectLength = 4
      break
    case 'list':
      insertion = '\n- 列表项'
      selectLength = 3
      break
  }

  const newValue = props.modelValue + insertion
  emit('update:modelValue', newValue)
}
</script>

<style lang="scss" scoped>
.markdown-editor {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;

  .editor-header {
    padding: 8px;
    border-bottom: 1px solid #dcdfe6;
    background-color: #f5f7fa;

    .toolbar {
      display: flex;
      gap: 8px;
    }

    .tool-item {
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background-color: #e4e7ed;
      }

      &:active {
        background-color: #dcdfe6;
      }
    }
  }

  .editor-content {
    width: 100%;
    min-height: 200px;
    padding: 12px;
    border: none;
    resize: vertical;
    outline: none;
    font-size: 14px;
    line-height: 1.6;
  }

  .preview-content {
    padding: 12px;
    border-top: 1px solid #dcdfe6;
  }
}
</style>
