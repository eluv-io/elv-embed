import "./static/stylesheets/video.scss";
import EluvioPlayer, {EluvioPlayerParameters} from "elv-player-js/src";

const LoadParams = () => {
  const conversion = {
    net: "networks",
    oid: "objectId",
    vid: "versionHash",
    ln: "linkPath",
    ap: "autoPlay",
    scr: "scrollPlayPause",
    m: "muted",
    ct: "controls"
  };

  const networks = {
    main: EluvioPlayerParameters.networks.main,
    demo: EluvioPlayerParameters.networks.demo,
    test: EluvioPlayerParameters.networks.test
  };

  const urlParams = new URLSearchParams(window.location.search);

  let params = {};
  for(const key of urlParams.keys()) {
    const value = urlParams.get(key).toString();

    switch (key) {
      case "net":
        params[conversion[key]] = networks[value.toLowerCase()];
        break;

      case "oid":
      case "vid":
        params[conversion[key]] = value;
        break;

      case "ln":
        params[conversion[key]] = atob(value);
        break;

      case "ap":
      case "scr":
      case "m":
      case "ct":
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
        linkPath: params.linkPath
      }
    },
    playerOptions: {
      autoplay: params.scrollPlayPause ? EluvioPlayerParameters.autoplay.WHEN_VISIBLE : params.autoplay,
      muted: params.muted
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
