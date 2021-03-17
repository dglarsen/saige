
import Control from 'ol/control/Control'

import {getUid} from 'ol/util';

var Jsonix = require("jsonix").Jsonix;
var XLink_1_0 = require("w3c-schemas").XLink_1_0;
var GML_2_1_2 = require("ogc-schemas").GML_2_1_2;
var Filter_1_0_0 = require("ogc-schemas").Filter_1_0_0;
var SLD_1_0_0 = require("ogc-schemas").SLD_1_0_0;

var context = new Jsonix.Context(
  [SLD_1_0_0, GML_2_1_2, XLink_1_0, Filter_1_0_0],
  {
    namespacePrefixes: {
      "http://www.w3.org/1999/xlink": "xlink",
      "http://www.opengis.net/sld": "sld"
    }
  }
);

var marshaller = context.createMarshaller();

function generateScale(minimum, maximum) {
  if (!(maximum > minimum)) {
    // TODO: fix this so we don't have hardcoded defaults, or better yet
    // don't make requests for bad parameters
    return [0, 20, 40, 60, 80];
  }
  var range = maximum - minimum;

  var segment = range / 4.0;
  var quantities = [];
  for (var i = 0; i < 5; i++) {
    quantities.push(minimum + i * segment);
  }
  return quantities;
}

function layerSLDJSONFactory(layer_name, minimum, maximum) {
  var quantities = generateScale(minimum, maximum);
  return {
    TYPE_NAME: "SLD_1_0_0.NamedLayer",
    name: layer_name,
    namedStyleOrUserStyle: [
      {
        TYPE_NAME: "SLD_1_0_0.UserStyle",
        title: "FocusedGeo Rainbow Scale",
        featureTypeStyle: [
          {
            TYPE_NAME: "SLD_1_0_0.FeatureTypeStyle",
            rule: [
              {
                TYPE_NAME: "SLD_1_0_0.Rule",
                symbolizer: [
                  {
                    name: {
                      namespaceURI: "http://www.opengis.net/sld",
                      localPart: "IsDefault",
                      prefix: "",
                      key: "{http://www.opengis.net/sld}IsDefault",
                      string: "{http://www.opengis.net/sld}IsDefault"
                    },
                    value: true
                  },
                  {
                    name: {
                      namespaceURI: "http://www.opengis.net/sld",
                      localPart: "RasterSymbolizer",
                      prefix: "",
                      key: "{http://www.opengis.net/sld}RasterSymbolizer",
                      string: "{http://www.opengis.net/sld}RasterSymbolizer"
                    },
                    value: {
                      TYPE_NAME: "SLD_1_0_0.RasterSymbolizer",
                      colorMap: {
                        TYPE_NAME: "SLD_1_0_0.ColorMap",
                        colorMapEntry: [
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#0000ff",
                            quantity: quantities[0]
                          },
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#00ffff",
                            quantity: quantities[1]
                          },
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#00ff00",
                            quantity: quantities[2]
                          },
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#ffff00",
                            quantity: quantities[3]
                          },
                          {
                            TYPE_NAME: "SLD_1_0_0.ColorMapEntry",
                            color: "#ff0000",
                            quantity: quantities[4]
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
}

function sldJSONFactory(sites_list, minimum, maximum) {
  var layer_sld_array = [];
  for (let site_index in sites_list) {
    layer_sld_array.push(
      layerSLDJSONFactory(sites_list[site_index], minimum, maximum)
    );
  }
  return {
    name: {
      namespaceURI: "http://www.opengis.net/sld",
      localPart: "StyledLayerDescriptor",
      prefix: "",
      key: "{http://www.opengis.net/sld}StyledLayerDescriptor",
      string: "{http://www.opengis.net/sld}StyledLayerDescriptor"
    },
    value: {
      TYPE_NAME: "SLD_1_0_0.StyledLayerDescriptor",
      version: "1.0.0",
      namedLayerOrUserLayer: layer_sld_array
    }
  };
}

//ColorScale
var ColorScaleControl = /*@__PURE__*/ (function (Control) {

  function ColorScaleControl(opt_options) {
    var options = opt_options || {};

    var element = document.createElement("div");
    element.id = "ColorScale-"+getUid(this);
    element.className = "fg-ol-colorscale ol-unselectable ol-control";

    this.title = document.createElement("label");
    this.title.innerHTML = "TITLE:";
    element.appendChild(this.title);

    var label = document.createElement("label");
    label.innerHTML = "Min:";
    this.minimum = document.createElement("input");
    this.minimum.type = "number";
    this.minimum.value = 0;
    element.appendChild(label);
    element.appendChild(this.minimum);


    label = document.createElement("label");
    label.innerHTML = "Max:";
    this.maximum = document.createElement("input");
    this.maximum.type = "number";
    this.maximum.value = 50;
    element.appendChild(label);
    element.appendChild(this.maximum);

    Control.call(this, {
      element: element,
      target: options.target
    });

    this.minimum.addEventListener("change", this.handleChange.bind(this), false);
    this.maximum.addEventListener("change", this.handleChange.bind(this), false);
  }

  if (Control) ColorScaleControl.__proto__ = Control;
  ColorScaleControl.prototype = Object.create(Control && Control.prototype);
  ColorScaleControl.prototype.constructor = ColorScaleControl;

  ColorScaleControl.prototype.handleChange = function handleChange() {
    for (let layer_index in this.layer_list) {
      var source = this.layer_list[layer_index].getSource();
      var params = source.getParams();
      // TODO: this is fragile, will only work for sources with one layer
      var sld_json = sldJSONFactory(
        [params["LAYERS"]],
        parseFloat(this.minimum.value),
        parseFloat(this.maximum.value)
      );
      var sld_xml = marshaller.marshalString(sld_json);
      params["SLD_BODY"] = sld_xml;
      source.updateParams(params);
    }
  };

  ColorScaleControl.prototype.setName = function setName(name) {
    this.title.innerHTML = name;
  };

  ColorScaleControl.prototype.setLayerList = function setLayerList(list) {
    this.layer_list = list;
    this.handleChange();
  };

  return ColorScaleControl;
})(Control);

export default ColorScaleControl