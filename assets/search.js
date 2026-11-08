/* Kubernetes Simplified — full-text search over all lessons.
   site.js puts the search box in the top bar and loads this file.
   The index (search-index.js) loads only when the user starts a search. */
(function () {
  var MAX_RESULTS = 12;
  var SNIPPET_RADIUS = 70;
  var DEBOUNCE_MS = 80;

  var script = document.currentScript;
  var BASE = (script && script.getAttribute("data-base")) || "";
  var PAGES = window.K8S_PAGES || [];

  var input, box, panel;
  var docs = null;
  var loading = null;
  var results = [];
  var active = -1;
  var timer = null;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function reEsc(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function terms(q) {
    var out = [];
    q.toLowerCase()
      .split(/\s+/)
      .forEach(function (t) {
        t = t.replace(/^[^\w]+|[^\w]+$/g, "");
        if (t && out.indexOf(t) < 0) out.push(t);
      });
    return out;
  }

  function count(hay, needle) {
    var n = 0,
      i = hay.indexOf(needle);
    while (i >= 0 && n < 50) {
      n++;
      i = hay.indexOf(needle, i + needle.length);
    }
    return n;
  }

  /* ---------- index ---------- */
  function loadIndex() {
    if (docs) return Promise.resolve(docs);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = BASE + "assets/search-index.js";
      s.onload = function () {
        if (!window.K8S_SEARCH_INDEX) {
          reject(new Error("empty index"));
          return;
        }
        docs = window.K8S_SEARCH_INDEX.map(prepare);
        resolve(docs);
      };
      s.onerror = function () {
        reject(new Error("index not found"));
      };
      document.head.appendChild(s);
    });
    // Let the user try again after a failure.
    loading.catch(function () {
      loading = null;
    });
    return loading;
  }

  function prepare(p) {
    var meta = PAGES[p.n - 1] || {};
    return {
      n: p.n,
      slug: p.slug,
      title: p.title,
      cat: meta.cat || "",
      lead: p.lead,
      titleL: p.title.toLowerCase(),
      leadL: (p.lead || "").toLowerCase(),
      sections: p.sections.map(function (s) {
        return {
          h: s.h,
          id: s.id,
          t: s.t,
          hL: s.h.toLowerCase(),
          tL: s.t.toLowerCase(),
        };
      }),
    };
  }

  /* ---------- ranking ---------- */
  function wordStart(hay, t) {
    return new RegExp("(^|[^a-z0-9])" + reEsc(t)).test(hay);
  }

  function search(q) {
    var ts = terms(q);
    if (!ts.length) return [];
    var phrase = ts.length > 1 ? ts.join(" ") : null;
    var out = [];

    docs.forEach(function (d) {
      var score = 0;
      var best = null,
        bestScore = 0;

      // Every term must match somewhere in the lesson.
      for (var k = 0; k < ts.length; k++) {
        var t = ts[k],
          found = false;
        if (d.titleL.indexOf(t) >= 0) {
          score += wordStart(d.titleL, t) ? 16 : 10;
          found = true;
        }
        if (d.leadL.indexOf(t) >= 0) {
          score += 4;
          found = true;
        }
        for (var j = 0; j < d.sections.length; j++) {
          var s = d.sections[j];
          if (s.hL.indexOf(t) >= 0) {
            score += 6;
            found = true;
          }
          var c = count(s.tL, t);
          if (c) {
            score += Math.min(c, 6);
            found = true;
          }
        }
        if (!found) return;
      }

      // The section with the most hits is the link target and the snippet source.
      d.sections.forEach(function (s) {
        var sc = 0;
        ts.forEach(function (t) {
          if (s.hL.indexOf(t) >= 0) sc += 8;
          sc += Math.min(count(s.tL, t), 10);
        });
        if (phrase && (s.tL.indexOf(phrase) >= 0 || s.hL.indexOf(phrase) >= 0))
          sc += 15;
        if (sc > bestScore) {
          bestScore = sc;
          best = s;
        }
      });

      if (phrase) {
        if (d.titleL.indexOf(phrase) >= 0) score += 20;
        if (best && best.tL.indexOf(phrase) >= 0) score += 8;
      }
      out.push({ d: d, s: best, score: score });
    });

    out.sort(function (a, b) {
      return b.score - a.score || a.d.n - b.d.n;
    });
    return out.slice(0, MAX_RESULTS);
  }

  function highlight(text, ts) {
    if (!ts.length) return esc(text);
    var re = new RegExp(
      "(" +
        ts
          .slice()
          .sort(function (a, b) {
            return b.length - a.length;
          })
          .map(reEsc)
          .join("|") +
        ")",
      "gi",
    );
    var html = "",
      last = 0,
      m;
    while ((m = re.exec(text))) {
      html += esc(text.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>";
      last = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    return html + esc(text.slice(last));
  }

  function snippet(r, ts) {
    var src = r.s && r.s.t ? r.s : null;
    var text = src ? src.t : r.d.lead || "";
    var low = text.toLowerCase();
    var pos = -1;
    for (var i = 0; i < ts.length && pos < 0; i++) pos = low.indexOf(ts[i]);
    if (pos < 0) pos = 0;
    var start = Math.max(0, pos - SNIPPET_RADIUS);
    var end = Math.min(text.length, pos + SNIPPET_RADIUS * 2);
    if (start > 0) {
      var sp = text.indexOf(" ", start);
      if (sp > 0 && sp < pos) start = sp + 1;
    }
    if (end < text.length) {
      var ep = text.lastIndexOf(" ", end);
      if (ep > pos) end = ep;
    }
    return (
      (start > 0 ? "… " : "") +
      highlight(text.slice(start, end), ts) +
      (end < text.length ? " …" : "")
    );
  }

  function hrefFor(r, q) {
    var inPages = /\/pages\/[^/]*$/.test(location.pathname);
    var path = (inPages ? "" : "pages/") + r.d.slug + ".html";
    var hash = r.s && r.s.id ? "#" + r.s.id : "";
    return path + "?hl=" + encodeURIComponent(q) + hash;
  }

  /* ---------- UI ---------- */
  function render(q) {
    var ts = terms(q);
    if (!ts.length) {
      close();
      return;
    }
    if (!results.length) {
      panel.innerHTML =
        '<div class="sr-empty">No lessons match <b>' + esc(q) + "</b>.</div>";
    } else {
      panel.innerHTML =
        results
          .map(function (r, i) {
            var sec =
              r.s && r.s.h
                ? '<span class="sr-sec">› ' + highlight(r.s.h, ts) + "</span>"
                : "";
            return (
              '<a class="sr-item" role="option" id="sr-' +
              i +
              '" href="' +
              esc(hrefFor(r, q)) +
              '">' +
              '<span class="sr-meta">Lesson ' +
              r.d.n +
              (r.d.cat ? " · " + esc(r.d.cat) : "") +
              "</span>" +
              '<span class="sr-title">' +
              highlight(r.d.title, ts) +
              sec +
              "</span>" +
              '<span class="sr-snip">' +
              snippet(r, ts) +
              "</span></a>"
            );
          })
          .join("") +
        '<div class="sr-foot">' +
        results.length +
        (results.length === MAX_RESULTS ? "+" : "") +
        " result" +
        (results.length === 1 ? "" : "s") +
        " · ↑↓ to move · Enter to open · Esc to close</div>";
    }
    active = results.length ? 0 : -1;
    paintActive();
    open();
  }

  function message(text) {
    panel.innerHTML = '<div class="sr-empty">' + esc(text) + "</div>";
    open();
  }

  function open() {
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  function close() {
    panel.hidden = true;
    input.setAttribute("aria-expanded", "false");
    active = -1;
  }

  function paintActive() {
    var items = panel.querySelectorAll(".sr-item");
    Array.prototype.forEach.call(items, function (a, i) {
      a.classList.toggle("on", i === active);
    });
    if (active >= 0 && items[active]) {
      items[active].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", "sr-" + active);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function run() {
    var q = input.value.trim();
    if (!q) {
      close();
      return;
    }
    if (!docs) message("Loading search index…");
    loadIndex().then(
      function () {
        if (input.value.trim() !== q) return;
        results = search(q);
        render(q);
      },
      function () {
        message("Search is not available. The search index did not load.");
      },
    );
  }

  function onKey(e) {
    var items = panel.querySelectorAll(".sr-item");
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      active = (active + 1) % items.length;
      paintActive();
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      active = (active - 1 + items.length) % items.length;
      paintActive();
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      e.preventDefault();
      location.href = items[active].href;
    } else if (e.key === "Escape") {
      if (panel.hidden) input.blur();
      close();
    }
  }

  function init() {
    box = document.querySelector(".tb-search");
    if (!box) return;
    input = box.querySelector("input");
    panel = box.querySelector(".sr-panel");

    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(run, DEBOUNCE_MS);
    });
    input.addEventListener("focus", function () {
      loadIndex().catch(function () {});
      if (input.value.trim()) run();
    });
    input.addEventListener("keydown", onKey);
    panel.addEventListener("mousemove", function (e) {
      var a = e.target.closest && e.target.closest(".sr-item");
      if (!a) return;
      var i = Array.prototype.indexOf.call(
        panel.querySelectorAll(".sr-item"),
        a,
      );
      if (i !== active) {
        active = i;
        paintActive();
      }
    });
    document.addEventListener("mousedown", function (e) {
      if (!box.contains(e.target)) close();
    });
    document.addEventListener("keydown", function (e) {
      var tag = e.target && e.target.tagName;
      var typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target && e.target.isContentEditable);
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") ||
        (e.key === "/" && !typing)
      ) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  /* ---------- on a lesson: mark the hits that the user searched for ---------- */
  function markHits() {
    var main = document.querySelector("main.wrap");
    if (!main) return;
    var q = null;
    try {
      q = new URLSearchParams(location.search).get("hl");
    } catch (e) {}
    var ts = q
      ? terms(q).filter(function (t) {
          return t.length > 1;
        })
      : [];
    var target = location.hash
      ? document.getElementById(location.hash.slice(1))
      : null;

    if (ts.length) {
      var re = new RegExp(
        ts
          .sort(function (a, b) {
            return b.length - a.length;
          })
          .map(reEsc)
          .join("|"),
        "gi",
      );
      var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentNode;
          if (
            !n.nodeValue.trim() ||
            p.closest("script,style,svg,button,select,textarea,.pager,mark")
          )
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (n) {
        var text = n.nodeValue,
          last = 0,
          m,
          frag = null;
        re.lastIndex = 0;
        while ((m = re.exec(text))) {
          frag = frag || document.createDocumentFragment();
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          var mk = document.createElement("mark");
          mk.className = "search-hit";
          mk.textContent = m[0];
          frag.appendChild(mk);
          last = m.index + m[0].length;
        }
        if (frag) {
          frag.appendChild(document.createTextNode(text.slice(last)));
          n.parentNode.replaceChild(frag, n);
        }
      });
    }

    // The h2 ids are set by script, so the browser cannot jump to the hash by itself.
    var hits = main.querySelectorAll("mark.search-hit");
    var first = null;
    for (var i = 0; i < hits.length && !first; i++) {
      if (
        !target ||
        target.compareDocumentPosition(hits[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      )
        first = hits[i];
    }
    var to = first || target;
    if (to) to.scrollIntoView({ block: first ? "center" : "start" });
  }

  init();
  markHits();
})();
