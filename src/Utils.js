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

export const LoadParams = (url) => {
  const conversion = {
    net: "network",
    oid: "objectId",
    vid: "versionHash",
    ln: "linkPath",
    dr: "directLink",
    ap: "autoplay",
    scr: "scrollPlayPause",
    m: "muted",
    ct: "controls",
    lp: "loop",
    ttl: "title",
    dsc: "description",
    sm: "smallPlayer",
    i: "imageOnly",
    sh: "showShare",
    st: "showTitle",
    dk: "darkMode",

    w: "width",
    h: "height",
    cap: "capLevelToPlayerSize",

    ath: "authorizationToken",
    ten: "tenantId",
    ntp: "ntpId",
    ptk: "promptTicket",
    tk: "ticketCode",
    sbj: "ticketSubject",
    data: "data",

    // Watermark defaults true except for NFTs
    wm: "watermark",
    nwm: "watermark"
  };

  const networks = {
    main: EluvioPlayerParameters.networks.MAIN,
    demo: EluvioPlayerParameters.networks.DEMO,
    test: EluvioPlayerParameters.networks.TEST
  };

  const urlParams = new URLSearchParams(
    new URL(url || window.location.toString()).search
  );

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

      case "wm":
      case "ap":
      case "scr":
      case "m":
      case "lp":
      case "ptk":
      case "sm":
      case "sh":
      case "st":
      case "dk":
      case "dr":
      case "i":
      case "cap":
        params[conversion[key]] = true;
        break;

      case "nwm":
        params.watermark = false;
        break;

      case "node":
        params.node = value;
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

  return {
    title,
    darkMode: params.darkMode,
    smallPlayer: params.smallPlayer,
    showTitle: params.showTitle,
    showShare: params.showShare,
    network: params.network,
    objectId: params.objectId,
    node: params.node,
    versionHash: params.versionHash,
    linkPath: params.linkPath,
    authorizationToken: params.authorizationToken,
    imageOnly: params.imageOnly,

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
          directLink: params.directLink,
          authorizationToken: params.authorizationToken
        }
      },
      playerOptions: {
        controls,
        autoplay: params.scrollPlayPause ? EluvioPlayerParameters.autoplay.WHEN_VISIBLE : params.autoplay,
        muted: params.muted,
        loop: params.loop,
        watermark: params.watermark,
        capLevelToPlayerSize: params.capLevelToPlayerSize
      },
    }
  };
};
