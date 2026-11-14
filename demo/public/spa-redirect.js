/* GitHub Pages SPA redirect: 404.html sends an unknown path here as ?/path; restore it.
 * Harmless where the server falls back to index.html itself (no ?/ in the URL). */
(function(l) {
  if (l.search[1] === '/') {
    var decoded = l.search.slice(1).split('&').map(function(s) {
      return s.replace(/~and~/g, '&')
    }).join('?');
    window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash);
  }
}(window.location))
    
