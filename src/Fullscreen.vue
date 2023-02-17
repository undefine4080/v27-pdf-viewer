<template>
    <div class="pdfFullscreen" v-show="enable">
        <canvas
            class="pdfFullscreen__view"
            :id="`${id}-${page}`"
            ref="refScaleContainer"
        ></canvas>

        <div class="pdfFullscreen__toolbar">
            <div class="pdfFullscreen__toolbar-item" @click="resetCanvas">
                <icon :svg="resetIcon" :size="24" />
                <span>复原</span>
            </div>
        </div>

        <div class="pdfFullscreen__close" @click="$emit('close')">
            <icon :svg="closeIcon" :size="24" />
            <span>关闭</span>
        </div>

        <p class="pdfFullscreen__scaleTips" ref="refTips">
            <span v-show="minScale">已缩放到最小级别，不能再缩放</span>

            <span v-show="maxScale">已缩放到最大级别，不能再缩放</span>

            <span v-show="!maxScale && !minScale">请划动鼠标滚轮进行缩放</span>
        </p>
    </div>
</template>

<script setup>
import { watch, toRefs } from 'vue';
import { usePdfRender, useScaling } from './hooks';
import resetIcon from './assets/icon/reset.svg';
import closeIcon from './assets/icon/close.svg';
import Icon from './Icon.vue';

const id = 'pdf-fullscreen';
const emit = defineEmits(['close']);

const props = defineProps({
    fileSource: {
        required: true,
    },
    loading: {
        required: true,
        default: true,
    },
    page: {
        type: Number,
        required: false,
    },
    enable: Boolean,
});

const { fileSource, loading, page, enable } = toRefs(props);

const { renderPage, reRenderPage } = usePdfRender({
    id,
    height: 900,
    fileSource,
});

watch([loading, enable], () => {
    if (!enable.value) return;

    if (!loading.value && fileSource.value) {
        renderPage(page.value);
    }
});

// todo: 解决 css 缩放不清晰的问题，采用重渲染 pdf 的方式
const freshPage = (width, height) => {
    // return reRenderPage(width, height, page.value);
};

const { refScaleContainer, resetCanvas, minScale, maxScale, refTips } =
    useScaling(enable, freshPage);
</script>
<style lang="scss">
.pdfFullscreen {
    position: fixed;
    width: 100vw;
    height: 100vh;
    background-color: rgb(37, 37, 37);
    z-index: 5000;
    overflow: auto;
    left: 0;
    top: 0;
    display: flex;
    justify-content: center;

    &__scaleTips {
        position: fixed;
        top: 0;
        padding: 30px;
        background-color: rgba(0, 0, 0, 0.693);
        color: white;
        visibility: hidden;
    }

    &__view {
        height: 700px;
        width: 500px;
        cursor: zoom-in;
        transform-origin: top;
        transition: all 0.2s linear;
    }

    &__toolbar {
        position: fixed;
        bottom: 0;
        padding: 10px 20px;
        display: flex;
        color: white;
        background-color: rgba(44, 44, 44, 0.711);

        &-item {
            display: flex;
            align-items: center;
            cursor: pointer;

            span {
                margin-left: 15px;
            }
        }
    }

    &__close {
        position: fixed;
        right: 30px;
        top: 30px;
        color: white;
        display: flex;
        align-items: center;
        cursor: pointer;
    }
}
</style>
