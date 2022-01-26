const Controls = (playerTarget) => {
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
};

export const InitializeEbook = async (metadata, playerTarget, params) => {
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

  Controls(playerTarget);

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
