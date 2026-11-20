/* Rechtstexte: als Webseite oder eingebettet in der App.

   1. Plattform (?platform=ios|android): In der App erscheinen nur die
      Angaben zum Store des eigenen Geraets. Apple untersagt in der App
      Namen anderer Mobilplattformen (Richtlinie 2.3.10), Google sieht das
      sinngemaess genauso. Als Webseite (ohne Angabe) stehen beide Stores
      da – sie gilt fuer beide Eintraege. Die Umschaltung selbst steckt
      in recht.css (data-p), hier wird nur die Klasse gesetzt.
   2. Im Rahmen (iframe) der App:
      - Kopf- und Fusszeile ausblenden, die App hat eigene Navigation
      - Verweise nach aussen (https, mailto) an die App weiterreichen; in
        der App-WebView taete ein Verweis aus einem Rahmen sonst nichts
      - Hoehe melden, damit nur die App-Seite scrollt
      - Design der App uebernehmen (?theme=dark|light) */
(function () {
  var root = document.documentElement;
  var q = window.location.search;
  var p = /[?&]platform=(ios|android)\b/.exec(q);
  if (p) root.className += " p-" + p[1];

  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (!framed) return;
  root.className += " embedded";
  var m = /[?&]theme=(dark|light)\b/.exec(q);
  if (m) root.className += " theme-" + m[1];

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^(https?:|mailto:)/i.test(href)) {
      e.preventDefault();
      try { window.parent.postMessage({ gg: "open", url: href }, "*"); } catch (err) {}
    }
  });

  /* Hoehe des Inhalts, nicht des Rahmens – sonst kann der Rahmen nach
     dem Drehen des Geraets nicht mehr schrumpfen. */
  function report() {
    try {
      var h = Math.ceil(document.body.getBoundingClientRect().height);
      window.parent.postMessage({ gg: "height", h: h }, "*");
    } catch (err) {}
  }
  window.addEventListener("load", report);
  window.addEventListener("resize", report);
  setTimeout(report, 300);
})();
