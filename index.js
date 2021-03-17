import "/styles/ol.css";
import "/styles/ol-ext.css";
import "/styles/FG.css";

var styles = `
      .ol-control.ol-bar .ol-option-bar .ol-control {
        display: table-row;
      }
      .ol-control.ol-bar .ol-control.ol-option-bar {
        top: -150px;
        left: -500px;
      }
      .ol-control.ol-bar {
        top: auto;
        left: auto;
        right: 5px;
        bottom: 45px;
      }
`
var styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = styles
document.head.appendChild(styleSheet)

import BingMaps from "ol/source/BingMaps";
import Map from "ol/Map";
import View from "ol/View";
import { Fill, Stroke, Circle, Style, Text } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import LayerGroup from "ol/layer/Group";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import TileWMS from "ol/source/TileWMS";
import FullScreen from "ol/control/FullScreen";
import LayerSwitcher from "ol-ext/control/LayerSwitcher";
import Bar from "ol-ext/control/Bar";
import Toggle from "ol-ext/control/Toggle";
import WMSCapabilities from "ol/format/WMSCapabilities";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import FeatureSelect from "ol/interaction/Select";
import RasterSource from "ol/source/Raster";
import ImageWMS from "ol/source/ImageWMS";
import { ScaleLine, Control, defaults as defaultControls } from "ol/control";
import { getPointResolution, get as getProjection } from "ol/proj";
import { getTopLeft, getWidth } from "ol/extent";
import Graticule from "ol-ext/control/Graticule";
import { fromLonLat } from "ol/proj";
import ColorScaleControl from "./FGColorScaleControl"
import SearchFeature from "./FGSearchFeature";
import PrintScaleControl from "./FGPrintScaleControl";
import ColorScaleLegendControl from "./FGColorScaleLegendControl";
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import Projection from "ol/proj/Projection";
//import HistogramControl from "./FGHistogramControl";
//import ClickInfoControl from "./FGClickInfoControl";

proj4.defs(
  "EPSG:26911",
  "+proj=utm +zone=11 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs "
);
register(proj4);
var proj26911 = getProjection("EPSG:26911");
proj26911.setExtent([213181.34452205175,3416303.0433063116,798877.231067875,9273261.908764545]);
var projectExtent = proj26911.getExtent();

var grat = new Graticule({
  step: 20,
  stepCoord: 2,
  projection: "EPSG:26911"
});



var parser = new WMSCapabilities();
var capabilities;
fetch(
  "https://larsenwest.ca:8443/geoserver/wms?service=WMS&version=1.1.1&request=GetCapabilities"
).then(function (response) {
  response.text().then(function (data) {
    capabilities = parser.read(data);
    for (let layer_index in layer_list_31) {
      var layer = layer_list_31[layer_index];
      layer.setExtent(
        capabilities["Capability"]["Layer"]["Layer"].find(function (element) {
          // UTM ZONE 11 vs Google Proj
          return element["Name"] == layer.getSource().getParams()["LAYERS"];
        })["BoundingBox"][0]["extent"]
      );   
    }
  });
});

//histogram calc
var wmsSource = new ImageWMS({
  url: "https://larsenwest.ca:8443/geoserver/wms",
  title: "wmsLayer",
  params: {
    LAYERS: "TallCree_2751:NorthTallCree_Area1_EM31"
  },
  serverType: "geoserver",
  //crossOrigin: "anonymous"
  crossOrigin: ""
});

var wmsLayer = new ImageLayer({
  source: wmsSource
});
function tileLayerFactory(site) {
  var title = site.split(":")[1];
  return new TileLayer({
    title: title,
    //extent: [-13884991, 2870341, -7455066, 6338219],
    preload: 0,
    visible: true,
    source: new TileWMS({
      projection: "EPSG:900913",
      url: "https://larsenwest.ca:8443/geoserver/saige/wms",
      attributions:
      '© <a href="https://aksgeoscience.com" ><img src="akslogo.jpg"></a>',
      crossOrigin: "",
      params: {
        LAYERS: site,
        TILED: true
      },
      serverType: "geoserver"
      //  enableOpacitySliders: true
      //  transition: 0,
    })
  });
}
var sites_list_31 = [
  "saige:Nov18_2020_EM31",
    "saige:July13_2020_EM31",
  "saige:March19_2020_EM31",
  "saige:Feb03_2020_EM31",
"saige:Oct15_2019_EM31",
"saige:April9_2019_EM31",
"saige:March25_2019_EM31"
];
var layer_list_31 = [];
for (let site_index in sites_list_31) {
  var layer = tileLayerFactory(sites_list_31[site_index]);
  layer_list_31.push(layer);
}
function orthoLayerFactory(orthoSite) {
  var title = orthoSite.split()[2];
  return new TileLayer({
    title: title,
    //extent: [-13884991, 2870341, -7455066, 6338219],
    visible: title.includes("nov")  ? true : false,
    //visible: [title.includes("nov")  ? true : false],
    source: new WMTS({
      url: 'http://larsenwest.ca:8443/geoserver/gwc/service/wmts',
      layer: orthoSite,
      attributions:
      '© <a href="https://saige.ca" ><img src="saige.jpg"></a>',
      matrixSet: 'UTMz11_NAD83',
      tileSize: [256,256],
      format: 'image/png',
      projection: proj26911,
              tileGrid: new WMTSTileGrid({
                    origin: [213181.34452205175, 9273261.908764545],
                    resolutions: resolutions,
                    matrixIds: matrixIds,
                    }),
        }),
      });
  }
  var sites_list_ortho = [
    "saige:nov20_2020_ortho_shift",
      "saige:july13_2020_orth",
      "saige:march19_2020_ortho",
      "saige:Feb03_2020_ortho",
      "saige:june20_2019_ortho_shift",
      "	saige:April9_2019_ortho",
    "saige:march25_2019_ortho_shift"
 ];
 var layer_list_ortho = [];
 for (let site_index in sites_list_ortho) {
  var layer = tileLayerFactory(sites_list_ortho[site_index]);
  layer_list_ortho.push(layer);
}
//var scaleLine = new ScaleLine({});
var scaleLine = new ScaleLine({ bar: true, text: true, minWidth: 125 });
var view = new View({
  // center: fromLonLat([4.8, 47.75]),
  center: [581124, 6263239],
  projection: proj26911,
  //center: [-12882970.16, 8061171.78],
  //projection: projection,
  zoom: 14
});

