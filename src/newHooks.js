import { nextTick, ref, onMounted, watch, watchEffect, isRef } from "vue";
import * as PdfJs from "pdfjs-dist/legacy/build/pdf.js";

const workerSrc = require("pdfjs-dist/build/pdf.worker.entry");

import { _debounce } from './util';

function usePdfSource(src) {
    const fileSource = ref(); // 文件流
    const loading = ref(); // 源文件加载状态
    const total = ref(0); // 总页数

    // 读取文件流
    const readSource = (source) => {
        // 保存 pdf 文件流
        fileSource.value = source;

        // 获取pdf文件的总页数
        total.value = fileSource.value.numPages;

        loading.value = false;
    };

    // 请求文件流
    const fetchFileSource = () => {
        loading.value = true;

        // 设定pdfjs的 workerSrc 参数
        PdfJs.GlobalWorkerOptions.workerSrc = workerSrc;
        const loadingTask = PdfJs.getDocument(src);

        // 加载 pdf 文件流
        loadingTask.promise
            .then(readSource)
            .catch(error => {
                loading.value = false;
                throw error;
            });
    };

    fetchFileSource();

    return {
        fileSource,
        total,
        loading
    };
}

function usePdfRender(options) {
    const {
        id,
        width,
        height,
        fileSource
    } = options;

    const pdfScale = ref(1.0); // 初始缩放比

    // 计算画布尺寸
    const calcCanvasSize = (page) => {
        // 原始视窗尺寸
        const initialViewport = page.getViewport({ scale: pdfScale.value });
        const { width: rawWidth, height: rawHeight } = initialViewport;

        // 应用视窗尺寸
        let applyWidth, applyHeight, applyRatio, applyViewport;

        // 计算主窗口应用尺寸
        if (width && !height) {
            applyWidth = width;
            applyRatio = width / rawWidth;
            applyHeight = rawHeight * applyRatio;
        } else if (height && !width) {
            applyHeight = height;
            applyRatio = height / rawHeight;
            applyWidth = rawWidth * applyRatio;
        } else if (width && height) {
            if (width > height) {
                applyHeight = height;
                applyRatio = height / rawHeight;
                applyWidth = rawWidth * applyRatio;
            } else if (width < height) {
                applyWidth = width;
                applyRatio = width / rawWidth;
                applyHeight = rawHeight * applyRatio;
            } else {
                applyWidth = width;
                applyHeight = height;
                applyRatio = width / rawWidth;
            }
        } else if (!width && !height) {
            applyRatio = pdfScale.value;
            [applyWidth, applyHeight] = [rawWidth, rawHeight];
        }

        // 应用视窗
        applyViewport = page.getViewport({ scale: pdfScale.value * applyRatio });

        return { applyWidth, applyHeight, applyViewport };
    };

    // 创建画布
    const createContext = (page, pageNum) => {
        // 获取页面中的canvas元素
        const canvasId = `${id}-${pageNum}`;
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const bsr =
            ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio ||
            1;
        const ratio = dpr / bsr;

        let { applyWidth, applyHeight, applyViewport } = calcCanvasSize(page);

        [canvas.width, canvas.height] = [applyWidth * ratio, applyHeight * ratio];

        canvas.style.width = `${applyWidth}px`;
        canvas.style.height = `${applyHeight}px`;

        // 设置当pdf文件处于缩小或放大状态时，可以拖动
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        const context = {
            canvasContext: ctx,
            viewport: applyViewport,
        };

        return context;
    };

    // 绘制页面
    const renderPage = (pageNum = 1) => {
        if (!fileSource) return;

        const renderTask = fileSource.getPage(pageNum).then((page) => {
            const context = createContext(page, pageNum);

            // 将pdf文件的内容渲染到canvas中
            page.render(context);
        });

        return renderTask;
    };

    return {
        renderPage
    };
}

function usePageSwitch(initialPage, total, callback) {
    const page = ref(initialPage);
    const rendering = ref(false);

    const prev = _debounce(() => {
        if (!rendering.value) {
            (page.value > 1) && (page.value -= 1);
        }
    }, 500);

    const next = _debounce(() => {
        if (!rendering.value) {
            (page.value < total) && (page.value += 1);
        }
    }, 500);

    const alreadyRenderedPages = ref(new Set([1, 2]));
    watch(page, () => {
        if (page.value > 1 && !alreadyRenderedPages.value.has(page.value + 1)) {
            alreadyRenderedPages.value.add(page.value);
            setTimeout(() => {
                rendering.value = true;
                callback(page.value + 1).then(() => {
                    rendering.value = false;
                });
            }, 500);
        }
    });

    return {
        prev,
        next,
        page,
        rendering
    };
}

function usePageScroll(page, width, height) {
    const refScrollContainer = ref();

    watch(page, (newVal, oldVal) => {
        const isTurnNext = (newVal - oldVal) > 0;

        const scrollConfig = { behavior: "smooth" };
        if (isTurnNext) {
            scrollConfig.left = width;
        } else {
            scrollConfig.left = -width;
        }

        window.requestAnimationFrame(() => {
            refScrollContainer.value.scrollBy(scrollConfig);
        });
    });

    return {
        refScrollContainer
    };
}

export { usePdfSource, usePdfRender, usePageSwitch, usePageScroll };