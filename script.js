var flag = 1;
function clickY(val) {
  flag = val;
}

$(function() {
  var detailChart;

  // create the detail chart
  function createDetail(masterChart, data) {
      // prepare the detail chart
      var detailData = [],
          detailStart = data[0][0];

          // console.log(data[0][0])

      $.each(masterChart.series[0].data, function () {
          if (this.x >= detailStart) {
              // console.log(this.Baseline)
              detailData.push(this.y);
          }
      });

      // create a detail chart referenced by a global variable
      detailChart = Highcharts.chart('detail-container', {
          chart: {
              marginBottom: 120,
              reflow: false,
              marginLeft: 50,
              marginRight: 20,
              style: {
                  position: 'absolute'
              }
          },
          credits: {
              enabled: false
          },
          title: {
              text: 'CSV file convertor',
              align: 'left',
          },
          subtitle: {
              text: 'Select an area by dragging across the lower chart',
              align: 'left'
          },
          xAxis: {
              type: 'datetime'
          },
          yAxis: {
              title: {
                  text: null
              },
              maxZoom: 0.1
          },
          tooltip: {
              formatter: function () {
                  var point = this.points[0];
                  // console.log(this.Baseline)
                  return Highcharts.dateFormat('%A %B %e %Y', this.x) + ':<br/>' + Highcharts.numberFormat(point.y, 2);
              },
              shared: true
          },
          legend: {
              enabled: false
          },
          plotOptions: {
              series: {
                  marker: {
                      enabled: false,
                      states: {
                          hover: {
                              enabled: true,
                              radius: 3
                          }
                      }
                  }
              }
          },
          series: [{
              name: '',
              pointStart: detailStart,
              pointInterval: 24 * 3600 * 1000,
              data: detailData
          }],

          exporting: {
              enabled: false
          }

      }); // return chart
  }

  // create the master chart
  function createMaster(data) {
      Highcharts.chart('master-container', {
          chart: {
              reflow: false,
              borderWidth: 0,
              backgroundColor: null,
              marginLeft: 50,
              marginRight: 20,
              zoomType: 'x',
              events: {

                  // listen to the selection event on the master chart to update the
                  // extremes of the detail chart
                  selection: function (event) {
                      var extremesObject = event.xAxis[0],
                          min = extremesObject.min,
                          max = extremesObject.max,
                          detailData = [],
                          xAxis = this.xAxis[0];

                      // console.log(extremesObject)

                      // reverse engineer the last part of the data
                      $.each(this.series[0].data, function () {
                          console.log(this)
                          if (this.x > min && this.x < max) {
                              detailData.push([this.x, this.y]);
                          }
                      });

                      // move the plot bands to reflect the new detail span
                      xAxis.removePlotBand('mask-before');
                      xAxis.addPlotBand({
                          id: 'mask-before',
                          from: data[0][0],
                          to: min,
                          color: 'rgba(0, 0, 0, 0.2)'
                      });

                      xAxis.removePlotBand('mask-after');
                      xAxis.addPlotBand({
                          id: 'mask-after',
                          from: max,
                          to: data[data.length - 1][0],
                          color: 'rgba(0, 0, 0, 0.2)'
                      });


                      detailChart.series[0].setData(detailData);

                      console.log(detailData)

                      return false;
                  }
              }
          },
          title: {
              text: null
          },
          xAxis: {
              type: 'datetime',
              showLastTickLabel: true,
              maxZoom: 14 * 24 * 3600000, // fourteen days
              plotBands: [{
                  id: 'mask-before',
                  from: data[0][0],
                  to: data[data.length - 1][0],
                  color: 'rgba(0, 0, 0, 0.2)'
              }],
              title: {
                  text: null
              }
          },
          yAxis: {
              gridLineWidth: 0,
              labels: {
                  enabled: false
              },
              title: {
                  text: null
              },
              min: 0.6,
              showFirstLabel: false
          },
          tooltip: {
              formatter: function () {
                  return false;
              }
          },
          legend: {
              enabled: false
          },
          credits: {
              enabled: false
          },
          plotOptions: {
              series: {
                  fillColor: {
                      linearGradient: [0, 0, 0, 70],
                      stops: [
                          [0, Highcharts.getOptions().colors[0]],
                          [1, 'rgba(255,255,255,0)']
                      ]
                  },
                  lineWidth: 1,
                  marker: {
                      enabled: false
                  },
                  shadow: false,
                  states: {
                      hover: {
                          lineWidth: 1
                      }
                  },
                  enableMouseTracking: false
              }
          },

          series: [{
              type: 'area',
              name: '',
              pointInterval: 24 * 3600 * 1000,
              pointStart: data[0][0],
              data: data
          }],

          exporting: {
              enabled: false
          }

      }, function (masterChart) {
          createDetail(masterChart, data);
      }); // return chart instance
  }

  function praseCsv(str) {
    var lines = str.trim().split('\n');
    var cols = [];
    var json = [];
    while (line = lines.shift()) {
      if (cols.length === 0) {
        cols = line.split(';');
      } else {
        var obj = {}
        var values = line.split(';');
        for (i = 0; i < cols.length; i ++) {
          obj[ cols[i] ] = values[i]
        }
        json.push(obj)
      }
    }
    return json
  }

  $("form").submit(function(e) {
    e.preventDefault();
    var file = document.getElementById('input1').files[0]
    var reader = new FileReader();

    reader.onload = function(){
      var text = reader.result;
      var obj1 = praseCsv(text).map(function(v) {
        return [
          new Date(parseInt(v['Jaar']), parseInt(v['Maand']), parseInt(v['dag'])).getTime(),
          parseInt(v['Actual'])
        ];
      })
      var obj2 = praseCsv(text).map(function(v) {
        return [
          new Date(parseInt(v['Jaar']), parseInt(v['Maand']), parseInt(v['dag'])).getTime(),
          parseFloat(v['Baseline'].replace(',', '.'))
        ];
      })
      // console.log(obj1)
      // var obj = obj1.concat(obj2)

      if (flag == 1) {
        createMaster(obj1)
      }

      if (flag ==2) {
        createMaster(obj2)
      }
    };
    reader.readAsText(file);
  });

  // make the container smaller and add a second container for the master chart
  var $container = $('#container')
      .css('position', 'relative');

  $('<div id="detail-container">')
      .appendTo($container);

  $('<div id="master-container">')
      .css({
          position: 'absolute',
          top: 300,
          height: 100,
          width: '100%'
      })
      .appendTo($container);
});
