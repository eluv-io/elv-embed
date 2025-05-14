import "./static/stylesheets/app.scss";

const urlParams = new URLSearchParams(window.location.search);

// Player
if(urlParams.has("p")) {
  switch(urlParams.get("mt") || urlParams.get("type")) {
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
} else if(urlParams.has("d")) {
  import("./Download.js")
    .then(({Initialize}) =>
      Initialize({target: document.getElementById("app")})
    );
} else if(window.location.pathname.toLowerCase() === "/mediaprofile") {
  import("./MediaCapabilities.js");
} else {
  import("./Form.js");
}
