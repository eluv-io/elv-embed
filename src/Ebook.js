const Controls = (playerTarget, rendition) => {
  const leftArrow = document.createElement("button");
  const rightArrow = document.createElement("button");

  leftArrow.classList.add(...["arrow", "prev-button"]);
  rightArrow.classList.add(...["arrow", "next-button"]);

  leftArrow.innerHTML = "&#8249;";
  rightArrow.innerHTML = "&#8250;";

  leftArrow.title = "Previous page";
  rightArrow.title = "Next page";

  leftArrow.addEventListener("click", () => rendition.prev());
  rightArrow.addEventListener("click", () => rendition.next());

  playerTarget.appendChild(leftArrow);
  playerTarget.appendChild(rightArrow);
};

export const InitializeEbook = async (ebookUrl, playerTarget, params) => {
  const ePub = await import("epubjs");
  const book = await ePub.default(ebookUrl, {openAs: "epub"});

  const rendition = await book.renderTo(playerTarget, {
    height: params.height,
    width: playerTarget.getBoundingClientRect().width - 65,
    spread: "always",
    flow: "paginated"
  });

  playerTarget.classList.add("-elv-embed__ebook");

  Controls(playerTarget, rendition);

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
