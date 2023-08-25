import "./static/stylesheets/form.scss";

import React from "react";
import {render} from "react-dom";
import {mediaTypes} from "./Utils";

import Logo from "./static/images/Logo.png";

class Form extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showTitle: false,
      showShare: false,
      darkMode: false,
      title: "",
      description: "",
      network: "main",
      objectId: "",
      versionHash: "hq__CcdV4wnCNq9wv6jXpYeCQ2GE4FLQBFtVSSSt2XKfBJMrH89DFDGsfkpWWvBy16QBGGYeF5mLGo",
      offerings: undefined,
      mediaType: "v",
      authorizationToken: "",
      promptTicket: false,
      tenantId: "",
      ntpId: "",
      ticketCode: "",
      ticketSubject: "",
      linkPath: "",
      directLink: false,
      smallPlayer: false,
      autoplay: "Off",
      controls: "Auto Hide",
      loop: false,
      muted: false,
      width: 854,
      height: 480,
      capLevelToPlayerSize: false,
      embedCode: "",
      clipStart: "",
      clipEnd: ""
    };

    this.Generate = this.Generate.bind(this);
    this.Update = this.Update.bind(this);
  }

  async componentDidMount() {
    if(!("scrollBehavior" in document.documentElement.style)) {
      await import("scroll-behavior-polyfill");
    }
  }

  EmbedCode() {
    if(!this.state.embedCode) { return; }

    return (
      <div className="embed-code-container">
        <h2>Embed Code</h2>
        <pre className="embed-code">
          { this.state.embedCode }
        </pre>
        <h2>Embed URL</h2>
        <pre className="embed-code">
          { this.state.embedUrl }
        </pre>
        <div
          className="embed"
          ref={element => {
            if(!element) { return; }

            element.innerHTML = this.state.embedCode;

            window.scrollTo({
              top: element.parentElement.getBoundingClientRect().top + (window.pageYOffset || element.parentElement.scrollTop),
              behavior: "smooth"
            });
          }}
        />
      </div>
    );
  }

  Generate(event) {
    event.preventDefault();

    let frameHeight = parseInt(this.state.height);

    let params = {
      net: this.state.network,
      p: true
    };

    switch (this.state.controls) {
      case "Browser Default":
        params.ct = "d";
        break;
      case "Auto Hide":
        params.ct = "h";
        break;
      case "Show":
        params.ct = "s";
        break;
      case "Hide Except for Volume Toggle":
        params.ct = "hv";
        break;
    }

    if(this.state.muted) {
      params.m = true;
    }

    if(this.state.loop) {
      params.lp = true;
    }

    if(this.state.objectId) {
      params.oid = this.state.objectId;
    }

    if(this.state.versionHash) {
      params.vid = this.state.versionHash;
    }

    if(this.state.offerings) {
      params.off = this.state.offerings.split(",").map(off => off.trim()).join(",");
    }

    if(this.state.mediaType) {
      params.mt = this.state.mediaType;
    }

    if(this.state.linkPath) {
      params.ln = btoa(this.state.linkPath);
    }

    if(this.state.directLink) {
      params.dr = true;
    }

    if(this.state.tenantId) {
      params.ten = this.state.tenantId;
    }

    if(this.state.ntpId) {
      params.ntp = this.state.ntpId;
    }

    if(this.state.promptTicket) {
      params.ptk = true;
    }

    if(this.state.ticketCode) {
      params.tk = btoa(this.state.ticketCode);
    }

    if(this.state.ticketSubject) {
      params.sbj = btoa(this.state.ticketSubject);
    }

    if(this.state.authorizationToken) {
      params.ath = this.state.authorizationToken;
    }

    if(this.state.darkMode) {
      params.dk = true;
    }

    if(this.state.clipStart) {
      params.start = parseFloat(this.state.clipStart);
    }

    if(this.state.clipEnd) {
      params.end = parseFloat(this.state.clipEnd);
    }

    if(this.state.showShare) {
      params.sh = true;
      frameHeight += 50;
    }

    if(this.state.showTitle) {
      params.st = true;
      frameHeight += 50;
    }

    if(this.state.smallPlayer) {
      params.sm = true;

      params.w = parseInt(this.state.width);
      params.h = parseInt(this.state.height);
    }

    if(this.state.capLevelToPlayerSize) {
      params.cap = true;
    }

    if(this.state.autoplay === "When Visible") {
      params.scr = true;
    } else if(this.state.autoplay === "On") {
      params.ap = true;
    }

    let data = {};
    if(this.state.title) {
      data["og:title"] = this.state.title;
    }

    if(this.state.description) {
      data["og:description"] = this.state.description;
    }

    if(Object.keys(data).length > 0) {
      params.data = btoa(JSON.stringify({meta_tags: data}));
    }

    const width = parseInt(this.state.width);

    const paramsString = Object.keys(params).map(key => params[key] === true ? key : `${key}=${params[key]}`).join("&");

    this.setState({
      embedUrl: `${window.location.href}?${paramsString}`,
      embedCode: (
`<iframe 
  width=${width} height=${frameHeight} scrolling="no" marginheight="0" 
  marginwidth="0" frameborder="0" type="text/html" 
  src="${window.location.href}?${paramsString}"
  allowtransparency="true"
></iframe>`
      )
    });
  }

  Update(event) {
    this.setState({
      [event.target.name]: event.target.value,
      embedCode: ""
    });
  }

  Select(name, options) {
    return (
      <select name={name} value={this.state[name]} onChange={this.Update}>
        {options.map((o, i) =>
          Array.isArray(o) ?
            <option key={`option-${i}`} value={o[1]}>{ o[0] }</option> :
            <option key={`option-${i}`} value={o}>{ o }</option>
        )}
      </select>
    );
  }

  Checkbox(name, options={}) {
    return (
      <input
        name={name}
        value={this.state[name]}
        checked={this.state[name]}
        onChange={event => this.Update({target: { name: event.target.name, value: event.target.checked }})}
        type="checkbox"
        {...options}
      />
    );
  }

  Input(name, options={}) {
    return (
      <input
        name={name}
        value={this.state[name]}
        checked={this.state[name]}
        onChange={this.Update}
        {...options}
      />
    );
  }

  LabelledField(label, name, input) {
    return (
      <>
        <label htmlFor={name}>{ label }</label>
        { input }
      </>
    );
  }

  render() {
    return (
      <>
        <header>
          <img src={Logo} alt="Eluvio" className="logo"/>
        </header>
        <div className="form-container">
          <form onSubmit={this.Generate}>
            <div className="spacer" />
            <legend>Generate Embedded Video Code</legend>

            <div />
            <h2>Target</h2>
            { this.LabelledField("Network", "network", this.Select("network", ["main", "demo", "test"])) }
            { this.LabelledField("Object ID", "objectId", this.Input("objectId")) }
            { this.LabelledField("Version Hash", "versionHash", this.Input("versionHash")) }
            { this.LabelledField("Offerings", "offerings", this.Input("offerings")) }
            { this.LabelledField("Media Type", "mediaType", this.Select("mediaType", Object.keys(mediaTypes).map(v => [mediaTypes[v], v]))) }
            { this.LabelledField("Link Path", "linkPath", this.Input("linkPath")) }
            { this.LabelledField("Direct Link", "directLink", this.Checkbox("directLink")) }
            { this.LabelledField("Clip Start", "clipStart", this.Input("clipStart", {type: "number", step: 0.001})) }
            { this.LabelledField("Clip End", "clipEnd", this.Input("clipEnd", {type: "number", step: 0.001})) }

            <div />
            <h2>Authorization</h2>

            { this.LabelledField("Auth Token", "authorizationToken", this.Input("authorizationToken")) }
            { this.LabelledField("Tenant ID", "tenantId", this.Input("tenantId")) }
            { this.LabelledField("NTP ID", "ntpId", this.Input("ntpId")) }
            { this.LabelledField("Prompt for Ticket", "promptTicket", this.Checkbox("promptTicket")) }
            { this.LabelledField("Ticket Code", "ticketCode", this.Input("ticketCode")) }
            { this.LabelledField("Ticket Subject", "ticketSubject", this.Input("ticketSubject")) }

            <div />
            <h2>Player</h2>
            { this.LabelledField("Title", "title", this.Input("title")) }
            { this.LabelledField("Description", "description", this.Input("description")) }

            { this.LabelledField("Show Video Title", "showTitle", this.Checkbox("showTitle")) }
            { this.LabelledField("Show Share Buttons", "showShare", this.Checkbox("showShare")) }
            { this.LabelledField("Small Player", "smallPlayer", this.Checkbox("smallPlayer")) }
            { this.LabelledField("Dark Mode", "darkMode", this.Checkbox("darkMode")) }
            { this.LabelledField("Autoplay", "autoplay", this.Select("autoplay", ["Off", "When Visible", "On"])) }
            { this.LabelledField("Controls", "controls", this.Select("controls", ["Hide", "Hide Except for Volume Toggle", "Browser Default", "Auto Hide", "Show"])) }
            { this.LabelledField("Mute Audio", "muted", this.Checkbox("muted")) }
            { this.LabelledField("Loop", "loop", this.Checkbox("loop")) }

            { this.LabelledField("Cap Quality to Player Size", "capLevelToPlayerSize", this.Checkbox("capLevelToPlayerSize")) }
            { this.LabelledField("Width", "width", this.Input("width", {type: "number", step: 1, required: true})) }
            { this.LabelledField("Height", "height", this.Input("height", {type: "number", step: 1, required: true})) }

            <div className="spacer" />
            <button type="submit">Generate Embed Code</button>
          </form>

          { this.EmbedCode() }
        </div>
      </>
    );
  }
}

render(
  (
    <Form />
  ),
  document.getElementById("app")
);
