import {EluvioPlayerParameters} from "@eluvio/elv-player-js";
import {ElvWalletClient, Utils} from "@eluvio/elv-client-js";

const CreateMetaTags = (options={}) => {
  Object.keys(options).forEach(tag => {
    if(!options[tag]) { return; }

    const metaTag = document.createElement("meta");

    metaTag.setAttribute("property", tag);
    metaTag.setAttribute("content", options[tag]);

    document.head.appendChild(metaTag);
  });
};

export const controls = {
  "d": EluvioPlayerParameters.controls.DEFAULT,
  "h": EluvioPlayerParameters.controls.AUTO_HIDE,
  "s": EluvioPlayerParameters.controls.ON,
  "hv": EluvioPlayerParameters.controls.OFF_WITH_VOLUME_TOGGLE
};

export const mediaTypes = {
  "v": "Video",
  "lv": "Live Video",
  "a": "Audio",
  "mc": "Media Collection",
  "g": "Gallery",
  "i": "Image",
  "h": "HTML",
  "b": "EBook",
  "l": "Link"
};

export const playerProfiles = {
  "default": EluvioPlayerParameters.playerProfile.DEFAULT,
  "ll": EluvioPlayerParameters.playerProfile.LOW_LATENCY,
  "ull": EluvioPlayerParameters.playerProfile.ULTRA_LOW_LATENCY,
};

export const paramsToName = {
  ttl: "title",
  dsc: "description",
  img: "image",
  pst: "posterImage",
  net: "network",
  cid: "contentId",
  oid: "objectId",
  vid: "versionHash",
  mcid: "collectionId",
  off: "offerings",
  ln: "linkPath",
  dr: "directLink",

  ui: "ui",
  ap: "autoplay",
  scr: "scrollPlayPause",
  m: "muted",
  ct: "controls",
  lp: "loop",
  ptc: "protocols",
  i: "imageOnly",
  ht: "hideTitle",
  prf: "playerProfile",
  hls: "hlsOptions",
  mbr: "maxBitrate",

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
  mt: "mediaType",
  murl: "mediaUrl",
  mp: "mediaUrlParameters",
  vrk: "viewRecordKey",
  ek: "eventKey",

  // Watermark defaults true except for NFTs
  wm: "watermark",
  nwm: "hideWatermark",
  awm: "accountWatermark",

  dbg: "debugLogging"
};

let reverseMap = {};
Object.keys(paramsToName).forEach(key =>
  reverseMap[paramsToName[key]] = key
);

export const GenerateEmbedURL = ({values}) => {
  const url = new URL(window.location.origin);
  url.searchParams.set("p", "");

  let ogData = {};
  Object.keys(values).forEach(key => {
    const param = reverseMap[key];
    let value = values[key];

    if(typeof value === "undefined" || (typeof value === "boolean" && !value) || value === "") {
      return;
    } else if(typeof value === "string") {
      value = value.trim();
    }

    switch(key) {
      case "collectionId":
        if(values.mediaType === "mc") {
          url.searchParams.set(param, value);
        }
        break;

      case "autoplay":
        if(value === "Only When Visible") {
          url.searchParams.set("scr", "");
        } else if(value === "On") {
          url.searchParams.set(param, "");
        }
        break;

      case "clipStart":
      case "clipEnd":
        url.searchParams.set(param, parseFloat(value));
        break;

      case "maxBitrate":
        url.searchParams.set(param, parseInt(value));
        break;

      case "title":
      case "description":
      case "image":
      case "posterImage":
      case "linkPath":
      case "ticketCode":
      case "ticketSubject":
        url.searchParams.set(param, Utils.B64(value));
        break;

      case "offerings":
        if(value?.trim()) {
          url.searchParams.set(param, value.trim().split(/[ ,]+/).join(","));
        }
        break;

      case "mediaUrlParameters":
      case "hlsOptions":
        try {
          const options = JSON.parse(value);
          if(options && Object.keys(options).length > 0) {
            url.searchParams.set(param, Utils.B58(JSON.stringify(options)));
          }
        } catch(error) {
          console.error(`Unable to convert JSON options for ${key}:`);
          console.error(error);
        }
        break;

      default:
        if(!param) {
          console.warn(`Unknown parameter ${key} = ${value}`);
          return;
        }

        if(typeof value === "boolean") {
          url.searchParams.set(param, "");
        } else {
          url.searchParams.set(param, value);
        }
    }
  });

  if(Object.keys(ogData).length > 0) {
    url.searchParams.set("data", Utils.B64(JSON.stringify({meta_tags: ogData})));
  }

  return url;
};

