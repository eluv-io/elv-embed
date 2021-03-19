import "./static/stylesheets/video.scss";
import EluvioPlayer, {EluvioPlayerParameters} from "@eluvio/elv-player-js";

const LoadParams = () => {
  const conversion = {
    net: "network",
    oid: "objectId",
    vid: "versionHash",
    ath: "authorizationToken",
    ln: "linkPath",
    ap: "autoPlay",
    scr: "scrollPlayPause",
    m: "muted",
    ct: "controls",
    lp: "loop",

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
        params[conversion[key]] = value;
        break;

      case "ln":
        params[conversion[key]] = atob(value);
        break;

      case "nwm":
      case "ap":
      case "scr":
      case "m":
      case "ct":
      case "lp":
        params[conversion[key]] = true;
        break;
    }
  }

  return {
    clientOptions: {
      network: params.network
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
      controls: params.controls ? EluvioPlayerParameters.controls.DEFAULT : EluvioPlayerParameters.controls.OFF,
      autoplay: params.scrollPlayPause ? EluvioPlayerParameters.autoplay.WHEN_VISIBLE : params.autoplay,
      muted: params.muted,
      loop: params.loop
    }
  };
};


const Initialize = async () => {
  new EluvioPlayer(
    document.getElementById("app"),
    LoadParams()
  );
};

Initialize();
