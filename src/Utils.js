import {EluvioPlayerParameters} from "@eluvio/elv-player-js";

const CreateMetaTags = (options={}) => {
  Object.keys(options).forEach(tag => {
    if(!options[tag]) { return; }

    const metaTag = document.createElement("meta");

    metaTag.setAttribute("property", tag);
    metaTag.setAttribute("content", options[tag]);

    document.head.appendChild(metaTag);
  });
};

export const LoadParams = () => {
  const conversion = {
    net: "network",
    oid: "objectId",
    vid: "versionHash",
    ln: "linkPath",
    ap: "autoplay",
    scr: "scrollPlayPause",
    m: "muted",
    ct: "controls",
    lp: "loop",
    ttl: "title",
    dsc: "description",
    sm: "smallPlayer",
    sh: "showShare",
    st: "showTitle",
    dk: "darkMode",

    w: "width",
    h: "height",

    ath: "authorizationToken",
    ten: "tenantId",
    ntp: "ntpId",
    ptk: "promptTicket",
    tk: "ticketCode",
    sbj: "ticketSubject",
    data: "data",

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
      case "ntp":
        params[conversion[key]] = value;
        break;

      case "w":
      case "h":
        params[conversion[key]] = parseInt(value);
        break;

      case "ln":
      case "ttl":
      case "dsc":
      case "tk":
      case "sbj":
      case "data":
        params[conversion[key]] = atob(value);
        break;

      case "nwm":
      case "ap":
      case "scr":
      case "m":
      case "lp":
      case "ptk":
      case "sm":
      case "sh":
      case "st":
      case "dk":
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

  let title;
  if(params.data) {
    try {
      title = JSON.parse(params.data).meta_tags["og:title"];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse 'data' parameter:");
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  document.title = title ? `${title} | Eluvio` : "Eluvio";

  return {
    title,
    darkMode: params.darkMode,
    smallPlayer: params.smallPlayer,
    showTitle: params.showTitle,
    showShare: params.showShare,
    network: params.network,
    objectId: params.objectId,
    versionHash: params.versionHash,
    linkPath: params.linkPath,
    authorizationToken: params.authorizationToken,

    tenantId: params.tenantId,
    ntpId: params.ntpId,
    ticketSubject: params.ticketSubject,
    promptTicket: params.promptTicket,

    width: params.width,
    height: params.height,

    playerParameters: {
      clientOptions: {
        network: params.network,
        promptTicket: params.promptTicket,
        tenantId: params.tenantId,
        ntpId: params.ntpId,
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
      },
    }
  };
};
