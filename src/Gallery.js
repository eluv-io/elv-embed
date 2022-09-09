import "swiper/swiper-bundle.min.css";
import "./static/stylesheets/gallery.scss";

import React, {useEffect, useState} from "react";
import {render} from "react-dom";
import {LoadParams} from "./Utils";
import {ElvClient} from "@eluvio/elv-client-js";
import SwiperCore, {Lazy, Navigation, Scrollbar, Keyboard, Mousewheel} from "swiper";
import {Swiper, SwiperSlide} from "swiper/react";
import UrlJoin from "url-join";
import {EluvioPlayer, EluvioPlayerParameters} from "@eluvio/elv-player-js";

SwiperCore.use([Lazy, Navigation, Scrollbar, Keyboard, Mousewheel]);

const params = LoadParams(window.location.href);

let GalleryItemsSwiper;

const LoadGallery = async () => {
  window.client = await ElvClient.FromConfigurationUrl({
    configUrl: params.network
  });

  let versionHash = params.versionHash || params.objectId;

  if(!versionHash || !(versionHash.startsWith("hq__") || versionHash.startsWith("iq__"))) {
    throw Error("Invalid version hash or object ID");
  }

  if(versionHash.startsWith("iq__")) {
    versionHash = await window.client.LatestVersionHash({objectId: versionHash});
  }

  let galleryMetadata, galleryItems, title, backgroundImage, backgroundImageMobile, customCSS;
  let controls = "Carousel";
  if(params.linkPath?.includes("additional_media")) {
    // Pull out global additional media custom CSS and gallery info
    try {
      const additionalMediaKey = params.linkPath.includes("additional_media_sections") ? "additional_media_sections" : "additional_media";
      let [additionalMediaPath, galleryPath] = params.linkPath.split(additionalMediaKey);

      const additionalMediaMetadata = await window.client.ContentObjectMetadata({
        versionHash,
        metadataSubtree: additionalMediaPath,
        authorizationToken: params.authorizationToken,
        produceLinkUrls: true,
        select: [
          "additional_media",
          "additional_media_sections",
          "additional_media_custom_css"
        ]
      });

      customCSS = additionalMediaMetadata.additional_media_custom_css;

      galleryMetadata = window.client.utils.SafeTraverse(additionalMediaMetadata, UrlJoin(additionalMediaKey, galleryPath.split("/gallery")[0]).split("/"));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Unable to load full additional media info:");
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  if(!galleryMetadata) {
    galleryMetadata = await client.ContentObjectMetadata({
      versionHash,
      metadataSubtree: params.linkPath,
      authorizationToken: params.authorizationToken,
      produceLinkUrls: true
    });
  }

  if(Array.isArray(galleryMetadata)) {
    // Link was directly to gallery items
    galleryItems = galleryMetadata;
    galleryMetadata = {};
  } else {
    title = galleryMetadata.name;
    galleryItems = galleryMetadata.gallery || [];
    backgroundImage = galleryMetadata.background_image?.url;
    backgroundImageMobile = galleryMetadata.background_image_mobile?.url || backgroundImage;
    controls = galleryMetadata.controls || "Carousel";
    galleryItems = galleryMetadata.gallery || [];
  }

  if(!galleryItems || !Array.isArray(galleryItems)) {
    throw Error("Invalid gallery metadata");
  } else if(galleryItems.length === 0) {
    throw Error("Empty gallery");
  }

  return {
    galleryItems,
    galleryMetadata,
    title,
    backgroundImage,
    backgroundImageMobile,
    controls,
    customCSS
  };
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

const GalleryItem = ({controlType, item, itemIndex, isActive}) => {
  const [player, setPlayer] = useState(undefined);

  useEffect(() => {
    if(player) {
      player.Destroy();
      setPlayer(undefined);
    }
  }, [isActive]);

  return (
    <div className={`gallery__item gallery__item--${controlType.toLowerCase()} ${isActive ? "gallery__item--active" : "gallery__item--inactive"}`}>
      <div className="gallery__item__info">
        {
          item?.name ?
            <div className="gallery__item__name">
              {item.name}
            </div> : null
        }
      </div>
      <div className={`gallery__item__content ${item.video ? "gallery__item__content--video" : "gallery__item__content--image"}`}>
        {
          item?.video ?
            <div
              key={`gallery-video-${itemIndex}-${isActive}`}
              className="gallery__item__video"
              ref={element => {
                if(!element || player || !isActive) { return; }

                const videoHash = item.video["/"]?.split("/")
                  .find(token => token.startsWith("hq__"));

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
                        capLevelToPlayerSize: EluvioPlayerParameters.capLevelToPlayerSize.OFF,
                        playerCallback: () => {
                          // Make sure swiper is disabled on player controls
                          document.querySelector(".eluvio-player__controls").classList.add("swiper-no-swiping");
                        }
                      }
                    }
                  )
                );
              }}
            /> :
            <img
              alt={item.name}
              key={`gallery-item-${itemIndex}`}
              data-src={GalleryItemImageUrl({item})}
              className="swiper-lazy gallery__item__image"
            />
        }
      </div>
      <div className="gallery__item__info">
        {
          item?.description ?
            <div className="gallery__item__description">
              {item.description}
            </div> : null
        }
      </div>
    </div>
  );
};

