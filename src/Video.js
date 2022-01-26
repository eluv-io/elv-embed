import "./static/stylesheets/video.scss";
import EluvioPlayer from "@eluvio/elv-player-js";
import {LoadParams} from "./Utils";
import {ElvClient} from "@eluvio/elv-client-js/dist/src/ElvClient";

const robots = document.createElement("meta");
robots.setAttribute("name", "robots");
robots.setAttribute("content", "noindex");
document.head.appendChild(robots);

const InitializeShareButtons = (target, width) => {
  import("share-buttons");
  const container = document.createElement("div");
  container.classList.add("-elv-social-buttons");
  container.classList.add("share-btn");

  if(width) {
    container.style.width = `${width}px`;
  }

  container.innerHTML = `
    <div class="-elv-social-buttons__text">Share on Social</div>
    <a class="-elv-social-buttons__button -elv-btn-facebook" data-id="fb">
      <svg stroke="#3b5998" fill="#3b5998" background="#FFFFFF" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.42 19.12-40.42 38.73V256h68.78l-11 71.69h-57.78V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48z"></path>
      </svg>
    </a>
    <a class="-elv-social-buttons__button -elv-btn-twitter" data-id="tw">
      <svg stroke="#1DA1F2" fill="#1DA1F2" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
      </svg>
    </a>
    <a class="-elv-social-buttons__button -elv-btn-in" data-id="in">
      <svg stroke="#0072b1" fill="#0072b1" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path>
      </svg>
    </a>
`;

  target.appendChild(container);
};

const InitializeTitle = async ({target, params, metadata, width, setPageTitle=false}) => {
  try {
    const title =
      params.title ||
      metadata.asset_metadata.nft.display_name ||
      metadata.asset_metadata.nft.name ||
      metadata.asset_metadata.display_title ||
      metadata.asset_metadata.title ||
      metadata.name;

    if(title) {
      if(setPageTitle) {
        document.title = title ? `${title} | Eluvio` : "Eluvio";
      }

      if(params.showTitle) {
        const header = document.createElement("header");
        target.prepend(header);

        if(width) {
          header.style.width = `${width}px`;
        }

        header.innerHTML = title;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

const Playable = async (client, playerParams) => {
  try {
    const availableOfferings = await client.AvailableOfferings({
      objectId: playerParams.sourceOptions.playoutParameters.objectId,
      versionHash: playerParams.sourceOptions.playoutParameters.versionHash,
      writeToken: playerParams.sourceOptions.playoutParameters.writeToken,
      linkPath: playerParams.sourceOptions.playoutParameters.linkPath,
      directLink: playerParams.sourceOptions.playoutParameters.directLink,
      resolveIncludeSource: true,
      authorizationToken: playerParams.sourceOptions.playoutParameters.authorizationToken
    });

    return availableOfferings && Object.keys(availableOfferings).length > 0;
  } catch (error) {
    return false;
  }
};

const LoadImage = async ({client, params, metadata={}, target}) => {
  const url = metadata.asset_metadata.nft.image || await client.ContentObjectImageUrl({versionHash: params.versionHash});

  if(!url) { return; }

  const image = document.createElement("img");
  image.classList.add("-elv-player-target__image");
  image.src = url;

  target.appendChild(image);
};

const InitializeEbook = async (metadata, playerTarget, params) => {
  const ePub = await import("epubjs");
  const book = await ePub.default(metadata.asset_metadata.nft.media.url, {openAs: "epub"});

  const rendition = await book.renderTo(playerTarget, {
    height: params.height,
    width: `calc(${params.width} - 100px)`,
    spread: "always",
    flow: "paginated"
  });

  const app = document.getElementById("app");
  app.classList.add("ebook");

  const leftArrow = document.createElement("button");
  const rightArrow = document.createElement("button");

  leftArrow.classList.add(...["arrow", "prev-button"]);
  rightArrow.classList.add(...["arrow", "next-button"]);

  leftArrow.innerHTML = "&#8592;";
  rightArrow.innerHTML = "&#8594;";

  leftArrow.addEventListener("click", () => rendition.prev());
  rightArrow.addEventListener("click", () => rendition.next());

  playerTarget.appendChild(leftArrow);
  playerTarget.appendChild(rightArrow);

  const HandleKeyPress = ({key}) => {
    if(key === "ArrowRight") {
      rendition.next();
    } else if(key === "ArrowLeft") {
      rendition.prev();
    }
  };

  rendition.display();
  rendition.on("keyup", HandleKeyPress);
  document.addEventListener("keyup", HandleKeyPress, false);
};

export const Initialize = async ({client, target, url, playerOptions, setPageTitle=false}={}) => {
  try {
    const params = LoadParams(url);

    if(setPageTitle) {
      document.title = params.title ? `${params.title} | Eluvio` : "Eluvio";
    }

    if(playerOptions) {
      params.playerParameters.playerOptions = {
        ...params.playerParameters.playerOptions,
        ...playerOptions
      };
    }

    let playerTarget;
    if(!target) {
      target = document.getElementById("app");
    }

    target.classList.add("-elv-embed");
    target.innerHTML = "";

    if(params.darkMode) {
      target.classList.add("-elv-dark");
    }

    playerTarget = document.createElement("div");
    playerTarget.classList.add("-elv-player-target");
    target.appendChild(playerTarget);

    if(!client) {
      client = await ElvClient.FromConfigurationUrl({
        configUrl: params.network
      });
    }

    params.playerParameters.clientOptions.client = client;

    if(params.node) {
      await client.SetNodes({fabricURIs: [params.node]});
    }

    if(!params.versionHash) {
      params.versionHash = await client.LatestVersionHash({
        objectId: params.objectId
      });
    }

    let metadata = (await client.ContentObjectMetadata({
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

    const isNFT = !!metadata.nft || !!(metadata.asset_metadata || {}).nft;

    if(metadata.asset_metadata?.nft?.media_type === "Ebook") {
      await InitializeEbook(metadata, playerTarget, params);
      return;
    }

    if(isNFT) {
      params.playerParameters.playerOptions.watermark = false;
    }

    metadata.asset_metadata = metadata.asset_metadata || {};
    metadata.asset_metadata.nft = metadata.asset_metadata.nft || {};

    if(metadata.asset_metadata.nft.background_color) {
      target.style.backgroundColor = metadata.asset_metadata.nft.background_color.color;
    }

    const playable =
      (isNFT && (metadata.nft || metadata.asset_metadata.nft || {}).playable) ||
      await Playable(client, params.playerParameters);

    if(params.imageOnly || !playable) {
      LoadImage({client, params, metadata, target: playerTarget});
    } else {
      const player = new EluvioPlayer(playerTarget, params.playerParameters);
      if(params.smallPlayer && params.width && params.height) {
        playerTarget.style.width = `${params.width}px`;
        playerTarget.style.height = `${params.height}px`;
      }

      window.player = player;
    }

    if(params.showShare) {
      InitializeShareButtons(target, params.smallPlayer ? params.width : undefined);
    }

    InitializeTitle({target, params, metadata, width: params.smallPlayer ? params.width : undefined, setPageTitle});
  } catch (error) {
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
