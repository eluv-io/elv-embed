import "./static/stylesheets/app.scss";

// Player
if(new URLSearchParams(window.location.search).has("p")) {
  import("./Video.js");
// Collection
} else {
  import("./Form.js");
}
