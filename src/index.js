import "./static/stylesheets/app.scss";

// Player
if(new URLSearchParams(window.location.search).has("p")) {
  import("./Video.js")
    .then(({Initialize}) =>
      Initialize({target: document.getElementById("app")})
    );
// Collection
} else {
  import("./Form.js");
}
