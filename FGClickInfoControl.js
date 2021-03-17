import Control from 'ol/control/Control'

//ClickInfoControl
var ClickInfoControl = /*@__PURE__*/ (function (Control) {

  function ClickInfoControl(opt_options) {
    var options = opt_options || {};

    var element = document.createElement("div");
    element.id = "ClickInfo";
    element.className = "ol-unselectable ol-control";
    element.innerHTML = `
    <div id="info">&nbsp;</div>`


    Control.call(this, {
      element: element,
      target: options.target
    });

  }

  if (Control) ClickInfoControl.__proto__ = Control;
  ClickInfoControl.prototype = Object.create(Control && Control.prototype);
  ClickInfoControl.prototype.constructor = ClickInfoControl;

  ClickInfoControl.prototype.setup = function setup(map, wmsSource) {


    map.on("singleclick", function (evt) {
      var view = map.getView();
      document.getElementById("info").innerHTML = "";
      var viewResolution = /** @type {number} */ (view.getResolution());
      var url = wmsSource.getFeatureInfoUrl(
        evt.coordinate,
        viewResolution,
        "EPSG:26911",
        { INFO_FORMAT: "text/html" }
      );
      if (url) {
        fetch(url)
        .then(function (response) {
          return response.text();
        })
        .then(function (html) {
          document.getElementById("info").innerHTML = html;
        });
      }
    });

  };
  return ClickInfoControl;
})(Control);


export default ClickInfoControl
