// TODO: Add support for auth token

import "./static/stylesheets/form.scss";

import React from "react";
import {render} from "react-dom";

import Logo from "./static/images/Logo.png";

class Form extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      network: "main",
      objectId: "",
      versionHash: "hq__CcdV4wnCNq9wv6jXpYeCQ2GE4FLQBFtVSSSt2XKfBJMrH89DFDGsfkpWWvBy16QBGGYeF5mLGo",
      linkPath: "",
      autoplay: "Off",
      controls: true,
      muted: false,
      width: 854,
      height: 480,
      embedCode: ""
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

    let params = {
      net: this.state.network,
      p: true // p denotes app should be in play mode
    };

    if(this.state.controls) {
      params.ct = true;
    }

    if(this.state.muted) {
      params.m = true;
    }

    if(this.state.objectId) {
      params.oid = this.state.objectId;
    }

    if(this.state.versionHash) {
      params.vid = this.state.versionHash;
    }

    if(this.state.linkPath) {
      params.ln = btoa(this.state.linkPath);
    }

    if(this.state.autoplay === "When Visible") {
      params.scr = true;
    } else if(this.state.autoplay === "On") {
      params.ap = true;
    }

    const width = parseInt(this.state.width);
    const height = parseInt(this.state.height);

    const paramsString = Object.keys(params).map(key => params[key] === true ? key : `${key}=${params[key]}`).join("&");

    this.setState({
      embedCode: (
`<iframe 
  width=${width} height=${height} scrolling="no" marginheight="0" 
  marginwidth="0" frameborder="0" type="text/html" 
  src="${window.location.href}?${paramsString}"
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
        { options.map((o, i) => <option key={`option-${i}`} value={o}>{ o }</option>) }
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

            { this.LabelledField("Network", "network", this.Select("network", ["main", "demo", "test"])) }

            { this.LabelledField("Object ID", "objectId", this.Input("objectId")) }
            { this.LabelledField("Version Hash", "versionHash", this.Input("versionHash")) }
            { this.LabelledField("Link Path", "linkPath", this.Input("linkPath")) }

            { this.LabelledField("Autoplay", "autoplay", this.Select("autoplay", ["Off", "When Visible", "On"])) }
            { this.LabelledField("Show Controls", "controls", this.Checkbox("controls")) }
            { this.LabelledField("Mute Audio", "muted", this.Checkbox("muted")) }

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
