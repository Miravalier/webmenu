/** @type {import('vite').UserConfig} */
export default {
    build: {
        rollupOptions: {
            input: {
                main: '/static/main.html',
            },
        },
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        minify: false,
        sourcemap: true,
        target: "ES2022",
    },
}