export const LoadParams = ({url, playerParams=true}={}) => {
  const networks = {
    main: EluvioPlayerParameters.networks.MAIN,
    demo: EluvioPlayerParameters.networks.DEMO,
    test: EluvioPlayerParameters.networks.TEST,
    testv4: EluvioPlayerParameters.networks.TESTV4
  };

  const urlParams = new URLSearchParams(
    new URL(url || window.location.toString()).search
  );

  let params = {};

  for(const key of urlParams.keys()) {
    const value = urlParams.get(key).toString().trim();

    switch(key) {
      case "cid":
      case "mcid":
      case "ptc":
      case "off":
      case "prf":
      case "net":
      case "ath":
      case "oid":
      case "vid":
      case "ct":
      case "ten":
      case "ntp":
      case "type":
      case "mt":
      case "ek":
      case "ui":
        params[paramsToName[key]] = value;
        break;

      case "w":
      case "h":
      case "mbr":
        params[paramsToName[key]] = parseInt(value);
        break;

      case "start":
      case "end":
        params[paramsToName[key]] = parseFloat(value);
        break;

      case "ttl":
      case "dsc":
      case "img":
      case "pst":
      case "ln":
      case "tk":
      case "sbj":
      case "murl":
      case "vrk":
        params[paramsToName[key]] = Utils.FromB64(value).trim();
        break;

      case "mp":
      case "hls":
        try {
          params[paramsToName[key]] = JSON.stringify(
            JSON.parse(
              Utils.FromB58ToStr(value)
            ),
            null,
            2
          );
        } catch(error) {
          console.error(`Invalid ${key} parameter:`, value, error);
        }
        break;

      case "wm":
      case "nwm":
      case "awm":
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
      case "dbg":
        params[paramsToName[key]] = true;
        break;
    }
  }

  if(!params.playerProfile && params.mediaType === mediaTypes["lv"]) {
    // Set player profile based on media type
    params.playerProfile = params.playerProfile || EluvioPlayerParameters.playerProfile.LOW_LATENCY;
  }

  if(!playerParams) {
    return params;
  }

  params.network = networks[params.network.toLowerCase()];
  params.mediaType = mediaTypes[params.mediaType] || mediaTypes["v"];
  params.playerProfile = playerProfiles[params.playerProfile];
  params.controls = controls[params.controls] || EluvioPlayerParameters.controls.OFF;

  if(params.contentId) {
    if(params.contentId.startsWith("iq__")) {
      params[paramsToName["oid"]] = params.contentId;
    } else {
      params[paramsToName["vid"]] = params.contentId;
    }
  }

  if(params.offerings) {
    params.offerings = params.offerings.split(/[ ,]+/);
  }

  if(params.protocols) {
    params.protocols = params.protocols.split(/[ ,]+/);
  }

  if(params.hlsOptions) {
    try {
      params.hlsOptions = JSON.parse(params.hlsOptions);
    } catch(error) {
      console.error("Invalid HLS options parameter:", params.hlsOptions);
    }
  }

  if(params.mediaUrlParameters) {
    try {
      params.mediaUrlParameters = JSON.parse(params.mediaUrlParameters);
    } catch(error) {
      console.error("Invalid media URL parameter:", params.mediaUrlParameters);
    }
  }

  return {
    title: params.title,
    description: params.description,
    image: params.image,
    posterImage: params.posterImage,
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
    mediaUrlParameters: params.mediaUrlParameters,
    clipStart: params.clipStart,
    clipEnd: params.clipEnd,
    playerProfile: params.playerProfile,

    tenantId: params.tenantId,
    ntpId: params.ntpId,
    ticketCode: params.ticketCode,
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
        mediaCollectionOptions: {
          mediaCatalogObjectId: params.mediaType === mediaTypes["mc"] ? params.objectId : undefined,
          mediaCatalogVersionHash: params.mediaType === mediaTypes["mc"] ? params.versionHash : undefined,
          collectionId: params.collectionId
        },
        contentInfo: {
          title: params.title,
          description: params.description,
          image: params.image,
          posterImage: params.posterImage
        },
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
        ui: params.ui,
        controlsClassName: "swiper-no-swiping",
        title: !params.hideTitle,
        controls: params.controls,
        autoplay: params.scrollPlayPause ? EluvioPlayerParameters.autoplay.WHEN_VISIBLE : params.autoplay,
        muted: params.muted,
        loop: params.loop,
        watermark: !params.hideWatermark,
        accountWatermark: params.accountWatermark,
        capLevelToPlayerSize: params.capLevelToPlayerSize,
        playerProfile: params.playerProfile,
        hlsjsOptions: params.hlsOptions,
        maxBitrate: params.maxBitrate,
        debugLogging: params.debugLogging
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
  } catch(error) {
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
