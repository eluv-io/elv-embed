import "./static/stylesheets/video.scss";
import "./static/stylesheets/ebook.scss";
import EluvioPlayer from "@eluvio/elv-player-js";
import {EmitEvent, LoadParams, RecordView} from "./Utils";
import {ElvClient} from "@eluvio/elv-client-js";
import UrlJoin from "url-join";

const robots = document.createElement("meta");
robots.setAttribute("name", "robots");
robots.setAttribute("content", "noindex");
document.head.appendChild(robots);

const SandboxPermissions = () => {
  return [
    "allow-downloads",
    "allow-scripts",
    "allow-forms",
    "allow-modals",
    "allow-pointer-lock",
    "allow-orientation-lock",
    "allow-popups",
    "allow-popups-to-escape-sandbox",
    "allow-presentation",
    "allow-same-origin",
    "allow-downloads-without-user-activation",
    "allow-storage-access-by-user-activation"
  ].join(" ");
};

const Playable = async (client, playerParams) => {
  try {
    let availableOfferings = {};
    // If direct link is specified, determining offering is not necessary
    if(!playerParams.sourceOptions.playoutParameters.linkPath) {
      availableOfferings = await client.AvailableOfferings({
        objectId: playerParams.sourceOptions.playoutParameters.objectId,
        versionHash: playerParams.sourceOptions.playoutParameters.versionHash,
        writeToken: playerParams.sourceOptions.playoutParameters.writeToken,
        linkPath: playerParams.sourceOptions.playoutParameters.linkPath,
        resolveIncludeSource: true,
        authorizationToken: playerParams.sourceOptions.playoutParameters.authorizationToken
      });
    }

    return {
      playable: availableOfferings && Object.keys(availableOfferings).length > 0,
      availableOfferings
    };
  } catch(error) {
    return { playable: false, availableOfferings: {} };
  }
};

const LoadImage = async ({client, params, imageUrl, metadata={}, target}) => {
  const url = imageUrl || metadata.asset_metadata.nft.image || await client.ContentObjectImageUrl({versionHash: params.versionHash});

  if(!url) { return; }

  const image = document.createElement("img");
  image.classList.add("-elv-target__image");
  image.src = url;
  image.onerror = () => {
    // Hide broken image on error
    image.style.display = "none";
  };

  target.appendChild(image);
};

