import "./static/stylesheets/app.scss";
// TODO: remove
import "./Form";

const urlParams = new URLSearchParams(window.location.search);

// Player
if(urlParams.has("p")) {
  switch(urlParams.get("mt")) {
    case "g":
      import("./Gallery")
        .then(({Initialize}) =>
          Initialize({target: document.getElementById("app"), setPageTitle: true})
        );
      break;

    default:
      import("./Embed.js")
        .then(({Initialize}) =>
          Initialize({target: document.getElementById("app"), setPageTitle: true, embedApp: true})
        );
  }
} else {
  //Form()
}
