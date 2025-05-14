import "./static/stylesheets/media-profile.scss";

import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";

const testProfiles = [
  { label: "1080p60", width: 1920, height: 1080, framerate: 60, bitrate: 10000000 },
  { label: "1080p50", width: 1920, height: 1080, framerate: 50, bitrate: 8000000 },
  { label: "1080p30", width: 1920, height: 1080, framerate: 30, bitrate: 5000000 },
  { label: "720p60", width: 1280, height: 720, framerate: 60, bitrate: 6000000 },
  { label: "720p50", width: 1280, height: 720, framerate: 50, bitrate: 5000000 },
  { label: "720p30", width: 1280, height: 720, framerate: 30, bitrate: 3000000 },
  { label: "540p60", width: 960, height: 540, framerate: 60, bitrate: 4000000 },
  { label: "540p50", width: 960, height: 540, framerate: 50, bitrate: 3000000 },
  { label: "540p30", width: 960, height: 540, framerate: 30, bitrate: 2000000 },
];

const GetCapabilities = async () => {
  return await Promise.all(
    testProfiles.map(async profile => {
      const config = {
        type: "file",
        video: {
          contentType: "video/mp4; codecs=\"avc1.640028\"", // H.264 High Profile Level 4.x
          width: profile.width,
          height: profile.height,
          bitrate: profile.bitrate,
          framerate: profile.framerate
        }
      };

      return {
        profile,
        result: await navigator.mediaCapabilities.decodingInfo(config)
      };
    })
  );
};

const MediaCapabilities = () => {
  const [results, setResults] = useState([]);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    if(!("mediaCapabilities" in navigator)) {
      const video = document.createElement("video");
      setCanPlay(video.canPlayType("video/mp4; codecs=\"avc1.640028\""));
      return;
    }

    GetCapabilities()
      .then(capabilities => setResults(capabilities));
  }, []);


  if(!("mediaCapabilities" in navigator)) {
    return (
      <div>
        <h1>Media Capabilities Profile</h1>
        <div className="fallback">
          <div>
            MediaCapabilities API not supported.
          </div>
          <div>
            Fallback canPlayType result: <b>{canPlay}</b>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Media Capabilities Profile</h1>
      <div className="results-table">
        <div className="row row--header">
          <div>Profile</div>
          <div>Supported</div>
          <div>Smooth</div>
          <div>Power Efficient</div>
        </div>
        {
          results.map(({profile, result}) =>
            <div className="row" key={profile.label}>
              <div>{profile.label}</div>
              <div className={`result result--${!!result.supported}`}>{result.supported ? "✓" : "✗"}</div>
              <div className={`result result--${!!result.smooth}`}>{result.smooth ? "✓" : "✗"}</div>
              <div className={`result result--${!!result.powerEfficient}`}>{result.powerEfficient ? "✓" : "✗"}</div>
            </div>
          )
        }
      </div>
    </div>
  );
};


createRoot(document.getElementById("app"))
  .render(<MediaCapabilities />);
