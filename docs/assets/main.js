(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- Syntax highlighter (dependency-free) ---------- */
  var STR = '"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'';
  var NUM = "\\b\\d+(?:\\.\\d+)*\\b";
  var RULES = {
    bash: [
      ["c", "#[^\\n]*"], ["s", STR], ["p", "\\$[A-Za-z_]\\w*"],
      ["f", "\\b(?:pip|docipy|cd|git|python|python3|npm|node|clight|curl|mkdir|ls)\\b"],
      ["o", "(?<![\\w-])-{1,2}[A-Za-z][\\w-]*"], ["n", NUM], ["x", "[|&;<>]+"]
    ],
    json: [
      ["p", '"(?:\\\\.|[^"\\\\\\n])*"(?=\\s*:)'], ["s", STR], ["n", "-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b"],
      ["k", "\\b(?:true|false|null)\\b"], ["x", "[{}\\[\\],:]"]
    ],
    js: [
      ["c", "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/"], ["s", STR + "|`(?:\\\\.|[^`\\\\])*`"],
      ["k", "\\b(?:const|let|var|function|return|if|else|for|while|new|class|import|from|export|async|await|try|catch|throw|true|false|null|undefined|this)\\b"],
      ["f", "\\b[A-Za-z_$][\\w$]*(?=\\()"], ["n", NUM], ["x", "[{}()\\[\\];,.:=<>!+\\-*\\/&|?]+"]
    ],
    py: [
      ["c", "#[^\\n]*"], ["s", '"""[\\s\\S]*?"""|' + STR],
      ["k", "\\b(?:def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|in|not|and|or|is|None|True|False|lambda|pass|yield)\\b"],
      ["t", "@\\w+"], ["f", "\\b[A-Za-z_]\\w*(?=\\()"], ["n", NUM], ["x", "[{}()\\[\\];,.:=<>!+\\-*\\/&|]+"]
    ],
    yaml: [
      ["c", "#[^\\n]*"], ["s", STR], ["p", "^[ \\t]*-?[ \\t]*[\\w.\\-\\/]+(?=:)"], ["k", "\\b(?:true|false|null|yes|no)\\b"],
      ["t", "[*&][\\w-]+"], ["n", NUM], ["x", "[:\\-\\[\\]{},|>]"]
    ],
    kotlin: [
      ["c", "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/"], ["s", STR],
      ["k", "\\b(?:fun|val|var|class|object|interface|return|if|else|when|for|while|import|package|override|private|public|null|true|false|is|in|as)\\b"],
      ["t", "@\\w+|\\b[A-Z]\\w*\\b"], ["f", "\\b[a-z_]\\w*(?=\\()"], ["n", NUM], ["x", "[{}()\\[\\];,.:=<>!+\\-*\\/&|?]+"]
    ],
    http: [
      ["c", "#[^\\n]*"], ["k", "\\b(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\\b"], ["t", "HTTP\\/\\d(?:\\.\\d)?"],
      ["p", "^[A-Za-z][\\w-]*(?=:)"], ["s", STR], ["f", "\\/[\\w\\-\\/.?=&%]*"], ["n", NUM], ["x", "[:{}\\[\\],]"]
    ],
    text: []
  };
  var ALIAS = { sh: "bash", shell: "bash", cmd: "bash", javascript: "js", python: "py", kt: "kotlin", yml: "yaml", txt: "text", plain: "text" };
  var CACHE = {};

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function compile(lang) {
    if (CACHE[lang]) return CACHE[lang];
    var rules = RULES[lang] || [];
    var src = rules.map(function (r) { return "(" + r[1] + ")"; }).join("|");
    CACHE[lang] = rules.length ? new RegExp(src, "gm") : null;
    return CACHE[lang];
  }

  function highlight(text, lang) {
    lang = (ALIAS[lang] || lang || "text").toLowerCase();
    var re = compile(lang);
    if (!re) return esc(text);
    var rules = RULES[lang], out = "", last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      if (m[0] === "") { re.lastIndex++; continue; }
      var cls = "";
      for (var i = 0; i < rules.length; i++) { if (m[i + 1] !== undefined) { cls = rules[i][0]; break; } }
      out += esc(text.slice(last, m.index)) + '<span class="tok-' + cls + '">' + esc(m[0]) + "</span>";
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:-100px;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function enhanceCode() {
    var blocks = document.querySelectorAll("pre > code[data-lang]");
    Array.prototype.forEach.call(blocks, function (code) {
      var pre = code.parentNode;
      var raw = code.textContent.replace(/^\n/, "").replace(/\s+$/, "");
      var lang = code.getAttribute("data-lang");
      var title = code.getAttribute("data-title") || lang;
      try { code.innerHTML = highlight(raw, lang); } catch (e) { code.textContent = raw; }
      pre.setAttribute("tabindex", "0");

      var wrap = document.createElement("div");
      wrap.className = "codeblock";
      var bar = document.createElement("div");
      bar.className = "cb-bar";
      bar.innerHTML = '<i></i><i></i><i></i><span class="cb-title"></span>' +
        '<button type="button" class="cb-copy" aria-label="Copy code"><svg class="icon" aria-hidden="true"><use href="#i-copy"/></svg><span>Copy</span></button>';
      bar.querySelector(".cb-title").textContent = title;
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(bar);
      wrap.appendChild(pre);

      var btn = bar.querySelector(".cb-copy"), timer;
      btn.addEventListener("click", function () {
        copyText(raw).then(function () {
          btn.classList.add("done");
          btn.querySelector("span").textContent = "Copied";
          btn.querySelector("use").setAttribute("href", "#i-check");
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.classList.remove("done");
            btn.querySelector("span").textContent = "Copy";
            btn.querySelector("use").setAttribute("href", "#i-copy");
          }, 1800);
        }, function () {});
      });
    });
  }

  /* ---------- Burger / full-screen menu ---------- */
  var root = document.documentElement;
  var burger, BREAK = 820;

  function setMenu(open) {
    if (!burger) return;
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    var use = burger.querySelector("use");
    if (use) use.setAttribute("href", open ? "#i-x" : "#i-menu");
  }
  function closeMenu() { setMenu(false); }
  window.DP_closeMenu = closeMenu;

  function initMenu() {
    burger = document.querySelector(".burger");
    if (!burger) return;
    var target = document.getElementById(burger.getAttribute("aria-controls"));
    if (target) target.classList.add("overlay");
    burger.addEventListener("click", function () { setMenu(!root.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    window.addEventListener("resize", function () { if (window.innerWidth > BREAK) closeMenu(); });
    if (target) target.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
  }

  /* ---------- Docs: one section at a time ---------- */
  function initDocs() {
    var sections = document.querySelectorAll(".doc-section");
    if (!sections.length) return;
    var links = document.querySelectorAll("[data-section]");
    var ids = Array.prototype.map.call(sections, function (s) { return s.id; });
    var siteName = (document.title.split(" | ").pop() || "").trim();

    function show(id, push) {
      if (ids.indexOf(id) === -1) id = ids[0];
      Array.prototype.forEach.call(sections, function (s) { s.classList.toggle("active", s.id === id); });
      Array.prototype.forEach.call(links, function (a) {
        if (a.getAttribute("data-section") === id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      var h1 = document.querySelector("#" + id + " h1");
      document.title = (h1 ? h1.textContent : id) + (siteName ? " | " + siteName : "");
      if (push) history.pushState({ id: id }, "", "#" + id);
      window.scrollTo(0, 0);
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-section], [data-goto]"), function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var id = a.getAttribute("data-section") || a.getAttribute("data-goto");
        show(id, true);
        closeMenu();
      });
    });
    window.addEventListener("popstate", function () { show(location.hash.slice(1), false); });
    show(location.hash.slice(1), false);
    setTimeout(function () { window.scrollTo(0, 0); }, 0);
  }

  document.addEventListener("DOMContentLoaded", function () {
    enhanceCode();
    initMenu();
    initDocs();
  });
})();
