import {EluvioPlayerParameters} from "@eluvio/elv-player-js";
import {ElvWalletClient} from "@eluvio/elv-client-js";

const CreateMetaTags = (options={}) => {
  Object.keys(options).forEach(tag => {
    if(!options[tag]) { return; }

    const metaTag = document.createElement("meta");

    metaTag.setAttribute("property", tag);
    metaTag.setAttribute("content", options[tag]);

    document.head.appendChild(metaTag);
  });
};

export const mediaTypes = {
  "v": "Video",
  "lv": "Live Video",
  "a": "Audio",
  "i": "Image",
  "h": "HTML",
  "b": "EBook",
  "g": "Gallery",
  "l": "Link"
};

export const LowLatencyLiveHLSOptions = {
  "enableWorker": true,
  "lowLatencyMode": true,
  "maxBufferLength": 5,
  "backBufferLength": 5,
  "liveSyncDuration": 5,
  "liveMaxLatencyDuration": 15,
  "liveDurationInfinity": true,
  "highBufferWatchdogPeriod": 1
};

export const LoadParams = (url) => {
  const conversion = {
    mt: "mediaType",
    net: "network",
    oid: "objectId",
    vid: "versionHash",
    off: "offerings",
    ln: "linkPath",
    dr: "directLink",
    ap: "autoplay",
    scr: "scrollPlayPause",
    m: "muted",
    ct: "controls",
    lp: "loop",
    ptc: "protocols",
    ttl: "title",
    dsc: "description",
    sm: "smallPlayer",
    i: "imageOnly",
    sh: "showShare",
    st: "showTitle",
    ht: "hideTitle",
    prf: "playerProfile",

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

    start: "clipStart",
    end: "clipEnd",

    type: "mediaType",
    murl: "mediaUrl",
    vrk: "viewRecordKey",
    ek: "eventKey",

    // Watermark defaults true except for NFTs
    wm: "watermark",
    nwm: "watermark"
  };

  const networks = {
    main: EluvioPlayerParameters.networks.MAIN,
    demo: EluvioPlayerParameters.networks.DEMO,
    test: EluvioPlayerParameters.networks.TEST,
    testv4: EluvioPlayerParameters.networks.TESTV4
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
      case "mt":
        params[conversion[key]] = mediaTypes[value] || "Video";
        break;

      case "net":
        params[conversion[key]] = networks[value.toLowerCase()];
        break;

      case "ath":
      case "oid":
      case "vid":
      case "ct":
      case "ten":
      case "ntp":
      case "type":
      case "pst":
      case "ek":
      case "prf":
        params[conversion[key]] = value;
        break;

      case "w":
      case "h":
        params[conversion[key]] = parseInt(value);
        break;

      case "start":
      case "end":
        params[conversion[key]] = parseFloat(value);
        break;

      case "ln":
      case "ttl":
      case "dsc":
      case "tk":
      case "sbj":
      case "data":
      case "murl":
      case "vrk":
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
      case "ht":
      case "dk":
      case "dr":
      case "i":
      case "cap":
        params[conversion[key]] = true;
        break;

      case "ptc":
      case "off":
        params[conversion[key]] = (value || "").split(",");
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
    case "hv":
      controls = EluvioPlayerParameters.controls.OFF_WITH_VOLUME_TOGGLE;
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

  if(params.mediaType === "Live Video") {
    params.playerProfile = params.playerProfile || "live";
  }

  return {
    title,
    smallPlayer: params.smallPlayer,
    showTitle: params.showTitle,
    hideTitle: params.hideTitle,
    showShare: params.showShare,
    network: params.network,
    objectId: params.objectId,
    node: params.node,
    versionHash: params.versionHash,
    offerings: params.offerings,
    linkPath: params.linkPath,
    authorizationToken: params.authorizationToken,
    imageOnly: params.imageOnly,
    mediaType: params.mediaType,
    mediaUrl: params.mediaUrl,
    clipStart: params.clipStart,
    clipEnd: params.clipEnd,
    playerProfile: params.playerProfile,

    tenantId: params.tenantId,
    ntpId: params.ntpId,
    ticketSubject: params.ticketSubject,
    promptTicket: params.promptTicket,

    width: params.width,
    height: params.height,

    viewRecordKey: params.viewRecordKey,
    eventKey: params.eventKey,

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
        protocols: params.protocols,
        playoutParameters: {
          objectId: params.objectId,
          versionHash: params.versionHash,
          offering: (params.offerings || [])[0],
          linkPath: params.linkPath,
          directLink: params.directLink,
          authorizationToken: params.authorizationToken,
          clipStart: params.clipStart,
          clipEnd: params.clipEnd
        }
      },
      playerOptions: {
        controlsClassName: "swiper-no-swiping",
        controls,
        autoplay: params.scrollPlayPause ? EluvioPlayerParameters.autoplay.WHEN_VISIBLE : params.autoplay,
        muted: params.muted,
        loop: params.loop,
        watermark: params.watermark,
        capLevelToPlayerSize: params.capLevelToPlayerSize,
        hlsjsOptions: params.playerProfile === "live" ? LowLatencyLiveHLSOptions : {}
      }
    }
  };
};

export const RecordView = async ({client, viewRecordKey, authorizationToken}) => {
  try {
    const [appId, recordKey] = viewRecordKey.split(":");
    const walletClient = await ElvWalletClient.Initialize({
      client,
      appId,
      network: client.networkName
    });

    await walletClient.SetAuthorization({fabricToken: authorizationToken});

    await walletClient.SetProfileMetadata({
      type: "app",
      mode: "private",
      appId: appId,
      key: recordKey,
      value: true
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to record view:", error);
  }
};

export const FullscreenAllowed = () => {
  return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled || document.webkitEnterFullScreen;
};

export const IsFullscreen = () => {
  const fullscreenElement = (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);

  // Ignore fullscreen video case - player will handle that case
  return fullscreenElement && !fullscreenElement.classList.contains("eluvio-player");
};

export const ToggleFullscreen = (target) => {
  if(IsFullscreen()) {
    if(document.exitFullscreen) {
      document.exitFullscreen();
    } else if(document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if(document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if(document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } else {
    if(target.requestFullscreen) {
      target.requestFullscreen({navigationUI: "hide"});
    } else if(target.mozRequestFullScreen) {
      target.mozRequestFullScreen({navigationUI: "hide"});
    } else if(target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen({navigationUI: "hide"});
    } else if(target.msRequestFullscreen) {
      target.msRequestFullscreen({navigationUI: "hide"});
    } else {
      // iPhone - Use native fullscreen on video element only
      target.querySelector("img, video, iframe").webkitEnterFullScreen();
    }
  }
};

export const EmitEvent = ({eventType, eventKey, eventData}) => {
  if(!window.parent) { return; }

  window.parent.postMessage({
    type: "ElvEmbedEvent",
    eventType,
    eventKey: eventKey || "",
    eventData
  }, "*");
};
