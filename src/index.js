import "./static/stylesheets/app.scss";

if(new URLSearchParams(window.location.search).has("p")) {
  import("./Video.js");
} else {
  import("./Form.js");
}
