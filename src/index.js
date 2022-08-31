import "./static/stylesheets/app.scss";

const urlParams = new URLSearchParams(window.location.search);

// Player
if(urlParams.has("p")) {
  switch (urlParams.get("mt")) {
    case "g":
      import("./Gallery");
      break;

    default:
      import("./Embed.js")
        .then(({Initialize}) =>
          Initialize({target: document.getElementById("app"), setPageTitle: true})
        );
  }
// Collection
} else {
  import("./Form.js");
}