const GalleryItems = ({galleryItems, activeItemIndex, setActiveItemIndex, controlType}) => {
  return (
    <Swiper
      className={`gallery__items gallery__items--${controlType.toLowerCase()}`}
      keyboard
      slidesPerView={1}
      lazy={{
        enabled: true,
        loadPrevNext: true,
        loadOnTransitionStart: true
      }}
      onSlideChange={event => setActiveItemIndex(event.activeIndex)}
      onSwiper={swiper => GalleryItemsSwiper = swiper}
    >
      {
        galleryItems.map((item, index) =>
          <SwiperSlide key={`slide-${index}`}>
            <GalleryItem
              controlType={controlType}
              item={item}
              itemIndex={index}
              isActive={index === activeItemIndex}
            />
          </SwiperSlide>
        )
      }
    </Swiper>
  );
};

const GalleryCarousel = ({galleryItems, activeItemIndex, setActiveItemIndex}) => {
  return (
    <div className="gallery__carousel-container">
      <Swiper
        className="gallery__carousel"
        scrollbar={{ draggable: true }}
        navigation
        spaceBetween={5}
        keyboard
        mousewheel
        slidesPerView="auto"
        lazy={{
          enabled: true,
          loadPrevNext: true,
          loadOnTransitionStart: true
        }}
      >
        {
          galleryItems.map((item, index) =>
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
    </div>
  );
};

const Gallery = () => {
  const [galleryMetadata, setGalleryMetadata] = useState(undefined);
  const [galleryItems, setGalleryItems] = useState(undefined);
  const [backgroundImage, setBackgroundImage] = useState(undefined);
  const [controls, setControls] = useState("Carousel");
  const [error, setError] = useState(undefined);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  useEffect(() => {
    LoadGallery()
      .then(galleryInfo => {
        setControls(galleryInfo.controls);
        setBackgroundImage({desktop: galleryInfo.backgroundImage, mobile: galleryInfo.backgroundImageMobile});
        setGalleryMetadata(galleryInfo.galleryMetadata);
        setGalleryItems(galleryInfo.galleryItems);

        if(galleryInfo.customCSS) {
          document.querySelector("#_custom-css").textContent = galleryInfo.customCSS;
        }
      })
      .catch(error => setError(error));
  }, []);

  useEffect(() => {
    const itemName = galleryItems && galleryItems[activeItemIndex]?.name || "";
    const pageTitle = params.title || galleryMetadata?.name || "Eluvio";

    document.title = itemName && pageTitle ? `${itemName} | ${pageTitle}` : itemName || pageTitle;

    if(GalleryItemsSwiper && GalleryItemsSwiper.activeIndex !== activeItemIndex) {
      GalleryItemsSwiper.slideTo(activeItemIndex);
    }
  }, [activeItemIndex, galleryMetadata, galleryItems]);

  if(error) {
    return (
      <div className="gallery">
        <div className="gallery__error">
          { error.message || error }
        </div>
      </div>
    );
  }

  if(!galleryItems) {
    return <div className="gallery gallery--empty" />;
  }

  const galleryTitle = params.title || galleryMetadata?.name;
  return (
    <>
      <div className="app-background app-background-desktop" style={backgroundImage?.desktop ? { backgroundImage: `url(${backgroundImage.desktop}` } : undefined} />
      <div className="app-background app-background-mobile" style={backgroundImage?.mobile ? { backgroundImage: `url(${backgroundImage.mobile}` } : undefined} />
      <div className={`gallery ${galleryTitle ? "gallery--with-title" : ""} gallery--${controls.toLowerCase()}`}>
        { galleryTitle ? <h1 className="gallery__title">{galleryTitle}</h1> : null }
        <GalleryItems galleryItems={galleryItems} activeItemIndex={activeItemIndex} setActiveItemIndex={setActiveItemIndex} controlType={controls} />

        {
          controls === "Carousel" ?
            <GalleryCarousel
              galleryItems={galleryItems}
              activeItemIndex={activeItemIndex}
              setActiveItemIndex={setActiveItemIndex}
            /> :
            <div className="gallery__arrows">
              <button disabled={activeItemIndex === 0} onClick={() => setActiveItemIndex(activeItemIndex - 1)} className="gallery__arrow-button gallery__arrow-button--previous">
                <div className="gallery__arrow gallery__arrow--previous" />
              </button>
              <span className="gallery__page">
                <span>{ activeItemIndex + 1 }</span> / <span>{ galleryItems.length }</span>
              </span>
              <button disabled={!galleryItems || activeItemIndex >= (galleryItems.length - 1)} onClick={() => setActiveItemIndex(activeItemIndex + 1)} className="gallery__arrow-button gallery__arrow-button--next">
                <div className="gallery__arrow gallery__arrow--next" />
              </button>
            </div>
        }
      </div>
    </>
  );
};

document.getElementById("app").classList.add("app--gallery");

render(
  <Gallery />,
  document.getElementById("app")
);
