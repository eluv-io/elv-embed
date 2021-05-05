import "./static/stylesheets/video.scss";
import EluvioPlayer, {EluvioPlayerParameters} from "@eluvio/elv-player-js";

const CreateMetaTags = (options={}) => {
  Object.keys(options).forEach(tag => {
    if(!options[tag]) { return; }

    const metaTag = document.createElement("meta");

    metaTag.setAttribute("property", tag);
    metaTag.setAttribute("content", options[tag]);

    document.head.appendChild(metaTag);
  });
};

const LoadParams = () => {
  const conversion = {
    net: "network",
    oid: "objectId",
    vid: "versionHash",
    ln: "linkPath",
    ap: "autoPlay",
    scr: "scrollPlayPause",
    m: "muted",
    ct: "controls",
    lp: "loop",
    ttl: "title",
    dsc: "description",

    ath: "authorizationToken",
    ten: "tenantId",
    tk: "ticketCode",
    sbj: "ticketSubject",

    // Watermark defaults true
    nwm: "watermark"
  };

  const networks = {
    main: EluvioPlayerParameters.networks.MAIN,
    demo: EluvioPlayerParameters.networks.DEMO,
    test: EluvioPlayerParameters.networks.TEST
  };

  const urlParams = new URLSearchParams(window.location.search);

  let params = {
    watermark: true
  };

  for(const key of urlParams.keys()) {
    const value = urlParams.get(key).toString();

    switch (key) {
      case "net":
        params[conversion[key]] = networks[value.toLowerCase()];
        break;

      case "ath":
      case "oid":
      case "vid":
      case "ct":
      case "ten":
        params[conversion[key]] = value;
        break;

      case "ln":
      case "ttl":
      case "dsc":
      case "tk":
      case "sbj":
        params[conversion[key]] = atob(value);
        break;

      case "nwm":
      case "ap":
      case "scr":
      case "m":
      case "cth":
      case "lp":
        params[conversion[key]] = true;
        break;
    }
  }

  let controls;
  switch (params.controls) {
    case "d":
      controls = EluvioPlayerParameters.controls.DEFAULT;
      break;
    case "h":
      controls = EluvioPlayerParameters.controls.AUTO_HIDE;
      break;
    case "s":
      controls = EluvioPlayerParameters.controls.ON;
      break;
    default:
      controls = ("controls" in params) ? EluvioPlayerParameters.controls.DEFAULT : EluvioPlayerParameters.controls.OFF;
      break;
  }

  document.title = params.title ? `${params.title} | Eluvio` : "Eluvio";

  CreateMetaTags({
    "og:url": window.location.toString(),
    "og:locale": "en_US",
    "og:type": "video",
    "og:title": params.title ? `${params.title} | Eluvio` : "Eluvio",
    "og:description": params.description
  });

  return {
    clientOptions: {
      network: params.network,
      tenantId: params.tenantId,
      ticketCode: params.ticketCode,
      ticketSubject: params.ticketSubject
    },
    sourceOptions: {
      playoutParameters: {
        objectId: params.objectId,
        versionHash: params.versionHash,
        linkPath: params.linkPath,
        authorizationToken: params.authorizationToken
      }
    },
    playerOptions: {
      controls,
      autoplay: params.scrollPlayPause ? EluvioPlayerParameters.autoplay.WHEN_VISIBLE : params.autoplay,
      muted: params.muted,
      loop: params.loop,
      playerCallback: ({posterUrl}) => {
        if(posterUrl) {
          CreateMetaTags({"og:image": posterUrl});
          CreateMetaTags({"og:image:alt": params.title});
        }
      }
    }
  };
};


const robots = document.createElement("meta");
robots.setAttribute("name", "robots");
robots.setAttribute("content", "noindex");
document.head.appendChild(robots);

const Initialize = async () => {
  window.player = new EluvioPlayer(
    document.getElementById("app"),
    LoadParams()
  );
};

Initialize();
