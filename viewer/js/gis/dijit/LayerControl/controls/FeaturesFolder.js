define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on',
    'dojo/topic',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/dom-attr',
    'dojo/fx',
    'dojo/html',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_Contained',
    'dojo/text!./templates/Control.html',
	'gis/dijit/LayerControl/controls/Feature'
], function (
    declare,
    lang,
    array,
    on,
    topic,
    domConst,
    domClass,
    domStyle,
    domAttr,
    fx,
    html,
    WidgetBase,
    TemplatedMixin,
    _Contained,
    template,
	Feature
) {
    var FeaturesFolder =  declare([WidgetBase, TemplatedMixin, _Contained], {
        templateString: template, // widget template
        controller: null, // LayerControl instance
        layerTitle: 'Layer Title', // default title
        controlOptions: null, // control options
        icons: null,
        _layerType: 'vector', // constant
        _reorderUp: null, // used by LayerMenu
        _reorderDown: null, // used by LayerMenu
        _scaleRangeHandler: null, // handle for scale range awareness
        _expandClickHandler: null, // the click handler for the expandNode
        sublayerInfo: null,
        constructor: function (params) {
            this._sublayerControls = [];
			this._handlers = [];
            if (params.controller) {
                this.icons = params.controller.icons;
            } // if not you've got bigger problems
        },
        postCreate: function () {
            this.inherited(arguments);
			var controlOptions = this.controlOptions;
			this.visible = controlOptions.visible;
			this.layerInfos = controlOptions.layerInfos;
            // set checkbox
            this._setFolderCheckbox(this.visible, this.checkNode);
            // wire up layer visibility
            on(this.checkNode, 'click', lang.hitch(this, '_toggleFolderVisibility', this.checkNode));
            // set title
            html.set(this.labelNode, this.layerTitle);            			
            var checkNode = this.checkNode;
			// check visibility
            domAttr.set(checkNode, 'data-checked', 'unchecked');
			if ((controlOptions.noMenu !== true && this.controller.noMenu !== true) || (this.controller.noMenu === true && controlOptions.noMenu === false)) {
                this.layerMenu = new LayerMenu({
                    control: this,
                    contextMenuForWindow: false,
                    targetNodeIds: [this.menuNode],
                    leftClickToOpen: true
                });
                this.layerMenu.startup();
            } else {
                domClass.remove(this.menuNode, 'fa, layerControlMenuIcon, ' + this.icons.menu);
                domStyle.set(this.menuClickNode, 'cursor', 'default');
            }
			this._createSublayers(controlOptions.layerInfos)
            this._expandClick();
        },
        // add on event to expandClickNode
        _expandClick: function () {
            var i = this.icons;
            this._handlers.push(this._expandClickHandler = on(this.expandClickNode, 'click', lang.hitch(this, function () {
                var expandNode = this.expandNode,
                    iconNode = this.expandIconNode;
                if (domStyle.get(expandNode, 'display') === 'none') {
                    fx.wipeIn({
                        node: expandNode,
                        duration: 300
                    }).play();
                    domClass.replace(iconNode, i.folderOpen, i.folder);
                } else {
                    fx.wipeOut({
                        node: expandNode,
                        duration: 300
                    }).play();
                    domClass.replace(iconNode, i.folder, i.folderOpen);
                }
            })));
        },
        // set layer visibility and update icon
		_toggleFolderVisibility: function (checkNode) {
			this._setFolderCheckbox(!this.visible, checkNode);
        },
        // set checkbox based on layer so it's always in sync
        _setFolderCheckbox: function (checked, checkNode) {
            checkNode = checkNode || this.checkNode;
            var i = this.icons;
            if (checked) {
                domAttr.set(checkNode, 'data-checked', 'checked');
                domClass.replace(checkNode, i.checked, i.unchecked);
            } else {
                domAttr.set(checkNode, 'data-checked', 'unchecked');
                domClass.replace(checkNode, i.unchecked, i.checked);
            }
			this._updateSublayers(checked);
			this.visible = checked;
        },
		_updateSublayers: function(visible) {
			array.forEach(this.layerInfos, lang.hitch(this, function (layerInfo) {
				if(visible) {
					layerInfo.layer.show();
				} else {
					layerInfo.layer.hide();
				}
			}));
		},
		// add folder/sublayer controls per layer.layerInfos
        _createSublayers: function (layerInfos) {
			array.forEach(layerInfos, lang.hitch(this, function (layerInfo) {
				var control = new Feature({
					controller: this,
					layer: (typeof layerInfo.layer === 'string') ? this.map.getLayer(layerInfo.layer) : layerInfo.layer, // check if we have a layer or just a layer id
					layerTitle: layerInfo.title,
					controlOptions: lang.mixin({
						noLegend: null,
						noZoom: null,
						noTransparency: null,
						swipe: null,
						expanded: false,
						sublayers: true,
						menu: {}
					}, layerInfo.controlOptions)
				});
				domConst.place(control.domNode, this.expandNode, 'last');
				control.startup();
				this._sublayerControls.push(control);
			}));
        },
        destroy: function () {
            this.inherited(arguments);
            this._handlers.forEach(function(h){h.remove()});
		}
    });
    return FeaturesFolder;
});