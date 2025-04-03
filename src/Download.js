import "./static/stylesheets/download.scss";

import React, {useEffect, useState} from "react";
import {render} from "react-dom";
import {LoadParams} from "./Utils";
import {ElvClient} from "@eluvio/elv-client-js";
import UrlJoin from "url-join";

export const Spinner = ({size=50, light, className=""}) => (
  <div style={{width: size, height: size}} className={`${className} spinner ${light ? "spinner--light" : ""}`}>
    <div className="spinner__inner" />
  </div>
);

const InitializeClient = async params => {
  const client = await ElvClient.FromNetworkName({
    networkName: params.network
  });

  if(params.shareId) {
    let info;
    try {
      info = await client.ShareInfo({shareId: params.shareId});
      client.SetStaticToken({
        token: await client.RedeemShareToken({shareId: params.shareId})
      });

      window.shareInfo = info;

      return { client, shareInfo: info };
    } catch(error) {
      if(info && info.revoked) {
        throw { displayMessage: "You no longer have permission to access this content" };
      } else if(info && info.end_time && new Date(info.end_time).getTime() < new Date().getTime()) {
        throw { displayMessage: "Access to this content has expired" };
      } else {
        throw { displayMessage: "This content is no longer available" };
      }
    }
  }
};

const DownloadJobStatus = async ({client, downloadJobId, versionHash}) => {
  return await client.MakeFileServiceRequest({
    versionHash,
    path: UrlJoin("call", "media", "files", downloadJobId)
  });
};

const Download = ({client, shareInfo}) => {
  const [status, setStatus] = useState(undefined);
  const [downloadUrl, setDownloadUrl] = useState(undefined);
  const downloadJobId = shareInfo.attributes?.downloadJobId?.[0];
  const versionHash = shareInfo.attributes?.versionHash?.[0];
  const filename = shareInfo.attributes?.filename?.[0];

  // Status check
  useEffect(() => {
    if(!downloadJobId || !versionHash) { return; }

    client.FabricUrl({
      versionHash,
      call: UrlJoin("media", "files", downloadJobId, "download"),
      service: "files",
      queryParams: {
        "header-x_set_content_disposition": `attachment; filename="${filename}"`
      }
    })
      .then(url => setDownloadUrl(url));

    let statusInterval;
    const CheckStatus = async () => {
      const status = await DownloadJobStatus({client, downloadJobId, versionHash});

      if(["completed", "failed"].includes(status?.status)) {
        clearInterval(statusInterval);
      }

      setStatus(status);
    };

    statusInterval = setInterval(CheckStatus, 5000);

    CheckStatus();

    return () => clearInterval(statusInterval);
  }, [shareInfo]);

  if(!status || !shareInfo) {
    return <Spinner size={30} />;
  }

  if(downloadUrl && status?.status === "completed") {
    // Ready to download
    return (
      <a
        href={downloadUrl}
        target="_blank"
        className="button"
      >
        Download
      </a>
    );
  } else if(status?.status === "failed") {
    return (
      <div className="note">
        This content is no longer available
      </div>
    );
  } else {
    return (
      <div>
        <div className="note">
          Preparing Download...
        </div>
        <progress
          value={50 || status?.progress || 0}
          max={100}
          className="progress"
        />
      </div>
    );
  }
};


const Content = ({params}) => {
  const [client, setClient] = useState(undefined);
  const [shareInfo, setShareInfo] = useState(undefined);
  const [errorMessage, setErrorMessage] = useState(undefined);

  useEffect(() => {
    InitializeClient(params)
      .then(({client, shareInfo}) => {
        setClient(client);
        setShareInfo(shareInfo);
      })
      .catch(error => setErrorMessage(error?.displayMessage || "This content is no longer available"));
  }, []);
  console.log(params);

  if(errorMessage) {
    return (
      <div className="page">
        <div className="error">
          { errorMessage }
        </div>
      </div>
    );
  }

  if(!client || !shareInfo) {
    return (
      <div className="page">
        <Spinner/>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="content">
        <div className="subtitle">
          A Content Fabric URL has been shared with you
        </div>
        <div className="title">
          { shareInfo.attributes?.title?.[0] || "" }
        </div>
        <div className="description">
          { shareInfo.attributes?.note?.[0] || ""}
        </div>
        <div className="actions">
          <Download client={client} shareInfo={shareInfo} />
        </div>
      </div>
    </div>
  );
};

export const Initialize = ({target}) => {
  if(!target) {
    target = document.getElementById("app");
  }

  const params = LoadParams({playerParams: false});

  render(
    <Content params={params} />,
    target
  );
};
