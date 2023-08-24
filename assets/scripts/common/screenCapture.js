cc.Class({
    extends: cc.Component,

    properties: {
        captureAll: true
    },

    onEnable: function() {
        cc.configuration._supportsNPOT = true;
    },

    capture: function() {
        if (cc.sys.isNative) {
            return;
        }

        var target = this.captureAll ? cc.director.getRunningScene() : this.node._sgNode;

        var width = Math.floor(cc.winSize.width),
            height = Math.floor(cc.winSize.height);
        var renderTexture = new cc.RenderTexture(width, height, cc.Texture2D.PIXEL_FORMAT_RGBA8888, cc._renderContext.DEPTH_STENCIL);
        renderTexture.begin();
        target.visit();
        renderTexture.end();

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        if (cc._renderType === cc.game.RENDER_TYPE_CANVAS) {
            var textureCanvas = renderTexture.getSprite().getTexture();
            var image = textureCanvas.getHtmlElementObj();
            ctx.drawImage(image, 0, 0);
        } else if (cc._renderType === cc.game.RENDER_TYPE_WEBGL) {
            var buffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
            var texture = renderTexture.getSprite().getTexture()._glID;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            var data = new Uint8Array(width * height * 4);
            gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            var rowBytes = width * 4;
            for (var row = 0; row < height; row++) {
                var srow = height - 1 - row;
                var data2 = new Uint8ClampedArray(data.buffer, srow * width * 4, rowBytes);
                var imageData = new ImageData(data2, width, 1);
                ctx.putImageData(imageData, 0, row);
            }
        }

        // var dataURL = canvas.toDataURL("image/jpeg");
        return canvas.toDataURL("image/jpeg");
    }
});