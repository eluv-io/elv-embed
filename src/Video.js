import "./static/stylesheets/video.scss";

import {ElvClient} from "@eluvio/elv-client-js";
import HLSPlayer from "hls.js";
import {InitializeFairPlayStream} from "./FairPlay";

import Logo from "./static/images/Logo.png";

const LoadParams = () => {
  const conversion = {
    net: "configUrl",
    lid: "libraryId",
    oid: "objectId",
    vid: "versionHash",
    ln: "linkPath",
    ap: "autoPlay",
    scr: "scrollPlayPause",
    m: "muted",
    ct: "controls"
  };

  const networks = {
    main: "https://main.net955305.contentfabric.io/config",
    demo: "https://demov3.net955210.contentfabric.io/config",
    test: "https://test.net955203.contentfabric.io/config",
  };

  const urlParams = new URLSearchParams(window.location.search);

  let params = {};
  for(const key of urlParams.keys()) {
    const value = urlParams.get(key).toString();

    switch (key) {
      case "net":
        params[conversion[key]] = networks[value.toLowerCase()];
        break;

      case "lid":
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

  return params;
};

const ScrollPlayPause = (video) => {
  let lastAction;
  const Callback = ([bodyElement]) => {
    if(lastAction !== "play" && bodyElement.isIntersecting && video.paused) {
      video.play();
      lastAction = "play";
    } else if(lastAction !== "pause" && !bodyElement.isIntersecting && !video.paused) {
      video.pause();
      lastAction = "pause";
    }
  };

  new window.IntersectionObserver(Callback, { threshold: 0.1 }).observe(document.body);
};

const Initialize = async () => {
  document.getElementById("watermark").src = Logo;
  document.getElementById("watermark").style.display = "block";

  try {
    const params = LoadParams();

    const client = await ElvClient.FromConfigurationUrl({
      configUrl: params.configUrl
    });

    await client.SetStaticToken({
      token: client.utils.B64(JSON.stringify({qspace_id: await client.ContentSpaceId()}))
    });

    window.client = client;

    const element = document.getElementById("video");

    if(!element) { return; }

    element.muted = params.muted;

    if(params.controls) {
      element.setAttribute("controls", "controls");
    } else {
      element.removeAttribute("controls");
    }

    element.controls = params.controls;

    const availableDRMs = await client.AvailableDRMs();

    const playoutOptions = await client.PlayoutOptions({
      objectId: params.objectId,
      versionHash: params.versionHash,
      linkPath: params.linkPath
    });

    const playoutMethods = playoutOptions.hls.playoutMethods;

    const drm =
      availableDRMs.includes("fairplay") && Object.keys(playoutMethods).includes("fairplay") ? "fairplay" :
        availableDRMs.includes("sample-aes") && Object.keys(playoutMethods).includes("sample-aes") ? "sample-aes" :
          availableDRMs.includes("aes-128") && Object.keys(playoutMethods).includes("aes-128") ? "aes-128" : "clear";

    const playoutUrl = playoutMethods[drm].playoutUrl;

    if(drm === "fairplay") {
      InitializeFairPlayStream({playoutOptions, video: element});
    } else if(drm === "sample-aes") {
      element.src = playoutUrl;
    } else {
      const player = new HLSPlayer();

      player.loadSource(playoutUrl);
      player.attachMedia(element);
    }

    if(params.autoPlay) {
      element.play();
    }

    element.addEventListener("click", () => element.paused ? element.play() : element.pause());

    if(params.scrollPlayPause) {
      ScrollPlayPause(element);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

Initialize();
