import "./static/stylesheets/video.scss";
import EluvioPlayer from "@eluvio/elv-player-js";
import {LoadParams} from "./Utils";


const robots = document.createElement("meta");
robots.setAttribute("name", "robots");
robots.setAttribute("content", "noindex");
document.head.appendChild(robots);

const Initialize = async () => {
  const app = document.getElementById("app");
  const target = document.createElement("div");
  target.classList.add("player-target");
  app.appendChild(target);

  const params = LoadParams();

  if(params.smallPlayer) {
    target.style.width = `${params.width}px`;
    target.style.height = `${params.height}px`;
  }

  window.player = new EluvioPlayer(target, params.playerParameters);
};

Initialize();
