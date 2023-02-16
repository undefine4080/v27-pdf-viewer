<template>
    <i
        class="hw-pdfViewer-icon"
        :style="{
            width: size + 'px',
            height: size + 'px',
            backgroundImage: `url(${svg})`,
        }"
    ></i>
</template>

<script setup>
const props = defineProps({
    size: {
        type: Number,
        default: 48,
    },
    svg: String,
});
</script>
<style lang="scss">
.hw-pdfViewer-icon {
    display: inline-block;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    cursor: pointer;
}
</style>
