
import Control from 'ol/control/Control'
import { getPointResolution, get as getProjection } from "ol/proj";
import { ScaleLine, defaults as defaultControls } from "ol/control";

//ColorScale
var PrintScaleControl = /*@__PURE__*/ (function (Control) {
  //print to scale
  var dims = {
    a0: [1189, 841],
    tabloid: [431.8, 279.4],
    a2: [594, 420],
    a3: [420, 297],
    letter: [279.4, 215.9],
    a5: [210, 148]
  };

  // export options for html-to-image.
  // See: https://github.com/bubkoo/html-to-image#options
  var exportOptions = {
    filter: function (element) {
      var className = element.className || "";
      return (
        className.indexOf("ol-control") === -1 ||
        className.indexOf("ol-scale") > -1 ||
        className.indexOf("fg-ol-color-scale") > -1 ||
        (className.indexOf("ol-attribution") > -1 &&
          className.indexOf("ol-uncollapsible"))
      );
    }
  };

  function PrintScaleControl(opt_options) {
    var options = opt_options || {};

    var element = document.createElement("div");
    element.id = "PrintScaleControl";
    element.className = "ol-unselectable ol-control";
    element.innerHTML =
    `<br>
    <form class="form">
      <label for="format">Page size </label>
      <select id="format">
        <option value="a0">a0 </option>
        <option value="tabloid">11 x 17 (slow)</option>
        <option value="a2">a2</option>
        <option value="a3">a3</option>
        <option value="letter" selected>8.5 x 11 (fast)</option>
        <option value="a5">a5</option>
      </select>
      <label for="resolution">Resolution </label>
      <select id="resolution">
        <option value="72">72 dpi (fast)</option>
        <option value="150">150 dpi</option>
        <option value="200" selected>200 dpi</option>
        <option value="300">300 dpi (slow)</option>
      </select>
      <label for="scale">Scale </label>
      <select id="scale">
          <option value="10.0" >1:10000</option>
        <option value="3.5">1:3500</option>
        <option value="2.5">1:2500</option>
        <option value="2"selected>1:2000</option>
        <option value="1">1:1000</option>
        <option value="0.75">1:750</option>
      </select>
       </form>
    <button id="export-pdf">Export PDF</button>`

    this.export_button = element.querySelector("#export-pdf");
    this.export_button.addEventListener(
      "click",
      this.exportPDF.bind(this),
      false
    );

    Control.call(this, {
      element: element,
      target: options.target
    });
  }

  if (Control) PrintScaleControl.__proto__ = Control;
  PrintScaleControl.prototype = Object.create(Control && Control.prototype);
  PrintScaleControl.prototype.constructor = PrintScaleControl;

  PrintScaleControl.prototype.processToJpegResponse = function processToJpegResponse(dataUrl) {
    var pdf = new jsPDF("landscape", undefined, this.format);
    pdf.addImage(dataUrl, "JPEG", 0, 0, this.dim[0], this.dim[1]);
    pdf.save("map.pdf");
    // Reset original map size

    //this.getMap().getControls()this.getMap().getControls().scaleLine.setDpi();
    this.getMap().getControls().getArray().find(control => control.element.classList.contains("ol-scale-bar")).setDpi();
    this.getMap().getTargetElement().style.width = "";
    this.getMap().getTargetElement().style.height = "";
    this.getMap().updateSize();
    this.getMap().getView().setResolution(this.viewResolution);
    this.export_button.disabled = false;
    document.body.style.cursor = "auto";
  };

  PrintScaleControl.prototype.renderComplete = function renderComplete() {
    exportOptions.width = this.width;
    exportOptions.height = this.height;
    domtoimage
      .toJpeg(this.getMap().getViewport(), exportOptions)
      .then(this.processToJpegResponse.bind(this));
  };

  PrintScaleControl.prototype.exportPDF = function exportPDF() {
      this.export_button.disabled = true;
      document.body.style.cursor = "progress";
      this.format = document.getElementById("format").value;
      var resolution = document.getElementById("resolution").value;
      var scale = document.getElementById("scale").value;
      this.dim = dims[this.format];
      this.width = Math.round((this.dim[0] * resolution) / 25.4);
      this.height = Math.round((this.dim[1] * resolution) / 25.4);
      this.viewResolution = this.getMap().getView().getResolution();
      var scaleResolution =
        scale /
        getPointResolution(
          this.getMap().getView().getProjection(),
          resolution / 25.4,
          this.getMap().getView().getCenter()
        );
      this.getMap().once("rendercomplete", this.renderComplete.bind(this));

      // Set print size
      this.getMap().getControls().getArray().find(control => control.element.classList.contains("ol-scale-bar")).setDpi(resolution);
      this.getMap().getTargetElement().style.width = this.width + "px";
      this.getMap().getTargetElement().style.height = this.height + "px";
      this.getMap().updateSize();
      this.getMap().getView().setResolution(scaleResolution);
  };
  return PrintScaleControl;
})(Control);

export default PrintScaleControl