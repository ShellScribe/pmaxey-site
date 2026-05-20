(function () {
  var toggle = document.querySelector("[data-site-nav-toggle]");
  var label = document.querySelector("[data-site-nav-toggle-label]");
  var nav = document.querySelector("[data-site-nav]");
  var mobileQuery = window.matchMedia("(max-width: 760px)");

  if (!toggle || !label || !nav) {
    return;
  }

  document.documentElement.classList.add("site-nav-ready");

  function setExpanded(isExpanded) {
    toggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    label.textContent = isExpanded ? "Close primary navigation" : "Open primary navigation";
    document.documentElement.classList.toggle("site-nav-is-open", isExpanded);
  }

  function isExpanded() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  function closeNav() {
    setExpanded(false);
  }

  toggle.addEventListener("click", function () {
    setExpanded(!isExpanded());
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      closeNav();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isExpanded()) {
      closeNav();
      toggle.focus();
    }
  });

  document.addEventListener("click", function (event) {
    if (!isExpanded() || toggle.contains(event.target) || nav.contains(event.target)) {
      return;
    }

    closeNav();
  });

  function handleViewportChange(event) {
    if (!event.matches) {
      closeNav();
    }
  }

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", handleViewportChange);
  } else {
    mobileQuery.addListener(handleViewportChange);
  }
}());
