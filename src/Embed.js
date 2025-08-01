import "./static/stylesheets/video.scss";
import "./static/stylesheets/ebook.scss";
import {InitializeEluvioPlayer} from "@eluvio/elv-player-js/lib/index";
import {EmitEvent, LoadParams, RecordView} from "./Utils";
import {ElvClient} from "@eluvio/elv-client-js";
import UrlJoin from "url-join";

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

const DisplayError = message => {
  const app = document.getElementById("app");
  const errorContainer = document.createElement("div");
  errorContainer.classList.add("-elv-error-container");

  const error = document.createElement("div");
  error.classList.add("-elv-error");

  const errorText = document.createElement("h4");
  errorText.innerHTML = message;
  error.appendChild(errorText);

  errorContainer.appendChild(error);

  if(app.firstChild) {
    app.replaceChild(errorContainer, app.firstChild);
  } else {
    app.appendChild(errorContainer);
  }
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

// Determine the URL for static media like images, html files and ebooks
const MediaUrl = async ({client, params, nftMetadata}) => {
  if(params.mediaUrl) {
    // Full media URL specified in params
    return new URL(params.mediaUrl);
  } else if(params.linkPath || nftMetadata?.media) {
    const linkPath = params.linkPath ? params.linkPath : "/public/asset_metadata/nft/media";

    // Determine link to file
    let fileLinkPath = "";
    if(linkPath.startsWith("./files") || linkPath.startsWith("/files")) {
      fileLinkPath = linkPath;
    } else {
      // Must check content of link - it could be a string containing a URL
      const linkContent = await client.ContentObjectMetadata({
        versionHash: params.versionHash,
        authorizationToken: params.authorizationToken,
        resolveLinks: false,
        resolveIncludeSource: true,
        metadataSubtree: linkPath,
        resolveIgnoreErrors: true,
        produceLinkUrls: true
      });

      if(typeof linkContent === "string") {
        // Target contains link already
        return new URL(linkContent);
      }
    }

    let url = new URL(
      params.network === "main" ?
        "https://main.net955305.contentfabric.io" :
        "https://demov3.net955210.contentfabric.io"
    );

    let urlPath = params.authorizationToken ? UrlJoin("/t", params.authorizationToken) : UrlJoin("s", params.network === "main" ? "main" : "demov3");
    if(fileLinkPath) {
      urlPath = UrlJoin(urlPath, "q", params.versionHash, fileLinkPath.replace("./", ""));
    } else {
      urlPath = UrlJoin(urlPath, "q", params.versionHash, "meta", linkPath);
    }

    url.pathname = urlPath;

    return url;
  }
};

const RenderImage = async ({client, params, imageUrl, nftMetadata={}, target}) => {
  const url = imageUrl || nftMetadata.image || await client.ContentObjectImageUrl({versionHash: params.versionHash});

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
  const params = LoadParams({url});

  try {
    if(setPageTitle) {
      document.title = params.title ? `${params.title} | Eluvio` : "Eluvio Embed";
    }

    if(!target) {
      target = document.getElementById("app");
    }

    target.classList.add("-elv-embed");
    target.innerHTML = "";

    playerTarget = document.createElement("div");
    playerTarget.classList.add("-elv-target");
    target.appendChild(playerTarget);

    if(!client || (params.promptTicket && embedApp)) {
      client = await ElvClient.FromConfigurationUrl({
        configUrl: params.network
      });
    }

    if(params.authorizationToken) {
      client.SetStaticToken({token: params.authorizationToken});
    } else if(params.shareId) {
      try {
        client.SetStaticToken({
          token: await client.RedeemShareToken({shareId: params.shareId})
        });
      } catch(error) {
        const info = await client.ShareInfo({shareId: params.shareId});

        if(info.revoked) {
          throw { displayMessage: "You no longer have permission to access this content" };
        } else if(info.end_time && new Date(info.end_time).getTime() < new Date().getTime()) {
          throw { displayMessage: "Access to this content has expired" };
        } else {
          throw { displayMessage: "This content is no longer available" };
        }
      }
    }

    if(params.node) {
      client.SetNodes({fabricURIs: [params.node]});
    }

    const mediaType = (params.mediaType || "").toLowerCase();
    let playable = ["video", "live video", "audio", "media collection"].includes(mediaType);

    // Redeem ticket if present and not playable (let player handle tickets for videos)
    if(!playable && params.promptTicket) {
      await client.RedeemCode({
        tenantId: params.tenantId,
        ntpId: params.ntpId,
        code: params.ticketCode,
        email: params.ticketSubject
      });

      params.authorizationToken = client.staticToken;
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

    let metadata = { public: {} };
    if(params.versionHash) {
      try {
        metadata.public = (await client.ContentObjectMetadata({
          versionHash: params.versionHash,
          authorizationToken: params.authorizationToken,
          metadataSubtree: "/public",
          select: [
            "/nft/image",
            "/nft/media",
            "/nft/media_parameters",
            "/nft/media_type",
            "/nft/playable",
            "/asset_metadata/nft/image",
            "/asset_metadata/nft/media",
            "/asset_metadata/nft/media_parameters",
            "/asset_metadata/nft/media_type",
            "/asset_metadata/nft/playable"
          ],
          resolveIgnoreErrors: true,
          produceLinkUrls: true
        })) || {};
      } catch(error) {
        // eslint-disable-next-line no-console
        console.log(error);
      }
    }

    const nftMetadata = {
      ...(metadata.public?.asset_metadata?.nft || {}),
      ...(metadata.public?.nft || {})
    };


    const isNFT = !!metadata.public?.nft || !!metadata.public?.asset_metadata?.nft;

    if(isNFT) {
      params.playerParameters.playerOptions.watermark = false;
    }


    if(!playable) {
      const mediaUrl = await MediaUrl({client, params, nftMetadata});

      if(!mediaUrl) {
        throw "Unable to determine media URL for the specified parameters";
      }

      if(params.mediaUrlParameters) {
        Object.keys(params.mediaUrlParameters).map(key =>
          mediaUrl.searchParams.set(key, params.mediaUrlParameters[key])
        );
      } else if(nftMetadata.media_parameters) {
        (nftMetadata.media_parameters || []).forEach(({name, value}) =>
          mediaUrl.searchParams.set(name, value)
        );
      }


      // HTML Media - embed iframe with link to HTML file
      if(["html", "link"].includes(mediaType) || ["HTML", "Link", "Embedded Webpage"].includes(nftMetadata.media_type)) {
        // HTML or Link
        await recordViewPromise;
        window.location.href = mediaUrl.toString();
        return;
      } else if(mediaType === "ebook" || nftMetadata.media_type === "Ebook") {
        // Ebook
        import("./Ebook.js").then(async ({InitializeEbook}) => {
          await InitializeEbook(mediaUrl, playerTarget, params);
        });

        return;
      } else {
        // Image
        playerTarget.classList.add("-elv-player-target");
        RenderImage({client, params, nftMetadata, imageUrl: mediaUrl, target: playerTarget});
      }
    } else {
      // Video
      playerTarget.classList.add("-elv-player-target");

      if(playerOptions) {
        params.playerParameters.playerOptions = {
          ...params.playerParameters.playerOptions,
          ...playerOptions
        };
      }

      let { availableOfferings } = await Playable(client, params.playerParameters);
      // Select specified offering - highest priority offering that is actually available
      if(params.offerings?.length > 0) {
        params.playerParameters.sourceOptions.playoutParameters.offering = params.offerings.find(offeringKey => availableOfferings[offeringKey]);
      } else if(availableOfferings && Object.keys(availableOfferings).length > 0) {
        params.playerParameters.sourceOptions.playoutParameters.offering = availableOfferings.default ? "default" : Object.keys(availableOfferings)[0];
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
          player.controls.RegisterVideoEventListener(eventName,event => {
            // Emit video events to parent container
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

      player = await InitializeEluvioPlayer(playerTarget, params.playerParameters);
      window.elvPlayer = player;
    }

    return player;
  } catch(error) {
    // eslint-disable-next-line no-console
    console.log(error);
    // eslint-disable-next-line no-console
    console.log(params);


    errorCallback && errorCallback(error, window.player);

    if(playerTarget) {
      playerTarget.remove();
    }

    const urlParams = new URLSearchParams(
      new URL(window.location.toString()).search
    );

    const node = urlParams.get("node");

    if(error.displayMessage) {
      DisplayError(error.displayMessage);
    } else if(error.status === 500 && node) {
      DisplayError("Error: there was a problem loading the specified node");
    } else {
      DisplayError("Something went wrong");
    }
  }
};
