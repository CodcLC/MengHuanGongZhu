// const StencilMaterial = cc.renderer.renderEngine.StencilMaterial;

const misc = cc.misc;
const RenderComponent = cc.RenderComponent;
const RenderFlow = cc.RenderFlow;
const Graphics = cc.Graphics;
const MaterialVariant = cc.MaterialVariant;
const gfx = cc.gfx;

/**
 * !#en the type for mask.
 * !#zh 遮罩组件类型
 * @enum Mask.Type
 */
const MaskType = cc.Enum({
    /**
     * !#en Rect mask.
     * !#zh 使用矩形作为遮罩
     * @property {Number} RECT
     */
    RECT: 0,
    /**
     * !#en Ellipse Mask.
     * !#zh 使用椭圆作为遮罩
     * @property {Number} ELLIPSE
     */
    ELLIPSE: 1,
    /**
     * !#en Image Stencil Mask.
     * !#zh 使用图像模版作为遮罩
     * @property {Number} IMAGE_STENCIL
     */
    IMAGE_STENCIL: 2,
});

cc.Class({
    extends: cc.RenderComponent,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        inverted: {
            default: false
        },

        arrRects: {
            default: [],
            type: [cc.Rect]
        }
    },

    ctor: function() {
        this._graphics = null;
        this._clearGraphics = null;
        this.arrRects = [];
        this._circlepoints = [];

        this._assembler = new cc.Mask.__assembler__();
    },

    onLoad() {
        this._createGraphics();
    },

    onRestore() {
        this._createGraphics();
        this._updateGraphics();
    },

    onEnable: function() {
        this._super();
        this.node.on(cc.Node.EventType.POSITION_CHANGED, this._updateGraphics, this);
        this.node.on(cc.Node.EventType.ROTATION_CHANGED, this._updateGraphics, this);
        this.node.on(cc.Node.EventType.SCALE_CHANGED, this._updateGraphics, this);
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this._updateGraphics, this);
        this.node.on(cc.Node.EventType.ANCHOR_CHANGED, this._updateGraphics, this);

        this.node._renderFlag |= cc.RenderFlow.FLAG_POST_RENDER;
        this._activateMaterial();
    },

    onDisable: function() {
        this._super();
        this.node.off(cc.Node.EventType.POSITION_CHANGED, this._updateGraphics, this);
        this.node.off(cc.Node.EventType.ROTATION_CHANGED, this._updateGraphics, this);
        this.node.off(cc.Node.EventType.SCALE_CHANGED, this._updateGraphics, this);
        this.node.off(cc.Node.EventType.SIZE_CHANGED, this._updateGraphics, this);
        this.node.off(cc.Node.EventType.ANCHOR_CHANGED, this._updateGraphics, this);

        this.node._renderFlag &= ~cc.RenderFlow.FLAG_POST_RENDER;
    },

    onDestroy() {
        this._super();
        this._removeGraphics();
    },

    _activateMaterial() {
        this._createGraphics();

        // Init material
        let material = this._materials[0];
        if (!material) {
            material = MaterialVariant.createWithBuiltin('2d-sprite', this);
        } else {
            material = MaterialVariant.create(material, this);
        }

        material.define('USE_ALPHA_TEST', true);

        // Reset material
        if (this._type === MaskType.IMAGE_STENCIL) {
            material.define('CC_USE_MODEL', false);
            material.define('USE_TEXTURE', true);
        } else {
            material.define('CC_USE_MODEL', true);
            material.define('USE_TEXTURE', false);
        }

        if (!this._enableMaterial) {
            this._enableMaterial = MaterialVariant.createWithBuiltin('2d-sprite', this);
        }

        if (!this._exitMaterial) {
            this._exitMaterial = MaterialVariant.createWithBuiltin('2d-sprite', this);
            this._exitMaterial.setStencilEnabled(gfx.STENCIL_DISABLE);
        }

        if (!this._clearMaterial) {
            this._clearMaterial = MaterialVariant.createWithBuiltin('clear-stencil', this);
        }

        this.setMaterial(0, material);

        this._graphics._materials[0] = material;

        this._updateMaterial();
    },

    _createGraphics() {
        if (!this._graphics) {
            this._graphics = new Graphics();
            cc.Assembler.init(this._graphics);
            this._graphics.node = this.node;
            this._graphics.lineWidth = 0;
            this._graphics.strokeColor = cc.color(0, 0, 0, 0);
        }
    },

    _updateGraphics() {
        let node = this.node;
        let graphics = this._graphics;
        // Share render data with graphics content
        graphics.clear(false);

        for (let idx = 0; idx < this.arrRects.length; idx++) {
            let width = this.arrRects[idx].width;
            let height = this.arrRects[idx].height;
            let x = this.arrRects[idx].x;
            let y = this.arrRects[idx].y;

            graphics.rect(x, y, width, height);
        }

        if (cc.game.renderType === cc.game.RENDER_TYPE_CANVAS) {
            graphics.stroke();
        } else {
            graphics.fill();
        }
    },

    _updateGraphics() {
        if (!this.enabledInHierarchy) return;
        let node = this.node;
        let graphics = this._graphics;
        // Share render data with graphics content
        graphics.clear(false);

        for (let idx = 0; idx < this.arrRects.length; idx++) {
            let width = this.arrRects[idx].width;
            let height = this.arrRects[idx].height;
            let x = this.arrRects[idx].x;
            let y = this.arrRects[idx].y;

            graphics.rect(x, y, width, height);
        }

        if (cc.game.renderType === cc.game.RENDER_TYPE_CANVAS) {
            graphics.stroke();
        } else {
            graphics.fill();
        }
    },

    _removeGraphics() {
        if (this._graphics) {
            this._graphics.destroy();
            this._graphics._destroyImmediate(); // FIX: cocos-creator/2d-tasks#2511. TODO: cocos-creator/2d-tasks#2516
            this._graphics = null;
        }
    },

    markForRender(enable) {
        let flag = RenderFlow.FLAG_RENDER | RenderFlow.FLAG_UPDATE_RENDER_DATA | RenderFlow.FLAG_POST_RENDER;
        if (enable) {
            this.node._renderFlag |= flag;
            this.markForValidate();
        } else if (!enable) {
            this.node._renderFlag &= ~flag;
        }
    },

    _updateMaterial() {
        let material = this._materials[0];
        if (!material) return;

        if (this._type === MaskType.IMAGE_STENCIL && this.spriteFrame) {
            let texture = this.spriteFrame.getTexture();
            material.setProperty('texture', texture);
        }
        material.setProperty('alphaThreshold', this.alphaThreshold);
    },


    setRects: function(rects) {
        this.arrRects = rects;

        this._updateGraphics();
    },


    _calculateCircle(center, radius, segements) {
        this._circlepoints.length = 0;
        let anglePerStep = Math.PI * 2 / segements;
        for (let step = 0; step < segements; ++step) {
            this._circlepoints.push(cc.v2(radius.x * Math.cos(anglePerStep * step) + center.x,
                radius.y * Math.sin(anglePerStep * step) + center.y));
        }

        return this._circlepoints;
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});