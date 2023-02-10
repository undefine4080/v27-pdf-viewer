<template>
  <div class="pdfSelector">
    <!-- <div class="pdfSelector__pagination"
      @click="prev"><arrow-top /></div> -->

    <div class="pdfSelector__view"
      :style="{ width: SIZE + 'px', height: height + 'px' }">
      <div class="pdfSelector__pages"
        :style="{ width: SIZE + 'px' }">
        <canvas v-for="pageIndex in total"
          :id="`${id}-${pageIndex}`"
          :key="pageIndex"
          @click="selectPage(pageIndex)"
          :class="{ 'pdfSelector__pages-selected': page === pageIndex }"></canvas>
      </div>
    </div>

    <!-- <div class="pdfSelector__pagination"
      @click="next"><arrow-down /></div> -->
  </div>
</template>

<script setup>
import { ref, toRef, inject, watch, watchEffect, nextTick } from "vue";
import ArrowDown from "./assets/ArrowDown.vue";
import ArrowTop from "./assets/ArrowTop.vue";
import { usePdfRender, usePageSwitch, usePageScroll } from './newHooks';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  selectorPosition: {
    type: String,
    required: false,
    default: 'left' // pdf 选择器的位置
  },
  fileSource: {
    required: true
  },
  page: {
    type: Number,
    required: false,
    default: 1
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },
  width: {
    type: Number,
    required: false,
    default: 300
  },
  height: {
    type: Number,
    required: false,
    default: 600
  },
  loading: {
    type: Boolean,
    required: true,
    default: true
  }
});

const SIZE = 180;
let direction = 'vertical';
if (props.selectorPosition === 'left' || props.selectorPosition === 'right') {
  direction = 'vertical';
} else if (props.selectorPosition === 'top' || props.selectorPosition === 'bottom') {
  direction = 'horizontal';
} else {
  console.warn("the selectorPosition may not correct, it must include 'left','right','top','bottom' please check the value");
}

const fileSource = toRef(props, 'fileSource');
const { renderPage } = usePdfRender({
  id: props.id,
  height: direction === 'horizontal' ? (SIZE - 30) : undefined,
  width: direction === 'vertical' ? (SIZE - 30) : undefined,
  fileSource
});

// 首次绘制
const loading = toRef(props, 'loading');
watch(loading, () => {
  if (!loading.value) {
    nextTick(() => {
      renderPage(1)
        .then(renderPage(2))
        .then(renderPage(3))
        .then(renderPage(4))
        .then(renderPage(5));
    });
  }
});

// const { prev, next, page, to } = usePageSwitch(props.page, props.total, renderPage);

// const { refScrollContainer } = usePageScroll(page, props.width, props.height);

const page = ref(props.page);

const selectPage = pageIndex => {
  page.value = pageIndex;
};

const updateCurPage = inject('updateCurPage');
watchEffect(() => updateCurPage(page.value));
</script>

<style lang="less">
.pdfSelector {
  &__container {
    display: flex;
    flex-flow: row nowrap;
    height: max-content;
    position: relative;
  }

  &__view {
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    position: relative;

    &::-webkit-scrollbar {
      height: 3px;
      width: 3px;
    }

    &::-webkit-scrollbar-track {
      background-color: rgb(218, 218, 218);
    }

    &::-webkit-scrollbar-thumb {
      box-shadow: inset 0 0 6px rgb(65, 65, 65);
    }
  }

  &__pages {
    display: flex;
    flex-flow: column;
    align-items: center;

    canvas {
      padding: 10px;
    }

    &-selected {
      border: 2px red solid;
    }
  }

  &__pagination {
    padding: 0 10px;

    svg {
      position: relative;
      left: calc(50% - 10px);
      cursor: pointer;
    }

    &-disabled {
      cursor: not-allowed;
      filter: grayscale(0.5);

      svg {
        cursor: not-allowed;
        filter: grayscale(0.5);
      }
    }
  }
}
</style>
