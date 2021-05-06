import "./static/stylesheets/app.scss";

// Player
if(new URLSearchParams(window.location.search).has("p")) {
  import("./Video.js");
// Collection
} else if(new URLSearchParams(window.location.search).has("c")) {
  import("./Collection.js");
} else {
  import("./Form.js");
}
