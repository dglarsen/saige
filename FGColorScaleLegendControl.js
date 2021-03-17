import Control from 'ol/control/Control'

//ColorScaleLegendControl
var ColorScaleLegendControl = /*@__PURE__*/ (function (Control) {

  function ColorScaleLegendControl(wmsSource, opt_options) {
    var options = opt_options || {};
    this.wmsSource = wmsSource;

    var element = document.createElement("div");
    element.id = "ColorScaleLegend";
    element.className = "fg-ol-color-scale ol-unselectable ol-control";
    element.innerHTML = `
    Legend:
    <div><img id="legend"/></div>`
    // TODO: This may be useful for establishing the initial legend when the control is added to the map.
    this.on("change", this.handlePropertyChange.bind(this));

    Control.call(this, {
      element: element,
      target: options.target
    });

  }

  if (Control) ColorScaleLegendControl.__proto__ = Control;
  ColorScaleLegendControl.prototype = Object.create(Control && Control.prototype);
  ColorScaleLegendControl.prototype.constructor = ColorScaleLegendControl;

  ColorScaleLegendControl.prototype.handlePropertyChange = function handlePropertyChange(e) {
  };

  ColorScaleLegendControl.prototype.updateLegend = function updateLegend(resolution) {
    var graphicUrl = this.wmsSource.getLegendUrl(resolution);
    var img = document.getElementById("legend");
    img.src = graphicUrl;
  };

  ColorScaleLegendControl.prototype.setup = function setup() {
    // Initial legend
    var resolution = this.getMap().getView().getResolution();
    this.updateLegend(resolution);

    // Update the legend when the resolution changes
    this.getMap().getView().on("change:resolution", function (event) {
      var resolution = event.target.getResolution();
      this.updateLegend(resolution);
    }.bind(this));

  }

  return ColorScaleLegendControl;
})(Control);


export default ColorScaleLegendControl
