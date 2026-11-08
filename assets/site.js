/* Kubernetes Simplified — shared navigation, theme, quiz wiring.
   Each lesson page sets <body data-page="NN">. */
(function () {
  var PAGES = [
    { n: 1, slug: "01-intro-to-kubernetes", cat: "Foundations", title: "Introduction to Kubernetes", desc: "What Kubernetes is, why containers alone aren't enough, and what problems it solves." },
    { n: 2, slug: "02-architecture", cat: "Foundations", title: "Kubernetes Architecture", desc: "Control plane and worker nodes: API server, etcd, scheduler, kubelet, kube-proxy." },
    { n: 3, slug: "03-managing-clusters-kops", cat: "Operations", title: "Managing Many Clusters (kOps)", desc: "How teams create, upgrade and delete clusters at scale in production." },
    { n: 4, slug: "04-pods", cat: "Workloads", title: "Pods: Deploy Your First App", desc: "The smallest unit in Kubernetes, YAML manifests and your first kubectl commands." },
    { n: 5, slug: "05-deployments-replicasets", cat: "Workloads", title: "Deployments & ReplicaSets", desc: "Keep the right number of Pods running and roll out updates safely." },
    { n: 6, slug: "06-services-intro", cat: "Networking", title: "Services: Discovery & Load Balancing", desc: "How Pods find each other even though their IPs keep changing." },
    { n: 7, slug: "07-interview-part-1", cat: "Interview", title: "Interview Questions, Part 1", desc: "Core Kubernetes questions — what to say and why." },
    { n: 8, slug: "08-services-deep-dive", cat: "Networking", title: "Services Deep Dive: Hands-On", desc: "ClusterIP, NodePort and LoadBalancer in a live demo." },
    { n: 9, slug: "09-ingress-tls", cat: "Networking", title: "Ingress, TLS & Controllers", desc: "Route HTTP(S) traffic by host and path, with certificates." },
    { n: 10, slug: "10-ingress-demo", cat: "Networking", title: "Ingress: Live Demo", desc: "Set up an ingress controller and rules step by step." },
    { n: 11, slug: "11-rbac", cat: "Security", title: "RBAC: Who Can Do What", desc: "Roles, bindings and service accounts for controlling access to the cluster." },
    { n: 12, slug: "12-crds-custom-controllers", cat: "Extending", title: "Custom Resources & Controllers", desc: "Teach Kubernetes new object types and automate them with a controller." },
    { n: 13, slug: "13-configmaps-secrets-project", cat: "Projects", title: "Project: ConfigMaps & Secrets", desc: "Feed configuration and passwords to a real app without baking them into images." },
    { n: 14, slug: "14-monitoring-prometheus-grafana", cat: "Monitoring", title: "Monitoring: Prometheus & Grafana", desc: "Collect metrics from the cluster and turn them into dashboards and alerts." },
    { n: 15, slug: "15-production-challenges", cat: "Operations", title: "Real Production Challenges", desc: "Three scenarios that DevOps engineers hit on live clusters." },
    { n: 16, slug: "16-cluster-upgrade", cat: "Operations", title: "Upgrading a Cluster in Production", desc: "A safe, step-by-step upgrade procedure." },
    { n: 17, slug: "17-eks-end-to-end", cat: "Projects", title: "Project: End-to-End App on EKS", desc: "Install EKS, deploy an app and expose it with an ingress on AWS." },
    { n: 18, slug: "18-deployment-strategies", cat: "Workloads", title: "Deployment Strategies", desc: "Rolling, blue/green and canary releases with demos." },
    { n: 19, slug: "19-imagepullbackoff", cat: "Troubleshooting", title: "Troubleshooting: ImagePullBackOff", desc: "Why an image can't be pulled and how to fix it." },
    { n: 20, slug: "20-crashloopbackoff", cat: "Troubleshooting", title: "Troubleshooting: CrashLoopBackOff", desc: "Why containers keep restarting and how to debug them." },
    { n: 21, slug: "21-scheduling", cat: "Workloads", title: "Scheduling: Selectors, Affinity & Taints", desc: "Control which node a Pod lands on." },
    { n: 22, slug: "22-statefulset-pv", cat: "Storage", title: "StatefulSets & Persistent Volumes", desc: "Run stateful apps and debug storage problems." },
    { n: 23, slug: "23-securing-kubernetes", cat: "Security", title: "Securing Kubernetes Like a Pro", desc: "The DevSecOps checklist: API server, RBAC, images, network and more." },
    { n: 24, slug: "24-port-forwarding", cat: "Troubleshooting", title: "kubectl Port-Forwarding", desc: "Reach a Pod or Service from your laptop and fix the common issues." },
    { n: 25, slug: "25-kustomize", cat: "Tooling", title: "Kustomize", desc: "Customize YAML per environment without copying files." },
    { n: 26, slug: "26-kind", cat: "Tooling", title: "Kubernetes in Docker (kind)", desc: "Run a local multi-node cluster inside Docker." },
    { n: 27, slug: "27-helm", cat: "Tooling", title: "Helm: The Package Manager", desc: "Charts, values, releases — install apps with one command." },
    { n: 28, slug: "28-vm-to-kubernetes", cat: "Projects", title: "Project: Moving Apps from VMs to Kubernetes", desc: "Onboard a Docker Compose microservice app to Kubernetes." },
    { n: 29, slug: "29-headless-service", cat: "Networking", title: "Headless Services", desc: "Services without a cluster IP — and when you need them." },
    { n: 30, slug: "30-gateway-api", cat: "Networking", title: "Gateway API", desc: "The modern successor to Ingress." }
  ];
  window.K8S_PAGES = PAGES;

  var VISITED_KEY = "k8ss-visited";
  function getVisited() { try { return JSON.parse(localStorage.getItem(VISITED_KEY) || "[]"); } catch (e) { return []; } }
  function markVisited(n) { try { var v = getVisited(); if (v.indexOf(n) < 0) { v.push(n); localStorage.setItem(VISITED_KEY, JSON.stringify(v)); } } catch (e) {} }
  window.K8S_VISITED = getVisited;

  /* theme */
  var THEME_KEY = "k8ss-theme";
  function applyTheme(t) { if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme"); }
  try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (e) {}
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function toggleTheme() {
    var next = isDark() ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    var b = document.getElementById("theme-btn"); if (b) b.textContent = isDark() ? "☀ Light" : "☾ Dark";
  }

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function topbar(base, crumb, pct) {
    return el(
      '<header class="topbar"><div class="topbar-inner">' +
        '<a class="brand" href="' + base + 'index.html"><span class="brand-mark">K8s</span><span>Simplified</span></a>' +
        '<div class="crumb">' + crumb + '</div>' +
        '<a class="tb-link" href="' + base + 'index.html">☰ All lessons</a>' +
        '<button id="theme-btn" type="button">' + (isDark() ? "☀ Light" : "☾ Dark") + '</button>' +
      '</div><div class="progress-bar"><span style="width:' + pct + '%"></span></div></header>'
    );
  }
  function footer() {
    return el(
      '<footer class="site-footer">' +
        '<p><span class="ai-note">🤖 This content is AI-generated</span></p>' +
        '<p>Lessons were written by AI from transcripts of a 30-video YouTube Kubernetes series. They may contain mistakes — always check the official Kubernetes documentation before using anything in production.</p>' +
      '</footer>'
    );
  }

  function wireQuizzes(root) {
    /* <div class="quiz" data-answer="1"><div class="q">…</div><div class="opts"><button>…</button>…</div><div class="explain">…</div></div>
       data-answer is the 0-based index of the right button. */
    Array.prototype.forEach.call(root.querySelectorAll(".quiz"), function (qz) {
      var ans = parseInt(qz.getAttribute("data-answer"), 10);
      var btns = qz.querySelectorAll(".opts button");
      Array.prototype.forEach.call(btns, function (b, i) {
        b.type = "button";
        b.addEventListener("click", function () {
          Array.prototype.forEach.call(btns, function (x, j) { x.disabled = true; if (j === ans) x.classList.add("right"); });
          if (i !== ans) b.classList.add("wrong");
          qz.classList.add("done");
        });
      });
    });
  }

  function initLesson(n) {
    var i = n - 1, p = PAGES[i];
    if (!p) return;
    markVisited(n);
    var prev = PAGES[i - 1], next = PAGES[i + 1];
    document.title = p.title + " · Kubernetes Simplified";
    var pct = Math.round((n / PAGES.length) * 100);
    document.body.insertBefore(topbar("../", 'Lesson <b>' + n + '</b> of ' + PAGES.length + ' · ' + esc(p.title), pct), document.body.firstChild);

    var main = document.querySelector("main.wrap");
    var head = main && main.querySelector(".page-head");
    if (head && !head.querySelector(".page-kicker")) {
      head.insertBefore(el('<div class="page-kicker">Lesson ' + n + ' <span class="chip">' + esc(p.cat) + '</span></div>'), head.firstChild);
    }
    var pager = el('<nav class="pager" aria-label="Lesson navigation"></nav>');
    if (prev) pager.appendChild(el('<a class="prev" href="' + prev.slug + '.html" rel="prev"><small>← Previous</small><span>' + esc(prev.title) + '</span></a>'));
    if (next) pager.appendChild(el('<a class="next" href="' + next.slug + '.html" rel="next"><small>Next →</small><span>' + esc(next.title) + '</span></a>'));
    else pager.appendChild(el('<a class="next" href="../index.html"><small>Finished! →</small><span>Back to all lessons</span></a>'));
    (main || document.body).appendChild(pager);
    document.body.appendChild(footer());

    document.addEventListener("keydown", function (e) {
      var t = e.target && e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft" && prev) location.href = prev.slug + ".html";
      if (e.key === "ArrowRight") location.href = next ? next.slug + ".html" : "../index.html";
    });
  }

  function initIndex() {
    document.body.insertBefore(topbar("", "30 lessons · from zero to production", 0), document.body.firstChild);
    document.body.appendChild(footer());
    var visited = getVisited();
    var list = document.getElementById("lessons");
    var search = document.getElementById("search");
    var filters = document.getElementById("filters");
    var cats = [];
    PAGES.forEach(function (p) { if (cats.indexOf(p.cat) < 0) cats.push(p.cat); });
    var active = "All";
    ["All"].concat(cats).forEach(function (c) {
      var b = el('<button type="button">' + esc(c) + '</button>');
      if (c === active) b.classList.add("on");
      b.addEventListener("click", function () {
        active = c;
        Array.prototype.forEach.call(filters.children, function (x) { x.classList.toggle("on", x === b); });
        render();
      });
      filters.appendChild(b);
    });
    var vc = document.getElementById("visited-count");
    if (vc) vc.textContent = visited.length;

    var GROUPS = [
      { name: "Part 1 · Foundations & Core Workloads", from: 1, to: 7 },
      { name: "Part 2 · Services, Ingress & Access Control", from: 8, to: 12 },
      { name: "Part 3 · Real-World Projects & Operations", from: 13, to: 17 },
      { name: "Part 4 · Releases, Troubleshooting & Scheduling", from: 18, to: 24 },
      { name: "Part 5 · Tooling & Migration", from: 25, to: 28 },
      { name: "Part 6 · Advanced Networking", from: 29, to: 30 }
    ];
    function render() {
      var q = (search.value || "").toLowerCase().trim();
      list.innerHTML = "";
      var shown = 0;
      GROUPS.forEach(function (g) {
        var items = PAGES.filter(function (p) {
          if (p.n < g.from || p.n > g.to) return false;
          if (active !== "All" && p.cat !== active) return false;
          if (q && (p.title + " " + p.desc + " " + p.cat).toLowerCase().indexOf(q) < 0) return false;
          return true;
        });
        if (!items.length) return;
        list.appendChild(el('<h2 class="section-title">' + esc(g.name) + '</h2>'));
        var grid = el('<div class="lesson-grid"></div>');
        items.forEach(function (p) {
          shown++;
          grid.appendChild(el(
            '<a class="lesson' + (visited.indexOf(p.n) >= 0 ? ' visited' : '') + '" href="pages/' + p.slug + '.html">' +
              '<span class="num">' + p.n + '</span>' +
              '<span><h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p></span>' +
            '</a>'
          ));
        });
        list.appendChild(grid);
      });
      if (!shown) list.appendChild(el('<p class="empty">No lessons match that search.</p>'));
    }
    search.addEventListener("input", render);
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var n = parseInt(document.body.getAttribute("data-page"), 10);
    if (n) initLesson(n); else if (document.body.hasAttribute("data-index")) initIndex();
    wireQuizzes(document);
    document.addEventListener("click", function (e) { if (e.target && e.target.id === "theme-btn") toggleTheme(); });
  });
})();
