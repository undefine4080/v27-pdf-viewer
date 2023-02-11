<template>
    <div class="pdfPage__container">
        <canvas :id="id"
            ref="refCanvas"
            class="pdfPage"
            :class="{ 'pdfPage__selected': !loading && selectedPage === pageIndex }">
        </canvas>

        <div class="pdfPage__loading"
            v-if="loading">
            <span>加载中...</span>
        </div>
    </div>
</template>

<script setup>
import { ref, toRef, inject } from 'vue';
import { useLazyLoad } from './hooks';

const props = defineProps({
    id: {
        type: String
    },
    pageIndex: {
        type: Number
    },
    scrollContainer: {
        type: HTMLDivElement
    },
    selectedPage: {
        type: Number
    },
});

const refCanvas = ref();
const renderPage = inject('renderPage');
const scrollContainer = toRef(props, 'scrollContainer');
const loading = ref(true);

const callback = () => {
    return renderPage(props.pageIndex, loading);
};

useLazyLoad(scrollContainer, refCanvas, callback);
</script>
<style lang='scss'>
.pdfPage {
    padding: 10px;

    &__container {
        position: relative;
        background-color: rgb(240, 240, 240);
    }

    &__selected {
        border: 2px red solid;
    }

    &__loading {
        width: 90%;
        height: 90%;
        position: absolute;
        left: 5%;
        top: 5%;
        background-color: rgb(248, 248, 248);
        display: flex;
        justify-content: center;
        align-items: center;

        span {
            $size: 20px;

            &::before {
                content: '';
                display: inline-block;
                width: $size;
                height: $size;
                border-width: 3px;
                border-radius: 50%;
                border-image: linear-gradient(grey, black);
                animation: 2s linear 0s infinite running rotate;
            }
        }
    }
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>