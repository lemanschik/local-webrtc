<!-- test data-->
const scriptcontent = () =>{    
    const output = {"name": "result.png", "width": 64, "height": 64}
    document.querySelector("button").onclick = () => {
        const svgElem = document.querySelector("svg")
        // const uriData = `data:image/svg+xml;base64,${btoa(svgElem.outerHTML)}` // it may fail.
        const uriData = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(svgElem))}`
        const img = new Image()
        img.src = uriData
        img.onload = () => {
            const canvas = document.createElement("canvas");
            [canvas.width, canvas.height] = [output.width, output.height]
            const ctx = canvas.getContext("2d")
            ctx.drawImage(img, 0, 0, output.width, output.height)

            // 👇 download
            const a = document.createElement("a")
            const quality = 1.0 // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingQuality
            a.href = canvas.toDataURL("image/png", quality)
            a.download = output.name
            a.append(canvas)
            a.click()
            a.remove()
        }
    }
};

export const svg2png = () => `
<svg-to-png>
<svg width="400" height="400"><g transform="translate(23.915343915343925,-80.03971756398937)" class="glyph" stroke="#000000" fill="#a0a0a0"><path d="M74.97 108.70L74.97 108.70L100.08 110.77Q93.89 147.91 87.35 179.89L87.35 179.89L148.23 179.89L148.23 194.34Q143.76 277.91 113.84 339.81L113.84 339.81Q144.44 363.54 163.70 382.46L163.70 382.46L146.51 402.75Q128.62 384.18 101.80 361.83L101.80 361.83Q75.32 405.85 34.39 436.80L34.39 436.80L17.20 415.82Q57.43 386.93 82.20 345.66L82.20 345.66Q57.78 326.40 27.86 304.39L27.86 304.39Q44.37 257.96 56.75 203.97L56.75 203.97L19.26 203.97L19.26 179.89L61.90 179.89Q69.47 145.16 74.97 108.70ZM93.20 323.99L93.20 323.99Q118.65 272.06 123.12 203.97L123.12 203.97L82.20 203.97Q69.47 260.03 55.71 297.17L55.71 297.17Q76.01 311.61 93.20 323.99ZM160.26 285.13L160.26 260.37L239.71 260.37L239.71 216.01Q268.25 191.24 294.05 155.48L294.05 155.48L170.58 155.48L170.58 130.71L322.94 130.71L322.94 155.48Q297.49 191.93 265.50 223.92L265.50 223.92L265.50 260.37L337.38 260.37L337.38 285.13L265.50 285.13L265.50 397.59Q265.50 431.64 237.65 431.64L237.65 431.64L187.09 431.64L180.21 407.57Q202.22 407.91 227.67 407.91L227.67 407.91Q239.71 407.91 239.71 390.03L239.71 390.03L239.71 285.13L160.26 285.13Z"></path></g></svg>

<button title="download">svg2png</button>
<script>
  (${scriptContent})();
</script>
</svg-to-png>
`;
