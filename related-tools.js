const tools = [
  {
    name: "QR Code Generator",
    link: "qr-code-generator.html",
    img: "https://via.placeholder.com/150"
  },
  {
    name: "Word Counter Tool",
    link: "word-counter-tool.html",
    img: "https://via.placeholder.com/150"
  },
  {
    name: "JSON Schema Generator",
    link: "json-schema-generator-pro.html",
    img: "https://via.placeholder.com/150"
  },
  {
    name: "BMI Calculator",
    link: "bmi.html",
    img: "https://via.placeholder.com/150"
  },
  {
    name: "Unit Converter",
    link: "converter.html",
    img: "https://via.placeholder.com/150"
  },
  {
    name: "Resume Score AI",
    link: "resume-score-ai.html",
    img: "https://via.placeholder.com/150"
  },
  {
    name: "Meal Planner",
    link: "meal-planner.html",
    img: "https://via.placeholder.com/150"
  }
];

// Get container
const container = document.getElementById("related-tools");

if (container) {
  const currentPage = window.location.pathname.split("/").pop();

  let html = `
    <h3 style="margin-bottom:15px;">Related Tools</h3>
    <div class="tools-grid">
  `;

  tools.forEach(tool => {
    // Hide current page tool
    if (tool.link !== currentPage) {
      html += `
        <div class="tool-card">
          <img src="${tool.img}" alt="${tool.name}">
          <h4>${tool.name}</h4>
          <a href="${tool.link}" class="btn">Open Tool</a>
        </div>
      `;
    }
  });

  html += `</div>`;

  container.innerHTML = html;
}
