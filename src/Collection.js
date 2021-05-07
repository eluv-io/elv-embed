import "./static/stylesheets/collection.scss";

import React, {useState} from "react";
import {render} from "react-dom";
import UrlJoin from "url-join";
import { ElvClient } from "@eluvio/elv-client-js";
import EluvioPlayer from "@eluvio/elv-player-js";
import {LoadParams} from "./Utils";

const PageLoader = () => {
  return (
    <div className="loader page-loader">
      <div className="circle-loader">
        <div className="lds-default">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
};

const RedeemLoader = () => {
  return (
    <div className="loader redeem-loader">
      <div className="la-ball-clip-rotate la-sm">
        <div />
      </div>
    </div>
  );
};

const Item = ({client, item, playerParameters, className}) => {
  const [player, setPlayer] = useState(undefined);

  const parameters = { ...playerParameters };
  parameters.clientOptions = { client };
  parameters.playerOptions.preload = false;
  parameters.playerOptions.restartCallback = () => true;
  parameters.sourceOptions = {
    playoutParameters: {
      versionHash: item.versionHash
    }
  };

  return (
    <div className={className}>
      <h2 className={`${className}__header`}>{ item.display_title || item.title }</h2>
      <div
        className={`${className}__player-target`}
        ref={element => {
          if(!element || player) { return; }

          setPlayer(
            new EluvioPlayer(
              element,
              parameters
            )
          );
        }}
      />
    </div>
  );
};

class Collection extends React.Component {
  constructor(props) {
    super(props);

    const params = LoadParams();

    this.state = {
      client: undefined,
      params,
      metadata: {},
      imageUrls: {
        logo: undefined,
        hero: undefined,
        hero_mobile: undefined
      },
      mobile: window.innerWidth < 900 && window.innerHeight > window.innerWidth,
      items: [],

      code: "",
      redeemError: "",
      codeRedeemed: !params.promptTicket,
      redeeming: false
    };

    this.HandleResize = this.HandleResize.bind(this);
  }

  componentDidMount() {
    this.Initialize();
    window.addEventListener("resize", this.HandleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.HandleResize);
  }

  HandleResize() {
    const mobile = window.innerWidth < 900 && window.innerHeight > window.innerWidth;
    if(mobile !== this.state.mobile) {
      this.setState({mobile});
    }
  }

  async Initialize() {
    const client = await ElvClient.FromConfigurationUrl({
      configUrl: this.state.params.network
    });

    client.SetStaticToken({
      token: this.state.params.authorizationToken || client.utils.B64(JSON.stringify({qspace_id: await client.ContentSpaceId()}))
    });

    const basePath = this.state.params.linkPath || "public/asset_metadata";

    const versionHash = this.state.params.versionHash || await client.LatestVersionHash({objectId: this.state.params.objectId});
    const metadata = await client.ContentObjectMetadata({
      versionHash,
      metadataSubtree: basePath
    });

    let imageUrls = {};
    await Promise.all(
      ["logo", "hero_image", "hero_image_mobile"].map(async imageKey => {
        if(!metadata.info.images[imageKey]) {
          return;
        }

        imageUrls[imageKey] = await client.LinkUrl({
          versionHash,
          linkPath: UrlJoin(basePath, "info", "images", imageKey)
        });
      })
    );

    this.setState({
      client,
      versionHash,
      metadata,
      imageUrls
    });

  }

  async LoadItems() {
    const itemMetadata = await this.state.client.ContentObjectMetadata({
      versionHash: this.state.versionHash,
      metadataSubtree: UrlJoin(this.state.params.linkPath || "public/asset_metadata", "items"),
      resolveLinks: true,
      resolveIncludeSource: true
    });

    this.setState({
      items: (itemMetadata.map(item => {
        if(!item || !item["."] || !item["."].source) { return; }

        return {
          versionHash: item["."].source,
          display_title: item.display_title,
          title: item.title
        };
      })).filter(item => item)
    });
  }

  async RedeemCode(event) {
    event.preventDefault();

    try {
      this.setState({redeeming: true, redeemError: ""});

      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.state.client.RedeemCode({
        tenantId: this.state.params.tenantId,
        ntpId: this.state.params.ntpId,
        email: this.state.params.ticketSubject,
        code: this.state.code
      });

      await this.LoadItems();

      this.setState({
        codeRedeemed: true,
        redeeming: false
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to redeem code:");
      // eslint-disable-next-line no-console
      console.error(error);
      this.setState({redeeming: false, redeemError: "Invalid Code"});
    }
  }

  Hero() {
    const key = this.state.mobile && this.state.imageUrls.hero_image_mobile ? "hero_image_mobile" : "hero_image";

    if(!this.state.imageUrls[key]) {
      return;
    }

    return <img className="collection__hero-image" src={this.state.imageUrls[key]} alt="Hero Image"/>;
  }

  RedeemForm() {
    return (
      <div className="collection__redeem">
        <form className="collection__redeem__form" onSubmit={event => this.RedeemCode(event)}>
          <div className="collection__redeem__form__text">
            Enter your code
          </div>
          <div className="collection__redeem__form__error-text">
            {this.state.redeemError || ""}
          </div>
          <input
            className="collection__redeem__form__input"
            ref={element => element && element.focus()}
            value={this.state.code}
            onChange={event => this.setState({code: event.target.value})}
          />
          <button type="submit" disabled={this.state.redeeming} className="collection__redeem__form__submit">
            {this.state.redeeming ? <RedeemLoader/> : "Submit"}
          </button>
        </form>
      </div>
    );
  }

  Content() {
    return (
      <div className="collection__content">
        <h1 className="collection__content__header">{ this.state.metadata.info.header }</h1>
        <div className="collection__content__description">{ this.state.metadata.info.description }</div>
        <div className="collection__content__items">
          {this.state.items.map((item, index) =>
            <Item
              key={`item-${index}`}
              className="collection__content__item"
              client={this.state.client}
              item={item}
              playerParameters={this.state.params.playerParameters} />
          )}
        </div>
      </div>
    );
  }

  render() {
    if(!this.state.client) {
      return <PageLoader/>;
    }
    return (
      <div className="collection">
        { this.state.imageUrls.logo ?
          <img className="collection__logo" src={this.state.imageUrls.logo} alt="Logo"/> : null }
        { this.Hero() }

        { this.state.codeRedeemed ? this.Content() : this.RedeemForm() }
      </div>
    );
  }
}


render(
  (
    <Collection />
  ),
  document.getElementById("app")
);

