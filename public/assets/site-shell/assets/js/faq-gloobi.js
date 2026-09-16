(function () {
  "use strict";
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-accordion] .gloobi-faq-item button");
    if (!button) return;
    var item = button.closest(".gloobi-faq-item");
    var open = item.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
    var symbol = button.querySelector("span");
    if (symbol) symbol.textContent = open ? "−" : "+";
    var panel = document.getElementById(button.getAttribute("aria-controls"));
    if (panel) panel.hidden = !open;
  });
})();
