import "swiper/swiper-bundle.min.css";
import "./static/stylesheets/gallery.scss";

import React, {useEffect, useState} from "react";
import {render} from "react-dom";
import {LoadParams} from "./Utils";
import {ElvClient} from "@eluvio/elv-client-js";
import SwiperCore, {Scrollbar, Keyboard, Mousewheel} from "swiper";
import {Swiper, SwiperSlide} from "swiper/react";
import UrlJoin from "url-join";
import {EluvioPlayer, EluvioPlayerParameters} from "@eluvio/elv-player-js";

SwiperCore.use([Scrollbar, Keyboard, Mousewheel]);

const params = LoadParams(window.location.href);

const LoadGallery = async () => {
  window.client = await ElvClient.FromConfigurationUrl({
    configUrl: params.network
  });

  let versionHash = params.versionHash || params.objectId;

  if(!versionHash || !(versionHash.startsWith("hq__") || versionHash.startsWith("iq__"))) {
    throw Error("Invalid version hash or object ID");
  }

  if(versionHash.startsWith("iq__")) {
    versionHash = await client.LatestVersionHash({objectId: versionHash});
  }

  const galleryMetadata = await client.ContentObjectMetadata({
    versionHash,
    metadataSubtree: params.linkPath,
    authorizationToken: params.authorizationToken,
    produceLinkUrls: true
  });

  if(!galleryMetadata || !Array.isArray(galleryMetadata)) {
    throw Error("Invalid gallery metadata");
  } else if(galleryMetadata.length === 0) {
    throw Error("Empty gallery");
  }

  return galleryMetadata;
};

const GalleryItemImageUrl = ({item, width}) => {
  let url = item?.image?.url;
  if(!url && item.video) {
    const videoHash = item.video["/"]?.split("/").find(token => token.startsWith("hq__"));

    if(!videoHash) { return; }

    switch (window.client.networkName) {
      case "main":
        url = "https://main.net955305.contentfabric.io/s/main";
        break;
      case "demo":
      case "demov3":
        url = "https://demov3.net955210.contentfabric.io/s/demov3";
        break;
      case "test":
        url = "https://test.net955210.contentfabric.io/s/test";
        break;
    }

    url = UrlJoin(url, "q", videoHash, "meta", "public", "display_image");
  }

  if(url && width) {
    url = new URL(url);
    url.searchParams.set("width", width);
    url = url.toString();
  }

  return url;
};

const GalleryItem = ({item, activeItemIndex}) => {
  const [player, setPlayer] = useState(undefined);

  useEffect(() => {
    if(player) {
      player.Destroy();
      setPlayer(undefined);
    }
  }, [item]);

  return (
    <div className="gallery__active-item">
      {
        item?.video ?
          <div
            key={`gallery-video-${activeItemIndex}`}
            className="gallery__active-item__content gallery__active-item__video"
            ref={element => {
              if(!element || player) { return; }

              const videoHash = item.video["/"]?.split("/").find(token => token.startsWith("hq__"));

              if(!videoHash) { return; }

              setPlayer(
                new EluvioPlayer(
                  element,
                  {
                    clientOptions: {
                      client: window.client
                    },
                    sourceOptions: {
                      playoutParameters: {
                        versionHash: videoHash,
                        authorizationToken: params.authorizationToken
                      }
                    },
                    playerOptions: {
                      controls: EluvioPlayerParameters.controls.AUTO_HIDE,
                      autoplay: EluvioPlayerParameters.autoplay.ON,
                      muted: EluvioPlayerParameters.muted.OFF,
                      watermark: EluvioPlayerParameters.watermark.OFF,
                      capLevelToPlayerSize: EluvioPlayerParameters.capLevelToPlayerSize.OFF
                    }
                  }
                )
              );
            }}
          /> :
          item?.image ? <img alt={item.name} src={GalleryItemImageUrl({item})} className="gallery__active-item__content gallery__active-item__image" /> : null
      }
      <div className="gallery__active-item__info">
        {
          item?.name ?
            <div className="gallery__active-item__name">
              {item.name}
            </div> : null
        }
        {
          item?.description ?
            <div className="gallery__active-item__description">
              {item.description}
            </div> : null
        }
      </div>
    </div>
  );
};

const GalleryCarousel = ({galleryMetadata, activeItemIndex, setActiveItemIndex}) => {
  return (
    <Swiper
      className="gallery__carousel"
      scrollbar={{ draggable: true }}
      spaceBetween={5}
      keyboard
      mousewheel
      slidesPerView="auto"
    >
      {
        galleryMetadata.map((item, index) =>
          <SwiperSlide key={`item-${index}`} className={`gallery__carousel__item gallery__carousel__item--${(item?.image_aspect_ratio || "square").toLowerCase()}`}>
            <button
              title={item.name || ""}
              onClick={() => {
                setActiveItemIndex(index);
                document.querySelector(".app").scrollTo(0, 0);
              }}
              className={`gallery__carousel__item__button ${index === activeItemIndex ? "gallery__carousel__item__button--active" : ""}`}
            >
              <img
                alt={item.name}
                src={GalleryItemImageUrl({item, width: 600})}
                className={`gallery__carousel__item__image ${index === activeItemIndex ? "gallery__carousel__item__image--active" : ""}`}
              />
            </button>
          </SwiperSlide>
        )
      }
    </Swiper>
  );
};

const Gallery = () => {
  const [galleryMetadata, setGalleryMetadata] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  useEffect(() => {
    LoadGallery()
      .then(meta => setGalleryMetadata(meta))
      .catch(error => setError(error));
  }, []);

  useEffect(() => {
    const itemName = galleryMetadata && galleryMetadata[activeItemIndex]?.name || "";
    const pageTitle = params.title || "Eluvio";

    document.title = itemName && pageTitle ? `${itemName} | ${pageTitle}` : itemName || pageTitle;
  }, [activeItemIndex, galleryMetadata]);

  if(error) {
    return (
      <div className="gallery">
        <div className="gallery__error">
          { error.message || error }
        </div>
      </div>
    );
  }

  if(!galleryMetadata) {
    return <div className="gallery gallery--empty" />;
  }

  return (
    <div className={`gallery ${params.title ? "gallery--with-title" : ""}`}>
      { params.title ? <h1 className="gallery__title">{params.title}</h1> : null }
      <GalleryItem
        item={galleryMetadata ? galleryMetadata[activeItemIndex] : undefined}
        activeItemIndex={activeItemIndex}
      />
      <div className="gallery__carousel-container">
        <GalleryCarousel
          galleryMetadata={galleryMetadata}
          activeItemIndex={activeItemIndex}
          setActiveItemIndex={setActiveItemIndex}
        />
      </div>
    </div>
  );
};

document.getElementById("app").classList.add("app--gallery");

render(
  <Gallery />,
  document.getElementById("app")
);