export const Initialize = async ({client, target, url, playerOptions, errorCallback, setPageTitle=false, embedApp=false}={}) => {
  let player, playerTarget;

  try {
    const params = LoadParams({url});

    if(setPageTitle) {
      document.title = params.title ? `${params.title} | Eluvio` : "Eluvio";
    }

    if(playerOptions) {
      params.playerParameters.playerOptions = {
        ...params.playerParameters.playerOptions,
        ...playerOptions
      };
    }

    if(!target) {
      target = document.getElementById("app");
    }

    target.classList.add("-elv-embed");
    target.innerHTML = "";

    playerTarget = document.createElement("div");
    playerTarget.classList.add("-elv-target");
    target.appendChild(playerTarget);

    if(!client) {
      client = await ElvClient.FromConfigurationUrl({
        configUrl: params.network
      });
    }

    let recordViewPromise;
    if(params.viewRecordKey) {
      recordViewPromise = RecordView({
        client,
        authorizationToken: params.authorizationToken,
        viewRecordKey: params.viewRecordKey
      });
    }

    params.playerParameters.clientOptions.client = client;
    // Allow the player to redeem tickets on our client instead of initializing a new one
    params.playerParameters.clientOptions.allowClientTicketRedemption = embedApp;

    if(params.node) {
      await client.SetNodes({fabricURIs: [params.node]});
    }

    if(!params.versionHash && params.objectId) {
      params.versionHash = await client.LatestVersionHash({
        objectId: params.objectId
      });
    }

    let metadata = {};
    if(params.versionHash) {
      try {
        metadata = (await client.ContentObjectMetadata({
          versionHash: params.versionHash,
          metadataSubtree: "public",
          authorizationToken: params.authorizationToken,
          select: [
            "name",
            "nft",
            "asset_metadata/title",
            "asset_metadata/display_title",
            "asset_metadata/nft"
          ],
          produceLinkUrls: true
        })) || {};
      } catch(error) {
        // eslint-disable-next-line no-console
        console.log(error);
      }
    }

    const mediaType = (params.mediaType || "").toLowerCase();

    let mediaUrl;
    if(["image", "ebook"].includes(mediaType)) {
      mediaUrl = params.mediaUrl || client.utils.SafeTraverse(metadata, (params.linkPath || "").replace("/public", "").split("/").filter(part => part))?.url;
    }

    // HTML Media - embed iframe with link to HTML file
    if(["html", "link"].includes(mediaType) || metadata.asset_metadata?.nft?.media_type === "HTML") {
      let mediaUrl = params.mediaUrl ? new URL(params.mediaUrl) : "";
      if(!mediaUrl) {
        const fileLink = metadata.asset_metadata?.nft?.media;
        const targetHash = await client.LinkTarget({
          versionHash: params.versionHash,
          linkPath: "/public/asset_metadata/nft/media"
        });

        const filePath = fileLink["/"].split("/files/")[1];

        const mediaUrl = new URL(
          params.network.replace("/config", "")
        );

        mediaUrl.pathname = UrlJoin("/s", await client.NetworkInfo().name, "q", targetHash, "files", filePath);

        (metadata.asset_metadata?.nft?.media_parameters || []).forEach(({name, value}) =>
          mediaUrl.searchParams.set(name, value)
        );
      }

      if(params.authorizationToken) {
        mediaUrl.searchParams.set("authorization", params.authorizationToken);
      }

      await recordViewPromise;
      window.location.href = mediaUrl.toString();
      return;
    }

    if(mediaType === "ebook" || metadata.asset_metadata?.nft?.media_type === "Ebook") {
      const ebookUrl = mediaUrl || metadata.asset_metadata?.nft?.media?.url;

      import("./Ebook.js").then(async ({InitializeEbook}) => {
        await InitializeEbook(ebookUrl, playerTarget, params);
      });

      return;
    }


    playerTarget.classList.add("-elv-player-target");

    const isNFT = !!metadata.nft || !!(metadata.asset_metadata || {}).nft;

    if(isNFT) {
      params.playerParameters.playerOptions.watermark = false;
    }

    metadata.asset_metadata = metadata.asset_metadata || {};
    metadata.asset_metadata.nft = metadata.asset_metadata.nft || {};

    if(metadata.asset_metadata.nft.background_color) {
      target.style.backgroundColor = metadata.asset_metadata.nft.background_color.color;
    }

    const nonPlayableNFT =
      isNFT &&
      typeof (metadata.nft || metadata.asset_metadata.nft || {}).playable !== "undefined" &&
      !(metadata.nft || metadata.asset_metadata.nft || {}).playable;

    let { playable, availableOfferings } = nonPlayableNFT ? { playable: false, availableOfferings: {} } : await Playable(client, params.playerParameters);

    if(!["video", "live video", "audio", "playlist"].includes(mediaType) && (mediaType === "image" || params.imageOnly || !playable)) {
      LoadImage({client, params, metadata, imageUrl: mediaUrl, target: playerTarget});
    } else {
      // Select specified offering - highest priority offering that is actually available
      if(params.offerings?.length > 0) {
        params.playerParameters.sourceOptions.playoutParameters.offering = params.offerings.find(offeringKey => availableOfferings[offeringKey]);
      } else if(availableOfferings && Object.keys(availableOfferings).length > 0) {
        params.playerParameters.sourceOptions.playoutParameters.offering = Object.keys(availableOfferings)[0];
      }

      if(errorCallback) {
        params.playerParameters.playerOptions.errorCallback = errorCallback;
      }

      const OriginalPlayerCallback = params.playerParameters.playerOptions.playerCallback;
      params.playerParameters.playerOptions.playerCallback = (params) => {
        if(OriginalPlayerCallback) {
          try {
            OriginalPlayerCallback(params);
          // eslint-disable-next-line no-empty
          } catch(error) {}
        }

        [
          "abort",
          "canplay",
          "ended",
          "error",
          "pause",
          "play"
        ].forEach(eventName => {
          params.videoElement.addEventListener(eventName, event => {
            EmitEvent({
              eventType: "video",
              eventKey: params.eventKey,
              eventData: {
                eventName,
                timeStamp: event.timeStamp,
              }
            });
          });
        });
      };

      player = new EluvioPlayer(playerTarget, params.playerParameters);
      if(params.smallPlayer && params.width && params.height) {
        playerTarget.style.width = `${params.width}px`;
        playerTarget.style.height = `${params.height}px`;
      }

      window.player = player;
    }

    return player;
  } catch(error) {
    // eslint-disable-next-line no-console
    console.log(error);

    errorCallback && errorCallback(error, player);

    if(playerTarget) {
      playerTarget.remove();
    }

    const urlParams = new URLSearchParams(
      new URL(window.location.toString()).search
    );

    const node = urlParams.get("node");

    if(error.status === 500 && node) {
      const app = document.getElementById("app");
      const errorContainer = document.createElement("div");
      errorContainer.classList.add("-elv-error-container");

      const error = document.createElement("div");
      error.classList.add("-elv-error");

      const errorText = document.createElement("h4");
      errorText.innerHTML = "Error: there was a problem loading the specified node";
      error.appendChild(errorText);

      errorContainer.appendChild(error);
      app.replaceChild(errorContainer, app.firstChild);
    }
  }
};