//grid

//end of grid
var colorScaleControl31 = new ColorScaleControl();
colorScaleControl31.setName("<u>EM31 :</u> ");
colorScaleControl31.setLayerList(layer_list_31);
//colorScaleControl31.element.style.bottom = "180px";
//colorScaleControl31.element.style.right = "10px";
function toggleGraticuleLines(on) {
  var style;
  if(on) {
    style = new Style({
      text: new Text({
        font: "12px Calibri,sans-serif",
        rotation: 0,
        textAlign: "left",
        overflow: true,
        fill: new Fill({
          color: "#000"
        }),
        stroke: new Stroke({
          color: "#fff",
          width: 3
        })
      }),
      stroke: new Stroke({
        color: "#000",
        width: 1
      }),
      fill: new Fill({
        color: "#fff"
      })
    });
  } else {
    style = new Style({
      text: new Text({
        font: "12px Calibri,sans-serif",
        rotation: 0,
        textAlign: "left",
        overflow: true,
        fill: new Fill({
          color: "#000"
        }),
        stroke: new Stroke({
          color: "#fff",
          width: 3
        })
      }),
      fill: new Fill({
        color: "#000"
      })
    });
  }
  grat.setStyle(style);
  map.render();
};
var resolutions = [2287.8745568196223, 1143.9372784098111, 571.9686392049056, 285.9843196024528, 142.9921598012264, 71.4960799006132, 35.7480399503066, 17.8740199751533, 8.93700998757665, 4.468504993788325, 2.2342524968941624, 1.1171262484470812, 0.5585631242235406, 0.2792815621117703, 0.1396407810558851, 0.0698203905279426, 0.0349101952639713, 0.0174550976319856, 0.0087275488159928, 0.0043637744079964];
var matrixIds = ['UTMz11_NAD83:0', 'UTMz11_NAD83:1', 'UTMz11_NAD83:2', 'UTMz11_NAD83:3', 'UTMz11_NAD83:4', 'UTMz11_NAD83:5', 'UTMz11_NAD83:6', 'UTMz11_NAD83:7', 'UTMz11_NAD83:8', 'UTMz11_NAD83:9', 'UTMz11_NAD83:10', 'UTMz11_NAD83:11', 'UTMz11_NAD83:12', 'UTMz11_NAD83:13', 'UTMz11_NAD83:14', 'UTMz11_NAD83:15', 'UTMz11_NAD83:16', 'UTMz11_NAD83:17', 'UTMz11_NAD83:18', 'UTMz11_NAD83:19'];
var map = new Map({
  target: "map",
  units: "m",
  controls: defaultControls().extend([
    new FullScreen(),
    scaleLine
     ]),
  layers: [
    new TileLayer({
      visible: true,
      title: "Bing",
      preload: Infinity,
      source: new BingMaps({
        key:
        "82o22Jd9KBSXdi7KOw9F~-ljDB0Kkf0oF-Egpwvb9_w~Aqsa-2Is6gI2fOr88_Kgqe8RC041lQaheYQt9ISHnZ2L4jpJkBerWGqwZ2t31CRV",
        imagerySet: "Aerial",
        // use maxZoom 19 to see stretched tiles instead of the BingMaps
        // "no photos at this zoom level" tiles
        maxZoom: 17
      })
    }),
    new LayerGroup({
      title: "Ortho Images",
      layers: layer_list_ortho
    }),  
    new LayerGroup({
      title: "EM31",
      layers: layer_list_31
    }),
   ],
  view: view
});

 map.on('rendercomplete',() => {
    const zoomLevel = map.getView().getZoom();
   var zoomRounded = Math.round(zoomLevel * 10) / 10;
  //   console.log(zoomRounded);
    });

 
 var labelStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    overflow: true,
    fill: new Fill({
      color: '#000',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3,
    }),
    offsetY: map.getView().getZoom() > 10 ? '35' : '0', 
     }),
});

var wellStyle = new Style({
image: new Circle({
radius: 7,
fill: new Fill({ color: "rgba(0, 255, 85, 0.4)" }),
stroke: new Stroke({ color: "blue", width: 1 })
})
});
var style = [labelStyle, wellStyle];
map.addControl(grat);

var color_scale_legend = new ColorScaleLegendControl(wmsSource);
map.addControl(color_scale_legend);
color_scale_legend.setup();
// var layerSwitcher = new ol.control.LayerSwitcher({        enableOpacitySliders: true    });
var layerSwitcher = new LayerSwitcher();
map.addControl(layerSwitcher);
var print = new PrintScaleControl();
var sub1 = new Bar(
  {	toggleOne: true,
    controls:
    [
      colorScaleControl31,
      print,
      new Toggle({
        html: 'Grid (on/off)',
        active:true,
        onToggle: function() {
        toggleGraticuleLines(this.getActive());
        }
      })
    ]
  });

var mainbar = new Bar(
  {	controls: [
    new Toggle(
      {	html: 'Tools',
      // First level nested control bar
      bar: sub1,
      onToggle: function() {}
    })
  ]
});
map.addControl ( mainbar );

function newFunction() {
  return 11;
}
