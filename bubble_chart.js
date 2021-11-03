/**
 * Welcome to the Looker Visualization Builder! Please refer to the following resources 
 * to help you write your visualization:
 *  - API Documentation - https://github.com/looker/custom_visualizations_v2/blob/master/docs/api_reference.md
 *  - Example Visualizations - https://github.com/looker/custom_visualizations_v2/tree/master/src/examples
 **/

const visObject = {
  /**
   * Configuration options for your visualization. In Looker, these show up in the vis editor
   * panel but here, you can just manually set your default values in the code.
   **/
  options: {
    color_range: {
      type: "array",
      label: "Color Range",
      display: "colors"
    },
    x_label: {
      type: "string",
      label: "Label for X",
      placeholder: "Leave empty for default"
    },
    y_label: {
      type: "string",
      label: "Label for Y",
      placeholder: "Leave empty for default"
    },
    z_label: {
      type: "string",
      label: "Label for Z",
      placeholder: "Leave empty for default"
    },
    colorPreSet: {
      type: 'string',
      display: 'select',
      label: 'Color Range',
      section: 'Data',
      values: [{
          'Custom': 'c'
        },
        {
          'Tomato to Steel Blue': '#F16358,#DF645F,#CD6566,#BB666D,#A96774,#97687B,#856982,#736A89,#616B90,#4F6C97,#3D6D9E'
        },
        {
          'Pink to Black': '#170108, #300211, #49031A, #620423, #79052B, #910734, #AA083D, #C30946, #DA0A4E, #F30B57, #F52368, #F63378, #F63C79, #F75389, #F86C9A, #F985AB, #FB9DBC, #FCB4CC, #FDCDDD, #FEE6EE'
        },
        {
          'Green to Red': '#7FCDAE, #7ED09C, #7DD389, #85D67C, #9AD97B, #B1DB7A, #CADF79, #E2DF78, #E5C877, #E7AF75, #EB9474, #EE7772'
        },
        {
          'White to Green': '#ffffe5,#f7fcb9 ,#d9f0a3,#addd8e,#78c679,#41ab5d,#238443,#006837,#004529'
        },
        {
          'Lots of Love': '#549171, #AEA2B7, #E1AFAE, #D4AB8A, #55928A, #D87950, #E9565A, #914D33, #757981, #BF7939, #515662, #EAAC9D'
        }
      ],
      default: 'c',
      order: 1
    },
    colorRange: {
      type: 'array',
      label: 'Custom Color Ranges',
      section: 'Data',
      order: 2,
      placeholder: '#fff, red, etc...'
    },
  },

  /**
   * The create function gets called when the visualization is mounted but before any
   * data is passed to it.
   **/
  create: function(element, config) {
    element.innerHTML = `
    <style>
      .bubble-vis {
        height: 100%
        display: flex
        flex-direction: column
        justify-content: center
        text-align: center
      }
      .bubbles {
        stroke-width: 1px
        stroke: black
        opacity: .8
      }
      .bubbles:hover {
        stroke: black
    	}
      .tooltip {
        position: absolute
      }
    </style>
  	`

    // Create a container element to let us center the text.
    this._container = element.appendChild(document.createElement("div"))
    this._container.className = this._container.id = "bubble-vis"

    // Create an element to contain the text.
    this._textElement = this._container.appendChild(document.createElement("div"))
    this._textElement.className = this._textElement.id = "bubble-text"
  },

  /**
   * UpdateAsync is the function that gets called (potentially) multiple times. It receives
   * the data and should update the visualization with the new data.
   **/
  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    this._container.innerHTML = ""
    // Clear any errors from previous updates.
    this.clearErrors()

    // Throw some errors and exit if the shape of the data isn't what this chart needs.
    if (queryResponse.fields.dimensions.length !== 1) {
      this.addError({
        title: "Wrong Dimensions",
        message: "This chart requires exactly one dimension"
      })
      return
    }

    var margin = {
        top: 10,
        right: 100,
        bottom: 60,
        left: 60
      },
      width = element.offsetWidth - margin.left - margin.right,
      height = element.offsetHeight - margin.top - margin.bottom,
      x_width = width - 40;


    // append the svg object to the body of the page
    var svg = d3.select("#bubble-vis")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")


    // ---------------------------//
    //       AXIS  AND SCALE      //
    // ---------------------------//

    // Add X axis
    var xmax = data.reduce(function(acc, cur) {
      return Math.max(cur[queryResponse.fields.measures[0].name].value, acc)
    }, 0)
    var x = d3.scaleLinear()
      .domain([0, xmax * 1.1])
      .range([0, x_width])
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(3))

    // Add X axis label:
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", x_width / 2)
      .attr("y", height + 50)
      .text(queryResponse.fields.measures[0].label)

    // Add Y axis
    var ymax = data.reduce(function(acc, cur) {
      return Math.max(cur[queryResponse.fields.measures[1].name].value, acc)
    }, 0)
    var y = d3.scaleLinear()
      .domain([0, ymax * 1.1])
      .range([height, 0])
    svg.append("g")
      .call(d3.axisLeft(y))

    // Add Y axis label:
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("transform", "rotate(-90)")
      .text(queryResponse.fields.measures[1].label)

    // Add a scale for bubble size
    var bmax = data.reduce(function(acc, cur) {
      return Math.max(cur[queryResponse.fields.measures[2].name].value, acc)
    }, 0)
    var bmin = data.reduce(function(acc, cur) {
      return Math.min(cur[queryResponse.fields.measures[2].name].value, acc)
    }, bmax)
    var z = d3.scaleSqrt()
      .domain([bmin, bmax])
      .range([2, 30])

    // Add a scale for bubble color
    var categories = data.map(function(cur) {
      return cur[queryResponse.fields.dimensions[0].name].value
    })

    var colorSettings = d3.schemeSet1
    if (config.colorPreSet === 'c' && config.colorRange) {
      var colorSettings = config.colorRange
    } else if (typeof config.colorPreSet === 'string' && config.colorPreSet !== 'c') {
      var colorSettings = config.colorPreSet.split(",")
    }

    var myColor = d3.scaleOrdinal()
      .domain(categories)
      .range(colorSettings)


    // ---------------------------//
    //      TOOLTIP               //
    // ---------------------------//

    // -1- Create a tooltip div that is hidden by default:
    var tooltip = d3.select(element)
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "grey")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("color", "white")

    // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
    var showTooltip = function(d) {
      tooltip
        .transition()
        .duration(200)
      tooltip
        .style("opacity", 1)
        .html(d[queryResponse.fields.dimensions[0].name].value)
        .style("left", (d3.mouse(this)[0] + 45) + "px")
        .style("top", (d3.mouse(this)[1] + 45) + "px")
    }
    var moveTooltip = function(d) {
      tooltip
        .style("left", (d3.mouse(this)[0] + 45) + "px")
        .style("top", (d3.mouse(this)[1] + 45) + "px")
    }
    var hideTooltip = function(d) {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0)
    }


    // ---------------------------//
    //       HIGHLIGHT GROUP      //
    // ---------------------------//

    // What to do when one group is hovered
    var highlight = function(d) {
      // reduce opacity of all groups
      d3.selectAll(".bubbles").style("opacity", .05)
      // expect the one that is hovered
      d3.selectAll("." + d).style("opacity", 1)
    }

    // And when it is not hovered anymore
    var noHighlight = function(d) {
      d3.selectAll(".bubbles").style("opacity", 1)
    }


    // ---------------------------//
    //       CIRCLES              //
    // ---------------------------//

    // Add dots
    svg.append('g')
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", function(d) {
        return "bubbles " + d[queryResponse.fields.dimensions[0].name].value
      })
      .attr("cx", function(d) {
        return x(d[queryResponse.fields.measures[0].name].value)
      })
      .attr("cy", function(d) {
        return y(d[queryResponse.fields.measures[1].name].value)
      })
      .attr("r", function(d) {
        return z(d[queryResponse.fields.measures[2].name].value)
      })
      .style("fill", function(d) {
        return myColor(d[queryResponse.fields.dimensions[0].name].value)
      })
      .style("stroke", function(d) {
        return myColor(d[queryResponse.fields.dimensions[0].name].value)
      })
      // -3- Trigger the functions for hover
      .on("mouseover", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip)

    // ---------------------------//
    //        UTILS               //
    // ---------------------------//

    function nFormatter(num, digits) {
      const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
      ];
      const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
      var item = lookup.slice().reverse().find(function(item) {
        return num >= item.value;
      });
      return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + ' ' + item.symbol : "0";
    }

    // ---------------------------//
    //        LEGEND              //
    // ---------------------------//

    // Add legend: circles
    var avg = ((bmin + bmax) / 2).toFixed(0)
    var valuesToShow = [Number(bmin).toFixed(0), avg, Number(bmax).toFixed(0)]
    var xLegend = width + z(bmax)
    var xLabel = width + z(bmax) / 2 + margin.right / 2
    svg.selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("circle")
      .attr("cx", xLegend)
      .attr("cy", function(d) {
        return height - 50 - z(d)
      })
      .attr("r", function(d) {
        return z(d)
      })
      .style("fill", "none")
      .attr("stroke", "grey")

    // Add legend: segments
    svg
      .selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("line")
      .attr('x1', function(d) {
        return xLegend + z(d)
      })
      .attr('x2', xLabel)
      .attr('y1', function(d) {
        return height - 50 - z(d)
      })
      .attr('y2', function(d) {
        return height - 50 - z(d)
      })
      .attr('stroke', 'black')
      .style('stroke-dasharray', ('2,2'))

    // Add legend: labels
    svg
      .selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("text")
      .attr('x', xLabel)
      .attr('y', function(d) {
        return height - 50 - z(d)
      })
      .text(function(d) {
        return nFormatter(d, 0)
      })
      .style("font-size", 10)
      .attr('alignment-baseline', 'middle')

    // Legend title
    svg.append("text")
      .attr('x', xLegend)
      .attr("y", height - 20)
      .text(queryResponse.fields.measures[2].label_short)
      .attr("text-anchor", "middle")

    // Add one dot in the legend for each name.
    var size = 20
    var allgroups = categories
    svg.selectAll("myrect")
      .data(allgroups)
      .enter()
      .append("circle")
      .attr("cx", xLegend - z(bmax))
      .attr("cy", function(d, i) {
        return 50 + i * (size + 5)
      }) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("r", 7)
      .style("fill", function(d) {
        return myColor(d)
      })
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight)

    // Add labels beside legend dots
    svg.selectAll("mylabels")
      .data(allgroups)
      .enter()
      .append("text")
      .attr("x", xLegend - z(bmax) + size * .8)
      .attr("y", function(d, i) {
        return 40 + i * (size + 5) + (size / 2)
      }) // 100 is where the first dot appears. 25 is the distance between dots
      .text(function(d) {
        return d
      })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight)

    doneRendering()
  }
}

looker.plugins.visualizations.add(visObject)