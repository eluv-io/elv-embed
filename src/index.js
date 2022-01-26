import "./static/stylesheets/app.scss";

// Player
if(new URLSearchParams(window.location.search).has("p")) {
  import("./Embed.js")
    .then(({Initialize}) =>
      Initialize({target: document.getElementById("app"), setPageTitle: true})
    );
// Collection
} else {
  import("./Form.js");
}
