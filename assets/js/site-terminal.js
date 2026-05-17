(function () {
  var consoleDetails = document.querySelector("[data-quiet-console]");
  var panel = document.querySelector("[data-quiet-panel]");
  var form = document.querySelector("[data-quiet-form]");
  var input = document.querySelector("[data-quiet-input]");
  var output = document.querySelector("[data-quiet-output]");
  var visibleCommand = document.querySelector("[data-quiet-visible-command]");
  var closeButton = document.querySelector("[data-quiet-close]");
  var minimizeButton = document.querySelector("[data-quiet-minimize]");
  var maximizeButton = document.querySelector("[data-quiet-maximize]");
  var summary = consoleDetails ? consoleDetails.querySelector(".quiet-console__summary") : null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var promptText = "guest@pmaxey.com:~$ ";
  var catImage = panel ? panel.getAttribute("data-cat-image") : "";
  var minimizeTimer;

  if (!consoleDetails || !panel || !form || !input || !output || !visibleCommand || !closeButton || !minimizeButton || !maximizeButton) {
    return;
  }

  var commands = {
    help: [
      "available commands:",
      "  help     show this message",
      "  ls       list files",
      "  pwd      print working directory",
      "  whoami   print current user",
      "  status   show site status",
      "  date     print current date",
      "  cat      concatenate files and print on the standard output",
      "  clear    clear the terminal"
    ],
    ls: [
      "about  experience  projects  skills  contact  cat.jpg"
    ],
    pwd: [
      "/home/guest/pmaxey.com"
    ],
    whoami: [
      "guest"
    ],
    status: [
      "site: online",
      "build: static",
      "tracking: none",
      "contact: pmaxey.ks9k6@simplelogin.com"
    ],
    date: [
      new Date().toDateString()
    ],
    logs: [
      "No logs available."
    ]
  };

  visibleCommand.classList.add("quiet-console__typed--hint");

  function normalizeCommand(value) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function clearHint() {
    visibleCommand.classList.remove("quiet-console__typed--hint");
  }

  function appendLine(text, isPrompt) {
    var line = document.createElement("p");

    if (isPrompt) {
      var prompt = document.createElement("span");
      prompt.className = "quiet-console__prompt";
      prompt.textContent = promptText;
      line.appendChild(prompt);
      line.appendChild(document.createTextNode(text));
    } else {
      line.textContent = text;
    }

    output.appendChild(line);
  }

  function appendImage(src, alt) {
    var figure = document.createElement("figure");
    var image = document.createElement("img");

    figure.className = "quiet-console__media";
    image.src = src;
    image.alt = alt;
    image.width = 800;
    image.height = 450;
    image.loading = "lazy";
    figure.appendChild(image);
    output.appendChild(figure);
  }

  function scrollOutput() {
    output.scrollTop = output.scrollHeight;
  }

  function syncVisibleCommand() {
    visibleCommand.textContent = input.value;

    if (input.value) {
      clearHint();
    }
  }

  function focusInput() {
    window.setTimeout(function () {
      input.focus();
    }, 0);
  }

  function focusSummary() {
    if (!summary) {
      return;
    }

    window.setTimeout(function () {
      summary.focus();
    }, 0);
  }

  function setMaximized(isMaximized) {
    consoleDetails.classList.toggle("quiet-console--maximized", isMaximized);
    maximizeButton.setAttribute("aria-pressed", isMaximized ? "true" : "false");
    maximizeButton.setAttribute("aria-label", isMaximized ? "Restore terminal" : "Maximize terminal");
    maximizeButton.title = isMaximized ? "Restore terminal" : "Maximize terminal";
  }

  function setMinimized(isMinimized) {
    consoleDetails.classList.toggle("quiet-console--minimized", isMinimized);
  }

  function clearMinimizing() {
    window.clearTimeout(minimizeTimer);
    consoleDetails.classList.remove("quiet-console--minimizing");
  }

  function closeConsole() {
    clearMinimizing();
    setMinimized(false);
    setMaximized(false);
    consoleDetails.open = false;
    focusSummary();
  }

  function finishMinimize() {
    setMaximized(false);
    consoleDetails.classList.remove("quiet-console--minimizing");
    setMinimized(true);
    consoleDetails.open = false;
    focusSummary();
  }

  function minimizeConsole() {
    if (reduceMotion.matches) {
      finishMinimize();
      return;
    }

    window.clearTimeout(minimizeTimer);
    consoleDetails.classList.add("quiet-console--minimizing");
    minimizeTimer = window.setTimeout(finishMinimize, 190);
  }

  input.addEventListener("input", syncVisibleCommand);

  consoleDetails.addEventListener("toggle", function () {
    if (consoleDetails.open) {
      setMinimized(false);
      focusInput();
    } else {
      clearMinimizing();
      setMaximized(false);
    }
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest(".quiet-console__control")) {
      return;
    }

    focusInput();
  });

  closeButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    closeConsole();
  });

  minimizeButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    minimizeConsole();
  });

  maximizeButton.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    setMaximized(!consoleDetails.classList.contains("quiet-console--maximized"));

    if (event.detail > 0) {
      focusInput();
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearHint();

    var command = normalizeCommand(input.value);
    if (!command) {
      input.value = "";
      syncVisibleCommand();
      appendLine("", true);
      scrollOutput();
      return;
    }

    input.value = "";
    syncVisibleCommand();

    if (command === "clear") {
      output.innerHTML = "";
      appendLine("ls", true);
      commands.ls.forEach(function (line) {
        appendLine(line, false);
      });
      scrollOutput();
      return;
    }

    appendLine(command, true);

    if (command === "cat" || command === "cat cat.jpg") {
      appendImage(catImage, "A tabby cat resting in a sunbeam indoors.");
      scrollOutput();
      return;
    }

    if (commands[command]) {
      commands[command].forEach(function (line) {
        appendLine(line, false);
      });
    } else {
      appendLine("command not found: " + command, false);
      appendLine("try: help", false);
    }

    scrollOutput();
  });
})();
