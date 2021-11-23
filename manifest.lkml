constant: vis_id {
    value: "custom_bubble_chart"
    export: override_optional
}
constant: vis_label {
    value: "Custom Bubble Chart"
    export: override_optional
}
visualization: {
    id: "@{vis_id}"
    label: "@{vis_label}"
    file: "bubble_chart.js.js"
    sri_hash: "my_sri_hash"
    dependencies: [
      "https://d3js.org/d3.v4.js",
      "https://d3js.org/d3-scale-chromatic.v1.min.js"
    ]
}
