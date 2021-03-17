import Control from 'ol/control/Control'
import RasterSource from "ol/source/Raster";
import ImageLayer from "ol/layer/Image";

//ColorScaleLegendControl
var HistogramControl = /*@__PURE__*/ (function (Control) {

  function HistogramControl(map, wmsSource, opt_options) {
    var options = opt_options || {};

    /*
    * Summarize values for a histogram.
    * @param {numver} value A VGI value.
    * @param {Object} counts An object for keeping track of VGI counts.
    */
    function summarize(value, counts) {
      var min = counts.min;
      var max = counts.max;
      var num = counts.values.length;
      if (value < min) {
        // do nothing
      } else if (value >= max) {
        counts.values[num - 1] += 1;
      } else {
        var index = Math.floor((value - min) / counts.delta);
        counts.values[index] += 1;
      }
    }



    /**
    * Calculate the Vegetation Greenness Index (VGI) from an input pixel.  This
    * is a rough estimate assuming that pixel values correspond to reflectance.
    * @param {Array<number>} pixel An array of [R, G, B, A] values.
    * @return {number} The VGI value for the given pixel.
    */

    function Cond(pixel) {
      var r = pixel[0] * 1;
      return r;
    }
    /**
    * Create a this.raster source where pixels with VGI values above a threshold will
    * be colored green.
    */
    this.raster = new RasterSource({
      sources: [wmsSource],
      /**
      * Run calculations on pixel data.
      * @param {Array} pixels List of pixels (one per source).
      * @param {Object} data User data object.
      * @return {Array} The output pixel.
      */
      operation: function (pixels, data) {
        var pixel = pixels[0];
        var value = Cond(pixel);
        summarize(value, data.counts);
        if (value >= data.threshold) {
          pixel[0] = 255;
          pixel[1] = 255;
          pixel[2] = 255;
          pixel[3] = 255;
        } else {
          pixel[3] = 0;
        }
        return pixel;
      },
      lib: {
        Cond: Cond,
        summarize: summarize
      }
    });
    this.raster.set("threshold", 0.1);

    this.raster_layer = new ImageLayer({
      title: "Histogram Overlay",
      source: this.raster
    });

    map.addLayer(this.raster_layer);

    this.minCond = 1;
    this.maxCond = 100;
    this.bins = 21;


    function createCounts(min, max, num) {
      var values = new Array(num);
      for (var i = 0; i < num; ++i) {
        values[i] = 0;
      }
      return {
        min: min,
        max: max,
        values: values,
        delta: (max - min) / num
      };
    }

    this.raster.on("beforeoperations", function (event) {
      event.data.counts = createCounts(this.minCond, this.maxCond, this.bins);
      event.data.threshold = this.raster.get("threshold");
    }.bind(this));

    map.on("pointermove", function (evt) {
      if (evt.dragging) {
        return;
      }
      var pixel = map.getEventPixel(evt.originalEvent);
      var hit = map.forEachLayerAtPixel(pixel, function () {
        return true;
      });
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

    var element = document.createElement("div");
    element.id = "Histogram";
    element.className = "ol-histogram ol-unselectable ol-control";
    element.innerHTML = `<div id="plot"></div>`;

    Control.call(this, {
      element: element,
      target: options.target
    });

  }

  if (Control) HistogramControl.__proto__ = Control;
  HistogramControl.prototype = Object.create(Control && Control.prototype);
  HistogramControl.prototype.constructor = HistogramControl;

  HistogramControl.prototype.setup = function setup(map) {

    var timer = null;


    function schedulePlot(resolution, counts, threshold) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      timer = setTimeout(plot.bind(null, resolution, counts, threshold), 1000 / 60);
    }

    this.raster.on("afteroperations", function (event) {
      schedulePlot(event.resolution, event.data.counts, event.data.threshold);
    });
    var barWidth = 5;
    var plotHeight = 150;
    var chart = d3
    .select("#plot")
    .append("svg")
    .attr("width", barWidth * this.bins)
    .attr("height", plotHeight);

    var chartRect = chart.node().getBoundingClientRect();

    var tip = d3.select(document.body).append("div").attr("class", "tip");

    function plot(resolution, counts, threshold) {
      var yScale = d3
      .scaleLinear()
      .domain([0, d3.max(counts.values)])
      .range([0, plotHeight]);

      var bar = chart.selectAll("rect").data(counts.values);

      bar.enter().append("rect");

      bar
      .attr("class", function (count, index) {
        var value = counts.min + index * counts.delta;
        return "bar" + (value >= threshold ? " selected" : "");
      })
      .attr("width", barWidth - 2);

      bar
      .transition()
      .attr("transform", function (value, index) {
        return (
          "translate(" +
          index * barWidth +
          ", " +
          (plotHeight - yScale(value)) +
          ")"
        );
      })
      .attr("height", yScale);

      bar.on("mousemove", function (count, index) {
        var threshold = counts.min + index * counts.delta;
        if (this.raster.get("threshold") !== threshold) {
          this.raster.set("threshold", threshold);
          this.raster.changed();
        }
      });

      bar.on("mouseover", function (count, index) {
        var area = 0;
        for (var i = counts.values.length - 1; i >= index; --i) {
          area += resolution * resolution * counts.values[i];
        }
        tip.html(message(counts.min + index * counts.delta, area));
        tip.style("display", "block");
        tip.transition().style({
          left: chartRect.left + index * barWidth + barWidth / 2 + "px",
          top: d3.event.y - 60 + "px",
          opacity: 1
        });
      });

      bar.on("mouseout", function () {
        tip
        .transition()
        .style("opacity", 0)
        .each("end", function () {
          tip.style("display", "none");
        });
      });
    }

    function message(value, area) {
      var acres = (area / 4046.86).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return acres + " acres at<br>" + value.toFixed(2) + " VGI or above";
    }
  };

  return HistogramControl;
})(Control);

export default HistogramControl
