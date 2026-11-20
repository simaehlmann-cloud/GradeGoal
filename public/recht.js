/* Rechtstexte: eingebettet in der App oder eigenständig im Browser.

   Die App zeigt Impressum und Datenschutz in einem Rahmen (iframe) an,
   damit sie auch ohne Netz erreichbar sind. Im Rahmen gilt:
   - Kopf- und Fußzeile mit „Zur App“ ausblenden (sonst lädt die App
     sich selbst in den Rahmen)
   - Verweise nach außen (https, mailto) an die App weiterreichen; in der
     App-WebView täte ein Verweis aus einem Rahmen sonst nichts
   Eigenständig im Browser ändert sich nichts. */
(function () {
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (!framed) return;
  document.documentElement.className += " embedded";
  /* Design der App uebernehmen (?theme=dark|light), sonst folgt die
     Seite der Systemeinstellung und passt nicht zur gewaehlten Ansicht. */
  var m = /[?&]theme=(dark|light)/.exec(window.location.search);
  if (m) document.documentElement.className += " theme-" + m[1];
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^(https?:|mailto:)/i.test(href)) {
      e.preventDefault();
      try { window.parent.postMessage({ gg: "open", url: href }, "*"); } catch (err) {}
    }
  });
  /* Höhe melden: Die App passt den Rahmen an und scrollt selbst. Ein
     Rahmen mit eigenem Scrollbereich lässt sich auf älteren iPads nur
     zäh bedienen. */
  function report() {
    try {
      /* Höhe des Inhalts, nicht des Rahmens – sonst kann der Rahmen nach
         dem Drehen des Geräts nicht mehr schrumpfen. */
      var h = Math.ceil(document.body.getBoundingClientRect().height);
      window.parent.postMessage({ gg: "height", h: h }, "*");
    } catch (err) {}
  }
  window.addEventListener("load", report);
  window.addEventListener("resize", report);
  setTimeout(report, 300);
})();
