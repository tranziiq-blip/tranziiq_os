// On-screen debug console for troubleshooting on a tablet: only loads when
// the address contains ?debug=1
if (new URLSearchParams(location.search).has("debug")) {
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/eruda@3/eruda.min.js";
  s.onload = function () { eruda.init(); };
  document.head.appendChild(s);
}
