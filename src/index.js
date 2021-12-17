import "./static/stylesheets/app.scss";

// Player
if(new URLSearchParams(window.location.search).has("p")) {
  import("./Video.js")
    .then(({Initialize}) =>
      Initialize({target: document.getElementById("app")})
    ).catch(error => {
      const urlParams = new URLSearchParams(
        new URL(window.location.toString()).search
      );
      const node = urlParams.get("node");

      if(error.status === 500 && node) {
        throw Error(`Unable to load specified node: ${node}`);
      }
    });
// Collection
} else {
  import("./Form.js");
}
