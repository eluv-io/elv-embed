import "swiper/swiper-bundle.min.css";
import "./static/stylesheets/gallery.scss";

import React, {useEffect, useState} from "react";
import {render} from "react-dom";
import {IsFullscreen, LoadParams, RecordView, ToggleFullscreen} from "./Utils";
import {ElvClient} from "@eluvio/elv-client-js";
import SwiperCore, {Lazy, Navigation, Keyboard} from "swiper";
import {Swiper, SwiperSlide} from "swiper/react";
import UrlJoin from "url-join";
import {EluvioPlayer, EluvioPlayerParameters} from "@eluvio/elv-player-js";
import SVG from "react-inlinesvg";

import LeftArrow from "./static/icons/left-arrow.svg";
import RightArrow from "./static/icons/right-arrow.svg";
import FullScreenIcon from "./static/icons/full screen.svg";
import MinimizeIcon from "./static/icons/minimize.svg";

SwiperCore.use([Lazy, Navigation, Keyboard]);

let networkName;
const LoadGallery = async ({params, client}) => {
  if(!client) {
    client = await ElvClient.FromConfigurationUrl({
      configUrl: params.network
    });
  }

  networkName = await client.NetworkInfo().name;

  let versionHash = params.versionHash || params.objectId;

  if(!versionHash || !(versionHash.startsWith("hq__") || versionHash.startsWith("iq__"))) {
    throw Error("Invalid version hash or object ID");
  }

  if(versionHash.startsWith("iq__")) {
    versionHash = await client.LatestVersionHash({objectId: versionHash});
  }

  let galleryMetadata, galleryItems, title, backgroundImage, backgroundImageMobile, customCSS;
  let controls = "Carousel";
  if(params.linkPath?.includes("additional_media")) {
    // Pull out global additional media custom CSS and gallery info
    try {
      const additionalMediaKey = params.linkPath.includes("additional_media_sections") ? "additional_media_sections" : "additional_media";
      let [additionalMediaPath, galleryPath] = params.linkPath.split(additionalMediaKey);

      const additionalMediaMetadata = await client.ContentObjectMetadata({
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

      galleryMetadata = client.utils.SafeTraverse(additionalMediaMetadata, UrlJoin(additionalMediaKey, galleryPath.split("/gallery")[0]).split("/"));
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

  if(params.viewRecordKey) {
    RecordView({
      client,
      authorizationToken: params.authorizationToken,
      viewRecordKey: params.viewRecordKey
    });
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

    switch (networkName) {
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

const GalleryItem = ({params, controlType, item, itemIndex, isActive, isFullscreen}) => {
  const [player, setPlayer] = useState(undefined);

  useEffect(() => {
    if(player) {
      player.Destroy();
      setPlayer(undefined);
    }
  }, [isActive]);

  const content = (
    <div className={`elv-gallery__item__content ${item.video ? "elv-gallery__item__content--video" : "elv-gallery__item__content--image"}`}>
      {
        item?.video ?
          <div
            key={`gallery-video-${itemIndex}-${isActive}`}
            className="elv-gallery__item__video"
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
                      controlsClassName: "swiper-no-swiping",
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
          <img
            alt={item.name}
            key={`gallery-item-${itemIndex}`}
            data-src={GalleryItemImageUrl({item})}
            className="swiper-lazy elv-gallery__item__image"
          />
      }
    </div>
  );

  if(isFullscreen) {
    return content;
  }

  return (
    <div className={`elv-gallery__item ${IsFullscreen() ? "elv-gallery__item--fullscreen" : ""} elv-gallery__item--${controlType.toLowerCase()} ${isActive ? "elv-gallery__item--active" : "elv-gallery__item--inactive"}`}>
      <div className="elv-gallery__item__info">
        {
          item?.name ?
            <div className="elv-gallery__item__name">
              {item.name}
            </div> : null
        }
      </div>
      { content }
      <div className="elv-gallery__item__info">
        {
          item?.description ?
            <div className="elv-gallery__item__description">
              {item.description}
            </div> : null
        }
      </div>
    </div>
  );
};

const GalleryItems = ({params, galleryItems, activeItemIndex, setActiveItemIndex, setGalleryItemSwiper, controlType}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const SetFullscreen = () => setIsFullscreen(IsFullscreen());

    window.addEventListener("fullscreenchange", SetFullscreen);

    return () => window.removeEventListener("fullscreenchange", SetFullscreen);
  }, []);

  return (
    <Swiper
      className={`elv-gallery__items elv-gallery__items--${controlType.toLowerCase()}`}
      keyboard
      slidesPerView={1}
      lazy={{
        enabled: true,
        loadPrevNext: true,
        loadOnTransitionStart: true
      }}
      onSlideChange={event => setActiveItemIndex(event.activeIndex)}
      onSwiper={swiper => setGalleryItemSwiper(swiper)}
    >
      {
        galleryItems.map((item, index) =>
          <SwiperSlide key={`slide-${index}`}>
            <GalleryItem
              params={params}
              controlType={controlType}
              item={item}
              itemIndex={index}
              isActive={index === activeItemIndex}
              isFullscreen={isFullscreen}
            />
          </SwiperSlide>
        )
      }
      <button
        onClick={() => ToggleFullscreen(document.querySelector(".elv-gallery__items"))}
        className={`elv-gallery__item__fullscreen-button ${IsFullscreen() ? "elv-gallery__item__fullscreen-button--fullscreen" : ""}`}
      >
        <SVG src={IsFullscreen() ? MinimizeIcon : FullScreenIcon}/>
      </button>
    </Swiper>
  );
};

const GalleryCarousel = ({galleryItems, activeItemIndex, setActiveItemIndex}) => {
  return (
    <div className="elv-gallery__carousel-container">
      <button className="elv-gallery__carousel__arrow elv-gallery__carousel__arrow--previous">
        <SVG src={LeftArrow} />
      </button>
      <Swiper
        className="elv-gallery__carousel"
        navigation={{
          nextEl: ".elv-gallery__carousel__arrow--next",
          prevEl: ".elv-gallery__carousel__arrow--previous"
        }}
        spaceBetween={5}
        slidesPerView="auto"
        slidesPerGroup={3}
        lazy={{
          enabled: true,
          loadPrevNext: true,
          loadOnTransitionStart: true
        }}
      >
        {
          galleryItems.map((item, index) =>
            <SwiperSlide key={`item-${index}`} className={`elv-gallery__carousel__item elv-gallery__carousel__item--${(item?.image_aspect_ratio || "square").toLowerCase()}`}>
              <button
                title={item.name || ""}
                onClick={() => {
                  setActiveItemIndex(index);
                  document.querySelector(".app").scrollTo(0, 0);
                }}
                className={`elv-gallery__carousel__item__button ${index === activeItemIndex ? "elv-gallery__carousel__item__button--active" : ""}`}
              >
                <img
                  alt={item.name}
                  src={GalleryItemImageUrl({item, width: 400})}
                  className={`elv-gallery__carousel__item__image ${index === activeItemIndex ? "elv-gallery__carousel__item__image--active" : ""}`}
                />
              </button>
            </SwiperSlide>
          )
        }
      </Swiper>
      <button className="elv-gallery__carousel__arrow elv-gallery__carousel__arrow--next">
        <SVG src={RightArrow} />
      </button>
    </div>
  );
};

const Gallery = ({client, params, errorCallback, setPageTitle}) => {
  const [galleryItemSwiper, setGalleryItemSwiper] = useState(undefined);
  const [galleryMetadata, setGalleryMetadata] = useState(undefined);
  const [galleryItems, setGalleryItems] = useState(undefined);
  const [backgroundImage, setBackgroundImage] = useState(undefined);
  const [controls, setControls] = useState("Carousel");
  const [error, setError] = useState(undefined);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [showGalleryCarousel, setShowGalleryCarousel] = useState(false);

  useEffect(() => {
    LoadGallery({client, params})
      .then(galleryInfo => {
        setControls(galleryInfo.controls);
        setBackgroundImage({desktop: galleryInfo.backgroundImage, mobile: galleryInfo.backgroundImageMobile});
        setGalleryMetadata(galleryInfo.galleryMetadata);
        setGalleryItems(galleryInfo.galleryItems);

        if(galleryInfo.customCSS) {
          document.querySelector("#_custom-css").textContent = galleryInfo.customCSS;
        }

        // Add a small delay before showing the carousel so the initially selected content gets a head start loading
        setTimeout(() => setShowGalleryCarousel(true), 100);
      })
      .catch(error => {
        setError(error);

        errorCallback && errorCallback(error);
      });
  }, []);

  useEffect(() => {
    if(setPageTitle) {
      const itemName = galleryItems && galleryItems[activeItemIndex]?.name || "";
      const pageTitle = params.title || galleryMetadata?.name || "Eluvio";

      document.title = itemName && pageTitle ? `${itemName} | ${pageTitle}` : itemName || pageTitle;
    }

    if(galleryItemSwiper && galleryItemSwiper.activeIndex !== activeItemIndex) {
      galleryItemSwiper.slideTo(activeItemIndex);
    }
  }, [activeItemIndex, galleryMetadata, galleryItems]);

  if(error) {
    return (
      <div className="gallery">
        <div className="elv-gallery__error">
          { error.message || error }
        </div>
      </div>
    );
  }

  if(!galleryItems) {
    return <div className="elv-gallery elv-gallery--empty" />;
  }

  const galleryTitle = params.hideTitle ? "" : (params.title || galleryMetadata?.name);
  return (
    <>
      <div className="elv-gallery__background elv-gallery__background-desktop" style={backgroundImage?.desktop ? { backgroundImage: `url(${backgroundImage.desktop}` } : undefined} />
      <div className="elv-gallery__background elv-gallery__background-mobile" style={backgroundImage?.mobile ? { backgroundImage: `url(${backgroundImage.mobile}` } : undefined} />
      <div className={`elv-gallery ${galleryTitle ? "elv-gallery--with-title" : ""} elv-gallery--${controls.toLowerCase()}`}>
        <h1 className="elv-gallery__title">{galleryTitle}</h1>
        <GalleryItems
          params={params}
          galleryItems={galleryItems}
          activeItemIndex={activeItemIndex}
          setActiveItemIndex={setActiveItemIndex}
          setGalleryItemSwiper={setGalleryItemSwiper}
          controlType={controls}
        />

        {
          showGalleryCarousel ?
            controls === "Carousel" ?
              <GalleryCarousel
                galleryItems={galleryItems}
                activeItemIndex={activeItemIndex}
                setActiveItemIndex={setActiveItemIndex}
              /> :
              <div className="elv-gallery__arrows">
                <button disabled={activeItemIndex === 0} onClick={() => setActiveItemIndex(activeItemIndex - 1)} className="elv-gallery__arrow-button elv-gallery__arrow-button--previous">
                  <div className="elv-gallery__arrow elv-gallery__arrow--previous" />
                </button>
                <span className="elv-gallery__page">
                  <span>{ activeItemIndex + 1 }</span> / <span>{ galleryItems.length }</span>
                </span>
                <button disabled={!galleryItems || activeItemIndex >= (galleryItems.length - 1)} onClick={() => setActiveItemIndex(activeItemIndex + 1)} className="elv-gallery__arrow-button elv-gallery__arrow-button--next">
                  <div className="elv-gallery__arrow elv-gallery__arrow--next" />
                </button>
              </div> : null
        }
      </div>
    </>
  );
};

export const Initialize = async ({client, target, url, errorCallback, setPageTitle=false}={}) => {
  if(!target) {
    target = document.getElementById("app");
  }

  const params = LoadParams(url);

  render(
    <Gallery client={client} params={params} errorCallback={errorCallback} setPageTitle={setPageTitle} />,
    target
  );
};

