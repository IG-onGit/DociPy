const menu = document.querySelector("body>span");
const body = document.querySelector("body");
const header = document.querySelector("header");
const nav = document.querySelector("header>nav");
const ptags = document.querySelectorAll("header p");
const atags = document.querySelectorAll("header a");
const hint = document.querySelector("header>a>hint");
const nava = document.querySelectorAll("nav>a");
const code = document.querySelectorAll(".docipygroup>section pre>code");

function load() {
  var hash = window.location.hash.replaceAll("#", "");
  if (!hash) {
    return false;
  }

  let lists = document.querySelectorAll("header ul");
  if (lists) {
    lists.forEach((i) => {
      i.classList.add("hide");
    });
  }

  var items = hash.split("-");
  var build = [];
  var actives = document.querySelectorAll("header .active");
  actives.forEach((x) => {
    x.classList.remove("active");
  });

  var blocks = document.querySelectorAll(".docipygroup, .docipy-docipyblock");
  items.forEach((x) => {
    build.push(x);
    let item = build.join("-");
    let label = document.querySelector(`.${item}`);
    let list = document.querySelector(`.${item}-docipymenu`);
    let block = document.querySelector(`.${item}-docipyblock`);
    if (label) {
      label.classList.add("active");
    }
    if (list) {
      list.classList.remove("hide");
    }
    if (block) {
      if (blocks) {
        blocks.forEach((i) => {
          let detect = i.querySelector(`.${item}-docipyblock`);
          if (!detect) {
            i.classList.add("hide");
          }
        });
      }
      block.classList.remove("hide");
      let hashset = window.location.hash.replaceAll("#", "");
      let sections = block.parentElement.querySelector(
        `.${item}-docipyblock>section`
      );
      let find = block.querySelector(`.${hashset}-docipyblock`);
      let tagset = document.querySelector(`.${hashset}`);
      if (!sections && !find && tagset && tagset.tagName == "P") {
        let first = block.querySelector("section").id;
        if (first) {
          window.location.hash = first;
          if (body.style.overflowY == "hidden") {
            menu.click();
          }
        }
      }
    }
    if (label) {
      hint.textContent = label.textContent;
    } else {
      hint.textContent = "Home";
    }
  });
}

menu.addEventListener("click", function (event) {
  event.preventDefault();
  if (this.classList.contains("bi-list")) {
    body.style.overflowY = "hidden";
    header.style.height = "100%";
    nav.style.display = "flex";
    this.style.right = "18px";
    this.classList.remove("bi-list");
    this.classList.add("bi-x-lg");
  } else {
    body.style.overflowY = "auto";
    header.style.height = "auto";
    nav.style.display = "none";
    this.style.right = "10px";
    this.classList.remove("bi-x-lg");
    this.classList.add("bi-list");
  }
});

window.addEventListener("hashchange", function () {
  load();
});

load();

atags.forEach((link) => {
  link.addEventListener("click", function (event) {
    if (body.style.overflowY == "hidden") {
      menu.click();
    }
  });
});

nava.forEach((item) => {
  item.addEventListener("click", function (event) {
    event.preventDefault();
    let href = item.getAttribute("href").replaceAll("#", "");
    if (item.classList.contains("active")) {
      window.location.hash = "docipy";
    } else {
      window.location.hash = href;
    }
  });
});

ptags.forEach((link) => {
  link.addEventListener("click", function (event) {
    event.preventDefault();
    let item = event.target.closest("p");
    let href = item.getAttribute("ref");
    if (item.classList.contains("active")) {
      let uls = item.querySelectorAll("ul");
      if (uls) {
        uls.forEach((i) => {
          i.classList.add("hide");
        });
        let next = item.nextElementSibling;
        if (next.tagName == "UL") {
          next.classList.add("hide");
        }
        item.classList.remove("active");
        if (item.classList.contains("bi")) {
          window.location.hash = "docipy";
        }
        return true;
      }
    }
    if (href) {
      let next = item.nextElementSibling;
      if (next && next.tagName == "UL") {
        item.classList.add("active");
        next.classList.remove("hide");
      } else if (body.style.overflowY == "hidden") {
        menu.click();
      }
      window.location.hash = href;
    }
  });
});

code.forEach((x) => {
  x.insertAdjacentHTML(
    "beforebegin",
    '<copy class="bi bi-clipboard" onclick="docipycopycode(this);"></copy>'
  );
});

function docipycopycode(element) {
  var code = element.nextElementSibling;
  if (code.tagName != "CODE") {
    return false;
  }

  let range = document.createRange();
  range.selectNode(code);

  let selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand("copy");
  selection.removeAllRanges();
  element.classList.remove("bi-clipboard");
  element.classList.add("bi-clipboard-check");

  setTimeout(function () {
    element.classList.remove("bi-clipboard-check");
    element.classList.add("bi-clipboard");
  }, 2000);
}
