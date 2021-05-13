import "./static/stylesheets/video.scss";
import EluvioPlayer from "@eluvio/elv-player-js";
import {LoadParams} from "./Utils";


const robots = document.createElement("meta");
robots.setAttribute("name", "robots");
robots.setAttribute("content", "noindex");
document.head.appendChild(robots);

const InitializeShareButtons = (app, width) => {
  import("share-buttons");
  const container = document.createElement("div");
  container.classList.add("social-buttons");
  container.classList.add("share-btn");

  if(width) {
    container.style.width = `${width}px`;
  }

  container.innerHTML = `
    <div class="social-buttons__text">Share on Social</div>
    <a class="social-buttons__button btn-facebook" data-id="fb">
      <svg stroke="#3b5998" fill="#3b5998" background="#FFFFFF" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.42 19.12-40.42 38.73V256h68.78l-11 71.69h-57.78V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48z"></path>
      </svg>
    </a>
    <a class="social-buttons__button btn-twitter" data-id="tw">
      <svg stroke="#1DA1F2" fill="#1DA1F2" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
      </svg>
    </a>
    <a class="social-buttons__button btn-in" data-id="in">
      <svg stroke="#0072b1" fill="#0072b1" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path>
      </svg>
    </a>
`;

  app.appendChild(container);
};

const InitializeTitle = async (app, params, player, width) => {
  const header = document.createElement("header");
  app.prepend(header);

  if(width) {
    header.style.width = `${width}px`;
  }

  const client = await player.Client();

  try {
    const sourceOptions = { ...params.playerParameters.sourceOptions.playoutParameters };
    if(!sourceOptions.versionHash) {
      sourceOptions.libraryId = await client.ContentObjectLibraryId({objectId: sourceOptions.objectId});
    }

    const targetHash = await client.LinkTarget(sourceOptions);
    const metadata = await client.ContentObjectMetadata({
      versionHash: targetHash,
      metadataSubtree: "public",
      select: [
        "name",
        "asset_metadata/title",
        "asset_metadata/display_title"
      ]
    });

    const title =
      (metadata.asset_metadata || {}).display_title ||
      (metadata.asset_metadata || {}).title ||
      metadata.name;

    if(title) {
      header.innerHTML = title;
    } else {
      app.removeChild(header);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    app.removeChild(header);
  }
};

const Initialize = async () => {
  const app = document.getElementById("app");
  const target = document.createElement("div");
  target.classList.add("player-target");
  app.appendChild(target);

  const params = LoadParams();

  let heightReduction = 0;

  const player = new EluvioPlayer(target, params.playerParameters);

  if(params.showTitle) {
    InitializeTitle(app, params, player, params.smallPlayer ? params.width : undefined);
    heightReduction += 50;
  }

  if(params.showShare) {
    InitializeShareButtons(app, params.smallPlayer ? params.width : undefined);
    heightReduction += 50;
  }

  if(params.smallPlayer) {
    target.style.width = `${params.width}px`;
    target.style.height = `${params.height}px`;
  } else {
    app.classList.add("dark");
    target.style.maxHeight = `calc(100vh - ${heightReduction}px)`;
  }

  window.player = player;
};

Initialize();
