import {LoadParams} from "./Utils";

export const Initialize = async ({client, target, url, playerOptions, errorCallback, setPageTitle=false}={}) => {
  const params = LoadParams(url);

  switch (params.mediaType) {
    case "Gallery":
      import("./Gallery")
        .then(({Initialize}) =>
          Initialize({client, target, url, playerOptions, errorCallback, setPageTitle})
        );

      break;

    default:
      import("./Embed.js")
        .then(({Initialize}) =>
          Initialize({client, target, url, playerOptions, errorCallback, setPageTitle})
        );
  }
};
